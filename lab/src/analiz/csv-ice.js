// Genel CSV işlem listesi: her satır bir kapanmış işlem. Sütunlar başlıktan tahmin edilir,
// kullanıcı eşleşmeyi değiştirebilir. Saf modül.

import { hesapOlustur } from './model.js';
import { sayiCoz, zamanCoz, yonCoz } from './mt5-rapor.js';

export const CSV_ALANLARI = ['acilisZamani', 'kapanisZamani', 'sembol', 'yon', 'lot', 'acilisFiyati', 'kapanisFiyati', 'sl', 'tp', 'komisyon', 'swap', 'kar', 'net'];
export const ZORUNLU = ['kapanisZamani', 'sembol', 'yon', 'lot'];

const norm = s => String(s ?? '').toLowerCase().replace(/̇/g, '').replace(/[\s_\-./()]+/g, '').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a');
const ESANLAM = {
  acilisZamani: ['opentime', 'opendate', 'entrytime', 'opened', 'acilis', 'acilistarihi', 'acilisZamani', 'time'],
  kapanisZamani: ['closetime', 'closedate', 'exittime', 'closed', 'kapanis', 'kapanistarihi', 'kapanisZamani'],
  sembol: ['symbol', 'sembol', 'instrument', 'pair', 'market', 'ticker'],
  yon: ['type', 'side', 'direction', 'yon', 'tip', 'action'],
  lot: ['volume', 'lots', 'lot', 'size', 'quantity', 'qty', 'hacim'],
  acilisFiyati: ['openprice', 'entryprice', 'acilisfiyati', 'entry'],
  kapanisFiyati: ['closeprice', 'exitprice', 'kapanisfiyati', 'exit'],
  sl: ['sl', 'stoploss', 'stop'],
  tp: ['tp', 'takeprofit', 'target'],
  komisyon: ['commission', 'commissions', 'komisyon', 'fees', 'fee'],
  swap: ['swap', 'swaps', 'rollover'],
  kar: ['profit', 'grossprofit', 'pnl', 'kar', 'kâr'],
  net: ['netprofit', 'netpnl', 'net', 'netkar'],
};

export function ayiriciBul(ilkSatir) {
  const say = c => ilkSatir.split(c).length - 1;
  return ['\t', ';', ','].reduce((e, c) => (say(c) > say(e) ? c : e), ',');
}

export function csvSatirlari(metin, ayirici = ayiriciBul(String(metin).split(/\r?\n/)[0] ?? '')) {
  const satirlar = [];
  let satir = [], alan = '', tirnak = false;
  const s = String(metin).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) {
      if (c === '"' && s[i + 1] === '"') { alan += '"'; i++; }
      else if (c === '"') tirnak = false;
      else alan += c;
    } else if (c === '"') tirnak = true;
    else if (c === ayirici) { satir.push(alan.trim()); alan = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      satir.push(alan.trim()); alan = '';
      if (satir.some(Boolean)) satirlar.push(satir);
      satir = [];
    } else alan += c;
  }
  satir.push(alan.trim());
  if (satir.some(Boolean)) satirlar.push(satir);
  return satirlar;
}

// Başlıklardan alan → sütun dizini tahmini. İlk "time" açılış sayılır.
export function sutunTahmin(basliklar) {
  const e = {};
  const n = basliklar.map(norm);
  for (const alan of CSV_ALANLARI) {
    const liste = ESANLAM[alan].map(norm);
    const i = n.findIndex((h, k) => liste.includes(h) && !Object.values(e).includes(k));
    e[alan] = i;
  }
  return e;
}

export function csvdenHesap(metin, eslesme = null) {
  const satirlar = csvSatirlari(metin);
  if (satirlar.length < 2) return { hesap: null, eksik: ZORUNLU, basliklar: satirlar[0] ?? [], eslesme: {} };
  const basliklar = satirlar[0];
  const e = eslesme ?? sutunTahmin(basliklar);
  const eksik = ZORUNLU.filter(k => !(e[k] >= 0));
  if (!(e.kar >= 0) && !(e.net >= 0)) eksik.push('kar');
  if (eksik.length) return { hesap: null, eksik, basliklar, eslesme: e };
  const al = (s, k) => (e[k] >= 0 ? s[e[k]] : undefined);
  const islemler = satirlar.slice(1).map((s, k) => {
    const kapanis = zamanCoz(al(s, 'kapanisZamani'));
    const acilis = zamanCoz(al(s, 'acilisZamani')) ?? kapanis;
    return {
      id: k + 1, sembol: al(s, 'sembol') ?? '', yon: yonCoz(al(s, 'yon')),
      lot: Math.abs(sayiCoz(al(s, 'lot')) ?? NaN),
      acilisZamani: acilis, kapanisZamani: kapanis,
      acilisFiyati: sayiCoz(al(s, 'acilisFiyati')), kapanisFiyati: sayiCoz(al(s, 'kapanisFiyati')),
      sl: sayiCoz(al(s, 'sl')), tp: sayiCoz(al(s, 'tp')),
      komisyon: sayiCoz(al(s, 'komisyon')) ?? 0, swap: sayiCoz(al(s, 'swap')) ?? 0,
      brut: e.net >= 0 ? null : sayiCoz(al(s, 'kar')),
      net: e.net >= 0 ? sayiCoz(al(s, 'net')) : null,
    };
  });
  return { hesap: hesapOlustur({ kaynak: 'csv', islemler }), eksik: [], basliklar, eslesme: e };
}
