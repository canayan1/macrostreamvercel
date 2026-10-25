import { test } from 'node:test';
import assert from 'node:assert/strict';

// Ödeme başlatma ucu: şartlar ve cayma onayı olmadan Stripe'a gidilmez; onay metadata'ya yazılır.
process.env.STRIPE_SECRET_KEY = 'sk_test_sahte';
process.env.STRIPE_PRICE_ID = 'price_sahte';
delete process.env.STRIPE_API_KOK;
process.env.SUPABASE_URL = 'https://ornek.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-sahte';
const UID = '11111111-2222-4333-8444-555555555555';
const BELIRTEC = 'gecerli-belirtec-0123456789abcdef';
const { default: handler, SARTLAR_SURUMU } = await import('../api/odeme/baslat.ts');

function cagir(body, query = {}, yetki = `Bearer ${BELIRTEC}`) {
  return new Promise(resolve => {
    const res = {
      statusCode: 200, govde: undefined, bas: {},
      setHeader(k, v) { this.bas[k.toLowerCase()] = v; },
      status(c) { this.statusCode = c; return this; },
      json(o) { this.govde = o; resolve(this); return this; },
      send(s) { this.govde = s; resolve(this); return this; },
    };
    handler({ method: 'POST', query, body, headers: { host: 'kalibremarkets.com', ...(yetki ? { authorization: yetki } : {}) } }, res);
  });
}

const gonderilen = [];
const eskiFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => {
  if (String(url).endsWith('/auth/v1/user')) {
    const ok = o?.headers?.Authorization === `Bearer ${BELIRTEC}` && o?.headers?.apikey === 'anon-sahte';
    return new Response(JSON.stringify(ok ? { id: UID, email: 'deneme@ornek.com', user_metadata: {} } : { msg: 'invalid' }), { status: ok ? 200 : 401 });
  }
  gonderilen.push({ url: String(url), govde: decodeURIComponent(String(o?.body ?? '')) });
  return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }), { status: 200 });
};
test.after(() => { globalThis.fetch = eskiFetch; });

test('cayma onayı yoksa 400 ve Stripe çağrılmaz (TR ve EN mesaj)', async () => {
  gonderilen.length = 0;
  let r = await cagir({ sartlar: true, dil: 'tr' });
  assert.equal(r.statusCode, 400);
  assert.match(r.govde.hata, /cayma hakkına ilişkin onay/);
  r = await cagir({ sartlar: true, cayma_onay: 'true', dil: 'en' });
  assert.equal(r.statusCode, 400, 'yalnız gerçek true kabul edilir');
  assert.equal(r.govde.hata, 'To continue, please tick the box about the right of withdrawal.');
  r = await cagir({ cayma_onay: true });
  assert.equal(r.statusCode, 400, 'şartlar onayı da gerekir');
  assert.equal(gonderilen.length, 0);
});

test('iki onayla Checkout açılır; onay ve şart sürümü oturum ve abonelik metadata\'sında', async () => {
  gonderilen.length = 0;
  const r = await cagir(JSON.stringify({ sartlar: true, cayma_onay: true, dil: 'tr' }));
  assert.equal(r.statusCode, 200);
  assert.equal(r.govde.url, 'https://checkout.stripe.com/c/pay/cs_test_1');
  assert.equal(gonderilen.length, 1);
  const g = gonderilen[0].govde;
  assert.match(gonderilen[0].url, /checkout\/sessions$/);
  assert.ok(g.includes('metadata[cayma_onay]=evet'));
  assert.ok(g.includes('subscription_data[metadata][cayma_onay]=evet'));
  assert.ok(g.includes(`metadata[sartlar_onay]=${SARTLAR_SURUMU}`));
  assert.match(g, /metadata\[cayma_onay_zamani\]=\d{4}-\d{2}-\d{2}T/);
  assert.ok(g.includes('success_url=https://kalibremarkets.com/tr/account?oturum='));
});

test('giriş yoksa ya da belirteç geçersizse 401 ve Stripe çağrılmaz', async () => {
  gonderilen.length = 0;
  let r = await cagir({ sartlar: true, cayma_onay: true, dil: 'tr' }, {}, null);
  assert.equal(r.statusCode, 401);
  assert.match(r.govde.hata, /önce giriş yap/);
  r = await cagir({ sartlar: true, cayma_onay: true, dil: 'en' }, {}, 'Bearer sahte-belirtec-xxxxxxxxxxxxxxxx');
  assert.equal(r.statusCode, 401);
  assert.equal(r.govde.hata, 'Please sign in to subscribe.');
  assert.equal(gonderilen.length, 0);
});

test('oturum hesaba bağlanır: client_reference_id, e-posta ve metadata kullanici', async () => {
  gonderilen.length = 0;
  const r = await cagir({ sartlar: true, cayma_onay: true });
  assert.equal(r.statusCode, 200);
  const g = gonderilen[0].govde;
  assert.ok(g.includes(`client_reference_id=${UID}`));
  assert.ok(g.includes('customer_email=deneme@ornek.com'));
  assert.ok(g.includes(`subscription_data[metadata][kullanici]=${UID}`));
});

test('Supabase yapılandırılmamışsa 503', async () => {
  const eski = process.env.SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  const r = await cagir({ sartlar: true, cayma_onay: true });
  process.env.SUPABASE_URL = eski;
  assert.equal(r.statusCode, 503);
});
