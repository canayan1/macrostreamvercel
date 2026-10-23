// OHLCV CSV ayrıştırıcı. Biçimi kendisi tanır:
//   MT5 dışa aktarımı : <DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>
//                       (tarih 2026.10.20, saat 14:00:00; D1'de TIME sütunu olmayabilir)
//   Borsa kline CSV   : open_time,open,high,low,close,volume,... (open_time unix ms) ya da başlıksız
//   Genel             : time|date|timestamp, open, high, low, close[, volume] (ISO, unix sn ya da ms)
// Ayırıcı: sekme, virgül ya da noktalı virgül. Ondalık ayırıcı nokta.

import { t as ceviri } from '../dil.js';

const BASLIK = {
  zaman: ['time', 'date', 'datetime', 'timestamp', 'open_time', 'opentime', '<date>', 'tarih'],
  saat: ['<time>', 'saat'],
  a: ['open', '<open>', 'o', 'acilis'],
  y: ['high', '<high>', 'h', 'yuksek'],
  d: ['low', '<low>', 'l', 'dusuk'],
  k: ['close', '<close>', 'c', 'kapanis'],
  h: ['volume', '<vol>', '<tickvol>', 'vol', 'v', 'hacim'],
};

function ayiriciBul(satir) {
  const say = ch => satir.split(ch).length - 1;
  return ['\t', ';', ','].sort((a, b) => say(b) - say(a))[0];
}

function zamanCoz(deger, saat) {
  const v = String(deger).trim();
  if (/^\d{10}$/.test(v)) return Number(v);
  if (/^\d{13}$/.test(v)) return Math.floor(Number(v) / 1000);
  const mt5 = v.match(/^(\d{4})[.\-/](\d{2})[.\-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (mt5) {
    const [, Y, M, D, h = '0', m = '0', s = '0'] = mt5;
    let t = Date.UTC(+Y, +M - 1, +D, +h, +m, +s) / 1000;
    if (saat) { const [sh, sm, ss = 0] = saat.split(':').map(Number); t += sh * 3600 + sm * 60 + ss; }
    return t;
  }
  const t = Date.parse(v);
  return Number.isNaN(t) ? NaN : Math.floor(t / 1000);
}

export function csvCoz(metin) {
  const satirlar = metin.replace(/^﻿/, '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (satirlar.length < 2) throw new Error(ceviri('CSV boş ya da tek satır'));
  const ayr = ayiriciBul(satirlar[0]);
  const ilk = satirlar[0].split(ayr).map(s => s.trim().toLowerCase().replace(/^"|"$/g, ''));
  const baslikVar = ilk.some(h => Number.isNaN(Number(h)));
  let sutun;
  if (baslikVar) {
    sutun = {};
    for (const [alan, adlar] of Object.entries(BASLIK)) {
      const i = ilk.findIndex(h => adlar.includes(h));
      if (i >= 0) sutun[alan] = i;
    }
    for (const g of ['zaman', 'a', 'y', 'd', 'k']) if (sutun[g] === undefined) throw new Error(ceviri("CSV'de '{g}' sütunu bulunamadı", { g }));
  } else sutun = { zaman: 0, a: 1, y: 2, d: 3, k: 4, h: 5 }; // borsa kline biçimi

  const mumlar = [];
  let atlanan = 0;
  for (const s of satirlar.slice(baslikVar ? 1 : 0)) {
    const p = s.split(ayr).map(x => x.trim().replace(/^"|"$/g, ''));
    const m = {
      t: zamanCoz(p[sutun.zaman], sutun.saat !== undefined ? p[sutun.saat] : null),
      a: Number(p[sutun.a]), y: Number(p[sutun.y]), d: Number(p[sutun.d]), k: Number(p[sutun.k]),
    };
    if (sutun.h !== undefined) m.h = Number(p[sutun.h]);
    if (![m.t, m.a, m.y, m.d, m.k].every(Number.isFinite) || m.y < m.d || m.d <= 0) { atlanan++; continue; }
    mumlar.push(m);
  }
  mumlar.sort((x, y) => x.t - y.t);
  const tekil = mumlar.filter((m, i) => i === 0 || m.t !== mumlar[i - 1].t);
  if (tekil.length < 2) throw new Error(ceviri('geçerli mum bulunamadı'));
  return { mumlar: tekil, atlanan: atlanan + (mumlar.length - tekil.length) };
}
