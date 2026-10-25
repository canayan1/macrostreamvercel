import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bellekDepo } from '../api/_lib/depo.ts';
import { lisansIsle, eklentiIndir, ANAHTAR_RE } from '../api/_lib/lisans.ts';
import { betaOlustur, betaListele, betaUzat, betaIptal } from '../yerel/beta-lisans-cekirdek.mjs';

const T0 = 1_792_000_000_000;
const SIR = 'degistir-beni';

test('beta lisansı: lisans ucu ve indirme onu abonelik gibi kabul eder', async () => {
  const d = bellekDepo();
  const k = await betaOlustur(d, { eposta: 'test@ornek.com', gun: 60, not: 'demo MT5' }, T0);
  assert.match(k.anahtar, ANAHTAR_RE);
  assert.equal(k.musteri, null);
  assert.equal(k.durum, 'active');
  assert.ok(k.abonelik.startsWith('beta-'));
  assert.equal(k.bitis, Math.floor(T0 / 1000) + 60 * 86400);
  assert.deepEqual(k.urunler, ['kopru']);
  const r = await lisansIsle(d, SIR, k.anahtar, '12345', 'kopru', T0);
  assert.equal(r.durum, 200);
  assert.equal(r.govde.split('|')[3], String(k.bitis));
  await d.yaz('eklenti:kopru', JSON.stringify({ dosya: 'KalibreKopru.ex5', surum: 'b', sha256: '', b64: 'AA==' }));
  await d.yaz('eklenti:motor', JSON.stringify({ dosya: 'KalibreMotor.ex5', surum: 'b', sha256: '', b64: 'AA==' }));
  assert.equal((await eklentiIndir(d, k.anahtar, 'kopru', T0)).durum, 200);
});

test('beta lisansı Motor\'u kapsamaz: lisans ve indirme 403, açık mesajla; ücretli abonelik hepsini kapsar', async () => {
  const d = bellekDepo();
  const k = await betaOlustur(d, { eposta: 'test@ornek.com', gun: 60 }, T0);
  await d.yaz('eklenti:motor', JSON.stringify({ dosya: 'KalibreMotor.ex5', surum: 'b', sha256: '', b64: 'AA==' }));
  const l = await lisansIsle(d, SIR, k.anahtar, '12345', 'motor', T0);
  assert.equal(l.durum, 403);
  assert.match(l.govde, /Kalibre Motor için tam abonelik gerekir/);
  const i = await eklentiIndir(d, k.anahtar, 'motor', T0);
  assert.equal(i.durum, 403);
  const { cevir } = await import('../api/_lib/dil.ts');
  assert.match(cevir(l.govde, 'en'), /Kalibre Engine needs a full subscription/);
  // Hesap Motor isteğiyle bağlanmaz (reddedilen istek hesap sınırını tüketmez).
  assert.deepEqual(JSON.parse(await d.oku(`lisans:${k.anahtar}`)).hesaplar, []);
  // urunler alanı olmayan (ücretli) kayıt her iki ürünü kapsar.
  await d.yaz('lisans:KLM-BBBBB-BBBBB-BBBBB-BBBBB', JSON.stringify({ anahtar: 'KLM-BBBBB-BBBBB-BBBBB-BBBBB', abonelik: 'sub_9', durum: 'active', bitis: Math.floor(T0 / 1000) + 86400, hesaplar: [] }));
  assert.equal((await lisansIsle(d, SIR, 'KLM-BBBBB-BBBBB-BBBBB-BBBBB', '777', 'motor', T0)).durum, 200);
  assert.equal((await eklentiIndir(d, 'KLM-BBBBB-BBBBB-BBBBB-BBBBB', 'motor', T0)).durum, 200);
});

test('listele, uzat, iptal', async () => {
  const d = bellekDepo();
  const a = await betaOlustur(d, { eposta: 'a@ornek.com', gun: 10 }, T0);
  await betaOlustur(d, { eposta: 'b@ornek.com', gun: 20 }, T0);
  assert.equal((await betaListele(d)).length, 2);
  const u = await betaUzat(d, a.anahtar.toLowerCase(), 5, T0);
  assert.equal(u.bitis, a.bitis + 5 * 86400);
  const i = await betaIptal(d, a.anahtar, T0 + 1000);
  assert.equal(i.durum, 'canceled');
  assert.equal(i.bitis, Math.floor((T0 + 1000) / 1000));
  // İptal edilen lisansla indirme reddedilir; lisans ucu geçmiş bitişle döner.
  assert.equal((await eklentiIndir(d, a.anahtar, 'kopru', T0 + 5000)).durum, 403);
  // Süresi geçmiş lisansı uzatmak bugünden başlar.
  const yeni = await betaUzat(d, a.anahtar, 7, T0 + 10 * 86400 * 1000);
  assert.equal(yeni.bitis, Math.floor(T0 / 1000) + 10 * 86400 + 7 * 86400);
  assert.equal(yeni.durum, 'active');
});

test('hatalı girdiler ve Stripe kayıtlarına dokunmama', async () => {
  const d = bellekDepo();
  await assert.rejects(betaOlustur(d, { eposta: 'yanlis', gun: 10 }), /e-posta/);
  await assert.rejects(betaOlustur(d, { eposta: 'a@b.co', gun: 0 }), /gün/);
  await assert.rejects(betaUzat(d, 'KLM-00000-00000-00000-00000', 5), /bulunamadı/);
  await assert.rejects(betaIptal(d, 'yanlis'), /biçimi/);
  await d.yaz('lisans:KLM-AAAAA-AAAAA-AAAAA-AAAAA', JSON.stringify({ anahtar: 'KLM-AAAAA-AAAAA-AAAAA-AAAAA', abonelik: 'sub_1', durum: 'active', bitis: 1, hesaplar: [] }));
  await assert.rejects(betaIptal(d, 'KLM-AAAAA-AAAAA-AAAAA-AAAAA'), /beta lisansı değil/);
});
