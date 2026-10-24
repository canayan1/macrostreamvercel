// MT5 köprüsü veri sözleşmesi, sürüm 1. Ayrıntılar: docs/kopru.md
//
// Motor (MT5 tarafı) üç tür belge üretir; Lab bunları okur:
//   durum      : kalp atışı. Hangi seriler var, bağlantı canlı mı.
//   seri       : bir sembol ve zaman dilimi için mumlar.
//   pozisyonlar: açık pozisyonlar ve hesap özeti.
//   kotalar    : Market Watch'taki sembollerin son fiyatları (Panom, sözleşme eki 1b).
//   islemler   : kapanmış işlemler ve bakiye hareketleri (Panom, sözleşme eki 1b).
//
// Sözleşme taşıma yolundan bağımsızdır: belgeler yerel bir bağlayıcıdan, şifreli bir
// röleden ya da kullanıcının elle yüklediği bir dosyadan gelse de aynı biçimdedir.
// Buradaki işlevler yalnız ayrıştırır ve doğrular; ağ ya da dosya erişimi yapmaz.
//
// Zaman: mum zamanları (t) aracı kurumun SUNUCU saatidir, MT5 grafiğinde görülen saat.
// UTC'ye çevrilmez; çünkü geçmiş mumları bugünkü saat farkıyla çevirmek yaz saati
// geçişlerinde bir saatlik kayma üretir. Kalp atışı zamanı (uretildi) ise gerçek UTC'dir,
// tazelik ölçümü tarayıcının saatiyle karşılaştırıldığı için.

import { DAKIKA, TAKVIMLER, zamanDilimiTahmin } from './kaynak.js';

import { t as ceviri } from '../dil.js';

export const KOPRU_SURUM = 1;

// Varlık sınıfı → varsayılan işlem takvimi. Motor takvimi ayrıca bildirirse o kullanılır.
export const SINIFLAR = {
  forex: 'bes24', metal: 'bes24', emtia: 'bes24', endeks: 'bes24',
  hisse: 'borsa', kripto: 'yedi24', diger: 'bes24',
};

const YON = ['al', 'sat'];
// Belgeyi üreten: MT5 köprüsü, sentetik örnek ya da Tradier istemcisi (veri/tradier.js).
export const KAYNAKLAR = ['mt5', 'ornek', 'tradier'];
const VARSAYILAN_ARALIK = 5; // sn; motor yazmaAraligiSn bildirmezse

function surumDenetle(n, tur) {
  if (!n || typeof n !== 'object') throw new Error(ceviri('{tur}: geçerli bir JSON nesnesi değil', { tur }));
  if (n.kalibre_kopru !== KOPRU_SURUM) {
    throw new Error(ceviri('{tur}: desteklenmeyen köprü sürümü ({v}); beklenen {b}', { tur, v: n.kalibre_kopru ?? ceviri('yok'), b: KOPRU_SURUM }));
  }
  // Belgeler tek bir kanaldan da gelebilir; tür alanı karışmayı önler.
  if (n.tur !== tur) throw new Error(ceviri("{tur} bekleniyordu, '{g}' geldi", { tur, g: n.tur ?? ceviri('tür yok') }));
}

const sayi = v => typeof v === 'number' && Number.isFinite(v);

// ------------------------------------------------------------------ seri
// { kalibre_kopru, tur: "seri", sembol, zamanDilimi, uretildi, kaynak?: "mt5"|"ornek"|"tradier", meta: { sinif, takvim?, nokta, basamak?, hacimTuru? },
//   alanlar: ["t","a","y","d","k","h"?], mumlar: [[t,a,y,d,k,h?], ...] }
// Dönüş: { mumlar: [{t,a,y,d,k,h?}], meta: {sembol,sinif,takvim,zamanDilimi,nokta}, atlanan, uyarilar, ornek }
export function seriCoz(n, { enAz = 2 } = {}) {
  surumDenetle(n, 'seri');
  if (typeof n.sembol !== 'string' || !n.sembol.trim()) throw new Error(ceviri('seri: sembol eksik'));
  if (!DAKIKA[n.zamanDilimi]) throw new Error(ceviri("seri: bilinmeyen zaman dilimi '{z}'", { z: n.zamanDilimi }));
  if (n.kaynak !== undefined && !KAYNAKLAR.includes(n.kaynak)) throw new Error(ceviri("seri: bilinmeyen kaynak '{k}'", { k: n.kaynak }));
  const m = n.meta ?? {};
  const sinif = SINIFLAR[m.sinif] ? m.sinif : 'diger';
  const takvim = TAKVIMLER[m.takvim] ? m.takvim : SINIFLAR[sinif];
  if (!Array.isArray(n.alanlar)) throw new Error(ceviri('seri: alanlar listesi eksik'));
  const sira = {};
  n.alanlar.forEach((a, i) => { sira[a] = i; });
  for (const g of ['t', 'a', 'y', 'd', 'k']) if (sira[g] === undefined) throw new Error(ceviri("seri: '{g}' alanı eksik", { g }));
  if (!Array.isArray(n.mumlar)) throw new Error(ceviri('seri: mumlar listesi eksik'));

  const hamlar = [];
  let atlanan = 0;
  for (const r of n.mumlar) {
    if (!Array.isArray(r)) { atlanan++; continue; }
    const x = { t: r[sira.t], a: r[sira.a], y: r[sira.y], d: r[sira.d], k: r[sira.k] };
    if (sira.h !== undefined && sayi(r[sira.h])) x.h = r[sira.h];
    const tamam = [x.t, x.a, x.y, x.d, x.k].every(sayi) && Number.isInteger(x.t) && x.d > 0 && x.y >= x.d &&
      x.a >= x.d && x.a <= x.y && x.k >= x.d && x.k <= x.y;
    if (!tamam) { atlanan++; continue; }
    hamlar.push(x);
  }
  hamlar.sort((p, q) => p.t - q.t);
  const mumlar = hamlar.filter((x, i) => i === 0 || x.t !== hamlar[i - 1].t);
  atlanan += hamlar.length - mumlar.length;
  if (mumlar.length < enAz) throw new Error(ceviri('seri: en az {n} geçerli mum gerekir, {b} bulundu', { n: enAz, b: mumlar.length }));

  const uyarilar = [];
  const tahmin = mumlar.length > 20 ? zamanDilimiTahmin(mumlar) : null;
  if (tahmin && tahmin !== n.zamanDilimi) {
    uyarilar.push(ceviri('bildirilen zaman dilimi {z}, mum aralıkları ise {t} gösteriyor', { z: n.zamanDilimi, t: tahmin }));
  }
  if (atlanan) uyarilar.push(ceviri('{n} mum geçersiz ya da tekrar olduğu için atlandı', { n: atlanan }));

  return {
    mumlar,
    meta: { sembol: n.sembol.trim(), sinif, takvim, zamanDilimi: n.zamanDilimi, nokta: sayi(m.nokta) ? m.nokta : null },
    atlanan,
    uyarilar,
    ornek: n.kaynak === 'ornek',
  };
}

// ------------------------------------------------------------------ durum
// { kalibre_kopru, tur: "durum", uretildi (UTC unix sn), yazmaAraligiSn?, kaynak: "mt5"|"ornek"|"tradier",
//   terminal: { sirket, sunucu, hesapTuru: "demo"|"gercek"|"yarisma" },
//   sunucuUtcFarkiSn, seriler: [{ sembol, zamanDilimi, adet, son }], pozisyonlarVar, kotalarVar?, islemlerVar? }
// Tazelik: canli (≤ 3 yazma aralığı), gecikmeli (≤ 20 aralık), kopuk.
export function durumCoz(n, simdi = Date.now() / 1000) {
  surumDenetle(n, 'durum');
  if (!sayi(n.uretildi)) throw new Error(ceviri('durum: uretildi zamanı eksik'));
  if (!KAYNAKLAR.includes(n.kaynak)) throw new Error(ceviri("durum: bilinmeyen kaynak '{k}'", { k: n.kaynak }));
  const aralik = sayi(n.yazmaAraligiSn) && n.yazmaAraligiSn > 0 ? n.yazmaAraligiSn : VARSAYILAN_ARALIK;
  const yas = simdi - n.uretildi;
  const uyarilar = [];
  // Saat farkı: tarayıcının saati ileri ya da geri olabilir. Bir dakikadan fazla gelecekteyse belirt.
  if (yas < -60) uyarilar.push(ceviri('kalp atışı gelecekte görünüyor; bilgisayar saatlerini kontrol et'));
  const y = Math.max(0, yas);
  const tazelik = y <= 3 * aralik ? 'canli' : y <= 20 * aralik ? 'gecikmeli' : 'kopuk';

  const t = n.terminal ?? {};
  const seriler = (Array.isArray(n.seriler) ? n.seriler : [])
    .filter(s => s && typeof s.sembol === 'string' && DAKIKA[s.zamanDilimi])
    .map(s => ({ sembol: s.sembol, zamanDilimi: s.zamanDilimi, adet: sayi(s.adet) ? s.adet : null, son: sayi(s.son) ? s.son : null }));

  return {
    kaynak: n.kaynak,
    ornek: n.kaynak === 'ornek',
    uretildi: n.uretildi,
    yas: y,
    tazelik,
    terminal: {
      sirket: typeof t.sirket === 'string' ? t.sirket : null,
      sunucu: typeof t.sunucu === 'string' ? t.sunucu : null,
      hesapTuru: ['demo', 'gercek', 'yarisma'].includes(t.hesapTuru) ? t.hesapTuru : null,
    },
    sunucuUtcFarkiSn: sayi(n.sunucuUtcFarkiSn) ? n.sunucuUtcFarkiSn : null,
    seriler,
    pozisyonlarVar: n.pozisyonlarVar === true,
    kotalarVar: n.kotalarVar === true,
    islemlerVar: n.islemlerVar === true,
    uyarilar,
  };
}

// ------------------------------------------------------------------ pozisyonlar
// { kalibre_kopru, tur: "pozisyonlar", uretildi, para, bakiye?, varlik?,
//   pozisyonlar: [{ bilet, sembol, yon: "al"|"sat", lot, acilisZamani, acilisFiyati,
//                   guncelFiyat, stop?, hedef?, kar, sihirli? }] }
// Kalibre motorunun açtığı pozisyonlar sihirli numarasıyla ayırt edilir.
export function pozisyonCoz(n) {
  surumDenetle(n, 'pozisyonlar');
  if (!Array.isArray(n.pozisyonlar)) throw new Error('pozisyonlar: pozisyonlar listesi eksik');
  let atlanan = 0;
  const pozisyonlar = [];
  for (const p of n.pozisyonlar) {
    const tamam = p && typeof p.sembol === 'string' && YON.includes(p.yon) && sayi(p.lot) && p.lot > 0 &&
      sayi(p.acilisFiyati) && sayi(p.guncelFiyat) && sayi(p.kar) && Number.isInteger(p.acilisZamani);
    if (!tamam) { atlanan++; continue; }
    pozisyonlar.push({
      bilet: p.bilet ?? null, sembol: p.sembol, yon: p.yon, lot: p.lot,
      acilisZamani: p.acilisZamani, acilisFiyati: p.acilisFiyati, guncelFiyat: p.guncelFiyat,
      stop: sayi(p.stop) && p.stop > 0 ? p.stop : null,
      hedef: sayi(p.hedef) && p.hedef > 0 ? p.hedef : null,
      kar: p.kar, sihirli: Number.isInteger(p.sihirli) ? p.sihirli : null,
    });
  }
  return {
    para: typeof n.para === 'string' ? n.para : null,
    bakiye: sayi(n.bakiye) ? n.bakiye : null,
    varlik: sayi(n.varlik) ? n.varlik : null,
    pozisyonlar,
    atlanan,
  };
}

// ------------------------------------------------------------------ kotalar (Panom)
// { kalibre_kopru, tur: "kotalar", uretildi, sunucuSaati?, kotalar: [{ sembol, tanim?, sinif?, basamak?, nokta?,
//   alis, satis, zaman?, gunAcilis?, gunYuksek?, gunDusuk?, oncekiKapanis? }] }
// Günlük değişim burada hesaplanır: (alis - oncekiKapanis) / oncekiKapanis. Fiyatsız satır atlanır.
export function kotaCoz(n) {
  surumDenetle(n, 'kotalar');
  if (!Array.isArray(n.kotalar)) throw new Error(ceviri('kotalar: kotalar listesi eksik'));
  let atlanan = 0;
  const kotalar = [];
  for (const k of n.kotalar) {
    const tamam = k && typeof k.sembol === 'string' && k.sembol.trim() && sayi(k.alis) && sayi(k.satis) && k.alis > 0 && k.satis > 0;
    if (!tamam) { atlanan++; continue; }
    const basamak = Number.isInteger(k.basamak) && k.basamak >= 0 && k.basamak <= 10 ? k.basamak : null;
    const nokta = sayi(k.nokta) && k.nokta > 0 ? k.nokta : (basamak !== null ? Math.pow(10, -basamak) : null);
    const onceki = sayi(k.oncekiKapanis) && k.oncekiKapanis > 0 ? k.oncekiKapanis : null;
    kotalar.push({
      sembol: k.sembol.trim(),
      tanim: typeof k.tanim === 'string' ? k.tanim : '',
      sinif: typeof k.sinif === 'string' && k.sinif in SINIFLAR ? k.sinif : 'diger',
      basamak, nokta,
      alis: k.alis, satis: k.satis,
      makas: nokta ? Math.round((k.satis - k.alis) / nokta) : null, // puan
      zaman: Number.isInteger(k.zaman) ? k.zaman : null,
      gunAcilis: sayi(k.gunAcilis) && k.gunAcilis > 0 ? k.gunAcilis : null,
      gunYuksek: sayi(k.gunYuksek) && k.gunYuksek > 0 ? k.gunYuksek : null,
      gunDusuk: sayi(k.gunDusuk) && k.gunDusuk > 0 ? k.gunDusuk : null,
      oncekiKapanis: onceki,
      gunlukDegisim: onceki ? (k.alis - onceki) / onceki : null,
    });
  }
  return { uretildi: sayi(n.uretildi) ? n.uretildi : null, sunucuSaati: sayi(n.sunucuSaati) ? n.sunucuSaati : null, kotalar, atlanan };
}

// ------------------------------------------------------------------ islemler (Panom)
// { kalibre_kopru, tur: "islemler", uretildi, para?, gunSayisi?,
//   islemler: [{ bilet, sembol, yon, lot, acilisZamani, acilisFiyati, kapanisZamani, kapanisFiyati, kar, swap?, komisyon?, sihirli?, yorum? }],
//   bakiyeHareketleri: [{ zaman, tutar, tur: "yatirma"|"cekme"|"diger" }] }
// Bir satır bir kapanıştır (kısmi kapanışlar ayrı). Zamanlar sunucu saatidir. kar: o kapanışın net sonucu.
const HAREKET = ['yatirma', 'cekme', 'diger'];
export function islemCoz(n) {
  surumDenetle(n, 'islemler');
  if (!Array.isArray(n.islemler)) throw new Error(ceviri('islemler: islemler listesi eksik'));
  let atlanan = 0;
  const islemler = [];
  for (const i of n.islemler) {
    const tamam = i && typeof i.sembol === 'string' && i.sembol.trim() && YON.includes(i.yon) && sayi(i.lot) && i.lot > 0 &&
      Number.isInteger(i.acilisZamani) && Number.isInteger(i.kapanisZamani) && i.kapanisZamani >= i.acilisZamani &&
      sayi(i.acilisFiyati) && sayi(i.kapanisFiyati) && sayi(i.kar);
    if (!tamam) { atlanan++; continue; }
    islemler.push({
      bilet: Number.isInteger(i.bilet) ? i.bilet : null, sembol: i.sembol.trim(), yon: i.yon, lot: i.lot,
      acilisZamani: i.acilisZamani, acilisFiyati: i.acilisFiyati, kapanisZamani: i.kapanisZamani, kapanisFiyati: i.kapanisFiyati,
      kar: i.kar, swap: sayi(i.swap) ? i.swap : 0, komisyon: sayi(i.komisyon) ? i.komisyon : 0,
      sihirli: Number.isInteger(i.sihirli) ? i.sihirli : null, yorum: typeof i.yorum === 'string' ? i.yorum : '',
    });
  }
  islemler.sort((a, b) => a.kapanisZamani - b.kapanisZamani || (a.bilet ?? 0) - (b.bilet ?? 0));
  const bakiyeHareketleri = [];
  for (const h of Array.isArray(n.bakiyeHareketleri) ? n.bakiyeHareketleri : []) {
    if (!h || !Number.isInteger(h.zaman) || !sayi(h.tutar)) { atlanan++; continue; }
    bakiyeHareketleri.push({ zaman: h.zaman, tutar: h.tutar, tur: HAREKET.includes(h.tur) ? h.tur : (h.tutar >= 0 ? 'yatirma' : 'cekme') });
  }
  bakiyeHareketleri.sort((a, b) => a.zaman - b.zaman);
  return {
    uretildi: sayi(n.uretildi) ? n.uretildi : null,
    para: typeof n.para === 'string' ? n.para : null,
    gunSayisi: Number.isInteger(n.gunSayisi) && n.gunSayisi > 0 ? n.gunSayisi : null,
    islemler, bakiyeHareketleri, atlanan,
  };
}
