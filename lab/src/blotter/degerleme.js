// Açık pozisyonun günlük MTM'i ve gecelik taşıma (kurucu yanıtları 4 ve 7).
// MTM: kullanıcının kur tablosundaki spot kurla, iskontosuz (yaklaşım, ekranda yazılır).
// Taşıma: spot tarihini (valörü) geçmiş ve hâlâ açık lotlara, her gece için T/N puanı ya da faiz
// farkından hesaplanan gecelik swap maliyeti. Uzun base pozisyonunu taşımak (sat yakın/al uzak) her
// gece −miktar × puan öder (puan pozitifse uzun base öder).

import { gunSayisi } from './model.js';

// Faiz günü sayımı: çoğu döviz ACT/360; GBP, TRY, JPY, AUD, NZD, CAD, HKD, SGD, ZAR, INR ACT/365 [DY].
const GUN365 = new Set(['GBP', 'TRY', 'JPY', 'AUD', 'NZD', 'CAD', 'HKD', 'SGD', 'ZAR', 'INR', 'PLN']);
export const gunTabani = d => (GUN365.has(d) ? 365 : 360);

// MTM (fiyat riski): miktar × (anlık spot − lotun spot karşılığı). Vadeli lotta all-in kur puan içerir;
// puan taşımadır ve fiyat riskine katılmaz (kurucu yanıtı 4 ve 8: fiyat ve puan ayrı). Lotun spot kuru
// bilinmiyorsa (yalnız all-in kur verilmiş vadeli) MTM hesaplanmaz, eksik olarak işaretlenir.
// tumKur: true → miktar × (anlık − all-in kur); yalnız motorun iç tutarlılık kontrolü için.
export function mtmHesapla(acik, cevir, { tumKur = false } = {}) {
  return acik.map(l => {
    const anlik = cevir.parite(l.base, l.kote);
    const esas = tumKur ? l.kur : l.spotKur;
    const eksikNeden = !anlik ? 'kur-yok' : esas === null || esas === undefined ? 'spot-kur-yok' : null;
    return {
      tur: 'mtm', lot: l, parite: l.parite, kote: l.kote, base: l.base, portfoy: l.portfoy, trader: l.trader,
      anlikKur: anlik, esasKur: esas, eksikNeden, kote_mtm: eksikNeden ? null : l.miktar * (anlik - esas), bacakIdler: l.bacakIdler, kapanis: l.bacak,
    };
  });
}

// girdi: { tnPuan: { 'EUR/USD': 0.0000123 } (gecelik, ondalık), faiz: { USD: 5.25, TRY: 45 } (yıllık %) }
export function tasimaHesapla(acik, cevir, tarih, girdi = {}) {
  const sonuc = [];
  for (const l of acik) {
    if (l.ndf) continue; // NDF teslimsiz; taşıma fixing'e kadar kur içinde
    const gece = gunSayisi(l.valor, tarih);
    if (gece <= 0) continue;
    let p = girdi.tnPuan?.[l.parite], kaynak = 'tn';
    if (!(Number.isFinite(p))) {
      const rb = girdi.faiz?.[l.base], rk = girdi.faiz?.[l.kote];
      const s = cevir.parite(l.base, l.kote) ?? l.kur;
      if (Number.isFinite(rb) && Number.isFinite(rk)) { p = s * (rk / 100 / gunTabani(l.kote) - rb / 100 / gunTabani(l.base)); kaynak = 'faiz'; }
      else p = null;
    }
    sonuc.push({
      tur: 'tasima', lot: l, parite: l.parite, kote: l.kote, base: l.base, portfoy: l.portfoy, trader: l.trader,
      gece, gecelikPuan: p, kaynak: p === null ? 'eksik' : kaynak, kote_tasima: p === null ? null : -l.miktar * p * gece,
      bacakIdler: l.bacakIdler, kapanis: l.bacak,
    });
  }
  return sonuc;
}
