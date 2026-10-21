// Kalibre köprüsü: şifreli röle (protokol v1, kalibre-lab/docs/kopru.md).
//
// MT5'teki Kalibre eklentisi kullanıcının kendi verisini şifreleyip buraya bırakır; Lab
// alıp tarayıcıda çözer. Anahtar yalnız kullanıcıdadır (eşleştirme kodu). Bu uç:
//   - zarfın içini OKUYAMAZ, yalnız biçimini denetler,
//   - kanal ve yuva kimlikleri türetilmiştir; hangi sembolün taşındığını bilmez,
//   - zarfı kısa süreliğine saklar ve sonra kendiliğinden siler,
//   - kimlik, IP ya da hesap bilgisi saklamaz; gövdeyi günlüğe yazmaz.
//
// POST /api/kopru?k=<kanal>&y=<yuva>   gövde: { v, n, u, c, m }  → 204
// GET  /api/kopru?k=<kanal>&y=<yuva>                               → 200 zarf | 404
//
// Depo: Upstash Redis REST (UPSTASH_REDIS_REST_URL/TOKEN ya da KV_REST_API_URL/TOKEN).
// Depo yoksa canlıda 503 döner; Vercel örnekleri belleği paylaşmadığından belleğe düşmek
// veriyi rastgele kaybettirirdi. Yerel geliştirmede KOPRU_BELLEK=1 ile bellek deposu açılır.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

export const SINIR = {
  zarfKarakter: 2_000_000, // ~1 MB açık metin (5000 mumluk seri ~250 KB)
  ttlSn: 2 * 3600,         // saatlik seri güncellemeleri arasında kalsın yeter
  yazmaDakika: 60,         // kanal başına; eklenti 5 sn aralıkla ~25/dk yazar
};
export const KANAL_RE = /^[0-9a-f]{32}$/;
export const YUVA_RE = /^[0-9a-f]{16}$/;

export interface Depo {
  yaz(anahtar: string, deger: string, ttlSn: number): Promise<void>;
  oku(anahtar: string): Promise<string | null>;
  say(anahtar: string, ttlSn: number): Promise<number>; // artırır, yeni değeri döner
}

// Zarfı denetler; geçerliyse yalnız bilinen alanlarla yeniden kurulmuş metnini döner.
export function zarfDenetle(z: any): { metin?: string; hata?: string } {
  if (!z || typeof z !== 'object' || Array.isArray(z)) return { hata: 'zarf bir JSON nesnesi olmalı' };
  if (z.v !== 1) return { hata: 'desteklenmeyen zarf sürümü' };
  if (typeof z.n !== 'string' || !/^[0-9a-f]{24}$/.test(z.n)) return { hata: 'nonce hatalı' };
  if (!Number.isInteger(z.u) || z.u < 0) return { hata: 'uzunluk hatalı' };
  if (typeof z.c !== 'string' || z.c.length !== 2 * z.u || !/^[0-9a-f]*$/.test(z.c)) return { hata: 'şifreli metin hatalı' };
  if (typeof z.m !== 'string' || !/^[0-9a-f]{64}$/.test(z.m)) return { hata: 'mühür hatalı' };
  const metin = JSON.stringify({ v: 1, n: z.n, u: z.u, c: z.c, m: z.m });
  if (metin.length > SINIR.zarfKarakter) return { hata: 'zarf çok büyük' };
  return { metin };
}

export type Sonuc = { durum: number; govde?: unknown; ham?: string };

export async function isle(yontem: string, kanal: string, yuva: string, govde: unknown, depo: Depo, simdi = Date.now()): Promise<Sonuc> {
  if (!KANAL_RE.test(kanal) || !YUVA_RE.test(yuva)) return { durum: 400, govde: { hata: 'kanal ya da yuva hatalı' } };
  const anahtar = `kopru:${kanal}:${yuva}`;

  if (yontem === 'GET') {
    const v = await depo.oku(anahtar);
    return v ? { durum: 200, ham: v } : { durum: 404, govde: { hata: 'yok' } };
  }

  if (yontem === 'POST') {
    const dakika = Math.floor(simdi / 60000);
    const n = await depo.say(`kopru-sinir:${kanal}:${dakika}`, 120);
    if (n > SINIR.yazmaDakika) return { durum: 429, govde: { hata: 'çok sık yazma' } };
    const d = zarfDenetle(govde);
    if (!d.metin) return { durum: 400, govde: { hata: d.hata } };
    await depo.yaz(anahtar, d.metin, SINIR.ttlSn);
    return { durum: 204 };
  }

  return { durum: 405, govde: { hata: 'yalnız GET ve POST' } };
}

// ------------------------------------------------------------------ depolar
export function bellekDepo(): Depo {
  const m = new Map<string, { v: string; bitis: number }>();
  const canli = (k: string) => {
    const x = m.get(k);
    if (x && x.bitis > Date.now()) return x;
    m.delete(k);
    return null;
  };
  return {
    async yaz(k, v, ttl) { m.set(k, { v, bitis: Date.now() + ttl * 1000 }); },
    async oku(k) { return canli(k)?.v ?? null; },
    async say(k, ttl) {
      const x = canli(k);
      const yeni = String(Number(x?.v ?? 0) + 1);
      m.set(k, { v: yeni, bitis: x?.bitis ?? Date.now() + ttl * 1000 });
      return Number(yeni);
    },
  };
}

function upstashDepo(url: string, token: string): Depo {
  const komut = async (cmds: (string | number)[][]) => {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds),
    });
    if (!r.ok) throw new Error(`upstash ${r.status}`);
    return (await r.json()) as { result: unknown }[];
  };
  return {
    async yaz(k, v, ttl) { await komut([['SET', k, v, 'EX', ttl]]); },
    async oku(k) { const [r] = await komut([['GET', k]]); return (r?.result as string) ?? null; },
    async say(k, ttl) { const [r] = await komut([['INCR', k], ['EXPIRE', k, ttl, 'NX']]); return Number(r?.result ?? 0); },
  };
}

let yerelBellek: Depo | null = null;
export function depoSec(): Depo | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return upstashDepo(url, token);
  if (process.env.KOPRU_BELLEK === '1' && process.env.VERCEL !== '1') return (yerelBellek ??= bellekDepo());
  return null;
}

// ------------------------------------------------------------------ uç
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  // Okuma her kökenden serbest: içerik şifreli, kanal kimliği tahmin edilemez.
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(204).end();
  }
  const depo = depoSec();
  if (!depo) return res.status(503).json({ hata: 'röle yapılandırılmamış' });

  // Gövde yalnız yazmada anlamlıdır; GET'te boş metin gelebilir ve yok sayılmalıdır.
  let govde: unknown = req.method === 'POST' ? req.body : undefined;
  if (typeof govde === 'string') {
    try { govde = JSON.parse(govde); } catch { return res.status(400).json({ hata: 'gövde JSON değil' }); }
  }
  try {
    const r = await isle(String(req.method), String(req.query.k ?? ''), String(req.query.y ?? ''), govde, depo);
    if (r.ham !== undefined) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(r.ham);
    }
    if (r.durum === 204) return res.status(204).end();
    return res.status(r.durum).json(r.govde);
  } catch {
    // Depo hatası: ayrıntı istemciye ve günlüğe sızmasın (gövde hiçbir zaman yazılmaz).
    return res.status(502).json({ hata: 'depo geçici olarak kullanılamıyor' });
  }
}
