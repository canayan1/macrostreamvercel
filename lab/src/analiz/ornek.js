// SENTETİK örnek hesap: gerçek bir hesabı ya da piyasayı göstermez. Yalnız analiz sayfasını
// MT5 olmadan denemek içindir. Tohumlu üreteç: her açılışta aynı veri.
// İçine bilerek konan örüntüler (sayfanın neyi bulduğunu göstermek için):
//   - kayıptan sonraki işlemler daha büyük lotla ve daha düşük kazanma oranıyla
//   - Asya seansında daha zayıf sonuç; XAUUSD'de zarar; 5 dakikadan kısa işlemlerde zarar

import { hesapOlustur } from './model.js';

function rastgele(tohum) {
  let a = tohum >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const SEMBOLLER = [
  { s: 'EURUSD', f: 1.085, nokta: 0.00001, deger: 100000, oyna: 0.0012 },
  { s: 'GBPUSD', f: 1.27, nokta: 0.00001, deger: 100000, oyna: 0.0015 },
  { s: 'USDJPY', f: 149.5, nokta: 0.001, deger: 100000 / 149.5, oyna: 0.18 },
  { s: 'XAUUSD', f: 2380, nokta: 0.01, deger: 100, oyna: 6 },
  { s: 'US30', f: 39500, nokta: 0.1, deger: 1, oyna: 60 },
];

export function ornekHesap(tohum = 20261028) {
  const r = rastgele(tohum);
  const bas = Date.UTC(2026, 3, 1) / 1000; // 1 Nisan 2026, sunucu saati
  const islemler = [];
  let t = bas + 86400 * 1 + 3600 * 9;
  let oncekiKayip = false;
  for (let k = 0; k < 640; k++) {
    t += Math.floor(1800 + r() * 12000);
    const d = new Date(t * 1000);
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) { t += 86400 * 2; continue; }
    const sm = SEMBOLLER[Math.floor(r() * (r() < 0.25 ? 5 : 3)) % 5];
    const saat = d.getUTCHours();
    const asya = ((saat - 2 + 24) % 24) < 7; // sunucu UTC+2 varsayımıyla
    const kisa = r() < 0.18;
    const sure = kisa ? Math.floor(60 + r() * 240) : Math.floor(900 + r() * 20000);
    let lot = Math.round((0.2 + r() * 0.25) * 100) / 100;
    if (oncekiKayip) lot = Math.round(lot * (1.6 + r() * 0.5) * 100) / 100;
    let p = 0.64;
    if (oncekiKayip) p -= 0.12;
    if (asya) p -= 0.08;
    if (sm.s === 'XAUUSD') p -= 0.1;
    if (kisa) p -= 0.1;
    const kazandi = r() < p;
    const yon = r() < 0.5 ? 'al' : 'sat';
    const stopMesafe = sm.oyna * (0.6 + r() * 0.6);
    const hedef = stopMesafe * (1.3 + r() * 0.6);
    const hareket = kazandi ? hedef * (0.6 + r() * 0.4) : -stopMesafe * (0.7 + r() * 0.3);
    const acilis = Math.round((sm.f * (1 + (r() - 0.5) * 0.04)) / sm.nokta) * sm.nokta;
    const kapanis = acilis + hareket * (yon === 'al' ? 1 : -1);
    const sl = acilis - stopMesafe * (yon === 'al' ? 1 : -1);
    const brut = Math.round(hareket * sm.deger * lot * 100) / 100;
    const komisyon = sm.s === 'US30' ? 0 : -Math.round(lot * 7 * 100) / 100;
    const swap = sure > 20000 ? -Math.round(lot * 3 * 100) / 100 : 0;
    const basamak = Math.max(0, Math.round(-Math.log10(sm.nokta)));
    const yuv = x => Number(x.toFixed(basamak));
    islemler.push({
      id: 900000 + k, sembol: sm.s, yon, lot,
      acilisZamani: t, acilisFiyati: yuv(acilis), kapanisZamani: t + sure, kapanisFiyati: yuv(kapanis),
      sl: yuv(sl), tp: null, komisyon, swap, brut,
    });
    oncekiKayip = brut + komisyon + swap < 0;
    t += sure;
  }
  return hesapOlustur({
    kaynak: 'ornek', para: 'USD',
    islemler,
    bakiyeHareketleri: [{ zaman: bas, tutar: 100000, tur: 'yatirma' }],
  });
}
