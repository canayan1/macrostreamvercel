import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { bellekDepo } from '../api/_lib/depo.ts';
import { imzaDogrula, formKodla, kokAdres } from '../api/_lib/stripe.ts';
import {
  belirtecImzala, anahtarUret, ANAHTAR_RE, bitisHesapla, donemSonu, aboneligiKaydet, olayIsle,
  oturumCoz, lisansIsle, kuponUrunleri, kayitGorunumu, HESAP_SINIRI, GECIKME_TOLERANSI_SN,
} from '../api/_lib/lisans.ts';

const SIR = 'degistir-beni';
const T0 = 1_792_000_000;

test('belirteç, docs/lisans.md test vektörüyle ve MQL5 Lisans.mqh biçimiyle aynı', () => {
  assert.equal(belirtecImzala(SIR, 'motor', 12345678, 1767225600),
    'v1|motor|12345678|1767225600|16b64c93216eb71cdb3f91b269f72664314ca49714130910ecc69185f0fc87f7');
});

test('anahtar: okunaklı biçim, her seferinde farklı', () => {
  const a = anahtarUret(), b = anahtarUret();
  assert.match(a, ANAHTAR_RE);
  assert.notEqual(a, b);
  assert.ok(!/[ILOU]/.test(a.slice(4)), 'karışan harf yok');
});

test('Stripe imzası: doğru imza geçer; değişmiş gövde, yanlış sır ve eski zaman reddedilir', () => {
  const sir = 'whsec_deneme', govde = '{"id":"evt_1","type":"invoice.paid"}';
  const imza = (t, g = govde, s = sir) => createHmac('sha256', s).update(`${t}.${g}`).digest('hex');
  const baslik = `t=${T0},v1=${imza(T0)}`;
  assert.ok(imzaDogrula(govde, baslik, sir, T0 + 10));
  assert.ok(imzaDogrula(govde, `t=${T0},v1=${'0'.repeat(64)},v1=${imza(T0)}`, sir, T0), 'birden çok v1');
  assert.ok(!imzaDogrula(govde + ' ', baslik, sir, T0));
  assert.ok(!imzaDogrula(govde, baslik, 'whsec_baska', T0));
  assert.ok(!imzaDogrula(govde, baslik, sir, T0 + 301), 'tekrar oynatma');
  assert.ok(!imzaDogrula(govde, undefined, sir, T0));
  assert.ok(!imzaDogrula(govde, `v1=${imza(T0)}`, sir, T0), 'zaman yok');
});

test('form kodlaması iç içe nesne ve dizileri Stripe biçiminde yazar', () => {
  assert.deepEqual(formKodla({ mode: 'subscription', line_items: [{ price: 'price_1', quantity: 1 }], metadata: { a: 'ş b' }, yok: undefined }),
    ['mode=subscription', 'line_items%5B0%5D%5Bprice%5D=price_1', 'line_items%5B0%5D%5Bquantity%5D=1', 'metadata%5Ba%5D=%C5%9F%20b']);
});

test('dönüş adresi yalnız bilinen alanlara gider', () => {
  assert.equal(kokAdres('kalibremarkets.com'), 'https://kalibremarkets.com');
  assert.equal(kokAdres('macrostreamvercel-abc.vercel.app'), 'https://macrostreamvercel-abc.vercel.app');
  assert.equal(kokAdres('localhost:8787'), 'http://localhost:8787');
  assert.equal(kokAdres('kotu.example'), 'https://kalibremarkets.com');
  assert.equal(kokAdres('kalibremarkets.com.kotu.example'), 'https://kalibremarkets.com');
});

const sub = (o = {}) => ({ id: 'sub_1', customer: 'cus_1', status: 'active', items: { data: [{ current_period_end: T0 + 30 * 86400 }] }, ...o });

test('bitiş: dönem sonu yeni ve eski Stripe sürümlerinde; gecikmede tolerans; iptalde bitiş anı', () => {
  assert.equal(donemSonu(sub()), T0 + 30 * 86400);
  assert.equal(donemSonu({ current_period_end: 5 }), 5);
  assert.equal(bitisHesapla(sub({ status: 'trialing' })), T0 + 30 * 86400);
  assert.equal(bitisHesapla(sub({ status: 'past_due' })), T0 + 30 * 86400 + GECIKME_TOLERANSI_SN);
  assert.equal(bitisHesapla(sub({ status: 'canceled', ended_at: T0 + 100 })), T0 + 100);
  assert.equal(bitisHesapla({ status: 'canceled' }), 0);
});

function sahteStripe(kayitlar) {
  const istekler = [];
  const f = async yol => { istekler.push(yol); if (!(yol in kayitlar)) throw new Error('stripe 404'); return kayitlar[yol]; };
  f.istekler = istekler;
  return f;
}

test('ödeme → kayıt; webhook ve ödeme sonrası sayfa yarışsa da tek anahtar', async () => {
  const d = bellekDepo();
  const oturum = { id: 'cs_test_abc123456789', mode: 'subscription', status: 'complete', payment_status: 'paid', subscription: 'sub_1', customer_details: { email: 'can@ornek.com' } };
  const stripe = sahteStripe({ 'subscriptions/sub_1?expand[]=discounts': sub(), 'checkout/sessions/cs_test_abc123456789': oturum });

  // Sayfa webhook'tan önce gelir: oturumu Stripe'tan doğrular, kaydı açar.
  const k1 = await oturumCoz(d, oturum.id, stripe);
  assert.match(k1.anahtar, ANAHTAR_RE);
  assert.equal(k1.bitis, T0 + 30 * 86400);
  // Webhook sonra gelir: aynı anahtar.
  assert.equal(await olayIsle(d, { type: 'checkout.session.completed', data: { object: oturum } }, stripe), 'kaydedildi');
  const k2 = await oturumCoz(d, oturum.id, stripe);
  assert.equal(k2.anahtar, k1.anahtar);
  // Görünüm müşteri/abonelik kimliği ve tam e-posta sızdırmaz.
  const g = kayitGorunumu(k2);
  assert.equal(g.eposta, 'c***@ornek.com');
  assert.ok(!JSON.stringify(g).includes('cus_') && !JSON.stringify(g).includes('sub_'));
});

test('tamamlanmamış ya da abonelik olmayan oturum kayıt açmaz', async () => {
  const d = bellekDepo();
  const stripe = sahteStripe({
    'checkout/sessions/cs_test_odenmedi0000': { id: 'cs_test_odenmedi0000', mode: 'subscription', status: 'open', payment_status: 'unpaid', subscription: null },
    'checkout/sessions/cs_test_tekseferlik0': { id: 'cs_test_tekseferlik0', mode: 'payment', status: 'complete', payment_status: 'paid' },
  });
  assert.equal(await oturumCoz(d, 'cs_test_odenmedi0000', stripe), null);
  assert.equal(await oturumCoz(d, 'cs_test_tekseferlik0', stripe), null);
  assert.equal(await olayIsle(d, { type: 'checkout.session.completed', data: { object: { mode: 'payment' } } }, stripe), 'abonelik değil');
});

test('yenileme, gecikme ve iptal olayları bitişi günceller; bilinmeyen abonelik yok sayılır', async () => {
  const d = bellekDepo();
  const yenilendi = sub({ items: { data: [{ current_period_end: T0 + 60 * 86400 }] } });
  const stripe = sahteStripe({ 'subscriptions/sub_1?expand[]=discounts': yenilendi });
  const k = await aboneligiKaydet(d, sub(), 'a@b.c', null);
  // invoice.paid: yeni (basil) biçimde abonelik kimliği parent altında.
  await olayIsle(d, { type: 'invoice.paid', data: { object: { parent: { subscription_details: { subscription: 'sub_1' } } } } }, stripe);
  assert.equal((await oturumKaydi(d, k.anahtar)).bitis, T0 + 60 * 86400);
  await olayIsle(d, { type: 'customer.subscription.deleted', data: { object: sub({ status: 'canceled', ended_at: T0 + 5 }) } }, stripe);
  const son = await oturumKaydi(d, k.anahtar);
  assert.equal(son.durum, 'canceled');
  assert.equal(son.bitis, T0 + 5);
  assert.equal(await olayIsle(d, { type: 'customer.subscription.updated', data: { object: sub({ id: 'sub_yok' }) } }, stripe), 'kayıt yok');
  assert.equal(await olayIsle(d, { type: 'charge.refunded', data: { object: {} } }, stripe), 'yok sayıldı');
});
const oturumKaydi = async (d, a) => JSON.parse(await d.oku(`lisans:${a}`));

test('MT5 lisans ucu: hesap bağlama, sınır, süresi dolmuş abonelik ve hatalı girdiler', async () => {
  const d = bellekDepo();
  const k = await aboneligiKaydet(d, sub(), 'a@b.c', null);
  const simdi = T0 * 1000;
  const r = await lisansIsle(d, SIR, k.anahtar.toLowerCase(), '111', 'motor', simdi);
  assert.equal(r.durum, 200);
  assert.equal(r.govde, belirtecImzala(SIR, 'motor', 111, T0 + 30 * 86400));
  assert.equal((await lisansIsle(d, SIR, k.anahtar, '111', 'motor', simdi)).durum, 200, 'aynı hesap tekrar');
  for (let i = 2; i <= HESAP_SINIRI; i++) assert.equal((await lisansIsle(d, SIR, k.anahtar, String(100 + i * 11), 'motor', simdi)).durum, 200);
  const fazla = await lisansIsle(d, SIR, k.anahtar, '999', 'motor', simdi);
  assert.equal(fazla.durum, 403);
  assert.match(fazla.govde, /en çok \d MT5 hesabında/);

  await olayIsle(d, { type: 'customer.subscription.deleted', data: { object: sub({ status: 'canceled', ended_at: T0 - 10 }) } }, sahteStripe({}));
  const bitti = await lisansIsle(d, SIR, k.anahtar, '111', 'motor', simdi);
  assert.equal(bitti.durum, 200, 'süresi dolmuş da 200 ve geçmiş bitişle döner');
  assert.equal(bitti.govde.split('|')[3], String(T0 - 10));

  assert.equal((await lisansIsle(d, SIR, 'KLM-00000-00000-00000-00000', '111', 'motor', simdi)).durum, 404);
  assert.equal((await lisansIsle(d, SIR, 'yanlis', '111', 'motor', simdi)).durum, 400);
  assert.equal((await lisansIsle(d, SIR, k.anahtar, '12a', 'motor', simdi)).durum, 400);
  assert.equal((await lisansIsle(d, SIR, k.anahtar, '111', 'baska', simdi)).durum, 400);
});

test('MT5 lisans ucu: hesap başına dakikada 20 denemeden sonra 429', async () => {
  const d = bellekDepo();
  const simdi = T0 * 1000;
  let son;
  for (let i = 0; i < 21; i++) son = await lisansIsle(d, SIR, 'KLM-00000-00000-00000-00000', '555', 'motor', simdi);
  assert.equal(son.durum, 429);
});

test('eklenti indirme: geçerli abonelik indirir; süresi dolmuş, bilinmeyen ve yüklenmemiş reddedilir', async () => {
  const { eklentiIndir } = await import('../api/_lib/lisans.ts');
  const d = bellekDepo();
  const k = await aboneligiKaydet(d, sub(), 'a@b.c', null);
  const simdi = T0 * 1000;
  assert.equal((await eklentiIndir(d, k.anahtar, 'kopru', simdi)).durum, 503, 'henüz yüklenmedi');
  const ex5 = Buffer.from([0x45, 0x58, 0x35, 0x00, 0xff]);
  await d.yaz('eklenti:kopru', JSON.stringify({ dosya: 'KalibreKopru.ex5', surum: '1.00', sha256: 'x', b64: ex5.toString('base64') }));
  const r = await eklentiIndir(d, k.anahtar.toLowerCase(), 'kopru', simdi);
  assert.equal(r.durum, 200);
  assert.deepEqual(r.veri, ex5);
  assert.equal(r.dosya, 'KalibreKopru.ex5');
  assert.equal((await eklentiIndir(d, k.anahtar, 'baska', simdi)).durum, 400);
  assert.equal((await eklentiIndir(d, 'KLM-00000-00000-00000-00000', 'kopru', simdi)).durum, 404);
  assert.equal((await eklentiIndir(d, k.anahtar, 'kopru', (T0 + 31 * 86400) * 1000)).durum, 403, 'süresi dolmuş');
});

test('İngilizce mesajlar: uçların ve lisans ucunun her Türkçe mesajının çevirisi var', async () => {
  const { cevir, EN } = await import('../api/_lib/dil.ts');
  const { readFileSync } = await import('node:fs');
  const kaynak = ['api/_lib/lisans.ts', 'api/lisans.ts', 'api/indir.ts', 'api/odeme/baslat.ts', 'api/odeme/oturum.ts', 'api/odeme/portal.ts']
    .map(p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')).join('\n');
  const mesajlar = [...kaynak.matchAll(/(?:hata|govde): '([^']+)'/g)].map(m => m[1]).concat(
    [...kaynak.matchAll(/\.send\('([^']+)'\)/g)].map(m => m[1]));
  const eksik = mesajlar.filter(m => cevir(m, 'en') === m);
  assert.deepEqual(eksik, [], 'çevirisi eksik mesajlar');
  assert.match(cevir('Bu anahtar en çok 2 MT5 hesabında kullanılabilir. Değiştirmek için bize yazın.', 'en'), /at most 2 MT5 accounts/);
  assert.equal(cevir('Lisans anahtarı bulunamadı.', 'tr'), 'Lisans anahtarı bulunamadı.');
  assert.ok(Object.keys(EN).length > 15);
});

test('kupon kapsamı: metadata urunler=kopru lisansı Köprü ile sınırlar, indirim bitince korunur', async () => {
  const d = bellekDepo();
  const simdi = T0 * 1000;
  const kupon = { id: 'ilk-testciler', percent_off: 100, duration: 'repeating', duration_in_months: 3, metadata: { urunler: 'kopru' } };
  // Yeni API: discounts[] açılmış, kupon source.coupon altında kimlik olarak; ayrıca çekilir.
  const indirimli = sub({ discounts: [{ id: 'di_1', source: { type: 'coupon', coupon: 'ilk-testciler' } }] });
  const oturum = { id: 'cs_test_kupon0000001', mode: 'subscription', status: 'complete', payment_status: 'no_payment_required', subscription: 'sub_1', customer_details: { email: 't@ornek.com' } };
  const stripe = sahteStripe({ 'subscriptions/sub_1?expand[]=discounts': indirimli, 'checkout/sessions/cs_test_kupon0000001': oturum, 'coupons/ilk-testciler': kupon });
  const k = await oturumCoz(d, oturum.id, stripe);
  assert.deepEqual(k.urunler, ['kopru']);
  assert.equal((await lisansIsle(d, SIR, k.anahtar, '5551', 'motor', simdi)).durum, 403);
  assert.equal((await lisansIsle(d, SIR, k.anahtar, '5551', 'kopru', simdi)).durum, 200);
  // İndirim bitti: abonelikte kupon yok, kapsam kayıttaki gibi kalır.
  await olayIsle(d, { type: 'customer.subscription.updated', data: { object: sub({ discounts: [] }) } }, stripe);
  assert.deepEqual((await oturumKaydi(d, k.anahtar)).urunler, ['kopru']);
  assert.equal((await lisansIsle(d, SIR, k.anahtar, '5551', 'motor', simdi)).durum, 403);
});

test('kupon kapsamı: eski biçim, açılmış kupon, tanınmayan ad ve kuponsuz abonelik', async () => {
  assert.deepEqual(await kuponUrunleri({ discount: { coupon: { metadata: { urunler: 'kopru' } } } }), ['kopru']);
  assert.deepEqual(await kuponUrunleri({ discounts: [{ coupon: { metadata: { urunler: ' Köprü , motor' } } }] }), ['kopru', 'motor']);
  assert.deepEqual(await kuponUrunleri({ discounts: [{ source: { coupon: { metadata: { urunler: 'yanlis' } } } }] }), []);
  assert.equal(await kuponUrunleri({ discounts: [{ source: { coupon: { metadata: {} } } }] }), null);
  assert.equal(await kuponUrunleri({ discounts: ['di_1'] }), null); // açılmamış kimlik: kapsam yok
  assert.equal(await kuponUrunleri(sub()), null);
  // Kuponsuz ücretli abonelik tüm ürünleri kapsar.
  const d = bellekDepo();
  const k = await aboneligiKaydet(d, sub(), 'a@b.c', null);
  assert.equal(k.urunler, undefined);
  assert.equal((await lisansIsle(d, SIR, k.anahtar, '5552', 'motor', T0 * 1000)).durum, 200);
});
