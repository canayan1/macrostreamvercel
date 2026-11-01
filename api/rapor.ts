// Sealed report store (kalibre-lab/lab/src/report/muhur.js). A report page shared as a link:
// the browser encrypts the report with a key that stays in the link's #fragment; this end keeps
// only the sealed envelope for 30 days and cannot read it. No account, no IP, no body in logs.
//
// POST /api/rapor            body { v: 1, n, c }   → 200 { id }
// GET  /api/rapor?id=<id>                           → 200 envelope | 404
//
// Rate limit: 60 posts an hour per salted IP hash (hash lives 1 hour, as in talep.ts).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { type Depo, depoSec } from './_lib/depo.ts';
import { ipOzeti } from './_lib/talep.ts';

export const config = { maxDuration: 10 };

export const SINIR = { karakter: 1_500_000, ttlSn: 30 * 86400, saatlik: 60 };
export const ID_RE = /^[0-9a-f]{24}$/;

export function zarfDenetle(z: any): { zarf?: { v: 1; n: string; c: string }; hata?: string } {
  if (!z || typeof z !== 'object' || Array.isArray(z)) return { hata: 'zarf bir JSON nesnesi olmalı' };
  if (z.v !== 1) return { hata: 'desteklenmeyen zarf sürümü' };
  if (typeof z.n !== 'string' || !/^[0-9a-f]{24}$/.test(z.n)) return { hata: 'nonce hatalı' };
  if (typeof z.c !== 'string' || !z.c.length || z.c.length > SINIR.karakter || !/^[A-Za-z0-9+/]+={0,2}$/.test(z.c)) return { hata: 'şifreli metin hatalı ya da çok büyük' };
  return { zarf: { v: 1, n: z.n, c: z.c } };
}

export async function yaz(depo: Depo, govde: unknown, ip: string, simdi = Date.now()) {
  const d = zarfDenetle(govde);
  if (!d.zarf) return { durum: 400, govde: { hata: d.hata } };
  const n = await depo.say(`rapor-hiz:${ipOzeti(ip || 'yok')}:${Math.floor(simdi / 3600000)}`, 3600);
  if (n > SINIR.saatlik) return { durum: 429, govde: { hata: 'çok sık paylaşım' } };
  const id = randomBytes(12).toString('hex');
  await depo.yaz(`rapor:${id}`, JSON.stringify(d.zarf), SINIR.ttlSn);
  return { durum: 200, govde: { id } };
}

export async function oku(depo: Depo, id: string) {
  if (!ID_RE.test(id)) return { durum: 400, govde: { hata: 'kimlik hatalı' } };
  const v = await depo.oku(`rapor:${id}`);
  return v ? { durum: 200, ham: v } : { durum: 404, govde: { hata: 'yok ya da süresi dolmuş' } };
}

function istemciIp(h: VercelRequest['headers'], yedek: string): string {
  const ilk = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? '').split(',')[0].trim();
  return ilk(h['x-real-ip']) || ilk(h['x-forwarded-for']) || yedek;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const depo = depoSec();
  if (!depo) return res.status(503).json({ hata: 'depo yapılandırılmamış' });
  try {
    if (req.method === 'POST') {
      let govde: unknown = req.body;
      if (typeof govde === 'string') { try { govde = JSON.parse(govde); } catch { return res.status(400).json({ hata: 'gövde JSON değil' }); } }
      const r = await yaz(depo, govde, istemciIp(req.headers, (req.socket as any)?.remoteAddress ?? ''));
      return res.status(r.durum).json(r.govde);
    }
    if (req.method !== 'GET') return res.status(405).json({ hata: 'yalnız GET ve POST' });
    const r = await oku(depo, String(req.query.id ?? ''));
    if (r.ham !== undefined) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(200).send(r.ham); }
    return res.status(r.durum).json(r.govde);
  } catch {
    return res.status(502).json({ hata: 'depo geçici olarak kullanılamıyor' });
  }
}
