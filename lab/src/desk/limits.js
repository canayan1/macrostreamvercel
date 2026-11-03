// Desk limits: the head of desk sets the team's risk the way a mixing desk sets levels. Base limits apply
// to everyone; each trader has a risk fader (0-100 % of the base lot) and the desk has a master fader
// (0-100 %: defensive to normal). Rule Guard enforces the effective limits in each trader's MT5; the head
// never opens or closes a position. Plain functions, no DOM, no network.
//
// FIELDS                         the limits and their bounds
// emptyPolicy() → policy         { base: { ...FIELDS null/false }, risk: { personId: 0-100 }, master: 0-100 }
// checkPolicy(p) → [problems]    empty when usable
// cleanPolicy(p) → policy        bounded copy, unknown fields dropped
// effective(policy, personId) → { blocked, maxLot, dailyLossPct, maxTradesDay, stopAfterLosses, cooldownMin, noUpsizeAfterLoss, wideSpreadX, riskPct }
// changes(before, after) → [{ field, from, to }]
// describe(limits) / changeText(list) → short English lines for the trader and the log

export const FIELDS = [
  { id: 'maxLot', label: 'Max lot', unit: 'lots', min: 0.01, max: 1000, step: 0.01 },
  { id: 'dailyLossPct', label: 'Daily loss limit', unit: '%', min: 0.1, max: 50, step: 0.1 },
  { id: 'maxTradesDay', label: 'Max trades a day', unit: '', min: 1, max: 500, step: 1, int: true },
  { id: 'stopAfterLosses', label: 'Stop after losses', unit: '', min: 1, max: 50, step: 1, int: true },
  { id: 'cooldownMin', label: 'Pause after a loss', unit: 'min', min: 1, max: 600, step: 1, int: true },
  { id: 'noUpsizeAfterLoss', label: 'No bigger lot after a loss', bool: true },
  { id: 'wideSpreadX', label: 'Warn at a wide spread', unit: '×', min: 1.5, max: 20, step: 0.5 },
];
const BY_ID = Object.fromEntries(FIELDS.map(f => [f.id, f]));
const ID = /^[0-9a-f]{16}$/;

export const emptyPolicy = () => ({ base: Object.fromEntries(FIELDS.map(f => [f.id, f.bool ? false : null])), risk: {}, master: 100 });

const pct = v => Math.max(0, Math.min(100, Math.round(Number(v))));

export function checkPolicy(p) {
  const out = [];
  if (!p || typeof p !== 'object') return ['The limits are missing.'];
  for (const [k, v] of Object.entries(p.base ?? {})) {
    const f = BY_ID[k];
    if (!f) { out.push(`Unknown limit ${k}.`); continue; }
    if (f.bool) { if (typeof v !== 'boolean') out.push(`${f.label} is on or off.`); continue; }
    if (v === null) continue;
    if (!Number.isFinite(v) || v < f.min || v > f.max) out.push(`${f.label}: between ${f.min} and ${f.max}${f.unit ? ' ' + f.unit : ''}.`);
    else if (f.int && !Number.isInteger(v)) out.push(`${f.label}: a whole number.`);
  }
  for (const [id, v] of Object.entries(p.risk ?? {})) if (!ID.test(id) || !Number.isFinite(v) || v < 0 || v > 100) out.push('A risk fader is out of range.');
  if (!Number.isFinite(p.master) || p.master < 0 || p.master > 100) out.push('The master fader is out of range.');
  return out;
}

export function cleanPolicy(p) {
  const e = emptyPolicy();
  for (const f of FIELDS) {
    const v = p?.base?.[f.id];
    if (f.bool) e.base[f.id] = v === true;
    else if (Number.isFinite(v) && v >= f.min && v <= f.max) {
      const dec = (String(f.step).split('.')[1] ?? '').length;
      e.base[f.id] = f.int ? Math.round(v) : Number((Math.round(v / f.step) * f.step).toFixed(dec));
    }
  }
  for (const [id, v] of Object.entries(p?.risk ?? {})) if (ID.test(id) && Number.isFinite(v)) e.risk[id] = pct(v);
  e.master = Number.isFinite(p?.master) ? pct(p.master) : 100;
  return e;
}

const round2 = x => Math.floor(x * 100 + 1e-9) / 100;   // lots round down: never above what the faders allow

export function effective(policy, personId) {
  const b = policy.base, riskPct = policy.risk[personId] ?? 100, scale = (riskPct / 100) * (policy.master / 100);
  const lot = b.maxLot == null ? null : round2(b.maxLot * scale);
  return {
    riskPct, blocked: scale <= 0 || (lot !== null && lot < 0.01),
    maxLot: lot, dailyLossPct: b.dailyLossPct == null ? null : Math.round(b.dailyLossPct * Math.max(scale, 0) * 10) / 10 || null,
    maxTradesDay: b.maxTradesDay, stopAfterLosses: b.stopAfterLosses, cooldownMin: b.cooldownMin, noUpsizeAfterLoss: b.noUpsizeAfterLoss, wideSpreadX: b.wideSpreadX,
  };
}

const KEYS = ['blocked', 'maxLot', 'dailyLossPct', 'maxTradesDay', 'stopAfterLosses', 'cooldownMin', 'noUpsizeAfterLoss', 'wideSpreadX'];
export function changes(before, after) {
  return KEYS.filter(k => (before?.[k] ?? null) !== (after?.[k] ?? null)).map(k => ({ field: k, from: before?.[k] ?? null, to: after?.[k] ?? null }));
}

const value = (k, v) => {
  if (v === null || v === false) return 'off';
  if (v === true) return k === 'blocked' ? 'yes' : 'on';
  const f = BY_ID[k];
  return f?.unit === 'lots' ? `${v} ${v === 1 ? 'lot' : 'lots'}` : f?.unit === '%' ? `${v}%` : f?.unit === '×' ? `${v}×` : f?.unit === 'min' ? `${v} min` : String(v);
};
const label = k => (k === 'blocked' ? 'No new trades' : BY_ID[k].label);

export function describe(l) {
  if (l.blocked) return ['No new trades'];
  return KEYS.slice(1).filter(k => l[k] !== null && l[k] !== false).map(k => `${label(k)}: ${value(k, l[k])}`);
}

export function changeText(list) {
  // Stopping a trader says just that: the scaled numbers underneath do not matter while it holds.
  if (list.some(c => c.field === 'blocked' && c.to)) return 'No new trades';
  return list.map(c => (c.field === 'blocked' ? (c.to ? 'No new trades' : 'New trades allowed again') : `${label(c.field)} ${value(c.field, c.from)} → ${value(c.field, c.to)}`)).join('; ');
}
