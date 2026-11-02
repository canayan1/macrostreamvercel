// "Ask your data": a question in plain words becomes a view recipe for the shared view builder
// (gorunum.js). The desk's numbers never leave the browser: a recipe names a dimension, a measure,
// a chart type and, optionally, a label filter, a sort and a top-N. The numbers are computed by the
// analysis engine as before; a language model (if one is configured) only ever sees the schema
// (dimension and measure names) and the question, never a row.
//
// semaOlustur(boyutlar, olculer, t) → schema sent to the model and used by the local parser
// yerelCoz(soru, sema) → recipe | null          no model: matches names and a few words
// tarifDogrula(obj, sema) → { tarif } | { hata }  anything from a model or storage passes here first
// tarifUygula(satirlar, tarif) → rows            filter, sort and top-N on aggregated rows
// tarifMetni(tarif, sema, t) → one line saying what is shown

export const TURLER = ['cubuk', 'cizgi', 'tablo'];
const EN_COK_N = 50;

const kucult = s => String(s ?? '').toLocaleLowerCase('tr').replace(/i̇/g, 'i').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
const ascii = s => kucult(s).replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a');

export function semaOlustur(boyutlar, olculer, t = s => s) {
  return {
    boyutlar: boyutlar.map(b => ({ id: b.id, ad: t(b.ad), kaynak: b.ad })),
    olculer: olculer.map(o => ({ id: o.id, ad: t(o.ad), kaynak: o.ad, tur: o.tur })),
    turler: TURLER,
  };
}

// Every way a dimension or measure may be named: id, translated name, source name, and each word of them.
const adlar = x => [x.id, x.ad, x.kaynak].filter(Boolean).map(ascii);

// Desk words for the same thing. A question containing any alias is treated as containing all of them.
const ESANLAM = [
  ['legs', 'leg', 'items', 'item', 'kalem', 'lines', 'rows', 'deals', 'tickets', 'count', 'adet', 'number of'],
  ['p&l', 'pnl', 'p and l', 'profit', 'profits', 'kar', 'k/z', 'zarar', 'result', 'performance'],
  ['pair', 'pairs', 'currency pair', 'ccy pair', 'ccy', 'parite', 'currency', 'currencies', 'cross'],
  ['counterparty', 'counterparties', 'cpty', 'client', 'clients', 'customer', 'customers', 'karsi taraf', 'musteri'],
  ['hour', 'hours', 'time of day', 'saat', 'o\'clock'],
  ['weekday', 'day', 'days', 'gun', 'dow', 'day of week', 'monday to friday'],
  ['trader', 'traders', 'dealer', 'dealers', 'salesperson', 'sales'],
  ['symbol', 'symbols', 'instrument', 'instruments', 'sembol', 'product', 'products', 'urun'],
  ['book', 'books', 'portfolio', 'portfolios', 'portfoy', 'desk'],
  ['size', 'sizes', 'buyukluk', 'ticket size', 'notional', 'amount', 'volume'],
  ['carry', 'tasima', 'swap points', 'interest'],
  ['net', 'net profit', 'net p&l', 'after costs'],
];
const STOP = new Set(['type', 'tipi', 'usd', 'and', 'the', 'of', 'by', 'per', 'with', 'own', 'your', 'kendi']);

export function genislet(q) {
  const asil = ` ${q} `;
  let out = asil;
  // Groups are matched against the original question only, so one group's aliases cannot trigger another.
  for (const grup of ESANLAM) if (grup.some(a => asil.includes(` ${a} `) || asil.includes(` ${a}s `))) out += ' ' + grup.join(' ');
  return out;
}

// Longest full name that occurs in the question wins; otherwise the longest distinctive word of a name;
// ties go to the earlier list entry.
function adBul(liste, soru) {
  const q = genislet(ascii(soru));
  let en = null, enUzun = 0;
  for (const x of liste) {
    for (const ad of adlar(x)) {
      if (!ad) continue;
      // whole-word match on the full name, or on a name stripped of a unit suffix like "(usd)"
      const temiz = ad.replace(/\busd\b|\bk\/z\b/g, '').trim();
      for (const aday of [ad, temiz]) {
        if (aday.length < 2) continue;
        // plurals and Turkish suffixes: "counterparties", "traders", "pariteye", "saate"
        const govde = aday.replace(/y$/, '(?:y|ie)').replace(/[.*+?^${}()|[\]\\/]/g, m => (m === '(' || m === ')' || m === '|' || m === '?' ? m : '\\' + m));
        const re = new RegExp(`(^|[^a-z0-9])${govde}[a-z]{0,4}([^a-z0-9]|$)`);
        if (re.test(q) && aday.length > enUzun) { en = x; enUzun = aday.length; }
      }
    }
  }
  if (en) return en;
  // Second pass: a single distinctive word of the name ("counterparty" from "Counterparty type").
  for (const x of liste) {
    for (const ad of adlar(x)) {
      for (const kelime of ad.split(/[^a-z0-9&/]+/)) {
        if (kelime.length < 3 || STOP.has(kelime)) continue;
        const govde = kelime.replace(/y$/, '(?:y|ie)').replace(/[.*+?^${}|[\]\\/]/g, '\\$&');
        const re = new RegExp(`(^|[^a-z0-9])${govde}[a-z]{0,4}([^a-z0-9]|$)`);
        if (re.test(q) && kelime.length > enUzun) { en = x; enUzun = kelime.length; }
      }
    }
  }
  return en;
}

const SOZ = {
  tablo: /\b(tablo|table|list|liste|listele|rows?)\b/,
  cizgi: /\b(cizgi|line|trend|over time|zaman icinde|zamanla|egri|curve)\b/,
  enCok: /\b(top|ilk|en cok|en buyuk|en yuksek|en iyi|best|biggest|highest|largest|most)\b/,
  enAz: /\b(bottom|en az|en dusuk|en kotu|worst|lowest|smallest|least)\b/,
  sayi: /\b(top|ilk|bottom|en cok|en az|en buyuk|en dusuk|en iyi|en kotu|best|worst|highest|lowest|biggest|smallest|largest|most|least)\s+(\d{1,2})\b|\b(\d{1,2})\s+(en|top|best|worst)\b/,
  yalniz: /\b(only|sadece|yalniz|yalnizca|just)\s+([a-z0-9/._-]{2,24})/,
  artan: /\b(ascending|artan|kucukten|lowest first|smallest first)\b/,
  azalan: /\b(descending|azalan|buyukten|highest first|largest first)\b/,
};

// A recipe without a model. Returns null when neither a dimension nor a measure is named.
export function yerelCoz(soru, sema) {
  const q = ascii(soru);
  if (!q) return null;
  const boyut = adBul(sema.boyutlar, soru), olcu = adBul(sema.olculer, soru);
  if (!boyut && !olcu) return null;
  const tarif = { boyut: boyut?.id ?? sema.boyutlar[0].id, olcu: olcu?.id ?? sema.olculer[0].id, tur: 'cubuk' };
  if (SOZ.tablo.test(q)) tarif.tur = 'tablo';
  else if (SOZ.cizgi.test(q)) tarif.tur = 'cizgi';
  const n = SOZ.sayi.exec(q) ?? /\b(\d{1,2})\b/.exec(q);
  const sayi = n ? Number(n[2] ?? n[3] ?? n[1]) : null;
  if (SOZ.enAz.test(q)) { tarif.sirala = 'artan'; tarif.ilkN = sayi ?? 5; }
  else if (SOZ.enCok.test(q)) { tarif.sirala = 'azalan'; tarif.ilkN = sayi ?? 5; }
  else if (SOZ.artan.test(q)) tarif.sirala = 'artan';
  else if (SOZ.azalan.test(q)) tarif.sirala = 'azalan';
  const y = SOZ.yalniz.exec(q);
  if (y) {
    // "only" followed by a dimension or measure name is a grouping choice, not a label filter.
    const ad = y[2];
    const isim = [...sema.boyutlar, ...sema.olculer].some(x => adlar(x).some(a => a === ad || a.split(' ').includes(ad)));
    if (!isim) tarif.filtre = ad;
  }
  return tarif;
}

export function tarifDogrula(obj, sema) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { hata: 'bicim' };
  const boyut = sema.boyutlar.find(b => b.id === obj.boyut), olcu = sema.olculer.find(o => o.id === obj.olcu);
  if (!boyut) return { hata: 'boyut' };
  if (!olcu) return { hata: 'olcu' };
  const tur = TURLER.includes(obj.tur) ? obj.tur : 'cubuk';
  const tarif = { boyut: boyut.id, olcu: olcu.id, tur };
  if (obj.sirala === 'artan' || obj.sirala === 'azalan') tarif.sirala = obj.sirala;
  if (obj.ilkN !== undefined && obj.ilkN !== null) {
    const n = Math.floor(Number(obj.ilkN));
    if (!Number.isFinite(n) || n < 1) return { hata: 'ilkN' };
    tarif.ilkN = Math.min(EN_COK_N, n);
    tarif.sirala ??= 'azalan';
  }
  if (obj.filtre !== undefined && obj.filtre !== null && obj.filtre !== '') {
    const f = String(obj.filtre).replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40);
    if (f) tarif.filtre = f;
  }
  return { tarif };
}

// Rows are { etiket, deger, adet } as drawn by the builder. Filter by label, sort by value, cut to N.
export function tarifUygula(satirlar, tarif) {
  let s = satirlar.slice();
  if (tarif.filtre) { const f = ascii(tarif.filtre); s = s.filter(r => ascii(r.etiket).includes(f)); }
  if (tarif.sirala) {
    const yon = tarif.sirala === 'artan' ? 1 : -1;
    s.sort((a, b) => ((a.deger ?? -Infinity) - (b.deger ?? -Infinity)) * yon);
  }
  if (tarif.ilkN) s = s.slice(0, tarif.ilkN);
  return s;
}

export function tarifMetni(tarif, sema, t = s => s) {
  const b = sema.boyutlar.find(x => x.id === tarif.boyut)?.ad ?? tarif.boyut;
  const o = sema.olculer.find(x => x.id === tarif.olcu)?.ad ?? tarif.olcu;
  const parca = [`${o} ${t('by')} ${b}`];
  if (tarif.ilkN) parca.push(`${tarif.sirala === 'artan' ? t('bottom') : t('top')} ${tarif.ilkN}`);
  else if (tarif.sirala) parca.push(tarif.sirala === 'artan' ? t('ascending') : t('descending'));
  if (tarif.filtre) parca.push(`${t('only')} "${tarif.filtre}"`);
  return parca.join(', ');
}
