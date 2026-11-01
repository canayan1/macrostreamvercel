// Sealed report links. A report is encrypted in the browser with a fresh random key; the sealed
// envelope goes to /api/rapor and the key travels only in the link's #fragment, which browsers do
// not send to servers. Envelope: { v: 1, n: iv hex (12 bytes), c: ciphertext base64 }.
//
// Link: <origin>/lab/report#<id>.<key>   id from the relay (24 hex), key base64url (32 bytes).

const te = new TextEncoder();
const td = new TextDecoder('utf-8', { fatal: true });
const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const fromHex = s => Uint8Array.from(s.match(/../g) ?? [], h => parseInt(h, 16));
const b64 = b => btoa(String.fromCharCode(...b));
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64url = b => b64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = s => fromB64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

export const newKey = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

async function aesKey(keyText, usage) {
  const raw = fromB64url(keyText);
  if (raw.length !== 32) throw new Error('This link is incomplete.');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage]);
}

export async function seal(model, keyText) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await aesKey(keyText, 'encrypt');
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, te.encode(JSON.stringify(model)));
  return { v: 1, n: hex(iv), c: b64(new Uint8Array(c)) };
}

// Returns the model, or null when the envelope does not open with this key.
export async function open(env, keyText) {
  try {
    if (env?.v !== 1 || !/^[0-9a-f]{24}$/.test(env.n) || typeof env.c !== 'string') return null;
    const k = await aesKey(keyText, 'decrypt');
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromHex(env.n) }, k, fromB64(env.c));
    return JSON.parse(td.decode(plain));
  } catch { return null; }
}

export const linkOf = (origin, id, keyText) => `${origin}/lab/report#${id}.${keyText}`;
export function parseLink(fragment) {
  const m = /^#?([0-9a-f]{24})\.([A-Za-z0-9_-]{43})$/.exec(String(fragment ?? '').trim());
  return m ? { id: m[1], key: m[2] } : null;
}
