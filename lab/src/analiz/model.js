// İşlem analizi için ortak veri modeli. Saf modül: DOM yok, dil yok.
// Ayrıntı: docs/analiz-modeli.md.
//
// Hesap = {
//   kaynak: 'mt5-html' | 'mt5-xlsx' | 'kopru' | 'csv' | 'ornek',
//   para: 'USD' | null,                 // hesap para birimi (raporda varsa)
//   baslangicBakiye: number | null,     // ilk işlemden önceki bakiye (yatırımlar toplamı)
//   islemler: Islem[],                  // kapanmış pozisyonlar, kapanış zamanına göre artan
//   bakiyeHareketleri: { zaman, tutar, tur: 'yatirma'|'cekme'|'diger' }[],
//   atlanan: number,                    // okunamayan satır sayısı
// }
// Islem = {
//   id, sembol, yon: 'al'|'sat', lot,
//   acilisZamani, acilisFiyati, kapanisZamani, kapanisFiyati,   // zaman: sunucu saatinde "unix" saniye
//   sl, tp,                              // fiyat ya da null
//   komisyon, swap, brut,                // brut = komisyon ve swap hariç kâr
//   net,                                 // brut + komisyon + swap
//   sihirli, yorum,
// }
// Zamanlar MT5'in gösterdiği sunucu saatidir; saat dilimine çevrilmez (Date.UTC ile saniyeye
// dönüştürülür, böylece saat ve gün alanları raporda görünenle aynı kalır).

const sayiMi = x => typeof x === 'number' && Number.isFinite(x);
const YON = new Set(['al', 'sat']);

export function islemDuzelt(x) {
  if (!x || typeof x.sembol !== 'string' || !x.sembol.trim()) return null;
  if (!YON.has(x.yon) || !sayiMi(x.lot) || x.lot <= 0) return null;
  if (!sayiMi(x.acilisZamani) || !sayiMi(x.kapanisZamani) || x.kapanisZamani < x.acilisZamani) return null;
  const komisyon = sayiMi(x.komisyon) ? x.komisyon : 0;
  const swap = sayiMi(x.swap) ? x.swap : 0;
  let brut = sayiMi(x.brut) ? x.brut : null;
  let net = sayiMi(x.net) ? x.net : null;
  if (brut === null && net === null) return null;
  if (net === null) net = brut + komisyon + swap;
  if (brut === null) brut = net - komisyon - swap;
  const fiyat = v => (sayiMi(v) && v > 0 ? v : null);
  return {
    id: x.id ?? null,
    sembol: x.sembol.trim().slice(0, 40),
    yon: x.yon,
    lot: x.lot,
    acilisZamani: x.acilisZamani,
    acilisFiyati: fiyat(x.acilisFiyati),
    kapanisZamani: x.kapanisZamani,
    kapanisFiyati: fiyat(x.kapanisFiyati),
    sl: fiyat(x.sl),
    tp: fiyat(x.tp),
    komisyon, swap, brut, net,
    sihirli: Number.isInteger(x.sihirli) ? x.sihirli : null,
    yorum: typeof x.yorum === 'string' ? x.yorum.slice(0, 120) : '',
  };
}

export function hesapOlustur({ kaynak, para = null, baslangicBakiye = null, islemler = [], bakiyeHareketleri = [], atlanan = 0 }) {
  const temiz = [];
  let at = atlanan;
  for (const i of islemler) { const d = islemDuzelt(i); if (d) temiz.push(d); else at++; }
  temiz.sort((a, b) => a.kapanisZamani - b.kapanisZamani || a.acilisZamani - b.acilisZamani);
  const hareketler = bakiyeHareketleri
    .filter(h => h && sayiMi(h.zaman) && sayiMi(h.tutar) && h.tutar !== 0)
    .map(h => ({ zaman: h.zaman, tutar: h.tutar, tur: ['yatirma', 'cekme', 'diger'].includes(h.tur) ? h.tur : (h.tutar > 0 ? 'yatirma' : 'cekme') }))
    .sort((a, b) => a.zaman - b.zaman);
  let bas = sayiMi(baslangicBakiye) ? baslangicBakiye : null;
  if (bas === null && temiz.length) {
    const ilk = temiz.reduce((m, i) => Math.min(m, i.acilisZamani), Infinity);
    const once = hareketler.filter(h => h.zaman <= ilk).reduce((t, h) => t + h.tutar, 0);
    if (once > 0) bas = once;
  }
  return {
    kaynak,
    para: typeof para === 'string' && /^[A-Z]{3}$/.test(para) ? para : null,
    baslangicBakiye: bas,
    islemler: temiz,
    bakiyeHareketleri: hareketler,
    atlanan: at,
  };
}

// Kalibre Bridge 'islemler' belgesi (veri/kopru.js islemCoz sonucu). Bridge'de kar = net
// (profit + swap + commission + fee); swap ve komisyon ayrıca gelir.
export function koprudenHesap(h) {
  return hesapOlustur({
    kaynak: 'kopru',
    para: h?.para ?? null,
    islemler: (h?.islemler ?? []).map(i => ({
      id: i.bilet, sembol: i.sembol, yon: i.yon, lot: i.lot,
      acilisZamani: i.acilisZamani, acilisFiyati: i.acilisFiyati,
      kapanisZamani: i.kapanisZamani, kapanisFiyati: i.kapanisFiyati,
      komisyon: i.komisyon, swap: i.swap, net: i.kar, sihirli: i.sihirli, yorum: i.yorum,
    })),
    bakiyeHareketleri: h?.bakiyeHareketleri ?? [],
    atlanan: h?.atlanan ?? 0,
  });
}
