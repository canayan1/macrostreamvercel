// MT5 lisans ucu (protokol v1, kalibre-lab/docs/lisans.md). Kalibre Motor açılışta ve 6 saatte
// bir sorar: GET /api/lisans?anahtar=&hesap=&urun=motor&surum=1
// 200: "v1|urun|hesap|bitis|imza" (düz metin)   4xx: kullanıcıya gösterilecek kısa Türkçe mesaj

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { depoSec } from './_lib/depo.ts';
import { lisansIsle } from './_lib/lisans.ts';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).send('Yalnız GET.');
  const depo = depoSec();
  const sir = process.env.KALIBRE_LISANS_SIRRI;
  if (!depo || !sir) return res.status(503).send('Lisans sunucusu yapılandırılmamış.');
  const q = (k: string) => String(req.query[k] ?? '');
  try {
    const r = await lisansIsle(depo, sir, q('anahtar'), q('hesap'), q('urun') || 'motor');
    return res.status(r.durum).send(r.govde);
  } catch {
    return res.status(502).send('Lisans sunucusu geçici olarak kullanılamıyor.');
  }
}
