// Cevabı bilinen sentetik seriler (motor doğrulaması, aşama D). Gerçek bir enstrümanı temsil etmez.
//
//   rastgeleYuruyus : sıfır beklentili geometrik rastgele yürüyüş. Hiçbir kuralın gerçek kenarı yoktur;
//                     optimize edici burada "kenar bulursa" bu şanstır. İsteğe bağlı GARCH benzeri
//                     oynaklık kümelenmesi (beklenti yine sıfır).
//   gomuluKenar     : getirinin işareti, bir önceki kapanışın P* periyotlu SMA'nın üstünde ya da altında
//                     olmasına bağlıdır: r_t = mu × işaret(k_{t-1} - SMA_P*(t-1)) + gürültü. "Fiyat SMA'yı
//                     keser" kuralının gerçek kenarı tam P* periyotta en büyüktür.
// Mumlar: { t, a, y, d, k }; açılış bir önceki kapanıştır (MT5 hızlı prova varsayımı gibi).

import { rastgele } from './sentetik.js';

function normal(r) {
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const BASLANGIC = Date.UTC(2030, 0, 7) / 1000;

function mumYap(a, getiriler, r, oynaklik) {
  // Kapanış dört alt adımın sonucu; yüksek/düşük alt adımlardan, beklentiyi bozmadan.
  let k = a, y = a, d = a;
  for (const g of getiriler) { k *= Math.exp(g); y = Math.max(y, k); d = Math.min(d, k); }
  const fitil = a * oynaklik * 0.25 * Math.abs(normal(r));
  return { a, y: y + fitil, d: Math.max(1e-9, d - fitil), k };
}

export function rastgeleYuruyus({ tohum = 1, adet = 3000, oynaklik = 0.004, kume = false } = {}) {
  const r = rastgele(tohum);
  let fiyat = 100, varyans = 1, t = BASLANGIC;
  const mumlar = [];
  for (let i = 0; i < adet; i++) {
    const alt = [];
    for (let j = 0; j < 4; j++) {
      const z = normal(r);
      if (kume) varyans = 0.05 + 0.9 * varyans + 0.05 * z * z;
      const s = oynaklik * Math.sqrt(varyans) / 2;
      alt.push(s * z - s * s / 2); // log getiride -σ²/2: fiyatın beklentisi sabit (sıfır kenar)
    }
    const m = mumYap(fiyat, alt, r, oynaklik);
    mumlar.push({ t, ...m });
    fiyat = m.k; t += 3600;
  }
  return mumlar;
}

export function gomuluKenar({ tohum = 1, adet = 3000, P = 40, mu = 0.0008, oynaklik = 0.004 } = {}) {
  const r = rastgele(tohum);
  let fiyat = 100, t = BASLANGIC, toplam = 0;
  const kapanis = [], mumlar = [];
  for (let i = 0; i < adet; i++) {
    let isaret = 0;
    if (kapanis.length >= P) {
      const sma = toplam / P;
      isaret = kapanis.at(-1) > sma ? 1 : kapanis.at(-1) < sma ? -1 : 0;
    }
    const alt = [];
    for (let j = 0; j < 4; j++) alt.push(mu * isaret / 4 + oynaklik / 2 * normal(r));
    const m = mumYap(fiyat, alt, r, oynaklik);
    mumlar.push({ t, ...m });
    kapanis.push(m.k); toplam += m.k;
    if (kapanis.length > P) toplam -= kapanis[kapanis.length - 1 - P];
    fiyat = m.k; t += 3600;
  }
  return mumlar;
}

// "Fiyat SMA'yı keser" kuralı: gömülü kenarın sınanacağı strateji. Stop geniş (nadiren tetiklenir),
// hedef yok; pozisyon ters kesişmede döner.
export function smaKesisimStratejisi(periyot = 40) {
  return {
    kalibre: 1, ad: 'Doğrulama: fiyat SMA kesişimi', zaman_dilimi: 'H1', yon: 'iki_yon',
    gostergeler: { sma: { tip: 'SMA', periyot }, atr: { tip: 'ATR', periyot: 14 } },
    giris: {
      long: { hepsi: [{ sol: 'fiyat.kapanis', op: 'yukari_keser', sag: 'sma' }] },
      short: { hepsi: [{ sol: 'fiyat.kapanis', op: 'asagi_keser', sag: 'sma' }] },
    },
    cikis: { stop: { tip: 'atr', gosterge: 'atr', carpan: 25 } },
    risk: { islem_basi_yuzde: 1, max_acik_pozisyon: 1 },
  };
}
