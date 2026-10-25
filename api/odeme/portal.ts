// Aboneliği yönetme (kart değiştirme, fatura, iptal): Stripe müşteri portalına yönlendirir.
// POST /api/odeme/portal  { anahtar }  → { url }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dilUygula } from '../_lib/dil.ts';
import { depoSec } from '../_lib/depo.ts';
import { kokAdres, stripeIstemci } from '../_lib/stripe.ts';
import { ANAHTAR_RE } from '../_lib/lisans.ts';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dil = dilUygula(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ hata: 'yalnız POST' });
  const depo = depoSec();
  const stripe = stripeIstemci();
  if (!depo || !stripe) return res.status(503).json({ hata: 'Ödeme henüz açılmadı.' });
  let g: any = req.body;
  if (typeof g === 'string') { try { g = JSON.parse(g); } catch { g = {}; } }
  const anahtar = String(g?.anahtar ?? '').trim().toUpperCase();
  if (!ANAHTAR_RE.test(anahtar)) return res.status(400).json({ hata: 'Lisans anahtarı hatalı.' });
  try {
    const v = await depo.oku(`lisans:${anahtar}`);
    const kayit = v ? JSON.parse(v) : null;
    // Beta lisansları ödemesizdir; yönetilecek bir Stripe aboneliği yoktur.
    if (kayit?.beta) return res.status(404).json({ hata: 'Bu bir kapalı beta lisansı; yönetilecek bir ödeme ya da abonelik yok. Süre uzatma için bize yaz.' });
    const musteri = kayit?.musteri ?? null;
    if (!musteri) return res.status(404).json({ hata: 'Bu anahtara bağlı bir abonelik bulunamadı.' });
    const kok = kokAdres(req.headers['x-forwarded-host'] ?? req.headers.host);
    const p = await stripe('billing_portal/sessions', { customer: musteri, return_url: `${kok}${dil === 'en' ? '/account' : '/tr/account'}`, locale: dil === 'en' ? 'auto' : 'tr' });
    return res.status(200).json({ url: p.url });
  } catch {
    return res.status(502).json({ hata: 'Abonelik sayfası açılamadı. Biraz sonra yeniden dene.' });
  }
}
