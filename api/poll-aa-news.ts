// Cron-tetikli endpoint: AA Finans ekonomi RSS'i çeker, yeni haber varsa
// sınıflandırır, kabul edilenler için 4-model tartışmasını başlatır,
// sonucu Blob'a yazar ve latest.json'a iliştirir.
//
// cron-job.org'dan her 5 dakikada bir POST atılır.
// CRON_SECRET header'da: x-cron-secret: <CRON_SECRET>

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchAAEconomyRss } from './_lib/rss.js';
import { runWatchlistPoll } from './poll-watchlist-news.js';
import { classify } from './_lib/classifier.js';
import { runDebate } from './_lib/debate.js';
import {
  readSeenNews,
  writeSeenNews,
  writeDiscussion,
  readLatest,
  writeLatest,
  makeId,
  slugify,
  type Discussion,
  type LatestEntry,
} from './_lib/blob.js';

export const config = {
  maxDuration: 60, // Hobby max
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth: CRON_SECRET header zorunlu
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const t0 = Date.now();
    const items = await fetchAAEconomyRss();
    // Debug: ?reset_seen=1 ile seen listesini sıfırla (yeniden işlenebilsin)
    let seen = await readSeenNews();
    if (req.query.reset_seen === '1') {
      seen = new Set();
      await writeSeenNews(seen);
    }

    // Yeni haberleri filtrele (görülmemiş)
    const newItems = items.filter((it) => !seen.has(it.guid));

    if (newItems.length === 0) {
      // Boş turda kalan süreyi takip listesi taramasına ver (piggyback).
      const watch = await runWatchlistPoll().catch(() => null);
      return res.status(200).json({
        ok: true,
        message: 'no new items',
        rss_total: items.length,
        watch,
        elapsed: Date.now() - t0,
      });
    }

    // En yeni 1 haberi işleyelim (her cron tetiğinde 1 tartışma).
    // Eski haberler de "seen"e işlenir ki bir daha denenmesin.
    // newItems sıra: RSS sırası (yeniden eskiye).
    let processed: any = null;
    const newlySeen = new Set<string>();

    for (const item of newItems) {
      newlySeen.add(item.guid);
      const cls = await classify(item);
      if (!cls.accepted) {
        // sirket veya onemsiz: atla, seen'e yaz
        continue;
      }
      // Kabul edildi, tartıştır
      const slug = slugify(item.title);
      const id = makeId(item.pubDate, slug);
      const messages = await runDebate(item, cls.category);

      const discussion: Discussion = {
        id,
        slug,
        newsId: item.guid,
        newsTitle: item.title,
        newsDesc: item.description,
        newsLink: item.link,
        newsImage: item.image,
        newsPub: item.pubDate,
        category: cls.category,
        messages,
        status: 'closed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const url = await writeDiscussion(discussion);

      // Latest'a ekle
      const latest = await readLatest();
      const entry: LatestEntry = {
        id,
        slug,
        title: item.title,
        category: cls.category,
        status: 'closed',
        createdAt: discussion.createdAt,
        updatedAt: discussion.updatedAt,
        messageCount: messages.length,
      };
      // Aynı id varsa güncelle, yoksa başa ekle
      const filtered = latest.filter((e) => e.id !== id);
      filtered.unshift(entry);
      await writeLatest(filtered);

      processed = { id, title: item.title, category: cls.category, url };
      break; // bu cron'da bir tartışma yeter
    }

    // Görülen haberleri kaydet
    const merged = new Set([...seen, ...newlySeen]);
    await writeSeenNews(merged);

    // Süre kaldıysa takip listesi taraması (60s Hobby limitine dikkat).
    const watch = Date.now() - t0 < 25_000 ? await runWatchlistPoll().catch(() => null) : null;

    return res.status(200).json({
      ok: true,
      processed,
      rss_total: items.length,
      new_items: newItems.length,
      newly_seen: newlySeen.size,
      watch,
      elapsed: Date.now() - t0,
    });
  } catch (e: any) {
    console.error('poll-aa-news error:', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
