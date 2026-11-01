import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yaz, oku, zarfDenetle, SINIR } from '../api/rapor.ts';
import { bellekDepo } from '../api/_lib/depo.ts';

const zarf = (c = 'QUJD') => ({ v: 1, n: '0'.repeat(24), c });

test('a sealed report is stored under a fresh id and read back unchanged; extra fields are dropped', async () => {
  const d = bellekDepo();
  const r = await yaz(d, { ...zarf(), ip: '1.2.3.4', model: 'leak' }, '10.0.0.1');
  assert.equal(r.durum, 200);
  assert.match(r.govde.id, /^[0-9a-f]{24}$/);
  const g = await oku(d, r.govde.id);
  assert.equal(g.durum, 200);
  assert.deepEqual(JSON.parse(g.ham), zarf());
  assert.notEqual((await yaz(d, zarf(), '10.0.0.1')).govde.id, r.govde.id);
});

test('unknown or bad ids, bad envelopes', async () => {
  const d = bellekDepo();
  assert.equal((await oku(d, 'b'.repeat(24))).durum, 404);
  assert.equal((await oku(d, '../x')).durum, 400);
  for (const z of [null, [], { ...zarf(), v: 2 }, { ...zarf(), n: 'x' }, zarf(''), zarf('a b'), zarf('A'.repeat(SINIR.karakter + 4))]) assert.ok(zarfDenetle(z).hata, JSON.stringify(z).slice(0, 40));
});

test('hourly limit per address, other addresses unaffected', async () => {
  const d = bellekDepo(), t = 1_800_000_000_000;
  for (let i = 0; i < SINIR.saatlik; i++) assert.equal((await yaz(d, zarf(), '10.0.0.2', t)).durum, 200);
  assert.equal((await yaz(d, zarf(), '10.0.0.2', t)).durum, 429);
  assert.equal((await yaz(d, zarf(), '10.0.0.3', t)).durum, 200);
  assert.equal((await yaz(d, zarf(), '10.0.0.2', t + 3600_000)).durum, 200);
});
