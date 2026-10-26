// Talep testi (docs/TALEP-TESTI.md): iki segment sayfasının (/rule-guard, /mt5-analytics) ölçümü.
// Ödeme yok; yalnız sayaç ve erken erişim formu. Ham IP saklanmaz: hız sınırı anahtarında IP'nin
// tuzlu özeti kullanılır ve en çok 1 saat yaşar. E-posta yalnız açık onayla saklanır.
//
// Anahtarlar (Upstash):
//   talep:sayac:<gün>|<sayfa>|<varyant>|<olay>|<kaynak>|<dil>   sayaç, 400 gün
//   talep:kayit:<sayfa>:<e-posta özeti>                         form kaydı (JSON), 395 gün (13 ay; gizlilik 2.10 ve 5)
//   talep:hiz:<ip özeti>:<dakika> / talep:hiz-form:<ip özeti>:<saat>   hız sınırı, 2 dk / 1 sa

import { createHash } from 'node:crypto';
import type { Depo } from './depo.ts';

export const SAYFALAR = ['rule-guard', 'mt5-analytics'] as const;
export const OLAYLAR = ['goruntuleme', 'fiyat-tik', 'form-gonder'] as const;
export const SINIR = { olayDakika: 60, formSaat: 5, metin: 300 };
export const SURE = { sayac: 400 * 86400, kayit: 395 * 86400 };
// Formdaki onay kutusunun metni değişirse sürüm artırılır; kayıtta hangi metnin onaylandığı görünür.
export const ONAY_SURUMU = '2026-10-26-1';

type Sayfa = typeof SAYFALAR[number];

// Her sayfanın üç anket sorusu: seçmeli sorular izinli değerlerle, açık uçlu sorular kısa metinle.
const SORULAR: Record<Sayfa, Record<string, readonly string[] | 'metin'>> = {
  'rule-guard': {
    firma: ['ftmo', 'fundednext', 'fundingpips', 'the5ers', 'topstep', 'diger', 'yok'],
    sinav: ['0', '1', '2-3', '4-10', '10+'],
    simdi: 'metin',
  },
  'mt5-analytics': {
    platform: ['mt5', 'mt4', 'ctrader', 'tradingview', 'diger'],
    simdi: ['myfxbook', 'fxblue', 'gunluk', 'tablo', 'hicbiri', 'diger'],
    odeme: 'metin',
  },
};

export function ipOzeti(ip: string, tuz = process.env.TALEP_TUZ ?? 'kalibre-talep'): string {
  return createHash('sha256').update(`${tuz}|${ip}`).digest('hex').slice(0, 16);
}

const kisa = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);

export function kaynakTemizle(v: unknown): string {
  const s = String(v ?? '').toLowerCase().trim();
  if (!s) return 'dogrudan';
  return /^[a-z0-9][a-z0-9-]{0,31}$/.test(s) ? s : 'diger';
}

const EPOSTA_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,24}$/i;

export type Sonuc = { durum: number; govde?: Record<string, unknown> };

export async function talepIsle(depo: Depo, govde: unknown, ip: string, simdi = Date.now()): Promise<Sonuc> {
  if (!govde || typeof govde !== 'object' || Array.isArray(govde)) return { durum: 400, govde: { hata: 'govde' } };
  const g = govde as Record<string, unknown>;
  // Bot tuzağı: görünmez alan doluysa kayıt yapılmaz ama başarı döner.
  if (kisa(g.web, 10)) return { durum: 204 };

  const sayfa = String(g.sayfa ?? '') as Sayfa;
  if (!SAYFALAR.includes(sayfa)) return { durum: 400, govde: { hata: 'sayfa' } };
  const olay = String(g.olay ?? '');
  if (!(OLAYLAR as readonly string[]).includes(olay)) return { durum: 400, govde: { hata: 'olay' } };
  const varyant = String(g.varyant ?? '');
  if (varyant !== 'a' && varyant !== 'b') return { durum: 400, govde: { hata: 'varyant' } };
  const dil = g.dil === 'tr' ? 'tr' : 'en';
  const kaynak = kaynakTemizle(g.kaynak);

  const oz = ipOzeti(ip || 'yok');
  const dakika = Math.floor(simdi / 60000);
  if ((await depo.say(`talep:hiz:${oz}:${dakika}`, 120)) > SINIR.olayDakika) return { durum: 429, govde: { hata: 'hiz' } };

  const gun = new Date(simdi).toISOString().slice(0, 10);
  const sayac = () => depo.say(`talep:sayac:${gun}|${sayfa}|${varyant}|${olay}|${kaynak}|${dil}`, SURE.sayac);

  if (olay !== 'form-gonder') {
    await sayac();
    return { durum: 204 };
  }

  const saat = Math.floor(simdi / 3600000);
  if ((await depo.say(`talep:hiz-form:${oz}:${saat}`, 3600)) > SINIR.formSaat) return { durum: 429, govde: { hata: 'hiz' } };

  const eposta = kisa(g.eposta, 254).toLowerCase();
  if (!EPOSTA_RE.test(eposta)) return { durum: 400, govde: { hata: 'eposta' } };
  // E-posta yalnız açık onayla saklanır; onay kutusu varsayılan olarak boştur.
  if (g.onay !== true) return { durum: 400, govde: { hata: 'onay' } };

  const gelen = (g.cevaplar && typeof g.cevaplar === 'object' && !Array.isArray(g.cevaplar)) ? g.cevaplar as Record<string, unknown> : {};
  const cevaplar: Record<string, string> = {};
  for (const [ad, kural] of Object.entries(SORULAR[sayfa])) {
    const v = gelen[ad];
    if (v === undefined || v === null || v === '') continue;
    if (kural === 'metin') cevaplar[ad] = kisa(v, SINIR.metin);
    else if (kural.includes(String(v))) cevaplar[ad] = String(v);
    else return { durum: 400, govde: { hata: 'cevap', alan: ad } };
  }

  const kayit = {
    eposta, sayfa, varyant, kaynak, dil, cevaplar,
    onay: true, onaySurumu: ONAY_SURUMU, zaman: new Date(simdi).toISOString(),
  };
  const anahtar = `talep:kayit:${sayfa}:${createHash('sha256').update(eposta).digest('hex').slice(0, 32)}`;
  // Aynı kişi aynı sayfada yeniden gönderirse cevaplar güncellenir ama dönüşüm iki kez sayılmaz.
  const yeni = await depo.yazYoksa(anahtar, JSON.stringify(kayit), SURE.kayit);
  if (yeni) await sayac();
  else await depo.yaz(anahtar, JSON.stringify(kayit), SURE.kayit);
  return { durum: 200, govde: { tamam: true, yeni } };
}

// Özet (yerel/talep-ozet.mjs): sayaç anahtarlarını sayfa/varyant/kaynak kırılımında toplar.
export type Sayac = { gun: string; sayfa: string; varyant: string; olay: string; kaynak: string; dil: string; n: number };

export function sayacCoz(anahtar: string, deger: unknown): Sayac | null {
  const m = /^talep:sayac:(\d{4}-\d{2}-\d{2})\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)$/.exec(anahtar);
  if (!m) return null;
  return { gun: m[1], sayfa: m[2], varyant: m[3], olay: m[4], kaynak: m[5], dil: m[6], n: Number(deger) || 0 };
}

export type Satir = { anahtar: string; goruntuleme: number; fiyatTik: number; form: number; fiyatOrani: number | null; donusum: number | null };

export function huniOzetle(sayaclar: Sayac[], kirilim: (s: Sayac) => string): Satir[] {
  const t = new Map<string, { goruntuleme: number; fiyatTik: number; form: number }>();
  for (const s of sayaclar) {
    const k = kirilim(s);
    const x = t.get(k) ?? { goruntuleme: 0, fiyatTik: 0, form: 0 };
    if (s.olay === 'goruntuleme') x.goruntuleme += s.n;
    else if (s.olay === 'fiyat-tik') x.fiyatTik += s.n;
    else if (s.olay === 'form-gonder') x.form += s.n;
    t.set(k, x);
  }
  return [...t.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([anahtar, x]) => ({
    anahtar, ...x,
    fiyatOrani: x.goruntuleme ? x.fiyatTik / x.goruntuleme : null,
    donusum: x.goruntuleme ? x.form / x.goruntuleme : null,
  }));
}

const csvAlan = (v: unknown) => {
  const s = String(v ?? '');
  // Tablo programlarında formül olarak çalışmasın diye =, +, -, @ ile başlayan değerler kaçırılır.
  const g = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(g) ? `"${g.replace(/"/g, '""')}"` : g;
};

export function kayitlarCsv(kayitlar: Record<string, any>[]): string {
  const soru = [...new Set(kayitlar.flatMap(k => Object.keys(k.cevaplar ?? {})))].sort();
  const bas = ['zaman', 'sayfa', 'varyant', 'kaynak', 'dil', 'eposta', 'onaySurumu', ...soru];
  const satirlar = kayitlar
    .slice().sort((a, b) => String(a.zaman).localeCompare(String(b.zaman)))
    .map(k => [k.zaman, k.sayfa, k.varyant, k.kaynak, k.dil, k.eposta, k.onaySurumu, ...soru.map(s => k.cevaplar?.[s] ?? '')].map(csvAlan).join(','));
  return [bas.join(','), ...satirlar].join('\n') + '\n';
}
