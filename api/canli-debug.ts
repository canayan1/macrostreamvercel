// Debug: 30 haber için sınıflandırma sonuçlarını döner.
// CRON_SECRET zorunlu.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchAAEconomyRss } from './_lib/rss.js';
import { classify } from './_lib/classifier.js';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const items = await fetchAAEconomyRss();
    const top10 = items.slice(0, 10);
    const verdicts = await Promise.all(
      top10.map(async (it) => {
        try {
          const cls = await classify(it);
          return { title: it.title, accepted: cls.accepted, category: cls.category, reason: cls.reason };
        } catch (e: any) {
          return { title: it.title, error: e?.message || String(e) };
        }
      })
    );
    return res.status(200).json({
      env_check: {
        gemini: !!process.env.GEMINI_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        cerebras: !!process.env.CEREBRAS_API_KEY,
        mistral: !!process.env.MISTRAL_API_KEY,
        cron_secret: !!process.env.CRON_SECRET,
        blob: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
      verdicts,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
