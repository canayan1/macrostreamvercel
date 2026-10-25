// Kapalı beta lisansları: Stripe olmadan, elle verilen süreli lisans kayıtları.
// Kayıt biçimi api/_lib/lisans.ts'teki Kayit ile aynıdır; lisans ucu ve eklentiler farkı görmez.
// Depo anahtar taraması desteklemediği için beta kayıtları ayrıca bir dizinde tutulur.

import { randomBytes } from 'node:crypto';
import { anahtarUret, ANAHTAR_RE } from '../api/_lib/lisans.ts';

const DIZIN = 'lisans-beta-dizin';
const GUN = 86400;

async function dizinOku(d) {
  const v = await d.oku(DIZIN);
  return v ? JSON.parse(v) : [];
}

async function kayitOku(d, anahtar) {
  const v = await d.oku(`lisans:${anahtar}`);
  return v ? JSON.parse(v) : null;
}

// Kapalı betada testerlar yalnız Köprü'yü (okuma) kullanır; Motor (otomatik işlem) betada yok.
export const BETA_URUNLER = ['kopru'];

export async function betaOlustur(d, { eposta, gun = 60, not = '' }, simdi = Date.now()) {
  if (!eposta || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) throw new Error('geçerli bir e-posta gerekli (--eposta)');
  if (!Number.isInteger(gun) || gun < 1 || gun > 365) throw new Error('gün 1-365 arası tam sayı olmalı (--gun)');
  const sn = Math.floor(simdi / 1000);
  let anahtar;
  do { anahtar = anahtarUret(); } while (await kayitOku(d, anahtar));
  const kayit = {
    anahtar, eposta, musteri: null, abonelik: `beta-${randomBytes(6).toString('hex')}`,
    durum: 'active', bitis: sn + gun * GUN, hesaplar: [], olusturma: sn, urunler: BETA_URUNLER, beta: true, not,
  };
  await d.yaz(`lisans:${anahtar}`, JSON.stringify(kayit));
  const dizin = await dizinOku(d);
  dizin.push(anahtar);
  await d.yaz(DIZIN, JSON.stringify(dizin));
  return kayit;
}

export async function betaListele(d) {
  const out = [];
  for (const a of await dizinOku(d)) {
    const k = await kayitOku(d, a);
    if (k) out.push(k);
  }
  return out;
}

function anahtarDenetle(anahtar) {
  const a = String(anahtar ?? '').trim().toUpperCase();
  if (!ANAHTAR_RE.test(a)) throw new Error('anahtar biçimi hatalı (--anahtar KLM-XXXXX-XXXXX-XXXXX-XXXXX)');
  return a;
}

async function betaKaydi(d, anahtar) {
  const k = await kayitOku(d, anahtarDenetle(anahtar));
  if (!k) throw new Error('anahtar bulunamadı');
  if (!k.beta) throw new Error('bu bir beta lisansı değil; Stripe aboneliklerine bu araçla dokunulmaz');
  return k;
}

// Süreyi uzatır: bitiş geçmişteyse bugünden, değilse mevcut bitişten itibaren.
export async function betaUzat(d, anahtar, gun, simdi = Date.now()) {
  if (!Number.isInteger(gun) || gun < 1 || gun > 365) throw new Error('gün 1-365 arası tam sayı olmalı (--gun)');
  const k = await betaKaydi(d, anahtar);
  const sn = Math.floor(simdi / 1000);
  k.bitis = Math.max(k.bitis, sn) + gun * GUN;
  k.durum = 'active';
  await d.yaz(`lisans:${k.anahtar}`, JSON.stringify(k));
  return k;
}

export async function betaIptal(d, anahtar, simdi = Date.now()) {
  const k = await betaKaydi(d, anahtar);
  k.bitis = Math.floor(simdi / 1000);
  k.durum = 'canceled';
  await d.yaz(`lisans:${k.anahtar}`, JSON.stringify(k));
  return k;
}
