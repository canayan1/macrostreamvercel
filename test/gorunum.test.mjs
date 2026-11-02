import { test } from 'node:test';
import assert from 'node:assert/strict';
import { semaTemizle, soruTemizle, gorunumIstemi, gorunumCevabi } from '../api/_lib/gorunum.ts';

const sema = { boyutlar: [{ id: 'parite', ad: 'Currency pair' }, { id: 'karsiTaraf', ad: 'Counterparty' }], olculer: [{ id: 'toplam', ad: 'Total P&L (USD)', tur: 'para' }, { id: 'adet', ad: 'Legs', tur: 'sayi' }] };

test('schema from the browser: bad ids and long names dropped, empty lists rejected', () => {
  const t = semaTemizle({ boyutlar: [{ id: 'parite', ad: ' Currency "pair" \u0001' }, { id: 'drop table', ad: 'x' }, { id: 'ok', ad: 'y'.repeat(200) }], olculer: [{ id: 'toplam', ad: 'Total', tur: 'para' }, { id: 'adet', ad: 'Legs', tur: 'weird' }] });
  assert.deepEqual(t.boyutlar.map(b => b.id), ['parite', 'ok']);
  assert.equal(t.boyutlar[0].ad, 'Currency  pair');
  assert.equal(t.boyutlar[1].ad.length, 60);
  assert.deepEqual(t.olculer, [{ id: 'toplam', ad: 'Total', tur: 'para' }, { id: 'adet', ad: 'Legs' }]);
  assert.equal(semaTemizle({ boyutlar: [], olculer: [{ id: 'a', ad: 'b' }] }), null);
  assert.equal(semaTemizle('x'), null);
  assert.equal(soruTemizle('  top\u0000 5\n\n pairs ' + 'x'.repeat(300)).length, 200);
});

test('prompt carries names and ids only, asks for JSON only', () => {
  const { system, user } = gorunumIstemi(sema, 'top 5 counterparties');
  assert.ok(system.includes('karsiTaraf = "Counterparty"'));
  assert.ok(system.includes('toplam = "Total P&L (USD)" (para)'));
  assert.ok(system.includes('ONLY a JSON object'));
  assert.equal(user, 'top 5 counterparties');
});

test('model answer: fenced JSON with prose is read; unknown ids rejected; limits applied', () => {
  assert.deepEqual(gorunumCevabi('Sure:\n```json\n{"boyut":"karsiTaraf","olcu":"toplam","tur":"bar","ilkN":5}\n```', sema), { tarif: { boyut: 'karsiTaraf', olcu: 'toplam', tur: 'cubuk', sirala: 'azalan', ilkN: 5 } });
  assert.deepEqual(gorunumCevabi('{"boyut":"trader","olcu":"toplam"}', sema), { hata: 'boyut' });
  assert.deepEqual(gorunumCevabi('{"boyut":"parite","olcu":"net"}', sema), { hata: 'olcu' });
  assert.deepEqual(gorunumCevabi('no json here', sema), { hata: 'json' });
  assert.deepEqual(gorunumCevabi('[1,2]', sema), { hata: 'json' });
  const r = gorunumCevabi('{"boyut":"parite","olcu":"adet","tur":"tablo","ilkN":999,"filtre":" EUR/USD  "}', sema);
  assert.deepEqual(r, { tarif: { boyut: 'parite', olcu: 'adet', tur: 'tablo', sirala: 'azalan', ilkN: 50, filtre: 'EUR/USD' } });
});
