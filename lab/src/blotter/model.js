// FX blotter kanonik modeli ve ortak yardımcılar (docs/fx-blotter-spec.md §3.2).
// Saf modül: DOM yok, ağ yok. Bir satır = bir bacak (leg).
//
// Bacak alanları (özet):
//   id, satirNo, kaynakId (hash), urun ('spot'|'forward'|'swap'|'ndf'|'nds'), bacakRol ('tek'|'yakin'|'uzak'),
//   baglantiId (hash), islemTarihi ('YYYY-MM-DD'), islemZamani (UTC sn ya da null), valor ('YYYY-MM-DD'),
//   base, kote, parite ('EUR/USD'), yon ('al'|'sat': BASE dövizi, BİZİM gözümüzden),
//   baseTutar (al +, sat −), koteTutar (ters işaret), kur (all-in, kote/base), spotKur, puan,
//   dealtDoviz, fixingTarihi, fixingKur, odemeDovizi, portfoy, trader, karsiTarafTipi, karsiTarafHash,
//   maliyetKur, tlKarsiligi.

import { sha256 } from '../../core/src/manifest.js';

// ISO 4217 (yaygın) + kıymetli metaller. Ondalık hane: JPY/KRW 0, BHD/KWD/OMR/JOD/TND 3 [DY: sabit tablo].
export const DOVIZ_ONDALIK = {
  USD: 2, EUR: 2, GBP: 2, JPY: 0, CHF: 2, CAD: 2, AUD: 2, NZD: 2, SEK: 2, NOK: 2, DKK: 2, TRY: 2,
  PLN: 2, CZK: 2, HUF: 2, RON: 2, BGN: 2, RUB: 2, ZAR: 2, MXN: 2, BRL: 2, CLP: 0, COP: 2, PEN: 2,
  ARS: 2, CNY: 2, CNH: 2, HKD: 2, SGD: 2, KRW: 0, TWD: 2, INR: 2, IDR: 2, MYR: 2, PHP: 2, THB: 2,
  ILS: 2, SAR: 2, AED: 2, QAR: 2, KWD: 3, BHD: 3, OMR: 3, JOD: 3, TND: 3, EGP: 2, KZT: 2, UAH: 2,
  GEL: 2, AZN: 2, MAD: 2, NGN: 2, KES: 2, PKR: 2, VND: 0, ISK: 0, RSD: 2,
  XAU: 2, XAG: 2, XPT: 2, XPD: 2,
};
export const dovizMi = k => Object.prototype.hasOwnProperty.call(DOVIZ_ONDALIK, k);

// Piyasa konvansiyonu (base önceliği): metaller > EUR > GBP > AUD > NZD > USD > CAD > CHF > NOK, SEK, DKK > diğerleri.
// [DY] yaygın pratik; EUR/TRY, USD/TRY, GBP/TRY, USD/JPY, EUR/GBP doğru sırayı verir.
const ONCELIK = ['XAU', 'XAG', 'XPT', 'XPD', 'EUR', 'GBP', 'AUD', 'NZD', 'USD', 'CAD', 'CHF', 'NOK', 'SEK', 'DKK'];
const sira = k => { const i = ONCELIK.indexOf(k); return i < 0 ? 99 : i; };
// İki dövizden piyasa konvansiyonuna göre [base, kote]. Eşitlikte (ikisi de "diğer") verilen sıra korunur.
export function konvansiyon(a, b) {
  return sira(b) < sira(a) ? [b, a] : [a, b];
}

// "EUR/USD", "EURUSD", "EUR-USD", "EUR.USD", "EUR USD" → ['EUR','USD'] (kaynaktaki sıra).
export function pariteCoz(s) {
  const m = String(s ?? '').trim().toUpperCase().match(/^([A-Z]{3})\s*[/ .\-_]?\s*([A-Z]{3})$/);
  if (!m || !dovizMi(m[1]) || !dovizMi(m[2]) || m[1] === m[2]) return null;
  return [m[1], m[2]];
}

// ---------------------------------------------------------------- metin normalize (Türkçe kurallı)
export function norm(s) {
  return String(s ?? '')
    .replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ---------------------------------------------------------------- sayılar (§3.4, vaka 9)
// Biçim: 'nokta' (1,234.56), 'virgul' (1.234,56) ya da null (çöz). Boşluk, ince boşluk, kesme işareti
// binlik ayırıcıdır. "(1.000,00)" ve "1.000-" negatiftir.
export function sayiBicimiTahmin(degerler) {
  let nokta = 0, virgul = 0;
  for (const v0 of degerler) {
    if (typeof v0 === 'number') continue;
    const v = String(v0 ?? '').replace(/[\s  ']/g, '');
    const iN = v.lastIndexOf('.'), iV = v.lastIndexOf(',');
    if (iN >= 0 && iV >= 0) { if (iV > iN) virgul++; else nokta++; continue; }
    if (iV >= 0) {
      const parca = v.split(',');
      if (parca.length > 2) nokta++; // 1,234,567 → binlik virgül
      else if (parca[1].replace(/\D/g, '').length !== 3) virgul++; // 12,5 → ondalık virgül
    } else if (iN >= 0) {
      const parca = v.split('.');
      if (parca.length > 2) virgul++; // 1.234.567 → binlik nokta
      else if (parca[1].replace(/\D/g, '').length !== 3) nokta++;
    }
  }
  if (virgul > nokta) return 'virgul';
  if (nokta > virgul) return 'nokta';
  return null;
}

export function sayiAyristir(s, bicim = null) {
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  let x = String(s ?? '').trim();
  if (!x) return null;
  let neg = false;
  if (/^\(.*\)$/.test(x)) { neg = true; x = x.slice(1, -1); }
  x = x.replace(/[\s  ']/g, '').replace(/[−–]/g, '-');
  if (/-$/.test(x)) { neg = !neg; x = x.slice(0, -1); }
  if (/^-/.test(x)) { neg = !neg; x = x.slice(1); }
  x = x.replace(/^\+/, '');
  if (!/^[\d.,]+$/.test(x) || !/\d/.test(x)) return null;
  const iN = x.lastIndexOf('.'), iV = x.lastIndexOf(',');
  let b = bicim;
  if (iN >= 0 && iV >= 0) b = iV > iN ? 'virgul' : 'nokta';
  else if (!b) {
    if (iV >= 0) b = x.split(',').length > 2 || (x.split(',')[1].length === 3 && x.split(',')[0] !== '0') ? 'nokta' : 'virgul';
    else if (iN >= 0) b = x.split('.').length > 2 ? 'virgul' : 'nokta';
    else b = 'nokta';
  }
  if (b === 'virgul') {
    if (x.split(',').length > 2) return null;
    x = x.replace(/\./g, '').replace(',', '.');
  } else {
    if (x.split('.').length > 2) return null;
    x = x.replace(/,/g, '');
  }
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(x)) return null;
  const n = Number(x);
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}

// ---------------------------------------------------------------- tarihler
// Tarih biçimi sütun bazında: 'ymd' | 'dmy' | 'mdy' | 'yyyymmdd' | 'excel'.
const RE_YMD = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/;
const RE_XYZ = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})/;
const RE_KOMPAKT = /^(\d{4})(\d{2})(\d{2})(?:[-T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/;

export function tarihBicimiTahmin(degerler) {
  let dmy = 0, mdy = 0, ymd = 0, kompakt = 0, excel = 0, belirsiz = 0;
  for (const v0 of degerler) {
    const v = String(v0 ?? '').trim();
    if (!v) continue;
    if (RE_YMD.test(v)) { ymd++; continue; }
    if (RE_KOMPAKT.test(v)) { kompakt++; continue; }
    const m = v.match(RE_XYZ);
    if (m) {
      if (+m[1] > 12) dmy++;
      else if (+m[2] > 12) mdy++;
      else belirsiz++;
      continue;
    }
    if (/^\d{5}(\.\d+)?$/.test(v) && +v > 30000 && +v < 80000) excel++;
  }
  const say = { ymd, yyyymmdd: kompakt, excel, dmy, mdy };
  let en = null, enN = 0;
  for (const [k, n] of Object.entries(say)) if (n > enN) { en = k; enN = n; }
  if (!en && belirsiz) return { bicim: 'dmy', belirsiz: true }; // belirsiz: Avrupa/Türkiye varsayılanı, onay ekranında sorulur
  if ((en === 'dmy' || en === 'mdy') && dmy && mdy) return { bicim: en, celiski: true };
  return { bicim: en, belirsiz: en === 'dmy' && !dmy && belirsiz > 0 };
}

const pad = n => String(n).padStart(2, '0');
const gecerliGun = (y, a, g) => {
  if (!(y > 1900 && y < 2200 && a >= 1 && a <= 12 && g >= 1 && g <= 31)) return null;
  const d = new Date(Date.UTC(y, a - 1, g));
  return d.getUTCMonth() === a - 1 ? `${y}-${pad(a)}-${pad(g)}` : null;
};

// Tarih (ve varsa saat) → { gun: 'YYYY-MM-DD', saniye: gün içi saniye ya da null }.
export function tarihAyristir(s, bicim = null) {
  if (typeof s === 'number') s = String(s);
  const v = String(s ?? '').trim();
  if (!v) return null;
  const saatAl = rest => {
    const m = String(rest ?? '').match(/(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?/);
    return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+(m[3] ?? 0)) : null;
  };
  let m = v.match(RE_KOMPAKT);
  if (m) {
    const gun = gecerliGun(+m[1], +m[2], +m[3]);
    return gun ? { gun, saniye: m[4] ? (+m[4]) * 3600 + (+m[5]) * 60 + (+(m[6] ?? 0)) : null } : null;
  }
  m = v.match(RE_YMD);
  if (m) { const gun = gecerliGun(+m[1], +m[2], +m[3]); return gun ? { gun, saniye: saatAl(v.slice(m[0].length)) } : null; }
  m = v.match(RE_XYZ);
  if (m) {
    const ilkGun = bicim === 'mdy' ? false : bicim === 'dmy' ? true : +m[1] > 12 || +m[2] <= 12;
    const gun = ilkGun ? gecerliGun(+m[3], +m[2], +m[1]) : gecerliGun(+m[3], +m[1], +m[2]);
    return gun ? { gun, saniye: saatAl(v.slice(m[0].length)) } : null;
  }
  if (/^\d{5}(\.\d+)?$/.test(v)) {
    const g = Number(v);
    if (g > 30000 && g < 80000) {
      const ms = Math.round((g - 25569) * 86400) * 1000;
      const d = new Date(ms);
      const sn = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
      return { gun: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, saniye: g % 1 ? sn : null };
    }
  }
  return null;
}

// Yalnız saat sütunu ("10:42:15", "08:14:03.112", Excel gün kesri 0.4460).
export function saatAyristir(s) {
  const v = String(s ?? '').trim();
  let m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,]\d+)?)?$/);
  if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + (+(m[3] ?? 0));
  if (/^0?\.\d+$/.test(v)) return Math.round(Number(v) * 86400) % 86400;
  return null;
}

export const gunSayisi = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
export function gunEkle(gun, n) {
  const d = new Date(Date.parse(gun + 'T00:00:00Z') + n * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
// İş günü ekle (yalnız hafta sonu atlanır; tatil takvimi yok [DY]).
export function isGunuEkle(gun, n) {
  let g = gun, k = 0;
  while (k < n) { g = gunEkle(g, 1); const h = new Date(g + 'T00:00:00Z').getUTCDay(); if (h !== 0 && h !== 6) k++; }
  return g;
}
// Spot valör: T+2 iş günü; USD/CAD, USD/RUB, USD/PHP, USD/KZT T+1 [DY]. Tatil takvimi yok.
const T1 = new Set(['CAD', 'RUB', 'PHP', 'KZT']);
export function spotTarihi(islemTarihi, base, kote) {
  const t1 = (base === 'USD' && T1.has(kote)) || (kote === 'USD' && T1.has(base));
  return isGunuEkle(islemTarihi, t1 ? 1 : 2);
}

// ---------------------------------------------------------------- gizlilik
// Kaynak id, karşı taraf ve LEI: oturum tuzlu SHA-256 (ilk 16 hane). Ham değer saklanmaz (§3.8).
export function hashle(deger, tuz) {
  const v = String(deger ?? '').trim();
  if (!v) return null;
  return sha256(`${tuz}|${v}`).slice(0, 16);
}

export function rastgeleTuz() {
  const b = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(b);
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('') || String(Date.now());
}

// Kote tutarını yuvarlama payıyla karşılaştırma (§3.4): göreli fark sınırı.
export const KUR_TOLERANS = 5e-4;
export const yakin = (a, b, tol = KUR_TOLERANS) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-12);
export const yuvarla = (x, b = 2) => Math.round((x + Number.EPSILON * Math.sign(x)) * 10 ** b) / 10 ** b;
