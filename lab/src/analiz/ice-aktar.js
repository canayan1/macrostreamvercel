// Dosya içe aktarma yönlendiricisi: MT5 raporu (HTML/XLSX) mı, kendi tablon (CSV/XLSX) mı?
// Saf modül: DOM yok. Dönüş biçimi:
//   { tur: 'hesap', hesap, rapor? }   rapor = tablodanHesap sonucu (satır hataları, öneriler)
//   { tur: 'eslesme', satirlar, rapor }  sütunlar tanınmadı: kullanıcı eşleştirmeli
//   { tur: 'bos' }                     kapanmış işlem yok

import { raporuOku, xlsxSayfalari, baytlariMetneCevir, satirlardanHesap } from './mt5-rapor.js';
import { csvSatirlari, tablodanHesap } from './csv-ice.js';

// XLSX'te önce "Trades" adlı sayfa (büyük/küçük harf ve "Trades (…)" gibi ekler önemsiz), yoksa
// "İşlemler", yoksa ilk sayfa.
export function islemSayfasi(sayfalar) {
  const ad = s => s.ad.trim().toLowerCase();
  return sayfalar.find(s => /^trades\b/.test(ad(s)))
    ?? sayfalar.find(s => /^(işlemler|islemler)\b/.test(ad(s)))
    ?? sayfalar[0];
}

export async function dosyadanHesap(ad, bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  const zipMi = b[0] === 0x50 && b[1] === 0x4b;
  if (zipMi || /\.xlsx$/i.test(ad)) {
    const sayfalar = await xlsxSayfalari(b);
    // MT5 Open XML raporu tek sayfadır ve "Positions" bölümü taşır.
    const mt5 = satirlardanHesap(sayfalar[0].satirlar, 'mt5-xlsx');
    if (mt5.islemler.length) return { tur: 'hesap', hesap: mt5 };
    return tablodan(islemSayfasi(sayfalar).satirlar, 'xlsx');
  }
  const mt5 = await raporuOku(ad, b);
  if (mt5) return mt5.islemler.length ? { tur: 'hesap', hesap: mt5 } : { tur: 'bos', hesap: mt5 };
  return tablodan(csvSatirlari(baytlariMetneCevir(b)), 'csv');
}

export function tablodan(satirlar, kaynak, eslesme = null) {
  const rapor = tablodanHesap(satirlar, eslesme, { kaynak });
  if (!rapor.hesap) return { tur: 'eslesme', satirlar, rapor };
  if (!rapor.hesap.islemler.length) return { tur: 'bos', hesap: rapor.hesap, rapor, satirlar };
  return { tur: 'hesap', hesap: rapor.hesap, rapor, satirlar };
}
