// Spread from the bars. MT5 keeps a spread (in points) with every bar; the History Export price file writes it
// as the 6th value of each bar. From it: the spread when each trade opened, the symbol's typical (median)
// spread, the trades opened when it was at least `wide` times the typical one, and the typical spread by
// server hour as a multiple of the median, so expensive hours stand out.
//
// spreadCosts(trades, prices, { wide = 2 }) → {
//   source: 'bars' | 'current' | null, total, perTrade: [{ trade, points, cost, ratio, wide }],
//   wideCount, wideCost, extraCost, byHour: [{ hour, ratio, bars }] }
//   cost is the spread paid once per trade (entry and exit at the quoted spread is one spread in total).
//   'current' falls back to the spread when the file was written (older files without bar spreads).

const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const atOrBefore = (bars, t) => { let lo = 0, hi = bars.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (bars[m][0] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; };

export function spreadCosts(trades, prices, { wide = 2 } = {}) {
  if (!prices || prices.source !== 'mt5') return { source: null, total: 0, perTrade: [], wideCount: 0, wideCost: 0, extraCost: 0, byHour: [] };
  // A bar spread of 0 is real (some servers quote zero most of the time); only a missing 6th value is unknown.
  const hasBarSpread = Object.values(prices.symbols).some(s => s.bars.some(b => b.length >= 6));
  const typical = new Map();
  for (const [sym, s] of Object.entries(prices.symbols)) {
    const v = s.bars.filter(b => b.length >= 6 && b[5] >= 0).map(b => b[5]);
    const m = median(v);
    // When the median is 0, the mean of all bars is the typical level to compare against.
    typical.set(sym, m > 0 ? m : (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0));
  }
  const perTrade = [];
  for (const t of trades) {
    const s = prices.symbols[t.sembol];
    if (!s || !(s.point > 0) || !(s.valuePerUnit > 0)) continue;
    let points = null;
    if (hasBarSpread) { const i = atOrBefore(s.bars, t.acilisZamani); if (i >= 0 && s.bars[i].length >= 6) points = s.bars[i][5]; }
    if (points === null && s.ask > 0 && s.bid > 0) points = Math.round((s.ask - s.bid) / s.point);
    if (points === null) continue;
    const med = typical.get(t.sembol) || 0, ratio = med > 0 ? points / med : null;
    perTrade.push({ trade: t, points, cost: -points * s.point * s.valuePerUnit * t.lot, typicalCost: med > 0 ? -med * s.point * s.valuePerUnit * t.lot : null, ratio, wide: ratio !== null && ratio >= wide });
  }
  const wideRows = perTrade.filter(r => r.wide);
  // By server hour: each bar's spread over its symbol's median, averaged across symbols and days.
  const sum = new Array(24).fill(0), n = new Array(24).fill(0);
  if (hasBarSpread) for (const [sym, s] of Object.entries(prices.symbols)) {
    const med = typical.get(sym);
    if (!(med > 0)) continue;
    for (const b of s.bars) if (b.length >= 6) { const h = new Date(b[0] * 1000).getUTCHours(); sum[h] += b[5] / med; n[h]++; }
  }
  return {
    source: hasBarSpread ? 'bars' : 'current',
    total: perTrade.reduce((x, r) => x + r.cost, 0),
    perTrade, wideCount: wideRows.length, wideCost: wideRows.reduce((x, r) => x + r.cost, 0),
    extraCost: wideRows.reduce((x, r) => x + (r.cost - (r.typicalCost ?? r.cost)), 0),
    byHour: sum.map((v, h) => ({ hour: h, ratio: n[h] ? v / n[h] : null, bars: n[h] })),
  };
}
