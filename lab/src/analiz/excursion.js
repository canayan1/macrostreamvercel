// Inside each trade: the worst (MAE) and best (MFE) moment between entry and exit (Sweeney), the edge ratio
// (Faith) and what fixed stops or targets in R would have done to the same trades. Needs bars from the MT5
// price file (hold.js parsePriceFile): ECB's one price a day says nothing about the inside of a trade.
//
// excursions(trades, prices) → [{ trade, status, mae, mfe, maeR, mfeR, giveBack, risk }]
//   money in the account currency, before swaps; R from risk.js (stop, else average loss per lot).
// eRatio(rows) → mean MFE / mean |MAE| over trades with prices
// exitSimulation(trades, prices, { kind: 'stop' | 'target', k }) → { net, changed, winRate, k, kind }
//   A stop at k R exits at -k R (plus the trade's commission) if the adverse side reaches it first; a target
//   at k R exits at +k R if the favourable side reaches it first. Within a bar, the adverse side counts first.

import { derivedValuePerUnit } from './hold.js';
import { riskOf } from './risk.js';

function barsInside(s, t, tfSec) {
  // Bars are stamped at their open; the bar holding the entry starts up to one bar before it.
  return s.bars.filter(b => b[0] + tfSec > t.acilisZamani && b[0] < t.kapanisZamani);
}

function prep(trades, prices) {
  const risks = riskOf(trades), vpu = new Map(), tfSec = (prices.timeframeMinutes || 5) * 60;
  return trades.map((t, i) => {
    const s = prices.symbols?.[t.sembol];
    if (!s || !s.bars.length || prices.source !== 'mt5') return { t, status: prices.source === 'ecb' ? 'needs-mt5' : 'no-prices' };
    if (!vpu.has(t.sembol)) vpu.set(t.sembol, s.valuePerUnit > 0 ? s.valuePerUnit : derivedValuePerUnit(trades, t.sembol));
    const v = vpu.get(t.sembol);
    const inside = barsInside(s, t, tfSec);
    if (!(v > 0) || !inside.length) return { t, status: 'no-prices' };
    return { t, status: 'ok', v, inside, dir: t.yon === 'al' ? 1 : -1, risk: risks[i].risk };
  });
}

export function excursions(trades, prices) {
  return prep(trades, prices).map(p => {
    if (p.status !== 'ok') return { trade: p.t, status: p.status };
    const { t, v, inside, dir, risk } = p;
    const move = price => (price - t.acilisFiyati) * dir * v * t.lot;
    let mae = 0, mfe = 0;
    for (const b of inside) { mae = Math.min(mae, move(dir > 0 ? b[3] : b[2])); mfe = Math.max(mfe, move(dir > 0 ? b[2] : b[3])); }
    // The exit price itself is inside the trade: the realized move bounds the excursions.
    const realized = move(t.kapanisFiyati);
    mae = Math.min(mae, realized, 0); mfe = Math.max(mfe, realized, 0);
    return { trade: t, status: 'ok', mae, mfe, maeR: risk > 0 ? mae / risk : null, mfeR: risk > 0 ? mfe / risk : null, giveBack: t.net > 0 ? mfe - realized : null, risk };
  });
}

export function eRatio(rows) {
  const ok = rows.filter(r => r.status === 'ok');
  if (!ok.length) return null;
  const mf = ok.reduce((s, r) => s + r.mfe, 0) / ok.length, ma = ok.reduce((s, r) => s + -r.mae, 0) / ok.length;
  return ma > 0 ? mf / ma : null;
}

export function exitSimulation(trades, prices, { kind = 'stop', k = 1 } = {}) {
  let net = 0, changed = 0, wins = 0;
  for (const p of prep(trades, prices)) {
    if (p.status !== 'ok' || !(p.risk > 0)) { net += p.t.net; if (p.t.net > 0) wins++; continue; }
    const { t, v, inside, dir, risk } = p;
    const distance = (k * risk) / (v * t.lot);     // price distance of k R
    let out = null;
    for (const b of inside) {
      const adverse = (dir > 0 ? t.acilisFiyati - b[3] : b[2] - t.acilisFiyati);
      const favourable = (dir > 0 ? b[2] - t.acilisFiyati : t.acilisFiyati - b[3]);
      if (kind === 'stop' && adverse >= distance) { out = -k * risk; break; }
      if (kind === 'target' && favourable >= distance) { out = k * risk; break; }
    }
    const result = out === null ? t.net : out + (Number(t.komisyon) || 0);
    if (out !== null && Math.abs(result - t.net) > 1e-9) changed++;
    net += result; if (result > 0) wins++;
  }
  return { kind, k, net, changed, winRate: trades.length ? wins / trades.length : null };
}
