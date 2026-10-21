// Köprü rölesinin yerel geliştirme sunucusu. api/kopru.ts'i doğrudan çalıştırır (Node'un
// yerleşik TypeScript desteğiyle), bellek deposunu kullanır. Canlıda kullanılmaz.
//
// Kullanım: node yerel/kopru-sunucu.mjs [port]   (varsayılan 8790)
// Günlüğe yalnız yöntem, durum ve boyut yazılır; zarf içeriği yazılmaz.

import http from 'node:http';

process.env.KOPRU_BELLEK = '1';
const { default: handler } = await import('../api/kopru.ts');
const port = Number(process.argv[2] ?? 8790);

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://yerel');
  if (u.pathname !== '/api/kopru') { res.writeHead(404).end(); return; }
  const parca = [];
  for await (const p of req) parca.push(p);
  const metin = Buffer.concat(parca).toString('utf8');
  req.query = Object.fromEntries(u.searchParams);
  req.body = metin;
  if ((req.headers['content-type'] ?? '').includes('json') && metin) {
    try { req.body = JSON.parse(metin); } catch { /* handler 400 döner */ }
  }
  res.status = c => { res.statusCode = c; return res; };
  res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
  res.send = s => { res.end(s); return res; };
  res.on('finish', () => console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${res.statusCode} ${metin.length}B y=${u.searchParams.get('y') ?? '-'}`));
  await handler(req, res);
}).listen(port, '127.0.0.1', () => console.log(`köprü rölesi (yerel): http://127.0.0.1:${port}/api/kopru`));
