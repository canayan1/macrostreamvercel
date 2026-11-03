// Risk and position size on your own trades (Tharp's R and SQN, fixed-fractional sizing as in Vince and Carver).
//
// riskOf(trades) → per trade { risk, source: 'stop' | 'avg-loss' }   money at risk when the trade was opened:
//   with a stop: |entry - stop| x value per unit x lots (value from the trades themselves, hold.js);
//   without:     the average loss per lot x lots (Tharp's fallback "1R = average loss"; flagged).
// edge(trades) → { n, meanR, sdR, sqn, ciLow, ciHigh, winRate, winLow, winHigh, stopShare, distinguishable }
// sizingReplay(trades, policy, opts) → { policy, net, maxDrawdown, maxDrawdownPct, worstDay, floorDay, path }
//   policies: { id: 'asTraded' } | { id: 'fixedLot' } | { id: 'fixedRisk', pct }
//   opts: { capital, daily, max } capital is the starting balance; daily/max % give the prop floors.
// Every replay decides the size at the trade's open, from the balance of trades closed before it.

import { derivedValuePerUnit } from './hold.js';

const DAY = 86400;
const dayOf = s => Math.floor(s / DAY);
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function riskOf(trades) {
  const losses = trades.filter(t => t.net < 0 && t.lot > 0);
  const lossPerLot = losses.length ? losses.reduce((s, t) => s + -t.net / t.lot, 0) / losses.length : 0;
  const vpu = new Map();
  return trades.map(t => {
    if (t.sl && t.acilisFiyati && t.lot > 0) {
      if (!vpu.has(t.sembol)) vpu.set(t.sembol, derivedValuePerUnit(trades, t.sembol));
      const v = vpu.get(t.sembol);
      const r = Math.abs(t.acilisFiyati - t.sl) * v * t.lot;
      if (v > 0 && r > 0) return { risk: r, source: 'stop' };
    }
    return { risk: lossPerLot * t.lot, source: 'avg-loss' };
  });
}

// Wilson interval for a proportion.
function wilson(k, n, z = 1.96) {
  if (!n) return [null, null];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), w = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - w) / d, (c + w) / d];
}

export function edge(trades) {
  const risks = riskOf(trades);
  const r = trades.map((t, i) => (risks[i].risk > 0 ? t.net / risks[i].risk : null)).filter(x => x !== null && Number.isFinite(x));
  const n = r.length;
  if (!n) return { n: 0 };
  const meanR = r.reduce((s, x) => s + x, 0) / n;
  const sdR = n > 1 ? Math.sqrt(r.reduce((s, x) => s + (x - meanR) ** 2, 0) / (n - 1)) : 0;
  const se = n > 1 ? sdR / Math.sqrt(n) : Infinity;
  const wins = trades.filter(t => t.net > 0).length;
  const [winLow, winHigh] = wilson(wins, trades.length);
  return {
    n, meanR, sdR,
    // Tharp caps N at 100 when comparing systems; the uncapped value grows with the sample alone.
    sqn: sdR > 0 ? (meanR / sdR) * Math.sqrt(Math.min(n, 100)) : null,
    ciLow: meanR - 1.96 * se, ciHigh: meanR + 1.96 * se,
    winRate: wins / trades.length, winLow, winHigh,
    stopShare: risks.filter(x => x.source === 'stop').length / trades.length,
    distinguishable: n >= 2 && (meanR - 1.96 * se > 0 || meanR + 1.96 * se < 0),
  };
}

export function sizingReplay(trades, policy, opts = {}) {
  const capital = Number(opts.capital) || 0;
  const risks = riskOf(trades);
  const lotMed = median(trades.map(t => t.lot));
  const items = trades.map((t, i) => ({ t, risk: risks[i].risk })).sort((a, b) => a.t.acilisZamani - b.t.acilisZamani);
  // Pending trades close later; the balance at an open counts only the trades closed by then.
  const pending = [], done = [];
  let balance = capital;
  const settle = until => { pending.sort((a, b) => a.close - b.close); while (pending.length && pending[0].close <= until) { const p = pending.shift(); balance += p.net; done.push(p); } };
  for (const { t, risk } of items) {
    settle(t.acilisZamani);
    let factor = 1;
    if (policy.id === 'fixedLot') factor = lotMed > 0 ? lotMed / t.lot : 1;
    if (policy.id === 'fixedRisk') factor = risk > 0 && balance > 0 ? (balance * policy.pct / 100) / risk : 0;
    factor = Math.max(0, Math.min(20, factor));
    pending.push({ close: t.kapanisZamani, net: t.net * factor, lot: t.lot * factor });
  }
  settle(Infinity);
  // Closed-balance path, drawdown, worst day and the first day under a prop floor.
  let bal = capital, peak = capital, dd = 0, ddPct = 0, floorDay = null, dayStart = capital, curDay = null;
  const days = new Map(), path = [];
  const fDaily = opts.daily > 0 ? capital * opts.daily / 100 : null, fMax = opts.max > 0 ? capital - capital * opts.max / 100 : -Infinity;
  for (const p of done.sort((a, b) => a.close - b.close)) {
    const d = dayOf(p.close);
    if (d !== curDay) { curDay = d; dayStart = bal; }
    bal += p.net; peak = Math.max(peak, bal); dd = Math.max(dd, peak - bal); if (peak > 0) ddPct = Math.max(ddPct, (peak - bal) / peak);
    days.set(d, (days.get(d) ?? 0) + p.net);
    const floor = Math.max(fDaily !== null ? dayStart - fDaily : -Infinity, fMax);
    if (floorDay === null && capital > 0 && bal < floor) floorDay = d * DAY;
    path.push({ t: p.close, balance: bal });
  }
  return { policy, net: bal - capital, maxDrawdown: dd, maxDrawdownPct: ddPct, worstDay: days.size ? Math.min(...days.values()) : 0, floorDay, path };
}

export const POLICIES = [
  { id: 'asTraded', ad: 'Senin yaptığın gibi' },
  { id: 'fixedLot', ad: 'Her işlemde aynı lot (medyanın)' },
  { id: 'fixedRisk', pct: 0.5, ad: 'İşlem başına sermayenin %{p} riski' },
  { id: 'fixedRisk', pct: 1, ad: 'İşlem başına sermayenin %{p} riski' },
  { id: 'fixedRisk', pct: 2, ad: 'İşlem başına sermayenin %{p} riski' },
];
