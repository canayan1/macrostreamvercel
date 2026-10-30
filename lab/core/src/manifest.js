// Çalıştırma manifesti ve sonuç kimliği (resultId).
// Run manifest and result ID.
//
// Aynı motor sürümü + aynı strateji + aynı veri + aynı ayarlar + aynı tohum her zaman aynı
// resultId'yi verir. Kimlik, kanonik JSON'un SHA-256 özetidir:
//   specHash   = sha256(kanonik(public strategy))           (strategy-format.js, kalibre: 3)
//   dataHash   = sha256(mum satırları "t,a,y,d,k[,v]\n")
//   configHash = sha256(kanonik({ kind, ...public settings, extra? }))   (run-format.js)
//   resultId   = sha256(kanonik({ dataHash, configHash, engineVersion, seed, specHash }))
// SHA-256 burada saf JavaScript ile yazılıdır: tarayıcıda ve Node'da eşzamanlı ve aynı sonucu
// verir; testler node:crypto ile karşılaştırır.
//
// Kanonik JSON: anahtarlar UTF-16 kod birimi sırasıyla dizilir; undefined alanlar atlanır;
// sayılar ECMAScript Number::toString ile yazılır (en kısa geri dönüşlü gösterim, motorlar arası
// aynı); -0 → 0; NaN, Infinity, -Infinity → "NaN", "Infinity", "-Infinity" dizgeleri.

import { MOTOR_SURUMU } from './surum.js';
import { toPublic } from './strategy-format.js';
import { publicKind, publicConfig, publicExtra, publicSummary, publicTrade } from './run-format.js';
import { englishMessage } from './messages-en.js';

export function kanonik(v) {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'number':
      if (Number.isNaN(v)) return '"NaN"';
      if (v === Infinity) return '"Infinity"';
      if (v === -Infinity) return '"-Infinity"';
      return Object.is(v, -0) ? '0' : String(v);
    case 'boolean': return v ? 'true' : 'false';
    case 'string': return JSON.stringify(v);
    case 'bigint': return JSON.stringify(v.toString());
    case 'undefined': case 'function': case 'symbol': return 'null';
  }
  if (Array.isArray(v)) return `[${v.map(x => (x === undefined || typeof x === 'function' ? 'null' : kanonik(x))).join(',')}]`;
  if (ArrayBuffer.isView(v)) return kanonik(Array.from(v));
  const anahtarlar = Object.keys(v).filter(k => v[k] !== undefined && typeof v[k] !== 'function').sort();
  return `{${anahtarlar.map(k => `${JSON.stringify(k)}:${kanonik(v[k])}`).join(',')}}`;
}

// ---- SHA-256 (FIPS 180-4) ----
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function utf8(s) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
  return Uint8Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0));
}

export function sha256(girdi) {
  const veri = typeof girdi === 'string' ? utf8(girdi) : girdi;
  const n = veri.length;
  const blokSay = ((n + 9 + 63) >>> 6);
  const m = new Uint8Array(blokSay * 64);
  m.set(veri);
  m[n] = 0x80;
  const bitUz = n * 8;
  const dv = new DataView(m.buffer);
  dv.setUint32(m.length - 8, Math.floor(bitUz / 0x100000000));
  dv.setUint32(m.length - 4, bitUz >>> 0);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  for (let b = 0; b < blokSay; b++) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(b * 64 + i * 4);
    for (let i = 16; i < 64; i++) {
      const w15 = W[i - 15], w2 = W[i - 2];
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b2, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b2) ^ (a & c) ^ (b2 & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b2; b2 = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b2; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, x => x.toString(16).padStart(8, '0')).join('');
}

// Mum verisinin özeti: her mum bir satır, alanlar sabit sırada; sayılar Number::toString ile.
const sayi = x => (x === undefined || x === null ? '' : kanonik(Number(x)));
export function veriOzeti(mumlar) {
  let s = '';
  for (const m of mumlar) s += `${sayi(m.t)},${sayi(m.a)},${sayi(m.y)},${sayi(m.d)},${sayi(m.k)}${m.v !== undefined ? `,${sayi(m.v)}` : ''}\n`;
  return sha256(s);
}

// Ayarlardan özete giren kısım: fonksiyonlar ve undefined atlanır; diziler (ör. alt mumlar)
// özetlenerek yer kaplamaz.
function ayarOzetlenebilir(ayar = {}) {
  const o = {};
  for (const [k, v] of Object.entries(ayar)) {
    if (v === undefined || typeof v === 'function') continue;
    if (k === 'altMumlar' && Array.isArray(v)) { o.altMumlarHash = veriOzeti(v); continue; }
    if (k === 'donusum' && v && Array.isArray(v.t)) { o.donusumHash = sha256(kanonik(v)); continue; }
    o[k] = v;
  }
  return o;
}

// tur: 'prova' | 'optimizasyon' | 'yuruyen-ileri' | başka bir iş adı. seed: rastgelelik yoksa null.
// Hashes are taken over the public (English) forms, so an exported package is self-verifying.
export function manifestOlustur({ strateji, mumlar, ayar = {}, seed = null, tur = 'prova', ek } = {}) {
  const kind = publicKind(tur);
  const specHash = sha256(kanonik(strateji ? toPublic(strateji) : null));
  const dataHash = veriOzeti(mumlar ?? []);
  const configHash = sha256(kanonik({ kind, ...publicConfig(ayarOzetlenebilir(ayar)), ...(ek ? { extra: publicExtra(ek) } : {}) }));
  const engineVersion = MOTOR_SURUMU;
  const resultId = sha256(kanonik({ dataHash, configHash, engineVersion, seed, specHash }));
  return {
    manifestVersion: 2,
    engineVersion, kind, seed, specHash, dataHash, configHash, resultId,
    bars: mumlar?.length ?? 0,
    firstBar: mumlar?.[0]?.t ?? null,
    lastBar: mumlar?.at?.(-1)?.t ?? null,
  };
}

// Kısa gösterim: "kr1-" + ilk 16 onaltılık hane.
export const kisaKimlik = id => `kr1-${String(id).slice(0, 16)}`;

// Dışa aktarma paketi: manifest + strateji + ayar + özet + işlemler. Tekrar üretmek için
// aynı veri (dataHash ile doğrulanır) ve aynı motor sürümü gerekir.
// Every field is in the public (English) form, warnings included.
export function calistirmaPaketi({ manifest, strateji, ayar, istatistik, islemler, uyarilar, ek }) {
  return {
    format: 'kalibre-run', formatVersion: 2,
    manifest, strategy: toPublic(strateji), config: publicConfig(ayarOzetlenebilir(ayar)), summary: publicSummary(istatistik),
    trades: (islemler ?? []).map(publicTrade), warnings: (uyarilar ?? []).map(englishMessage), ...(ek ? { extra: publicExtra(ek) } : {}),
  };
}
