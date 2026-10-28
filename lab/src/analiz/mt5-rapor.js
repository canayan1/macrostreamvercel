// MT5 hesap geçmişi raporu (Geçmiş sekmesi > sağ tık > Rapor > HTML ya da Open XML) içe aktarma.
// Saf modül: DOM yok. Dosya hiçbir zaman çalıştırılmaz ya da sayfaya HTML olarak eklenmez; yalnız
// tablo hücrelerinin düz metni okunur.
//
// Rapor yapısı (MT5, 2026): tek tablo; bölüm başlıkları "Positions", "Orders", "Deals", "Results"
// (dil arayüze göre değişir). Bölümün başlık satırı sütun adlarını taşır. Aynı satır uzunluğu için
// rapor class="hidden" boş hücreler kullanır; bunlar hem başlıkta hem veride atlanır, böylece
// sütunlar adla eşleşir. Ad tanınmazsa MT5'in sabit sütun sırası kullanılır.
// HTML raporu UTF-16 LE (BOM'lu) yazılır; UTF-8 de kabul edilir.

import { hesapOlustur } from './model.js';

// ---------------------------------------------------------------- metin çözme
export function baytlariMetneCevir(bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b.subarray(2));
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(b.subarray(2));
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return new TextDecoder('utf-8').decode(b.subarray(3));
  // BOM yok: ilk baytlarda çok sıfır varsa UTF-16 LE say.
  let sifir = 0;
  for (let i = 1; i < Math.min(b.length, 400); i += 2) if (b[i] === 0) sifir++;
  if (b.length > 4 && sifir > Math.min(b.length, 400) / 4) return new TextDecoder('utf-16le').decode(b);
  return new TextDecoder('utf-8').decode(b);
}

const VARLIK = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
export function varlikCoz(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, k) => {
    if (k[0] === '#') {
      const n = k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    }
    return VARLIK[k.toLowerCase()] ?? m;
  });
}
const duzMetin = h => varlikCoz(h.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '')).replace(/[\s ]+/g, ' ').trim();

// ---------------------------------------------------------------- HTML → satırlar
// Her satır: hücre metinleri dizisi. class="hidden" hücreler atlanır; görünür colspan hücre
// genişliği kadar tekrarlanmaz (başlık ve veri aynı kuralla okunur).
export function htmlSatirlari(html) {
  const satirlar = [];
  const govde = String(html).replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  for (const tr of govde.matchAll(/<tr\b[^>]*>([\s\S]*?)(?=<tr\b|<\/table>|$)/gi)) {
    const hucreler = [];
    for (const td of tr[1].matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)(?=<\/?(?:td|th|tr)\b|$)/gi)) {
      if (/class\s*=\s*["']?[^"'>]*\bhidden\b/i.test(td[2])) continue;
      hucreler.push(duzMetin(td[3]));
    }
    if (hucreler.length) satirlar.push(hucreler);
  }
  return satirlar;
}

// ---------------------------------------------------------------- XLSX → satırlar
// Open XML raporu bir ZIP'tir. Ek kütüphane yok: merkezi dizin okunur, girdiler tarayıcının
// (ve Node 18+'ın) DecompressionStream('deflate-raw') ile açılır.
async function inflate(veri) {
  const ds = new DecompressionStream('deflate-raw');
  const akis = new Blob([veri]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(akis).arrayBuffer());
}

export async function zipOku(bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let son = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) if (v.getUint32(i, true) === 0x06054b50) { son = i; break; }
  if (son < 0) throw new Error('zip');
  const adet = v.getUint16(son + 10, true);
  let p = v.getUint32(son + 16, true);
  const dosyalar = new Map();
  for (let k = 0; k < adet; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('zip');
    const yontem = v.getUint16(p + 10, true);
    const sikisik = v.getUint32(p + 20, true);
    const adUz = v.getUint16(p + 28, true), ekUz = v.getUint16(p + 30, true), yorumUz = v.getUint16(p + 32, true);
    const yerel = v.getUint32(p + 42, true);
    const ad = new TextDecoder().decode(b.subarray(p + 46, p + 46 + adUz));
    dosyalar.set(ad, { yontem, sikisik, yerel });
    p += 46 + adUz + ekUz + yorumUz;
  }
  return {
    adlar: [...dosyalar.keys()],
    async metin(ad) {
      const d = dosyalar.get(ad);
      if (!d) return null;
      const lp = d.yerel;
      if (v.getUint32(lp, true) !== 0x04034b50) throw new Error('zip');
      const bas = lp + 30 + v.getUint16(lp + 26, true) + v.getUint16(lp + 28, true);
      const ham = b.subarray(bas, bas + d.sikisik);
      const acik = d.yontem === 0 ? ham : d.yontem === 8 ? await inflate(ham) : null;
      if (!acik) throw new Error('zip');
      return new TextDecoder('utf-8').decode(acik);
    },
  };
}

const sutunNo = ref => { let n = 0; for (const c of ref.replace(/\d+/g, '')) n = n * 26 + (c.charCodeAt(0) - 64); return n - 1; };

export async function xlsxSatirlari(bayt) {
  const z = await zipOku(bayt);
  const paylasilan = [];
  const ss = await z.metin('xl/sharedStrings.xml');
  if (ss) for (const si of ss.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) paylasilan.push(varlikCoz([...si[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m => m[1]).join('')));
  const sayfaAdi = z.adlar.filter(a => /^xl\/worksheets\/sheet\d+\.xml$/.test(a)).sort()[0];
  if (!sayfaAdi) throw new Error('xlsx');
  const xml = await z.metin(sayfaAdi);
  const satirlar = [];
  for (const r of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const hucre = [];
    for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = (c[1].match(/\br="([A-Z]+\d+)"/) || [])[1];
      const tip = (c[1].match(/\bt="(\w+)"/) || [])[1];
      const ic = c[2] ?? '';
      let deger = '';
      if (tip === 's') deger = paylasilan[Number((ic.match(/<v>([\s\S]*?)<\/v>/) || [])[1])] ?? '';
      else if (tip === 'inlineStr') deger = varlikCoz([...ic.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m => m[1]).join(''));
      else deger = varlikCoz((ic.match(/<v>([\s\S]*?)<\/v>/) || [])[1] ?? '');
      const i = ref ? sutunNo(ref) : hucre.length;
      hucre[i] = deger.replace(/[\s ]+/g, ' ').trim();
    }
    for (let i = 0; i < hucre.length; i++) if (hucre[i] === undefined) hucre[i] = '';
    if (hucre.some(Boolean)) satirlar.push(hucre);
  }
  return satirlar;
}

// ---------------------------------------------------------------- değer çözme
export function sayiCoz(s) {
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  let x = String(s ?? '').replace(/[\s  ']/g, '').replace(/[−–]/g, '-');
  if (!x) return null;
  if (x.includes(',') && x.includes('.')) x = x.lastIndexOf(',') > x.lastIndexOf('.') ? x.replace(/\./g, '').replace(',', '.') : x.replace(/,/g, '');
  else if (x.includes(',')) x = /,\d{3}$/.test(x) && !/^-?0,/.test(x) && x.split(',').length > 2 ? x.replace(/,/g, '') : x.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(x)) return null;
  return Number(x);
}

// "2026.10.20 14:35:12", "2026.10.20 14:35", "2026-10-20 14:35:12", "20.10.2026 14:35"
// Excel seri günü (XLSX'te tarih sayı olarak gelebilir) da kabul edilir.
export function zamanCoz(s) {
  const t = String(s ?? '').trim();
  let m = t.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)) / 1000;
  m = t.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)) / 1000;
  if (/^\d{5}(\.\d+)?$/.test(t)) { const g = Number(t); if (g > 30000 && g < 80000) return Math.round((g - 25569) * 86400); }
  return null;
}

export function yonCoz(s) {
  const t = String(s ?? '').trim().toLowerCase();
  if (/^(buy|al|alış|alis|kauf|compra|achat)\b/.test(t)) return 'al';
  if (/^(sell|sat|satış|satis|verkauf|venta|vente)\b/.test(t)) return 'sat';
  return null;
}

// ---------------------------------------------------------------- sütun adları
const norm = s => String(s ?? '').toLowerCase().replace(/\u0307/g, '').replace(/[\s/._:]+/g, '').replace(/[âà]/g, 'a').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u');
const ADLAR = {
  zaman: ['time', 'zaman', 'saat', 'opentime', 'acilisZamani', 'tarih', 'zeit', 'tiempo', 'heure'],
  pozisyon: ['position', 'pozisyon', 'ticket', 'bilet', 'positionid'],
  islemNo: ['deal', 'islem', 'anlasma', 'deals'],
  sembol: ['symbol', 'sembol', 'enstruman', 'symbole', 'simbolo'],
  tip: ['type', 'tip', 'tur', 'typ', 'tipo'],
  yonSutun: ['direction', 'yon', 'richtung', 'direccion'],
  hacim: ['volume', 'hacim', 'lot', 'lots', 'volumen'],
  fiyat: ['price', 'fiyat', 'preis', 'precio', 'prix'],
  sl: ['sl', 'stoploss', 'zararDurdur'],
  tp: ['tp', 'takeprofit', 'karAl'],
  komisyon: ['commission', 'komisyon', 'kommission', 'comision'],
  ucret: ['fee', 'ucret', 'gebuhr'],
  swap: ['swap'],
  kar: ['profit', 'kar', 'kâr', 'gewinn', 'beneficio', 'resultat'],
  bakiye: ['balance', 'bakiye', 'kontostand', 'saldo', 'solde'],
  yorum: ['comment', 'yorum', 'kommentar', 'comentario'],
  emir: ['order', 'emir', 'auftrag', 'orden'],
  durum: ['state', 'durum', 'zustand', 'estado'],
};
const AD_HARITA = new Map();
for (const [k, liste] of Object.entries(ADLAR)) for (const a of liste) AD_HARITA.set(norm(a), k);
const adTuru = h => AD_HARITA.get(norm(h)) ?? null;

const BOLUM = {
  pozisyonlar: ['positions', 'pozisyonlar', 'positionen', 'posiciones'],
  emirler: ['orders', 'emirler', 'auftrage', 'ordenes', 'ordres'],
  islemler: ['deals', 'islemler', 'anlasmalar', 'geschafte', 'transacciones', 'transactions'],
  sonuclar: ['results', 'sonuclar', 'ergebnisse', 'resultados', 'resultats'],
};
const bolumTuru = satir => {
  if (satir.filter(Boolean).length !== 1) return null;
  const n = norm(satir.find(Boolean));
  for (const [k, liste] of Object.entries(BOLUM)) if (liste.some(a => norm(a) === n)) return k;
  return null;
};

// Bir satırın başlık satırı olup olmadığı ve hangi tabloya ait olduğu.
function baslikTuru(satir) {
  const turler = satir.map(adTuru);
  const tanınan = turler.filter(Boolean).length;
  if (tanınan < 5 || tanınan < satir.filter(Boolean).length * 0.6) return null;
  const say = k => turler.filter(t => t === k).length;
  if (say('yonSutun') || say('bakiye')) return { tur: 'islemler', turler };
  if (say('durum')) return { tur: 'emirler', turler };
  if (say('zaman') >= 2 && say('fiyat') >= 2 && say('kar')) return { tur: 'pozisyonlar', turler };
  return null;
}

// Pozisyon tablosu için sütun dizinleri: adlarla, tekrar edenlerde sırayla (ilk = açılış).
function pozisyonSutunlari(turler) {
  const hepsi = k => turler.map((t, i) => (t === k ? i : -1)).filter(i => i >= 0);
  const z = hepsi('zaman'), f = hepsi('fiyat');
  const s = { acilisZamani: z[0], kapanisZamani: z[1], acilisFiyati: f[0], kapanisFiyati: f[1] };
  for (const k of ['pozisyon', 'sembol', 'tip', 'hacim', 'sl', 'tp', 'komisyon', 'swap', 'kar', 'yorum']) {
    const i = hepsi(k); s[k] = i.length ? i[0] : -1;
  }
  return s;
}
// MT5 Positions tablosunun sabit sırası (ad tanınmazsa).
const POZISYON_SIRA = { acilisZamani: 0, pozisyon: 1, sembol: 2, tip: 3, hacim: 4, acilisFiyati: 5, sl: 6, tp: 7, kapanisZamani: 8, kapanisFiyati: 9, komisyon: 10, swap: 11, kar: 12, yorum: -1 };

function islemSutunlari(turler) {
  const ilkI = k => turler.indexOf(k);
  return { zaman: ilkI('zaman'), tip: ilkI('tip'), kar: ilkI('kar'), yorum: ilkI('yorum') };
}

// ---------------------------------------------------------------- satırlar → hesap
export function satirlardanHesap(satirlar, kaynak = 'mt5-html') {
  let para = null;
  for (const s of satirlar.slice(0, 40)) {
    for (let i = 0; i < s.length; i++) {
      if (/^(account|hesap|konto|cuenta|compte)\s*:?$/i.test(s[i])) {
        const m = (s.slice(i + 1).join(' ').match(/\(([A-Z]{3})\s*,/) || [])[1];
        if (m) para = m;
      }
    }
    if (para) break;
  }
  const islemler = [];
  const hareketler = [];
  let atlanan = 0;
  let bolum = null, baslik = null, sutun = null, pozisyonBasligiVar = false;
  for (const satir of satirlar) {
    const b = bolumTuru(satir);
    if (b) { bolum = b; baslik = null; sutun = null; continue; }
    const bt = baslikTuru(satir);
    if (bt) {
      baslik = bt.tur; bolum = bt.tur;
      if (bt.tur === 'pozisyonlar') { sutun = pozisyonSutunlari(bt.turler); pozisyonBasligiVar = true; }
      else if (bt.tur === 'islemler') sutun = islemSutunlari(bt.turler);
      else sutun = null;
      continue;
    }
    if (bolum === 'pozisyonlar') {
      const c = sutun ?? POZISYON_SIRA;
      const al = k => (c[k] >= 0 ? satir[c[k]] : undefined);
      const acilis = zamanCoz(al('acilisZamani'));
      if (acilis === null) continue; // ara/toplam satırları
      const yon = yonCoz(al('tip'));
      const i = {
        id: al('pozisyon') ?? null,
        sembol: al('sembol') ?? '',
        yon,
        lot: sayiCoz(al('hacim')?.split('/')[0]),
        acilisZamani: acilis,
        acilisFiyati: sayiCoz(al('acilisFiyati')),
        kapanisZamani: zamanCoz(al('kapanisZamani')),
        kapanisFiyati: sayiCoz(al('kapanisFiyati')),
        sl: sayiCoz(al('sl')), tp: sayiCoz(al('tp')),
        komisyon: sayiCoz(al('komisyon')) ?? 0,
        swap: sayiCoz(al('swap')) ?? 0,
        brut: sayiCoz(al('kar')),
        yorum: al('yorum') ?? '',
      };
      if (!yon || i.kapanisZamani === null || i.brut === null || !i.lot) { atlanan++; continue; }
      islemler.push(i);
    } else if (bolum === 'islemler' && sutun) {
      const zaman = zamanCoz(satir[sutun.zaman]);
      if (zaman === null) continue;
      const tip = norm(satir[sutun.tip]);
      if (!/^(balance|bakiye|credit|kredi|correction|duzeltme|bonus|charge|deposit|withdrawal)/.test(tip)) continue;
      const tutar = sayiCoz(satir[sutun.kar]);
      if (tutar === null || tutar === 0) continue;
      hareketler.push({ zaman, tutar, tur: /^(balance|bakiye|deposit|withdrawal)/.test(tip) ? (tutar > 0 ? 'yatirma' : 'cekme') : 'diger' });
    }
  }
  // Başlık ve bölüm adları tanınmadıysa (başka arayüz dili): MT5 Positions sırasına uyan satırlar.
  if (!islemler.length) {
    for (const satir of satirlar) {
      if (satir.length < 13) continue;
      const al = k => satir[POZISYON_SIRA[k]];
      const acilis = zamanCoz(al('acilisZamani')), kapanis = zamanCoz(al('kapanisZamani')), yon = yonCoz(al('tip'));
      const lot = sayiCoz(al('hacim')?.split('/')[0]), brut = sayiCoz(al('kar'));
      if (acilis === null || kapanis === null || !yon || !lot || brut === null) continue;
      islemler.push({ id: al('pozisyon'), sembol: al('sembol'), yon, lot, acilisZamani: acilis, acilisFiyati: sayiCoz(al('acilisFiyati')),
        kapanisZamani: kapanis, kapanisFiyati: sayiCoz(al('kapanisFiyati')), sl: sayiCoz(al('sl')), tp: sayiCoz(al('tp')),
        komisyon: sayiCoz(al('komisyon')) ?? 0, swap: sayiCoz(al('swap')) ?? 0, brut });
    }
  }
  const hesap = hesapOlustur({ kaynak, para, islemler, bakiyeHareketleri: hareketler, atlanan });
  hesap.pozisyonTablosu = pozisyonBasligiVar || islemler.length > 0;
  return hesap;
}

// Dosya adı ve içeriğine göre biçimi seçer. Dönüş: hesap (model.js) ya da hata fırlatır.
export async function raporuOku(ad, bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  const zipMi = b[0] === 0x50 && b[1] === 0x4b;
  if (zipMi || /\.xlsx$/i.test(ad)) return satirlardanHesap(await xlsxSatirlari(b), 'mt5-xlsx');
  const metin = baytlariMetneCevir(b);
  if (/<table\b/i.test(metin)) return satirlardanHesap(htmlSatirlari(metin), 'mt5-html');
  return null; // HTML/XLSX değil: çağıran CSV'yi dener
}
