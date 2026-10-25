// Hesap uçları (giriş yapmış kullanıcı; Authorization: Bearer <Supabase erişim belirteci>).
// Tek işlev dosyası, işlem sorgu parametresiyle seçilir (Vercel işlev sayısını artırmamak için):
//
//   GET  /api/hesap?islem=lisanslar            → { lisanslar: [{ anahtar, durum, bitis, ... }] }
//   POST /api/hesap?islem=lisans-bagla  { anahtar }   → { lisans }
//   POST /api/hesap?islem=sil           { onay: true } → { silindi, iptalEdilen }
//
// Tam lisans anahtarı yalnız bu uçtan ve yalnız anahtarın bağlı olduğu kullanıcıya verilir.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EN, dilUygula } from './_lib/dil.ts';
import { depoSec, type Depo } from './_lib/depo.ts';
import { stripeIstemci, type StripeIstek } from './_lib/stripe.ts';
import { belirtecAl, kullaniciDogrula, servisIstemci, supabaseAyar, type Getir, type Kullanici, type ServisIstemci } from './_lib/supabase.ts';
import { hesapBaglariniKaldir, kullaniciLisanslari, lisansBagla } from './_lib/hesap.ts';

export const config = { maxDuration: 15 };

export const HESAP_EN: Record<string, string> = {
  'Hesaplar henüz açılmadı.': 'Accounts are not available yet.',
  'Önce giriş yap.': 'Please sign in first.',
  'Oturum doğrulanamadı. Biraz sonra yeniden dene.': 'We could not verify your session. Please try again shortly.',
  'Bilinmeyen işlem.': 'Unknown action.',
  'Bu anahtar başka bir hesaba bağlı. Yanlışlık olduğunu düşünüyorsan bize yaz.': 'This key is linked to another account. If you think this is a mistake, contact us.',
  'Hesabı silmek için onay gerekli.': 'Please confirm that you want to delete your account.',
  'Abonelik iptal edilemedi; hesabın silinmedi. Biraz sonra yeniden dene ya da bize yaz.': 'We could not cancel your subscription, so your account was not deleted. Please try again shortly or contact us.',
  'Hesap silinemedi. Biraz sonra yeniden dene ya da bize yaz.': 'We could not delete your account. Please try again shortly or contact us.',
  'Hesap bilgisi alınamadı. Biraz sonra yeniden dene.': 'We could not load your account. Please try again shortly.',
  'Önce giriş yap.​': 'Please sign in first.',
};
Object.assign(EN, HESAP_EN);

const HESAP_SINIRI = Number(process.env.LISANS_HESAP_SINIRI ?? 2);
const IPTAL_EDILEBILIR = ['active', 'trialing', 'past_due'];

export function lisansGorunumu(k: any, simdi = Date.now()) {
  return {
    urun: typeof k.urun === 'string' ? k.urun : 'lab', // Kalibre Markets ürünü
    anahtar: k.anahtar,
    durum: k.durum,
    bitis: k.bitis,
    gecerli: (k.bitis ?? 0) * 1000 > simdi,
    hesaplar: k.hesaplar ?? [],
    hesapSiniri: HESAP_SINIRI,
    urunler: Array.isArray(k.urunler) ? k.urunler : ['motor', 'kopru'],
    beta: !!k.beta,
    yonetilebilir: !!k.musteri && !k.beta, // Stripe portalıyla yönetilebilir mi
  };
}

export interface HesapBaglam { depo: Depo; kullanici: Kullanici; stripe: StripeIstek | null; servis: ServisIstemci | null; simdi?: number }
export type HesapSonuc = { durum: number; govde: any };

// İşlem mantığı (test edilebilir; HTTP katmanından bağımsız).
export async function hesapIsle(islem: string, yontem: string, g: any, b: HesapBaglam): Promise<HesapSonuc> {
  const { depo, kullanici } = b;
  const simdi = b.simdi ?? Date.now();
  if (islem === 'lisanslar' && yontem === 'GET') {
    const l = await kullaniciLisanslari(depo, kullanici.id);
    return { durum: 200, govde: { lisanslar: l.map(k => lisansGorunumu(k, simdi)) } };
  }
  if (islem === 'lisans-bagla' && yontem === 'POST') {
    const r = await lisansBagla(depo, String(g?.anahtar ?? ''), kullanici.id, simdi, b.servis);
    return r.durum === 200 ? { durum: 200, govde: { lisans: lisansGorunumu(r.kayit, simdi) } } : { durum: r.durum, govde: { hata: r.hata } };
  }
  if (islem === 'sil' && yontem === 'POST') {
    if (g?.onay !== true) return { durum: 400, govde: { hata: 'Hesabı silmek için onay gerekli.' } };
    if (!b.servis) return { durum: 503, govde: { hata: 'Hesaplar henüz açılmadı.' } };
    // 1) Ödenen abonelikler dönem sonunda biter (yeni ücret alınmaz). Biri başarısız olursa hesap silinmez.
    let iptalEdilen = 0;
    const lisanslar = await kullaniciLisanslari(depo, kullanici.id);
    for (const k of lisanslar) {
      if (k.beta || !k.abonelik || !IPTAL_EDILEBILIR.includes(k.durum)) continue;
      if (!b.stripe) return { durum: 502, govde: { hata: 'Abonelik iptal edilemedi; hesabın silinmedi. Biraz sonra yeniden dene ya da bize yaz.' } };
      try { await b.stripe(`subscriptions/${encodeURIComponent(k.abonelik)}`, { cancel_at_period_end: 'true' }); iptalEdilen++; }
      catch { return { durum: 502, govde: { hata: 'Abonelik iptal edilemedi; hesabın silinmedi. Biraz sonra yeniden dene ya da bize yaz.' } }; }
    }
    // 2) Supabase kullanıcısı (profil, kayıtlar ve lisans görüntüsü CASCADE ile silinir).
    try { await b.servis.kullaniciSil(kullanici.id); }
    catch { return { durum: 502, govde: { hata: 'Hesap silinemedi. Biraz sonra yeniden dene ya da bize yaz.' } }; }
    // 3) Depodaki hesap bağları. Lisans kaydı ödenmiş dönem sonuna kadar MT5'te çalışmaya devam eder.
    await hesapBaglariniKaldir(depo, kullanici.id);
    return { durum: 200, govde: { silindi: true, iptalEdilen } };
  }
  return { durum: 400, govde: { hata: 'Bilinmeyen işlem.' } };
}

export async function istekKullanicisi(req: VercelRequest, getir: Getir = fetch): Promise<{ durum: number; hata?: string; kullanici?: Kullanici }> {
  const ayar = supabaseAyar();
  if (!ayar) return { durum: 503, hata: 'Hesaplar henüz açılmadı.' };
  let k: Kullanici | null;
  try { k = await kullaniciDogrula(ayar, belirtecAl(req.headers.authorization), getir); }
  catch { return { durum: 502, hata: 'Oturum doğrulanamadı. Biraz sonra yeniden dene.' }; }
  return k ? { durum: 200, kullanici: k } : { durum: 401, hata: 'Önce giriş yap.' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  dilUygula(req, res);
  res.setHeader('Cache-Control', 'no-store');
  const islem = String(req.query?.islem ?? '');
  const depo = depoSec();
  if (!depo) return res.status(503).json({ hata: 'Hesaplar henüz açılmadı.' });
  const u = await istekKullanicisi(req);
  if (!u.kullanici) return res.status(u.durum).json({ hata: u.hata });
  let g: any = req.body;
  if (typeof g === 'string') { try { g = JSON.parse(g); } catch { g = {}; } }
  try {
    const r = await hesapIsle(islem, String(req.method), g, { depo, kullanici: u.kullanici, stripe: stripeIstemci(), servis: servisIstemci(supabaseAyar()) });
    return res.status(r.durum).json(r.govde);
  } catch {
    return res.status(502).json({ hata: 'Hesap bilgisi alınamadı. Biraz sonra yeniden dene.' });
  }
}
