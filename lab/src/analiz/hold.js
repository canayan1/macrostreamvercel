// "What if you had held": every closed trade followed past its exit, as if it had never been closed.
// Pure module, no network. Prices come from the trader's own MT5 (KalibreHistoryExport price file) or
// from ECB daily reference rates (FX pairs only, no swaps, no margin). All amounts in the account currency.
//
// parsePriceFile(text) → prices                    MT5 file: bars, lot value, margin, swaps, stop-out
// ecbRequest(trades, now?) → { url, currencies } | null      what to ask the ECB Data API for
// ecbPrices(csvText, trades) → prices               daily bars built from the ECB CSV
// holdAnalysis(trades, prices, opts) → { trades: [...], summary, account }
//   trades: Trade Analytics trades (sembol, yon 'al'|'sat', lot, acilisZamani, kapanisZamani,
//           acilisFiyati, kapanisFiyati, brut, komisyon, net); times are server time in seconds.
//   opts:   { balance, capital, daily, max }  balance the account held while the trades were open (deposits),
//           capital and daily/max % for the prop floors (both optional).
//
// It describes the past; it is not a recommendation.

const DAY = 86400;

export function pairOf(symbol) {
  const m = /^([A-Z]{3})([A-Z]{3})/.exec(String(symbol ?? '').toUpperCase().replace(/[^A-Z]/g, ''));
  return m ? { base: m[1], quote: m[2] } : null;
}

export function parsePriceFile(text) {
  let d;
  try { d = JSON.parse(String(text).replace(/^﻿/, '')); } catch { throw new Error('format'); }
  if (!d || d.kalibre !== 'prices' || typeof d.symbols !== 'object') throw new Error('format');
  const symbols = {};
  for (const [sym, v] of Object.entries(d.symbols)) {
    const bars = (Array.isArray(v.bars) ? v.bars : []).filter(b => Array.isArray(b) && b.length >= 5 && b.every(Number.isFinite)).sort((a, b) => a[0] - b[0]);
    symbols[sym] = {
      bars, point: Number(v.point) || 0, valuePerUnit: Number(v.value_per_unit) || 0, marginPerLot: Number(v.margin_per_lot) || 0,
      swapMode: Number(v.swap_mode) || 0, swapLong: Number(v.swap_long) || 0, swapShort: Number(v.swap_short) || 0, swap3day: Number.isFinite(Number(v.swap_3day)) ? Number(v.swap_3day) : 3,
    };
  }
  const a = d.account ?? {};
  return { source: 'mt5', timeframeMinutes: Number(d.timeframe_minutes) || null, generated: String(d.generated ?? ''),
    account: { currency: String(a.currency ?? ''), leverage: Number(a.leverage) || null, stopOut: Number(a.stop_out) || null, stopOutMode: a.stop_out_mode === 'money' ? 'money' : 'percent' }, symbols };
}

// ECB publishes X per EUR once a day (about 16:00 CET). base/quote = rate(quote) / rate(base), EUR = 1.
export function ecbRequest(trades, now = Date.now() / 1000) {
  const cur = new Set();
  for (const t of trades) { const p = pairOf(t.sembol); if (p) { cur.add(p.base); cur.add(p.quote); } }
  cur.delete('EUR');
  if (!trades.length || (!cur.size && !trades.some(t => pairOf(t.sembol)))) return null;
  const from = new Date((Math.min(...trades.map(t => t.acilisZamani)) - 7 * DAY) * 1000).toISOString().slice(0, 10);
  const to = new Date(now * 1000).toISOString().slice(0, 10);
  const list = [...cur].sort();
  const key = list.length ? list.join('+') : 'USD';
  return { url: `https://data-api.ecb.europa.eu/service/data/EXR/D.${key}.EUR.SP00.A?startPeriod=${from}&endPeriod=${to}&format=csvdata`, currencies: list };
}

function csvRows(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').filter(Boolean);
  const head = lines.shift()?.split(',') ?? [];
  const ci = head.indexOf('CURRENCY'), ti = head.indexOf('TIME_PERIOD'), vi = head.indexOf('OBS_VALUE');
  if (ci < 0 || ti < 0 || vi < 0) throw new Error('format');
  return lines.map(l => l.split(',')).map(c => ({ cur: c[ci], day: c[ti], v: Number(c[vi]) })).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.day) && r.v > 0);
}

export function ecbPrices(csvText, trades) {
  const byDay = new Map();
  for (const r of csvRows(csvText)) { if (!byDay.has(r.day)) byDay.set(r.day, { EUR: 1 }); byDay.get(r.day)[r.cur] = r.v; }
  const days = [...byDay.keys()].sort();
  const symbols = {};
  for (const sym of new Set(trades.map(t => t.sembol))) {
    const p = pairOf(sym);
    if (!p) continue;
    const bars = [];
    for (const day of days) {
      const x = byDay.get(day);
      if (!(x[p.base] > 0) || !(x[p.quote] > 0)) continue;
      const c = x[p.quote] / x[p.base];
      // The fixing is one price a day: stamped at the end of that day, so a trade opened that day is not
      // valued at a price it may not have reached yet.
      bars.push([Date.parse(day + 'T23:59:00Z') / 1000, c, c, c, c]);
    }
    if (bars.length) symbols[sym] = { bars, point: 0, valuePerUnit: 0, marginPerLot: 0, swapMode: 0, swapLong: 0, swapShort: 0, swap3day: 3 };
  }
  return { source: 'ecb', timeframeMinutes: 1440, generated: days[days.length - 1] ?? '', account: { currency: '', leverage: null, stopOut: null, stopOutMode: 'percent' }, symbols };
}

// Value of a 1.0 price move on 1 lot, from the trades themselves: gross result / (move x lots).
export function derivedValuePerUnit(trades, symbol) {
  const v = trades.filter(t => t.sembol === symbol && t.lot > 0 && Number.isFinite(t.brut) && t.brut !== 0 && Math.abs(t.kapanisFiyati - t.acilisFiyati) > 0)
    .map(t => t.brut / ((t.kapanisFiyati - t.acilisFiyati) * (t.yon === 'al' ? 1 : -1) * t.lot))
    .filter(x => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  return v.length ? v[v.length >> 1] : 0;
}

// Swap nights between two server times: each weekday rollover once, the triple day three times.
export function swapNights(from, to, tripleDay = 3) {
  let n = 0;
  for (let mid = Math.floor(from / DAY) * DAY + DAY; mid <= to; mid += DAY) {
    const wd = new Date((mid - 1) * 1000).getUTCDay();   // the day that just ended
    if (wd === 0 || wd === 6) continue;
    n += wd === tripleDay ? 3 : 1;
  }
  return n;
}

const barIndexAtOrBefore = (bars, t) => { let lo = 0, hi = bars.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (bars[m][0] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; };

export function holdAnalysis(trades, prices, opts = {}) {
  const rows = [], usable = [];
  const value = new Map();
  for (const t of trades) {
    const s = prices.symbols[t.sembol];
    if (!s || !s.bars.length) { rows.push({ trade: t, status: 'no-prices' }); continue; }
    if (!value.has(t.sembol)) value.set(t.sembol, s.valuePerUnit > 0 ? s.valuePerUnit : derivedValuePerUnit(trades, t.sembol));
    const vpu = value.get(t.sembol);
    if (!(vpu > 0)) { rows.push({ trade: t, status: 'no-value' }); continue; }
    const dir = t.yon === 'al' ? 1 : -1;
    const swapPerNight = s.swapMode === 1 && s.point > 0 ? (dir > 0 ? s.swapLong : s.swapShort) * s.point * vpu * t.lot : 0;
    const costs = Number(t.komisyon) || 0;
    const result = (price, at) => (price - t.acilisFiyati) * dir * vpu * t.lot + costs + swapPerNight * swapNights(t.acilisZamani, at, s.swap3day);
    const after = s.bars.filter(b => b[0] >= t.kapanisZamani);
    if (!after.length) { rows.push({ trade: t, status: 'no-later-prices' }); continue; }
    let best = -Infinity, worst = Infinity, backAt = null;
    for (const b of after) {
      const fav = result(dir > 0 ? b[2] : b[3], b[0]), adv = result(dir > 0 ? b[3] : b[2], b[0]);
      if (fav > best) best = fav;
      if (adv < worst) worst = adv;
      if (t.net < 0 && backAt === null && fav >= 0) backAt = b[0];
    }
    const last = after[after.length - 1];
    const held = result(last[4], last[0]);
    const row = { trade: t, status: 'ok', actual: t.net, held, best, worst, backAt, heldAt: last[0], difference: held - t.net, vpu, swapPerNight, margin: s.marginPerLot * t.lot };
    rows.push(row); usable.push(row);
  }

  const losers = usable.filter(r => r.actual < 0), winners = usable.filter(r => r.actual > 0);
  const summary = {
    trades: usable.length, skipped: rows.length - usable.length,
    actual: usable.reduce((s, r) => s + r.actual, 0), held: usable.reduce((s, r) => s + r.held, 0),
    losers: losers.length, losersBack: losers.filter(r => r.backAt !== null).length, losersNeverBack: losers.filter(r => r.backAt === null).length,
    winners: winners.length, winnersMoreNow: winners.filter(r => r.held > r.actual).length, winnersLessNow: winners.filter(r => r.held <= r.actual).length,
  };

  // Account: every trade kept open from its own open time, all together, against the floors and stop-out.
  const account = { ruleHit: null, stopOut: null, end: null, checked: false };
  if (usable.length) {
    const times = [...new Set(usable.flatMap(r => prices.symbols[r.trade.sembol].bars.map(b => b[0])))].filter(x => x >= Math.min(...usable.map(r => r.trade.acilisZamani))).sort((a, b) => a - b);
    const balance = Number(opts.balance) || 0, cap = Number(opts.capital) || 0;
    const floor = cap > 0 ? Math.max(opts.daily > 0 ? balance - cap * opts.daily / 100 : -Infinity, opts.max > 0 ? cap - cap * opts.max / 100 : -Infinity) : -Infinity;
    const so = prices.account?.stopOut, soMode = prices.account?.stopOutMode;
    for (const at of times) {
      let pnl = 0, mark = 0, margin = 0, open = 0;
      for (const r of usable) {
        if (r.trade.acilisZamani > at) continue;
        const s = prices.symbols[r.trade.sembol], i = barIndexAtOrBefore(s.bars, at);
        if (i < 0) continue;
        const b = s.bars[i], dir = r.trade.yon === 'al' ? 1 : -1;
        const px = dir > 0 ? b[3] : b[2];   // the side that hurts, within the bar
        const carry = (Number(r.trade.komisyon) || 0) + r.swapPerNight * swapNights(r.trade.acilisZamani, at, s.swap3day);
        pnl += (px - r.trade.acilisFiyati) * dir * r.vpu * r.trade.lot + carry;
        mark += (b[4] - r.trade.acilisFiyati) * dir * r.vpu * r.trade.lot + carry;
        margin += r.margin; open++;
      }
      if (!open) continue;
      const equity = balance + pnl;
      account.checked = true;
      if (!account.ruleHit && equity < floor) account.ruleHit = { at, equity, pnl, open, floor };
      if (!account.stopOut && so && margin > 0 && (soMode === 'money' ? equity <= so : equity / margin * 100 <= so)) account.stopOut = { at, equity, pnl, open, level: equity / margin * 100 };
      account.end = { at, equity: balance + mark, pnl: mark, open };
    }
    account.floor = floor;
  }
  return { trades: rows, summary, account, source: prices.source };
}
