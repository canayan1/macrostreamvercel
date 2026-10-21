// MT5 köprüsü veri sözleşmesi, sürüm 1. Ayrıntılar: docs/kopru.md
//
// Motor (MT5 tarafı) üç tür belge üretir; Lab bunları okur:
//   durum      : kalp atışı. Hangi seriler var, bağlantı canlı mı.
//   seri       : bir sembol ve zaman dilimi için mumlar.
//   pozisyonlar: açık pozisyonlar ve hesap özeti.
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

export const KOPRU_SURUM = 1;

// Varlık sınıfı → varsayılan işlem takvimi. Motor takvimi ayrıca bildirirse o kullanılır.
export const SINIFLAR = {
  forex: 'bes24', metal: 'bes24', emtia: 'bes24', endeks: 'bes24',
  hisse: 'borsa', kripto: 'yedi24', diger: 'bes24',
};

const YON = ['al', 'sat'];
const VARSAYILAN_ARALIK = 5; // sn; motor yazmaAraligiSn bildirmezse

function surumDenetle(n, tur) {
  if (!n || typeof n !== 'object') throw new Error(`${tur}: geçerli bir JSON nesnesi değil`);
  if (n.kalibre_kopru !== KOPRU_SURUM) {
    throw new Error(`${tur}: desteklenmeyen köprü sürümü (${n.kalibre_kopru ?? 'yok'}); beklenen ${KOPRU_SURUM}`);
  }
  // Belgeler tek bir kanaldan da gelebilir; tür alanı karışmayı önler.
  if (n.tur !== tur) throw new Error(`${tur} bekleniyordu, '${n.tur ?? 'tür yok'}' geldi`);
}

const sayi = v => typeof v === 'number' && Number.isFinite(v);

// ------------------------------------------------------------------ seri
// { kalibre_kopru, tur: "seri", sembol, zamanDilimi, uretildi, kaynak?: "mt5"|"ornek", meta: { sinif, takvim?, nokta, basamak?, hacimTuru? },
//   alanlar: ["t","a","y","d","k","h"?], mumlar: [[t,a,y,d,k,h?], ...] }
// Dönüş: { mumlar: [{t,a,y,d,k,h?}], meta: {sembol,sinif,takvim,zamanDilimi,nokta}, atlanan, uyarilar, ornek }
export function seriCoz(n, { enAz = 2 } = {}) {
  surumDenetle(n, 'seri');
  if (typeof n.sembol !== 'string' || !n.sembol.trim()) throw new Error('seri: sembol eksik');
  if (!DAKIKA[n.zamanDilimi]) throw new Error(`seri: bilinmeyen zaman dilimi '${n.zamanDilimi}'`);
  if (n.kaynak !== undefined && n.kaynak !== 'mt5' && n.kaynak !== 'ornek') throw new Error(`seri: bilinmeyen kaynak '${n.kaynak}'`);
  const m = n.meta ?? {};
  const sinif = SINIFLAR[m.sinif] ? m.sinif : 'diger';
  const takvim = TAKVIMLER[m.takvim] ? m.takvim : SINIFLAR[sinif];
  if (!Array.isArray(n.alanlar)) throw new Error('seri: alanlar listesi eksik');
  const sira = {};
  n.alanlar.forEach((a, i) => { sira[a] = i; });
  for (const g of ['t', 'a', 'y', 'd', 'k']) if (sira[g] === undefined) throw new Error(`seri: '${g}' alanı eksik`);
  if (!Array.isArray(n.mumlar)) throw new Error('seri: mumlar listesi eksik');

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
  if (mumlar.length < enAz) throw new Error(`seri: en az ${enAz} geçerli mum gerekir, ${mumlar.length} bulundu`);

  const uyarilar = [];
  const tahmin = mumlar.length > 20 ? zamanDilimiTahmin(mumlar) : null;
  if (tahmin && tahmin !== n.zamanDilimi) {
    uyarilar.push(`bildirilen zaman dilimi ${n.zamanDilimi}, mum aralıkları ise ${tahmin} gösteriyor`);
  }
  if (atlanan) uyarilar.push(`${atlanan} mum geçersiz ya da tekrar olduğu için atlandı`);

  return {
    mumlar,
    meta: { sembol: n.sembol.trim(), sinif, takvim, zamanDilimi: n.zamanDilimi, nokta: sayi(m.nokta) ? m.nokta : null },
    atlanan,
    uyarilar,
    ornek: n.kaynak === 'ornek',
  };
}

// ------------------------------------------------------------------ durum
// { kalibre_kopru, tur: "durum", uretildi (UTC unix sn), yazmaAraligiSn?, kaynak: "mt5"|"ornek",
//   terminal: { sirket, sunucu, hesapTuru: "demo"|"gercek"|"yarisma" },
//   sunucuUtcFarkiSn, seriler: [{ sembol, zamanDilimi, adet, son }], pozisyonlarVar }
// Tazelik: canli (≤ 3 yazma aralığı), gecikmeli (≤ 20 aralık), kopuk.
export function durumCoz(n, simdi = Date.now() / 1000) {
  surumDenetle(n, 'durum');
  if (!sayi(n.uretildi)) throw new Error('durum: uretildi zamanı eksik');
  if (n.kaynak !== 'mt5' && n.kaynak !== 'ornek') throw new Error(`durum: bilinmeyen kaynak '${n.kaynak}'`);
  const aralik = sayi(n.yazmaAraligiSn) && n.yazmaAraligiSn > 0 ? n.yazmaAraligiSn : VARSAYILAN_ARALIK;
  const yas = simdi - n.uretildi;
  const uyarilar = [];
  // Saat farkı: tarayıcının saati ileri ya da geri olabilir. Bir dakikadan fazla gelecekteyse belirt.
  if (yas < -60) uyarilar.push('kalp atışı gelecekte görünüyor; bilgisayar saatlerini kontrol et');
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
