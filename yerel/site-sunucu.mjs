// Sitenin yerel geliştirme sunucusu: statik dosyalar (Vercel cleanUrls taklidi) + api/*.ts uçları.
// Canlıda kullanılmaz. Bellek deposu açıktır (KOPRU_BELLEK=1).
//
// Kullanım: node yerel/site-sunucu.mjs [port]   (varsayılan 8788)
// Stripe'ı yerelde denemek için: STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET ve
// sahte sunucu için STRIPE_API_KOK=http://127.0.0.1:8799 (yerel/sahte-stripe.mjs).

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.KOPRU_BELLEK = '1';
const KOK = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.argv[2] ?? 8788);
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const UCLAR = ['kopru', 'lisans', 'odeme/baslat', 'odeme/webhook', 'odeme/oturum', 'odeme/portal'];

async function dosyaBul(yol) {
  const p = normalize(join(KOK, decodeURIComponent(yol)));
  if (!p.startsWith(KOK) || /\/(\.|api\/|yerel\/|test\/)/.test(p.slice(KOK.length - 1))) return null;
  for (const aday of [p, p + '.html', join(p, 'index.html')]) {
    try { if ((await stat(aday)).isFile()) return aday; } catch {}
  }
  return null;
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://yerel');
  const uc = u.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  if (u.pathname.startsWith('/api/') && UCLAR.includes(uc)) {
    const parca = [];
    for await (const p of req) parca.push(p);
    const metin = Buffer.concat(parca).toString('utf8');
    req.query = Object.fromEntries(u.searchParams);
    req.body = metin;
    if ((req.headers['content-type'] ?? '').includes('json') && metin && uc !== 'odeme/webhook') {
      try { req.body = JSON.parse(metin); } catch {}
    }
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
    res.send = s => { res.end(s); return res; };
    res.on('finish', () => console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} /api/${uc} ${res.statusCode}`));
    const { default: handler } = await import(`../api/${uc}.ts`);
    return handler(req, res);
  }
  const f = await dosyaBul(u.pathname);
  if (!f) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('yok'); return; }
  res.writeHead(200, { 'Content-Type': TUR[extname(f)] ?? 'application/octet-stream' }).end(await readFile(f));
}).listen(port, '127.0.0.1', () => console.log(`site (yerel): http://127.0.0.1:${port}/`));
