import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bellekDepo } from '../api/_lib/depo.ts';
import { supabaseAyar, belirtecAl, kullaniciDogrula, servisIstemci } from '../api/_lib/supabase.ts';
import { lisansBagla, kullaniciLisanslari, aynaSatiri, lisansKimligi } from '../api/_lib/hesap.ts';
import { olayIsle, oturumCoz, oturumKullanicisi } from '../api/_lib/lisans.ts';
import { hesapIsle, HESAP_EN } from '../api/hesap.ts';
import { cevir } from '../api/_lib/dil.ts';

const UID = '11111111-2222-4333-8444-555555555555';
const UID2 = '99999999-2222-4333-8444-555555555555';
const AYAR = { url: 'https://ornek.supabase.co', anon: 'anon', servis: 'servis-gizli' };
const T0 = 1_800_000_000;

function sahteGetir(cevaplar) {
  const istekler = [];
  const f = async (url, o = {}) => {
    istekler.push({ url: String(url), o });
    for (const [desen, yanit] of cevaplar) if (String(url).includes(desen)) return typeof yanit === 'function' ? yanit(url, o) : yanit();
    return new Response('{}', { status: 404 });
  };
  f.istekler = istekler;
  return f;
}
const json = (o, status = 200) => () => new Response(JSON.stringify(o), { status });

function sahteStripe(abonelikler = {}, oturumlar = {}) {
  const cagrilar = [];
  const s = async (yol, govde) => {
    cagrilar.push({ yol, govde });
    const m = yol.match(/^subscriptions\/([^?]+)/);
    if (m && govde) return { id: m[1], ...govde };
    if (m) return abonelikler[decodeURIComponent(m[1])];
    const c = yol.match(/^checkout\/sessions\/(.+)$/);
    if (c) return oturumlar[decodeURIComponent(c[1])];
    if (yol.startsWith('coupons/')) return null;
    throw new Error('beklenmeyen ' + yol);
  };
  s.cagrilar = cagrilar;
  return s;
}
const abonelik = (id, durum = 'active') => ({ id, status: durum, customer: 'cus_1', items: { data: [{ current_period_end: T0 + 30 * 86400 }] }, discounts: [] });

test('supabaseAyar: yalnız supabase.co adresi ve anon anahtarla açılır; yerelde 127.0.0.1', () => {
  assert.equal(supabaseAyar({}), null);
  assert.equal(supabaseAyar({ SUPABASE_URL: 'https://evil.example.com', SUPABASE_ANON_KEY: 'a' }), null);
  assert.deepEqual(supabaseAyar({ SUPABASE_URL: 'https://abc.supabase.co/', SUPABASE_ANON_KEY: 'a' }), { url: 'https://abc.supabase.co', anon: 'a', servis: null });
  assert.ok(supabaseAyar({ SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_ANON_KEY: 'a' }));
  assert.equal(supabaseAyar({ SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_ANON_KEY: 'a', VERCEL: '1' }), null);
});

test('belirteç doğrulama: Supabase /auth/v1/user ucuna anon anahtarla sorulur', async () => {
  assert.equal(belirtecAl('Bearer kisa'), null);
  assert.equal(belirtecAl(undefined), null);
  const b = 'eyJhbGciOi.eyJzdWIiOi.imza-imza-imza';
  assert.equal(belirtecAl(`Bearer ${b}`), b);
  const getir = sahteGetir([['/auth/v1/user', (u, o) => o.headers.Authorization === `Bearer ${b}` && o.headers.apikey === 'anon'
    ? new Response(JSON.stringify({ id: UID, email: 'a@b.co', user_metadata: { full_name: 'Ada' } }))
    : new Response('{}', { status: 401 })]]);
  assert.deepEqual(await kullaniciDogrula(AYAR, b, getir), { id: UID, eposta: 'a@b.co', ad: 'Ada' });
  assert.equal(await kullaniciDogrula(AYAR, 'baska-belirtec-xxxxxxxxxxxx', getir), null);
  assert.equal(await kullaniciDogrula(AYAR, null, getir), null);
  const bozuk = sahteGetir([['/auth/v1/user', json({}, 500)]]);
  await assert.rejects(kullaniciDogrula(AYAR, b, bozuk));
});

test('webhook: client_reference_id ile gelen ödeme lisansı hesaba bağlar', async () => {
  const d = bellekDepo();
  const stripe = sahteStripe({ sub_1: abonelik('sub_1') });
  await olayIsle(d, { type: 'checkout.session.completed', data: { object: { id: 'cs_1', mode: 'subscription', subscription: 'sub_1', client_reference_id: UID, customer_details: { email: 'a@b.co' } } } }, stripe);
  const l = await kullaniciLisanslari(d, UID);
  assert.equal(l.length, 1);
  assert.equal(l[0].kullanici, UID);
  assert.equal(oturumKullanicisi({ client_reference_id: 'yanlis' }, { metadata: { kullanici: UID2 } }), UID2);
  assert.equal(oturumKullanicisi({}, {}), null);
});

test('ödeme sonrası sayfa (oturumCoz) da hesabı bağlar; sonradan gelen olay sahibi değiştirmez', async () => {
  const d = bellekDepo();
  const stripe = sahteStripe({ sub_2: abonelik('sub_2') }, { cs_2: { id: 'cs_2', mode: 'subscription', status: 'complete', payment_status: 'paid', subscription: 'sub_2', client_reference_id: UID } });
  const k = await oturumCoz(d, 'cs_2', stripe);
  assert.equal(k.kullanici, UID);
  await olayIsle(d, { type: 'checkout.session.completed', data: { object: { id: 'cs_2', mode: 'subscription', subscription: 'sub_2', client_reference_id: UID2 } } }, stripe);
  assert.equal((await kullaniciLisanslari(d, UID)).length, 1);
  assert.equal((await kullaniciLisanslari(d, UID2)).length, 0);
});

test('anahtarı hesaba bağlama: biçim, yok, başka hesapta, başarı', async () => {
  const d = bellekDepo();
  const anahtar = 'KLM-ABCDE-FGHJK-MNPQR-STVWX';
  await d.yaz(`lisans:${anahtar}`, JSON.stringify({ anahtar, durum: 'active', bitis: T0 + 86400, hesaplar: [], beta: true, urunler: ['kopru'] }));
  assert.equal((await lisansBagla(d, 'yanlis', UID)).durum, 400);
  assert.equal((await lisansBagla(d, 'KLM-00000-00000-00000-00000', UID)).durum, 404);
  assert.equal((await lisansBagla(d, anahtar, 'uuid-degil')).durum, 401);
  const r = await lisansBagla(d, anahtar.toLowerCase(), UID);
  assert.equal(r.durum, 200);
  assert.equal((await lisansBagla(d, anahtar, UID)).durum, 200, 'aynı hesaba tekrar bağlamak sorun değil');
  const baska = await lisansBagla(d, anahtar, UID2);
  assert.equal(baska.durum, 409);
  assert.equal(cevir(baska.hata, 'en'), 'This key is linked to another account. If you think this is a mistake, contact us.');
});

test('lisans görüntüsü Supabase\'e tam anahtarı yazmaz; hizmet anahtarıyla upsert edilir', async () => {
  const k = { anahtar: 'KLM-ABCDE-FGHJK-MNPQR-STVWX', kullanici: UID, durum: 'active', bitis: T0, urunler: ['kopru'], beta: true };
  const s = aynaSatiri(k);
  assert.equal(s.key_hint, 'STVWX');
  assert.equal(s.product, 'lab');
  assert.deepEqual(s.addons, ['kopru']);
  assert.equal(s.id, lisansKimligi(k.anahtar));
  assert.ok(!JSON.stringify(s).includes('ABCDE'));
  const getir = sahteGetir([['/rest/v1/licenses', () => new Response('', { status: 201 })]]);
  const servis = servisIstemci(AYAR, getir);
  const d = bellekDepo();
  await d.yaz(`lisans:${k.anahtar}`, JSON.stringify({ ...k, kullanici: undefined }));
  assert.equal((await lisansBagla(d, k.anahtar, UID, Date.now(), servis)).durum, 200);
  const i = getir.istekler.find(x => x.url.includes('/rest/v1/licenses'));
  assert.equal(i.o.headers.Authorization, 'Bearer servis-gizli');
  assert.match(i.o.headers.Prefer, /merge-duplicates/);
  assert.equal(JSON.parse(i.o.body).user_id, UID);
  assert.equal(servisIstemci({ ...AYAR, servis: null }), null);
  const g2 = sahteGetir([['/rest/v1/licenses', () => new Response('', { status: 201 })]]);
  await servisIstemci({ ...AYAR, servis: 'sb_secret_abc' }, g2).upsert('licenses', { id: 'x' });
  assert.equal(g2.istekler[0].o.headers.apikey, 'sb_secret_abc');
  assert.equal(g2.istekler[0].o.headers.Authorization, undefined, 'yeni gizli anahtar Bearer olarak gitmez');
});

test('hesap uçları: lisanslar yalnız sahibine, tam anahtarla', async () => {
  const d = bellekDepo();
  const anahtar = 'KLM-ABCDE-FGHJK-MNPQR-STVWX';
  await d.yaz(`lisans:${anahtar}`, JSON.stringify({ anahtar, durum: 'active', bitis: T0 + 86400, hesaplar: [123], musteri: 'cus_1', abonelik: 'sub_1' }));
  await lisansBagla(d, anahtar, UID);
  const r = await hesapIsle('lisanslar', 'GET', null, { depo: d, kullanici: { id: UID }, stripe: null, servis: null, simdi: T0 * 1000 });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.lisanslar[0].anahtar, anahtar);
  assert.equal(r.govde.lisanslar[0].urun, 'lab');
  assert.equal(r.govde.lisanslar[0].yonetilebilir, true);
  assert.equal(r.govde.lisanslar[0].gecerli, true);
  const r2 = await hesapIsle('lisanslar', 'GET', null, { depo: d, kullanici: { id: UID2 }, stripe: null, servis: null });
  assert.deepEqual(r2.govde.lisanslar, []);
  assert.equal((await hesapIsle('yok', 'GET', null, { depo: d, kullanici: { id: UID } })).durum, 400);
  assert.equal((await hesapIsle('lisanslar', 'POST', null, { depo: d, kullanici: { id: UID } })).durum, 400);
});

test('hesap silme: onay ister, aboneliği dönem sonunda iptal eder, kullanıcıyı siler, bağları kaldırır', async () => {
  const d = bellekDepo();
  const anahtar = 'KLM-ABCDE-FGHJK-MNPQR-STVWX';
  await d.yaz(`lisans:${anahtar}`, JSON.stringify({ anahtar, durum: 'active', bitis: T0 + 86400, hesaplar: [], musteri: 'cus_1', abonelik: 'sub_1', kullanici: UID }));
  await d.yaz(`lisans-kullanici:${UID}`, JSON.stringify([anahtar]));
  const getir = sahteGetir([[`/auth/v1/admin/users/${UID}`, () => new Response('{}', { status: 200 })]]);
  const servis = servisIstemci(AYAR, getir);
  const stripe = sahteStripe();
  const b = { depo: d, kullanici: { id: UID }, stripe, servis };
  assert.equal((await hesapIsle('sil', 'POST', {}, b)).durum, 400);
  assert.equal((await hesapIsle('sil', 'POST', { onay: true }, { ...b, servis: null })).durum, 503);
  const r = await hesapIsle('sil', 'POST', { onay: true }, b);
  assert.equal(r.durum, 200);
  assert.deepEqual(r.govde, { silindi: true, iptalEdilen: 1 });
  assert.deepEqual(stripe.cagrilar[0], { yol: 'subscriptions/sub_1', govde: { cancel_at_period_end: 'true' } });
  assert.equal(getir.istekler.at(-1).o.method, 'DELETE');
  assert.equal((await kullaniciLisanslari(d, UID)).length, 0);
  const kayit = JSON.parse(await d.oku(`lisans:${anahtar}`));
  assert.equal(kayit.kullanici, undefined, 'lisans kaydı kalır, hesap bağı kalkar');
  assert.equal(kayit.durum, 'active');
});

test('hesap silme: Stripe iptali başarısızsa hesap silinmez', async () => {
  const d = bellekDepo();
  const anahtar = 'KLM-ABCDE-FGHJK-MNPQR-STVWX';
  await d.yaz(`lisans:${anahtar}`, JSON.stringify({ anahtar, durum: 'active', bitis: T0, hesaplar: [], musteri: 'cus_1', abonelik: 'sub_1', kullanici: UID }));
  await d.yaz(`lisans-kullanici:${UID}`, JSON.stringify([anahtar]));
  const getir = sahteGetir([['/auth/v1/admin/users/', () => new Response('{}')]]);
  const stripe = async () => { throw new Error('stripe 500'); };
  const r = await hesapIsle('sil', 'POST', { onay: true }, { depo: d, kullanici: { id: UID }, stripe, servis: servisIstemci(AYAR, getir) });
  assert.equal(r.durum, 502);
  assert.equal(getir.istekler.length, 0);
  assert.equal((await kullaniciLisanslari(d, UID)).length, 1);
});

test('hesap uçlarının her Türkçe mesajının İngilizcesi var', () => {
  const kaynak = ['api/hesap.ts', 'api/_lib/hesap.ts', 'api/odeme/baslat.ts'].map(p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')).join('\n');
  const mesajlar = [...kaynak.matchAll(/hata: '([^']+)'/g)].map(m => m[1]);
  assert.ok(mesajlar.length > 8);
  assert.deepEqual(mesajlar.filter(m => cevir(m, 'en') === m), []);
  assert.ok(Object.keys(HESAP_EN).length > 5);
});
