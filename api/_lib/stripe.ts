// Stripe REST istemcisi ve webhook imza doğrulaması. SDK yerine fetch: bağımlılık ve paket
// boyutu eklemez, kullandığımız uçlar az.
//
// Ortam değişkenleri (Vercel'de proje sahibi girer, kodda ya da repoda tutulmaz):
//   STRIPE_SECRET_KEY       sk_test_... / sk_live_...
//   STRIPE_WEBHOOK_SECRET   whsec_...
//   STRIPE_PRICE_ID         price_... (aylık abonelik fiyatı)

import { createHmac, timingSafeEqual } from 'node:crypto';

export const IMZA_TOLERANS_SN = 300;

// Stripe-Signature: "t=<unix>,v1=<hex>[,v1=<hex>...]". İmza = HMAC-SHA256(sır, "<t>.<ham gövde>").
export function imzaDogrula(hamGovde: string, baslik: string | undefined, sir: string, simdiSn = Math.floor(Date.now() / 1000)): boolean {
  if (!baslik || !sir) return false;
  let t = NaN;
  const imzalar: string[] = [];
  for (const parca of baslik.split(',')) {
    const [k, v] = parca.split('=', 2).map(s => s?.trim());
    if (k === 't') t = Number(v);
    else if (k === 'v1' && v) imzalar.push(v);
  }
  if (!Number.isInteger(t) || !imzalar.length) return false;
  if (Math.abs(simdiSn - t) > IMZA_TOLERANS_SN) return false;
  const beklenen = Buffer.from(createHmac('sha256', sir).update(`${t}.${hamGovde}`).digest('hex'));
  return imzalar.some(i => {
    const b = Buffer.from(i);
    return b.length === beklenen.length && timingSafeEqual(b, beklenen);
  });
}

// Stripe form kodlaması: iç içe nesneler a[b][c]=d, diziler a[0][b]=c.
export function formKodla(o: Record<string, unknown>, onek = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    const ad = onek ? `${onek}[${k}]` : k;
    if (typeof v === 'object') out.push(...formKodla(v as Record<string, unknown>, ad));
    else out.push(`${encodeURIComponent(ad)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

export type StripeIstek = (yol: string, govde?: Record<string, unknown>) => Promise<any>;

export function stripeIstemci(anahtar = process.env.STRIPE_SECRET_KEY ?? ''): StripeIstek | null {
  if (!anahtar) return null;
  return async (yol, govde) => {
    // STRIPE_API_KOK yalnız yerel denemede (sahte Stripe sunucusu) kullanılır; canlıda yok sayılır.
    const kok = process.env.VERCEL !== '1' && process.env.STRIPE_API_KOK ? process.env.STRIPE_API_KOK : 'https://api.stripe.com/v1';
    const r = await fetch(`${kok}/${yol}`, {
      method: govde ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${anahtar}`,
        ...(govde ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: govde ? formKodla(govde).join('&') : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`stripe ${r.status}: ${j?.error?.message ?? 'bilinmeyen hata'}`);
    return j;
  };
}

// Ödeme sonrası dönüş adresinin kökü. Host başlığından gelir ama yalnız bilinen alanlara izin
// verilir: aksi halde sahte bir Host başlığıyla Stripe'ın kullanıcıyı başka siteye döndürmesi sağlanabilirdi.
export function kokAdres(host: string | string[] | undefined): string {
  const h = String(Array.isArray(host) ? host[0] : host ?? '').toLowerCase();
  if (h === 'kalibremarkets.com' || h === 'www.kalibremarkets.com' || /^[a-z0-9-]+\.vercel\.app$/.test(h)) return `https://${h}`;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h)) return `http://${h}`;
  return 'https://kalibremarkets.com';
}
