// Desk Signal keys and envelopes. The relay only ever sees sealed envelopes; the desk code that
// opens them lives in the invite link's #fragment, which browsers never send to a server.
//
// Desk code   "KDS1" + 64 hex (32 random bytes), made in the head's browser.
//   channel   = HMAC(secret, "kalibre-desk/channel")[0:16]  → the relay's id for this desk
//   seal key  = HMAC(secret, "kalibre-desk/seal")          → AES-256-GCM, channel as extra data
// Head key    ECDSA P-256 pair, made in the head's browser. The public half travels in the invite;
//             signals, the board and removals are signed with it, so a trader holding the desk
//             code can answer signals but cannot send one.
//
// Envelope on the relay: { v: 1, n: iv (12 bytes hex), c: ciphertext base64 }
// Inside:               { p: payload JSON text, s?: head signature base64url over p }

export const PREFIX = 'KDS1';
const te = new TextEncoder();
const td = new TextDecoder('utf-8', { fatal: true });

export const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const fromHex = s => Uint8Array.from(s.match(/../g) ?? [], h => parseInt(h, 16));
const b64 = b => btoa(String.fromCharCode(...b));
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export const b64url = b => b64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const fromB64url = s => fromB64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

export const newCode = () => PREFIX + hex(crypto.getRandomValues(new Uint8Array(32)));

export function parseCode(code) {
  const t = String(code ?? '').replace(/\s+/g, '').toLowerCase();
  if (!t.startsWith(PREFIX.toLowerCase()) || !/^[0-9a-f]{64}$/.test(t.slice(PREFIX.length))) throw new Error('This invite link is incomplete. Ask the head of desk for a new one.');
  return fromHex(t.slice(PREFIX.length));
}

async function hmac(key, text) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, te.encode(text)));
}

export async function deskKeys(code) {
  const secret = parseCode(code);
  const channel = hex((await hmac(secret, 'kalibre-desk/channel')).slice(0, 16));
  const seal = await crypto.subtle.importKey('raw', await hmac(secret, 'kalibre-desk/seal'), 'AES-GCM', false, ['encrypt', 'decrypt']);
  return { channel, seal };
}

export async function sealEnvelope(keys, inner) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode(keys.channel) }, keys.seal, te.encode(JSON.stringify(inner)));
  return { v: 1, n: hex(iv), c: b64(new Uint8Array(c)) };
}

// Returns the inner object, or null for anything that does not open with this desk's key.
export async function openEnvelope(keys, env) {
  try {
    if (env?.v !== 1 || !/^[0-9a-f]{24}$/.test(env.n) || typeof env.c !== 'string') return null;
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromHex(env.n), additionalData: te.encode(keys.channel) }, keys.seal, fromB64(env.c));
    const inner = JSON.parse(td.decode(plain));
    return typeof inner?.p === 'string' ? inner : null;
  } catch { return null; }
}

// ------------------------------------------------------------------ head signature
const ECDSA = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN = { name: 'ECDSA', hash: 'SHA-256' };

export async function newHeadKey() {
  const pair = await crypto.subtle.generateKey(ECDSA, true, ['sign', 'verify']);
  return {
    privateJwk: await crypto.subtle.exportKey('jwk', pair.privateKey),
    publicKey: b64url(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))),
  };
}

export async function signText(privateJwk, text) {
  const k = await crypto.subtle.importKey('jwk', privateJwk, ECDSA, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign(SIGN, k, te.encode(text))));
}

const verifiers = new Map();
export async function verifyText(publicKey, text, sig) {
  try {
    if (!verifiers.has(publicKey)) verifiers.set(publicKey, crypto.subtle.importKey('raw', fromB64url(publicKey), ECDSA, false, ['verify']));
    return await crypto.subtle.verify(SIGN, await verifiers.get(publicKey), fromB64url(sig), te.encode(text));
  } catch { return false; }
}

// ------------------------------------------------------------------ invite
// The invite is "<desk code>.<head public key>", carried after #join= so it never reaches a server.
export const inviteOf = (code, publicKey) => `${code}.${publicKey}`;
export function parseInvite(text) {
  const [code, publicKey] = String(text ?? '').trim().split('.');
  parseCode(code);
  if (!/^[A-Za-z0-9_-]{80,100}$/.test(publicKey ?? '')) throw new Error('This invite link is incomplete. Ask the head of desk for a new one.');
  return { code, publicKey };
}

// Seals an event; head events carry the head's signature.
export async function sealEvent(keys, payload, privateJwk) {
  const p = JSON.stringify(payload);
  return sealEnvelope(keys, privateJwk ? { p, s: await signText(privateJwk, p) } : { p });
}

// Opens a relay record { q, ts, e } into { q, ts, ev, head } or null.
export async function openRecord(keys, publicKey, rec) {
  const inner = await openEnvelope(keys, rec?.e);
  if (!inner) return null;
  let ev;
  try { ev = JSON.parse(inner.p); } catch { return null; }
  if (!ev || typeof ev !== 'object' || typeof ev.t !== 'string') return null;
  const head = typeof inner.s === 'string' && await verifyText(publicKey, inner.p, inner.s);
  return { q: rec.q, ts: rec.ts, ev, head };
}
