// SENTETİK örnek hesap: gerçek bir hesabı ya da piyasayı göstermez. Yalnız analiz sayfasını
// MT5 olmadan denemek içindir. Tohumlu üreteç: her açılışta aynı veri.
//
// Hikâye (sayfanın neyi bulduğunu göstermek için bilerek konan örüntüler):
//   - 100.000 USD'lik bir prop sınavı hesabı, Nisan-Eylül 2026, sunucu saati UTC+2.
//   - Londra seansında EURUSD ve GBPUSD işlemleri kârlı.
//   - Kayıptan sonraki işlemler yaklaşık 1,8 kat lotla açılıyor ve daha sık kaybediyor.
//   - Cuma işlemleri daha büyük ve daha zayıf.
//   - XAUUSD ve 5 dakikadan kısa işlemler zararda; Asya seansı zayıf.
//   - 17 Temmuz 2026 cuma: art arda kayıplarla FTMO 2-Step günlük tabanına yaklaşılan gün
//     (aşılmaz).

import { hesapOlustur } from './model.js';

function rastgele(tohum) {
  let a = tohum >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// deger: 1 lotta 1 fiyat biriminin USD karşılığı (USD hesap).
const SEMBOLLER = {
  EURUSD: { f: 1.085, nokta: 0.00001, deger: 100000, oyna: 0.0011 },
  GBPUSD: { f: 1.27, nokta: 0.00001, deger: 100000, oyna: 0.0014 },
  USDJPY: { f: 149.5, nokta: 0.001, deger: 100000 / 149.5, oyna: 0.16 },
  XAUUSD: { f: 2380, nokta: 0.01, deger: 100, oyna: 5.5 },
};
const AGIRLIK = [['EURUSD', 0.42], ['GBPUSD', 0.24], ['USDJPY', 0.16], ['XAUUSD', 0.18]];
const SUNUCU_UTC = 2;
const BASLANGIC = 100000;
const RISK_USD = 500; // olağan işlemde stop mesafesindeki zarar, yaklaşık %0,5

function sembolSec(r) {
  let x = r();
  for (const [s, w] of AGIRLIK) { if ((x -= w) < 0) return s; }
  return 'EURUSD';
}

// Bir işlem kur: sembol, yön, açılış zamanı, süre, lot, sonuç R katsayısı (stop = −1R).
function islemKur(r, { id, sembol, acilis, sure, lotKat, rSonuc }) {
  const sm = SEMBOLLER[sembol];
  const yon = r() < 0.5 ? 'al' : 'sat';
  const stopMesafe = sm.oyna * (0.7 + r() * 0.5);
  // Olağan lot: stop mesafesindeki zarar yaklaşık RISK_USD
  const lot = Math.max(0.01, Math.round((RISK_USD / (stopMesafe * sm.deger)) * lotKat * 100) / 100);
  const basamak = Math.max(0, Math.round(-Math.log10(sm.nokta)));
  const yuv = x => Number(x.toFixed(basamak));
  const acilisF = yuv(sm.f * (1 + (r() - 0.5) * 0.04));
  const isaret = yon === 'al' ? 1 : -1;
  const kapanisF = yuv(acilisF + rSonuc * stopMesafe * isaret);
  const sl = yuv(acilisF - stopMesafe * isaret);
  const tp = rSonuc > 0 && r() < 0.6 ? kapanisF : null;
  const brut = Math.round((kapanisF - acilisF) * isaret * sm.deger * lot * 100) / 100;
  const komisyon = -Math.round(lot * 7 * 100) / 100;
  const geceler = Math.floor(((acilis % 86400) + sure) / 86400);
  const swap = geceler > 0 ? -Math.round(lot * 2.5 * geceler * 100) / 100 : 0;
  return { id, sembol, yon, lot, acilisZamani: acilis, acilisFiyati: acilisF, kapanisZamani: acilis + sure, kapanisFiyati: kapanisF, sl, tp, komisyon, swap, brut };
}

const netSonuc = i => i.brut + i.komisyon + i.swap;

export function ornekHesap(tohum = 20261028) {
  const r = rastgele(tohum);
  const bas = Date.UTC(2026, 3, 1) / 1000; // 1 Nisan 2026 00:00, sunucu saati
  const son = Date.UTC(2026, 8, 30) / 1000;
  const zorGun = Date.UTC(2026, 6, 17) / 1000; // 17 Temmuz 2026 cuma
  const islemler = [];
  let id = 7100000, oncekiKayip = false;

  for (let gun = bas; gun < son; gun += 86400) {
    const hg = new Date(gun * 1000).getUTCDay(); // 0 pazar
    if (hg === 0 || hg === 6) continue;
    const cuma = hg === 5;

    if (gun === zorGun) {
      // Art arda büyüyen kayıplar: kapanan bakiye günlük tabanın biraz üstünde kalır.
      const dizi = [[9.5, -1, 1.0], [11, -1, 1.6], [13.5, -1, 2.0], [15.2, -1.5, 2.6], [17.4, 0.6, 1.0]];
      for (const [saat, rs, kat] of dizi) {
        const ac = gun + Math.round(saat * 3600);
        const i = islemKur(r, { id: id++, sembol: 'EURUSD', acilis: ac, sure: 1500 + Math.floor(r() * 2400), lotKat: kat, rSonuc: rs });
        islemler.push(i); oncekiKayip = netSonuc(i) < 0;
      }
      continue;
    }

    const adet = 2 + Math.floor(r() * 4) - (r() < 0.15 ? 2 : 0);
    let saatImleci = 1 + r() * 4; // sunucu saati
    for (let k = 0; k < adet; k++) {
      saatImleci += 1 + r() * 5;
      if (saatImleci > 22.5) break;
      const ac = gun + Math.round(saatImleci * 3600);
      const utc = (((Math.floor(saatImleci) - SUNUCU_UTC) % 24) + 24) % 24;
      const londra = utc >= 7 && utc < 12;
      const asya = utc < 7;
      const sembol = sembolSec(r);
      const kisa = r() < 0.16;
      const sure = kisa ? Math.floor(60 + r() * 230) : Math.floor(1200 + r() * (r() < 0.12 ? 90000 : 16000));

      let lotKat = 0.85 + r() * 0.3;
      if (oncekiKayip) lotKat *= 1.6 + r() * 0.4;
      if (cuma) lotKat *= 1.35;

      let p = 0.6;
      if (londra && (sembol === 'EURUSD' || sembol === 'GBPUSD')) p += 0.15;
      if (asya) p -= 0.08;
      if (sembol === 'XAUUSD') p -= 0.1;
      if (kisa) p -= 0.12;
      if (oncekiKayip) p -= 0.17;
      if (cuma) p -= 0.1;
      const kazandi = r() < p;
      const rSonuc = kazandi ? 1.2 + r() * 1.1 : -(0.75 + r() * 0.3);

      const i = islemKur(r, { id: id++, sembol, acilis: ac, sure, lotKat, rSonuc });
      islemler.push(i);
      oncekiKayip = netSonuc(i) < 0;
      saatImleci += sure / 3600;
    }
  }
  return hesapOlustur({
    kaynak: 'ornek', para: 'USD',
    islemler,
    bakiyeHareketleri: [{ zaman: bas, tutar: BASLANGIC, tur: 'yatirma' }],
  });
}
