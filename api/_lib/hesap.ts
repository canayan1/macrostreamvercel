// Lisans ↔ kullanıcı hesabı bağlantısı.
//
// Depo (Upstash) lisansın asıl kaydıdır; Supabase'deki `licenses` tablosu yalnız görüntü içindir
// (anahtarın son 5 karakteri, durum, bitiş). Tam anahtar Supabase'e yazılmaz; hesabına giriş yapmış
// kullanıcıya /api/hesap?islem=lisanslar ucundan depodan okunarak verilir.
//
// Depo anahtarları:
//   lisans:<anahtar>.kullanici   Supabase kullanıcı kimliği (uuid)
//   lisans-kullanici:<uuid>      → ["KLM-...", ...]  (kullanıcının lisansları)
//
// Bu dosya lisans.ts'den çalışma anında bir şey içe aktarmaz (döngüsel içe aktarma olmasın).

import { createHash } from 'node:crypto';
import type { Depo } from './depo.ts';
import { servisIstemci, supabaseAyar, uuidMi, type ServisIstemci } from './supabase.ts';

const ANAHTAR_RE = /^KLM(-[0-9A-HJKMNP-TV-Z]{5}){4}$/;
const dizin = (uid: string) => `lisans-kullanici:${uid}`;

async function listeOku(d: Depo, uid: string): Promise<string[]> {
  try { const v = JSON.parse((await d.oku(dizin(uid))) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; }
  catch { return []; }
}

export async function kullaniciyaEkle(d: Depo, uid: string, anahtar: string): Promise<void> {
  if (!uuidMi(uid)) return;
  const l = await listeOku(d, uid);
  if (!l.includes(anahtar)) { l.push(anahtar); await d.yaz(dizin(uid), JSON.stringify(l)); }
}

export async function kullanicidanCikar(d: Depo, uid: string, anahtar: string): Promise<void> {
  const l = await listeOku(d, uid);
  if (l.includes(anahtar)) await d.yaz(dizin(uid), JSON.stringify(l.filter(x => x !== anahtar)));
}

// Kullanıcının lisans kayıtları (kayıt başka hesaba geçmişse atlanır).
export async function kullaniciLisanslari(d: Depo, uid: string): Promise<any[]> {
  const out: any[] = [];
  for (const a of await listeOku(d, uid)) {
    const v = await d.oku(`lisans:${a}`);
    if (!v) continue;
    const k = JSON.parse(v);
    if (k.kullanici === uid) out.push(k);
  }
  return out.sort((x, y) => (y.olusturma ?? 0) - (x.olusturma ?? 0));
}

// Supabase'deki görüntü satırının kimliği: anahtarın özeti (anahtarın kendisi değil).
export const lisansKimligi = (anahtar: string) => createHash('sha256').update(`kalibre-lisans/${anahtar}`).digest('hex').slice(0, 32);

export function aynaSatiri(k: any) {
  return {
    id: lisansKimligi(k.anahtar),
    user_id: k.kullanici,
    product: typeof k.urun === 'string' ? k.urun : 'lab',
    key_hint: String(k.anahtar).slice(-5),
    status: k.durum,
    valid_until: new Date((k.bitis || 0) * 1000).toISOString(),
    addons: Array.isArray(k.urunler) ? k.urunler : ['motor', 'kopru'],
    beta: !!k.beta,
    updated_at: new Date().toISOString(),
  };
}

// Kayıt yazıldıktan sonra Supabase görüntüsünü günceller. En iyi çaba: hata lisans akışını durdurmaz.
export async function lisansAyna(k: any, servis: ServisIstemci | null = servisIstemci(supabaseAyar())): Promise<boolean> {
  if (!servis || !uuidMi(k?.kullanici)) return false;
  try { await servis.upsert('licenses', aynaSatiri(k)); return true; }
  catch (e) { console.log(`lisans aynası: ${(e as Error).message}`); return false; }
}

export type BagSonuc = { durum: number; hata?: string; kayit?: any };

// "Anahtarın var mı? Hesabına bağla": eski ya da davetli beta anahtarını hesaba bağlar.
export async function lisansBagla(d: Depo, anahtarMetni: string, uid: string, simdi = Date.now(), servis: ServisIstemci | null = null): Promise<BagSonuc> {
  if (!uuidMi(uid)) return { durum: 401, hata: 'Önce giriş yap.' };
  const a = String(anahtarMetni ?? '').trim().toUpperCase();
  if (!ANAHTAR_RE.test(a)) return { durum: 400, hata: 'Lisans anahtarı hatalı.' };
  if ((await d.say(`bagla-sinir:${uid}:${Math.floor(simdi / 60000)}`, 120)) > 10) return { durum: 429, hata: 'Çok sık deneme. Bir dakika sonra yeniden dene.' };
  const v = await d.oku(`lisans:${a}`);
  if (!v) return { durum: 404, hata: 'Lisans anahtarı bulunamadı.' };
  const k = JSON.parse(v);
  if (k.kullanici && k.kullanici !== uid) return { durum: 409, hata: 'Bu anahtar başka bir hesaba bağlı. Yanlışlık olduğunu düşünüyorsan bize yaz.' };
  if (k.kullanici !== uid) {
    k.kullanici = uid;
    await d.yaz(`lisans:${a}`, JSON.stringify(k));
  }
  await kullaniciyaEkle(d, uid, a);
  await lisansAyna(k, servis ?? servisIstemci(supabaseAyar()));
  return { durum: 200, kayit: k };
}

// Hesap silinirken: lisans kaydı kalır (ödenmiş dönem sonuna kadar MT5'te çalışır), hesap bağı kalkar.
export async function hesapBaglariniKaldir(d: Depo, uid: string): Promise<number> {
  const l = await kullaniciLisanslari(d, uid);
  for (const k of l) {
    delete k.kullanici;
    await d.yaz(`lisans:${k.anahtar}`, JSON.stringify(k));
  }
  await d.yaz(dizin(uid), '[]');
  return l.length;
}
