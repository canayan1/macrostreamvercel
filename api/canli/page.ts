// Tek tartışma için kalıcı URL sayfası.
// /canli/t/:id  →  rewrite  →  /api/canli/page?id=:id
// SSR HTML döner, SEO-friendly.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDiscussion, type Discussion, type Message } from '../_lib/blob.js';

function escapeHtml(s: string): string {
  return String(s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function renderMessage(m: Message): string {
  return `
    <div class="msg ${escapeHtml(m.role)}">
      <div class="who">
        <div class="icon">${escapeHtml(m.icon || '·')}</div>
        <div class="name">${escapeHtml(m.name)}</div>
      </div>
      <div class="text">${escapeHtml(m.text)}</div>
    </div>`;
}

function renderHtml(d: Discussion): string {
  const url = `https://kalibremarkets.com/canli/t/${d.id}`;
  const desc = (d.newsDesc || '').slice(0, 200);
  const msgs = (d.messages || []).map(renderMessage).join('');

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(d.newsTitle)} — Canlı Yorum · Kalibre Markets</title>
<meta name="description" content="${escapeHtml(desc)} 4 yapay zeka modelinin yorumu. Yatırım tavsiyesi değildir.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeHtml(d.newsTitle)} — Kalibre Markets">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="tr_TR">
<meta property="og:image" content="${escapeHtml(d.newsImage || 'https://kalibremarkets.com/og-default.png')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="index, follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #100e0c; --bg-1: #14110e; --surface: #1a1612; --surface-2: #221d18;
  --border: #26221d; --border-2: #36302a; --text: #ebe3d3; --text-dim: #a89c83;
  --muted: #6f6553; --accent: #ffa630; --accent-hot: #ff7a00;
  --green: #4ade80; --red: #ef4444; --blue: #60a5fa; --violet: #a78bfa;
  --grid: rgba(255,166,48,.025);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--bg); color: var(--text);
  font-family: 'Inter Tight', system-ui, sans-serif; font-size: 14px; line-height: 1.55; }
body { background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px); background-size: 48px 48px; }
a { color: inherit; text-decoration: none; }

.cmdbar { display: flex; align-items: center; height: 38px; background: var(--bg-1); border-bottom: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 10px; padding: 0 18px; height: 100%; border-right: 1px solid var(--border); background: linear-gradient(180deg, #1a1612 0%, #0d0c0a 100%); }
.brand-mark { width: 22px; height: 22px; border: 1.5px solid var(--accent); display: flex; align-items: center; justify-content: center; color: var(--accent); font-weight: 800; font-size: 12px; }
.brand-name { font-weight: 700; font-size: 13px; letter-spacing: .12em; }
.brand-name .sub { color: var(--muted); font-weight: 400; margin-left: 6px; }
.cmd-spacer { flex: 1; }
.back { padding: 0 14px; height: 100%; display: flex; align-items: center; color: var(--text-dim); font-size: 11.5px; border-left: 1px solid var(--border); }
.back:hover { color: var(--accent); }

.disclaimer { background: linear-gradient(90deg, rgba(255,166,48,.10), rgba(255,166,48,.02) 60%); border-bottom: 1px solid var(--border-2); padding: 10px 24px; font-size: 11px; color: var(--text-dim); letter-spacing: .04em; }
.disclaimer b { color: var(--accent); }

main { max-width: 900px; margin: 0 auto; padding: 32px 24px 80px; }

.crumb { font-size: 11px; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 16px; }
.crumb a { color: var(--text-dim); }
.crumb a:hover { color: var(--accent); }

.news-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); padding: 20px 22px; margin-bottom: 24px; }
.news-card .cat { color: var(--accent); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
.news-card h1 { font-size: 22px; font-weight: 600; line-height: 1.3; color: var(--text); margin-bottom: 12px; letter-spacing: -.005em; }
.news-card .desc { color: var(--text-dim); font-size: 14px; line-height: 1.7; margin-bottom: 12px; }
.news-card .meta { display: flex; gap: 14px; font-size: 11.5px; color: var(--muted); align-items: center; flex-wrap: wrap; }
.news-card .meta a { color: var(--accent); }

h2 { font-size: 16px; font-weight: 600; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border); letter-spacing: -.005em; }

.discussion-body { display: flex; flex-direction: column; gap: 12px; }
.msg { display: grid; grid-template-columns: 150px 1fr; gap: 16px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-left: 2px solid var(--border-2); }
.msg.bull { border-left-color: var(--green); }
.msg.bear { border-left-color: var(--red); }
.msg.historian { border-left-color: var(--blue); }
.msg.quant { border-left-color: var(--violet); }
.msg.moderator { border-left-color: var(--accent); background: rgba(255,166,48,.04); }
.msg .who { display: flex; flex-direction: column; gap: 4px; }
.msg .icon { font-size: 18px; font-weight: 700; }
.msg.bull .icon { color: var(--green); }
.msg.bear .icon { color: var(--red); }
.msg.historian .icon { color: var(--blue); }
.msg.quant .icon { color: var(--violet); }
.msg.moderator .icon { color: var(--accent); }
.msg .name { color: var(--text); font-size: 12.5px; font-weight: 600; }
.msg .text { color: var(--text-dim); font-size: 14px; line-height: 1.7; }
.msg.moderator .text { color: var(--text); }

.footer { margin-top: 40px; padding: 18px; background: var(--surface); border-left: 2px solid var(--accent); }
.footer p { color: var(--text-dim); font-size: 12.5px; line-height: 1.7; margin: 0; }
.footer p b { color: var(--text); }
.footer a { color: var(--accent); }

@media (max-width: 720px) {
  .msg { grid-template-columns: 1fr; gap: 6px; }
  .msg .who { flex-direction: row; align-items: center; gap: 10px; }
  .news-card h1 { font-size: 19px; }
}
</style>
</head>
<body>

<header class="cmdbar">
  <a href="/" class="brand">
    <div class="brand-mark">K</div>
    <div class="brand-name">KALIBRE <span class="sub">// MARKETS</span></div>
  </a>
  <div class="cmd-spacer"></div>
  <a href="/canli/" class="back">▸ Canlı Akışa Dön</a>
</header>

<div class="disclaimer">
  <b>UYARI</b> &nbsp;·&nbsp; Aşağıdaki yorumlar yapay zeka modelleri tarafından üretilmiştir. Yatırım tavsiyesi değildir.
</div>

<main>
  <div class="crumb"><a href="/">Ana sayfa</a> · <a href="/canli/">Canlı yorum</a> · ${escapeHtml(d.category)}</div>

  <article class="news-card">
    <div class="cat">${escapeHtml(d.category)}</div>
    <h1>${escapeHtml(d.newsTitle)}</h1>
    <p class="desc">${escapeHtml(d.newsDesc)}</p>
    <div class="meta">
      <span>${escapeHtml(d.newsPub)}</span>
      <span>·</span>
      <a href="${escapeHtml(d.newsLink)}" target="_blank" rel="noopener nofollow">Orijinal haber kaynağı ↗</a>
    </div>
  </article>

  <h2>Modellerin tartışması</h2>
  <div class="discussion-body">${msgs}</div>

  <div class="footer">
    <p>
      <b>Nasıl üretildi?</b> Bu tartışma, makroekonomik son dakika gelişmelerinden alınan haberin sınıflandırılması sonrası 4 farklı yapay zeka modeline rol verilerek (boğa, ayı, tarihsel arşivci, sayısal) eş zamanlı çağrılmasıyla üretildi. Beşinci bir model moderatör rolünde kapanış mesajını yazdı. Modeller sıfır insan müdahalesi ile çalışır. Tartışma <b>${fmtDate(d.createdAt)}</b> tarihinde tamamlandı.
    </p>
  </div>
</main>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": ${JSON.stringify(d.newsTitle)},
  "description": ${JSON.stringify(desc)},
  "datePublished": ${JSON.stringify(new Date(d.createdAt).toISOString())},
  "dateModified": ${JSON.stringify(new Date(d.updatedAt).toISOString())},
  "author": { "@type": "Organization", "name": "Kalibre Markets — AI Yorum Akışı" },
  "publisher": { "@type": "Organization", "name": "Kalibre Markets", "url": "https://kalibremarkets.com" },
  "mainEntityOfPage": ${JSON.stringify(url)},
  "isBasedOn": ${JSON.stringify(d.newsLink)}
}
</script>

</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = (req.query.id as string) || '';
  if (!id) {
    res.status(400).send('id required');
    return;
  }
  try {
    const d = await readDiscussion(id);
    if (!d) {
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(
        `<!doctype html><meta charset="utf-8"><title>Bulunamadı</title><body style="background:#100e0c;color:#ebe3d3;font-family:system-ui;padding:60px;text-align:center"><h1>404</h1><p>Bu tartışma bulunamadı.</p><p><a href="/canli/" style="color:#ffa630">Canlı akışa dön</a></p></body>`
      );
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    res.status(200).send(renderHtml(d));
  } catch (e: any) {
    res.status(500).send('Error: ' + (e?.message || String(e)));
  }
}
