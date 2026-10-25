// Yürüyen ileri analiz (walk-forward): ayar her pencerede yalnız geçmiş veriyle yeniden seçilir,
// hemen sonraki görülmemiş dönemde sınanır. Sınama dönemleri uç uca eklenince elde edilen özkaynak,
// "her seferinde o güne kadarki veriyle seçseydim" sorusunun cevabıdır. DOM yoktur.
//
//   tur 'kayan'  : eğitim penceresi sabit uzunlukta kayar.
//   tur 'capali' : eğitim penceresi hep baştan başlar, büyür.
//   embargo      : eğitim sonu ile sınama başı arasında atlanan mum sayısı (sızıntıya karşı).
//
// Yürüyen ileri verimliliği (WFE) = sınamada mum başı ortalama getiri / eğitimde seçilen ayarın mum
// başı ortalama getirisi. 1'e yakınsa seçim sınamada da tutmuş; 0 ya da negatifse tutmamış.

import { provaAralik, izgara, ayarla, OLCUTLER } from './optimizasyon.js';
import { dogrula } from './dogrula.js';
import { MALIYETSIZ } from './motor.js';
import { manifestOlustur } from './manifest.js';

const getiriler = ozk => { const g = []; for (let i = 1; i < ozk.length; i++) if (ozk[i - 1] > 0) g.push(ozk[i] / ozk[i - 1] - 1); return g; };
const ort = x => (x.length ? x.reduce((a, v) => a + v, 0) / x.length : 0);

export function pencereler(T, { egitim, sinama, embargo = 0, tur = 'kayan' }) {
  const out = [];
  for (let isSon = egitim; isSon + embargo + 1 <= T; isSon += sinama) {
    const isBas = tur === 'capali' ? 0 : isSon - egitim;
    const oosBas = isSon + embargo, oosSon = Math.min(T, oosBas + sinama);
    if (oosSon - oosBas < Math.max(10, sinama / 4)) break;
    out.push({ isBas, isSon, oosBas, oosSon });
  }
  return out;
}

export async function yuruyenIleri(s, mumlar, secilen, secenek = {}, ilerleme = () => {}) {
  const { egitim = Math.floor(mumlar.length * 0.4), sinama = Math.floor(mumlar.length * 0.15), embargo = 0, tur = 'kayan',
    olcut = 'getiri_dusus', enAzIslem = 10, sinir = 200, maliyet = MALIYETSIZ, isinma = 300, iptal = null, provaSecenek } = secenek;
  const O = OLCUTLER[olcut] ?? OLCUTLER.getiri_dusus;
  const { ayarlar } = izgara(secilen, { sinir });
  const adaylar = [];
  for (const d of ayarlar) {
    let a = s;
    d.forEach((v, j) => { a = ayarla(a, secilen[j].yol, v); });
    if (!dogrula(a).length) adaylar.push({ degerler: d, s: a });
  }
  const P = pencereler(mumlar.length, { egitim, sinama, embargo, tur });
  const katlar = [], oosGetiri = [];
  let iptalEdildi = false;
  for (let k = 0; k < P.length; k++) {
    if (iptal?.()) { iptalEdildi = true; break; }
    const p = P[k];
    let en = null;
    for (const a of adaylar) {
      const e = provaAralik(a.s, mumlar, p.isBas, p.isSon, tur === 'capali' ? 0 : isinma, maliyet, provaSecenek);
      if (e.istatistik.islem < enAzIslem) continue;
      const puan = O.deger(e.istatistik);
      if (!en || O.yon * (puan - en.puan) > 0) en = { a, puan, isOrt: ort(getiriler(e.ozkaynak)), is: e.istatistik };
    }
    if (!en) { katlar.push({ ...p, secim: null }); continue; }
    const t = provaAralik(en.a.s, mumlar, p.oosBas, p.oosSon, isinma, maliyet, provaSecenek);
    const g = getiriler(t.ozkaynak);
    oosGetiri.push(...g);
    katlar.push({ ...p, secim: en.a.degerler, isPuan: en.puan, isOrt: en.isOrt, oosOrt: ort(g), oos: t.istatistik });
    ilerleme(k + 1, P.length);
    await new Promise(r => setTimeout(r, 0));
  }
  const dolu = katlar.filter(k => k.secim);
  const isOrt = ort(dolu.map(k => k.isOrt)), oosOrt = ort(oosGetiri);
  const ozkaynak = [10000];
  for (const v of oosGetiri) ozkaynak.push(ozkaynak.at(-1) * (1 + v));
  // Ayar istikrarı: ardışık katlarda seçilen ayar ne sıklıkla değişti?
  let degisim = 0;
  for (let i = 1; i < dolu.length; i++) if (dolu[i].secim.join('|') !== dolu[i - 1].secim.join('|')) degisim++;
  const { iptal: _i, provaSecenek: _p, ...secenekKimlik } = secenek;
  const manifest = manifestOlustur({ strateji: s, mumlar, seed: 1, tur: 'yuruyen-ileri', ayar: { ...secenekKimlik, ...(provaSecenek ?? {}), parametreler: secilen } });
  return {
    manifest, resultId: manifest.resultId,
    tur, egitim, sinama, embargo, katlar, iptal: iptalEdildi,
    wfe: isOrt !== 0 ? oosOrt / isOrt : null,
    oosGetiriYuzde: (ozkaynak.at(-1) / 10000 - 1) * 100,
    oosOzkaynak: ozkaynak,
    ayarDegisimOrani: dolu.length > 1 ? degisim / (dolu.length - 1) : 0,
  };
}
