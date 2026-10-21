// Abonelik kaydı ve MT5 lisans belirteci. Protokol: kalibre-lab/docs/lisans.md (v1).
//
// Kayıtlar (depo anahtarları):
//   lisans:<anahtar>          { anahtar, eposta, musteri, abonelik, durum, bitis, hesaplar[], olusturma }
//   lisans-abone:<sub_id>     → anahtar   (webhook'ların kaydı bulması için)
//   lisans-oturum:<cs_id>     → anahtar   (ödeme sonrası sayfanın anahtarı göstermesi için, 7 gün)
//
// Hiçbir fiyat, pozisyon ya da işlem verisi buraya gelmez. MT5 hesap numarası yalnız lisansı
// hesaba bağlamak için saklanır.

import { createHmac, randomBytes } from 'node:crypto';
import type { Depo } from './depo.ts';
import type { StripeIstek } from './stripe.ts';

export const URUNLER = ['motor', 'kopru']; // tek abonelik ikisini de kapsar
export const HESAP_SINIRI = Number(process.env.LISANS_HESAP_SINIRI ?? 2);
export const GECIKME_TOLERANSI_SN = 3 * 86400; // ödeme gecikirse (past_due) Stripe yeniden denerken 3 gün daha
const OTURUM_TTL_SN = 7 * 86400;

export interface Kayit {
  anahtar: string;
  eposta: string | null;
  musteri: string | null;
  abonelik: string;
  durum: string;   // Stripe abonelik durumu: active, trialing, past_due, canceled, unpaid, ...
  bitis: number;   // aboneliğin ödendiği son an (UTC, sn)
  hesaplar: number[];
  olusturma: number;
}

// ------------------------------------------------------------------ belirteç
export function belirtecImzala(sir: string, urun: string, hesap: number | string, bitis: number): string {
  const mesaj = `v1|${urun}|${hesap}|${bitis}`;
  return `${mesaj}|${createHmac('sha256', sir).update(mesaj).digest('hex')}`;
}

// Okunaklı anahtar: KLM-XXXXX-XXXXX-XXXXX-XXXXX (Crockford base32, karışan harfler yok; 100 bit).
const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function anahtarUret(): string {
  const b = randomBytes(20);
  let s = '';
  for (let i = 0; i < 20; i++) s += ABC[b[i] & 31];
  return `KLM-${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}-${s.slice(15, 20)}`;
}
export const ANAHTAR_RE = /^KLM(-[0-9A-HJKMNP-TV-Z]{5}){4}$/;

// ------------------------------------------------------------------ Stripe aboneliği → kayıt
// Stripe 2025-03 (basil) sürümünden beri dönem sonu abonelik kalemlerinde; eski sürümde üstte.
export function donemSonu(sub: any): number {
  const v = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end;
  return Number.isInteger(v) ? v : 0;
}

export function bitisHesapla(sub: any): number {
  const son = donemSonu(sub);
  if (sub?.status === 'active' || sub?.status === 'trialing') return son;
  if (sub?.status === 'past_due') return son + GECIKME_TOLERANSI_SN;
  // canceled, unpaid, incomplete_expired...: bittiği an (yoksa dönem sonu)
  return Math.min(son || Infinity, sub?.ended_at ?? sub?.canceled_at ?? son) || 0;
}

const oku = async (d: Depo, anahtar: string): Promise<Kayit | null> => {
  const v = await d.oku(`lisans:${anahtar}`);
  return v ? JSON.parse(v) : null;
};
const yaz = (d: Depo, k: Kayit) => d.yaz(`lisans:${k.anahtar}`, JSON.stringify(k));

// Ödeme tamamlanınca kayıt açar; aynı abonelik için ikinci kez çağrılırsa mevcut anahtarı döner
// (webhook ve ödeme sonrası sayfa yarışabilir, Stripe olayları da tekrar gönderebilir).
export async function aboneligiKaydet(d: Depo, sub: any, eposta: string | null, oturum: string | null, simdi = Date.now()): Promise<Kayit> {
  const aday = anahtarUret();
  const kazandi = await d.yazYoksa(`lisans-abone:${sub.id}`, aday);
  const anahtar = kazandi ? aday : (await d.oku(`lisans-abone:${sub.id}`))!;
  const eski = await oku(d, anahtar);
  const k: Kayit = {
    anahtar,
    eposta: eposta ?? eski?.eposta ?? null,
    musteri: (typeof sub.customer === 'string' ? sub.customer : sub.customer?.id) ?? eski?.musteri ?? null,
    abonelik: sub.id,
    durum: sub.status,
    bitis: bitisHesapla(sub),
    hesaplar: eski?.hesaplar ?? [],
    olusturma: eski?.olusturma ?? Math.floor(simdi / 1000),
  };
  await yaz(d, k);
  if (oturum) await d.yaz(`lisans-oturum:${oturum}`, anahtar, OTURUM_TTL_SN);
  return k;
}

// Yenileme, iptal, ödeme gecikmesi: kayıt varsa günceller. Yoksa (checkout olayı henüz
// gelmediyse) hiçbir şey yapmaz; checkout olayı kaydı güncel abonelikle zaten açar.
export async function aboneligiGuncelle(d: Depo, sub: any): Promise<Kayit | null> {
  const anahtar = await d.oku(`lisans-abone:${sub.id}`);
  if (!anahtar) return null;
  const k = await oku(d, anahtar);
  if (!k) return null;
  k.durum = sub.status;
  k.bitis = bitisHesapla(sub);
  await yaz(d, k);
  return k;
}

// ------------------------------------------------------------------ webhook olayları
export const ILGILI_OLAYLAR = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
];

export async function olayIsle(d: Depo, olay: any, stripe: StripeIstek): Promise<string> {
  const o = olay?.data?.object ?? {};
  switch (olay?.type) {
    case 'checkout.session.completed': {
      if (o.mode !== 'subscription' || !o.subscription) return 'abonelik değil';
      const sub = await stripe(`subscriptions/${typeof o.subscription === 'string' ? o.subscription : o.subscription.id}`);
      await aboneligiKaydet(d, sub, o.customer_details?.email ?? o.customer_email ?? null, o.id);
      return 'kaydedildi';
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return (await aboneligiGuncelle(d, o)) ? 'güncellendi' : 'kayıt yok';
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const id = o.subscription ?? o.parent?.subscription_details?.subscription;
      if (!id) return 'abonelik yok';
      const sub = await stripe(`subscriptions/${typeof id === 'string' ? id : id.id}`);
      return (await aboneligiGuncelle(d, sub)) ? 'güncellendi' : 'kayıt yok';
    }
  }
  return 'yok sayıldı';
}

// ------------------------------------------------------------------ ödeme sonrası sayfa
// Webhook gecikmişse oturumu Stripe'tan doğrulayıp kaydı burada açar.
export async function oturumCoz(d: Depo, oturum: string, stripe: StripeIstek): Promise<Kayit | null> {
  const var_ = await d.oku(`lisans-oturum:${oturum}`);
  if (var_) return oku(d, var_);
  const s = await stripe(`checkout/sessions/${encodeURIComponent(oturum)}`);
  if (s?.mode !== 'subscription' || s?.status !== 'complete' || !s?.subscription) return null;
  if (s.payment_status !== 'paid' && s.payment_status !== 'no_payment_required') return null;
  const sub = await stripe(`subscriptions/${typeof s.subscription === 'string' ? s.subscription : s.subscription.id}`);
  return aboneligiKaydet(d, sub, s.customer_details?.email ?? null, s.id);
}

// Sayfada gösterilecek kısım: müşteri ve abonelik kimlikleri gösterilmez.
export function kayitGorunumu(k: Kayit) {
  const e = k.eposta ?? '';
  const maske = e.includes('@') ? `${e[0]}***@${e.split('@')[1]}` : null;
  return { anahtar: k.anahtar, durum: k.durum, bitis: k.bitis, hesaplar: k.hesaplar, hesapSiniri: HESAP_SINIRI, eposta: maske };
}

// ------------------------------------------------------------------ MT5 lisans ucu
export type LisansSonuc = { durum: number; govde: string };

export async function lisansIsle(d: Depo, sir: string, anahtar: string, hesapMetni: string, urun: string, simdi = Date.now()): Promise<LisansSonuc> {
  if (!URUNLER.includes(urun)) return { durum: 400, govde: 'Bilinmeyen ürün.' };
  if (!/^\d{1,20}$/.test(hesapMetni)) return { durum: 400, govde: 'Hesap numarası okunamadı.' };
  const a = anahtar.trim().toUpperCase();
  if (!ANAHTAR_RE.test(a)) return { durum: 400, govde: 'Lisans anahtarı hatalı. kalibremarkets.com/hesap sayfasından kopyalayın.' };
  // Anahtar denemesine karşı: hesap numarası başına dakikada 20 istek.
  const dk = Math.floor(simdi / 60000);
  if ((await d.say(`lisans-sinir:${hesapMetni}:${dk}`, 120)) > 20) return { durum: 429, govde: 'Çok sık deneme. Bir dakika sonra yeniden deneyin.' };
  const k = await oku(d, a);
  if (!k) return { durum: 404, govde: 'Lisans anahtarı bulunamadı.' };
  const hesap = Number(hesapMetni);
  if (!k.hesaplar.includes(hesap)) {
    if (k.hesaplar.length >= HESAP_SINIRI) {
      return { durum: 403, govde: `Bu anahtar en çok ${HESAP_SINIRI} MT5 hesabında kullanılabilir. Değiştirmek için bize yazın.` };
    }
    k.hesaplar.push(hesap);
    await yaz(d, k);
  }
  // Süresi dolmuş abonelik de 200 ve geçmiş bir bitişle döner; EA "süresi doldu" der.
  return { durum: 200, govde: belirtecImzala(sir, urun, hesap, k.bitis) };
}
