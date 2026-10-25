// Gösterge hesapları. MT5'in yerleşik göstergeleriyle aynı formüller:
//   EMA ilk fiyatla tohumlanır; RSI Wilder yumuşatması; ATR = TR'nin SMA'sı;
//   ADX, +DI/-DI ve DX için üstel ortalama (MT5 gibi sıfırdan tohumlanır); BB nüfus standart
//   sapması; MACD sinyal hattı ana hattın SMA'sı.
// Doğrulama: lab/test/motor-dogrulama.test.mjs, MT5'in kendi çıktısıyla (EURUSD H1, geçmişin en
// eski 600 mumu, ısınma dahil) karşılaştırır; fark 1e-9 göreli düzeyinin altında.
// Dizi uzunluğu mum sayısına eşittir; ısınma dönemindeki değerler NaN.
//
// Oynaklık göstergeleri (şema v2): EWMA_VOL, YZ_VOL, GARCH_VOL. Değerler dönemlik oynaklık
// (kesir, ör. 0,012 = %1,2). 'oran' hattı = değer / son 250 değerin ortalaması; ölçekten
// bağımsız rejim ölçüsü (1'in üstü = olağandan oynak). MQL5 karşılığı: Kalibre/Oynaklik.mqh.

import { yangZhang } from './modeller/oynaklik.js';
import { garchKestir, garchDegerlendir } from './modeller/garch.js';

export const ORAN_PENCERE = 250;

export function sma(x, p) {
  const y = new Array(x.length).fill(NaN);
  let top = 0, n = 0;
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i])) { top = 0; n = 0; continue; }
    top += x[i]; n++;
    if (n > p) { top -= x[i - p]; n = p; }
    if (n === p) y[i] = top / p;
  }
  return y;
}

export function ema(x, p) {
  const y = new Array(x.length).fill(NaN);
  const k = 2 / (p + 1);
  let onceki = NaN, say = 0;
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i])) continue;
    onceki = Number.isNaN(onceki) ? x[i] : x[i] * k + onceki * (1 - k);
    if (++say >= p) y[i] = onceki;
  }
  return y;
}

export function rsi(kapanis, p) {
  const n = kapanis.length, y = new Array(n).fill(NaN);
  if (n <= p) return y;
  let kaz = 0, kay = 0;
  for (let i = 1; i <= p; i++) {
    const d = kapanis[i] - kapanis[i - 1];
    if (d > 0) kaz += d; else kay -= d;
  }
  kaz /= p; kay /= p;
  y[p] = kay === 0 ? 100 : 100 - 100 / (1 + kaz / kay);
  for (let i = p + 1; i < n; i++) {
    const d = kapanis[i] - kapanis[i - 1];
    kaz = (kaz * (p - 1) + Math.max(d, 0)) / p;
    kay = (kay * (p - 1) + Math.max(-d, 0)) / p;
    y[i] = kay === 0 ? 100 : 100 - 100 / (1 + kaz / kay);
  }
  return y;
}

function gercekAralik(m) {
  return m.map((b, i) => i === 0 ? b.y - b.d
    : Math.max(b.y - b.d, Math.abs(b.y - m[i - 1].k), Math.abs(b.d - m[i - 1].k)));
}

export function atr(m, p) {
  return sma(gercekAralik(m), p);
}

export function adx(m, p) {
  const n = m.length;
  const ana = new Array(n).fill(NaN), arti = new Array(n).fill(NaN), eksi = new Array(n).fill(NaN);
  const k = 2 / (p + 1);
  // MT5 ADX.mq5 gibi: +DI, -DI ve ADX üstel ortalamaları sıfırdan başlar (ilk değerle değil).
  // 25.10.2026'ya kadar ilk değerle tohumlanıyordu; ısınma döneminde MT5'ten %44'e varan fark vardı.
  let pd = 0, md = 0, ax = 0;
  for (let i = 1; i < n; i++) {
    let pdm = m[i].y - m[i - 1].y, mdm = m[i - 1].d - m[i].d;
    if (pdm < 0) pdm = 0;
    if (mdm < 0) mdm = 0;
    if (pdm === mdm) { pdm = 0; mdm = 0; } else if (pdm < mdm) pdm = 0; else mdm = 0;
    const tr = Math.max(m[i].y - m[i].d, Math.abs(m[i].y - m[i - 1].k), Math.abs(m[i].d - m[i - 1].k));
    const tp = tr === 0 ? 0 : 100 * pdm / tr, tm = tr === 0 ? 0 : 100 * mdm / tr;
    pd = tp * k + pd * (1 - k);
    md = tm * k + md * (1 - k);
    const dx = pd + md === 0 ? 0 : 100 * Math.abs(pd - md) / (pd + md);
    ax = dx * k + ax * (1 - k);
    if (i >= p) { arti[i] = pd; eksi[i] = md; }
    if (i >= 2 * p) ana[i] = ax;
  }
  return { ana, arti, eksi };
}

export function bb(kapanis, p, sapma) {
  const orta = sma(kapanis, p);
  const ust = new Array(kapanis.length).fill(NaN), alt = new Array(kapanis.length).fill(NaN);
  for (let i = p - 1; i < kapanis.length; i++) {
    let v = 0;
    // x * x (x ** 2 değil): Math.pow uygulamaya bağlı yaklaşık olabilir, çarpma IEEE 754'te tam belirlidir.
    for (let j = i - p + 1; j <= i; j++) { const f = kapanis[j] - orta[i]; v += f * f; }
    const sd = Math.sqrt(v / p);
    ust[i] = orta[i] + sapma * sd;
    alt[i] = orta[i] - sapma * sd;
  }
  return { orta, ust, alt };
}

export function macd(kapanis, hizli, yavas, sinyal) {
  const h = ema(kapanis, hizli), y = ema(kapanis, yavas);
  const ana = h.map((v, i) => v - y[i]);
  return { ana, sinyal: sma(ana, sinyal) };
}

function logGetiri(kapanis, yuzde = false) {
  return kapanis.map((k, i) => (i ? Math.log(k / kapanis[i - 1]) * (yuzde ? 100 : 1) : NaN));
}

export function oran(seri, n = ORAN_PENCERE) {
  const y = new Array(seri.length).fill(NaN);
  let top = 0, say = 0;
  for (let i = 0; i < seri.length; i++) {
    if (Number.isFinite(seri[i])) { top += seri[i]; say++; }
    if (i >= n && Number.isFinite(seri[i - n])) { top -= seri[i - n]; say--; }
    if (say === n && Number.isFinite(seri[i])) y[i] = seri[i] / (top / n);
  }
  return y;
}

// RiskMetrics: σ²_i = λσ²_{i-1} + (1−λ) r_i²; i. mumun kapanışından sonraki dönem için öngörü.
export function ewmaVol(kapanis, lambda = 0.94) {
  const r = logGetiri(kapanis);
  const y = new Array(kapanis.length).fill(NaN);
  const ilk = r.slice(1, 31);
  if (ilk.length < 30) return y;
  let v = ilk.reduce((a, b) => a + b * b, 0) / ilk.length;
  for (let i = 1; i < r.length; i++) {
    v = lambda * v + (1 - lambda) * r[i] * r[i];
    if (i >= 30) y[i] = Math.sqrt(v);
  }
  return y;
}

// Kayan pencerede GARCH ailesi: her `yenile` mumda son `pencere` getiriyle yeniden kestirilir
// (önceki parametrelerden başlayarak); aradaki mumlarda parametreler sabit, özyineleme güncel.
// '' = bir adım ileri σ, uzun = uzun dönem σ, oran = σ / pencerenin son 250 koşullu σ ortalaması.
export function garchVol(kapanis, { model = 'garch', dagilim = 'normal', pencere = 1000, yenile = 24 } = {}) {
  const n = kapanis.length;
  const ana = new Array(n).fill(NaN), uzun = new Array(n).fill(NaN), orn = new Array(n).fill(NaN);
  const r = logGetiri(kapanis, true);
  let ham = null;
  for (let i = pencere; i < n; i++) {
    const w = r.slice(i - pencere + 1, i + 1);
    const ort = w.reduce((a, b) => a + b, 0) / pencere;
    const wd = w.map(v => v - ort);
    if ((i - pencere) % yenile === 0 || !ham) {
      try { ham = garchKestir(wd, { tip: model, dagilim, baslangic: ham }).ham; } catch { ham = null; continue; }
    }
    const d = garchDegerlendir(wd, { tip: model, dagilim, ham });
    const m = Math.min(ORAN_PENCERE, pencere);
    let top = 0;
    for (let j = pencere - m; j < pencere; j++) top += Math.sqrt(d.s2[j]);
    ana[i] = Math.sqrt(d.birAdim) / 100;
    uzun[i] = Math.sqrt(d.uzunVaryans) / 100;
    orn[i] = Math.sqrt(d.birAdim) / (top / m);
  }
  return { ana, uzun, oran: orn };
}

// Strateji gösterge tanımlarını hesaplar: { ad: { '': dizi, ust: dizi, ... } }
export function hesapla(gostergeler, mumlar) {
  const k = mumlar.map(b => b.k);
  const sonuc = {};
  for (const [ad, t] of Object.entries(gostergeler)) {
    switch (t.tip) {
      case 'SMA': sonuc[ad] = { '': sma(k, t.periyot) }; break;
      case 'EMA': sonuc[ad] = { '': ema(k, t.periyot) }; break;
      case 'RSI': sonuc[ad] = { '': rsi(k, t.periyot) }; break;
      case 'ATR': sonuc[ad] = { '': atr(mumlar, t.periyot) }; break;
      case 'ADX': { const a = adx(mumlar, t.periyot); sonuc[ad] = { '': a.ana, ...a }; break; }
      case 'BB': { const b = bb(k, t.periyot, t.sapma); sonuc[ad] = { '': b.orta, ...b }; break; }
      case 'MACD': { const m = macd(k, t.hizli, t.yavas, t.sinyal); sonuc[ad] = { '': m.ana, ...m }; break; }
      case 'EWMA_VOL': { const v = ewmaVol(k, t.lambda ?? 0.94); sonuc[ad] = { '': v, oran: oran(v) }; break; }
      case 'YZ_VOL': { const v = yangZhang(mumlar, t.periyot); sonuc[ad] = { '': v, oran: oran(v) }; break; }
      case 'GARCH_VOL': {
        const g = garchVol(k, { model: t.model ?? 'garch', dagilim: t.dagilim ?? 'normal', pencere: t.pencere ?? 1000, yenile: t.yenile ?? 24 });
        sonuc[ad] = { '': g.ana, uzun: g.uzun, oran: g.oran };
        break;
      }
    }
    sonuc[ad].ana ??= sonuc[ad][''];
  }
  return sonuc;
}
