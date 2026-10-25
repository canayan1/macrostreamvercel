// Abonelik ödemesini başlatır: Stripe Checkout oturumu açar ve ödeme sayfasının adresini döner.
// POST /api/odeme/baslat  { sartlar: true }  → { url }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dilUygula } from '../_lib/dil.ts';
import { kokAdres, stripeIstemci } from '../_lib/stripe.ts';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dil = dilUygula(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ hata: 'yalnız POST' });
  const stripe = stripeIstemci();
  const fiyat = process.env.STRIPE_PRICE_ID;
  if (!stripe || !fiyat) return res.status(503).json({ hata: 'Ödeme henüz açılmadı.' });

  let g: any = req.body;
  if (typeof g === 'string') { try { g = JSON.parse(g); } catch { g = {}; } }
  if (g?.sartlar !== true) return res.status(400).json({ hata: 'Devam etmek için kullanım şartlarını onaylamalısın.' });

  const kok = kokAdres(req.headers['x-forwarded-host'] ?? req.headers.host);
  try {
    const s = await stripe('checkout/sessions', {
      mode: 'subscription',
      line_items: [{ price: fiyat, quantity: 1 }],
      success_url: `${kok}${dil === 'en' ? '/en/license/' : '/hesap/'}?oturum={CHECKOUT_SESSION_ID}`,
      cancel_url: `${kok}${dil === 'en' ? '/en/pricing/' : '/pro/'}?iptal=1`,
      allow_promotion_codes: 'true',
      // %100 indirimli davet kodunda kart istenmez; ilk ücretli faturadan önce Stripe kart ister.
      payment_method_collection: 'if_required',
      billing_address_collection: 'auto',
      locale: dil === 'en' ? 'auto' : 'tr',
      // Şartların hangi sürümünün onaylandığı ödeme kaydında da dursun.
      metadata: { sartlar_onay: '2026-10-21' },
      subscription_data: { metadata: { sartlar_onay: '2026-10-21' } },
    });
    return res.status(200).json({ url: s.url });
  } catch {
    return res.status(502).json({ hata: 'Ödeme sayfası açılamadı. Biraz sonra yeniden dene.' });
  }
}
