// Abonelik ödemesini başlatır: Stripe Checkout oturumu açar ve ödeme sayfasının adresini döner.
// POST /api/odeme/baslat  { sartlar: true, cayma_onay: true }  → { url }
// Hesap gerekir: Authorization: Bearer <Supabase erişim belirteci>. Oturum, client_reference_id ile
// kullanıcıya bağlanır; webhook lisansı bu hesaba yazar (api/_lib/lisans.ts oturumKullanicisi).
// cayma_onay: hizmete hemen başlanmasını istediğini ve lisans anahtarı bir MetaTrader 5 hesabında ilk kez
// etkinleştirilince 14 günlük cayma hakkının sona ereceğini kabul (İade ve İptal Politikası bölüm 4, /refunds#withdrawal;
// Hizmet Şartları bölüm 11). Onay Checkout metadata'sında saklanır.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dilUygula } from '../_lib/dil.ts';
import { kokAdres, stripeIstemci } from '../_lib/stripe.ts';
import { depoSec } from '../_lib/depo.ts';
import { kullaniciLisanslari } from '../_lib/hesap.ts';
import { belirtecAl, kullaniciDogrula, supabaseAyar, type Kullanici } from '../_lib/supabase.ts';

export const config = { maxDuration: 10 };
// Onaylanan Hizmet Şartları'nın sürümü. /terms sayfasındaki "Terms version" bu değerden üretilir
// (yerel/yasal-uret.py); static/giris.js'teki SARTLAR_SURUMU ile aynı olmalı (test/odeme.test.mjs denetler).
export const SARTLAR_SURUMU = '2026-10-25-en1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dil = dilUygula(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ hata: 'yalnız POST' });
  const stripe = stripeIstemci();
  const fiyat = process.env.STRIPE_PRICE_ID;
  if (!stripe || !fiyat) return res.status(503).json({ hata: 'Ödeme henüz açılmadı.' });

  let g: any = req.body;
  if (typeof g === 'string') { try { g = JSON.parse(g); } catch { g = {}; } }
  if (g?.sartlar !== true) return res.status(400).json({ hata: 'Devam etmek için hizmet şartlarını onaylamalısın.' });
  if (g?.cayma_onay !== true) return res.status(400).json({ hata: 'Devam etmek için cayma hakkına ilişkin onay kutusunu işaretlemelisin.' });
  const onay: Record<string, string> = { sartlar_onay: SARTLAR_SURUMU, cayma_onay: 'evet', cayma_onay_zamani: new Date().toISOString() };

  // Hesap: her abonelik bir Kalibre hesabına aittir.
  const sb = supabaseAyar();
  if (!sb) return res.status(503).json({ hata: 'Hesaplar henüz açılmadı.' });
  let kullanici: Kullanici | null;
  try { kullanici = await kullaniciDogrula(sb, belirtecAl(req.headers.authorization)); }
  catch { return res.status(502).json({ hata: 'Oturum doğrulanamadı. Biraz sonra yeniden dene.' }); }
  if (!kullanici) return res.status(401).json({ hata: 'Ödeme için önce giriş yap.' });
  onay.kullanici = kullanici.id;

  // Aynı hesapta ikinci ücretli abonelik açılmaz; daha önce Stripe müşterisi olduysa o kullanılır.
  let musteri: string | null = null;
  const depo = depoSec();
  if (depo) {
    const simdi = Date.now();
    for (const k of await kullaniciLisanslari(depo, kullanici.id).catch(() => [])) {
      if (k.beta) continue;
      if (k.musteri) musteri ??= k.musteri;
      if (['active', 'trialing', 'past_due'].includes(k.durum) && k.bitis * 1000 > simdi)
        return res.status(409).json({ hata: 'Bu hesapta zaten etkin bir abonelik var. Hesabım sayfasından yönetebilirsin.' });
    }
  }

  const kok = kokAdres(req.headers['x-forwarded-host'] ?? req.headers.host);
  try {
    const s = await stripe('checkout/sessions', {
      mode: 'subscription',
      client_reference_id: kullanici.id,
      ...(musteri ? { customer: musteri } : kullanici.eposta ? { customer_email: kullanici.eposta } : {}),
      line_items: [{ price: fiyat, quantity: 1 }],
      success_url: `${kok}${dil === 'en' ? '/account' : '/tr/account'}?oturum={CHECKOUT_SESSION_ID}`,
      cancel_url: `${kok}${dil === 'en' ? '/pricing' : '/tr/pricing'}?iptal=1`,
      allow_promotion_codes: 'true',
      // %100 indirimli davet kodunda kart istenmez; ilk ücretli faturadan önce Stripe kart ister.
      payment_method_collection: 'if_required',
      billing_address_collection: 'auto',
      locale: dil === 'en' ? 'auto' : 'tr',
      // Şartların hangi sürümünün ve cayma onayının ne zaman verildiği ödeme kaydında da dursun.
      metadata: onay,
      subscription_data: { metadata: onay },
    });
    return res.status(200).json({ url: s.url });
  } catch {
    return res.status(502).json({ hata: 'Ödeme sayfası açılamadı. Biraz sonra yeniden dene.' });
  }
}
