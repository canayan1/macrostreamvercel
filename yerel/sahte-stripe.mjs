// Yerel deneme için sahte Stripe API'si: Checkout oturumu açar, "ödenmiş" sayar ve
// webhook olayını imzalayıp yerel siteye gönderir. Gerçek Stripe'a hiçbir şey gitmez.
//
// Kullanım: STRIPE_WEBHOOK_SECRET=whsec_yerel node yerel/sahte-stripe.mjs [port] [site]
//   varsayılan: 8799, http://127.0.0.1:8788

import http from 'node:http';
import { createHmac } from 'node:crypto';

const port = Number(process.argv[2] ?? 8799);
const SITE = process.argv[3] ?? 'http://127.0.0.1:8788';
const SIR = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_yerel';
const simdi = () => Math.floor(Date.now() / 1000);
const oturumlar = new Map(), abonelikler = new Map();
let sayac = 0;

async function webhook(type, object) {
  const govde = JSON.stringify({ id: `evt_${++sayac}`, type, data: { object } });
  const t = simdi();
  const imza = createHmac('sha256', SIR).update(`${t}.${govde}`).digest('hex');
  const r = await fetch(`${SITE}/api/odeme/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${t},v1=${imza}` }, body: govde });
  console.log(`webhook ${type} → ${r.status}`);
}

http.createServer(async (req, res) => {
  const parca = [];
  for await (const p of req) parca.push(p);
  const form = new URLSearchParams(Buffer.concat(parca).toString());
  const yol = new URL(req.url, 'http://x').pathname.replace(/^\/+/, '');
  const yanit = (k, o) => { res.writeHead(k, { 'Content-Type': 'application/json' }).end(JSON.stringify(o)); };
  console.log(req.method, yol);
  if (!/^Bearer sk_test_/.test(req.headers.authorization ?? '')) return yanit(401, { error: { message: 'test anahtarı yok' } });

  if (req.method === 'POST' && yol === 'checkout/sessions') {
    const id = `cs_test_${(++sayac).toString().padStart(12, '0')}`;
    const subId = `sub_${sayac}`;
    abonelikler.set(subId, { id: subId, customer: `cus_${sayac}`, status: 'active', items: { data: [{ current_period_end: simdi() + 30 * 86400 }] } });
    const s = { id, mode: form.get('mode'), status: 'complete', payment_status: 'paid', subscription: subId, customer: `cus_${sayac}`, customer_details: { email: 'deneme@ornek.com' } };
    oturumlar.set(id, s);
    // Gerçek Stripe kullanıcıyı ödeme sayfasına götürür; burada doğrudan "ödendi" dönüşüne.
    s.url = form.get('success_url').replace('{CHECKOUT_SESSION_ID}', id);
    // Webhook, sayfadan biraz sonra gelsin (yarış durumunu da sınar).
    setTimeout(() => webhook('checkout.session.completed', s), 3000);
    return yanit(200, s);
  }
  let m;
  if (req.method === 'GET' && (m = yol.match(/^checkout\/sessions\/(.+)$/))) return oturumlar.has(m[1]) ? yanit(200, oturumlar.get(m[1])) : yanit(404, { error: { message: 'yok' } });
  if (req.method === 'GET' && (m = yol.match(/^subscriptions\/(.+)$/))) return abonelikler.has(m[1]) ? yanit(200, abonelikler.get(m[1])) : yanit(404, { error: { message: 'yok' } });
  if (req.method === 'POST' && yol === 'billing_portal/sessions') return yanit(200, { url: `${SITE}/hesap/?portal=sahte&musteri=${form.get('customer')}` });
  if (req.method === 'POST' && (m = yol.match(/^yerel\/iptal\/(.+)$/))) {
    const s = abonelikler.get(m[1]);
    Object.assign(s, { status: 'canceled', ended_at: simdi() });
    await webhook('customer.subscription.deleted', s);
    return yanit(200, s);
  }
  yanit(404, { error: { message: `sahte stripe: ${req.method} ${yol} yok` } });
}).listen(port, '127.0.0.1', () => console.log(`sahte stripe: http://127.0.0.1:${port}`));
