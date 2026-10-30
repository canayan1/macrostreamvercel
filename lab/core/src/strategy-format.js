// Public strategy file format (kalibre: 3, English keys and values) and the legacy format
// (kalibre: 1 or 2, Turkish keys) that the engine still uses internally.
//
// Everything that leaves the lab (JSON preview, downloaded rule files, run packages, sample files)
// uses the public format. Everything that enters it (imported files, templates, saved drafts) is
// converted to the internal format with toInternal(), which accepts both.
//
// Indicator names chosen by the user (for example "fast" or "ema20") are identifiers and are never
// translated; only keys, enum values, price operands and indicator line suffixes are.
//
// The same mapping is published as schema/strategy-format.map.json for other implementations
// (the Python reference and the MT5 engine); a test keeps the two identical.

export const PUBLIC_FORMAT_VERSION = 3;

// Legacy name → public name, per context.
export const MAP = {
  top: { kalibre: 'kalibre', ad: 'name', aciklama: 'description', zaman_dilimi: 'timeframe', yon: 'direction', gostergeler: 'indicators', giris: 'entry', cikis: 'exit', risk: 'risk', filtre: 'filters' },
  direction: { iki_yon: 'both', sadece_long: 'long_only', sadece_short: 'short_only' },
  indicator: { tip: 'type', periyot: 'period', sapma: 'deviation', hizli: 'fast', yavas: 'slow', sinyal: 'signal', lambda: 'lambda', model: 'model', dagilim: 'distribution', pencere: 'window', yenile: 'refit_every' },
  group: { hepsi: 'all', herhangi: 'any' },
  condition: { sol: 'left', op: 'op', sag: 'right' },
  op: { yukari_keser: 'crosses_above', asagi_keser: 'crosses_below' },
  priceOperand: { fiyat: 'price' },
  price: { acilis: 'open', yuksek: 'high', dusuk: 'low', kapanis: 'close' },
  line: { ana: 'main', orta: 'middle', ust: 'upper', alt: 'lower', sinyal: 'signal', arti: 'plus', eksi: 'minus', oran: 'ratio', uzun: 'long_run' },
  exit: { stop: 'stop', hedef: 'target', iz_suren_stop: 'trailing_stop', max_bar: 'max_bars', kosul: 'condition' },
  distance: { tip: 'type', gosterge: 'indicator', carpan: 'multiplier', deger: 'value' },
  distanceType: { atr: 'atr', oynaklik: 'volatility', puan: 'points', yuzde: 'percent', r: 'r' },
  risk: { islem_basi_yuzde: 'risk_per_trade_pct', max_acik_pozisyon: 'max_open_positions', max_spread_puan: 'max_spread_points', gunluk_max_kayip_yuzde: 'daily_max_loss_pct', volatilite_hedefi: 'volatility_target' },
  volatilityTarget: { gosterge: 'indicator', alt_carpan: 'min_multiplier', ust_carpan: 'max_multiplier' },
  filters: { saat: 'hours', haber: 'news' },
  hours: { bas: 'start', bit: 'end' },
  news: { once_dk: 'minutes_before', sonra_dk: 'minutes_after', onem: 'impact' },
  impact: { orta: 'medium', yuksek: 'high' },
};

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const invert = m => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
const FORWARD = MAP;
const BACKWARD = Object.fromEntries(Object.entries(MAP).map(([k, m]) => [k, invert(m)]));

// One converter for both directions. `to` is the target table set (FORWARD or BACKWARD); `legacy`
// turns a source key into its legacy name so the structure is recognised the same way both ways.
function converter(to) {
  const fromPublic = to === BACKWARD;
  const legacy = (table, key) => (fromPublic ? BACKWARD[table][key] ?? key : key);
  const value = (table, v) => (typeof v === 'string' && v in to[table] ? to[table][v] : v);
  // Unknown keys are kept as they are, so the validator can still point at them.
  const rename = (o, table, each = (legacyKey, v) => v) =>
    (isObject(o) ? Object.fromEntries(Object.entries(o).map(([k, v]) => [to[table][k] ?? k, each(legacy(table, k), v)])) : o);

  const operand = v => {
    if (typeof v !== 'string') return v;
    const parts = v.split('.');
    if (parts.length !== 2) return v;
    const [head, line] = parts;
    if (head in to.priceOperand) return `${to.priceOperand[head]}.${value('price', line)}`;
    return `${head}.${value('line', line)}`;
  };
  const condition = c => rename(c, 'condition', (k, v) => (k === 'op' ? value('op', v) : operand(v)));
  const group = g => rename(g, 'group', (k, v) => (Array.isArray(v) ? v.map(condition) : v));
  const sides = o => (isObject(o) ? Object.fromEntries(Object.entries(o).map(([side, g]) => [side, group(g)])) : o);
  const distance = d => rename(d, 'distance', (k, v) => (k === 'tip' ? value('distanceType', v) : v));

  return s => rename(s, 'top', (k, v) => {
    switch (k) {
      case 'yon': return value('direction', v);
      case 'gostergeler': return isObject(v) ? Object.fromEntries(Object.entries(v).map(([n, d]) => [n, rename(d, 'indicator')])) : v;
      case 'giris': return sides(v);
      case 'cikis': return rename(v, 'exit', (ek, ev) => (ek === 'kosul' ? sides(ev) : ['stop', 'hedef', 'iz_suren_stop'].includes(ek) ? distance(ev) : ev));
      case 'risk': return rename(v, 'risk', (rk, rv) => (rk === 'volatilite_hedefi' ? rename(rv, 'volatilityTarget') : rv));
      case 'filtre': return rename(v, 'filters', (fk, fv) => (fk === 'saat' ? rename(fv, 'hours') : fk === 'haber' ? rename(fv, 'news', (nk, nv) => (nk === 'onem' ? value('impact', nv) : nv)) : fv));
      default: return v;
    }
  });
}
const toPublicRaw = converter(FORWARD);
const toInternalRaw = converter(BACKWARD);

// Uses volatility features → legacy version 2, otherwise 1 (the legacy validator requires this).
const legacyVersion = s => (/"(EWMA_VOL|YZ_VOL|GARCH_VOL|oynaklik|volatilite_hedefi)"/.test(JSON.stringify(s)) ? 2 : 1);

export const isPublicFormat = s => isObject(s) && (s.kalibre === PUBLIC_FORMAT_VERSION || 'indicators' in s || 'entry' in s || 'exit' in s);

// Internal (legacy) → public. Already-public input is returned unchanged.
export function toPublic(s) {
  if (!isObject(s) || isPublicFormat(s)) return s;
  return { ...toPublicRaw(s), kalibre: PUBLIC_FORMAT_VERSION };
}

// Public or legacy → internal (legacy). Legacy input is returned unchanged.
export function toInternal(s) {
  if (!isObject(s) || !isPublicFormat(s)) return s;
  const out = toInternalRaw(s);
  return { ...out, kalibre: legacyVersion(out) };
}
