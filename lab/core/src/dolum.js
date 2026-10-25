// Mum içi dolum modelleri: aynı mumda hem stop hem hedef görüldüğünde hangisinin önce dolduğu.
// Intrabar fill models: which of stop and target fills first when both are touched in one bar.
//
//   'stop-once'     (varsayılan) stop önce sayılır. İhtiyatlı; MT5 ile aşama C eşleşmesi bununla.
//   'acilisa-yakin' açılışa yakın uç önce: long için (açılış − düşük) ≤ (yüksek − açılış) ise düşük
//                   önce (stop), değilse yüksek önce (hedef). Eşitlikte stop.
//   'ohlc'          mum yönüne göre yol: yükselen mum (kapanış ≥ açılış) A→D→Y→K, düşen mum
//                   A→Y→D→K (yaygın test araçlarının varsayımı; MT5 üretecinin tam sırasıyla aynı olduğu doğrulanmadı).
//   'm1'            alt zaman dilimi mumları (ör. M1) verilir; ana mumun içindeki alt mumlar sırayla
//                   gezilir, ilk değen seviye dolar. Aynı alt mumda ikisi birden görülürse stop.
//                   Ana mum için alt mum yoksa stop önce sayılır ve altMumYok sayacı artar.
// Hangi model seçilirse seçilsin belirsiz mum sayısı (belirsizMum) raporlanır.

import { fark } from './esitlik.js';

export const DOLUM_MODELLERI = ['stop-once', 'acilisa-yakin', 'ohlc', 'm1'];

// Ana mum i için altMumlar içindeki [bas, son) aralığı: m.t ≤ alt.t < sonraki ana mumun t'si.
// Son ana mum için bitiş, önceki aralık uzunluğu kadar ileridir.
export function altMumAraliklari(mumlar, altMumlar) {
  const out = new Array(mumlar.length);
  let j = 0;
  for (let i = 0; i < mumlar.length; i++) {
    const bas = mumlar[i].t;
    const son = i + 1 < mumlar.length ? mumlar[i + 1].t : bas + (i > 0 ? bas - mumlar[i - 1].t : Infinity);
    while (j < altMumlar.length && altMumlar[j].t < bas) j++;
    let k = j;
    while (k < altMumlar.length && altMumlar[k].t < son) k++;
    out[i] = [j, k];
    j = k;
  }
  return out;
}

// p: pozisyon (yon, sl, tp), m: ana mum, sp: spread (short seviyeleri ask ile), alt: alt mumlar.
// 'stop' | 'hedef' döner; m1 modelinde alt mum yoksa null.
export function ilkVurus(model, p, m, sp, alt) {
  const long = p.yon > 0;
  if (model === 'acilisa-yakin') {
    const asagi = m.a - m.d, yukari = m.y - m.a;
    // long'da stop aşağıda; short'ta stop yukarıda.
    return long ? (asagi <= yukari ? 'stop' : 'hedef') : (yukari <= asagi ? 'stop' : 'hedef');
  }
  if (model === 'ohlc') {
    const yukselen = m.k >= m.a; // A→D→Y→K: önce düşük
    return long ? (yukselen ? 'stop' : 'hedef') : (yukselen ? 'hedef' : 'stop');
  }
  if (model === 'm1') {
    if (!alt || !alt.length) return null;
    for (const a of alt) {
      const s = long ? fark(a.d, p.sl) <= 0 : fark(a.y + sp, p.sl) >= 0;
      if (s) return 'stop';
      const h = long ? fark(a.y, p.tp) >= 0 : fark(a.d + sp, p.tp) <= 0;
      if (h) return 'hedef';
    }
    return 'stop'; // ana mumda ikisi de görüldü ama alt mumlarda bulunamadı: veri uyumsuz, ihtiyatlı
  }
  return 'stop';
}
