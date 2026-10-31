// Redis yayın aboneliği (SUBSCRIBE): Desk Signal akışı yeni kayıtları buradan duyar.
// Upstash REST yayın yapabilir ama abone olamaz; abonelik için aynı veritabanının TLS ucuna
// (REST adresiyle aynı ana makine, 6379, kullanıcı "default", parola REST jetonu) bağlanılır.
// Böylece yayın ve abonelik her zaman aynı veritabanındadır. Yerelde bellek yayını kullanılır.
//
// Küçük bir RESP okuyucusu yeter: yalnız AUTH, SUBSCRIBE ve gelen "message" dizileri işlenir.

import tls from 'node:tls';
import { redisBilgisi, bellekAbone } from './depo.ts';

type Deger = string | number | null | Deger[] | Error;

// buf içinde i'den başlayan bir RESP değeri okur; eksikse null.
export function respOku(buf: Buffer, i = 0): [Deger, number] | null {
  const sat = buf.indexOf('\r\n', i);
  if (sat < 0) return null;
  const tur = String.fromCharCode(buf[i]), govde = buf.toString('utf8', i + 1, sat), sonra = sat + 2;
  if (tur === '+') return [govde, sonra];
  if (tur === '-') return [new Error(govde), sonra];
  if (tur === ':') return [Number(govde), sonra];
  if (tur === '$') {
    const n = Number(govde);
    if (n < 0) return [null, sonra];
    if (buf.length < sonra + n + 2) return null;
    return [buf.toString('utf8', sonra, sonra + n), sonra + n + 2];
  }
  if (tur === '*') {
    const n = Number(govde), dizi: Deger[] = [];
    let j = sonra;
    for (let k = 0; k < n; k++) {
      const r = respOku(buf, j);
      if (!r) return null;
      dizi.push(r[0]); j = r[1];
    }
    return [dizi, j];
  }
  throw new Error('tanınmayan RESP yanıtı');
}

const komut = (...a: string[]) => `*${a.length}\r\n` + a.map(x => `$${Buffer.byteLength(x)}\r\n${x}\r\n`).join('');

// Aboneliği kurar; abonelik onaylanınca kapatma işlevini döner.
export function abone(kanal: string, fn: (mesaj: string) => void, hata: (e: Error) => void): Promise<() => void> {
  const r = redisBilgisi();
  if (!r) {
    if (process.env.KOPRU_BELLEK === '1' && process.env.VERCEL !== '1') return Promise.resolve(bellekAbone(kanal, fn));
    return Promise.reject(new Error('yayın deposu yok'));
  }
  const host = new URL(r.url).hostname;
  return new Promise((tamam, red) => {
    let kuruldu = false, tampon = Buffer.alloc(0);
    const soket = tls.connect({ host, port: 6379, servername: host }, () => {
      soket.write(komut('AUTH', 'default', r.token) + komut('SUBSCRIBE', kanal));
    });
    soket.setKeepAlive(true, 30_000);
    const kapat = () => { soket.removeAllListeners('error'); soket.on('error', () => {}); soket.destroy(); };
    const bitti = (e: Error) => { kapat(); kuruldu ? hata(e) : red(e); };
    soket.on('error', e => bitti(e));
    soket.on('close', () => bitti(new Error('abonelik kapandı')));
    soket.on('data', parca => {
      tampon = tampon.length ? Buffer.concat([tampon, parca]) : parca;
      let i = 0;
      for (;;) {
        let r2: [Deger, number] | null;
        try { r2 = respOku(tampon, i); } catch (e) { return bitti(e as Error); }
        if (!r2) break;
        i = r2[1];
        const d = r2[0];
        if (d instanceof Error) return bitti(new Error('abonelik reddedildi'));
        if (Array.isArray(d) && d[0] === 'subscribe' && !kuruldu) { kuruldu = true; tamam(() => { soket.removeAllListeners('close'); kapat(); }); }
        else if (Array.isArray(d) && d[0] === 'message' && d[1] === kanal && typeof d[2] === 'string') fn(d[2]);
      }
      tampon = tampon.subarray(i);
    });
  });
}
