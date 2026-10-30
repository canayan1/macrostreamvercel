// Kullanıcının verdiği kur tablosu (lisanslı canlı veri yok; kurucu yanıtı 11).
// Biçim: satır başına "EUR/USD 1.0850" ya da CSV "parite,kur". Çevrim: önce USD karşılığı, sonra
// yerel para (kurucu yanıtı 12). Çapraz kur USD üzerinden tek adım üçgenleme.

import { pariteCoz, konvansiyon, sayiAyristir } from './model.js';

export function kurTablosuCoz(metin) {
  const tablo = {}, hatalar = [];
  String(metin ?? '').split(/\r?\n/).forEach((satir, i) => {
    const s = satir.trim();
    if (!s || s.startsWith('#')) return;
    let p = s.split(/[\s;\t=]+/).filter(Boolean);
    if (p.length === 1) p = s.split(',').map(x => x.trim()).filter(Boolean);
    const cift = pariteCoz(p[0]);
    const kur = sayiAyristir(p[p.length - 1], /,\d+$/.test(p[p.length - 1]) && !p[p.length - 1].includes('.') ? 'virgul' : 'nokta');
    if (!cift || p.length < 2 || !(kur > 0)) { hatalar.push(i + 1); return; }
    const [b, k] = konvansiyon(cift[0], cift[1]);
    tablo[`${b}/${k}`] = b === cift[0] ? kur : 1 / kur;
  });
  return { tablo, hatalar };
}

// Bir dövizin USD karşılık kuru (1 birim = ? USD). Bulunamazsa null.
export function usdKuru(doviz, tablo) {
  if (doviz === 'USD') return 1;
  if (tablo[`${doviz}/USD`]) return tablo[`${doviz}/USD`];
  if (tablo[`USD/${doviz}`]) return 1 / tablo[`USD/${doviz}`];
  for (const [p, r] of Object.entries(tablo)) {
    const [b, k] = p.split('/');
    if (b === doviz && k !== 'USD') { const ara = usdKuru1(k, tablo); if (ara) return r * ara; }
    if (k === doviz && b !== 'USD') { const ara = usdKuru1(b, tablo); if (ara) return ara / r; }
  }
  return null;
}
function usdKuru1(d, tablo) {
  if (d === 'USD') return 1;
  if (tablo[`${d}/USD`]) return tablo[`${d}/USD`];
  if (tablo[`USD/${d}`]) return 1 / tablo[`USD/${d}`];
  return null;
}

export function cevirici(tablo, yerelDoviz = null) {
  const usd = (tutar, doviz) => {
    if (tutar === null || tutar === undefined || !Number.isFinite(tutar)) return null;
    const r = usdKuru(doviz, tablo);
    return r ? tutar * r : null;
  };
  const yerelKur = yerelDoviz ? usdKuru(yerelDoviz, tablo) : null;
  const yerel = tutarUsd => (tutarUsd === null || !yerelKur ? null : tutarUsd / yerelKur);
  // Parite kuru (MTM için): tabloda varsa, yoksa USD üzerinden.
  const parite = (base, kote) => {
    if (tablo[`${base}/${kote}`]) return tablo[`${base}/${kote}`];
    const a = usdKuru(base, tablo), b = usdKuru(kote, tablo);
    return a && b ? a / b : null;
  };
  return { usd, yerel, parite, yerelDoviz, yerelKur };
}

// Taşıma girdisi: "USD 4.25" (yıllık faiz %), "EUR/USD TN 0.000012" ya da "EUR/USD 0.000012" (gecelik T/N puanı).
export function tasimaGirdiCoz(metin) {
  const faiz = {}, tnPuan = {}, hatalar = [];
  String(metin ?? '').split(/\r?\n/).forEach((satir, i) => {
    const s = satir.trim();
    if (!s || s.startsWith('#')) return;
    let p = s.split(/[\s;\t=]+/).filter(Boolean);
    if (p.length === 1) p = s.split(',').map(x => x.trim()).filter(Boolean);
    const son = p[p.length - 1];
    const deger = sayiAyristir(son, /,\d+$/.test(son) && !son.includes('.') ? 'virgul' : 'nokta');
    if (deger === null || p.length < 2) { hatalar.push(i + 1); return; }
    const cift = pariteCoz(p[0]);
    if (cift) {
      const [b, k] = konvansiyon(cift[0], cift[1]);
      tnPuan[`${b}/${k}`] = b === cift[0] ? deger : -deger;
    } else if (/^[A-Z]{3}$/i.test(p[0])) faiz[p[0].toUpperCase()] = deger;
    else hatalar.push(i + 1);
  });
  return { faiz, tnPuan, hatalar };
}

// Starting rate table taken from the file itself: the last traded spot rate for each pair (spot deals
// first, then the spot rate on forwards and swaps). Lets a desk see USD equivalents and MTM the moment
// the file is dropped; the desk can replace any line with its own snapshot.
export function lastTradedRates(legs) {
  const best = new Map();
  for (const b of legs) {
    const rate = b.urun === 'spot' ? b.kur ?? b.spotKur : b.spotKur;
    if (!(rate > 0) || b.ndf) continue;
    const key = b.islemZamani ?? Date.parse(b.islemTarihi + 'T00:00:00Z') / 1000;
    const rank = b.urun === 'spot' ? 1 : 0;
    const cur = best.get(b.parite);
    if (!cur || rank > cur.rank || (rank === cur.rank && key >= cur.key)) best.set(b.parite, { rate, key, rank, day: b.islemTarihi });
  }
  return [...best.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([pair, x]) => ({ pair, rate: x.rate, day: x.day }));
}
