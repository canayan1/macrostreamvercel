// İşlem analizi motoru. Saf modül: DOM yok, dil yok (etiketler Türkçe kaynak metindir, arayüz
// t() ile çevirir). Arayüz yalnız analizMotoru() dönüşünü kullanır; ileride aynı arayüzle
// DuckDB-WASM tabanlı bir motor konabilir.
//
//   const m = analizMotoru(hesap, { sunucuUtcFarki: 2 });
//   m.ozet()                     → hesap özeti
//   m.grupla('saat', 'net')      → [{ anahtar, etiket, ...ölçüler }]
//   m.icgoruler({ enAz: 20 })    → { kaybettiren: [...], kazandiran: [...], yeterliVeri }
//
// Saat, gün ve seans işlemin AÇILIŞ zamanına göredir (karar anı). Saat ve gün raporda görünen
// sunucu saatidir; seans için sunucu saati UTC'ye çevrilir (sunucuUtcFarki, saat).

export const SEANSLAR = [
  { anahtar: 'asya', etiket: 'Asya (00-07 UTC)', bas: 0, bit: 7 },
  { anahtar: 'londra', etiket: 'Londra (07-12 UTC)', bas: 7, bit: 12 },
  { anahtar: 'kesisim', etiket: 'Londra ve New York (12-16 UTC)', bas: 12, bit: 16 },
  { anahtar: 'newyork', etiket: 'New York (16-21 UTC)', bas: 16, bit: 21 },
  { anahtar: 'gec', etiket: 'Geç saat (21-24 UTC)', bas: 21, bit: 24 },
];
const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SURE_KOVA = [
  [300, 'a', '5 dakikadan kısa'], [1800, 'b', '5-30 dakika'], [7200, 'c', '30 dakika - 2 saat'],
  [28800, 'd', '2-8 saat'], [86400, 'e', '8-24 saat'], [259200, 'f', '1-3 gün'], [Infinity, 'g', '3 günden uzun'],
];
const LOT_KOVA = [
  [0.75, 'a', 'Olağan boyutun altında (<0,75x)'], [1.25, 'b', 'Olağan boyut (0,75x-1,25x)'],
  [2, 'c', 'Büyük (1,25x-2x)'], [Infinity, 'd', 'Çok büyük (>2x)'],
];
const ONCEKI = { ilk: 'İlk işlem', kayip: 'Kayıptan sonra', kazanc: 'Kazançtan sonra', basabas: 'Başabaştan sonra' };
const SERI = ['Önceki işlem kayıp değil', '1 kayıptan sonra', '2 kayıptan sonra', '3 ve daha fazla kayıptan sonra'];

export const BOYUTLAR = [
  { id: 'sembol', ad: 'Sembol' },
  { id: 'saat', ad: 'Açılış saati (sunucu)' },
  { id: 'gun', ad: 'Haftanın günü' },
  { id: 'seans', ad: 'Seans' },
  { id: 'yon', ad: 'Yön' },
  { id: 'sureKova', ad: 'Pozisyon süresi' },
  { id: 'lotKova', ad: 'İşlem boyutu' },
  { id: 'oncekiSonuc', ad: 'Önceki işlemin sonucu' },
  { id: 'seri', ad: 'Arka arkaya kayıp' },
  { id: 'ay', ad: 'Ay' },
];
export const OLCULER = [
  { id: 'net', ad: 'Net kâr/zarar', tur: 'para' },
  { id: 'adet', ad: 'İşlem sayısı', tur: 'sayi' },
  { id: 'kazanmaOrani', ad: 'Kazanma oranı', tur: 'yuzde' },
  { id: 'beklenti', ad: 'İşlem başı ortalama', tur: 'para' },
  { id: 'karFaktoru', ad: 'Kâr faktörü', tur: 'oran' },
  { id: 'ortKazanc', ad: 'Ortalama kazanç', tur: 'para' },
  { id: 'ortKayip', ad: 'Ortalama kayıp', tur: 'para' },
  { id: 'ortR', ad: 'Ortalama R', tur: 'oran' },
  { id: 'azamiDusus', ad: 'Azami düşüş', tur: 'para' },
  { id: 'ortLot', ad: 'Ortalama lot', tur: 'oran' },
];
const ICGORU_BOYUTLARI = ['sembol', 'saat', 'gun', 'seans', 'yon', 'sureKova', 'lotKova', 'oncekiSonuc', 'seri'];

const medyan = d => { if (!d.length) return 0; const s = [...d].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const kova = (liste, x) => liste.find(([sinir]) => x < sinir);

// Her işleme türetilmiş alanlar eklenir (kopya; girdi değişmez).
export function zenginlestir(islemler, { sunucuUtcFarki = 0 } = {}) {
  const n = islemler.length;
  const lotMedyan = medyan(islemler.map(i => i.lot)) || 1;
  // Önceki işlem: bu işlem açılmadan önce KAPANMIŞ son işlem. Kapanışlar sıralı (model.js).
  const acilisSira = islemler.map((_, k) => k).sort((a, b) => islemler[a].acilisZamani - islemler[b].acilisZamani || a - b);
  const onceki = new Array(n).fill(-1), seri = new Array(n).fill(0);
  const kayipSerisi = new Array(n);
  let s = 0;
  for (let k = 0; k < n; k++) { s = islemler[k].net < 0 ? s + 1 : 0; kayipSerisi[k] = s; }
  let p = -1;
  for (const k of acilisSira) {
    while (p + 1 < n && islemler[p + 1].kapanisZamani <= islemler[k].acilisZamani) p++;
    // Kendisi ya da daha sonra açılanın kapanışı sayılmaz: p kapanış sırasında k'dan önce olabilir.
    let q = p;
    while (q >= 0 && q === k) q--;
    onceki[k] = q; seri[k] = q >= 0 ? kayipSerisi[q] : 0;
  }
  return islemler.map((i, k) => {
    const d = new Date(i.acilisZamani * 1000);
    const saat = d.getUTCHours();
    const utc = (((saat - sunucuUtcFarki) % 24) + 24) % 24;
    const seans = SEANSLAR.find(x => utc >= x.bas && utc < x.bit) ?? SEANSLAR[0];
    const sure = i.kapanisZamani - i.acilisZamani;
    const oran = i.lot / lotMedyan;
    const o = onceki[k];
    const oncekiSonuc = o < 0 ? 'ilk' : islemler[o].net < 0 ? 'kayip' : islemler[o].net > 0 ? 'kazanc' : 'basabas';
    let r = null;
    if (i.sl && i.acilisFiyati && i.kapanisFiyati) {
      const risk = Math.abs(i.acilisFiyati - i.sl);
      if (risk / i.acilisFiyati > 1e-5) {
        const hareket = (i.kapanisFiyati - i.acilisFiyati) * (i.yon === 'al' ? 1 : -1);
        r = Math.max(-20, Math.min(20, hareket / risk));
      }
    }
    const kapanis = new Date(i.kapanisZamani * 1000);
    return {
      ...i,
      saat, gun: (d.getUTCDay() + 6) % 7, seans: seans.anahtar,
      sure, sureKova: kova(SURE_KOVA, sure)[1], lotOrani: oran, lotKova: kova(LOT_KOVA, oran)[1],
      oncekiSonuc, seri: o < 0 || seri[k] === 0 ? 0 : Math.min(3, seri[k]),
      ay: `${kapanis.getUTCFullYear()}-${String(kapanis.getUTCMonth() + 1).padStart(2, '0')}`,
      r,
    };
  });
}

function etiketVeSira(boyut, anahtar) {
  switch (boyut) {
    case 'saat': return [`${String(anahtar).padStart(2, '0')}:00`, Number(anahtar)];
    case 'gun': return [GUNLER[anahtar], Number(anahtar)];
    case 'seans': { const i = SEANSLAR.findIndex(x => x.anahtar === anahtar); return [SEANSLAR[i]?.etiket ?? anahtar, i]; }
    case 'yon': return [anahtar === 'al' ? 'Alış' : 'Satış', anahtar === 'al' ? 0 : 1];
    case 'sureKova': { const x = SURE_KOVA.find(k => k[1] === anahtar); return [x[2], SURE_KOVA.indexOf(x)]; }
    case 'lotKova': { const x = LOT_KOVA.find(k => k[1] === anahtar); return [x[2], LOT_KOVA.indexOf(x)]; }
    case 'oncekiSonuc': return [ONCEKI[anahtar], ['ilk', 'kayip', 'kazanc', 'basabas'].indexOf(anahtar)];
    case 'seri': return [SERI[anahtar], Number(anahtar)];
    default: return [String(anahtar), String(anahtar)];
  }
}

// Bir işlem kümesinin ölçüleri. islemler kapanış sırasındadır.
export function olcule(islemler) {
  let net = 0, kazanan = 0, kaybeden = 0, brutKar = 0, brutKayip = 0, rToplam = 0, rAdet = 0, lot = 0;
  let kum = 0, tepe = 0, dusus = 0, kare = 0, maliyet = 0;
  for (const i of islemler) {
    net += i.net; lot += i.lot; kare += i.net * i.net; maliyet += i.komisyon + i.swap;
    if (i.net > 0) { kazanan++; brutKar += i.net; } else if (i.net < 0) { kaybeden++; brutKayip -= i.net; }
    if (i.r !== null && i.r !== undefined) { rToplam += i.r; rAdet++; }
    kum += i.net; if (kum > tepe) tepe = kum; if (tepe - kum > dusus) dusus = tepe - kum;
  }
  const adet = islemler.length;
  const ort = adet ? net / adet : 0;
  const sapma = adet > 1 ? Math.sqrt(Math.max(0, (kare - adet * ort * ort) / (adet - 1))) : 0;
  return {
    adet, net, kazanan, kaybeden,
    kazanmaOrani: adet ? kazanan / adet : null,
    beklenti: adet ? ort : null,
    ortKazanc: kazanan ? brutKar / kazanan : null,
    ortKayip: kaybeden ? -brutKayip / kaybeden : null,
    karFaktoru: brutKayip > 0 ? brutKar / brutKayip : (brutKar > 0 ? Infinity : null),
    ortR: rAdet ? rToplam / rAdet : null, rAdet,
    azamiDusus: dusus,
    ortLot: adet ? lot / adet : null,
    maliyet,
    // Ortalamanın sıfırdan farkı için kaba t değeri (bağımsız işlemler varsayımıyla).
    t: adet > 1 && sapma > 0 ? ort / (sapma / Math.sqrt(adet)) : null,
  };
}

export function grupla(zengin, boyut) {
  const gruplar = new Map();
  for (const i of zengin) {
    const k = i[boyut];
    let g = gruplar.get(k);
    if (!g) gruplar.set(k, (g = []));
    g.push(i);
  }
  const satirlar = [];
  for (const [anahtar, liste] of gruplar) {
    const [etiket, sira] = etiketVeSira(boyut, anahtar);
    satirlar.push({ anahtar, etiket, sira, ...olcule(liste) });
  }
  satirlar.sort((a, b) => (typeof a.sira === 'number' && typeof b.sira === 'number' ? a.sira - b.sira : String(a.sira).localeCompare(String(b.sira))));
  return satirlar;
}

export function hesapOzetiHesapla(hesap, zengin) {
  const o = olcule(zengin);
  const gunler = new Map();
  for (const i of zengin) {
    const g = new Date(i.kapanisZamani * 1000).toISOString().slice(0, 10);
    gunler.set(g, (gunler.get(g) ?? 0) + i.net);
  }
  const gunListe = [...gunler].map(([gun, net]) => ({ gun, net })).sort((a, b) => a.gun.localeCompare(b.gun));
  // Bakiye eğrisi: bakiye hareketleri ve kapanışlar. Düşüş yüzdesi tepe bakiyeye göre.
  const olaylar = [
    ...hesap.bakiyeHareketleri.map(h => ({ zaman: h.zaman, tutar: h.tutar, islem: false })),
    ...zengin.map(i => ({ zaman: i.kapanisZamani, tutar: i.net, islem: true })),
  ].sort((a, b) => a.zaman - b.zaman || (a.islem ? 1 : 0) - (b.islem ? 1 : 0));
  let bakiye = hesap.bakiyeHareketleri.length ? 0 : (hesap.baslangicBakiye ?? 0);
  let kum = 0, tepe = 0, tepeBakiye = bakiye, dususYuzde = 0;
  const egri = [];
  for (const x of olaylar) {
    bakiye += x.tutar;
    if (!x.islem && kum === tepe) tepeBakiye = bakiye;
    if (x.islem) {
      kum += x.tutar;
      if (kum >= tepe) { tepe = kum; tepeBakiye = bakiye; }
      if (tepeBakiye > 0) dususYuzde = Math.max(dususYuzde, (tepe - kum) / tepeBakiye);
    }
    egri.push({ zaman: x.zaman, bakiye });
  }
  return {
    ...o,
    azamiDususYuzde: tepeBakiye > 0 ? dususYuzde : null,
    ilk: zengin.length ? zengin.reduce((m, i) => Math.min(m, i.acilisZamani), Infinity) : null,
    son: zengin.length ? zengin[zengin.length - 1].kapanisZamani : null,
    komisyon: zengin.reduce((t, i) => t + i.komisyon, 0),
    swap: zengin.reduce((t, i) => t + i.swap, 0),
    enIyiGun: gunListe.reduce((e, g) => (!e || g.net > e.net ? g : e), null),
    enKotuGun: gunListe.reduce((e, g) => (!e || g.net < e.net ? g : e), null),
    gunSayisi: gunListe.length,
    sembolSayisi: new Set(zengin.map(i => i.sembol)).size,
    egri,
    para: hesap.para,
    baslangicBakiye: hesap.baslangicBakiye,
  };
}

// Dilimin kazanma oranının genel orandan farkı için z (genel oran sabit kabul edilir).
const kazanmaZ = (p, P, n) => (P > 0 && P < 1 && n > 0 && p !== null ? (p - P) / Math.sqrt(P * (1 - P) / n) : 0);

// "Nerede kaybediyorsun" listesi. Yalnız en az enAz işlemli dilimler; aynı boyuttan en çok 2.
// Dilimler örtüşür (bir işlem birden çok listede olabilir). Ortalama sonuçta |t| < 2 ve kazanma
// oranında |z| < 2 ise "rastlantı olabilir" diye işaretlenir.
export function icgoruler(zengin, { enAz = 20, adet = 5 } = {}) {
  const genel = olcule(zengin);
  const adaylar = [];
  for (const boyut of ICGORU_BOYUTLARI) {
    for (const s of grupla(zengin, boyut)) {
      if (s.adet < enAz || s.adet === zengin.length) continue;
      adaylar.push({
        boyut, anahtar: s.anahtar, etiket: s.etiket, adet: s.adet, net: s.net,
        kazanmaOrani: s.kazanmaOrani, genelKazanmaOrani: genel.kazanmaOrani,
        lotKati: genel.ortLot ? s.ortLot / genel.ortLot : null,
        beklenti: s.beklenti, genelBeklenti: genel.beklenti,
        // Belirsiz: ne ortalama sonuç (t) ne de kazanma oranı farkı (z) 2'yi geçmiyorsa.
        belirsiz: !(Math.abs(s.t ?? 0) >= 2 || Math.abs(kazanmaZ(s.kazanmaOrani, genel.kazanmaOrani, s.adet)) >= 2),
      });
    }
  }
  const sec = (liste, isaret) => {
    const say = {};
    const out = [];
    for (const a of liste.filter(x => (isaret < 0 ? x.net < 0 : x.net > 0)).sort((a, b) => (isaret < 0 ? a.net - b.net : b.net - a.net))) {
      if ((say[a.boyut] ?? 0) >= 2) continue;
      say[a.boyut] = (say[a.boyut] ?? 0) + 1;
      out.push(a);
      if (out.length >= adet) break;
    }
    return out;
  };
  return { yeterliVeri: zengin.length >= enAz, enAz, kaybettiren: sec(adaylar, -1), kazandiran: sec(adaylar, 1) };
}

export function analizMotoru(hesap, ayar = {}) {
  const zengin = zenginlestir(hesap.islemler, ayar);
  return {
    islemler: zengin,
    ozet: () => hesapOzetiHesapla(hesap, zengin),
    grupla: boyut => grupla(zengin, boyut),
    icgoruler: o => icgoruler(zengin, o),
  };
}
