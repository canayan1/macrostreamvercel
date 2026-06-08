// Kurumsal pilot girişi — kullanıcı adı/şifre doğrulama + imzalı çerez.
// Şifreler ortam değişkenlerinde tutulur (kodda DEĞİL):
//   KURUMSAL_USERS  → JSON: {"acme":"sifre1","beta":"sifre2"}
//   KURUMSAL_SECRET → çerez imzası için uzun rastgele dize
// Çerez: km_pilot = base64url(payload).base64url(HMAC_SHA256(secret, payload))
//   payload = {"u": <kullanıcı>, "exp": <unix saniye>}
// Doğrulama middleware.ts (edge) tarafında aynı algoritmayla yapılır.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

export const config = { maxDuration: 10 };

const DAYS = 14;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

  const secret = process.env.KURUMSAL_SECRET;
  const usersRaw = process.env.KURUMSAL_USERS;
  if (!secret || !usersRaw) {
    // Henüz ortam değişkenleri tanımlanmadıysa giriş kapalıdır (güvenli varsayılan).
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  let users: Record<string, any>;
  try {
    users = JSON.parse(usersRaw);
  } catch {
    return res.status(503).json({ ok: false, error: 'bad_config' });
  }

  const body = (req.body || {}) as { username?: string; password?: string };
  const u = String(body.username || '').trim();
  const p = String(body.password || '');

  // Kullanıcı değeri iki formatta olabilir:
  //  - "şifre"  (eski format → kısıt yok, tüm raporlara erişim)
  //  - { "pw": "şifre", "clients": ["acme", ...] }  (yalnız listelenen müşteri raporlarına erişim)
  const entry = Object.prototype.hasOwnProperty.call(users, u) ? users[u] : null;
  let stored: string | null = null;
  let clients: string[] | undefined;
  if (typeof entry === 'string') {
    stored = entry;
  } else if (entry && typeof entry === 'object') {
    stored = entry.pw != null ? String(entry.pw) : null;
    if (Array.isArray(entry.clients)) clients = entry.clients.map((x: any) => String(x));
  }

  let ok = false;
  if (stored !== null) {
    const a = Buffer.from(stored);
    const b = Buffer.from(p);
    if (a.length === b.length) ok = crypto.timingSafeEqual(a, b);
  }
  if (!ok) return res.status(401).json({ ok: false, error: 'invalid' });

  const exp = Math.floor(Date.now() / 1000) + DAYS * 86400;
  const payloadObj: any = { u, exp };
  if (clients !== undefined) payloadObj.c = clients;
  const payload = b64url(Buffer.from(JSON.stringify(payloadObj), 'utf8'));
  const sig = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  const token = `${payload}.${sig}`;

  res.setHeader(
    'Set-Cookie',
    `km_pilot=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${DAYS * 86400}`
  );
  return res.status(200).json({ ok: true });
}
