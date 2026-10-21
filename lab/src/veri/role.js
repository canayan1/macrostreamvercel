// Şifreli röle, protokol v1. Ayrıntılar: docs/kopru.md "Röle protokolü".
//
// Motor (MT5) köprü belgelerini şifreleyip Kalibre sunucusuna bırakır; Lab alıp çözer.
// Sunucu içeriği okuyamaz, değiştiremez ve hangi sembolün taşındığını bilmez.
//
// Eşleştirme kodu "KLB1" + 32 baytlık sırrın hex'idir. Kod tarayıcıda üretilir, kullanıcı
// onu MT5'teki eklentiye yapıştırır. Sunucuya hiçbir zaman gönderilmez.
//
//   kanal  = HMAC(sır, "kalibre-kopru/kanal")[0:16]           → sunucudaki kanal kimliği
//   şifre  = HMAC(sır, "kalibre-kopru/sifre")                  → AES-256-CTR anahtarı
//   mac    = HMAC(sır, "kalibre-kopru/mac")                    → HMAC-SHA256 mühür anahtarı
//   yuva   = HMAC(sır, "kalibre-kopru/yuva/<tür>/<ad>")[0:8]   → belge kimliği (ad: "EURUSD-H1")
//
// Zarf: { v: 1, n: nonce(12 bayt hex), u: açık metin bayt sayısı, c: şifreli metin hex, m: mühür hex }
//   AES-CTR sayaç bloğu: nonce (12 bayt) + 32 bit büyük uçlu sayaç, 0'dan başlar.
//   mühür = HMAC(mac, "KLB1|<kanal>|<yuva>|<n>|<u>|<c>")  (şifrele, sonra mühürle)
// Mühür kanalı ve yuvayı kapsar: bir zarf başka bir yuvaya taşınırsa açılmaz.
//
// Tarayıcıda WebCrypto ile çalışır; Node'da da (globalThis.crypto) aynı kod test edilir.

export const KOD_ONEK = 'KLB1';
const te = new TextEncoder();
const td = new TextDecoder('utf-8', { fatal: true });

export const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
export function hexBayt(s) {
  if (typeof s !== 'string' || !/^(?:[0-9a-f]{2})*$/.test(s)) throw new Error('geçersiz hex');
  return Uint8Array.from(s.match(/../g) ?? [], h => parseInt(h, 16));
}

async function hmac(anahtar, mesaj) {
  const k = await crypto.subtle.importKey('raw', anahtar, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, mesaj));
}

export function kodUret() {
  return KOD_ONEK + hex(crypto.getRandomValues(new Uint8Array(32)));
}

// Kullanıcı kodu boşluklu, satır sonlu ya da büyük harfle yapıştırabilir.
export function kodCoz(kod) {
  const t = String(kod ?? '').replace(/\s+/g, '').toLowerCase();
  if (!t.startsWith(KOD_ONEK.toLowerCase())) throw new Error('eşleştirme kodu KLB1 ile başlamalı');
  const h = t.slice(KOD_ONEK.length);
  if (!/^[0-9a-f]{64}$/.test(h)) throw new Error('eşleştirme kodu eksik ya da hatalı (KLB1 + 64 karakter)');
  return hexBayt(h);
}

export async function anahtarlar(kod) {
  const sir = kodCoz(kod);
  const turet = e => hmac(sir, te.encode(`kalibre-kopru/${e}`));
  return {
    sir,
    kanal: hex((await turet('kanal')).slice(0, 16)),
    sifre: await turet('sifre'),
    mac: await turet('mac'),
  };
}

export async function yuva(a, tur, ad = '') {
  return hex((await hmac(a.sir, te.encode(`kalibre-kopru/yuva/${tur}/${ad}`))).slice(0, 8));
}

const muhurMetni = (kanal, y, n, u, c) => te.encode(`KLB1|${kanal}|${y}|${n}|${u}|${c}`);

// Testler ve örnek üretici için: Motor'un yaptığının tarayıcıdaki karşılığı.
export async function muhurle(a, y, metin, nonce = crypto.getRandomValues(new Uint8Array(12))) {
  if (nonce.length !== 12) throw new Error('nonce 12 bayt olmalı');
  const acik = te.encode(metin);
  const k = await crypto.subtle.importKey('raw', a.sifre, 'AES-CTR', false, ['encrypt']);
  const sayac = new Uint8Array(16);
  sayac.set(nonce, 0);
  const c = hex(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CTR', counter: sayac, length: 32 }, k, acik)));
  const n = hex(nonce);
  return { v: 1, n, u: acik.length, c, m: hex(await hmac(a.mac, muhurMetni(a.kanal, y, n, acik.length, c))) };
}

// Zarfı doğrular ve çözer. Mühür tutmazsa çözmeye hiç girişilmez.
export async function ac(a, y, z) {
  if (!z || z.v !== 1) throw new Error('desteklenmeyen zarf sürümü');
  if (!/^[0-9a-f]{24}$/.test(z.n ?? '')) throw new Error('zarf: nonce hatalı');
  if (!Number.isInteger(z.u) || z.u < 0) throw new Error('zarf: uzunluk hatalı');
  if (typeof z.c !== 'string' || z.c.length !== 2 * z.u) throw new Error('zarf: şifreli metin uzunluğu tutmuyor');
  if (!/^[0-9a-f]{64}$/.test(z.m ?? '')) throw new Error('zarf: mühür hatalı');
  const mk = await crypto.subtle.importKey('raw', a.mac, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const tamam = await crypto.subtle.verify('HMAC', mk, hexBayt(z.m), muhurMetni(a.kanal, y, z.n, z.u, z.c));
  if (!tamam) throw new Error('mühür doğrulanamadı: veri değiştirilmiş ya da kod yanlış');
  const k = await crypto.subtle.importKey('raw', a.sifre, 'AES-CTR', false, ['decrypt']);
  const sayac = new Uint8Array(16);
  sayac.set(hexBayt(z.n), 0);
  const acik = await crypto.subtle.decrypt({ name: 'AES-CTR', counter: sayac, length: 32 }, k, hexBayt(z.c));
  return td.decode(acik);
}
