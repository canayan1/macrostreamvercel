// Prop firması kayıp sınırları: geçmiş işlemlerde her günün tabana en çok ne kadar yaklaştığı.
// Saf modül. Kurallar Kalibre Engine kalkanıyla aynıdır (mql5/Include/Kalibre/Kalkan.mqh,
// docs/kalkan.md); yeni firma kuralı uydurulmaz.
//
// Sınır: geçmiş raporunda gün içi varlık (equity) yoktur. Burada yalnız KAPANAN işlemlerle oluşan
// bakiye ölçülür; açık pozisyonun gün içi zararı görünmez. Gerçek ihlal bundan erken olabilir.
// Kalibre Bridge canlı veride varlığı da gönderir.
//
// Günlük taban = gün başı bakiyesi − günlük% × başlangıç sermayesi
// Azami taban  = (başlangıç | gün sonu bakiye tepesi | kapanan işlemle bakiye tepesi) − azami% × başlangıç

export const ON_AYARLAR = [
  { id: 'ftmo-2', ad: 'FTMO 2-Step', gunluk: 5, azami: 10, tur: 'sabit', gunSaati: 'orta-avrupa', kaynak: 'ftmo.com/en/trading-objectives', tarih: '2026-10-23' },
  { id: 'ftmo-1', ad: 'FTMO 1-Step', gunluk: 3, azami: 10, tur: 'gun-sonu', gunSaati: 'orta-avrupa', kaynak: 'ftmo.com/en/trading-objectives', tarih: '2026-10-23' },
  { id: 'ftmo-aninda', ad: 'FTMO Instant', gunluk: 3, azami: 10, tur: 'gun-ici', gunSaati: 'orta-avrupa', kaynak: 'ftmo.com/en/trading-objectives', tarih: '2026-10-23' },
  { id: 'the5ers-hs', ad: 'The5ers High Stakes', gunluk: 5, azami: 10, tur: 'sabit', gunSaati: 'sunucu', kaynak: 'the5ers.com/high-stakes', tarih: '2026-10-23', varsayim: true },
];

// Orta Avrupa saati farkı (saniye): yaz saati Mart'ın son pazarı 01:00 UTC ile Ekim'in son pazarı
// 01:00 UTC arası +2, diğer zaman +1.
function sonPazar(yil, ay) { const d = new Date(Date.UTC(yil, ay + 1, 0, 1)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.getTime() / 1000; }
export function ortaAvrupaFarki(utcSn) {
  const y = new Date(utcSn * 1000).getUTCFullYear();
  return utcSn >= sonPazar(y, 2) && utcSn < sonPazar(y, 9) ? 7200 : 3600;
}

export function gunAnahtari(sunucuSn, { gunSaati = 'sunucu', sunucuUtcFarki = 0 } = {}) {
  let t = sunucuSn;
  if (gunSaati === 'orta-avrupa') { const utc = sunucuSn - sunucuUtcFarki * 3600; t = utc + ortaAvrupaFarki(utc); }
  return new Date(t * 1000).toISOString().slice(0, 10);
}

export function propDegerlendir(islemler, { baslangic, gunluk, azami, tur = 'sabit', gunSaati = 'sunucu', sunucuUtcFarki = 0 }) {
  if (!(baslangic > 0)) return null;
  const gTutar = gunluk > 0 ? baslangic * gunluk / 100 : null;
  const aTutar = azami > 0 ? baslangic * azami / 100 : null;
  const gunler = [];
  let bakiye = baslangic, tepe = baslangic, gun = null;
  const kapat = () => { if (gun) { gun.gunSonu = bakiye; gunler.push(gun); if (tur === 'gun-sonu') tepe = Math.max(tepe, bakiye); } };
  const tabanlar = () => {
    const gT = gTutar !== null ? gun.gunBasi - gTutar : -Infinity;
    const ust = tur === 'sabit' ? baslangic : tepe;
    const aT = aTutar !== null ? ust - aTutar : -Infinity;
    return { gT, aT };
  };
  const yokla = () => {
    const { gT, aT } = tabanlar();
    const taban = Math.max(gT, aT);
    const mesafe = bakiye - taban;
    if (mesafe < gun.mesafe) { gun.mesafe = mesafe; gun.gunlukTaban = gT; gun.azamiTaban = aT; gun.enYakinBakiye = bakiye; gun.sinir = gT >= aT ? 'gunluk' : 'azami'; }
    if (bakiye < gT) gun.gunlukIhlal = true;
    if (bakiye < aT) gun.azamiIhlal = true;
    gun.ihlal = gun.gunlukIhlal && gun.azamiIhlal ? 'ikisi' : gun.gunlukIhlal ? 'gunluk' : gun.azamiIhlal ? 'azami' : null;
    gun.enDusuk = Math.min(gun.enDusuk, bakiye);
  };
  for (const i of islemler) {
    const k = gunAnahtari(i.kapanisZamani, { gunSaati, sunucuUtcFarki });
    if (!gun || gun.gun !== k) {
      kapat();
      gun = { gun: k, gunBasi: bakiye, enDusuk: bakiye, mesafe: Infinity, gunlukTaban: null, azamiTaban: null, enYakinBakiye: bakiye, sinir: null, ihlal: null, gunlukIhlal: false, azamiIhlal: false, adet: 0, net: 0 };
      yokla();
    }
    bakiye += i.net;
    gun.adet++; gun.net += i.net;
    if (tur === 'gun-ici') tepe = Math.max(tepe, bakiye);
    yokla();
  }
  kapat();
  for (const g of gunler) g.mesafeYuzde = g.mesafe / baslangic;
  const ihlaller = gunler.filter(g => g.ihlal);
  const enYakin = gunler.reduce((e, g) => (!e || g.mesafe < e.mesafe ? g : e), null);
  return { baslangic, gunler, ihlalSayisi: ihlaller.length, ilkIhlal: ihlaller[0] ?? null, enYakin, sonBakiye: bakiye };
}
