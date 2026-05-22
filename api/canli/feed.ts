// GET /api/canli/feed → son tartışmaların listesi (latest.json)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readLatest } from '../_lib/blob.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const latest = await readLatest();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ items: latest });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
