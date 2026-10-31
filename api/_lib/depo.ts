// Ortak anahtar-değer deposu: köprü rölesi ve lisans kayıtları aynı Upstash Redis'i kullanır.
// (api/_lib altındaki dosyalar Vercel'de uç olarak yayınlanmaz.)
//
// Depo: Upstash Redis REST (UPSTASH_REDIS_REST_URL/TOKEN ya da KV_REST_API_URL/TOKEN).
// Depo yoksa canlıda null döner ve uçlar 503 verir; Vercel örnekleri belleği paylaşmadığından
// belleğe düşmek veriyi rastgele kaybettirirdi. Yerel geliştirmede KOPRU_BELLEK=1 ile bellek deposu açılır.

export interface Depo {
  yaz(anahtar: string, deger: string, ttlSn?: number): Promise<void>; // ttlSn yoksa kalıcı
  yazYoksa(anahtar: string, deger: string, ttlSn?: number): Promise<boolean>; // yalnız yoksa yazar
  oku(anahtar: string): Promise<string | null>;
  say(anahtar: string, ttlSn: number): Promise<number>; // artırır, yeni değeri döner
  // Desk Signal rölesi için: sıra numarası, kayıt listesi, çevrimiçi tablosu ve yayın.
  artir(anahtar: string, ttlSn: number): Promise<number>; // artırır, ömrü her seferinde yeniler
  ekle(anahtar: string, deger: string, enFazla: number, ttlSn: number): Promise<void>; // listeye ekler, son enFazla kalır
  son(anahtar: string, adet: number): Promise<string[]>; // listenin son adet öğesi, eskiden yeniye
  hYaz(anahtar: string, alan: string, deger: string, ttlSn: number): Promise<void>;
  hHepsi(anahtar: string): Promise<Record<string, string>>;
  yayinla(kanal: string, mesaj: string): Promise<void>;
}

// Bellek deposunun yayınları aynı süreçteki abonelere gider (yerel geliştirme).
type Dinleyici = (mesaj: string) => void;
export const bellekYayin = new Map<string, Set<Dinleyici>>();
export function bellekAbone(kanal: string, fn: Dinleyici): () => void {
  if (!bellekYayin.has(kanal)) bellekYayin.set(kanal, new Set());
  bellekYayin.get(kanal)!.add(fn);
  return () => { bellekYayin.get(kanal)?.delete(fn); };
}

export function bellekDepo(): Depo {
  const m = new Map<string, { v: string; bitis: number }>();
  const canli = (k: string) => {
    const x = m.get(k);
    if (x && x.bitis > Date.now()) return x;
    m.delete(k);
    return null;
  };
  const bitis = (ttl?: number) => (ttl ? Date.now() + ttl * 1000 : Infinity);
  return {
    async yaz(k, v, ttl) { m.set(k, { v, bitis: bitis(ttl) }); },
    async yazYoksa(k, v, ttl) {
      if (canli(k)) return false;
      m.set(k, { v, bitis: bitis(ttl) });
      return true;
    },
    async oku(k) { return canli(k)?.v ?? null; },
    async say(k, ttl) {
      const x = canli(k);
      const yeni = String(Number(x?.v ?? 0) + 1);
      m.set(k, { v: yeni, bitis: x?.bitis ?? bitis(ttl) });
      return Number(yeni);
    },
    async artir(k, ttl) {
      const yeni = String(Number(canli(k)?.v ?? 0) + 1);
      m.set(k, { v: yeni, bitis: bitis(ttl) });
      return Number(yeni);
    },
    async ekle(k, v, enFazla, ttl) {
      const liste: string[] = JSON.parse(canli(k)?.v ?? '[]');
      liste.push(v);
      m.set(k, { v: JSON.stringify(liste.slice(-enFazla)), bitis: bitis(ttl) });
    },
    async son(k, adet) { return (JSON.parse(canli(k)?.v ?? '[]') as string[]).slice(-adet); },
    async hYaz(k, alan, deger, ttl) {
      const h = JSON.parse(canli(k)?.v ?? '{}');
      h[alan] = deger;
      m.set(k, { v: JSON.stringify(h), bitis: bitis(ttl) });
    },
    async hHepsi(k) { return JSON.parse(canli(k)?.v ?? '{}'); },
    async yayinla(kanal, mesaj) { bellekYayin.get(kanal)?.forEach(fn => fn(mesaj)); },
  };
}

function upstashDepo(url: string, token: string): Depo {
  const komut = async (cmds: (string | number)[][]) => {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds),
    });
    if (!r.ok) throw new Error(`upstash ${r.status}`);
    return (await r.json()) as { result: unknown }[];
  };
  return {
    async yaz(k, v, ttl) { await komut([ttl ? ['SET', k, v, 'EX', ttl] : ['SET', k, v]]); },
    async yazYoksa(k, v, ttl) {
      const [r] = await komut([ttl ? ['SET', k, v, 'NX', 'EX', ttl] : ['SET', k, v, 'NX']]);
      return r?.result === 'OK';
    },
    async oku(k) { const [r] = await komut([['GET', k]]); return (r?.result as string) ?? null; },
    async say(k, ttl) { const [r] = await komut([['INCR', k], ['EXPIRE', k, ttl, 'NX']]); return Number(r?.result ?? 0); },
    async artir(k, ttl) { const [r] = await komut([['INCR', k], ['EXPIRE', k, ttl]]); return Number(r?.result ?? 0); },
    async ekle(k, v, enFazla, ttl) { await komut([['RPUSH', k, v], ['LTRIM', k, -enFazla, -1], ['EXPIRE', k, ttl]]); },
    async son(k, adet) { const [r] = await komut([['LRANGE', k, -adet, -1]]); return (r?.result as string[]) ?? []; },
    async hYaz(k, alan, deger, ttl) { await komut([['HSET', k, alan, deger], ['EXPIRE', k, ttl]]); },
    async hHepsi(k) {
      const [r] = await komut([['HGETALL', k]]);
      const a = (r?.result as string[]) ?? [], o: Record<string, string> = {};
      for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = a[i + 1];
      return o;
    },
    async yayinla(kanal, mesaj) { await komut([['PUBLISH', kanal, mesaj]]); },
  };
}

let yerelBellek: Depo | null = null;
// Vercel'in Upstash entegrasyonu değişken adlarına kullanıcının seçtiği öneki ekler
// (ör. UPSTASH_REDIS_REST_KV_REST_API_URL). Bilinen adlar önce, sonra aynı önekli herhangi bir
// "<önek>KV_REST_API_URL" + "<önek>KV_REST_API_TOKEN" çifti aranır. Salt okuma jetonu kullanılmaz.
export function redisBilgisi(env: Record<string, string | undefined> = process.env): { url: string; token: string } | null {
  const ciftler: [string, string][] = [['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'], ['KV_REST_API_URL', 'KV_REST_API_TOKEN']];
  for (const ad of Object.keys(env).sort())
    if (ad.endsWith('KV_REST_API_URL') && ad !== 'KV_REST_API_URL') ciftler.push([ad, ad.slice(0, -'URL'.length) + 'TOKEN']);
  for (const [u, t] of ciftler) if (env[u] && env[t]) return { url: env[u]!, token: env[t]! };
  return null;
}

export function depoSec(): Depo | null {
  const r = redisBilgisi();
  if (r) return upstashDepo(r.url, r.token);
  if (process.env.KOPRU_BELLEK === '1' && process.env.VERCEL !== '1') return (yerelBellek ??= bellekDepo());
  return null;
}
