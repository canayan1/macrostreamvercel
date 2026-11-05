// IP başına hız sınırı (talep.ts ve rapor.ts ile aynı yöntem): ham IP saklanmaz, tuzlu özeti
// pencere boyunca sayaç anahtarında kalır ve sonra kendiliğinden silinir.

import type { VercelRequest } from '@vercel/node';
import type { Depo } from './depo.ts';
import { ipOzeti } from './talep.ts';

export function istemciIp(h: VercelRequest['headers'] | undefined, yedek = ''): string {
  const ilk = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? '').split(',')[0].trim();
  return ilk(h?.['x-real-ip']) || ilk(h?.['x-forwarded-for']) || yedek;
}

// Sınır aşıldıysa true. Depo yoksa ya da hata verirse sınır uygulanmaz (uç kendi işini yapsın).
export async function sinirAsildi(depo: Depo | null, ad: string, ip: string, sinir: number, pencereSn: number, simdi = Date.now()): Promise<boolean> {
  if (!depo) return false;
  try {
    const pencere = Math.floor(simdi / (pencereSn * 1000));
    const n = await depo.say(`hiz:${ad}:${ipOzeti(ip || 'yok')}:${pencere}`, pencereSn);
    return n > sinir;
  } catch {
    return false;
  }
}
