// Kalibre Pulse — anonim "kalabalık" sayacı.
// Yalnızca İZLENEN SEMBOLLERİ sayar; kimlik, IP, oturum İLİŞKİLENDİRMEZ ve SAKLAMAZ.
// Depo (Upstash Redis REST) tanımlı değilse sessizce no-op döner — site bundan etkilenmez.
//
// POST  { watch: ["AKBNK","THYAO", ...] }  → günlük sembol sayaçlarını +1'ler
// GET   ?days=7&limit=10                   → son N günün toplam en çok izlenenleri
//
// Gizlilik: tek depolanan şey "gün başına sembol -> kaç kez işaretlendi" sayacıdır.
// İstemci günde bir kez ping atar (cihazda throttle), yani sayım ≈ günlük tekil izleyici.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

const TTL_DAYS = 45; // sayaçlar bu süre sonra kendiliğinden silinir
const MAX_SYMBOLS = 12; // bir ping'te en fazla bu kadar sembol
const SYM_RE = /^[A-Z][A-Z0-9]{1,5}$/; // BIST sembol biçimi (örn. AKBNK, THYAO)

// Upstash/Vercel KV REST kimlik bilgileri (ikisinden biri yeterli).
function store() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

// Redis REST pipeline: komut dizisini tek istekte çalıştırır.
async function pipeline(s: { url: string; token: string }, cmds: (string | number)[][]): Promise<any[]> {
  const resp = await fetch(`${s.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!resp.ok) throw new Error(`upstash ${resp.status}: ${(await resp.text()).slice(0, 160)}`);
  return resp.json();
}

function dayKey(offset = 0): string {
  const d = new Date(Date.now() - offset * 86400000);
  return 'pulse:watch:' + d.toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const s = store();

  // ── GET mode=rising: "ısınanlar" — bu hafta vs geçen hafta dikkat sıçraması ──
  if (req.method === 'GET' && req.query.mode === 'rising') {
    if (!s) return res.status(200).json({ enabled: false, matured: false, rows: [] });
    try {
      const W = 7;                 // pencere (gün)
      const MIN_SYM = 4;           // bir sembolün listeye girmesi için min son-hafta dikkati
      const MIN_TOTAL = 30;        // panelin olgunlaşması için min toplam son-hafta dikkati
      const MIN_SURGE = 15;        // "ısınan" sayılmak için min dikkat artışı (%)
      const reads = await pipeline(s, Array.from({ length: 2 * W }, (_, i) => ['HGETALL', dayKey(i)]));
      const recent: Record<string, number> = {}, prior: Record<string, number> = {};
      reads.forEach((r, i) => {
        const arr: string[] = (r && r.result) || [];
        const bucket = i < W ? recent : prior;
        for (let j = 0; j + 1 < arr.length; j += 2) bucket[arr[j]] = (bucket[arr[j]] || 0) + (parseInt(arr[j + 1], 10) || 0);
      });
      const totalRecent = Object.values(recent).reduce((a, b) => a + b, 0);
      if (totalRecent < MIN_TOTAL) return res.status(200).json({ enabled: true, matured: false, totalRecent, rows: [] });

      const rows = Object.keys(recent)
        .filter((sym) => recent[sym] >= MIN_SYM)
        .map((sym) => {
          const r = recent[sym], p = prior[sym] || 0;
          const isNew = p === 0;
          const surge = isNew ? null : (r / p - 1) * 100;
          return { sym, recent: r, prior: p, surge, isNew };
        })
        // yalnızca ISINANLAR: yeni girenler veya dikkati ≥%MIN_SURGE artanlar (düşenler elenir)
        .filter((x) => x.isNew || (x.surge !== null && x.surge >= MIN_SURGE))
        // önce YENİ girenler (son-hafta dikkatine göre), sonra sıçrama oranına göre
        .sort((a, b) => (a.isNew === b.isNew ? (a.isNew ? b.recent - a.recent : (b.surge! - a.surge!)) : a.isNew ? -1 : 1))
        .slice(0, Math.min(Math.max(parseInt(String(req.query.limit || '8'), 10) || 8, 1), 20));

      return res.status(200).json({ enabled: true, matured: true, window: W, totalRecent, rows });
    } catch (e: any) {
      console.error('[pulse-ping] rising error:', e?.message || e);
      return res.status(200).json({ enabled: false, matured: false, rows: [] });
    }
  }

  // ── GET: toplam en çok izlenenler ──
  if (req.method === 'GET') {
    if (!s) return res.status(200).json({ enabled: false, top: [] });
    try {
      const days = Math.min(Math.max(parseInt(String(req.query.days || '7'), 10) || 7, 1), 30);
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10) || 10, 1), 30);
      const reads = await pipeline(s, Array.from({ length: days }, (_, i) => ['HGETALL', dayKey(i)]));
      const totals: Record<string, number> = {};
      for (const r of reads) {
        const arr: string[] = (r && r.result) || [];
        for (let i = 0; i + 1 < arr.length; i += 2) totals[arr[i]] = (totals[arr[i]] || 0) + (parseInt(arr[i + 1], 10) || 0);
      }
      const top = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([sym, n]) => ({ sym, n }));
      return res.status(200).json({ enabled: true, days, top });
    } catch (e: any) {
      console.error('[pulse-ping] GET error:', e?.message || e);
      return res.status(200).json({ enabled: false, top: [] });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // ── POST: günlük sayaçları artır ──
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const raw = Array.isArray(body.watch) ? body.watch : [];
    const syms = Array.from(
      new Set(raw.filter((x: any) => typeof x === 'string').map((x: string) => x.trim().toUpperCase()))
    )
      .filter((x) => SYM_RE.test(x as string))
      .slice(0, MAX_SYMBOLS) as string[];

    if (!syms.length) return res.status(200).json({ ok: true, counted: 0 });
    if (!s) return res.status(200).json({ ok: true, counted: 0, stored: false }); // depo yok → no-op

    const key = dayKey(0);
    const cmds: (string | number)[][] = syms.map((sym) => ['HINCRBY', key, sym, 1]);
    cmds.push(['EXPIRE', key, TTL_DAYS * 86400]);
    await pipeline(s, cmds);
    return res.status(200).json({ ok: true, counted: syms.length, stored: true });
  } catch (e: any) {
    console.error('[pulse-ping] POST error:', e?.message || e);
    return res.status(200).json({ ok: true, counted: 0 }); // sessiz başarısızlık — UX'i bozma
  }
}
