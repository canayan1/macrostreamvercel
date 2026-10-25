// Aşırı uyum (backtest overfitting) ölçüleri. DOM yoktur; optimizasyon.js ve doğrulama
// betikleri kullanır. Her işlev deterministiktir: aynı girdi aynı çıktıyı verir.
//
//   dsrCekirdek      Deflated Sharpe Ratio, Bailey ve López de Prado (2014), Eş. 1-2.
//                    Makaledeki sayısal örnekle doğrulandı (lab/test/asiri-uyum.test.mjs).
//   pboCscv          Backtest aşırı uyum olasılığı, kombinatoryal simetrik çapraz doğrulama
//                    (Bailey, Borwein, López de Prado, Zhu 2014/2017).
//   sharpeKirpma     Harvey ve Liu (2015) çoklu test kırpması: Šidák (bağımsız denemeler),
//                    Bonferroni, Holm, BHY. Çift taraflı test, makaledeki gibi.
//   denemeSayaci     Bir strateji taslağı için kalıcı deneme sayısı N (localStorage).
//
// Sharpe oranları mum başınadır (yıllıklaştırılmaz); T mum sayısıdır.

import { phi, phiTers } from './normal.js';

const EULER = 0.5772156649015329;

// Beklenen en büyük Sharpe (sıfır hipotezi altında), Eş. 2'nin SR0 terimi.
export function beklenenEnBuyuk(N, varyans) {
  if (!(N >= 2) || !(varyans >= 0)) return 0;
  return Math.sqrt(varyans) * ((1 - EULER) * phiTers(1 - 1 / N) + EULER * phiTers(1 - 1 / (N * Math.E)));
}

// { sr, T, carpiklik, basiklik (normal = 3), N, varyans } -> { sr0, dsr } ya da null.
export function dsrCekirdek({ sr, T, carpiklik = 0, basiklik = 3, N, varyans }) {
  if (!(N >= 2) || !(T > 2) || !(varyans >= 0)) return null;
  const sr0 = beklenenEnBuyuk(N, varyans);
  const payda = 1 - carpiklik * sr + (basiklik - 1) / 4 * sr * sr;
  if (!(payda > 0)) return null;
  return { sr0, dsr: phi((sr - sr0) * Math.sqrt(T - 1) / Math.sqrt(payda)) };
}

// ------------------------------------------------------------------ PBO / CSCV
// matris: N ayar × T getiri (her ayarın mum başı getirileri, aynı uzunlukta).
// S: blok sayısı (çift). olcut: blok birleşiminde performans; varsayılan Sharpe (ort/ss).
// Döner: { pbo, logitler, bozulma: { egim, kesisim, r2 }, zararOlasiligi, kombinasyon, S, N, T }
// ya da { pbo: null, neden }.
export function pboCscv(matris, { S = 16, enCokKombinasyon = 20000 } = {}) {
  const N = matris.length;
  if (N < 2) return { pbo: null, neden: 'az_ayar' };
  const T = Math.min(...matris.map(r => r.length));
  if (S % 2 || S < 2) return { pbo: null, neden: 'blok_tek' };
  if (T < S * 4) return { pbo: null, neden: 'az_gozlem' };
  // Ayarlar arasında hiç fark yoksa sıralama anlamsızdır.
  if (matris.every(r => r.slice(0, T).every((v, i) => v === matris[0][i]))) return { pbo: null, neden: 'ozdes' };

  // Blok toplamları: her ayar ve blok için n, toplam, kareler toplamı.
  const blokBoyu = Math.floor(T / S);
  const top = Array.from({ length: N }, () => new Float64Array(S));
  const kare = Array.from({ length: N }, () => new Float64Array(S));
  for (let n = 0; n < N; n++)
    for (let s = 0; s < S; s++)
      for (let t = s * blokBoyu; t < (s + 1) * blokBoyu; t++) { const v = matris[n][t]; top[n][s] += v; kare[n][s] += v * v; }
  const yarim = S / 2, adet = yarim * blokBoyu;
  const sharpe = (n, bloklar) => {
    let a = 0, b = 0;
    for (const s of bloklar) { a += top[n][s]; b += kare[n][s]; }
    const ort = a / adet, vr = b / adet - ort * ort;
    return vr > 1e-18 ? ort / Math.sqrt(vr) : 0;
  };

  const kombinasyonlar = [];
  const sec = (bas, secilen) => {
    if (kombinasyonlar.length >= enCokKombinasyon) return;
    if (secilen.length === yarim) { kombinasyonlar.push([...secilen]); return; }
    for (let i = bas; i <= S - (yarim - secilen.length); i++) { secilen.push(i); sec(i + 1, secilen); secilen.pop(); }
  };
  sec(0, []);

  const logitler = [], isOos = [];
  let zarar = 0;
  const is = new Float64Array(N), oos = new Float64Array(N);
  for (const J of kombinasyonlar) {
    const uye = new Uint8Array(S); for (const s of J) uye[s] = 1;
    const Jc = []; for (let s = 0; s < S; s++) if (!uye[s]) Jc.push(s);
    let enIyi = 0;
    for (let n = 0; n < N; n++) { is[n] = sharpe(n, J); oos[n] = sharpe(n, Jc); if (is[n] > is[enIyi]) enIyi = n; }
    // Örneklem dışı göreli sıra (1..N, eşitlikte ortalama sıra), ω = sıra / (N + 1).
    const v = oos[enIyi];
    let alt = 0, esit = 0;
    for (let n = 0; n < N; n++) { if (oos[n] < v) alt++; else if (oos[n] === v) esit++; }
    const sira = alt + (esit + 1) / 2;
    const w = sira / (N + 1);
    logitler.push(Math.log(w / (1 - w)));
    isOos.push([is[enIyi], v]);
    if (v < 0) zarar++;
  }
  const pbo = logitler.filter(l => l <= 0).length / logitler.length;
  return { pbo, logitler, bozulma: dogrusal(isOos), zararOlasiligi: zarar / kombinasyonlar.length, kombinasyon: kombinasyonlar.length, S, N, T };
}

// Basit en küçük kareler: oos = kesisim + egim × is.
function dogrusal(ciftler) {
  const n = ciftler.length;
  const mx = ciftler.reduce((a, c) => a + c[0], 0) / n, my = ciftler.reduce((a, c) => a + c[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of ciftler) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  const egim = sxx > 0 ? sxy / sxx : 0;
  return { egim, kesisim: my - egim * mx, r2: sxx > 0 && syy > 0 ? sxy * sxy / (sxx * syy) : 0 };
}

// ------------------------------------------------------------------ Harvey-Liu kırpması
// Tek test p değeri, çift taraflı. Büyük T için normal yaklaşımı (t dağılımı T-1 sd).
export const pTek = (sr, T) => 2 * (1 - phi(Math.abs(sr) * Math.sqrt(T)));

// Tüm denemelerin p değerlerinden, en iyi denemenin düzeltilmiş p değeri.
// yontem: 'sidak' | 'bonferroni' | 'holm' | 'bhy'
export function duzeltilmisP(pler, yontem, hedef = null) {
  const M = pler.length;
  const sirali = pler.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const k = hedef === null ? 0 : sirali.findIndex(x => x.i === hedef);
  const p = sirali[k].p;
  switch (yontem) {
    case 'sidak': return 1 - (1 - p) ** M;
    case 'bonferroni': return Math.min(1, M * p);
    case 'holm': {
      // Adım aşağı: düzeltilmiş p_(k) = max_{j<=k} (M - j + 1) p_(j)
      let enb = 0;
      for (let j = 0; j <= k; j++) enb = Math.max(enb, Math.min(1, (M - j) * sirali[j].p));
      return enb;
    }
    case 'bhy': {
      // Adım yukarı (Benjamini-Hochberg-Yekutieli): düzeltilmiş p_(k) = min_{j>=k} M c(M) p_(j) / j
      let c = 0; for (let i = 1; i <= M; i++) c += 1 / i;
      let enk = 1;
      for (let j = M - 1; j >= k; j--) enk = Math.min(enk, M * c * sirali[j].p / (j + 1));
      return Math.min(1, enk);
    }
  }
  throw new Error(`bilinmeyen yöntem: ${yontem}`);
}

// Düzeltilmiş p'yi yeniden Sharpe'a çevirir (Harvey-Liu Eş. 5): HSR ve kırpma oranı.
export function sharpeKirpma(sharpeler, T, { yontem = 'bhy', hedef = null } = {}) {
  if (sharpeler.length < 1 || !(T > 2)) return null;
  const pler = sharpeler.map(sr => pTek(sr, T));
  const i = hedef ?? sharpeler.reduce((b, v, j) => (Math.abs(v) > Math.abs(sharpeler[b]) ? j : b), 0);
  const sr = sharpeler[i];
  const pM = duzeltilmisP(pler, yontem, i);
  const t = pM >= 1 ? 0 : phiTers(1 - pM / 2);
  const hsr = Math.sign(sr) * t / Math.sqrt(T);
  return { yontem, sr, pTek: pler[i], pDuzeltilmis: pM, hsr, kirpma: sr !== 0 ? 1 - hsr / sr : 0, M: sharpeler.length };
}

// ------------------------------------------------------------------ kalıcı deneme sayısı
// Aynı strateji iskeleti (sayısal parametreler hariç) üzerinde kaç ayar denendiğini tutar.
// Böylece kullanıcı ızgarayı parça parça tarasa da DSR'deki N gerçek arama yükünü yansıtır.
export function iskeletAnahtari(s) {
  const sade = JSON.stringify(s, (k, v) => (typeof v === 'number' ? 0 : (k === 'ad' || k === 'aciklama' ? undefined : v)));
  let h = 2166136261;
  for (let i = 0; i < sade.length; i++) { h ^= sade.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'kalibre.denemeler.' + (h >>> 0).toString(36);
}

export function denemeSayaci(depo = globalThis.localStorage ?? null) {
  const oku = anahtar => { try { return Number(depo?.getItem(anahtar)) || 0; } catch { return 0; } };
  return {
    oku: s => oku(iskeletAnahtari(s)),
    ekle(s, adet) {
      const a = iskeletAnahtari(s), yeni = oku(a) + Math.max(0, adet | 0);
      try { depo?.setItem(a, String(yeni)); } catch { /* özel pencere: yalnız bu oturum */ }
      return yeni;
    },
    sifirla(s) { try { depo?.removeItem(iskeletAnahtari(s)); } catch { /* yok say */ } },
  };
}
