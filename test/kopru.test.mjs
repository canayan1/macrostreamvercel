import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isle, zarfDenetle, bellekDepo, depoSec, SINIR } from '../api/kopru.ts';

const K = 'a'.repeat(32), Y = 'b'.repeat(16);
const zarf = (u = 4) => ({ v: 1, n: '0'.repeat(24), u, c: 'ab'.repeat(u), m: 'f'.repeat(64) });

test('geçerli zarf saklanır ve aynen okunur; fazla alanlar atılır', async () => {
  const d = bellekDepo();
  assert.equal((await isle('POST', K, Y, { ...zarf(), ekstra: 'sızma', ip: '1.2.3.4' }, d)).durum, 204);
  const r = await isle('GET', K, Y, null, d);
  assert.equal(r.durum, 200);
  assert.deepEqual(JSON.parse(r.ham), zarf());
});

test('olmayan yuva 404, hatalı kimlik 400, desteklenmeyen yöntem 405', async () => {
  const d = bellekDepo();
  assert.equal((await isle('GET', K, Y, null, d)).durum, 404);
  for (const [k, y] of [['A'.repeat(32), Y], [K, 'b'.repeat(15)], ['../x', Y], [K, '']]) {
    assert.equal((await isle('GET', k, y, null, d)).durum, 400, `${k} ${y}`);
  }
  assert.equal((await isle('DELETE', K, Y, null, d)).durum, 405);
});

test('zarf denetimi: biçim hataları reddedilir', () => {
  const bozuk = [null, [], 'metin', { ...zarf(), v: 2 }, { ...zarf(), n: 'xyz' }, { ...zarf(), u: -1 },
    { ...zarf(), u: 1.5 }, { ...zarf(), c: 'ab' }, { ...zarf(), c: 'zz'.repeat(4) }, { ...zarf(), m: 'f'.repeat(63) }];
  for (const z of bozuk) assert.ok(zarfDenetle(z).hata, JSON.stringify(z));
  assert.ok(zarfDenetle(zarf()).metin);
});

test('çok büyük zarf reddedilir', () => {
  const u = Math.ceil(SINIR.zarfKarakter / 2);
  assert.match(zarfDenetle({ ...zarf(0), u, c: 'a'.repeat(2 * u) }).hata, /çok büyük/);
});

test('kanal başına dakikalık yazma sınırı; başka kanal ve sonraki dakika etkilenmez', async () => {
  const d = bellekDepo(), t = 1_800_000_000_000;
  for (let i = 0; i < SINIR.yazmaDakika; i++) assert.equal((await isle('POST', K, Y, zarf(), d, t)).durum, 204);
  assert.equal((await isle('POST', K, Y, zarf(), d, t)).durum, 429);
  assert.equal((await isle('POST', 'c'.repeat(32), Y, zarf(), d, t)).durum, 204);
  assert.equal((await isle('POST', K, Y, zarf(), d, t + 60_000)).durum, 204);
});

test('depo yoksa canlıda belleğe düşülmez', () => {
  const eski = { ...process.env };
  for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) delete process.env[k];
  process.env.KOPRU_BELLEK = '1'; process.env.VERCEL = '1';
  assert.equal(depoSec(), null);
  delete process.env.VERCEL;
  assert.ok(depoSec());
  delete process.env.KOPRU_BELLEK;
  assert.equal(depoSec(), null);
  Object.assign(process.env, eski);
});

// Uç (handler) düzeyi: Vercel'in req/res arayüzünün küçük bir taklidi.
import handler from '../api/kopru.ts';
function cagir(method, query, body) {
  return new Promise(resolve => {
    const bas = {};
    const res = {
      statusCode: 200, govde: undefined,
      setHeader(k, v) { bas[k.toLowerCase()] = v; },
      status(c) { this.statusCode = c; return this; },
      json(o) { this.govde = o; resolve(this); return this; },
      send(s) { this.govde = s; resolve(this); return this; },
      end() { resolve(this); return this; },
      bas,
    };
    handler({ method, query, body }, res);
  });
}

test('uç: GET boş gövdeyle çalışır, POST metin gövdeyi ayrıştırır, OPTIONS CORS verir', async () => {
  process.env.KOPRU_BELLEK = '1';
  const q = { k: 'd'.repeat(32), y: 'e'.repeat(16) };
  for (const bosGovde of ['', undefined, {}]) assert.equal((await cagir('GET', q, bosGovde)).statusCode, 404);
  assert.equal((await cagir('POST', q, JSON.stringify(zarf()))).statusCode, 204);
  const g = await cagir('GET', q, '');
  assert.equal(g.statusCode, 200);
  assert.deepEqual(JSON.parse(g.govde), zarf());
  assert.equal(g.bas['access-control-allow-origin'], '*');
  assert.equal(g.bas['cache-control'], 'no-store');
  assert.equal((await cagir('POST', q, '{bozuk')).statusCode, 400);
  const o = await cagir('OPTIONS', q);
  assert.equal(o.statusCode, 204);
  assert.equal(o.bas['access-control-allow-methods'], 'GET');
});

test('Redis bilgisi: bilinen adlar ve Vercel önekli adlar bulunur; salt okuma jetonu seçilmez', async () => {
  const { redisBilgisi } = await import('../api/_lib/depo.ts');
  assert.deepEqual(redisBilgisi({ KV_REST_API_URL: 'u1', KV_REST_API_TOKEN: 't1' }), { url: 'u1', token: 't1' });
  assert.deepEqual(redisBilgisi({ UPSTASH_REDIS_REST_KV_REST_API_URL: 'u2', UPSTASH_REDIS_REST_KV_REST_API_TOKEN: 't2', UPSTASH_REDIS_REST_KV_REST_API_READ_ONLY_TOKEN: 'ro' }), { url: 'u2', token: 't2' });
  assert.deepEqual(redisBilgisi({ UPSTASH_REDIS_REST_URL: 'u3', UPSTASH_REDIS_REST_TOKEN: 't3', KV_REST_API_URL: 'x', KV_REST_API_TOKEN: 'y' }), { url: 'u3', token: 't3' });
  assert.equal(redisBilgisi({ FOO_KV_REST_API_URL: 'u' }), null, 'jeton yoksa yok');
  assert.equal(redisBilgisi({}), null);
});
