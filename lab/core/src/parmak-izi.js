// Determinizm parmak izi: sabit bir girdide motorun temel çıktılarını özetler. Aynı motor sürümü
// her JavaScript motorunda (V8, SpiderMonkey, JavaScriptCore) aynı parmak izini vermelidir.
// Determinism fingerprint: hashes key engine outputs on a fixed input.
//
// Girdi serisi yalnız tamsayı aritmetiğiyle üretilir (Math.log/exp/cos kullanılmaz), böylece veri
// motordan bağımsızdır. Parçalar ayrı özetlenir, fark çıkarsa hangi bölümün etkilendiği görülür:
//   temel     SMA, EMA, RSI, ATR, ADX, BB, MACD (yalnız + − × ÷ ve karekök)
//   oynaklik  EWMA_VOL, YZ_VOL, GARCH_VOL (Math.log / Math.exp kullanır)
//   prova     SMA kesişim stratejisinin işlem listesi ve istatistiği
//   istatistik phi, phiTers, DSR, PBO (Math.exp / Math.log kullanır)
// Tarayıcıda: geliştirici konsolunda
//   (await import('/lab/core/src/index.js')).parmakIzi()
// çağrılır ve sonuç Node'daki değerle (npm test, lab/test/core.test.mjs) karşılaştırılır.

import { MOTOR_SURUMU } from './surum.js';
import { kanonik, sha256 } from './manifest.js';
import { hesapla } from './gostergeler.js';
import { prova } from './motor.js';
import { phi, phiTers } from './normal.js';
import { dsrCekirdek, pboCscv } from './asiri-uyum.js';

// Tamsayı doğrusal eşlik üreteci (Numerical Recipes sabitleri, 2^32 modunda): tam belirli.
function lcg(tohum) {
  let x = tohum >>> 0;
  return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x; };
}

export function sabitSeri(adet = 1200) {
  const r = lcg(20261025);
  const mumlar = [];
  let p = 1100000; // fiyat × 1e6, tamsayı
  let t = 1767225600; // 2026-01-01 00:00 UTC
  for (let i = 0; i < adet; i++) {
    const a = p;
    const adim = (r() % 2001) - 1000 + (i % 400 < 200 ? 60 : -60); // rejimli rastgele yürüyüş
    const k = a + adim;
    const y = Math.max(a, k) + (r() % 600);
    const d = Math.min(a, k) - (r() % 600);
    mumlar.push({ t, a: a / 1e6, y: y / 1e6, d: d / 1e6, k: k / 1e6 });
    p = k; t += 3600;
  }
  return mumlar;
}

const TEMEL = {
  sma: { tip: 'SMA', periyot: 20 }, ema: { tip: 'EMA', periyot: 50 }, rsi: { tip: 'RSI', periyot: 14 },
  atr: { tip: 'ATR', periyot: 14 }, adx: { tip: 'ADX', periyot: 14 }, bb: { tip: 'BB', periyot: 20, sapma: 2 },
  macd: { tip: 'MACD', hizli: 12, yavas: 26, sinyal: 9 },
};
const OYNAK = {
  ewma: { tip: 'EWMA_VOL', lambda: 0.94 }, yz: { tip: 'YZ_VOL', periyot: 20 },
  garch: { tip: 'GARCH_VOL', pencere: 400, yenile: 200 },
};

const STRATEJI = {
  kalibre: 1, ad: 'parmak izi', zaman_dilimi: 'H1', yon: 'iki_yon',
  gostergeler: { hizli: { tip: 'SMA', periyot: 20 }, yavas: { tip: 'SMA', periyot: 50 }, atr: { tip: 'ATR', periyot: 14 } },
  giris: {
    long: { hepsi: [{ sol: 'hizli', op: 'yukari_keser', sag: 'yavas' }] },
    short: { hepsi: [{ sol: 'hizli', op: 'asagi_keser', sag: 'yavas' }] },
  },
  cikis: { stop: { tip: 'atr', gosterge: 'atr', carpan: 2 }, hedef: { tip: 'r', deger: 2 } },
  risk: { islem_basi_yuzde: 1, max_acik_pozisyon: 1 },
};

export function parmakIzi() {
  const mumlar = sabitSeri();
  const temel = sha256(kanonik(hesapla(TEMEL, mumlar)));
  const oynaklik = sha256(kanonik(hesapla(OYNAK, mumlar)));
  const p = prova(STRATEJI, mumlar, { baslangic: 10000 });
  const provaOzet = sha256(kanonik({ islemler: p.islemler, istatistik: p.istatistik, son: p.ozkaynak.at(-1) }));
  // Küçük, sabit bir getiri matrisi: 6 ayar × 64 dönem (tamsayı üreteçten).
  const r = lcg(7);
  const matris = Array.from({ length: 6 }, (_, i) => Array.from({ length: 64 }, () => ((r() % 2001) - 1000 + i * 15) / 1e5));
  const istatistik = sha256(kanonik({
    phi: [-3, -1.5, -0.25, 0, 0.4, 1.96, 3.1].map(phi),
    phiTers: [0.001, 0.025, 0.3, 0.5, 0.8, 0.975, 0.999].map(phiTers),
    dsr: dsrCekirdek({ sr: 0.08, T: 1250, carpiklik: -0.3, basiklik: 4.2, N: 46, varyans: 0.0004 }),
    pbo: pboCscv(matris, { S: 8 }),
  }));
  const parcalar = { temel, oynaklik, prova: provaOzet, istatistik };
  return { surum: MOTOR_SURUMU, parmakIzi: sha256(kanonik(parcalar)), parcalar };
}
