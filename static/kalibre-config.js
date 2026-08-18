/* Kalibre — istemci tarafı yapılandırma.
 *
 * Buradaki iki değer GİZLİ DEĞİLDİR; Supabase'in "anon" anahtarı tarayıcıda
 * çalışmak üzere tasarlanmıştır ve Google Analytics kimliği gibi herkese
 * açıktır. Veriyi koruyan şey anahtarın gizliliği değil, veritabanındaki
 * Row Level Security (RLS) kurallarıdır.
 *
 * !!! "service_role" anahtarı ASLA buraya yazılmaz; o gerçek bir sırdır. !!!
 *
 * Kurulum (2 dakika):
 *   1. supabase.com → yeni proje aç (ücretsiz).
 *   2. Project Settings → API → "Project URL" ve "anon public" anahtarını kopyala.
 *   3. Aşağıdaki iki alana yapıştır, siteyi yeniden yayınla.
 *   4. docs/supabase-kurulum.sql dosyasındaki SQL'i Supabase SQL Editor'de çalıştır.
 *
 * Boş bırakılırsa site tamamen çalışmaya devam eder: kayıtlar yalnızca
 * kullanıcının kendi tarayıcısında (localStorage) tutulur, giriş arayüzü gizlenir.
 */
window.KALIBRE_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
