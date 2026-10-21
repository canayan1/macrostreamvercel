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
  };
}

let yerelBellek: Depo | null = null;
export function depoSec(): Depo | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return upstashDepo(url, token);
  if (process.env.KOPRU_BELLEK === '1' && process.env.VERCEL !== '1') return (yerelBellek ??= bellekDepo());
  return null;
}
