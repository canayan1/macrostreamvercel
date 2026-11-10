// Desk Signal rölesi (kalibre-lab/lab/src/desk/kasa.js ile aynı zarf).
//
// Masa şefinin ve trader'ların tarayıcıları şifreli olayları buraya bırakır ve buradan dinler.
// Anahtar yalnız davet bağlantısının # kısmındadır; bu uç:
//   - zarfın içini OKUYAMAZ (sinyal adı, kişi adı, kimin neye yanıt verdiği görünmez),
//   - olaylara yalnız bir sıra numarası ve kendi saatini ekler, böylece herkes aynı sırayı görür,
//   - masa kimliği türetilmiştir, kişi kimlikleri rastgeledir; IP, hesap ya da gövde günlüğe yazılmaz,
//   - son 5000 olayı tutar, masa 30 gün sessiz kalırsa hepsi kendiliğinden silinir.
//
// POST /api/desk?d=<masa>              gövde { v, n, c }       → 200 { q, ts }
// GET  /api/desk?d=<masa>&after=<q>                            → 200 { last, records }
// GET  /api/desk?d=<masa>&stream=1     (Last-Event-ID ya da after) → text/event-stream, her kayıt "id: q"
// GET  /api/desk?d=<masa>&m=<kişi>&online=1                    → 200 { now, online: { kişi: ms } }
//
// Kayıt: { q, ts, e: zarf }. Depo: api/_lib/depo.ts; yayın aboneliği: api/_lib/abone.ts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { type Depo, depoSec } from './_lib/depo.ts';
import { abone } from './_lib/abone.ts';
import { istemciIp, sinirAsildi } from './_lib/hiz.ts';

export const config = { maxDuration: 300 };

export const SINIR = {
  zarfKarakter: 8000,
  kayit: 5000,
  ttlSn: 30 * 86400,
  yazmaDakika: 300,  // masa başına
  akisMs: 270_000,   // akış bu süre sonunda kapanır, tarayıcı kaldığı yerden yeniden bağlanır
  canliMs: 15_000,   // boş akışta canlı tutma satırı
  cevrimiciMs: 10 * 60_000,
};
export const MASA_RE = /^[0-9a-f]{32}$/;
export const KISI_RE = /^[0-9a-f]{16}$/;
const A = (masa: string) => ({ sira: `desk:${masa}:q`, kayit: `desk:${masa}:log`, cevrimici: `desk:${masa}:on`, yayin: `desk:${masa}`, sinir: (dk: number) => `desk-sinir:${masa}:${dk}` });

export function zarfDenetle(z: any): { zarf?: { v: 1; n: string; c: string }; hata?: string } {
  if (!z || typeof z !== 'object' || Array.isArray(z)) return { hata: 'zarf bir JSON nesnesi olmalı' };
  if (z.v !== 1) return { hata: 'desteklenmeyen zarf sürümü' };
  if (typeof z.n !== 'string' || !/^[0-9a-f]{24}$/.test(z.n)) return { hata: 'nonce hatalı' };
  if (typeof z.c !== 'string' || !z.c.length || z.c.length > SINIR.zarfKarakter || !/^[A-Za-z0-9+/]+={0,2}$/.test(z.c)) return { hata: 'şifreli metin hatalı' };
  return { zarf: { v: 1, n: z.n, c: z.c } };
}

const sira = (metin: string) => { try { return Number(JSON.parse(metin).q) || 0; } catch { return 0; } };

export async function kayitlar(depo: Depo, masa: string, after: number) {
  const a = A(masa);
  const last = Number(await depo.oku(a.sira)) || 0;
  const records = (await depo.son(a.kayit, SINIR.kayit)).filter(r => sira(r) > after).map(r => JSON.parse(r));
  return { last, records };
}

export async function yaz(depo: Depo, masa: string, govde: unknown, simdi = Date.now()) {
  const a = A(masa);
  const d = zarfDenetle(govde);
  if (!d.zarf) return { durum: 400, govde: { hata: d.hata } };
  // Sınır, sıra, kayıt ve yayın tek gidiş-dönüşte: gönderimden ekrana gecikmenin çoğu buradaydı.
  const q = await depo.siraliEkle({ sira: a.sira, kayit: a.kayit, yayin: a.yayin, sinir: a.sinir(Math.floor(simdi / 60000)) },
    JSON.stringify(d.zarf), simdi, { enFazla: SINIR.kayit, ttlSn: SINIR.ttlSn, dakikaSinir: SINIR.yazmaDakika });
  if (q < 0) return { durum: 429, govde: { hata: 'çok sık yazma' } };
  return { durum: 200, govde: { q, ts: simdi } };
}

export async function cevrimici(depo: Depo, masa: string, kisi: string, simdi = Date.now()) {
  const a = A(masa);
  if (KISI_RE.test(kisi)) await depo.hYaz(a.cevrimici, kisi, String(simdi), SINIR.ttlSn);
  const online: Record<string, number> = {};
  for (const [k, v] of Object.entries(await depo.hHepsi(a.cevrimici))) if (KISI_RE.test(k) && simdi - Number(v) < SINIR.cevrimiciMs) online[k] = Number(v);
  return { now: simdi, online };
}

async function akis(req: VercelRequest, res: VercelResponse, depo: Depo, masa: string) {
  const a = A(masa);
  let son = Number(req.headers['last-event-id'] ?? req.query.after ?? 0) || 0;
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', Connection: 'keep-alive' });
  res.write('retry: 1000\n\n');
  let hazir = false, bitti = false;
  const bekleyen: string[] = [];
  const gonder = (kayit: string) => { const q = sira(kayit); if (q > son) { son = q; res.write(`id: ${q}\ndata: ${kayit}\n\n`); } };
  let kapat = () => {};
  const bitir = () => { if (bitti) return; bitti = true; clearInterval(canli); clearTimeout(sure); kapat(); res.end(); };
  const canli = setInterval(() => res.write(': canli\n\n'), SINIR.canliMs);
  const sure = setTimeout(bitir, SINIR.akisMs);
  res.on('close', bitir); // req 'close' gövde okununca da gelir; bağlantının kapandığını res söyler
  try {
    kapat = await abone(a.yayin, m => (hazir ? gonder(m) : bekleyen.push(m)), bitir);
    if (bitti) return kapat();
    // Abonelik kurulduktan sonra kaçırılanlar listeden okunur; arada gelenler sıra numarasıyla elenir.
    const eski = (await depo.son(a.kayit, SINIR.kayit)).filter(r => sira(r) > son).sort((x, y) => sira(x) - sira(y));
    eski.forEach(gonder);
    hazir = true;
    bekleyen.sort((x, y) => sira(x) - sira(y)).forEach(gonder);
  } catch {
    // Abonelik kurulamadı: istemci bunu görür ve kısa aralıklı okumaya geçer.
    res.write('event: fallback\ndata: {}\n\n');
    bitir();
  }
}

// ------------------------------------------------------------------ uç
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const depo = depoSec();
  if (!depo) return res.status(503).json({ hata: 'röle yapılandırılmamış' });
  const masa = String(req.query.d ?? '');
  if (!MASA_RE.test(masa)) return res.status(400).json({ hata: 'masa kimliği hatalı' });
  // IP başına: akış açma 10 dakikada 60 (her akış ~4,5 dk sürer ve bir Redis aboneliği tutar),
  // diğer istekler dakikada 600. Rastgele masa kimlikleriyle bağlantı sınırını doldurmayı keser.
  const ip = istemciIp(req.headers);
  if (req.method === 'GET' && req.query.stream ? await sinirAsildi(depo, 'desk-akis', ip, 60, 600) : await sinirAsildi(depo, 'desk', ip, 600, 60)) {
    return res.status(429).json({ hata: 'çok sık istek' });
  }
  try {
    if (req.method === 'POST') {
      let govde: unknown = req.body;
      if (typeof govde === 'string') { try { govde = JSON.parse(govde); } catch { return res.status(400).json({ hata: 'gövde JSON değil' }); } }
      const r = await yaz(depo, masa, govde);
      return res.status(r.durum).json(r.govde);
    }
    if (req.method !== 'GET') return res.status(405).json({ hata: 'yalnız GET ve POST' });
    if (req.query.stream) return await akis(req, res, depo, masa);
    if (req.query.online) return res.status(200).json(await cevrimici(depo, masa, String(req.query.m ?? '')));
    return res.status(200).json(await kayitlar(depo, masa, Number(req.query.after ?? 0) || 0));
  } catch {
    if (res.headersSent) return res.end();
    return res.status(502).json({ hata: 'depo geçici olarak kullanılamıyor' });
  }
}
