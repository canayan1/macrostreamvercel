// Stripe webhook'u: ödeme, yenileme ve iptalleri lisans kaydına işler.
// Stripe panelinde uç: https://kalibremarkets.com/api/odeme/webhook
// Olaylar: checkout.session.completed, customer.subscription.created/updated/deleted,
//          invoice.paid, invoice.payment_failed
//
// İmza ham gövde üzerinden doğrulanır; bu yüzden gövde ayrıştırılmadan okunur.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { depoSec } from '../_lib/depo.ts';
import { imzaDogrula, stripeIstemci } from '../_lib/stripe.ts';
import { olayIsle } from '../_lib/lisans.ts';

export const config = { maxDuration: 15, api: { bodyParser: false } };

async function hamGovde(req: VercelRequest): Promise<string> {
  const parca: Buffer[] = [];
  for await (const p of req as any) parca.push(Buffer.isBuffer(p) ? p : Buffer.from(p));
  if (parca.length) return Buffer.concat(parca).toString('utf8');
  // Bazı çalışma ortamları gövdeyi önceden okur; ham metin ya da Buffer olarak kaldıysa onu kullan.
  const b = (req as any).body;
  return Buffer.isBuffer(b) ? b.toString('utf8') : typeof b === 'string' ? b : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const depo = depoSec();
  const stripe = stripeIstemci();
  const sir = process.env.STRIPE_WEBHOOK_SECRET;
  if (!depo || !stripe || !sir) return res.status(503).end();

  const ham = await hamGovde(req);
  if (!imzaDogrula(ham, req.headers['stripe-signature'] as string | undefined, sir)) return res.status(400).end();
  let olay: any;
  try { olay = JSON.parse(ham); } catch { return res.status(400).end(); }

  try {
    const sonuc = await olayIsle(depo, olay, stripe);
    // Günlüğe yalnız olay türü ve sonuç; e-posta, müşteri ya da tutar yazılmaz.
    console.log(`stripe ${olay.type}: ${sonuc}`);
    return res.status(200).json({ alindi: true });
  } catch {
    // 5xx: Stripe olayı birkaç gün boyunca yeniden gönderir.
    return res.status(500).end();
  }
}
