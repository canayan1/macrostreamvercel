import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bellekDepo } from '../api/_lib/depo.ts';
import { talepIsle, ipOzeti, kaynakTemizle, sayacCoz, huniOzetle, kayitlarCsv, SINIR } from '../api/_lib/talep.ts';
import { istemciIp } from '../api/talep.ts';

const T = Date.UTC(2026, 9, 26, 12, 0, 0);
const olay = (o = {}) => ({ sayfa: 'rule-guard', varyant: 'a', olay: 'goruntuleme', kaynak: 'ff', dil: 'en', ...o });
const form = (o = {}) => olay({ olay: 'form-gonder', eposta: 'Trader@Example.com', onay: true, cevaplar: { firma: 'ftmo', sinav: '2-3', simdi: 'a spreadsheet' }, ...o });

// Bellek deposundaki anahtarları görmek için yazımları kaydeden sarmalayıcı.
function izliDepo() {
  const d = bellekDepo(), anahtarlar = new Set();
  return {
    anahtarlar,
    yaz: (k, v, t) => { anahtarlar.add(k); return d.yaz(k, v, t); },
    yazYoksa: (k, v, t) => { anahtarlar.add(k); return d.yazYoksa(k, v, t); },
    oku: k => d.oku(k),
    say: (k, t) => { anahtarlar.add(k); return d.say(k, t); },
  };
}

test('görüntüleme ve fiyat tıklaması sayılır; anahtar gün, sayfa, varyant, olay, kaynak ve dil içerir', async () => {
  const d = izliDepo();
  assert.equal((await talepIsle(d, olay(), '1.2.3.4', T)).durum, 204);
  assert.equal((await talepIsle(d, olay(), '1.2.3.4', T)).durum, 204);
  assert.equal((await talepIsle(d, olay({ olay: 'fiyat-tik' }), '1.2.3.4', T)).durum, 204);
  assert.equal(await d.oku('talep:sayac:2026-10-26|rule-guard|a|goruntuleme|ff|en'), '2');
  assert.equal(await d.oku('talep:sayac:2026-10-26|rule-guard|a|fiyat-tik|ff|en'), '1');
});

test('ham IP hiçbir anahtarda yer almaz', async () => {
  const d = izliDepo();
  await talepIsle(d, olay(), '203.0.113.77', T);
  await talepIsle(d, form(), '203.0.113.77', T);
  for (const k of d.anahtarlar) assert.ok(!k.includes('203.0.113.77'), k);
  assert.equal(ipOzeti('203.0.113.77', 't').length, 16);
  assert.notEqual(ipOzeti('203.0.113.77', 't'), ipOzeti('203.0.113.78', 't'));
});

test('geçersiz sayfa, olay, varyant ve gövde reddedilir', async () => {
  const d = bellekDepo();
  for (const [g, hata] of [[null, 'govde'], [[], 'govde'], ['x', 'govde'], [olay({ sayfa: 'pricing' }), 'sayfa'],
    [olay({ olay: 'satin-al' }), 'olay'], [olay({ varyant: 'c' }), 'varyant']]) {
    const r = await talepIsle(d, g, '1.1.1.1', T);
    assert.equal(r.durum, 400, JSON.stringify(g));
    assert.equal(r.govde.hata, hata);
  }
});

test('kaynak temizlenir: boşsa dogrudan, biçim dışıysa diger', () => {
  assert.equal(kaynakTemizle(''), 'dogrudan');
  assert.equal(kaynakTemizle('Discord-FTMO'), 'discord-ftmo');
  assert.equal(kaynakTemizle('<script>'), 'diger');
  assert.equal(kaynakTemizle('a'.repeat(40)), 'diger');
});

test('form: onay kutusu işaretli değilse e-posta saklanmaz', async () => {
  const d = izliDepo();
  for (const onay of [false, undefined, 'true', 1]) {
    const r = await talepIsle(d, form({ onay }), '1.1.1.1', T);
    assert.equal(r.durum, 400);
    assert.equal(r.govde.hata, 'onay');
  }
  assert.ok(![...d.anahtarlar].some(k => k.startsWith('talep:kayit:')));
});

test('form: geçerli kayıt saklanır, e-posta küçük harfe çevrilir, onay sürümü ve zaman yazılır', async () => {
  const d = izliDepo();
  const r = await talepIsle(d, form(), '1.1.1.1', T);
  assert.equal(r.durum, 200);
  assert.equal(r.govde.yeni, true);
  const k = [...d.anahtarlar].find(a => a.startsWith('talep:kayit:rule-guard:'));
  const kayit = JSON.parse(await d.oku(k));
  assert.equal(kayit.eposta, 'trader@example.com');
  assert.equal(kayit.onay, true);
  assert.ok(kayit.onaySurumu);
  assert.equal(kayit.zaman, '2026-10-26T12:00:00.000Z');
  assert.deepEqual(kayit.cevaplar, { firma: 'ftmo', sinav: '2-3', simdi: 'a spreadsheet' });
  assert.ok(!k.includes('trader'), 'anahtarda e-posta açık yazılmaz');
});

test('form: aynı e-posta ikinci kez dönüşüm sayılmaz ama cevaplar güncellenir', async () => {
  const d = izliDepo();
  await talepIsle(d, form(), '1.1.1.1', T);
  const r = await talepIsle(d, form({ cevaplar: { firma: 'the5ers' } }), '1.1.1.1', T);
  assert.equal(r.govde.yeni, false);
  assert.equal(await d.oku('talep:sayac:2026-10-26|rule-guard|a|form-gonder|ff|en'), '1');
  const k = [...d.anahtarlar].find(a => a.startsWith('talep:kayit:'));
  assert.equal(JSON.parse(await d.oku(k)).cevaplar.firma, 'the5ers');
});

test('form: hatalı e-posta ve izin dışı cevap reddedilir; açık uçlu cevap kısaltılır', async () => {
  const d = bellekDepo();
  for (const eposta of ['', 'x', 'a@b', 'a b@c.com', '<a>@b.com']) {
    assert.equal((await talepIsle(d, form({ eposta }), '2.2.2.2', T)).govde.hata, 'eposta', eposta);
  }
  assert.equal((await talepIsle(d, form({ cevaplar: { firma: 'baska' } }), '2.2.2.3', T)).govde.alan, 'firma');
  const uzun = await talepIsle(d, olay({ olay: 'form-gonder', sayfa: 'mt5-analytics', eposta: 'x@y.io', onay: true,
    cevaplar: { platform: 'mt5', simdi: 'myfxbook', odeme: 'z'.repeat(1000) } }), '2.2.2.4', T);
  assert.equal(uzun.durum, 200);
});

test('bot tuzağı doluysa hiçbir şey yazılmaz', async () => {
  const d = izliDepo();
  assert.equal((await talepIsle(d, form({ web: 'http://spam' }), '1.1.1.1', T)).durum, 204);
  assert.equal(d.anahtarlar.size, 0);
});

test('hız sınırı: IP başına dakikada olay, saatte form; başka IP etkilenmez', async () => {
  const d = bellekDepo();
  for (let i = 0; i < SINIR.olayDakika; i++) assert.equal((await talepIsle(d, olay(), '9.9.9.9', T)).durum, 204);
  assert.equal((await talepIsle(d, olay(), '9.9.9.9', T)).durum, 429);
  assert.equal((await talepIsle(d, olay(), '9.9.9.8', T)).durum, 204);
  assert.equal((await talepIsle(d, olay(), '9.9.9.9', T + 60_000)).durum, 204);
  const d2 = bellekDepo();
  for (let i = 0; i < SINIR.formSaat; i++) {
    assert.equal((await talepIsle(d2, form({ eposta: `u${i}@x.io` }), '8.8.8.8', T + i * 61_000)).durum, 200);
  }
  assert.equal((await talepIsle(d2, form({ eposta: 'son@x.io' }), '8.8.8.8', T + 6 * 61_000)).durum, 429);
});

test('istemci IP başlıklardan okunur', () => {
  assert.equal(istemciIp({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }), '1.1.1.1');
  assert.equal(istemciIp({ 'x-forwarded-for': '3.3.3.3, 10.0.0.1' }), '3.3.3.3');
  assert.equal(istemciIp({}, '4.4.4.4'), '4.4.4.4');
});

test('özet: sayaçlar sayfa/varyant kırılımında toplanır, oranlar hesaplanır', () => {
  const s = [
    ['talep:sayac:2026-10-26|rule-guard|a|goruntuleme|ff|en', '100'],
    ['talep:sayac:2026-10-27|rule-guard|a|goruntuleme|mql5|en', '100'],
    ['talep:sayac:2026-10-26|rule-guard|a|fiyat-tik|ff|en', '10'],
    ['talep:sayac:2026-10-26|rule-guard|a|form-gonder|ff|en', '4'],
    ['talep:sayac:2026-10-26|rule-guard|b|goruntuleme|ff|tr', '50'],
    ['baska:anahtar', '1'],
  ].map(([k, v]) => sayacCoz(k, v)).filter(Boolean);
  assert.equal(s.length, 5);
  const h = huniOzetle(s, x => `${x.sayfa} ${x.varyant}`);
  assert.deepEqual(h.map(x => x.anahtar), ['rule-guard a', 'rule-guard b']);
  assert.equal(h[0].goruntuleme, 200);
  assert.equal(h[0].fiyatOrani, 0.05);
  assert.equal(h[0].donusum, 0.02);
  assert.equal(h[1].donusum, 0);
});

test('CSV: formül enjeksiyonu kaçırılır, tırnak ve virgül korunur', () => {
  const csv = kayitlarCsv([{ zaman: '2026-10-26T12:00:00.000Z', sayfa: 'mt5-analytics', varyant: 'b', kaynak: 'ff', dil: 'en',
    eposta: 'x@y.io', onaySurumu: '1', cevaplar: { odeme: '=HYPERLINK("x")', platform: 'mt5' } }]);
  const [bas, satir] = csv.trim().split('\n');
  assert.equal(bas, 'zaman,sayfa,varyant,kaynak,dil,eposta,onaySurumu,odeme,platform');
  assert.ok(satir.includes(`"'=HYPERLINK(""x"")"`), satir);
});
