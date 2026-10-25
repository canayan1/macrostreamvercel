// Supabase hesap katmanı: sunucu tarafı (Vercel uçları).
//
// Ortam değişkenleri (Vercel'de proje sahibi girer):
//   SUPABASE_URL                https://<proje>.supabase.co
//   SUPABASE_ANON_KEY           herkese açık anon anahtarı (static/kalibre-config.js'teki ile aynı)
//   SUPABASE_SERVICE_ROLE_KEY   GİZLİ; yalnız sunucuda, lisans bağlantısı ve hesap silme için
//
// Erişim belirteci (JWT) yerelde doğrulanmaz: Supabase'in /auth/v1/user ucuna sorulur. Böylece
// JWT sırrına gerek kalmaz ve oturum kapatılmış ya da kullanıcı silinmişse belirteç hemen geçersiz olur.

export interface SupabaseAyar { url: string; anon: string; servis: string | null }
export interface Kullanici { id: string; eposta: string | null; ad: string | null }
export type Getir = typeof fetch;

export function supabaseAyar(env: Record<string, string | undefined> = process.env): SupabaseAyar | null {
  const url = (env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  const anon = env.SUPABASE_ANON_KEY ?? '';
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url) && !(env.VERCEL !== '1' && /^http:\/\/127\.0\.0\.1:\d+$/.test(url))) return null;
  if (!anon) return null;
  return { url, anon, servis: env.SUPABASE_SERVICE_ROLE_KEY || null };
}

export function belirtecAl(baslik: string | string[] | undefined): string | null {
  const b = Array.isArray(baslik) ? baslik[0] : baslik;
  const m = /^Bearer\s+([A-Za-z0-9._-]{20,4096})$/.exec(String(b ?? '').trim());
  return m ? m[1] : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidMi = (s: unknown): s is string => typeof s === 'string' && UUID_RE.test(s);

// Belirteci Supabase'e doğrulatır; geçersizse null.
export async function kullaniciDogrula(ayar: SupabaseAyar, belirtec: string | null, getir: Getir = fetch): Promise<Kullanici | null> {
  if (!belirtec) return null;
  const r = await getir(`${ayar.url}/auth/v1/user`, { headers: { apikey: ayar.anon, Authorization: `Bearer ${belirtec}` } });
  if (r.status === 401 || r.status === 403) return null;
  if (!r.ok) throw new Error(`supabase auth ${r.status}`);
  const u: any = await r.json();
  if (!uuidMi(u?.id)) return null;
  const m = u.user_metadata ?? {};
  return { id: u.id, eposta: typeof u.email === 'string' ? u.email : null, ad: typeof (m.full_name ?? m.name) === 'string' ? (m.full_name ?? m.name) : null };
}

// Hizmet rolüyle PostgREST ve yönetim istekleri. Hizmet anahtarı yoksa null döner (çağıran atlar).
export function servisIstemci(ayar: SupabaseAyar | null, getir: Getir = fetch) {
  if (!ayar?.servis) return null;
  // Yeni biçim gizli anahtar (sb_secret_...) yalnız apikey başlığında gider; eski service_role JWT'si
  // ayrıca Authorization başlığında da gönderilir.
  const bas: Record<string, string> = ayar.servis.startsWith('sb_secret_')
    ? { apikey: ayar.servis }
    : { apikey: ayar.servis, Authorization: `Bearer ${ayar.servis}` };
  const kontrol = async (r: Response, ne: string) => {
    if (!r.ok) throw new Error(`supabase ${ne} ${r.status}`);
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  };
  return {
    // Satır ekler ya da birincil anahtar çakışırsa günceller.
    async upsert(tablo: string, satir: Record<string, unknown>) {
      const r = await getir(`${ayar.url}/rest/v1/${tablo}`, {
        method: 'POST',
        headers: { ...bas, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(satir),
      });
      return kontrol(r, `upsert ${tablo}`);
    },
    async sec(tablo: string, sorgu: string) {
      const r = await getir(`${ayar.url}/rest/v1/${tablo}?${sorgu}`, { headers: bas });
      return kontrol(r, `select ${tablo}`);
    },
    async sil(tablo: string, sorgu: string) {
      const r = await getir(`${ayar.url}/rest/v1/${tablo}?${sorgu}`, { method: 'DELETE', headers: bas });
      return kontrol(r, `delete ${tablo}`);
    },
    // auth.users kaydını siler; profiles, user_items ve licenses satırları ON DELETE CASCADE ile gider.
    async kullaniciSil(id: string) {
      if (!uuidMi(id)) throw new Error('geçersiz kullanıcı');
      const r = await getir(`${ayar.url}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: bas });
      return kontrol(r, 'admin delete');
    },
  };
}
export type ServisIstemci = NonNullable<ReturnType<typeof servisIstemci>>;
