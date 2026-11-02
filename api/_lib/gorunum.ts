// "Ask your data" on the server: turns a question plus the page's schema (dimension and measure
// names only, never a row of data) into a prompt, and a model's text into a validated view recipe.
// Served through api/asistan.ts with { mod: 'gorunum' } (the Hobby plan allows no 13th function).

export type Sema = { boyutlar: { id: string; ad: string }[]; olculer: { id: string; ad: string; tur?: string }[] };
export type Tarif = { boyut: string; olcu: string; tur: 'cubuk' | 'cizgi' | 'tablo'; sirala?: 'artan' | 'azalan'; ilkN?: number; filtre?: string };

const ID_RE = /^[A-Za-z][\w-]{0,31}$/;
const AD_EN_COK = 60, LISTE_EN_COK = 40, SORU_EN_COK = 200;

// The schema comes from the browser: keep only well-formed ids and short names.
export function semaTemizle(g: unknown): Sema | null {
  if (!g || typeof g !== 'object') return null;
  const o = g as Record<string, unknown>;
  const liste = (v: unknown, olcu: boolean) => (Array.isArray(v) ? v : []).slice(0, LISTE_EN_COK).flatMap(x => {
    if (!x || typeof x !== 'object') return [];
    const { id, ad, tur } = x as Record<string, unknown>;
    if (typeof id !== 'string' || !ID_RE.test(id) || typeof ad !== 'string' || !ad.trim()) return [];
    const temiz = { id, ad: ad.replace(/[\u0000-\u001f"\\]/g, ' ').trim().slice(0, AD_EN_COK) } as { id: string; ad: string; tur?: string };
    if (olcu && (tur === 'para' || tur === 'sayi' || tur === 'yuzde' || tur === 'oran')) temiz.tur = tur;
    return [temiz];
  });
  const boyutlar = liste(o.boyutlar, false), olculer = liste(o.olculer, true);
  if (!boyutlar.length || !olculer.length) return null;
  return { boyutlar, olculer };
}

export function soruTemizle(v: unknown): string {
  return String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, SORU_EN_COK);
}

export function gorunumIstemi(sema: Sema, soru: string): { system: string; user: string } {
  const system = `You turn one question about a trading desk's data into a JSON view recipe. You never see the data, only the names below.
Reply with ONLY a JSON object, no prose, with these keys:
  "boyut": one dimension id from the list (what to group by)
  "olcu": one measure id from the list (what to show)
  "tur": "cubuk" (bar, default), "cizgi" (line, for time-like dimensions or trends) or "tablo" (table, when a list is asked for)
  optional "sirala": "azalan" (largest first) or "artan" (smallest first)
  optional "ilkN": integer 1-50 when the question asks for a top, bottom, best, worst or first N
  optional "filtre": a short text when the question restricts to one label, e.g. "only EUR/USD" → "EUR/USD"
If the question names nothing from the lists, pick the closest dimension and measure. Never invent ids.
Dimensions: ${sema.boyutlar.map(b => `${b.id} = "${b.ad}"`).join('; ')}
Measures: ${sema.olculer.map(o => `${o.id} = "${o.ad}"${o.tur ? ` (${o.tur})` : ''}`).join('; ')}`;
  return { system, user: soru };
}

// A model answer may wrap the JSON in a code fence or add a sentence; the first {...} block is read.
export function gorunumCevabi(metin: string, sema: Sema): { tarif: Tarif } | { hata: string } {
  const m = /\{[\s\S]*\}/.exec(String(metin ?? ''));
  if (!m) return { hata: 'json' };
  let o: Record<string, unknown>;
  try { o = JSON.parse(m[0]); } catch { return { hata: 'json' }; }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { hata: 'bicim' };
  if (!sema.boyutlar.some(b => b.id === o.boyut)) return { hata: 'boyut' };
  if (!sema.olculer.some(x => x.id === o.olcu)) return { hata: 'olcu' };
  const tur = o.tur === 'cizgi' || o.tur === 'tablo' ? o.tur : 'cubuk';
  const tarif: Tarif = { boyut: o.boyut as string, olcu: o.olcu as string, tur };
  if (o.sirala === 'artan' || o.sirala === 'azalan') tarif.sirala = o.sirala;
  if (o.ilkN !== undefined && o.ilkN !== null) {
    const n = Math.floor(Number(o.ilkN));
    if (Number.isFinite(n) && n >= 1) { tarif.ilkN = Math.min(50, n); tarif.sirala ??= 'azalan'; }
  }
  if (typeof o.filtre === 'string') { const f = o.filtre.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40); if (f) tarif.filtre = f; }
  return { tarif };
}
