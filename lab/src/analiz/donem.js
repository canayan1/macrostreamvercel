// Period filter for Trade Analytics. A period keeps the trades that CLOSED inside it; the balance the
// period starts from carries everything before it (deposits, withdrawals and earlier trades), so the
// curve, drawdown % and prop floors stay right for the shorter window.
//
// periodRange(key, trades, now?) → { from, to } in epoch seconds (to exclusive), or null for 'all'
//   keys: all | 7d | 30d | 90d | month | prev-month; relative ranges end at the last closed trade,
//   so an old report still has data in "Last 30 days".
// applyPeriod(account, range) → a new account object with the same shape, or the account itself.

const DAY = 86400;
const dayStart = s => Math.floor(s / DAY) * DAY;

export const PERIODS = [
  { id: 'all', ad: 'Tüm dönem' },
  { id: '7d', ad: 'Son 7 gün' },
  { id: '30d', ad: 'Son 30 gün' },
  { id: '90d', ad: 'Son 90 gün' },
  { id: 'month', ad: 'Bu ay' },
  { id: 'prev-month', ad: 'Geçen ay' },
  { id: 'custom', ad: 'Özel aralık' },
];

export function periodRange(key, trades, now = null) {
  if (!trades.length || key === 'all' || key === 'custom') return null;
  const last = trades.reduce((m, t) => Math.max(m, t.kapanisZamani), 0);
  const end = dayStart(now ?? last) + DAY;   // through the end of the anchor day
  const days = { '7d': 7, '30d': 30, '90d': 90 }[key];
  if (days) return { from: end - days * DAY, to: end };
  const d = new Date((now ?? last) * 1000);
  const y = d.getUTCFullYear(), m = d.getUTCMonth();
  if (key === 'month') return { from: Date.UTC(y, m, 1) / 1000, to: Date.UTC(y, m + 1, 1) / 1000 };
  if (key === 'prev-month') return { from: Date.UTC(y, m - 1, 1) / 1000, to: Date.UTC(y, m, 1) / 1000 };
  return null;
}

// "2026-10-01", "2026-10-31" (inclusive) → range in seconds; either side may be empty.
export function customRange(fromIso, toIso) {
  const p = s => (/^\d{4}-\d{2}-\d{2}$/.test(s ?? '') ? Date.parse(s + 'T00:00:00Z') / 1000 : null);
  const from = p(fromIso), toDay = p(toIso);
  if (from === null && toDay === null) return null;
  return { from: from ?? -Infinity, to: toDay === null ? Infinity : toDay + DAY };
}

export function applyPeriod(account, range) {
  if (!range) return account;
  const inside = t => t >= range.from && t < range.to;
  const before = t => t < range.from;
  const islemler = account.islemler.filter(t => inside(t.kapanisZamani));
  const moves = account.bakiyeHareketleri ?? [];
  const carried = moves.filter(h => before(h.zaman)).reduce((s, h) => s + h.tutar, 0)
    + account.islemler.filter(t => before(t.kapanisZamani)).reduce((s, t) => s + t.net, 0);
  let bakiyeHareketleri = moves.filter(h => inside(h.zaman));
  let baslangicBakiye = account.baslangicBakiye ?? null;
  if (moves.length) {
    // Balance on the first day of the period, as one opening movement.
    const opening = carried;
    if (Number.isFinite(range.from) && opening !== 0) bakiyeHareketleri = [{ zaman: range.from, tutar: opening, tur: 'donem-acilis' }, ...bakiyeHareketleri];
    else if (!Number.isFinite(range.from)) bakiyeHareketleri = moves.filter(h => h.zaman < range.to);
    baslangicBakiye = Number.isFinite(range.from) ? (opening || null) : account.baslangicBakiye;
  } else if (baslangicBakiye !== null) {
    baslangicBakiye += account.islemler.filter(t => before(t.kapanisZamani)).reduce((s, t) => s + t.net, 0);
  }
  return { ...account, islemler, bakiyeHareketleri, baslangicBakiye, donem: range };
}
