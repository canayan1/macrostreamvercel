// Nelder-Mead simpleks eniyileyici. Türevsiz; kısıtlar amaç fonksiyonunda
// Infinity döndürülerek uygulanır. Model kestirimleri (GARCH, SARIMA) bunu kullanır.

export function neldermead(f, x0, { adim = 0.1, tolerans = 1e-10, maxIter = 4000, yeniden = 2 } = {}) {
  let x = x0.slice(), fx = f(x), iter = 0;
  for (let tur = 0; tur <= yeniden; tur++) {
    const r = tek(f, x, adim, tolerans, maxIter);
    iter += r.iter;
    if (r.fx >= fx - 1e-12 && tur > 0) { if (r.fx < fx) { x = r.x; fx = r.fx; } break; }
    x = r.x; fx = r.fx;
  }
  return { x, fx, iter };
}

function tek(f, x0, adim, tolerans, maxIter) {
  const n = x0.length;
  let s = [x0.slice()];
  for (let i = 0; i < n; i++) {
    const v = x0.slice();
    v[i] = v[i] !== 0 ? v[i] * (1 + adim) : adim / 4;
    s.push(v);
  }
  let d = s.map(f);
  let iter = 0;
  for (; iter < maxIter; iter++) {
    const sira = d.map((_, i) => i).sort((a, b) => d[a] - d[b]);
    s = sira.map(i => s[i]); d = sira.map(i => d[i]);
    if (Math.abs(d[n] - d[0]) <= tolerans * (Math.abs(d[0]) + 1e-12) && iter > 20) break;
    const m = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) m[j] += s[i][j] / n;
    const nokta = k => m.map((v, j) => v + k * (s[n][j] - v));
    const xr = nokta(-1), fr = f(xr);
    if (fr < d[0]) {
      const xe = nokta(-2), fe = f(xe);
      if (fe < fr) { s[n] = xe; d[n] = fe; } else { s[n] = xr; d[n] = fr; }
    } else if (fr < d[n - 1]) { s[n] = xr; d[n] = fr; }
    else {
      const xc = fr < d[n] ? nokta(-0.5) : nokta(0.5), fc = f(xc);
      if (fc < Math.min(fr, d[n])) { s[n] = xc; d[n] = fc; }
      else for (let i = 1; i <= n; i++) { s[i] = s[i].map((v, j) => s[0][j] + 0.5 * (v - s[0][j])); d[i] = f(s[i]); }
    }
  }
  const en = d.indexOf(Math.min(...d));
  return { x: s[en], fx: d[en], iter };
}
