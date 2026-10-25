// Enstrüman ve maliyet modeli, sürüm 2 (isteğe bağlı). prova(..., { enstruman }) ile açılır;
// verilmezse motor eski (sürekli miktar, kote para birimi = hesap para birimi) davranışını korur.
// Instrument and cost model v2 (opt-in).
//
// Aşama C dersi: tek bir "tick değeri"ne güvenilmez (MetaQuotes-Demo XAUUSD için 0,1 bildirir,
// gerçek değer 1,0). Kâr her zaman sözleşme büyüklüğü × fiyat farkı × (kote → hesap) kuruyla
// hesaplanır. tickDegeri verilirse yalnız denetim için kullanılır: hesaplanan değerden %1'den
// fazla saparsa uyarı yazılır.
//
// Alanlar (hepsi isteğe bağlı, varsayılanlar parantezde):
//   sozlesme      sözleşme büyüklüğü, lot başına birim (100000)
//   tickBuyuklugu fiyat adımı (verilmezse nokta)
//   tickDegeri    tick başına lot değeri, hesap para biriminde (yalnız denetim)
//   nokta         'puan' mesafelerinin fiyat karşılığı (tickBuyuklugu ?? 0,00001)
//   lotAdimi (0,01), minLot (0,01), maxLot (100)
//   baz, kote, hesap   para birimleri (ör. 'EUR', 'USD', 'USD'); kote = hesap ise kur 1
//   donusum       { t: [unix], k: [kur] } kote → hesap kuru (1 kote biriminin hesap karşılığı);
//                 kote ≠ hesap ve baz ≠ hesap ise gerekir
//   komisyonLot   lot başına, taraf başına, hesap para biriminde (0)
//   swapLong, swapShort  lot başına gecelik, hesap para biriminde (0); negatif = ödenir
//   ucluSwapGunu  üç gecelik swap'ın işlendiği gün (0 = Pazar ... 3 = Çarşamba; varsayılan 3)
//   kaldirac      teminat = lot × sözleşme × fiyat × kur / kaldıraç
//   teminatLot    lot başına sabit teminat, hesap para biriminde (kaldirac yerine)
//   stopOut       teminat seviyesi yüzdesi; altına inince tüm pozisyonlar kapanır (50)

export const ENSTRUMAN_VARSAYILAN = Object.freeze({
  sozlesme: 100000, lotAdimi: 0.01, minLot: 0.01, maxLot: 100, komisyonLot: 0,
  swapLong: 0, swapShort: 0, ucluSwapGunu: 3, stopOut: 50,
});

const buyuk = s => (typeof s === 'string' ? s.trim().toUpperCase() : '');

export function enstrumanHazirla(e) {
  if (!e) return null;
  const x = { ...ENSTRUMAN_VARSAYILAN, ...e };
  x.baz = buyuk(e.baz); x.kote = buyuk(e.kote); x.hesap = buyuk(e.hesap);
  x.nokta = Number(e.nokta) > 0 ? Number(e.nokta) : (Number(e.tickBuyuklugu) > 0 ? Number(e.tickBuyuklugu) : 0.00001);
  for (const k of ['sozlesme', 'lotAdimi', 'minLot', 'maxLot']) if (!(Number(x[k]) > 0)) throw new Error(`enstruman.${k} pozitif olmalı`);
  x.teminatVar = Number(e.kaldirac) > 0 || Number(e.teminatLot) > 0;
  return x;
}

// Kote para biriminin hesap para birimindeki karşılığı, t anında ve enstrüman fiyatı p iken.
export function kurFonksiyonu(x) {
  if (!x.kote || !x.hesap || x.kote === x.hesap) return () => 1;
  if (x.baz && x.baz === x.hesap) return (t, p) => 1 / p;
  const d = x.donusum;
  if (!d || !Array.isArray(d.t) || !d.t.length) throw new Error(`${x.kote} → ${x.hesap} dönüşüm serisi gerekli (enstruman.donusum)`);
  return t => {
    // t anında ya da öncesindeki son kur (ikili arama); ilk kurdan önce ilk kur kullanılır.
    let lo = 0, hi = d.t.length - 1;
    if (t <= d.t[0]) return d.k[0];
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (d.t[m] <= t) lo = m; else hi = m - 1; }
    return d.k[lo];
  };
}

// Lot sayısı: aşağı lot adımına yuvarlanır, en çoka kırpılır; en azın altındaysa 0 (giriş yok).
export function lotYuvarla(ham, x) {
  if (!(ham > 0)) return 0;
  let lot = Math.floor(ham / x.lotAdimi + 1e-9) * x.lotAdimi;
  lot = Math.min(lot, x.maxLot);
  // Kayan nokta artığını lot adımının basamağına göre temizle (0.07 yerine 0.07000000000000001 olmasın).
  const basamak = Math.max(0, Math.ceil(-Math.log10(x.lotAdimi) - 1e-9));
  lot = Number(lot.toFixed(Math.min(basamak, 10)));
  return lot + 1e-12 >= x.minLot ? lot : 0;
}

export function teminat(x, lot, fiyat, kur) {
  if (Number(x.teminatLot) > 0) return lot * x.teminatLot;
  if (Number(x.kaldirac) > 0) return lot * x.sozlesme * fiyat * kur / x.kaldirac;
  return 0;
}

// tickDegeri denetimi: verilen değer hesaplanandan %1'den fazla saparsa uyarı metni döner.
export function tickDenetimi(x, fiyat, kur) {
  if (!(Number(x.tickDegeri) > 0) || !(Number(x.tickBuyuklugu) > 0)) return null;
  const hesaplanan = x.tickBuyuklugu * x.sozlesme * kur;
  const oran = x.tickDegeri / hesaplanan;
  return Math.abs(oran - 1) > 0.01 ? { verilen: x.tickDegeri, hesaplanan, oran } : null;
}
