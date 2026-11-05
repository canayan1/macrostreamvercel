import { test } from 'node:test';
import assert from 'node:assert/strict';

// Abonelik portalı: anahtarı bilmek yetmez; giriş şart ve anahtar o hesaba bağlı olmalı.
process.env.STRIPE_SECRET_KEY = 'sk_test_sahte';
delete process.env.STRIPE_API_KOK;
process.env.SUPABASE_URL = 'https://ornek.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-sahte';
process.env.KOPRU_BELLEK = '1';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.KV_REST_API_URL;
const SAHIP = '11111111-2222-4333-8444-555555555555';
const BASKA = '99999999-2222-4333-8444-555555555555';
const BELIRTEC = { 'sahip-belirtec-0123456789abcdef': SAHIP, 'baska-belirtec-0123456789abcdef': BASKA };
const ANAHTAR = 'KLM-ABCDE-FGHJK-MNPQR-STVWX';

const { depoSec } = await import('../api/_lib/depo.ts');
const { default: handler } = await import('../api/odeme/portal.ts');
await depoSec().yaz(`lisans:${ANAHTAR}`, JSON.stringify({ anahtar: ANAHTAR, musteri: 'cus_1', kullanici: SAHIP }));

const stripeCagrilari = [];
const eskiFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => {
  if (String(url).endsWith('/auth/v1/user')) {
    const t = String(o?.headers?.Authorization ?? '').replace('Bearer ', '');
    const id = BELIRTEC[t];
    return new Response(JSON.stringify(id ? { id, email: 'a@ornek.com', user_metadata: {} } : { msg: 'invalid' }), { status: id ? 200 : 401 });
  }
  stripeCagrilari.push(String(url));
  return new Response(JSON.stringify({ url: 'https://billing.stripe.com/p/session/test_1' }), { status: 200 });
};
test.after(() => { globalThis.fetch = eskiFetch; });

function cagir(body, belirtec, ip = '203.0.113.1') {
  return new Promise(resolve => {
    const res = {
      statusCode: 200, govde: undefined, bas: {},
      setHeader(k, v) { this.bas[k.toLowerCase()] = v; },
      status(c) { this.statusCode = c; return this; },
      json(o) { this.govde = o; resolve(this); return this; },
      send(b) { this.govde = b; resolve(this); return this; },
    };
    const headers = { host: 'kalibremarkets.com', 'x-real-ip': ip, ...(belirtec ? { authorization: `Bearer ${belirtec}` } : {}) };
    handler({ method: 'POST', query: {}, body, headers }, res);
  });
}

test('giriş yoksa 401 ve Stripe çağrılmaz', async () => {
  stripeCagrilari.length = 0;
  const r = await cagir({ anahtar: ANAHTAR }, null);
  assert.equal(r.statusCode, 401);
  assert.equal(stripeCagrilari.length, 0);
});

test('anahtar başka hesaba bağlıysa 404 ve Stripe çağrılmaz', async () => {
  stripeCagrilari.length = 0;
  const r = await cagir({ anahtar: ANAHTAR }, 'baska-belirtec-0123456789abcdef');
  assert.equal(r.statusCode, 404);
  assert.equal(stripeCagrilari.length, 0);
});

test('sahibi giriş yapmışsa portal adresi döner', async () => {
  stripeCagrilari.length = 0;
  const r = await cagir({ anahtar: ANAHTAR }, 'sahip-belirtec-0123456789abcdef');
  assert.equal(r.statusCode, 200);
  assert.match(r.govde.url, /^https:\/\/billing\.stripe\.com\//);
  assert.equal(stripeCagrilari.length, 1);
});

test('IP başına saatte 20 denemeden sonra 429', async () => {
  let son;
  for (let i = 0; i < 21; i++) son = await cagir({ anahtar: ANAHTAR }, null, '198.51.100.7');
  assert.equal(son.statusCode, 429);
});
