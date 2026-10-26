// Talep testi ucu: POST /api/talep  {sayfa, varyant, olay, kaynak, dil[, eposta, onay, cevaplar]}
// Mantık ve anahtar düzeni: api/_lib/talep.ts. Yönetim özeti: node yerel/talep-ozet.mjs

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { depoSec } from './_lib/depo.ts';
import { talepIsle } from './_lib/talep.ts';

export const config = { maxDuration: 10 };

export function istemciIp(basliklar: Record<string, string | string[] | undefined>, yedek = ''): string {
  const ilk = (v: string | string[] | undefined) => String(Array.isArray(v) ? v[0] : v ?? '').split(',')[0].trim();
  return ilk(basliklar['x-real-ip']) || ilk(basliklar['x-forwarded-for']) || yedek;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ hata: 'yontem' });
  const depo = depoSec();
  if (!depo) return res.status(503).json({ hata: 'depo' });
  let govde: unknown = req.body;
  // navigator.sendBeacon gövdeyi düz metin olarak gönderir.
  if (typeof govde === 'string') {
    if (govde.length > 4000) return res.status(413).json({ hata: 'boyut' });
    try { govde = JSON.parse(govde); } catch { return res.status(400).json({ hata: 'govde' }); }
  }
  try {
    const r = await talepIsle(depo, govde, istemciIp(req.headers, (req.socket as any)?.remoteAddress ?? ''));
    if (r.durum === 204) return res.status(204).end();
    return res.status(r.durum).json(r.govde ?? {});
  } catch {
    return res.status(502).json({ hata: 'depo' });
  }
}
