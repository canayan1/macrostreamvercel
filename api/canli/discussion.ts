// GET /api/canli/discussion?id=... → tek bir tartışmanın tam JSON'u

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDiscussion } from '../_lib/blob.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = (req.query.id as string) || '';
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const d = await readDiscussion(id);
    if (!d) return res.status(404).json({ error: 'not found' });
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(d);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
