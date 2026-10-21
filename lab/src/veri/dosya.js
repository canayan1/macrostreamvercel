// Kullanıcının bıraktığı veri dosyasını tanır ve okur: MT5 köprüsü JSON'u (seri) ya da CSV.
// Her iki Lab da bunu kullanır; dosya tarayıcıda okunur, hiçbir yere gönderilmez.

import { csvCoz } from './csv.js';
import { seriCoz } from './kopru.js';
import { zamanDilimiTahmin, takvimTahmin } from './kaynak.js';

const TUR_ADI = { durum: 'bağlantı durumu', pozisyonlar: 'pozisyon listesi' };

// Dönüş: { mumlar, ad, zamanDilimi, takvim, sembol, ornek, atlanan, uyarilar }
export function dosyaCoz(metin, dosyaAdi = 'dosya', { enAz = 200 } = {}) {
  const bas = metin.replace(/^﻿/, '').trimStart();
  let sonuc;
  if (bas.startsWith('{')) {
    let n;
    try { n = JSON.parse(bas); } catch { throw new Error('JSON dosyası bozuk ya da yarım kalmış'); }
    if (n?.kalibre_kopru === undefined) throw new Error('bu bir Kalibre köprü dosyası değil');
    if (n.tur !== 'seri') {
      throw new Error(`bu dosya bir ${TUR_ADI[n.tur] ?? `'${n.tur}' belgesi`}; mum içeren "seri-…" dosyasını seçin`);
    }
    const r = seriCoz(n, { enAz });
    sonuc = {
      mumlar: r.mumlar, zamanDilimi: r.meta.zamanDilimi, takvim: r.meta.takvim, sembol: r.meta.sembol,
      ornek: r.ornek, atlanan: r.atlanan, uyarilar: r.uyarilar,
    };
  } else {
    const r = csvCoz(metin);
    if (r.mumlar.length < enAz) throw new Error(`en az ${enAz} mum gerekir, ${r.mumlar.length} bulundu`);
    sonuc = {
      mumlar: r.mumlar, zamanDilimi: zamanDilimiTahmin(r.mumlar) ?? 'H1', takvim: takvimTahmin(r.mumlar),
      sembol: null, ornek: false, atlanan: r.atlanan,
      uyarilar: r.atlanan ? [`${r.atlanan} satır geçersiz ya da tekrar olduğu için atlandı`] : [],
    };
  }
  // Rozet metni: örnek veri hiçbir zaman "kendi verin" diye gösterilmez.
  const etiket = sonuc.sembol ? `${sonuc.sembol} ${sonuc.zamanDilimi}` : dosyaAdi;
  sonuc.ad = sonuc.ornek ? `ÖRNEK (SENTETİK) · ${etiket}` : `KENDİ VERİN · ${etiket}`;
  return sonuc;
}
