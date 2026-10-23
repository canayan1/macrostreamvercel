// Ödeme sonrası sayfa (/hesap/?oturum=cs_...) lisans anahtarını buradan alır.
// GET /api/odeme/oturum?oturum=cs_...  → { anahtar, durum, bitis, hesaplar, hesapSiniri, eposta }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dilUygula } from '../_lib/dil.ts';
import { depoSec } from '../_lib/depo.ts';
import { stripeIstemci } from '../_lib/stripe.ts';
import { kayitGorunumu, oturumCoz } from '../_lib/lisans.ts';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dil = dilUygula(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ hata: 'yalnız GET' });
  const oturum = String(req.query.oturum ?? '');
  if (!/^cs_(test_|live_)?[A-Za-z0-9]{10,200}$/.test(oturum)) return res.status(400).json({ hata: 'oturum hatalı' });
  const depo = depoSec();
  const stripe = stripeIstemci();
  if (!depo || !stripe) return res.status(503).json({ hata: 'Ödeme henüz açılmadı.' });
  try {
    const k = await oturumCoz(depo, oturum, stripe);
    if (!k) return res.status(404).json({ hata: 'Ödeme henüz tamamlanmamış görünüyor. Birkaç saniye sonra sayfayı yenile.' });
    return res.status(200).json(kayitGorunumu(k));
  } catch {
    return res.status(502).json({ hata: 'Ödeme bilgisi alınamadı. Biraz sonra yeniden dene.' });
  }
}
