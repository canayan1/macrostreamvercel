/* Kalibre Markets: istemci tarafı yapılandırma (hesaplar, Supabase).
 *
 * Buradaki iki değer GİZLİ DEĞİLDİR: Supabase'in publishable/anon anahtarı tarayıcıda çalışmak
 * üzere tasarlanmıştır. Veriyi koruyan şey anahtarın gizliliği değil, veritabanındaki Row Level
 * Security (RLS) kurallarıdır (docs/supabase-kurulum.sql).
 *
 * Gizli anahtar (sb_secret_... / service_role) ASLA buraya yazılmaz; yalnız Vercel'de
 * SUPABASE_SERVICE_ROLE_KEY olarak durur.
 *
 * Kurulum: docs/HESAP-KURULUMU.md (6a).
 *
 * Boşken laboratuvar ve ücretsiz araçlar çalışır; giriş ve abonelik açılmaz (yerel ve önizleme
 * adreslerinde başlıkta "Sign-in not configured" görünür, canlıda hiçbir şey görünmez).
 */
window.KALIBRE_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
