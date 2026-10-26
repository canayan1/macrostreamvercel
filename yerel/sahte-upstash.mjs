// Yerel deneme için sahte Upstash REST sunucusu (bellekte). Canlıda kullanılmaz.
// Desteklenen komutlar: SET [NX] [EX n], GET, INCR, EXPIRE [NX], SCAN imlec MATCH desen [COUNT n], MGET.
// Kullanım: node yerel/sahte-upstash.mjs [port]   (varsayılan 8798), sonra
//   UPSTASH_REDIS_REST_URL=http://127.0.0.1:8798 UPSTASH_REDIS_REST_TOKEN=yerel node yerel/site-sunucu.mjs 8792
import http from 'node:http';

const port = Number(process.argv[2] ?? 8798);
const m = new Map();
const canli = k => { const x = m.get(k); if (x && x.bitis > Date.now()) return x; m.delete(k); return null; };

function calistir([ad, ...a]) {
  switch (String(ad).toUpperCase()) {
    case 'SET': {
      const [k, v, ...s] = a; const u = s.map(x => String(x).toUpperCase());
      if (u.includes('NX') && canli(k)) return null;
      const ex = u.indexOf('EX'); m.set(k, { v: String(v), bitis: ex >= 0 ? Date.now() + Number(s[ex + 1]) * 1000 : Infinity });
      return 'OK';
    }
    case 'GET': return canli(a[0])?.v ?? null;
    case 'INCR': { const x = canli(a[0]); const n = Number(x?.v ?? 0) + 1; m.set(a[0], { v: String(n), bitis: x?.bitis ?? Infinity }); return n; }
    case 'EXPIRE': { const x = canli(a[0]); if (!x) return 0; if (String(a[2] ?? '').toUpperCase() === 'NX' && x.bitis !== Infinity) return 0; x.bitis = Date.now() + Number(a[1]) * 1000; return 1; }
    case 'MGET': return a.map(k => canli(k)?.v ?? null);
    case 'SCAN': {
      const i = a.findIndex(x => String(x).toUpperCase() === 'MATCH');
      const re = new RegExp('^' + String(i >= 0 ? a[i + 1] : '*').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      return ['0', [...m.keys()].filter(k => canli(k) && re.test(k))];
    }
    default: throw new Error('desteklenmeyen komut ' + ad);
  }
}

http.createServer(async (req, res) => {
  const parca = []; for await (const p of req) parca.push(p);
  try {
    const g = JSON.parse(Buffer.concat(parca).toString('utf8'));
    const cikti = req.url.startsWith('/pipeline') ? g.map(c => ({ result: calistir(c) })) : { result: calistir(g) };
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(cikti));
  } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: String(e.message) })); }
}).listen(port, '127.0.0.1', () => console.log(`sahte upstash http://127.0.0.1:${port}`));
