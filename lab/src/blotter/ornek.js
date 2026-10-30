// SENTETİK örnek: bir Türk bankası FX desk'inin bir haftalık blotter'ı (Excel'den CSV'ye aktarılmış gibi:
// rapor başlığı satırları, TR başlıklar, TR sayı biçimi, toplam satırı, bir opsiyon satırı, bir düzeltilmiş
// işlem). Gerçek banka verisi değildir; kur seviyeleri piyasa iddiası taşımaz. Deterministiktir.

export const ORNEK_TARIH = '2026-10-16';
// Demo analiz günü: hafta kapandıktan sonraki çarşamba (açık pozisyonların spot valörü geçmiş, taşıma görünür).
export const ORNEK_ANALIZ_TARIHI = '2026-10-21';
// Analiz günü için sentetik anlık kur tablosu (kullanıcının kendi tablosunun yerine).
export const ORNEK_KURLAR = `# SENTETİK anlık kurlar
USD/TRY 41.9200
EUR/USD 1.0875
GBP/USD 1.3360
EUR/TRY 45.5880`;
// Sentetik gecelik faiz varsayımları (yıllık %), taşıma maliyeti örneği için.
export const ORNEK_FAIZ = { USD: 4.25, TRY: 39.5, EUR: 2.0, GBP: 4.0 };
export const ORNEK_FAIZ_METNI = Object.entries(ORNEK_FAIZ).map(([d, r]) => `${d} ${r}`).join('\n');
// Örnek limit tablosu (sentetik masa limitleri).
export const ORNEK_LIMITLER = 'NOP USD 25000000\nGECE 40000000\nGUNICI trader Trader 1 15000000\nSTOP masa 50000\nVALOR USD ≤ 1 ay 10000000';
export const ORNEK_LIMITLER_EN = 'NOP USD 25000000\nOVERNIGHT 40000000\nINTRADAY trader Trader 1 15000000\nSTOP desk 50000\nVALUE USD ≤ 1 month 10000000';
// Yayımlanan örnek dosyalar (lab/samples/). ?file= yalnız bu listedekileri açar.
export const ORNEK_DOSYALAR = ['samples/fx-blotter-sample.xlsx', 'samples/fx-blotter-ornek.xlsx', 'samples/fx-blotter-sample.csv', 'samples/fx-blotter-ornek.csv',
  ...['platform-export', 'tms-export', 'confirmation-mt300', 'fix-dropcopy', 'desk-excel'].flatMap(f => [`samples/formats/fx-blotter-${f}.xlsx`, `samples/formats/fx-blotter-${f}.csv`])];

function rng(tohum) {
  let s = tohum >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const trSayi = (x, b) => {
  const [t, o] = Math.abs(x).toFixed(b).split('.');
  return (x < 0 ? '-' : '') + t.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (b ? ',' + o : '');
};
const trTarih = g => { const [y, a, d] = g.split('-'); return `${d}.${a}.${y}`; };
const saat = sn => [Math.floor(sn / 3600), Math.floor(sn / 60) % 60, sn % 60].map(v => String(v).padStart(2, '0')).join(':');
const gunEkle = (g, n) => new Date(Date.parse(g + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const isGunu = (g, n) => { let x = g, k = 0; while (k < n) { x = gunEkle(x, 1); const h = new Date(x + 'T00:00:00Z').getUTCDay(); if (h && h !== 6) k++; } return x; };

// İngilizce sürüm: aynı işlemler, Londra masası dışa aktarımı gibi İngilizce başlık, İngilizce sayı biçimi ve gg/aa/yyyy.
export const ORNEK_BASLIK_EN = ['Deal ID', 'Trade Date', 'Time', 'Value Date', 'Product', 'Buy/Sell', 'Currency', 'Amount', 'Counter Currency', 'Counter Amount', 'Rate', 'Spot Rate', 'Cost Rate', 'TRY Equivalent', 'Swap Ref', 'Leg', 'Counterparty', 'Client Type', 'Dealer', 'Portfolio', 'Status'];
const EN = {
  VADELİ: 'FORWARD', SPOT: 'SPOT', SWAP: 'SWAP', OPSİYON: 'OPTION', ALIŞ: 'BUY', SATIŞ: 'SELL', YAKIN: 'NEAR', UZAK: 'FAR', MÜŞTERİ: 'CLIENT', İNTERBANK: 'INTERBANK',
  Aktif: 'Active', 'SPOT-TRY': 'SPOT-TRY', G10: 'G10', LİKİDİTE: 'LIQUIDITY',
};
const enSayi = (x, b) => { const [t, o] = Math.abs(x).toFixed(b).split('.'); return (x < 0 ? '-' : '') + t.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + o : ''); };
const enTarih = g => { const [y, a, d] = g.split('-'); return `${d}/${a}/${y}`; };
// Excel seri günü (1900 tarih sistemi) ve gün kesri.
const excelGun = g => Date.parse(g + 'T00:00:00Z') / 86400000 + 25569;

export const ORNEK_BASLIK = ['İşlem No', 'İşlem Tarihi', 'Saat', 'Valör', 'İşlem Tipi', 'Alış/Satış', 'Döviz Cinsi', 'Tutar', 'Karşı Döviz', 'Karşı Tutar', 'Kur', 'Spot Kur', 'Maliyet', 'TL Karşılığı', 'Swap Ref', 'Bacak', 'Karşı Taraf', 'Müşteri Tipi', 'Dealer', 'Portföy', 'Durum'];

// dil: 'tr' (TR başlık ve sayı biçimi) ya da 'en'. hucre: true ise sayılar ve tarihler XLSX için tipli döner
// ({ tarih: seriGün } / { saat: günKesri } / sayı), metin biçimlendirme yapılmaz.
export function ornekBlotter(tohum = 20261016, { dil = 'tr', hucre = false } = {}) {
  const en = dil === 'en';
  const sayiYaz = (x, b) => (hucre ? +x.toFixed(b) : en ? enSayi(x, b) : trSayi(x, b));
  const tarihYaz = g => (hucre ? { tarih: excelGun(g) } : en ? enTarih(g) : trTarih(g));
  const saatYaz = sn => (hucre ? { saat: sn / 86400 } : saat(sn));
  const etiket = v => (en && v in EN ? EN[v] : v);
  const ad = v => (en ? v.replace(/^Müşteri-/, 'Client-').replace(/^Banka-/, 'Bank-') : v);
  const r = rng(tohum);
  const gunler = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];
  const usdTrySeviye = [41.82, 41.86, 41.90, 41.88, 41.92];
  const eurUsdSeviye = [1.0842, 1.0851, 1.0866, 1.0870, 1.0875];
  const gbpUsdSeviye = [1.3331, 1.3340, 1.3352, 1.3348, 1.3360];
  const musteriler = ['Müşteri-Anadolu Tekstil', 'Müşteri-Ege Gıda', 'Müşteri-Marmara Otomotiv', 'Müşteri-Karadeniz Enerji', 'Müşteri-Akdeniz Turizm', 'Müşteri-İç Anadolu Lojistik'];
  const bankalar = ['Banka-A', 'Banka-B', 'Banka-C', 'Banka-D'];
  const dealerlar = ['M.Yılmaz', 'A.Demir', 'S.Kaya'];
  const satirlar = [];
  let no = 300100;
  const ekle = h => satirlar.push(h);
  const satir = (o) => [
    String(o.no), tarihYaz(o.gun), saatYaz(o.sn), tarihYaz(o.valor), etiket(o.tip), etiket(o.yon), o.doviz, sayiYaz(o.tutar, 2), o.karsi, sayiYaz(o.karsiTutar, 2),
    sayiYaz(o.kur, 4), o.spot ? sayiYaz(o.spot, 4) : '', o.maliyet ? sayiYaz(o.maliyet, 4) : '', o.tl === null ? '' : sayiYaz(o.tl, 2), o.swap ?? '', etiket(o.bacak ?? ''), ad(o.karsiTaraf), etiket(o.tipMusteri), o.dealer, etiket(o.portfoy), etiket(o.durum ?? 'Aktif'),
  ];
  const tl = (kote, karsiTutar, gunIdx) => (kote === 'TRY' ? karsiTutar : karsiTutar * 41.92); // USD karşılığından TL (sentetik sabit kurla)
  let toplamTl = 0;

  gunler.forEach((gun, gi) => {
    const spot = isGunu(gun, 2);
    let sn = 9 * 3600 + Math.floor(r() * 1200);
    const isler = 22 + Math.floor(r() * 8);
    for (let i = 0; i < isler; i++) {
      sn += 600 + Math.floor(r() * 900);
      if (sn > 17.5 * 3600) break;
      const tur = r();
      const parite = tur < 0.62 ? ['USD', 'TRY', usdTrySeviye[gi], 4] : tur < 0.8 ? ['EUR', 'TRY', usdTrySeviye[gi] * eurUsdSeviye[gi], 4] : tur < 0.93 ? ['EUR', 'USD', eurUsdSeviye[gi], 4] : ['GBP', 'USD', gbpUsdSeviye[gi], 4];
      const [base, kote, seviye] = parite;
      const orta = seviye * (1 + (r() - 0.5) * 0.0016);
      const musteriAlir = r() < 0.55; // müşteri base alır → banka satar
      const tutar = (base === 'USD' ? [250, 500, 1000, 2000, 3000, 5000] : [100, 250, 500, 1000, 1500])[Math.floor(r() * 5)] * 1000;
      const marjBps = (3 + Math.floor(r() * 12)) * (base === 'USD' && kote === 'TRY' ? 1 : 0.6);
      const maliyet = +orta.toFixed(4);
      const kur = +(musteriAlir ? maliyet * (1 + marjBps / 1e4) : maliyet * (1 - marjBps / 1e4)).toFixed(4);
      const vadeli = r() < 0.18;
      const valor = vadeli ? gunEkle(spot, [30, 61, 91][Math.floor(r() * 3)]) : spot;
      const puan = vadeli ? (kote === 'TRY' ? 0.0011 : 0.00001) * (Math.round((Date.parse(valor) - Date.parse(spot)) / 86400000)) * (kote === 'TRY' ? seviye : 1) : 0;
      const kurAllIn = +(kur + (vadeli ? puan : 0)).toFixed(4);
      const dealer = dealerlar[Math.floor(r() * 3)];
      const karsiTutar = +(tutar * kurAllIn).toFixed(2);
      const t = tl(kote, karsiTutar, gi);
      toplamTl += t;
      ekle(satir({
        no: no++, gun, sn, valor, tip: vadeli ? 'VADELİ' : 'SPOT', yon: musteriAlir ? 'SATIŞ' : 'ALIŞ', doviz: base, tutar, karsi: kote, karsiTutar, kur: kurAllIn, spot: vadeli ? kur : null,
        maliyet: vadeli ? null : maliyet, tl: +t.toFixed(2), karsiTaraf: musteriler[Math.floor(r() * musteriler.length)], tipMusteri: 'MÜŞTERİ', dealer,
        portfoy: vadeli ? 'VADELİ' : kote === 'TRY' ? 'SPOT-TRY' : 'G10',
      }));
      // Spot müşteri işlemlerinin çoğu dakikalar içinde interbank'ta kapatılır (back-to-back).
      if (!vadeli && r() < 0.72) {
        const sn2 = sn + 30 + Math.floor(r() * 200);
        const kayma = (r() - 0.45) * 0.0002;
        const ibKur = +(maliyet * (1 + kayma)).toFixed(4);
        const ibTutar = r() < 0.8 ? tutar : Math.round(tutar * 0.6 / 1000) * 1000;
        const ibKarsi = +(ibTutar * ibKur).toFixed(2);
        const t2 = tl(kote, ibKarsi, gi);
        toplamTl += t2;
        ekle(satir({
          no: no++, gun, sn: sn2, valor, tip: 'SPOT', yon: musteriAlir ? 'ALIŞ' : 'SATIŞ', doviz: base, tutar: ibTutar, karsi: kote, karsiTutar: ibKarsi, kur: ibKur,
          maliyet: null, tl: +t2.toFixed(2), karsiTaraf: bankalar[Math.floor(r() * bankalar.length)], tipMusteri: 'İNTERBANK', dealer, portfoy: kote === 'TRY' ? 'SPOT-TRY' : 'G10',
        }));
        sn = sn2;
      }
    }
    // Günde bir USD/TRY T/N likidite swap'ı (roll): pozisyonu değiştirmez.
    const swapSn = 16 * 3600 + 30 * 60;
    const swapTutar = [5, 10, 15][gi % 3] * 1e6;
    const yakinKur = +usdTrySeviye[gi].toFixed(4), uzakKur = +(usdTrySeviye[gi] * (1 + 0.355 / 365)).toFixed(4);
    const sRef = `SW-${gi + 1}`;
    for (const [rol, yon, valor, k] of [['YAKIN', 'SATIŞ', isGunu(gun, 1), yakinKur], ['UZAK', 'ALIŞ', isGunu(gun, 2), uzakKur]]) {
      const kt = +(swapTutar * k).toFixed(2);
      toplamTl += kt;
      ekle(satir({ no: no++, gun, sn: swapSn, valor, tip: 'SWAP', yon, doviz: 'USD', tutar: swapTutar, karsi: 'TRY', karsiTutar: kt, kur: k, maliyet: null, tl: kt, swap: sRef, bacak: rol, karsiTaraf: bankalar[gi % 4], tipMusteri: 'İNTERBANK', dealer: 'S.Kaya', portfoy: 'LİKİDİTE' }));
    }
  });
  // Bir opsiyon satırı (desteklenmiyor, gerekçeyle dışarıda kalır) ve bir düzeltilmiş işlem (aynı no, son satır geçerli).
  ekle(satir({ no: no++, gun: '2026-10-14', sn: 11 * 3600, valor: '2026-11-16', tip: 'OPSİYON', yon: 'SATIŞ', doviz: 'USD', tutar: 1e6, karsi: 'TRY', karsiTutar: 42500000, kur: 42.5, maliyet: null, tl: null, karsiTaraf: 'Müşteri-Ege Gıda', tipMusteri: 'MÜŞTERİ', dealer: 'A.Demir', portfoy: 'OPSİYON' }));
  // Düzeltme: ilk işlem önce iki kat tutarla girilmiş, sonra aynı numarayla doğru tutarla yeniden yazılmış.
  const ilk = satirlar[0];
  const sayi = h => (typeof h === 'number' ? h : Number(en ? String(h).replace(/,/g, '') : String(h).replace(/\./g, '').replace(',', '.')));
  const eski = ilk.map((h, j) => ([7, 9, 13].includes(j) && h ? sayiYaz(sayi(h) * 2, 2) : h));
  satirlar.unshift(eski);

  const veri = en ? [
    ['SAMPLE BANK TREASURY - FX DEAL BLOTTER (EXAMPLE)'],
    [`Report date: ${enTarih(ORNEK_TARIH)}`, '', 'Time zone: Europe/Istanbul'],
    ORNEK_BASLIK_EN,
    ...satirlar,
    ['TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', sayiYaz(toplamTl, 2)],
  ] : [
    ['ÖRNEK BANKA A.Ş. HAZİNE - FX İŞLEM LİSTESİ (ÖRNEK)'],
    [`Rapor tarihi: ${trTarih(ORNEK_TARIH)}`, '', 'Saat dilimi: Europe/Istanbul'],
    ORNEK_BASLIK,
    ...satirlar,
    ['TOPLAM', '', '', '', '', '', '', '', '', '', '', '', '', sayiYaz(toplamTl, 2)],
  ];
  veri.forEach((s, i) => { s.no = i + 1; });
  return { satirlar: veri, tarih: ORNEK_ANALIZ_TARIHI, raporTarihi: ORNEK_TARIH, saatDilimi: 3, dil };
}
