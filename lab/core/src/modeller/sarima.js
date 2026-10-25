// SARIMA(p,d,q)(P,D,Q)s, koşullu kareler toplamı (CSS) ile kestirim.
// statsmodels SARIMAX tam olabilirlik (Kalman) kullanır; uzun serilerde iki kestirim
// birbirine yakınsar. Testler bunu toleransla karşılaştırır.
//
// (1 - φ(B))(1 - Φ(B^s)) ∇^d ∇_s^D y_t = (1 + θ(B))(1 + Θ(B^s)) e_t
//
// Not: Fiyat getirilerinin ortalamasını öngörmek zayıftır. SARIMA'nın Lab'daki asıl
// kullanımı oynaklık, hacim, spread ve funding gibi mevsimsel yapı taşıyan serilerdir.

import { neldermead } from './eniyile.js';

export function fark(y, d = 0, D = 0, s = 0) {
  let w = y.slice();
  for (let i = 0; i < D; i++) w = w.slice(s).map((v, t) => v - w[t]);
  for (let i = 0; i < d; i++) w = w.slice(1).map((v, t) => v - w[t]);
  return w;
}

// (1 - a1 B - ...)(1 - A1 B^s - ...) → tek polinomun B^k katsayıları (k ≥ 1, işaret: w_t'yi açıklayan)
function carp(kisa, mevsimsel, s, isaret) {
  const n = kisa.length + mevsimsel.length * s;
  const c = new Array(n + 1).fill(0);
  const a = [1, ...kisa.map(v => isaret * v)];
  const A = new Array(mevsimsel.length * s + 1).fill(0);
  A[0] = 1;
  mevsimsel.forEach((v, i) => { A[(i + 1) * s] = isaret * v; });
  for (let i = 0; i < a.length; i++) for (let j = 0; j < A.length; j++) c[i + j] += a[i] * A[j];
  return c;
}

function artiklar(w, ar, ma) {
  const p = ar.length - 1, q = ma.length - 1, bas = Math.max(p, q);
  const e = new Array(w.length).fill(0);
  let css = 0;
  for (let t = bas; t < w.length; t++) {
    let v = w[t];
    for (let i = 1; i <= p; i++) v += ar[i] * w[t - i];       // ar = 1 - φ... (işaretler içeride)
    for (let j = 1; j <= q; j++) v -= ma[j] * e[t - j];
    e[t] = v;
    css += v * v;
  }
  return { e, css, n: w.length - bas };
}

export function sarimaKestir(y, { p = 0, d = 0, q = 0, P = 0, D = 0, Q = 0, s = 0, sabit = false } = {}) {
  if ((P || D || Q) && s < 2) throw new Error('mevsimsel bileşen için s ≥ 2 olmalı');
  let w = fark(y, d, D, s);
  const k = p + q + P + Q;
  const ayir = x => ({
    phi: x.slice(0, p), theta: x.slice(p, p + q), Phi: x.slice(p + q, p + q + P), Theta: x.slice(p + q + P, k),
    mu: sabit ? x[k] : 0,
  });
  const amac = x => {
    const m = ayir(x);
    if ([...m.phi, ...m.theta, ...m.Phi, ...m.Theta].some(v => Math.abs(v) >= 0.999)) return Infinity;
    const ar = carp(m.phi, m.Phi, s, -1), ma = carp(m.theta, m.Theta, s, 1);
    return artiklar(w.map(v => v - m.mu), ar, ma).css;
  };
  const x0 = new Array(k + (sabit ? 1 : 0)).fill(0).map((_, i) => (i < k ? 0.1 : w.reduce((a, b) => a + b, 0) / w.length));
  const { x } = k + (sabit ? 1 : 0) ? neldermead(amac, x0, { adim: 0.5, tolerans: 1e-13, maxIter: 8000, yeniden: 3 }) : { x: [] };
  const m = ayir(x);
  const ar = carp(m.phi, m.Phi, s, -1), ma = carp(m.theta, m.Theta, s, 1);
  const r = artiklar(w.map(v => v - m.mu), ar, ma);
  const sigma2 = r.css / r.n;
  const parametre = k + (sabit ? 1 : 0) + 1;
  const ll = -0.5 * r.n * (Math.log(2 * Math.PI * sigma2) + 1);
  return {
    sira: { p, d, q, P, D, Q, s },
    parametreler: { phi: m.phi, theta: m.theta, Phi: m.Phi, Theta: m.Theta, ...(sabit && { sabit: m.mu }) },
    sigma2,
    logOlabilirlik: ll,
    aic: -2 * ll + 2 * parametre,
    artiklar: r.e,
    // h adım ileri nokta öngörüsü, orijinal ölçekte
    ongoru(h = 10) {
      const ww = w.map(v => v - m.mu), ee = r.e.slice();
      for (let i = 0; i < h; i++) {
        const t = ww.length;
        let v = 0;
        for (let j = 1; j < ar.length; j++) v -= ar[j] * (ww[t - j] ?? 0);
        for (let j = 1; j < ma.length; j++) v += ma[j] * (ee[t - j] ?? 0);
        ww.push(v); ee.push(0);
      }
      let tahmin = ww.slice(w.length).map(v => v + m.mu);
      // farkları geri al: önce düz, sonra mevsimsel (fark() sırasının tersi)
      const katmanlar = [];
      let z = y.slice();
      for (let i = 0; i < D; i++) { katmanlar.push({ tur: 's', seri: z }); z = z.slice(s).map((v, t) => v - z[t]); }
      for (let i = 0; i < d; i++) { katmanlar.push({ tur: 'd', seri: z }); z = z.slice(1).map((v, t) => v - z[t]); }
      for (const kat of katmanlar.reverse()) {
        const tam = kat.seri.slice();
        for (const v of tahmin) tam.push(v + tam[tam.length - (kat.tur === 's' ? s : 1)]);
        tahmin = tam.slice(kat.seri.length);
      }
      return tahmin;
    },
  };
}
