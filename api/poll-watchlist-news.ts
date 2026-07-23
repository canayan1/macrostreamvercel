// Takip listesi haber tarayıcısı (BIST 30).
// Her çağrıda rotasyonla 6 sembol işlenir → 5 dk'lık cron ile tam liste ~25 dk'da döner.
// Akış: Google News RSS → dedupe (Blob seen) → en yeni 2/sembol → LLM kısa özet+duygu
// (tur başına en çok 8 LLM çağrısı; özet başarısız olursa haber özetsiz kaydedilir).
// Tetik: poll-aa-news içinden piggyback (ayrı cron kurulumu gerekmez) veya
// doğrudan POST + x-cron-secret.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchGoogleNewsRss } from './_lib/rss.js';
import { groqLlama, gemini } from './_lib/models.js';
import { WATCHLIST } from './_lib/watchlist.js';
import {
  readWatchSeen, writeWatchSeen,
  readWatchCursor, writeWatchCursor,
  readWatchNews, writeWatchNews,
  type WatchNewsItem,
} from './_lib/watchnews.js';

const BATCH = 6;          // sembol / tur
const PER_SYM = 2;        // yeni haber / sembol
const LLM_CAP = 8;        // LLM çağrısı / tur

async function summarize(title: string): Promise<{ summary?: string; sentiment?: WatchNewsItem['sentiment'] }> {
  const prompt =
    `Haber başlığı: ${title}\n\n` +
    `Bu haberi yatırımcı için 1 kısa cümlede Türkçe özetle ve duygu etiketle. ` +
    `SADECE şu JSON'u döndür: {"ozet":"...","duygu":"pozitif|negatif|nötr"}`;
  try {
    let raw: string;
    try { raw = await groqLlama([{ role: 'user', content: prompt }], 150); }
    catch { raw = await gemini([{ role: 'user', content: prompt }], 150); }
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return {};
    const j = JSON.parse(m[0]);
    const duygu = ['pozitif', 'negatif', 'nötr'].includes(j.duygu) ? j.duygu : undefined;
    return { summary: typeof j.ozet === 'string' ? j.ozet.slice(0, 240) : undefined, sentiment: duygu };
  } catch {
    return {};
  }
}

export async function runWatchlistPoll(): Promise<{ scanned: string[]; added: number }> {
  const cursor = await readWatchCursor();
  const batch = Array.from({ length: BATCH }, (_, k) => WATCHLIST[(cursor + k) % WATCHLIST.length]);

  const seen = await readWatchSeen();
  const fresh: WatchNewsItem[] = [];

  for (const w of batch) {
    try {
      const items = await fetchGoogleNewsRss(w.q);
      const news = items
        .filter((it) => !seen.has(it.guid))
        .slice(0, PER_SYM);
      for (const it of news) {
        const ts = Date.parse(it.pubDate) || Date.now();
        fresh.push({
          guid: it.guid, sym: w.sym, name: w.name,
          title: it.title, link: it.link, source: it.source,
          pub: it.pubDate, ts,
        });
        seen.add(it.guid);
      }
    } catch {
      // tek sembol hatası turu düşürmesin
    }
  }

  // LLM özetleri (sınırlı)
  let llmUsed = 0;
  for (const f of fresh) {
    if (llmUsed >= LLM_CAP) break;
    const { summary, sentiment } = await summarize(f.title);
    if (summary) { f.summary = summary; f.sentiment = sentiment; }
    llmUsed++;
  }

  if (fresh.length > 0) {
    const all = await readWatchNews();
    await writeWatchNews([...fresh, ...all]);
  }
  await writeWatchSeen(seen);
  await writeWatchCursor((cursor + BATCH) % WATCHLIST.length);

  return { scanned: batch.map((b) => b.sym), added: fresh.length };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const result = await runWatchlistPoll();
    return res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e).slice(0, 300) });
  }
}
