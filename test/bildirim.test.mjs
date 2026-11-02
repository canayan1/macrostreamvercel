import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoBildir, bildirimMetni } from '../api/_lib/bildirim.ts';

const kayit = { eposta: 'head@desk.example', sayfa: 'demo', kaynak: 'mail1', dil: 'en', zaman: '2026-11-02T10:00:00.000Z',
  cevaplar: { urun: 'ikisi', kurum: 'banka', masa: '6-20', sistem: '<b>Kondor</b> & FXall' } };

test('bildirim: anahtar yoksa gönderim yok', async () => {
  let cagri = 0;
  assert.equal(await demoBildir(kayit, {}, async () => { cagri++; return new Response('', { status: 200 }); }), false);
  assert.equal(await demoBildir(kayit, { RESEND_API_KEY: 'k' }, async () => { cagri++; return new Response('', { status: 200 }); }), false);
  assert.equal(cagri, 0);
});

test('bildirim: Resend isteği doğru alanlarla gider, HTML kaçırılır, reply_to talep sahibidir', async () => {
  let istek;
  const ok = await demoBildir(kayit, { RESEND_API_KEY: 'k', TALEP_BILDIRIM_KIME: 'can@example.com' }, async (url, o) => { istek = { url, o }; return new Response('{"id":"1"}', { status: 200 }); });
  assert.equal(ok, true);
  assert.equal(istek.url, 'https://api.resend.com/emails');
  assert.equal(istek.o.headers.Authorization, 'Bearer k');
  const g = JSON.parse(istek.o.body);
  assert.deepEqual(g.to, ['can@example.com']);
  assert.equal(g.reply_to, 'head@desk.example');
  assert.match(g.from, /onboarding@resend\.dev/);
  assert.match(g.subject, /demo request from head@desk\.example/);
  assert.ok(g.html.includes('&lt;b&gt;Kondor&lt;/b&gt; &amp; FXall'));
  assert.ok(!g.html.includes('<b>Kondor'));
  assert.ok(g.text.includes('masa: 6-20'));
});

test('bildirim: ağ hatası ve 4xx false döner, fırlatmaz', async () => {
  assert.equal(await demoBildir(kayit, { RESEND_API_KEY: 'k', TALEP_BILDIRIM_KIME: 'c@e.com' }, async () => { throw new Error('net'); }), false);
  assert.equal(await demoBildir(kayit, { RESEND_API_KEY: 'k', TALEP_BILDIRIM_KIME: 'c@e.com' }, async () => new Response('', { status: 422 })), false);
  assert.equal(bildirimMetni(kayit).konu, 'Kalibre: demo request from head@desk.example');
});
