// Abonelik kaydı ve MT5 lisans belirteci. Protokol: kalibre-lab/docs/lisans.md (v1).
//
// Kayıtlar (depo anahtarları):
//   lisans:<anahtar>          { anahtar, eposta, musteri, abonelik, durum, bitis, hesaplar[], olusturma, urunler? }
//   lisans-abone:<sub_id>     → anahtar   (webhook'ların kaydı bulması için)
//   lisans-oturum:<cs_id>     → anahtar   (ödeme sonrası sayfanın anahtarı göstermesi için, 7 gün)
//   lisans-kullanici:<uuid>   → [anahtar] (Supabase hesabının lisansları; api/_lib/hesap.ts)
//
// Hiçbir fiyat, pozisyon ya da işlem verisi buraya gelmez. MT5 hesap numarası yalnız lisansı
// hesaba bağlamak için saklanır.

import { createHmac, randomBytes } from 'node:crypto';
import type { Depo } from './depo.ts';
import type { StripeIstek } from './stripe.ts';
import { kullaniciyaEkle, lisansAyna } from './hesap.ts';
import { uuidMi } from './supabase.ts';

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
  urunler?: string[]; // yoksa tüm ürünler; kupon metadata'sı urunler=kopru ise yalnız ['kopru']
  urun?: string;      // hangi Kalibre Markets ürünü; yoksa 'lab' (Kalibre Lab). urunler bu ürünün eklentileridir.
  kullanici?: string; // Supabase kullanıcı kimliği (Checkout client_reference_id ya da elle bağlama)
}

// Lisansın kapsadığı ürünler. Alan yoksa abonelik bütün ürünleri kapsar.
export const urunKapsar = (k: { urunler?: unknown }, urun: string) => !Array.isArray(k.urunler) || k.urunler.includes(urun);

// Kupon kapsamı: Stripe kuponunun metadata'sında `urunler` (virgüllü liste, ör. "kopru") varsa
// lisans yalnız o ürünleri kapsar. İlk testçilerin %100 indirimli kuponu böyle Köprü'yle sınırlanır.
// Metadata var ama tanınan ürün yoksa liste boş döner (lisans hiçbir eklentiyi açmaz; kapalı hata).
// Kısıt yalnız kupon etkinken geçerlidir: abonelik kuponsuz geldiğinde (indirim bitti) kayıttaki
// liste kaldırılır ve lisans tam ürünü kapsar (docs/CANLIYA-CIKIS.md, "Kupon kapsamı").
// İndirimler açılmamış kimlik olarak gelirse ya da kupon okunamazsa durum "kesin değil" sayılır ve kapsam değişmez.
const ADLAR: Record<string, string> = { kopru: 'kopru', 'köprü': 'kopru', bridge: 'kopru', motor: 'motor', engine: 'motor' };
function urunListesi(m: unknown): string[] | null {
  if (typeof m !== 'string' || !m.trim()) return null;
  const l = m.split(',').map(x => ADLAR[x.trim().toLocaleLowerCase('tr')]).filter((x): x is string => !!x);
  return [...new Set(l)];
}
export async function kuponKapsami(sub: any, stripe?: StripeIstek): Promise<{ urunler: string[] | null; kesin: boolean }> {
  const indirimler: any[] = [];
  let kesin = true;
  if (typeof sub?.discount === 'string') kesin = false;
  else if (sub?.discount && typeof sub.discount === 'object') indirimler.push(sub.discount); // eski API sürümleri
  for (const x of Array.isArray(sub?.discounts) ? sub.discounts : []) {
    if (x && typeof x === 'object') indirimler.push(x); else kesin = false; // açılmamış indirim kimliği
  }
  for (const x of indirimler) {
    let kupon = x.coupon ?? x.source?.coupon;
    if (typeof kupon === 'string') kupon = stripe ? await stripe(`coupons/${encodeURIComponent(kupon)}`).catch(() => null) : null;
    if (!kupon || typeof kupon !== 'object') { kesin = false; continue; }
    const l = urunListesi(kupon.metadata?.urunler);
    if (l) return { urunler: l, kesin: true };
  }
  return { urunler: null, kesin };
}
export async function kuponUrunleri(sub: any, stripe?: StripeIstek): Promise<string[] | null> {
  return (await kuponKapsami(sub, stripe)).urunler;
}
// Webhook olayındaki abonelik nesnesinde indirimler kimlik olarak gelir; kapsamı okumak için açılmış hâli çekilir.
const acilmamis = (sub: any) => typeof sub?.discount === 'string' || (Array.isArray(sub?.discounts) && sub.discounts.some((x: any) => typeof x === 'string'));
// Abonelik, indirimler açılmış (expand) olarak çekilir; kupon kapsamı buradan okunur.
const aboneYolu = (id: any) => `subscriptions/${encodeURIComponent(typeof id === 'string' ? id : id.id)}?expand[]=discounts`;

const KAPSAM_DISI = 'Bu lisans bu eklentiyi kapsamıyor. Davetli beta lisansı yalnız Kalibre Köprü\'yü kapsar; Kalibre Motor için tam abonelik gerekir.';

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
// Her yazımda hesap dizini ve Supabase'deki lisans görüntüsü de güncellenir (görüntü en iyi çabadır).
const yaz = async (d: Depo, k: Kayit) => {
  await d.yaz(`lisans:${k.anahtar}`, JSON.stringify(k));
  if (k.kullanici) { await kullaniciyaEkle(d, k.kullanici, k.anahtar); await lisansAyna(k); }
};

// Checkout oturumunun hangi hesaba ait olduğu: client_reference_id (api/odeme/baslat.ts doğrulanmış
// kullanıcıdan yazar), yoksa abonelik metadata'sı.
export function oturumKullanicisi(oturum: any, sub?: any): string | null {
  for (const v of [oturum?.client_reference_id, oturum?.metadata?.kullanici, sub?.metadata?.kullanici]) if (uuidMi(v)) return v;
  return null;
}

// Ödeme tamamlanınca kayıt açar; aynı abonelik için ikinci kez çağrılırsa mevcut anahtarı döner
// (webhook ve ödeme sonrası sayfa yarışabilir, Stripe olayları da tekrar gönderebilir).
export async function aboneligiKaydet(d: Depo, sub: any, eposta: string | null, oturum: string | null, simdi = Date.now(), urunler?: string[] | null, kullanici?: string | null): Promise<Kayit> {
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
  const kapsam = urunler ?? eski?.urunler;
  if (kapsam) k.urunler = kapsam;
  const sahip = eski?.kullanici ?? (uuidMi(kullanici) ? kullanici : null);
  if (sahip) k.kullanici = sahip;
  await yaz(d, k);
  if (oturum) await d.yaz(`lisans-oturum:${oturum}`, anahtar, OTURUM_TTL_SN);
  return k;
}

// Yenileme, iptal, ödeme gecikmesi: kayıt varsa günceller. Yoksa (checkout olayı henüz
// gelmediyse) hiçbir şey yapmaz; checkout olayı kaydı güncel abonelikle zaten açar.
export async function aboneligiGuncelle(d: Depo, sub: any, urunler?: string[] | null, kuponsuzKesin = false): Promise<Kayit | null> {
  const anahtar = await d.oku(`lisans-abone:${sub.id}`);
  if (!anahtar) return null;
  const k = await oku(d, anahtar);
  if (!k) return null;
  k.durum = sub.status;
  k.bitis = bitisHesapla(sub);
  if (urunler) k.urunler = urunler;
  else if (kuponsuzKesin) delete k.urunler; // kupon bitti: kısıt kalkar, tam ürün
  // Kuponsuz olduğu kesin değilse (açılmamış indirim, okunamayan kupon) mevcut kapsam korunur.
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
      const sub = await stripe(aboneYolu(o.subscription));
      await aboneligiKaydet(d, sub, o.customer_details?.email ?? o.customer_email ?? null, o.id, Date.now(), await kuponUrunleri(sub, stripe), oturumKullanicisi(o, sub));
      return 'kaydedildi';
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = acilmamis(o) && o.id ? ((await stripe(aboneYolu(o.id)).catch(() => null)) ?? o) : o;
      const kk = await kuponKapsami(sub, stripe);
      return (await aboneligiGuncelle(d, sub, kk.urunler, kk.kesin)) ? 'güncellendi' : 'kayıt yok';
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const id = o.subscription ?? o.parent?.subscription_details?.subscription;
      if (!id) return 'abonelik yok';
      const sub = await stripe(aboneYolu(id));
      const kk = await kuponKapsami(sub, stripe);
      return (await aboneligiGuncelle(d, sub, kk.urunler, kk.kesin)) ? 'güncellendi' : 'kayıt yok';
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
  const sub = await stripe(aboneYolu(s.subscription));
  return aboneligiKaydet(d, sub, s.customer_details?.email ?? null, s.id, Date.now(), await kuponUrunleri(sub, stripe), oturumKullanicisi(s, sub));
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
  if (!ANAHTAR_RE.test(a)) return { durum: 400, govde: 'Lisans anahtarı hatalı. kalibremarkets.com/tr/account sayfasından kopyalayın.' };
  // Anahtar denemesine karşı: hesap numarası başına dakikada 20 istek.
  const dk = Math.floor(simdi / 60000);
  if ((await d.say(`lisans-sinir:${hesapMetni}:${dk}`, 120)) > 20) return { durum: 429, govde: 'Çok sık deneme. Bir dakika sonra yeniden deneyin.' };
  const k = await oku(d, a);
  if (!k) return { durum: 404, govde: 'Lisans anahtarı bulunamadı.' };
  if (!urunKapsar(k, urun)) return { durum: 403, govde: KAPSAM_DISI };
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

// ------------------------------------------------------------------ eklenti indirme
// .ex5 dosyaları lisans sırrıyla derlendiği için herkese açık klasöre konmaz; depoda
// `eklenti:<ad>` anahtarında { dosya, surum, sha256, b64 } olarak durur (yerel/eklenti-yukle.mjs).
export const EKLENTILER: Record<string, string> = { kopru: 'KalibreKopru.ex5', motor: 'KalibreMotor.ex5' };

export type IndirSonuc = { durum: number; hata?: string; dosya?: string; surum?: string; sha256?: string; veri?: Buffer };

export async function eklentiIndir(d: Depo, anahtarMetni: string, ad: string, simdi = Date.now()): Promise<IndirSonuc> {
  if (!(ad in EKLENTILER)) return { durum: 400, hata: 'Bilinmeyen eklenti.' };
  const a = anahtarMetni.trim().toUpperCase();
  if (!ANAHTAR_RE.test(a)) return { durum: 400, hata: 'Lisans anahtarı hatalı.' };
  if ((await d.say(`indir-sinir:${a}:${Math.floor(simdi / 60000)}`, 120)) > 10) return { durum: 429, hata: 'Çok sık deneme. Bir dakika sonra yeniden dene.' };
  const k = await oku(d, a);
  if (!k) return { durum: 404, hata: 'Lisans anahtarı bulunamadı.' };
  if (!urunKapsar(k, ad)) return { durum: 403, hata: KAPSAM_DISI };
  if (k.bitis * 1000 <= simdi) return { durum: 403, hata: 'Aboneliğin sona ermiş. Eklentileri indirmek için aboneliğini yenile.' };
  const v = await d.oku(`eklenti:${ad}`);
  if (!v) return { durum: 503, hata: 'Eklenti dosyası henüz yüklenmedi. Biraz sonra yeniden dene ya da bize yaz.' };
  const e = JSON.parse(v);
  return { durum: 200, dosya: EKLENTILER[ad], surum: e.surum, sha256: e.sha256, veri: Buffer.from(e.b64, 'base64') };
}
