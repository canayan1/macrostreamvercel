// Takip listesi haber akışı — herkese açık GET.
// /api/watchlist-news            → tüm akış (en yeni önce, max 50)
// /api/watchlist-news?sym=ASELS  → tek sembol (max 10)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readWatchNews } from './_lib/watchnews.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sym = String(req.query.sym || '').toUpperCase().replace(/[^A-Z]/g, '');
    const limit = Math.min(parseInt(String(req.query.limit || ''), 10) || (sym ? 10 : 50), 50);
    let items = await readWatchNews();
    if (sym) items = items.filter((it) => it.sym === sym);
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ items: items.slice(0, limit) });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e).slice(0, 200) });
  }
}
