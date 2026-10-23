// Kullanıcının bıraktığı veri dosyasını tanır ve okur: MT5 köprüsü JSON'u (seri) ya da CSV.
// Her iki Lab da bunu kullanır; dosya tarayıcıda okunur, hiçbir yere gönderilmez.

import { csvCoz } from './csv.js';
import { seriCoz } from './kopru.js';
import { zamanDilimiTahmin, takvimTahmin } from './kaynak.js';
import { t as ceviri } from '../dil.js';

const TUR_ADI = { durum: 'bağlantı durumu', pozisyonlar: 'pozisyon listesi' }; // t() ile çevrilir

// Dönüş: { mumlar, ad, zamanDilimi, takvim, sembol, ornek, atlanan, uyarilar }
export function dosyaCoz(metin, dosyaAdi = 'dosya', { enAz = 200 } = {}) {
  const bas = metin.replace(/^﻿/, '').trimStart();
  let sonuc;
  if (bas.startsWith('{')) {
    let n;
    try { n = JSON.parse(bas); } catch { throw new Error(ceviri('JSON dosyası bozuk ya da yarım kalmış')); }
    if (n?.kalibre_kopru === undefined) throw new Error(ceviri('bu bir Kalibre köprü dosyası değil'));
    if (n.tur !== 'seri') {
      throw new Error(ceviri('bu dosya bir {tur}; mum içeren "seri-…" dosyasını seçin', { tur: TUR_ADI[n.tur] ? ceviri(TUR_ADI[n.tur]) : ceviri("'{tur}' belgesi", { tur: n.tur }) }));
    }
    const r = seriCoz(n, { enAz });
    sonuc = {
      mumlar: r.mumlar, zamanDilimi: r.meta.zamanDilimi, takvim: r.meta.takvim, sembol: r.meta.sembol,
      ornek: r.ornek, atlanan: r.atlanan, uyarilar: r.uyarilar,
    };
  } else {
    const r = csvCoz(metin);
    if (r.mumlar.length < enAz) throw new Error(ceviri('en az {n} mum gerekir, {b} bulundu', { n: enAz, b: r.mumlar.length }));
    sonuc = {
      mumlar: r.mumlar, zamanDilimi: zamanDilimiTahmin(r.mumlar) ?? 'H1', takvim: takvimTahmin(r.mumlar),
      sembol: null, ornek: false, atlanan: r.atlanan,
      uyarilar: r.atlanan ? [ceviri('{n} satır geçersiz ya da tekrar olduğu için atlandı', { n: r.atlanan })] : [],
    };
  }
  // Rozet metni: örnek veri hiçbir zaman "kendi verin" diye gösterilmez.
  const etiket = sonuc.sembol ? `${sonuc.sembol} ${sonuc.zamanDilimi}` : dosyaAdi;
  sonuc.ad = `${ceviri(sonuc.ornek ? 'ÖRNEK (SENTETİK)' : 'KENDİ VERİN')} · ${etiket}`;
  return sonuc;
}
