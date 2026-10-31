import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { yaz, kayitlar, cevrimici, zarfDenetle, SINIR } from '../api/desk.ts';
import { bellekDepo } from '../api/_lib/depo.ts';
import { respOku } from '../api/_lib/abone.ts';

const M = 'c'.repeat(32), KISI = 'd'.repeat(16);
const zarf = (c = 'QUJD') => ({ v: 1, n: '0'.repeat(24), c });

test('yazılan olaylar sıra numarası ve röle saatiyle okunur; fazla alanlar atılır', async () => {
  const d = bellekDepo();
  assert.deepEqual((await yaz(d, M, { ...zarf(), ip: '1.2.3.4' }, 1000)).govde, { q: 1, ts: 1000 });
  await yaz(d, M, zarf('REVG'), 2000);
  const r = await kayitlar(d, M, 0);
  assert.equal(r.last, 2);
  assert.deepEqual(r.records.map(x => x.q), [1, 2]);
  assert.deepEqual(r.records[0].e, zarf());
  assert.deepEqual((await kayitlar(d, M, 1)).records.map(x => x.q), [2]);
});

test('zarf denetimi ve masa başına yazma sınırı', async () => {
  for (const z of [null, [], { ...zarf(), v: 2 }, { ...zarf(), n: 'x' }, zarf(''), zarf('a b'), zarf('A'.repeat(SINIR.zarfKarakter + 4))]) assert.ok(zarfDenetle(z).hata, JSON.stringify(z));
  const d = bellekDepo(), t = 1_800_000_000_000;
  for (let i = 0; i < SINIR.yazmaDakika; i++) assert.equal((await yaz(d, M, zarf(), t)).durum, 200);
  assert.equal((await yaz(d, M, zarf(), t)).durum, 429);
  assert.equal((await yaz(d, 'e'.repeat(32), zarf(), t)).durum, 200);
});

test('çevrimiçi: yalnız geçerli kişi kimlikleri ve son on dakika', async () => {
  const d = bellekDepo();
  await cevrimici(d, M, KISI, 0);
  await cevrimici(d, M, '../x', 0);
  assert.deepEqual(Object.keys((await cevrimici(d, M, 'e'.repeat(16), 1000)).online).sort(), [KISI, 'e'.repeat(16)]);
  assert.deepEqual(Object.keys((await cevrimici(d, M, '', SINIR.cevrimiciMs + 1)).online), ['e'.repeat(16)]);
});

test('RESP okuyucu: yarım mesaj bekler, abonelik mesajını okur', () => {
  const m = Buffer.from('*3\r\n$7\r\nmessage\r\n$4\r\ndesk\r\n$6\r\nhéllo\r\n');
  assert.deepEqual(respOku(m)[0], ['message', 'desk', 'héllo']);
  assert.equal(respOku(m.subarray(0, m.length - 3)), null);
  assert.ok(respOku(Buffer.from('-ERR nope\r\n'))[0] instanceof Error);
});

test('akış: kaçırılanları sırayla verir, sonra yeni kayıtları anında iletir', async () => {
  process.env.KOPRU_BELLEK = '1';
  const { default: handler } = await import('../api/desk.ts');
  const { depoSec } = await import('../api/_lib/depo.ts');
  const depo = depoSec();
  await yaz(depo, M, zarf('QQ=='), 1);
  await yaz(depo, M, zarf('Qg=='), 2);
  const sunucu = http.createServer((req, res) => {
    req.query = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => res.end(JSON.stringify(o));
    handler(req, res);
  });
  await new Promise(r => sunucu.listen(0, r));
  const ac = new AbortController();
  const yanit = await fetch(`http://127.0.0.1:${sunucu.address().port}/?d=${M}&stream=1`, { headers: { 'Last-Event-ID': '1' }, signal: ac.signal });
  assert.match(yanit.headers.get('content-type'), /event-stream/);
  const okuyucu = yanit.body.getReader(), td = new TextDecoder();
  let metin = '';
  const bekle = async re => { while (!re.test(metin)) metin += td.decode((await okuyucu.read()).value); };
  await bekle(/id: 2\n/);
  assert.doesNotMatch(metin, /id: 1\n/);
  const t0 = Date.now();
  await yaz(depo, M, zarf('Qw=='), 3);
  await bekle(/id: 3\n/);
  assert.ok(Date.now() - t0 < 200);
  ac.abort();
  sunucu.close();
});
