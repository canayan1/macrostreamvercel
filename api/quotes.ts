// Kalibre — canlı (≈anlık) kotasyon proxy'si.
// Terminal launchpad'i bu endpoint'ten son fiyatları çekip statik markets.json
// snapshot'ının üzerine bindirir. Kaynak: Stooq (anahtar gerektirmez, bulut IP'lerine
// izin verir — Yahoo datacenter IP'lerine 429 verdiği için kullanılmıyor).
//
// GET /api/quotes → { ts, quotes: { <key>: { last } } }
//   pct hesapları istemcide snapshot geçmişinden yapılır; burada yalnız son fiyat döner.
//
// Kapsam: xu100, usdtry, dxy, xauusd, xagusd + türetilmiş gramaltin/gramgumus.
// VIX ve ABD 10Y Stooq'ta yok → onlar günlük snapshot değerinde kalır.
//
// NOT: Veri gecikmeli olabilir (özellikle BIST). Yatırım tavsiyesi değildir.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

const GRAM_PER_TROY_OUNCE = 31.1035;

// markets.json anahtarı → Stooq sembolü (türetilenler hariç)
const STOOQ: Record<string, string> = {
  xu100: '^xu100',
  usdtry: 'usdtry',
  dxy: 'dx.f',
  xauusd: 'xauusd',
  xagusd: 'xagusd',
};

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// Tek sembolün son fiyatı (Stooq light CSV). Çoklu sembol bu endpoint'te
// desteklenmediği için her sembol ayrı çekilir.
async function fetchStooq(sym: string): Promise<number | null> {
  const url = `https://stooq.com/q/l/?s=${sym}&f=sd2t2ohlcv&h&e=csv`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${sym} ${r.status}`);
  const csv = await r.text();
  const lines = csv.trim().split(/\r?\n/);
  const data = lines[lines.length - 1].split(','); // son satır = veri
  const date = (data[1] || '').trim();
  const close = parseFloat(data[6]);
  if (date === 'N/D' || !isFinite(close)) return null;
  return close;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const keys = Object.keys(STOOQ);
    const settled = await Promise.allSettled(keys.map((k) => fetchStooq(STOOQ[k])));

    const raw: Record<string, number> = {};
    const bySym: Record<string, unknown> = {};
    keys.forEach((k, i) => {
      const s = settled[i];
      if (s.status === 'fulfilled' && typeof s.value === 'number') {
        raw[k] = s.value;
        bySym[k] = s.value;
      } else {
        bySym[k] = s.status === 'rejected' ? String((s as PromiseRejectedResult).reason).slice(0, 120) : null;
      }
    });

    const quotes: Record<string, { last: number }> = {};
    for (const k of keys) if (raw[k] != null) quotes[k] = { last: raw[k] };

    // Türetilmiş gram-₺: ons$ × USD/TRY ÷ 31,1035
    if (raw.xauusd != null && raw.usdtry != null) {
      quotes.gramaltin = { last: (raw.xauusd * raw.usdtry) / GRAM_PER_TROY_OUNCE };
    }
    if (raw.xagusd != null && raw.usdtry != null) {
      quotes.gramgumus = { last: (raw.xagusd * raw.usdtry) / GRAM_PER_TROY_OUNCE };
    }

    const ok = Object.keys(quotes).length;
    if (req.query.debug) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ ts: Date.now(), ok, bySym, quotes });
    }
    if (ok === 0) return res.status(502).json({ error: 'no quotes', ts: Date.now() });

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ ts: Date.now(), count: ok, quotes });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e), ts: Date.now() });
  }
}
