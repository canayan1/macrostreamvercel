// Parametre optimizasyonu: kullanıcının kural dosyasındaki sayısal parametreleri bir ızgara üzerinde
// tarar, her ayarı hızlı provada (motor.js) çalıştırır ve aşırı uyuma (geçmişe yapışma) karşı
// sonuçları dürüstçe raporlar. DOM yoktur; arayüz bu modülü çağırır.
//
// Korumalar:
//   - Eğitim / sınama bölmesi: en iyi ayar yalnız eğitim döneminde seçilir, sınama dönemi
//     sonucu ayrıca gösterilir. Göstergeler için sınama başına ısınma payı eklenir.
//   - Komşuluk: en iyi ayarın tek adım komşuları da iyi mi? Tek bir sivri tepe kırılgandır.
//   - Çoklu deneme düzeltmesi (deflated Sharpe, Bailey ve López de Prado 2014): çok sayıda ayar
//     denendiğinde en iyinin Sharpe'ı şansla da yüksek çıkar; bu düzeltme o olasılığı hesaba katar.
//   - Risk parametreleri (işlem başı risk, günlük kayıp sınırı) taranmaz: onlar kullanıcının kararıdır.
//
// Hızlı prova varsayılan olarak maliyetsizdir (brüt); secenek.maliyet verilirse spread, komisyon ve kayma
// motor.js maliyet modeliyle düşülür (net). Sonuçlar yaklaşıktır; kesin sınav MT5 Strategy Tester'dadır.

import { prova, istatistik, MALIYETSIZ } from './motor.js';
import { dogrula } from './dogrula.js';

// ------------------------------------------------------------------ parametreler
const GOSTERGE_ALANLARI = {
  periyot: v => ({ min: Math.max(2, Math.round(v * 0.5)), max: Math.round(v * 2), adim: Math.max(1, Math.round(v / 10)) }),
  hizli: v => ({ min: Math.max(2, Math.round(v * 0.5)), max: Math.round(v * 2), adim: Math.max(1, Math.round(v / 6)) }),
  yavas: v => ({ min: Math.max(3, Math.round(v * 0.5)), max: Math.round(v * 2), adim: Math.max(1, Math.round(v / 6)) }),
  sinyal: v => ({ min: Math.max(2, Math.round(v * 0.5)), max: Math.round(v * 2), adim: Math.max(1, Math.round(v / 4)) }),
  sapma: () => ({ min: 1, max: 3, adim: 0.25 }),
  lambda: () => ({ min: 0.85, max: 0.99, adim: 0.01 }),
};
const PAHALI = ['GARCH_VOL']; // her ayarda model kestirimi: taramaya alınmaz

const yuvarla = (x, adim) => {
  const b = (String(adim).split('.')[1] ?? '').length;
  return Number((Math.round(x / adim) * adim).toFixed(b));
};

// Kural dosyasındaki taranabilir sayısal parametreler. Her biri: { yol, deger, min, max, adim, etiket }
export function parametreler(s) {
  const out = [];
  for (const [ad, g] of Object.entries(s.gostergeler ?? {})) {
    if (PAHALI.includes(g.tip)) continue;
    for (const [alan, aralik] of Object.entries(GOSTERGE_ALANLARI)) {
      if (typeof g[alan] !== 'number') continue;
      out.push({ yol: `gostergeler.${ad}.${alan}`, deger: g[alan], ...aralik(g[alan]), etiket: `${ad} ${alan}` });
    }
  }
  const mesafe = (yol, m, etiket) => {
    if (!m) return;
    if (typeof m.carpan === 'number') out.push({ yol: `${yol}.carpan`, deger: m.carpan, min: 0.5, max: Math.max(4, m.carpan * 2), adim: 0.5, etiket });
    else if (m.tip === 'r' && typeof m.deger === 'number') out.push({ yol: `${yol}.deger`, deger: m.deger, min: 0.5, max: Math.max(4, m.deger * 2), adim: 0.5, etiket });
  };
  mesafe('cikis.stop', s.cikis?.stop, 'stop');
  mesafe('cikis.hedef', s.cikis?.hedef, 'hedef');
  mesafe('cikis.iz_suren_stop', s.cikis?.iz_suren_stop, 'iz süren stop');
  // Koşullardaki sayısal eşikler (ör. RSI < 30, ADX > 20).
  const kosullar = (yol, gr) => {
    if (!gr) return;
    const tur = gr.hepsi ? 'hepsi' : 'herhangi';
    (gr[tur] ?? []).forEach((k, i) => {
      if (typeof k.sag !== 'number' || k.sag === 0) return;
      const v = k.sag, adim = Math.abs(v) >= 10 ? Math.max(1, Math.round(Math.abs(v) / 10)) : Math.abs(v) / 10;
      out.push({ yol: `${yol}.${tur}.${i}.sag`, deger: v, min: yuvarla(v - Math.abs(v) * 0.5, adim), max: yuvarla(v + Math.abs(v) * 0.5, adim), adim, etiket: `${k.sol} ${k.op} eşiği` });
    });
  };
  kosullar('giris.long', s.giris?.long);
  kosullar('giris.short', s.giris?.short);
  kosullar('cikis.kosul.long', s.cikis?.kosul?.long);
  kosullar('cikis.kosul.short', s.cikis?.kosul?.short);
  return out;
}

export function ayarla(s, yol, deger) {
  const kopya = structuredClone(s);
  const p = yol.split('.');
  let o = kopya;
  for (const k of p.slice(0, -1)) o = o[/^\d+$/.test(k) ? Number(k) : k];
  o[p.at(-1)] = deger;
  return kopya;
}

export function degerler({ min, max, adim }) {
  const out = [];
  for (let x = min; x <= max + adim / 1e6; x += adim) out.push(yuvarla(x, adim));
  return [...new Set(out)];
}

// Seçilen parametrelerin kartezyen çarpımı; çok büyükse tohumlu rastgele örneklem (sınır kadar).
export function izgara(secilen, { sinir = 500, tohum = 1 } = {}) {
  const eksen = secilen.map(degerler);
  const toplam = eksen.reduce((a, e) => a * e.length, 1);
  const kombinasyon = i => { const out = []; for (const e of eksen) { out.push(e[i % e.length]); i = Math.floor(i / e.length); } return out; };
  if (toplam <= sinir) return { ayarlar: Array.from({ length: toplam }, (_, i) => kombinasyon(i)), toplam, ornek: false };
  let r = tohum >>> 0;
  const rnd = () => { r = (r + 0x6d2b79f5) | 0; let t = Math.imul(r ^ (r >>> 15), 1 | r); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const secim = new Set();
  while (secim.size < sinir) secim.add(Math.floor(rnd() * toplam));
  return { ayarlar: [...secim].map(kombinasyon), toplam, ornek: true };
}

// ------------------------------------------------------------------ ölçütler
export const OLCUTLER = {
  getiri_dusus: { yon: 1, deger: st => st.maxDususYuzde > 0 ? st.getiriYuzde / st.maxDususYuzde : (st.getiriYuzde > 0 ? st.getiriYuzde : 0) },
  sharpe: { yon: 1, deger: st => st.sharpe },
  kar_faktoru: { yon: 1, deger: st => Number.isFinite(st.karFaktoru) ? st.karFaktoru : 10 },
  beklenti: { yon: 1, deger: st => st.beklentiR },
};

function getiriler(ozkaynak) {
  const g = [];
  for (let i = 1; i < ozkaynak.length; i++) if (ozkaynak[i - 1] > 0) g.push(ozkaynak[i] / ozkaynak[i - 1] - 1);
  return g;
}
function momentler(x) {
  const n = x.length;
  if (n < 3) return { ort: 0, ss: 0, carpiklik: 0, basiklik: 3 };
  const ort = x.reduce((a, v) => a + v, 0) / n;
  const m2 = x.reduce((a, v) => a + (v - ort) ** 2, 0) / n;
  const ss = Math.sqrt(m2);
  if (ss === 0) return { ort, ss: 0, carpiklik: 0, basiklik: 3 };
  const m3 = x.reduce((a, v) => a + (v - ort) ** 3, 0) / n, m4 = x.reduce((a, v) => a + (v - ort) ** 4, 0) / n;
  return { ort, ss, carpiklik: m3 / ss ** 3, basiklik: m4 / ss ** 4 };
}

// Bir aralık için prova: [bas, son) mumları değerlendirilir; öncesinden ısınma payı göstergeler için kullanılır.
export function provaAralik(s, mumlar, bas, son, isinma = 300, maliyet = MALIYETSIZ) {
  const k = Math.max(0, bas - isinma);
  const p = prova(s, mumlar.slice(k, son), { maliyet });
  const ofset = bas - k;
  const islemler = p.islemler.filter(i => i.girisI >= ofset);
  const ozk = p.ozkaynak.slice(Math.max(0, ofset - 1));
  const st = istatistik(islemler, ozk, ozk[0] ?? 10000);
  const g = getiriler(ozk), m = momentler(g);
  st.sharpe = m.ss > 0 ? m.ort / m.ss : 0;      // mum başına (yıllıklaştırılmamış)
  st.gozlem = g.length;
  st.carpiklik = m.carpiklik; st.basiklik = m.basiklik;
  return { istatistik: st, ozkaynak: ozk, mumlar: mumlar.slice(bas, son) };
}

// ------------------------------------------------------------------ prop kuralı
// Kalkan mantığının özeti (mql5/Include/Kalibre/Kalkan.mqh): taban = max(gün başı - g%, (başlangıç ya da
// gün sonu tepesi) - a%); varlık tabana inerse ihlal. Gün, mum zamanının UTC takvim günüdür (yaklaşık).
export function propIhlali(ozkaynak, mumlar, { gunluk, azami, tur = 'sabit' }) {
  const B = ozkaynak[0];
  let gun = '', gunBasi = B, tepe = B;
  for (let i = 0; i < ozkaynak.length; i++) {
    const g = new Date((mumlar[i]?.t ?? 0) * 1000).toISOString().slice(0, 10);
    if (g !== gun) { gun = g; gunBasi = ozkaynak[i]; if (tur === 'iz') tepe = Math.max(tepe, gunBasi); }
    const taban = Math.max(gunluk ? gunBasi - B * gunluk / 100 : -Infinity, azami ? (tur === 'iz' ? tepe : B) - B * azami / 100 : -Infinity);
    if (ozkaynak[i] < taban) return { ihlal: true, i, gun };
  }
  return { ihlal: false };
}

// ------------------------------------------------------------------ çoklu deneme düzeltmesi
// Standart normal: dağılım (Abramowitz-Stegun 7.1.26) ve ters dağılım (Acklam).
export function phi(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
export function phiTers(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const q = p < 0.02425 ? Math.sqrt(-2 * Math.log(p)) : p > 1 - 0.02425 ? Math.sqrt(-2 * Math.log(1 - p)) : null;
  if (q !== null) {
    const x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    return p < 0.5 ? x : -x;
  }
  const r = p - 0.5, s2 = r * r;
  return (((((a[0] * s2 + a[1]) * s2 + a[2]) * s2 + a[3]) * s2 + a[4]) * s2 + a[5]) * r / (((((b[0] * s2 + b[1]) * s2 + b[2]) * s2 + b[3]) * s2 + b[4]) * s2 + 1);
}

// Deflated Sharpe: N denemede en iyi Sharpe'ın şansla bu kadar yüksek çıkmama olasılığı (0-1).
// sharpeler: tüm denemelerin mum başına Sharpe'ları. en: en iyinin { sharpe, gozlem, carpiklik, basiklik }.
export function deflatedSharpe(sharpeler, en) {
  const N = sharpeler.length;
  if (N < 2 || !(en.gozlem > 2)) return null;
  const ort = sharpeler.reduce((a, v) => a + v, 0) / N;
  const varyans = sharpeler.reduce((a, v) => a + (v - ort) ** 2, 0) / (N - 1);
  const g = 0.5772156649;
  const sr0 = Math.sqrt(varyans) * ((1 - g) * phiTers(1 - 1 / N) + g * phiTers(1 - 1 / (N * Math.E)));
  const payda = 1 - en.carpiklik * en.sharpe + (en.basiklik - 1) / 4 * en.sharpe ** 2;
  if (!(payda > 0)) return null;
  return phi((en.sharpe - sr0) * Math.sqrt(en.gozlem - 1) / Math.sqrt(payda));
}

// ------------------------------------------------------------------ tarama
// secilen: parametreler()'den seçilenler (min/max/adim kullanıcı değiştirebilir).
// secenek: { olcut, egitimOrani, enAzIslem, sinir, prop: {gunluk, azami, tur} | null, enIyiSayisi, iptal, maliyet }
// iptal: isteğe bağlı () => boolean; true dönerse tarama o ana kadarki sonuçlarla biter (iptal: true).
// ilerleme(i, toplam): isteğe bağlı; arayüz çubuk çizer. Dönen sözü arayüz bekler.
export async function tara(s, mumlar, secilen, secenek = {}, ilerleme = () => {}) {
  const { olcut = 'getiri_dusus', egitimOrani = 0.7, enAzIslem = 20, sinir = 500, prop = null, enIyiSayisi = 10, bolum = 25, iptal = null, maliyet = MALIYETSIZ } = secenek;
  const O = OLCUTLER[olcut] ?? OLCUTLER.getiri_dusus;
  const kesim = Math.floor(mumlar.length * egitimOrani);
  const { ayarlar, toplam, ornek } = izgara(secilen, { sinir });
  const sonuclar = [];
  let gecersiz = 0, iptalEdildi = false;
  for (let i = 0; i < ayarlar.length; i++) {
    if (iptal?.()) { iptalEdildi = true; break; }
    let aday = s;
    ayarlar[i].forEach((v, j) => { aday = ayarla(aday, secilen[j].yol, v); });
    if (dogrula(aday).length) { gecersiz++; continue; }
    const e = provaAralik(aday, mumlar, 0, kesim, 0, maliyet);
    const satir = { degerler: ayarlar[i], egitim: e.istatistik, puan: O.deger(e.istatistik) };
    satir.yetersiz = e.istatistik.islem < enAzIslem;
    if (prop) satir.propIhlal = propIhlali(e.ozkaynak, e.mumlar, prop).ihlal;
    sonuclar.push(satir);
    if (i % bolum === 0) { ilerleme(i, ayarlar.length); await new Promise(r => setTimeout(r, 0)); }
  }
  if (!iptalEdildi) ilerleme(ayarlar.length, ayarlar.length);

  const uygun = sonuclar.filter(r => !r.yetersiz && !r.propIhlal);
  uygun.sort((a, b) => O.yon * (b.puan - a.puan));
  const enIyiler = uygun.slice(0, enIyiSayisi);
  // Sınama dönemi yalnız en iyiler için (seçim eğitimde yapıldı).
  for (const r of enIyiler) {
    let aday = s;
    r.degerler.forEach((v, j) => { aday = ayarla(aday, secilen[j].yol, v); });
    const t = provaAralik(aday, mumlar, kesim, mumlar.length, 300, maliyet);
    r.sinama = t.istatistik;
    r.sinamaPuan = O.deger(t.istatistik);
    if (prop) r.sinamaPropIhlal = propIhlali(t.ozkaynak, t.mumlar, prop).ihlal;
  }
  const en = enIyiler[0] ?? null;
  // Komşuluk: en iyinin tek adım komşularının eğitim puanı ortalaması / en iyinin puanı.
  let komsuluk = null;
  if (en) {
    const anahtar = v => v.join('|');
    const harita = new Map(sonuclar.map(r => [anahtar(r.degerler), r]));
    const komsular = [];
    secilen.forEach((p, j) => {
      for (const yon of [-1, 1]) {
        const v = [...en.degerler];
        v[j] = yuvarla(v[j] + yon * p.adim, p.adim);
        const r = harita.get(anahtar(v));
        if (r) komsular.push(r.puan);
      }
    });
    if (komsular.length) komsuluk = { adet: komsular.length, oran: en.puan !== 0 ? komsular.reduce((a, v) => a + v, 0) / komsular.length / en.puan : null };
  }
  const dsr = en ? deflatedSharpe(sonuclar.map(r => r.egitim.sharpe), en.egitim) : null;
  return {
    toplam, denenen: sonuclar.length, ornek, gecersiz, kesim, iptal: iptalEdildi, planlanan: ayarlar.length, maliyet,
    yetersiz: sonuclar.filter(r => r.yetersiz).length,
    propElenen: prop ? sonuclar.filter(r => r.propIhlal).length : 0,
    sonuclar, enIyiler, komsuluk, deflatedSharpe: dsr,
    uyarilar: uyarilarUret({ en, komsuluk, dsr, denenen: sonuclar.length }),
  };
}

// Sonuçları okurken kullanıcıya söylenecekler; metin anahtarları dil.js ile çevrilir.
function uyarilarUret({ en, komsuluk, dsr, denenen }) {
  const u = [];
  if (!en) { u.push({ kod: 'sonuc_yok' }); return u; }
  if (en.sinamaPuan !== undefined && en.puan > 0 && en.sinamaPuan < en.puan * 0.5) u.push({ kod: 'sinama_dusuk' });
  if (en.sinama && en.sinama.getiriYuzde < 0) u.push({ kod: 'sinama_zarar' });
  if (komsuluk && komsuluk.oran !== null && komsuluk.oran < 0.5) u.push({ kod: 'sivri_tepe' });
  if (dsr !== null && dsr < 0.95) u.push({ kod: 'sans_olabilir', dsr });
  if (denenen >= 200) u.push({ kod: 'cok_deneme', denenen });
  return u;
}
