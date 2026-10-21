// ARCH / GARCH / GJR-GARCH / EGARCH, sıfır ortalamalı, normal ya da Student-t dağılımlı,
// en çok olabilirlik. Python `arch` paketiyle aynı geri-tahmin (backcast) ve özyineleme
// kurallarını kullanır; testler sonuçları bu paketle karşılaştırır (lab/test/modeller.test.mjs).
//
// tip 'arch'  : σ²_t = ω + α r²_{t-1}
// tip 'garch' : σ²_t = ω + α r²_{t-1} + β σ²_{t-1}
// tip 'gjr'   : σ²_t = ω + α r²_{t-1} + γ r²_{t-1}·1[r_{t-1}<0] + β σ²_{t-1}
// tip 'egarch': ln σ²_t = ω + α(|e_{t-1}| − √(2/π)) + γ e_{t-1} + β ln σ²_{t-1},  e = r/σ
// dagilim 'normal' | 't' (serbestlik derecesi ν kestirilir; kalın kuyruk için)
//
// Getirileri yüzde olarak verin (ölçek eniyilemeyi kararlı tutar).

import { neldermead } from './eniyile.js';
import { rastgele } from '../sentetik.js';

const LOG2PI = Math.log(2 * Math.PI);
const KOK2PI = Math.sqrt(2 / Math.PI);
const LNSIGMA_MAX = Math.log(Number.MAX_VALUE) / 2; // arch ile aynı üst sınır mantığı

// Lanczos yaklaşımıyla ln Γ(x), x > 0
const LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LANCZOS[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// arch paketinin varsayılan geri-tahmini: ilk 75 gözlemin 0.94 ağırlıklı karesel ortalaması
export function geriTahmin(r) {
  const tau = Math.min(75, r.length);
  let top = 0, w = 0;
  for (let i = 0; i < tau; i++) { const a = 0.94 ** i; top += a * r[i] * r[i]; w += a; }
  return top / w;
}

// Model tanımları: parametre adları, başlangıç, kısıt, varyans özyinelemesi
const MODELLER = {
  arch: {
    adlar: ['omega', 'alpha'],
    baslangic: v => [v * 0.5, 0.5],
    gecerli: ([w, a]) => w > 0 && a >= 0 && a < 1,
    kalicilik: ([, a]) => a,
    varyans(r, [w, a], bc) {
      return r.map((_, t) => w + a * (t ? r[t - 1] ** 2 : bc));
    },
  },
  garch: {
    adlar: ['omega', 'alpha', 'beta'],
    baslangic: v => [v * 0.05, 0.05, 0.9],
    gecerli: ([w, a, b]) => w > 0 && a >= 0 && b >= 0 && a + b < 1,
    kalicilik: ([, a, b]) => a + b,
    varyans(r, [w, a, b], bc) {
      const s2 = new Array(r.length);
      for (let t = 0; t < r.length; t++) s2[t] = w + a * (t ? r[t - 1] ** 2 : bc) + b * (t ? s2[t - 1] : bc);
      return s2;
    },
  },
  gjr: {
    adlar: ['omega', 'alpha', 'gamma', 'beta'],
    baslangic: v => [v * 0.05, 0.03, 0.04, 0.9],
    gecerli: ([w, a, g, b]) => w > 0 && a >= 0 && a + g >= 0 && b >= 0 && a + g / 2 + b < 1,
    kalicilik: ([, a, g, b]) => a + g / 2 + b,
    varyans(r, [w, a, g, b], bc) {
      const s2 = new Array(r.length);
      for (let t = 0; t < r.length; t++) {
        const o = t ? r[t - 1] : 0;
        s2[t] = w + a * (t ? o * o : bc) + g * (t ? (o < 0 ? o * o : 0) : bc / 2) + b * (t ? s2[t - 1] : bc);
      }
      return s2;
    },
  },
  egarch: {
    adlar: ['omega', 'alpha', 'gamma', 'beta'],
    baslangic: v => { const h = Math.log(v); return [0.1 * h, 0.1, 0, 0.9]; },
    gecerli: ([, , , b]) => b >= 0 && b < 1,
    kalicilik: ([, , , b]) => b,
    // bc burada ln(geri-tahmin)
    varyans(r, [w, a, g, b], bc) {
      const s2 = new Array(r.length);
      let lnOnceki = bc, eOnceki = 0;
      for (let t = 0; t < r.length; t++) {
        let ln = w + b * lnOnceki;
        if (t) ln += a * (Math.abs(eOnceki) - KOK2PI) + g * eOnceki;
        ln = Math.min(ln, LNSIGMA_MAX);
        s2[t] = Math.exp(ln);
        lnOnceki = ln;
        eOnceki = r[t] / Math.sqrt(s2[t]);
      }
      return s2;
    },
  },
};

function logOlabilirlik(r, s2, nu) {
  let ll = 0;
  if (nu === undefined) {
    for (let t = 0; t < r.length; t++) ll -= 0.5 * (LOG2PI + Math.log(s2[t]) + r[t] * r[t] / s2[t]);
    return ll;
  }
  const sabit = lgamma((nu + 1) / 2) - lgamma(nu / 2) - 0.5 * Math.log(Math.PI * (nu - 2));
  for (let t = 0; t < r.length; t++)
    ll += sabit - 0.5 * Math.log(s2[t]) - (nu + 1) / 2 * Math.log(1 + r[t] * r[t] / (s2[t] * (nu - 2)));
  return ll;
}

// Marsaglia-Tsang gama örnekleyicisi (EGARCH t simülasyonu için)
function gama(k, r, normal) {
  if (k < 1) return gama(k + 1, r, normal) * Math.pow(r(), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { x = normal(); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = r();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

// baslangic: önceki kestirimin parametre dizisi (ham x). Verilirse tek, kısa bir
// Nelder-Mead turu oradan başlar; kayan pencerede yeniden kestirim (GARCH_VOL) için.
// Aynı algoritma MQL5'te (Kalibre/Garch.mqh) birebir uygulanır.
export function garchKestir(r, { tip = 'garch', dagilim = 'normal', baslangic = null } = {}) {
  if (r.length < 50) throw new Error('GARCH için en az 50 gözlem gerekir');
  const m = MODELLER[tip];
  if (!m) throw new Error(`bilinmeyen tip: ${tip}`);
  if (dagilim !== 'normal' && dagilim !== 't') throw new Error(`bilinmeyen dağılım: ${dagilim}`);
  const t = dagilim === 't';
  const bcVar = geriTahmin(r);
  const bc = tip === 'egarch' ? Math.log(bcVar) : bcVar;
  const v = r.reduce((a, b) => a + b * b, 0) / r.length;
  const k = m.adlar.length;
  // p: varyans parametreleri (+ t ise ν). tDagilim=false iken normal olabilirlik.
  const amac = (p, tDagilim) => {
    const vp = p.slice(0, k), nu = tDagilim ? p[k] : undefined;
    if (!m.gecerli(vp) || (tDagilim && !(nu > 2.05 && nu < 500))) return Infinity;
    const ll = logOlabilirlik(r, m.varyans(r, vp, bc), nu);
    return Number.isFinite(ll) ? -ll : Infinity;
  };
  let x;
  if (baslangic && baslangic.length === k + (t ? 1 : 0) && Number.isFinite(amac(baslangic, t))) {
    x = neldermead(p => amac(p, t), baslangic, { adim: 0.05, tolerans: 1e-10, maxIter: 1500, yeniden: 1 }).x;
  } else {
    // Önce normal dağılımla, sonra (t ise) ν eklenerek; iki aşama yakınsamayı kolaylaştırır.
    x = neldermead(p => amac(p, false), m.baslangic(v), { adim: 0.2, tolerans: 1e-12, maxIter: 6000, yeniden: 3 }).x;
    if (t) {
      const adaylar = [6, 10, 20].map(nu => neldermead(p => amac(p, true), [...x, nu],{ adim: 0.2, tolerans: 1e-12, maxIter: 8000, yeniden: 3 }));
      x = adaylar.reduce((a, b) => (b.fx < a.fx ? b : a)).x;
    }
  }
  const vp = x.slice(0, k), nu = t ? x[k] : undefined;
  const s2 = m.varyans(r, vp, bc);
  const p = Object.fromEntries(m.adlar.map((ad, i) => [ad, vp[i]]));
  if (t) p.nu = nu;
  const kalicilik = m.kalicilik(vp);
  const ll = logOlabilirlik(r, s2, nu);
  const parametreSayisi = x.length;
  // Uzun dönem varyans: EGARCH için ln σ² ortalaması ω/(1−β) (normal yaklaşım)
  const uzunDonemVaryans = tip === 'egarch' ? Math.exp(p.omega / (1 - p.beta)) : p.omega / (1 - kalicilik);
  const son = r.length - 1;

  function ongoru(h = 10, { simulasyon = 2000, tohum = 1 } = {}) {
    if (tip !== 'egarch') {
      const { omega, alpha, beta = 0, gamma = 0 } = p;
      const o = r[son];
      let s = omega + alpha * o * o + (tip === 'gjr' && o < 0 ? gamma * o * o : 0) + beta * s2[son];
      const cikti = [s];
      for (let i = 1; i < h; i++) { s = omega + kalicilik * s; cikti.push(s); }
      return cikti.map(Math.sqrt);
    }
    // EGARCH: 1 adım kesin; sonrası simülasyonla (arch paketi de böyle yapar)
    const { omega, alpha, gamma, beta } = p;
    const e = r[son] / Math.sqrt(s2[son]);
    const ln1 = omega + alpha * (Math.abs(e) - KOK2PI) + gamma * e + beta * Math.log(s2[son]);
    const cikti = [Math.exp(ln1)];
    if (h > 1) {
      const rnd = rastgele(tohum);
      const normal = () => { let u = 0, w = 0; while (!u) u = rnd(); while (!w) w = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
      const ciz = t ? () => normal() / Math.sqrt(2 * gama(nu / 2, rnd, normal) / nu) * Math.sqrt((nu - 2) / nu) : normal;
      const toplam = new Array(h).fill(0);
      for (let s = 0; s < simulasyon; s++) {
        let ln = ln1;
        toplam[0] += Math.exp(ln);
        for (let i = 1; i < h; i++) {
          const z = ciz();
          ln = Math.min(omega + alpha * (Math.abs(z) - KOK2PI) + gamma * z + beta * ln, LNSIGMA_MAX);
          toplam[i] += Math.exp(ln);
        }
      }
      for (let i = 1; i < h; i++) cikti.push(toplam[i] / simulasyon);
    }
    return cikti.map(Math.sqrt);
  }

  return {
    tip,
    dagilim,
    ham: x,
    parametreler: p,
    logOlabilirlik: ll,
    aic: -2 * ll + 2 * parametreSayisi,
    bic: -2 * ll + parametreSayisi * Math.log(r.length),
    kalicilik,
    uzunDonemOynaklik: Math.sqrt(uzunDonemVaryans),
    yariOmur: kalicilik > 0 && kalicilik < 1 ? Math.log(0.5) / Math.log(kalicilik) : Infinity,
    kosulluOynaklik: s2.map(Math.sqrt),
    standartArtiklar: r.map((v2, i) => v2 / Math.sqrt(s2[i])),
    ongoru,
  };
}

// Sabit parametrelerle (garchKestir().ham) bir pencere üzerinde özyineleme: koşullu varyanslar,
// bir adım ileri varyans ve uzun dönem varyans. GARCH_VOL göstergesi yeniden kestirimler
// arasında bunu kullanır.
export function garchDegerlendir(r, { tip = 'garch', dagilim = 'normal', ham }) {
  const m = MODELLER[tip];
  const k = m.adlar.length;
  const vp = ham.slice(0, k);
  const bcVar = geriTahmin(r);
  const s2 = m.varyans(r, vp, tip === 'egarch' ? Math.log(bcVar) : bcVar);
  const son = r.length - 1;
  let bir;
  if (tip === 'egarch') {
    const [w, a, g, b] = vp, e = r[son] / Math.sqrt(s2[son]);
    bir = Math.exp(Math.min(w + a * (Math.abs(e) - KOK2PI) + g * e + b * Math.log(s2[son]), LNSIGMA_MAX));
  } else {
    const [w, a] = vp, o = r[son];
    const b = tip === 'arch' ? 0 : vp[tip === 'gjr' ? 3 : 2], g = tip === 'gjr' ? vp[2] : 0;
    bir = w + a * o * o + (o < 0 ? g * o * o : 0) + b * s2[son];
  }
  const kal = m.kalicilik(vp);
  // Kalıcılık 1'e çok yakınsa (IGARCH benzeri) uzun dönem düzeyi tanımsız sayılır
  const uzun = kal >= 0.999 ? NaN : tip === 'egarch' ? Math.exp(vp[0] / (1 - vp[3])) : vp[0] / (1 - kal);
  return { s2, birAdim: bir, uzunVaryans: uzun, dagilim };
}
