// "Asla hata yapmayan tablo" için görünür mutabakat kontrolleri (kurucu yanıtı 14).
// Her kontrol { id, ad, tamam: true|false|null (kontrol edilemedi), detay, satirlar? } döner.
// Hiçbir kontrol sessizce engellemez: başarısız olan kırmızı gösterilir.

import { kzHesapla } from './kz.js';
import { mtmHesapla } from './degerleme.js';
import { grupla, BOYUTLAR } from './analiz.js';

const yakinMi = (a, b, tol = 0.005) => Math.abs(a - b) <= tol + 1e-9 * Math.max(Math.abs(a), Math.abs(b));

export function mutabakat(aktarim, analiz, bacaklar, ayar = {}) {
  const k = [];
  const o = aktarim.ozet;

  // 1. Satır sayıları: okunan = başlık öncesi + başlık + boş + toplam + aktarılan + dışlanan + hatalı.
  const toplamSatir = o.baslikOncesi + o.baslikSatiri + o.bosSatir + o.toplamSatiri + o.aktarilan + o.dislanan + o.hatali;
  k.push({ id: 'satir', ad: 'Satır sayıları', tamam: toplamSatir === o.okunanSatir, detay: { ...o, toplamSatir } });

  // 2. Alt toplamlar = genel toplam (her gruplama için).
  const fark = [];
  for (const b of BOYUTLAR) {
    const g = grupla(analiz.katkilar, b.id);
    const s = g.reduce((t, x) => t + x.toplam, 0);
    if (!yakinMi(s, analiz.toplam.toplam)) fark.push({ boyut: b.id, altToplam: s, genel: analiz.toplam.toplam });
  }
  k.push({ id: 'alt-toplam', ad: 'Alt toplamlar genel toplama eşit', tamam: fark.length === 0, detay: { boyut: BOYUTLAR.length, fark } });

  // 3. Bacak aritmetiği: |kote| = |base| × kur (yuvarlama payı).
  const aritmetik = bacaklar.filter(b => Math.abs(Math.abs(b.koteTutar) - Math.abs(b.baseTutar) * b.kur) > Math.max(0.011, 5e-4 * Math.abs(b.koteTutar)));
  k.push({ id: 'aritmetik', ad: 'Her bacakta karşı tutar = tutar × kur', tamam: aritmetik.length === 0, detay: { hatali: aritmetik.map(b => b.satirNo) } });

  // 4. Döviz bazında nominal toplamları (bilgi; her zaman gösterilir).
  const nominal = {};
  for (const b of bacaklar) for (const [d, t] of [[b.base, b.baseTutar], [b.kote, b.koteTutar]]) {
    nominal[d] ??= { alis: 0, satis: 0 };
    if (t > 0) nominal[d].alis += t; else nominal[d].satis += -t;
  }
  k.push({ id: 'nominal', ad: 'Döviz bazında bacak nominalleri', tamam: true, detay: nominal });

  // 5. TL karşılığı sütunu ile hesaplanan karşılık.
  const tl = { uyan: 0, farkli: [], yaklasik: 0, kontrolEdilemedi: 0 };
  for (const b of bacaklar) {
    if (b.tlKarsiligi === null || b.tlKarsiligi === undefined) continue;
    let h = null, yaklasik = false;
    if (b.kote === 'TRY') h = Math.abs(b.koteTutar);
    else if (b.base === 'TRY') h = Math.abs(b.baseTutar);
    else {
      const r = analiz.cevir.parite(b.kote, 'TRY');
      if (r) { h = Math.abs(b.koteTutar) * r; yaklasik = true; }
    }
    if (h === null) { tl.kontrolEdilemedi++; continue; }
    const tol = yaklasik ? 0.005 * h : Math.max(0.011, 1e-9 * h);
    if (Math.abs(h - b.tlKarsiligi) <= tol) { tl.uyan++; if (yaklasik) tl.yaklasik++; }
    else tl.farkli.push({ satirNo: b.satirNo, blotter: b.tlKarsiligi, hesaplanan: h, yaklasik });
  }
  const tlVar = tl.uyan + tl.farkli.length + tl.kontrolEdilemedi > 0;
  k.push({ id: 'tl', ad: 'Blotter TL karşılığı ile hesaplanan', tamam: !tlVar ? null : tl.farkli.length === 0, detay: tl });

  // 6. Artık lotlar = bacak pozisyonu (anahtar bazında).
  const kz = analiz.kz;
  const poz = new Map();
  for (const b of kz.havuzBacak) {
    const a = kz.traderBazli ? `${b.portfoy}|${b.trader}|${b.parite}` : `${b.portfoy}|${b.parite}`;
    poz.set(a, (poz.get(a) ?? 0) + b.baseTutar);
  }
  const lot = new Map();
  for (const l of kz.acik) lot.set(l.anahtar, (lot.get(l.anahtar) ?? 0) + l.miktar);
  const lotFark = [];
  for (const [a, p] of poz) if (Math.abs(p - (lot.get(a) ?? 0)) > 1e-6) lotFark.push({ anahtar: a, pozisyon: p, lot: lot.get(a) ?? 0 });
  k.push({ id: 'lot', ad: 'Açık lotlar bacak pozisyonuna eşit', tamam: lotFark.length === 0, detay: { anahtar: poz.size, fark: lotFark } });

  // 7. Yöntemden bağımsızlık: FIFO ve ortalama maliyette gerçekleşen + MTM toplamı aynı olmalı
  //    (tüm açık pariteler için kur varsa).
  const digerYontem = kz.yontem === 'fifo' ? 'ortalama' : 'fifo';
  const kz2 = kzHesapla(bacaklar, { ...ayar, yontem: digerYontem, tarih: kz.tarih });
  const t1 = yontemToplam(kz, analiz.cevir), t2 = yontemToplam(kz2, analiz.cevir);
  k.push({
    id: 'yontem', ad: 'FIFO ve ortalama maliyet: gerçekleşen + MTM aynı',
    tamam: t1.eksik || t2.eksik ? null : kotaEsit(t1.kote, t2.kote), detay: { [kz.yontem]: t1.kote, [digerYontem]: t2.kote, eksikKur: t1.eksik || t2.eksik },
  });
  return k;
}

function yontemToplam(kz, cevir) {
  const kote = {};
  let eksik = false;
  const ekle = (d, t) => { kote[d] = (kote[d] ?? 0) + t; };
  for (const g of kz.gerceklesen) ekle(g.kote, g.kote_toplam);
  for (const n of kz.ndfUzlasan) ekle(n.kote, n.kote_toplam);
  for (const m of mtmHesapla(kz.acik, cevir, { tumKur: true })) { if (m.kote_mtm === null) eksik = true; else ekle(m.kote, m.kote_mtm); }
  return { kote, eksik };
}
function kotaEsit(a, b) {
  for (const d of new Set([...Object.keys(a), ...Object.keys(b)])) if (!yakinMi(a[d] ?? 0, b[d] ?? 0, 0.01)) return false;
  return true;
}
