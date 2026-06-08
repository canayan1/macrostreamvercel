// Kurumsal alan koruması — /kurumsal/* yalnızca geçerli pilot çerezi olanlara açıktır.
// Giriş sayfası (/kurumsal/giris) ve doğrulama API'si (/api/kurumsal-*) serbesttir.
// Çerez, api/kurumsal-login.ts ile aynı HMAC-SHA256 imzasıyla doğrulanır.

export const config = {
  matcher: ['/kurumsal', '/kurumsal/:path*'],
};

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default async function middleware(req: Request): Promise<Response | undefined> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Giriş sayfası ve alt yolları her zaman serbest (yoksa sonsuz yönlendirme olur).
  if (path === '/kurumsal/giris' || path.startsWith('/kurumsal/giris')) return undefined;

  const secret = process.env.KURUMSAL_SECRET;
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)km_pilot=([^;]+)/);
  const token = m ? m[1] : null;

  let valid = false;
  let payloadObj: any = null;
  if (secret && token) {
    const dot = token.lastIndexOf('.');
    if (dot > 0) {
      const payload = token.slice(0, dot);
      const sig = token.slice(dot + 1);
      try {
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
        const expected = bytesToB64url(mac);
        if (expected === sig) {
          const json = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
          if (json && typeof json.exp === 'number' && json.exp * 1000 > Date.now()) {
            valid = true;
            payloadObj = json;
          }
        }
      } catch {
        valid = false;
      }
    }
  }

  if (!valid) {
    const login = new URL('/kurumsal/giris', req.url);
    if (path && path !== '/kurumsal/giris') login.searchParams.set('next', path);
    return Response.redirect(login, 307);
  }

  // ── Müşteri izolasyonu: rapor (brifing/sektor/risk) yolları yalnız yetkili kullanıcıya ──
  // Çerez payload'ındaki c = izinli müşteri slug listesi. Yoksa (eski format) tam erişim.
  const rep = path.match(/^\/kurumsal\/(?:brifing|sektor|risk)\/([^/]+)/);
  if (rep) {
    const slug = rep[1];
    const allowed = payloadObj && Array.isArray(payloadObj.c) ? payloadObj.c : null;
    if (allowed && allowed.indexOf(slug) === -1) {
      return Response.redirect(new URL('/kurumsal/', req.url), 307); // yetkisiz → panel
    }
  }
  return undefined; // erişime izin ver
}
