// Kurumsal pilot çıkışı — çerezi temizler.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', 'km_pilot=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return res.status(200).json({ ok: true });
}
