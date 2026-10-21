// Varlıktan bağımsız veri katmanı.
//
// Lab ve modeller yalnız şu sözleşmeyi bilir:
//   mumlar: [{ t (unix sn), a, y, d, k, h (hacim, isteğe bağlı) }]
//   meta:   { sembol, sinif, takvim, zamanDilimi, nokta }
// Veri her zaman kullanıcının kendi kaynağından gelir (MT5 Bağlayıcı, kendi borsa hesabı,
// kendi dışa aktardığı CSV) ve kullanıcının makinesinden çıkmaz.
//
// Kaynaklar:
//   csv      : MT5 "Dışa aktar", borsa kline CSV'si ya da genel OHLCV (bu dosya)
//   sentetik : sentetik.js
//   mt5      : köprü sözleşmesi kopru.js; taşıma yolu karar bekliyor, bkz. docs/kopru.md
//   borsa    : kullanıcının tarayıcısından borsanın açık API'si — planlandı, bkz. docs/kripto-ve-modeller.md

export const DAKIKA = { M1: 1, M5: 5, M15: 15, M30: 30, H1: 60, H4: 240, D1: 1440, W1: 10080 };

// İşlem takvimleri: yılda kaç işlem günü ve günde kaç dakika işlem var.
export const TAKVIMLER = {
  yedi24: { ad: '7/24 (kripto)', gun: 365, dakika: 1440 },
  bes24: { ad: '5/24 (forex, emtia CFD)', gun: 260, dakika: 1440 },
  borsa: { ad: 'Borsa seansı (6,5 saat)', gun: 252, dakika: 390 },
};

// Yıllıklandırma için yıldaki dönem sayısı. Oynaklık × √(dönem) = yıllık oynaklık.
export function yillikDonem(zamanDilimi, takvim = 'bes24') {
  const t = TAKVIMLER[takvim] ?? TAKVIMLER.bes24;
  const dk = DAKIKA[zamanDilimi];
  if (!dk) throw new Error(`bilinmeyen zaman dilimi: ${zamanDilimi}`);
  if (dk >= 10080) return 52;
  if (dk >= 1440) return t.gun;
  return t.gun * Math.floor(t.dakika / dk);
}

// Ardışık mumlar arasındaki en sık aralıktan zaman dilimini tahmin eder.
export function zamanDilimiTahmin(mumlar) {
  const say = {};
  for (let i = 1; i < Math.min(mumlar.length, 500); i++) {
    const d = Math.round((mumlar[i].t - mumlar[i - 1].t) / 60);
    say[d] = (say[d] ?? 0) + 1;
  }
  const dk = Number(Object.entries(say).sort((a, b) => b[1] - a[1])[0]?.[0]);
  return Object.entries(DAKIKA).find(([, v]) => v === dk)?.[0] ?? null;
}

// Hafta sonu mumu varsa 7/24 piyasadır.
export function takvimTahmin(mumlar) {
  const hs = mumlar.filter(m => { const g = new Date(m.t * 1000).getUTCDay(); return g === 0 || g === 6; }).length;
  return hs / mumlar.length > 0.1 ? 'yedi24' : 'bes24';
}
