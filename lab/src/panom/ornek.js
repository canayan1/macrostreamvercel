// Panom için SENTETİK örnek belgeler: durum, kotalar, islemler, pozisyonlar.
// Tarayıcıda ve Node'da çalışır; ağ ya da dosya erişimi yoktur. Gerçek bir piyasayı göstermez:
// semboller tanıdık görünse de fiyatlar ve işlemler tohumlu bir rastgele süreçten üretilir.
// durum.kaynak "ornek" ve terminal adı "Örnek (sentetik)" yazar; Panom bunu rozetle gösterir.

const SEMBOLLER = [
  ['EURUSD', 'Euro vs US Dollar', 'forex', 5, 1.085],
  ['GBPUSD', 'Pound Sterling vs US Dollar', 'forex', 5, 1.27],
  ['USDJPY', 'US Dollar vs Japanese Yen', 'forex', 3, 151.2],
  ['USDTRY', 'US Dollar vs Turkish Lira', 'forex', 5, 42.6],
  ['XAUUSD', 'Gold vs US Dollar', 'metal', 2, 2385.0],
  ['AUDUSD', 'Australian Dollar vs US Dollar', 'forex', 5, 0.655],
  ['USDCHF', 'US Dollar vs Swiss Franc', 'forex', 5, 0.905],
  ['BTCUSD', 'Bitcoin vs US Dollar', 'kripto', 2, 64500.0],
];

// mulberry32: aynı tohum aynı örneği üretir.
function rastgele(tohum) {
  let t = tohum | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const yuvarla = (x, b) => Math.round(x * 10 ** b) / 10 ** b;

export function panomOrnek({ tohum = 4821, simdi = Math.floor(Date.now() / 1000), gun = 90, adet = 60 } = {}) {
  const r = rastgele(tohum);
  const bas = simdi - gun * 86400;
  const GUN = 86400;

  // Kotalar: gün içi küçük bir sapma, önceki kapanıştan günlük değişim.
  const kotalar = SEMBOLLER.map(([sembol, tanim, sinif, basamak, taban]) => {
    const onceki = taban * (1 + (r() - 0.5) * 0.02);
    const alis = onceki * (1 + (r() - 0.5) * 0.012);
    const nokta = 10 ** -basamak;
    const makas = sinif === 'kripto' ? 2500 : sinif === 'metal' ? 25 : 12;
    const yuksek = Math.max(onceki, alis) * (1 + r() * 0.004);
    const dusuk = Math.min(onceki, alis) * (1 - r() * 0.004);
    return {
      sembol, tanim, sinif, basamak, nokta,
      alis: yuvarla(alis, basamak), satis: yuvarla(alis + makas * nokta, basamak),
      zaman: simdi - Math.floor(r() * 30),
      gunAcilis: yuvarla(onceki * (1 + (r() - 0.5) * 0.002), basamak),
      gunYuksek: yuvarla(yuksek, basamak), gunDusuk: yuvarla(dusuk, basamak),
      oncekiKapanis: yuvarla(onceki, basamak),
    };
  });

  // İşlemler: her biri birkaç saat ile iki gün arası açık kalır; kazanma oranı %50 civarı,
  // kazançlar kayıplardan biraz büyük (ortalama bir trend takibi profili).
  const islemler = [];
  for (let i = 0; i < adet; i++) {
    const [sembol, , , basamak, taban] = SEMBOLLER[Math.floor(r() * SEMBOLLER.length)];
    const acilis = bas + Math.floor(r() * (gun * GUN - 3 * GUN));
    const sure = 3600 * (2 + Math.floor(r() * 46));
    const yon = r() < 0.55 ? 'al' : 'sat';
    const lot = yuvarla(0.05 + Math.floor(r() * 6) * 0.05, 2);
    const acilisFiyati = taban * (1 + (r() - 0.5) * 0.03);
    const kazandi = r() < 0.52;
    const hareket = (kazandi ? 1 : -1) * (0.002 + r() * (kazandi ? 0.012 : 0.008));
    const kapanisFiyati = acilisFiyati * (1 + (yon === 'al' ? hareket : -hareket));
    const brut = yuvarla(hareket * acilisFiyati * lot * (sembol === 'BTCUSD' ? 1 : sembol === 'XAUUSD' ? 100 : 100000) / (sembol === 'USDJPY' ? 151 : sembol === 'USDTRY' ? 42.6 : 1), 2);
    const swap = yuvarla(-r() * 2 * (sure / GUN), 2);
    const komisyon = yuvarla(-lot * 7, 2);
    islemler.push({
      bilet: 500000 + i, sembol, yon, lot,
      acilisZamani: acilis, acilisFiyati: yuvarla(acilisFiyati, basamak),
      kapanisZamani: acilis + sure, kapanisFiyati: yuvarla(kapanisFiyati, basamak),
      kar: yuvarla(brut + swap + komisyon, 2), swap, komisyon, sihirli: i % 3 === 0 ? 20261020 : 0, yorum: '',
    });
  }
  islemler.sort((a, b) => a.kapanisZamani - b.kapanisZamani);

  const bakiyeHareketleri = [
    { zaman: bas - GUN, tutar: 10000, tur: 'yatirma' },
    { zaman: bas + 45 * GUN, tutar: 2500, tur: 'yatirma' },
  ];
  const bakiye = yuvarla(bakiyeHareketleri.reduce((t, h) => t + h.tutar, 0) + islemler.reduce((t, i) => t + i.kar, 0), 2);

  const acik = [0, 4].map((k, j) => {
    const q = kotalar[k];
    const acilisFiyati = q.alis * (1 + (r() - 0.5) * 0.01);
    const yon = j === 0 ? 'al' : 'sat';
    const lot = 0.1;
    const carpan = q.sinif === 'metal' ? 100 : 100000;
    const kar = yuvarla((yon === 'al' ? q.alis - acilisFiyati : acilisFiyati - q.alis) * lot * carpan, 2);
    return {
      bilet: 600000 + j, sembol: q.sembol, yon, lot, acilisZamani: simdi - 3600 * (6 + j * 5),
      acilisFiyati: yuvarla(acilisFiyati, q.basamak), guncelFiyat: q.alis,
      stop: yuvarla(acilisFiyati * (yon === 'al' ? 0.99 : 1.01), q.basamak), hedef: 0, kar, sihirli: j === 0 ? 20261020 : 0,
    };
  });
  const varlik = yuvarla(bakiye + acik.reduce((t, p) => t + p.kar, 0), 2);

  return {
    durum: {
      kalibre_kopru: 1, tur: 'durum', uretildi: simdi, yazmaAraligiSn: 5, kaynak: 'ornek',
      terminal: { sirket: 'Örnek (sentetik)', sunucu: 'ornek', hesapTuru: 'demo' }, sunucuUtcFarkiSn: 0,
      seriler: [], pozisyonlarVar: true, kotalarVar: true, islemlerVar: true,
    },
    kotalar: { kalibre_kopru: 1, tur: 'kotalar', uretildi: simdi, sunucuSaati: simdi, kotalar },
    islemler: { kalibre_kopru: 1, tur: 'islemler', uretildi: simdi, para: 'USD', gunSayisi: gun, islemler, bakiyeHareketleri },
    pozisyonlar: { kalibre_kopru: 1, tur: 'pozisyonlar', uretildi: simdi, para: 'USD', bakiye, varlik, pozisyonlar: acik },
  };
}
