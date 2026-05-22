// AA Finans ekonomi RSS parser. Regex tabanlı, dependency yok.

export type NewsItem = {
  guid: string;
  link: string;
  title: string;
  description: string;
  pubDate: string;
  image?: string;
};

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
    if (guid && title) {
      items.push({ guid, link, title, description, pubDate, image });
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
