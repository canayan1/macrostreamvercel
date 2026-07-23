// Takip listesi haber deposu (Vercel Blob).
// state/watchlist-seen.json  → görülen guid'ler (dedupe)
// state/watchlist-cursor.json → rotasyon imleci (her turda 6 sembol)
// news/watchlist.json         → birleşik haber akışı (en yeni önce, ~200 kayıt)

import { put, list } from '@vercel/blob';

export type WatchNewsItem = {
  guid: string;
  sym: string;      // ASELS
  name: string;     // Aselsan
  title: string;
  link: string;
  source?: string;  // yayıncı (ör. Bloomberg HT)
  pub: string;      // RSS pubDate
  ts: number;       // epoch ms (sıralama)
  summary?: string; // 1-2 cümle LLM özeti
  sentiment?: 'pozitif' | 'negatif' | 'nötr';
};

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const { blobs } = await list({ prefix: path });
    const meta = blobs.find((b) => b.pathname === path);
    if (!meta) return fallback;
    const resp = await fetch(meta.url, { cache: 'no-store' });
    if (!resp.ok) return fallback;
    return (await resp.json()) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await put(path, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export async function readWatchSeen(): Promise<Set<string>> {
  return new Set(await readJson<string[]>('state/watchlist-seen.json', []));
}
export async function writeWatchSeen(ids: Set<string>): Promise<void> {
  await writeJson('state/watchlist-seen.json', Array.from(ids).slice(-2000));
}

export async function readWatchCursor(): Promise<number> {
  return (await readJson<{ i: number }>('state/watchlist-cursor.json', { i: 0 })).i;
}
export async function writeWatchCursor(i: number): Promise<void> {
  await writeJson('state/watchlist-cursor.json', { i });
}

export async function readWatchNews(): Promise<WatchNewsItem[]> {
  return readJson<WatchNewsItem[]>('news/watchlist.json', []);
}
export async function writeWatchNews(items: WatchNewsItem[]): Promise<void> {
  const sorted = [...items].sort((a, b) => b.ts - a.ts).slice(0, 200);
  await writeJson('news/watchlist.json', sorted);
}
