// Abonelere MT5 eklentisi (.ex5) verir. Anahtar URL'de görünmesin diye POST ile gelir.
// POST /api/indir  { anahtar, eklenti: 'kopru' | 'motor' }  → dosya | { hata }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dilUygula } from './_lib/dil.ts';
import { depoSec } from './_lib/depo.ts';
import { eklentiIndir } from './_lib/lisans.ts';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dil = dilUygula(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ hata: 'yalnız POST' });
  const depo = depoSec();
  if (!depo) return res.status(503).json({ hata: 'İndirme henüz açılmadı.' });
  let g: any = req.body;
  if (typeof g === 'string') { try { g = JSON.parse(g); } catch { g = {}; } }
  try {
    const r = await eklentiIndir(depo, String(g?.anahtar ?? ''), String(g?.eklenti ?? ''));
    if (r.durum !== 200) return res.status(r.durum).json({ hata: r.hata });
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${r.dosya}"`);
    res.setHeader('X-Kalibre-Surum', r.surum ?? '');
    res.setHeader('X-Kalibre-Sha256', r.sha256 ?? '');
    return res.status(200).send(r.veri);
  } catch {
    return res.status(502).json({ hata: 'İndirme geçici olarak kullanılamıyor.' });
  }
}
