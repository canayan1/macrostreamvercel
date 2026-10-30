// Public run package format (format "kalibre-run", formatVersion 2): English keys and values for
// the run settings, summary statistics, trades and extras. The engine still produces the legacy
// (Turkish-keyed) objects; these functions convert them at the boundary.
//
// The manifest hashes the public forms (see manifest.js), so anyone holding an exported package
// can recompute specHash and configHash from the package itself.

import { toPublic } from './strategy-format.js';

export const RUN_MAP = {
  kind: { prova: 'backtest', optimizasyon: 'optimization', 'yuruyen-ileri': 'walk_forward' },
  config: {
    baslangic: 'initialBalance', maliyet: 'costs', girisBaslangic: 'entryStartIndex', basamak: 'priceDigits', miktarAdimi: 'quantityStep',
    enstruman: 'instrument', dolum: 'fillModel', altMumlarHash: 'lowerTimeframeBarsHash',
    // optimization and walk-forward options
    olcut: 'objective', egitimOrani: 'trainRatio', enAzIslem: 'minTrades', sinir: 'maxCombinations', prop: 'propLimits', enIyiSayisi: 'topCount',
    bolum: 'progressEvery', pbo: 'pbo', pboBlok: 'pboBlocks', oncekiDeneme: 'priorTrials', egitim: 'trainBars', sinama: 'testBars', embargo: 'embargoBars',
    tur: 'windowType', isinma: 'warmupBars', parametreler: 'parameters',
  },
  objective: { getiri_dusus: 'return_over_drawdown', sharpe: 'sharpe', kar_faktoru: 'profit_factor', beklenti: 'expectancy' },
  windowType: { kayan: 'rolling', capali: 'anchored' },
  propLimits: { gunluk: 'dailyPct', azami: 'totalPct', tur: 'type' },
  propType: { sabit: 'static', 'gun-sonu': 'end_of_day', 'gun-ici': 'intraday' },
  parameter: { yol: 'path', deger: 'value', min: 'min', max: 'max', adim: 'step', etiket: 'label' },
  optimizationRow: {
    degerler: 'values', egitim: 'train', puan: 'score', yetersiz: 'tooFewTrades', propIhlal: 'propBreach', sinama: 'test', sinamaPuan: 'testScore', sinamaPropIhlal: 'testPropBreach',
  },
  neighbourhood: { adet: 'count', oran: 'ratio' },
  pbo: { pbo: 'pbo', neden: 'reason', bozulma: 'degradation', zararOlasiligi: 'lossProbability', kombinasyon: 'combinations', S: 'S' },
  pboReason: { az_ayar: 'too_few_settings', blok_tek: 'odd_block_count', az_gozlem: 'too_few_observations', ozdes: 'identical_settings' },
  regression: { egim: 'slope', kesisim: 'intercept', r2: 'r2' },
  haircut: { yontem: 'method', sr: 'sr', pTek: 'pSingle', pDuzeltilmis: 'pAdjusted', hsr: 'hsr', kirpma: 'haircut', M: 'M' },
  warning: { kod: 'code', dsr: 'dsr', pbo: 'pbo', denenen: 'tried' },
  warningCode: { sonuc_yok: 'no_result', sinama_dusuk: 'test_score_low', sinama_zarar: 'test_loss', sivri_tepe: 'sharp_peak', sans_olabilir: 'may_be_luck', pbo_yuksek: 'high_pbo', cok_deneme: 'many_trials' },
  fold: { isBas: 'trainStart', isSon: 'trainEnd', oosBas: 'testStart', oosSon: 'testEnd', secim: 'selected', isPuan: 'trainScore', isOrt: 'trainMeanReturn', oosOrt: 'testMeanReturn', oos: 'test' },
  costs: { spread: 'spread', kayma: 'slippage', komisyonYuzde: 'commissionPct' },
  instrument: {
    sozlesme: 'contractSize', tickBuyuklugu: 'tickSize', tickDegeri: 'tickValue', nokta: 'point', lotAdimi: 'lotStep', minLot: 'minLot', maxLot: 'maxLot',
    baz: 'baseCurrency', kote: 'quoteCurrency', hesap: 'accountCurrency', komisyonLot: 'commissionPerLot', swapLong: 'swapLong', swapShort: 'swapShort',
    ucluSwapGunu: 'tripleSwapDay', stopOut: 'stopOutLevel', kaldirac: 'leverage', donusumHash: 'conversionHash',
  },
  fillModel: { 'stop-once': 'stop_first', 'acilisa-yakin': 'nearest_to_open', ohlc: 'ohlc', m1: 'm1' },
  extra: { sentetik: 'synthetic', dolum: 'fill', enstruman: 'instrument' },
  synthetic: { rejim: 'regime', adet: 'bars', zamanDilimi: 'timeframe', tohum: 'seed' },
  regime: { karisik: 'mixed', boga: 'bull', yatay: 'range', ayi: 'bear', kriz: 'crisis' },
  fill: { model: 'model', belirsizMum: 'ambiguousBars', belirsizOran: 'ambiguousRatio', altMumYok: 'missingLowerBars' },
  instrumentReport: { swapToplam: 'swapTotal', komisyonToplam: 'commissionTotal', minLotAtlanan: 'skippedBelowMinLot', teminatAtlanan: 'skippedForMargin', stopOut: 'stopOuts' },
  summary: {
    islem: 'trades', kazanmaOrani: 'winRate', beklentiR: 'expectancyR', ortKazancR: 'avgWinR', ortKayipR: 'avgLossR', karFaktoru: 'profitFactor',
    getiriYuzde: 'returnPct', maxDususYuzde: 'maxDrawdownPct', enUzunKayipSerisi: 'longestLosingStreak', sharpe: 'sharpe', gozlem: 'observations',
  },
  trade: {
    yon: 'side', girisI: 'entryIndex', giris: 'entryPrice', cikisI: 'exitIndex', cikis: 'exitPrice', neden: 'exitReason', kar: 'profit', r: 'r',
    komisyon: 'commission', miktar: 'quantity', lot: 'lots', swap: 'swap',
  },
  exitReason: {
    stop: 'stop', 'iz süren stop': 'trailing_stop', hedef: 'target', 'stop (boşluk)': 'stop_gap', 'hedef (boşluk)': 'target_gap',
    'çıkış kuralı': 'exit_rule', 'süre doldu': 'max_bars', 'ters sinyal': 'opposite_signal', 'stop out': 'stop_out', 'prova sonu': 'end_of_test',
  },
};

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const rename = (o, table, each = (k, v) => v) => (isObject(o) ? Object.fromEntries(Object.entries(o).map(([k, v]) => [RUN_MAP[table][k] ?? k, each(k, v)])) : o);
const value = (table, v) => (typeof v === 'string' && v in RUN_MAP[table] ? RUN_MAP[table][v] : v);

export const publicKind = kind => value('kind', kind);

// Settings as they enter configHash (already digested: no functions, arrays replaced by hashes).
export const publicConfig = c => rename(c, 'config', (k, v) => {
  if (k === 'maliyet') return rename(v, 'costs');
  if (k === 'enstruman') return rename(v, 'instrument');
  if (k === 'dolum') return value('fillModel', v);
  if (k === 'olcut') return value('objective', v);
  if (k === 'tur') return value('windowType', v);
  if (k === 'prop') return rename(v, 'propLimits', (pk, pv) => (pk === 'tur' ? value('propType', pv) : pv));
  if (k === 'parametreler') return Array.isArray(v) ? v.map(publicParameter) : v;
  return v;
});

// A path into the legacy strategy ("gostergeler.fast.periyot") as a path into the public one
// ("indicators.fast.period"): the path is built into a skeleton object and converted.
export function publicPath(path) {
  const parts = String(path).split('.');
  const root = {};
  let node = root;
  parts.forEach((part, i) => {
    const last = i === parts.length - 1;
    const nextIsIndex = !last && /^\d+$/.test(parts[i + 1]);
    const child = last ? '\u0000' : nextIsIndex ? [] : {};
    if (Array.isArray(node)) { while (node.length < Number(part)) node.push({}); node[Number(part)] = child; } else node[part] = child;
    node = child;
  });
  const out = [];
  const find = (o, trail) => {
    if (o === '\u0000') { out.push(trail); return; }
    if (Array.isArray(o)) o.forEach((x, i) => find(x, [...trail, String(i)]));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) find(v, [...trail, k]);
  };
  const { kalibre: _k, ...pub } = toPublic({ kalibre: 1, ...root });
  find(pub, []);
  return out[0]?.join('.') ?? path;
}

export const publicParameter = p => rename(p, 'parameter', (k, v) => (k === 'yol' ? publicPath(v) : k === 'etiket' ? undefined : v));

export const publicOptimizationRow = r => rename(r, 'optimizationRow', (k, v) => (['egitim', 'sinama'].includes(k) ? publicSummary(v) : v));
export const publicNeighbourhood = n => rename(n, 'neighbourhood');
export const publicPbo = p => rename(p, 'pbo', (k, v) => (k === 'neden' ? value('pboReason', v) : k === 'bozulma' ? rename(v, 'regression') : v));
export const publicHaircut = h => rename(h, 'haircut');
export const publicFold = f => rename(f, 'fold', (k, v) => (k === 'oos' ? publicSummary(v) : v));
export const publicWindowType = v => value('windowType', v);
export const publicWarning = w => rename(w, 'warning', (k, v) => (k === 'kod' ? value('warningCode', v) : v));

export const publicExtra = e => rename(e, 'extra', (k, v) => {
  if (k === 'sentetik') return rename(v, 'synthetic', (sk, sv) => (sk === 'rejim' ? value('regime', sv) : sv));
  if (k === 'dolum') return rename(v, 'fill', (fk, fv) => (fk === 'model' ? value('fillModel', fv) : fv));
  if (k === 'enstruman') return rename(v, 'instrumentReport');
  return v;
});

export const publicSummary = s => rename(s, 'summary');
export const publicTrade = tr => rename(tr, 'trade', (k, v) => (k === 'neden' ? value('exitReason', v) : v));
