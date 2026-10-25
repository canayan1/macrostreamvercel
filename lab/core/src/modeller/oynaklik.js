// Gerçekleşen oynaklık tahmincileri. Varlıktan bağımsızdır: yıllıklandırma için
// yılda kaç dönem olduğu veri kaynağının seans bilgisinden gelir (ör. hisse D1 = 252,
// 7/24 kripto D1 = 365, kripto H1 = 8760).
// Mumlar: { a, y, d, k } (açılış, yüksek, düşük, kapanış).

export const getiriler = (kapanis, { yuzde = false } = {}) =>
  kapanis.slice(1).map((k, i) => Math.log(k / kapanis[i]) * (yuzde ? 100 : 1));

// Kayan pencerede tahminci; ilk pencere-1 değer NaN. Sonuç dönemlik standart sapma.
function kayan(m, n, terim) {
  const y = new Array(m.length).fill(NaN);
  for (let i = n - 1; i < m.length; i++) {
    let top = 0;
    for (let j = i - n + 1; j <= i; j++) top += terim(m[j], m[j - 1]);
    y[i] = Math.sqrt(Math.max(top / n, 0));
  }
  return y;
}

export const kapanisKapanis = (m, n) => {
  const r = m.map((b, i) => (i ? Math.log(b.k / m[i - 1].k) : NaN));
  const y = new Array(m.length).fill(NaN);
  for (let i = n; i < m.length; i++) {
    const w = r.slice(i - n + 1, i + 1);
    const ort = w.reduce((a, b) => a + b, 0) / n;
    y[i] = Math.sqrt(w.reduce((a, b) => a + (b - ort) ** 2, 0) / (n - 1));
  }
  return y;
};

// Parkinson (1980): yüksek-düşük aralığı
export const parkinson = (m, n) => kayan(m, n, b => Math.log(b.y / b.d) ** 2 / (4 * Math.LN2));

// Garman-Klass (1980): OHLC
export const garmanKlass = (m, n) => kayan(m, n, b =>
  0.5 * Math.log(b.y / b.d) ** 2 - (2 * Math.LN2 - 1) * Math.log(b.k / b.a) ** 2);

// Rogers-Satchell (1991): sürüklenmeye dayanıklı
export const rogersSatchell = (m, n) => kayan(m, n, b =>
  Math.log(b.y / b.k) * Math.log(b.y / b.a) + Math.log(b.d / b.k) * Math.log(b.d / b.a));

// Yang-Zhang (2000): gece boşluğu + açılış-kapanış + Rogers-Satchell.
// 7/24 piyasada (kripto) gece boşluğu ~0'dır; tahminci yine geçerlidir.
export function yangZhang(m, n) {
  const k = 0.34 / (1.34 + (n + 1) / (n - 1));
  const y = new Array(m.length).fill(NaN);
  for (let i = n; i < m.length; i++) {
    const g = [], ac = [];
    let rs = 0;
    for (let j = i - n + 1; j <= i; j++) {
      g.push(Math.log(m[j].a / m[j - 1].k));
      ac.push(Math.log(m[j].k / m[j].a));
      rs += Math.log(m[j].y / m[j].k) * Math.log(m[j].y / m[j].a) + Math.log(m[j].d / m[j].k) * Math.log(m[j].d / m[j].a);
    }
    const varyans = v => { const o = v.reduce((a, b) => a + b, 0) / n; return v.reduce((a, b) => a + (b - o) ** 2, 0) / (n - 1); };
    y[i] = Math.sqrt(varyans(g) + k * varyans(ac) + (1 - k) * rs / n);
  }
  return y;
}

// RiskMetrics EWMA: σ²_t = λσ²_{t-1} + (1-λ)r²_{t-1}
export function ewma(r, lambda = 0.94) {
  const y = new Array(r.length).fill(NaN);
  let v = r.slice(0, Math.min(30, r.length)).reduce((a, b) => a + b * b, 0) / Math.min(30, r.length);
  for (let i = 0; i < r.length; i++) { y[i] = Math.sqrt(v); v = lambda * v + (1 - lambda) * r[i] * r[i]; }
  return y;
}

export const yillik = (oynaklik, donemSayisi) => oynaklik * Math.sqrt(donemSayisi);
