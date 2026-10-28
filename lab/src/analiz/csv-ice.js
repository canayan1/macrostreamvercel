// Genel işlem listesi (CSV ya da tablo): her satır bir kapanmış işlem. Sütunlar başlıktan
// tahmin edilir, kullanıcı eşleşmeyi değiştirebilir. "Kalibre trade log" şablonu v1 sütunları
// (docs/analiz-modeli.md bölüm 7) birebir tanınır. Saf modül: DOM yok.
//
// Hiçbir satır sessizce düşmez: okunamayan her satır numarası ve nedeniyle `hatalar` listesine
// girer. Tamamen boş satırlar yok sayılır (hata sayılmaz).

import { hesapOlustur } from './model.js';
import { sayiCoz, zamanCoz, yonCoz } from './mt5-rapor.js';

export const SABLON_SURUMU = 'kalibre-trade-log-v1';
// Şablonun sütun sırası (indirilebilir dosyalarla aynı).
export const SABLON_SUTUNLARI = [
  'open_time', 'close_time', 'symbol', 'side', 'volume', 'open_price', 'close_price', 'profit',
  'commission', 'swap', 'stop_loss', 'take_profit', 'utc_offset', 'account_currency',
  'ticket', 'row_type', 'strategy', 'tag', 'note',
];
export const SABLON_ZORUNLU = ['open_time', 'close_time', 'symbol', 'side', 'volume', 'open_price', 'close_price', 'profit'];

export const CSV_ALANLARI = ['acilisZamani', 'kapanisZamani', 'sembol', 'yon', 'lot', 'acilisFiyati', 'kapanisFiyati', 'sl', 'tp', 'komisyon', 'swap', 'kar', 'net', 'ofset', 'para', 'bilet', 'satirTuru', 'strateji', 'etiket', 'not'];
export const ZORUNLU = ['kapanisZamani', 'sembol', 'yon', 'lot'];

const norm = s => String(s ?? '').toLowerCase().replace(/̇/g, '').replace(/[\s_\-./()]+/g, '').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a');
const ESANLAM = {
  acilisZamani: ['open_time', 'opentime', 'opendate', 'entrytime', 'opened', 'acilis', 'acilistarihi', 'acilisZamani', 'time'],
  kapanisZamani: ['close_time', 'closetime', 'closedate', 'exittime', 'closed', 'kapanis', 'kapanistarihi', 'kapanisZamani'],
  sembol: ['symbol', 'sembol', 'instrument', 'pair', 'market', 'ticker'],
  yon: ['side', 'type', 'direction', 'yon', 'tip', 'action'],
  lot: ['volume', 'lots', 'lot', 'size', 'quantity', 'qty', 'hacim'],
  acilisFiyati: ['open_price', 'openprice', 'entryprice', 'acilisfiyati', 'entry'],
  kapanisFiyati: ['close_price', 'closeprice', 'exitprice', 'kapanisfiyati', 'exit'],
  sl: ['stop_loss', 'sl', 'stoploss', 'stop'],
  tp: ['take_profit', 'tp', 'takeprofit', 'target'],
  komisyon: ['commission', 'commissions', 'komisyon', 'fees', 'fee'],
  swap: ['swap', 'swaps', 'rollover'],
  kar: ['profit', 'grossprofit', 'pnl', 'kar', 'kâr'],
  net: ['net_profit', 'netprofit', 'netpnl', 'net', 'netkar'],
  ofset: ['utc_offset', 'utcoffset', 'timezone', 'tz', 'saatdilimi'],
  para: ['account_currency', 'accountcurrency', 'currency', 'parabirimi'],
  bilet: ['ticket', 'id', 'position', 'positionid', 'tradeid', 'bilet'],
  satirTuru: ['row_type', 'rowtype', 'satirturu'],
  strateji: ['strategy', 'strateji', 'setup'],
  etiket: ['tag', 'tags', 'etiket'],
  not: ['note', 'notes', 'comment', 'not', 'yorum'],
};
const SABLON_ALAN = {
  open_time: 'acilisZamani', close_time: 'kapanisZamani', symbol: 'sembol', side: 'yon', volume: 'lot',
  open_price: 'acilisFiyati', close_price: 'kapanisFiyati', profit: 'kar', net_profit: 'net', commission: 'komisyon', swap: 'swap',
  stop_loss: 'sl', take_profit: 'tp', utc_offset: 'ofset', account_currency: 'para', ticket: 'bilet',
  row_type: 'satirTuru', strategy: 'strateji', tag: 'etiket', note: 'not',
};

export function ayiriciBul(ilkSatir) {
  const say = c => ilkSatir.split(c).length - 1;
  return ['\t', ';', ','].reduce((e, c) => (say(c) > say(e) ? c : e), ',');
}

// CSV → satır dizileri. Her satırın `no` özelliği dosyadaki satır numarasıdır (1'den başlar;
// tırnak içinde satır sonu olan alanlar numarayı doğru ilerletir).
export function csvSatirlari(metin, ayirici = ayiriciBul(String(metin).replace(/^﻿/, '').split(/\r?\n/)[0] ?? '')) {
  const satirlar = [];
  let satir = [], alan = '', tirnak = false, satirNo = 1, basNo = 1;
  const s = String(metin).replace(/^﻿/, '');
  const bitir = () => {
    satir.push(alan.trim()); alan = '';
    if (satir.some(Boolean)) { satir.no = basNo; satirlar.push(satir); }
    satir = [];
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) {
      if (c === '"' && s[i + 1] === '"') { alan += '"'; i++; }
      else if (c === '"') tirnak = false;
      else { if (c === '\n') satirNo++; alan += c; }
    } else if (c === '"') tirnak = true;
    else if (c === ayirici) { satir.push(alan.trim()); alan = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      bitir();
      satirNo++; basNo = satirNo;
    } else alan += c;
  }
  bitir();
  return satirlar;
}

// Başlıklardan alan → sütun dizini tahmini. Şablon adları önce, sonra eş anlamlılar.
export function sutunTahmin(basliklar) {
  const e = {};
  const n = basliklar.map(norm);
  const kullanildi = new Set();
  for (const [ad, alan] of Object.entries(SABLON_ALAN)) {
    const i = n.indexOf(norm(ad));
    if (i >= 0 && !kullanildi.has(i) && !(e[alan] >= 0)) { e[alan] = i; kullanildi.add(i); }
  }
  for (const alan of CSV_ALANLARI) {
    if (e[alan] >= 0) continue;
    const liste = ESANLAM[alan].map(norm);
    const i = n.findIndex((h, k) => liste.includes(h) && !kullanildi.has(k));
    e[alan] = i;
    if (i >= 0) kullanildi.add(i);
  }
  return e;
}

// Başlık satırı: şablon sütunlarından en çoğunu içeren ilk 10 satırdan biri (başlıktan önce
// açıklama satırları olabilir). En az 4 şablon sütunu yoksa ilk satır.
function baslikBul(satirlar) {
  const sablon = new Set(SABLON_SUTUNLARI.map(norm));
  let en = 0, enSay = 0;
  for (let k = 0; k < Math.min(10, satirlar.length); k++) {
    const say = satirlar[k].filter(h => sablon.has(norm(h))).length;
    if (say > enSay) { en = k; enSay = say; }
  }
  const indis = enSay >= 4 ? en : 0;
  const n = new Set((satirlar[indis] ?? []).map(norm));
  return { indis, sablon: SABLON_ZORUNLU.every(z => n.has(norm(z))) };
}

// "+02:00", "+2", "-0530", "UTC+3", "GMT-5", "Z" → saniye. Boş → null. Geçersiz → NaN.
export function ofsetCoz(s) {
  const t = String(s ?? '').trim().toUpperCase().replace(/^(UTC|GMT)\s*/, '');
  if (!t) return null;
  if (t === 'Z' || t === '0') return 0;
  const m = t.match(/^([+\-−])?(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return NaN;
  const sn = (+m[2] * 3600 + +(m[3] ?? 0) * 60) * (m[1] === '-' || m[1] === '−' ? -1 : 1);
  return Math.abs(sn) <= 14 * 3600 ? sn : NaN;
}

// Zaman + isteğe bağlı ofset. ISO 8601 ("2026-04-01T09:15:00", milisaniye ve "Z"/"+02:00" son
// ekiyle) ya da zamanCoz'un kabul ettiği biçimler. Dönüş { sn, ofset } (ofset saniye ya da null).
export function zamanOfsetCoz(s) {
  const t = String(s ?? '').trim();
  const m = t.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}:\d{2}(?::\d{2})?)(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/i);
  if (m) return { sn: zamanCoz(`${m[1]} ${m[2]}`), ofset: m[3] ? ofsetCoz(m[3]) : null };
  return { sn: zamanCoz(t), ofset: null };
}

export function yonCozGenis(s) {
  const y = yonCoz(s);
  if (y) return y;
  const t = String(s ?? '').trim().toLowerCase();
  if (/^(long|b|l)$/.test(t)) return 'al';
  if (/^(short|s)$/.test(t)) return 'sat';
  return null;
}

const SATIR_TURU = {
  '': 'islem', trade: 'islem', islem: 'islem',
  deposit: 'yatirma', yatirma: 'yatirma', withdrawal: 'cekme', withdraw: 'cekme', cekme: 'cekme',
  balance: 'diger', adjustment: 'diger', bakiye: 'diger', diger: 'diger',
};

// Satır dizilerinden hesap. eslesme verilmezse başlıktan tahmin edilir.
// Dönüş: { hesap, eksik, basliklar, eslesme, hatalar: [{satir, alan, neden}], okunan, atlanan,
//          sablon, sentetik, onerilenUtcFarki }
export function tablodanHesap(tumSatirlar, eslesme = null, { kaynak = 'csv' } = {}) {
  const bos = { hesap: null, hatalar: [], okunan: 0, atlanan: 0, sablon: false, sentetik: 0, onerilenUtcFarki: null };
  if (tumSatirlar.length < 2) return { ...bos, eksik: [...ZORUNLU], basliklar: tumSatirlar[0] ?? [], eslesme: {} };
  const { indis, sablon } = baslikBul(tumSatirlar);
  const basliklar = tumSatirlar[indis];
  const satirlar = tumSatirlar.slice(indis + 1);
  const e = eslesme ?? sutunTahmin(basliklar);
  const eksik = ZORUNLU.filter(k => !(e[k] >= 0));
  if (!(e.kar >= 0) && !(e.net >= 0)) eksik.push('kar');
  if (eksik.length) return { ...bos, eksik, basliklar, eslesme: e, sablon };
  const al = (s, k) => (e[k] >= 0 ? s[e[k]] : undefined);
  const dolu = v => v !== undefined && v !== null && String(v).trim() !== '';
  const hatalar = [], islemler = [], hareketler = [];
  let para = null, sentetik = 0;
  const ofsetler = new Set();
  const sayiAl = (s, k, alan, gerekli, sh) => {
    const v = al(s, k);
    if (!dolu(v)) { if (gerekli) sh.push({ alan, neden: 'boş' }); return null; }
    const x = sayiCoz(v);
    if (x === null) sh.push({ alan, neden: 'sayı değil' });
    return x;
  };
  satirlar.forEach((s, k) => {
    const no = s.no ?? (indis + k + 2);
    const sh = [];
    const tur = SATIR_TURU[norm(al(s, 'satirTuru') ?? '')];
    if (tur === undefined) { hatalar.push({ satir: no, alan: 'row_type', neden: 'bilinmeyen satır türü' }); return; }
    if (/synthetic|sentetik/i.test(`${al(s, 'etiket') ?? ''} ${al(s, 'not') ?? ''}`)) sentetik++;
    const pb = String(al(s, 'para') ?? '').trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(pb)) para ??= pb;
    let ofset = dolu(al(s, 'ofset')) ? ofsetCoz(al(s, 'ofset')) : null;
    if (Number.isNaN(ofset)) { sh.push({ alan: 'utc_offset', neden: 'geçersiz UTC farkı' }); ofset = null; }
    const kz = zamanOfsetCoz(al(s, 'kapanisZamani'));
    if (!dolu(al(s, 'kapanisZamani'))) sh.push({ alan: 'close_time', neden: 'boş' });
    else if (kz.sn === null) sh.push({ alan: 'close_time', neden: 'tarih değil' });
    if (tur !== 'islem') {
      const tutar = e.net >= 0 && dolu(al(s, 'net')) ? sayiCoz(al(s, 'net')) : sayiCoz(al(s, 'kar'));
      if (tutar === null) sh.push({ alan: 'profit', neden: 'tutar yok' });
      if (sh.length) { hatalar.push({ satir: no, ...sh[0] }); return; }
      const o = kz.ofset ?? ofset;
      if (o !== null) ofsetler.add(o);
      hareketler.push({ zaman: kz.sn - (o ?? 0), tutar, tur, _o: o });
      return;
    }
    const acHam = al(s, 'acilisZamani');
    const az = dolu(acHam) ? zamanOfsetCoz(acHam) : kz;
    if (dolu(acHam) && az.sn === null) sh.push({ alan: 'open_time', neden: 'tarih değil' });
    const sembol = String(al(s, 'sembol') ?? '').trim();
    if (!sembol) sh.push({ alan: 'symbol', neden: 'boş' });
    const yon = yonCozGenis(al(s, 'yon'));
    if (!yon) sh.push({ alan: 'side', neden: dolu(al(s, 'yon')) ? 'buy/sell/long/short değil' : 'boş' });
    const lot = sayiAl(s, 'lot', 'volume', true, sh);
    if (lot !== null && !(Math.abs(lot) > 0)) sh.push({ alan: 'volume', neden: 'sıfır' });
    const acilisFiyati = sayiAl(s, 'acilisFiyati', 'open_price', false, sh);
    const kapanisFiyati = sayiAl(s, 'kapanisFiyati', 'close_price', false, sh);
    const sl = sayiAl(s, 'sl', 'stop_loss', false, sh);
    const tp = sayiAl(s, 'tp', 'take_profit', false, sh);
    const komisyon = sayiAl(s, 'komisyon', 'commission', false, sh);
    const swap = sayiAl(s, 'swap', 'swap', false, sh);
    const netVar = e.net >= 0 && dolu(al(s, 'net'));
    const brut = netVar ? null : sayiAl(s, 'kar', 'profit', true, sh);
    const net = netVar ? sayiAl(s, 'net', 'net_profit', true, sh) : null;
    const oA = az.ofset ?? ofset, oK = kz.ofset ?? ofset;
    const acilis = az.sn === null ? null : az.sn - (oA ?? 0);
    const kapanis = kz.sn === null ? null : kz.sn - (oK ?? 0);
    if (acilis !== null && kapanis !== null && kapanis < acilis) sh.push({ alan: 'close_time', neden: 'açılıştan önce' });
    if (sh.length) { hatalar.push({ satir: no, ...sh[0] }); return; }
    if (oA !== null) ofsetler.add(oA);
    if (oK !== null) ofsetler.add(oK);
    const bilet = String(al(s, 'bilet') ?? '').trim();
    const yorum = [al(s, 'strateji'), al(s, 'etiket'), al(s, 'not')].map(v => String(v ?? '').trim()).filter(Boolean).join(' · ');
    islemler.push({
      id: bilet || k + 1, sembol, yon, lot: Math.abs(lot),
      acilisZamani: acilis, kapanisZamani: kapanis,
      acilisFiyati, kapanisFiyati, sl, tp,
      komisyon: komisyon ?? 0, swap: swap ?? 0, brut, net, yorum,
      _oA: oA, _oK: oK,
    });
  });
  // Ofsetli satırlar önce UTC'ye çevrildi. Tek bir ofset kullanıldıysa saatleri o yerel saatte
  // göstermek için ofset geri eklenir ve sayfaya o UTC farkı önerilir; karışık ofsetlerde UTC
  // kalır ve UTC+0 önerilir. Ofsetsiz satırlar olduğu gibi (sunucu saati) kalır.
  let onerilenUtcFarki = null;
  const tek = ofsetler.size === 1 ? [...ofsetler][0] : 0;
  const geri = o => (o === null ? 0 : tek);
  for (const i of islemler) { i.acilisZamani += geri(i._oA); i.kapanisZamani += geri(i._oK); delete i._oA; delete i._oK; }
  for (const h of hareketler) { h.zaman += geri(h._o); delete h._o; }
  if (ofsetler.size) onerilenUtcFarki = tek / 3600;
  const hesap = hesapOlustur({ kaynak, para, islemler, bakiyeHareketleri: hareketler, atlanan: hatalar.length });
  return {
    hesap, eksik: [], basliklar, eslesme: e, hatalar,
    okunan: hesap.islemler.length + hesap.bakiyeHareketleri.length, atlanan: hesap.atlanan,
    sablon, sentetik, onerilenUtcFarki,
  };
}

export function csvdenHesap(metin, eslesme = null) {
  return tablodanHesap(csvSatirlari(metin), eslesme, { kaynak: 'csv' });
}
