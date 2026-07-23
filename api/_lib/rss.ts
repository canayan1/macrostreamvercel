// AA Finans ekonomi RSS parser. Regex tabanlı, dependency yok.

export type NewsItem = {
  guid: string;
  link: string;
  title: string;
  description: string;
  pubDate: string;
  image?: string;
  source?: string; // Google News: <source> yayıncı adı
};

// Google News araması (RSS) — anahtar/hesap gerektirmez.
// Tam metin kopyalamayız: başlık + link + kısa açıklama (telif dostu).
export async function fetchGoogleNewsRss(query: string): Promise<NewsItem[]> {
  const url =
    'https://news.google.com/rss/search?q=' +
    encodeURIComponent(`${query} when:7d`) +
    '&hl=tr&gl=TR&ceid=TR:tr';
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'KalibreMarkets/1.0' },
    cache: 'no-store',
  });
  if (!resp.ok) throw new Error(`Google News RSS failed: ${resp.status}`);
  return parseRss(await resp.text());
}

export async function fetchAAEconomyRss(): Promise<NewsItem[]> {
  const resp = await fetch('https://www.aa.com.tr/tr/rss/default?cat=ekonomi', {
    headers: { 'User-Agent': 'KalibreMarkets/1.0' },
    cache: 'no-store',
  });
  if (!resp.ok) throw new Error(`AA RSS fetch failed: ${resp.status}`);
  const xml = await resp.text();
  return parseRss(xml);
}

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const guid = extract(block, /<guid[^>]*>([\s\S]*?)<\/guid>/);
    const link = extract(block, /<link>([\s\S]*?)<\/link>/);
    const title = decodeEntities(extract(block, /<title>([\s\S]*?)<\/title>/));
    const description = decodeEntities(extract(block, /<description>([\s\S]*?)<\/description>/));
    const pubDate = extract(block, /<pubDate>([\s\S]*?)<\/pubDate>/);
    const image = extract(block, /<image>([\s\S]*?)<\/image>/) || undefined;
    const source = decodeEntities(extract(block, /<source[^>]*>([\s\S]*?)<\/source>/)) || undefined;
    if (guid && title) {
      items.push({ guid, link, title, description, pubDate, image, source });
    }
  }
  return items;
}

function extract(block: string, re: RegExp): string {
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}
