// Personal rules from your own trades. Each candidate rule is replayed over the closed trades in the order
// they were opened: a trade the rule would have blocked is removed, a trade it would have made smaller is
// scaled down. The result is what the rule would have changed on this history; it is in-sample (picked
// from the same trades), so the next weeks are the real test. Rule Guard enforces the chosen rules in MT5.
//
// RULES: the rule families and the variants tried (each variant is one parameter value).
// evaluateRule(trades, rule, value, opts) → { blocked, scaled, net, diff, maxDrawdown, worstDay, affected }
// suggestRules(trades, opts) → [{ rule, value, ...evaluation, tried }] best variant per family, strongest first
// adherence(trades, chosen, since, opts) → [{ rule, value, broken, cost }] trades after `since` that broke a rule
// ruleGuardSet(chosen, guard) → text of a Rule Guard .set file (UTF-16LE is applied by the caller)
//
// trades: Trade Analytics trades (net, lot, acilisZamani, kapanisZamani) in server time seconds.
// opts: { capital } for the daily loss limit (% of starting capital).

const DAY = 86400;
const dayOf = s => Math.floor(s / DAY);

export const RULES = [
  { id: 'stopAfterLosses', ad: 'Günde {v} kayıptan sonra dur', values: [1, 2, 3, 4], guard: 'InpStopAfterLosses' },
  { id: 'maxTradesDay', ad: 'Günde en çok {v} işlem', values: [2, 3, 4, 5, 6, 8, 10, 15], guard: 'InpMaxTradesDay' },
  { id: 'cooldown', ad: 'Kayıptan sonra {v} dakika bekle', values: [5, 15, 30, 60, 120], guard: 'InpCooldownMin' },
  { id: 'noUpsizeAfterLoss', ad: 'Kayıptan sonra lotu büyütme', values: [1], guard: 'InpNoUpsizeAfterLoss' },
  { id: 'dailyLossPct', ad: 'Günlük kayıp %{v} olunca dur', values: [0.5, 1, 1.5, 2, 3], guard: 'InpDailyLossPct' },
  { id: 'maxLotMedian', ad: 'Lot en çok medyanın {v} katı', values: [1.5, 2, 3], guard: 'InpMaxLot' },
];

const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

function curveStats(results) {
  // results: [{ t: close time, net }] in close order → max drawdown on closed P&L and worst day
  let cum = 0, peak = 0, dd = 0;
  const days = new Map();
  for (const r of [...results].sort((a, b) => a.t - b.t)) {
    cum += r.net; peak = Math.max(peak, cum); dd = Math.max(dd, peak - cum);
    days.set(dayOf(r.t), (days.get(dayOf(r.t)) ?? 0) + r.net);
  }
  return { maxDrawdown: dd, worstDay: days.size ? Math.min(...days.values()) : 0 };
}

export function evaluateRule(trades, rule, value, opts = {}) {
  const byOpen = [...trades].sort((a, b) => a.acilisZamani - b.acilisZamani);
  const lotMed = median(trades.map(t => t.lot));
  const capital = Number(opts.capital) || 0;
  const kept = [];                  // trades that happen, possibly scaled: { open, close, net, lot, t }
  // One pass: kept trades wait in `pending` (sorted by close) until their close is before the next open.
  const pending = [];
  const lossesByDay = new Map(), realizedByDay = new Map(), openedByDay = new Map();
  let lastClosed = null, blocked = 0, scaled = 0;
  const settle = until => {
    while (pending.length && pending[0].close <= until) {
      const k = pending.shift(), d = dayOf(k.close);
      if (k.net < 0) lossesByDay.set(d, (lossesByDay.get(d) ?? 0) + 1);
      realizedByDay.set(d, (realizedByDay.get(d) ?? 0) + k.net);
      if (!lastClosed || k.close >= lastClosed.close) lastClosed = k;
    }
  };
  for (const t of byOpen) {
    settle(t.acilisZamani);
    const day = dayOf(t.acilisZamani);
    let factor = 1;
    switch (rule) {
      case 'stopAfterLosses': if ((lossesByDay.get(day) ?? 0) >= value) factor = 0; break;
      case 'maxTradesDay': if ((openedByDay.get(day) ?? 0) >= value) factor = 0; break;
      case 'cooldown': if (lastClosed && lastClosed.net < 0 && t.acilisZamani - lastClosed.close < value * 60) factor = 0; break;
      // Same day only, as Rule Guard sees it (it reads today's history).
      case 'noUpsizeAfterLoss': if (lastClosed && lastClosed.net < 0 && dayOf(lastClosed.close) === day && t.lot > lastClosed.lot + 1e-9) factor = lastClosed.lot / t.lot; break;
      case 'dailyLossPct': if (capital > 0 && (realizedByDay.get(day) ?? 0) <= -capital * value / 100) factor = 0; break;
      case 'maxLotMedian': if (lotMed > 0 && t.lot > lotMed * value + 1e-9) factor = (lotMed * value) / t.lot; break;
      default: throw new Error('rule');
    }
    if (factor === 0) { blocked++; continue; }
    if (factor < 1) scaled++;
    const k = { open: t.acilisZamani, close: t.kapanisZamani, net: t.net * factor, lot: t.lot * factor, t: t.kapanisZamani };
    kept.push(k);
    openedByDay.set(day, (openedByDay.get(day) ?? 0) + 1);
    let i = pending.length; while (i > 0 && pending[i - 1].close > k.close) i--; pending.splice(i, 0, k);
  }
  const actual = trades.reduce((s, t) => s + t.net, 0);
  const net = kept.reduce((s, k) => s + k.net, 0);
  const base = curveStats(trades.map(t => ({ t: t.kapanisZamani, net: t.net })));
  const after = curveStats(kept);
  return { blocked, scaled, affected: blocked + scaled, net, actual, diff: net - actual, maxDrawdown: after.maxDrawdown, maxDrawdownBefore: base.maxDrawdown, worstDay: after.worstDay, worstDayBefore: base.worstDay };
}

// Best variant per family. A rule is only suggested when it touched at least `minAffected` trades and
// improved the result; ties go to the gentler variant (later in a family's list is stricter for count rules).
export function suggestRules(trades, opts = {}) {
  const minAffected = opts.minAffected ?? 2;
  const out = [];
  for (const r of RULES) {
    if (r.id === 'dailyLossPct' && !(opts.capital > 0)) continue;
    let best = null;
    for (const v of r.values) {
      const e = evaluateRule(trades, r.id, v, opts);
      if (e.affected < minAffected || e.diff <= 0) continue;
      if (!best || e.diff > best.diff + 1e-9) best = { rule: r.id, value: v, ...e };
    }
    if (best) out.push({ ...best, tried: r.values.length, holdout: holdoutCheck(trades, r, opts) });
  }
  return out.sort((a, b) => b.diff - a.diff);
}

// Out-of-sample check (the lesson of Bailey and López de Prado): pick the variant on the first two thirds
// of the trades by open time, then run that same variant on the last third, which it has not seen.
// null when the last third has fewer than `minTest` trades.
export function holdoutCheck(trades, rule, opts = {}) {
  const sorted = [...trades].sort((a, b) => a.acilisZamani - b.acilisZamani);
  const cut = Math.floor(sorted.length * 2 / 3), train = sorted.slice(0, cut), testSet = sorted.slice(cut);
  if (testSet.length < (opts.minTest ?? 5)) return null;
  let pick = null;
  for (const v of rule.values) {
    const e = evaluateRule(train, rule.id, v, opts);
    if (e.affected < 1 || e.diff <= 0) continue;
    if (!pick || e.diff > pick.diff + 1e-9) pick = { value: v, diff: e.diff };
  }
  if (!pick) return { value: null, diff: 0, affected: 0, trades: testSet.length, held: false };
  const e = evaluateRule(testSet, rule.id, pick.value, opts);
  return { value: pick.value, diff: e.diff, affected: e.affected, trades: testSet.length, held: e.diff > 0 };
}

// Rules the trader chose on `since`: which later trades broke them and what those trades made.
export function adherence(trades, chosen, since, opts = {}) {
  const later = trades.filter(t => t.acilisZamani >= since);
  return chosen.map(c => {
    const all = evaluateRule(later, c.rule, c.value, opts);
    // cost: what the trades that broke the rule cost (positive = money lost by breaking it).
    return { ...c, trades: later.length, broken: all.affected, cost: all.diff };
  });
}

// Rule Guard inputs for the chosen rules (see mql5/Experts/Kalibre/KalibreRuleGuard.mq5).
// preset: Rule Guard's ENUM_KALKAN number (1 FTMO 2-Step, 2 FTMO 1-Step, 3 FTMO Instant, 4 The5ers High Stakes, 5 custom).
export const GUARD_PRESET = { 'ftmo-2': 1, 'ftmo-1': 2, 'ftmo-aninda': 3, 'the5ers-hs': 4 };
export function ruleGuardSet(chosen, { preset = 1, capital = 0, margin = 0.5, medianLot = 0, customDaily = 5, customMax = 10 } = {}) {
  const v = Object.fromEntries(chosen.map(c => [c.rule, c.value]));
  const lines = [
    `InpRules=${preset}`, `InpCustomDaily=${customDaily}`, `InpCustomMax=${customMax}`, `InpStart=${capital > 0 ? capital : 0}`, `InpMargin=${margin}`, 'InpMode=0',
    `InpStopAfterLosses=${v.stopAfterLosses ?? 0}`, `InpMaxTradesDay=${v.maxTradesDay ?? 0}`, `InpCooldownMin=${v.cooldown ?? 0}`,
    `InpNoUpsizeAfterLoss=${v.noUpsizeAfterLoss ? 'true' : 'false'}`, `InpDailyLossPct=${v.dailyLossPct ?? 0}`,
    `InpMaxLot=${v.maxLotMedian && medianLot > 0 ? Math.round(medianLot * v.maxLotMedian * 100) / 100 : 0}`,
  ];
  return lines.join('\r\n') + '\r\n';
}
