// Vercel Blob wrapper. Discussion ve seen-news state'i burada saklanır.

import { put, list } from '@vercel/blob';

export type Message = {
  role: string; // role key
  name: string; // display name
  icon: string;
  text: string;
  ts: number;
};

export type Discussion = {
  id: string;
  slug: string;
  newsId: string;
  newsTitle: string;
  newsDesc: string;
  newsLink: string;
  newsImage?: string;
  newsPub: string;
  category: string; // makro/sektörel/jeopolitik vs
  messages: Message[];
  status: 'active' | 'closed';
  createdAt: number;
  updatedAt: number;
};

const PUBLIC_BASE = process.env.BLOB_PUBLIC_BASE || ''; // pulled from BLOB_STORE_ID env on first write

export async function readSeenNews(): Promise<Set<string>> {
  try {
    const { blobs } = await list({ prefix: 'state/seen-news.json' });
    const meta = blobs.find((b) => b.pathname === 'state/seen-news.json');
    if (!meta) return new Set();
    const resp = await fetch(meta.url, { cache: 'no-store' });
    if (!resp.ok) return new Set();
    const data = (await resp.json()) as string[];
    return new Set(data);
  } catch (e) {
    return new Set();
  }
}

export async function writeSeenNews(ids: Set<string>): Promise<void> {
  // Keep last 500 to bound size
  const arr = Array.from(ids).slice(-500);
  await put('state/seen-news.json', JSON.stringify(arr), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export async function writeDiscussion(d: Discussion): Promise<string> {
  const path = `discussions/${d.id}.json`;
  const { url } = await put(path, JSON.stringify(d, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 30,
  });
  return url;
}

export async function readDiscussion(id: string): Promise<Discussion | null> {
  try {
    const { blobs } = await list({ prefix: `discussions/${id}.json` });
    const meta = blobs.find((b) => b.pathname === `discussions/${id}.json`);
    if (!meta) return null;
    const resp = await fetch(meta.url, { cache: 'no-store' });
    if (!resp.ok) return null;
    return (await resp.json()) as Discussion;
  } catch {
    return null;
  }
}

export type LatestEntry = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
};

export async function readLatest(): Promise<LatestEntry[]> {
  try {
    const { blobs } = await list({ prefix: 'state/latest.json' });
    const meta = blobs.find((b) => b.pathname === 'state/latest.json');
    if (!meta) return [];
    const resp = await fetch(meta.url, { cache: 'no-store' });
    if (!resp.ok) return [];
    return (await resp.json()) as LatestEntry[];
  } catch {
    return [];
  }
}

export async function writeLatest(entries: LatestEntry[]): Promise<void> {
  // Keep last 50
  const trimmed = entries.slice(0, 50);
  await put('state/latest.json', JSON.stringify(trimmed), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 15,
  });
}

export function makeId(pubDate: string, slug: string): string {
  // e.g. "2026-05-21-petrol-iran-anlasmasi"
  const d = new Date(pubDate);
  const date = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  return `${date}-${slug}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
