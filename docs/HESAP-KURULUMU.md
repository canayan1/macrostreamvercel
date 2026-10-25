# Kalibre Markets hesapları: kurulum (Supabase)

Her kullanıcının kalıcı bir Kalibre Markets hesabı olur. Tek hesap tüm ürünleri kapsar (şimdilik
Kalibre Lab). Giriş e-postayla (tek kullanımlık bağlantı + 6 haneli kod) ya da Google ile yapılır;
şifre yoktur. Abone olmak için hesap gerekir, laboratuvar hesapsız da çalışır.

Kod hazır. Aşağıdaki adımlar hesap ve anahtar gerektirdiği için Can tarafından yapılır.
Anahtarları sohbete yazma: anon/publishable anahtarı herkese açıktır ve dosyaya girer, gizli
anahtar yalnız Vercel'e girilir.

Sıra önemli: 1 → 2 → 3 → 4 → 5 → 6 → 7. Toplam 45-60 dakika.

## 1. Supabase projesi

1. https://supabase.com → giriş → **New project**.
2. Organization: kendi organizasyonun. Name: `kalibre-markets`.
3. **Database password**: güçlü bir şifre üret ve parola yöneticine kaydet (kodda kullanılmaz).
4. **Region: Central EU (Frankfurt)** (`eu-central-1`). Gizlilik politikasındaki
   `[SUPABASE BÖLGESİ]` / `[SUPABASE REGION]` yerine "AB (Frankfurt, Almanya)" yazılacak.
5. **Create new project**. Hazırlanması 1-2 dakika sürer.
6. Ücretsiz plan başlangıç için yeter. Ücretsiz planda proje 7 gün hiç kullanılmazsa duraklatılır;
   canlıya çıkınca **Pro** plana geçmeyi düşün (aylık ~25 USD, duraklatma yok, günlük yedek).
7. **Settings → Legal documents** (ya da Organization → Legal): **DPA**'yı (veri işleme sözleşmesi)
   imzala/kabul et. Gizlilik politikası Supabase'i veri işleyen olarak anıyor.

## 2. Veritabanı

1. Sol menü **SQL Editor → New query**.
2. Bu repodaki `docs/supabase-kurulum.sql` dosyasının tamamını yapıştır → **Run**.
3. "Success. No rows returned" görmelisin. Tekrar çalıştırmak zararsızdır.
4. **Table Editor**'da `profiles`, `user_items`, `licenses` tablolarını görmelisin; üçünde de
   "RLS enabled" yazar.

Dosya, yerelde Postgres 16 üzerinde (Supabase'in auth şemasının bir taklidiyle) iki kez çalıştırılıp
denendi: kullanıcı yalnız kendi satırını görür, e-postasını değiştiremez, `licenses` tablosuna yazamaz,
hesap silinince her şey silinir.

## 3. Giriş adresleri (URL Configuration)

**Authentication → URL Configuration**:

- **Site URL**: `https://kalibremarkets.com`
- **Redirect URLs** (Add URL ile tek tek):
  - `https://kalibremarkets.com/**`
  - `https://www.kalibremarkets.com/**`
  - `https://*-canayan1s-projects.vercel.app/**` (Vercel önizlemeleri)
  - `http://127.0.0.1:8791/**` (yerel deneme; canlıya geçince silinebilir)

## 4. E-posta girişi ve SMTP

Supabase'in kendi e-posta gönderimi yalnız deneme içindir: saatte birkaç e-postayla sınırlıdır ve
spam'e düşer. Canlıdan önce kendi gönderim hizmetini bağla. Öneri: **Resend** (ücretsiz planda ayda
3.000 e-posta). Postmark, Amazon SES ya da Brevo da olur.

### 4a. Resend
1. https://resend.com → hesap aç → **Domains → Add domain** → `kalibremarkets.com`
   (ya da `mail.kalibremarkets.com` alt alanı).
2. Resend'in verdiği DNS kayıtlarını (SPF/TXT, DKIM, isteğe bağlı DMARC) alan adının DNS'ine ekle
   (Vercel → Domains → kalibremarkets.com → DNS Records, ya da alan adının kayıtlı olduğu yer).
   "Verified" olana kadar bekle (birkaç dakika ile birkaç saat).
3. **API Keys → Create API key** (Sending access). Anahtar bir kez gösterilir; bir sonraki adımda
   doğrudan Supabase'e yapıştır.

### 4b. Supabase SMTP
**Authentication → Emails → SMTP Settings → Enable custom SMTP**:
- Sender email: `giris@kalibremarkets.com` (doğrulanmış alan adından)
- Sender name: `Kalibre Markets`
- Host: `smtp.resend.com`, Port: `465`, Username: `resend`, Password: Resend API anahtarı
- **Save**. Sonra **Authentication → Rate Limits**'te e-posta sınırını ihtiyaca göre yükselt
  (ör. saatte 100).

Gizlilik politikasındaki `[E-POSTA GÖNDERİM SAĞLAYICISI]` / `[EMAIL DELIVERY PROVIDER]` yerine
seçtiğin hizmet (ör. "Resend, Inc.") yazılacak.

### 4c. E-posta şablonları (kod da içersin)
Site, bağlantının yanında 6 haneli kodu da kabul eder: kullanıcı e-postayı telefonda açıp kodu
bilgisayara yazabilir. Bunun için şablonlarda `{{ .Token }}` olmalı.

**Authentication → Emails → Templates**:

**Magic Link** ve **Confirm signup** şablonlarının ikisine de (konu ve gövde):

Konu: `Kalibre Markets sign-in code: {{ .Token }}`

Gövde:
```html
<p>Use this code to sign in to Kalibre Markets:</p>
<p style="font-size:24px;font-weight:600;letter-spacing:4px">{{ .Token }}</p>
<p>Or open this link in the same browser: <a href="{{ .ConfirmationURL }}">Sign in to Kalibre Markets</a></p>
<p>The code expires in 1 hour. If you did not try to sign in, you can ignore this email.</p>
<p>Giriş kodun yukarıda. Bu girişi sen istemediysen e-postayı yok sayabilirsin.</p>
```

**Authentication → Providers → Email**: Enable Email provider açık; **Confirm email** açık;
**Email OTP Expiration** 3600 sn; **Email OTP Length** 6.

## 5. Google ile giriş

### 5a. Google Cloud
1. https://console.cloud.google.com → yeni proje: `Kalibre Markets`.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - User type: **External**
   - App name: `Kalibre Markets`, support email: `markets@kalibrefin.com`
   - App domain: home `https://kalibremarkets.com`, privacy `https://kalibremarkets.com/en/privacy`,
     terms `https://kalibremarkets.com/en/terms`
   - Authorized domains: `kalibremarkets.com` ve `supabase.co`
   - Scopes: yalnız `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
     (bunlar "hassas olmayan" kapsamlardır; Google incelemesi gerekmez)
   - **Publish app** (Testing'de kalırsa yalnız eklediğin test kullanıcıları girebilir)
3. **Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**, name: `Supabase`
   - Authorized JavaScript origins: `https://kalibremarkets.com`
   - **Authorized redirect URIs**: `https://<proje-kimliği>.supabase.co/auth/v1/callback`
     (tam adres Supabase'de Authentication → Providers → Google sayfasında "Callback URL" olarak yazar)
   - Create → **Client ID** ve **Client secret** görünür.

### 5b. Supabase
**Authentication → Providers → Google → Enable**: Client ID ve Client secret'ı yapıştır → **Save**.

Not: Google giriş ekranında "supabase.co'ya devam et" yazar. İstersen sonra Supabase'in **Custom
Domain** eklentisiyle (ör. `auth.kalibremarkets.com`, ücretli) bunu kendi alan adınla değiştirirsin.

## 6. Anahtarları yerine koy

**Project Settings → API Keys** (ya da Data API):
- **Project URL**: `https://<proje-kimliği>.supabase.co`
- **Publishable key** (`sb_publishable_...`) ya da eski adıyla **anon public** anahtarı: herkese açıktır.
- **Secret key** (`sb_secret_...`) ya da eski adıyla **service_role**: GİZLİ.

### 6a. Sitedeki dosya (herkese açık değerler)
`static/kalibre-config.js`:
```js
window.KALIBRE_CONFIG = {
  supabaseUrl: 'https://<proje-kimliği>.supabase.co',
  supabaseAnonKey: 'sb_publishable_...'
};
```
Bu iki değeri Claude'a söyleyebilirsin (gizli değiller); dosyaya o yazar. Gizli anahtarı söyleme.

### 6b. Vercel ortam değişkenleri
Vercel → macrostreamvercel → **Settings → Environment Variables** → her biri için
**Production ve Preview** seçili:

| Ad | Değer | Sensitive |
|---|---|---|
| `SUPABASE_URL` | Project URL | hayır |
| `SUPABASE_ANON_KEY` | publishable/anon anahtarı | hayır |
| `SUPABASE_SERVICE_ROLE_KEY` | secret/service_role anahtarı | **evet** |

Gizli anahtar yalnız sunucuda kullanılır: lisansı hesaba bağlamak, Hesabım'daki lisans görüntüsünü
güncellemek ve hesap silmek için. Tarayıcıya ya da repoya hiç girmez.

Değişkenleri ekledikten sonra yeni bir yükleme (deploy) gerekir; Claude önizleme yüklemesini yapar.

## 7. Deneme (önizleme adresinde)

1. `/en/sign-in` → e-postanı yaz → gelen e-postadaki kodu gir → Hesabım (`/en/license`) açılır.
2. Çıkış yap → **Continue with Google** → aynı e-postayla girersen aynı hesaba düşersin.
3. Laboratuvarda bir strateji değiştir → birkaç saniye sonra Hesabım → Kayıtlı stratejiler'de görünür.
4. Fiyatlar → Abone ol → (Stripe test modu) test kartı `4242 4242 4242 4242` → Hesabım'da lisans.
5. Beta lisansı bağlama: `node --env-file=.env.local yerel/beta-lisans.mjs bagla --anahtar KLM-... --hesap e-posta@ornek.com`
   (`.env.local` için `vercel env pull .env.local`; dosya repoya girmez).
6. Hesabı sil (test hesabıyla): Stripe test aboneliği "cancel at period end" olur, Supabase'te
   kullanıcı silinir.

## Bilinmesi gerekenler

- **Mevcut beta lisansları**: hesap yokken verilen anahtarlar çalışmaya devam eder. Testçi giriş yapıp
  Hesabım'da "Hesabıma bağla"yla anahtarı hesabına bağlar ya da sen CLI ile bağlarsın.
- **Bir anahtar tek hesaba** bağlanır; başka hesaba bağlanmaya çalışılırsa "bu anahtar başka bir
  hesaba bağlı" denir. Taşımak gerekirse destek işidir (şimdilik elle, depo kaydındaki `kullanici` alanı).
- **Aynı hesapta ikinci ücretli abonelik açılmaz**; önceki Stripe müşterisi varsa yeniden kullanılır.
- **Ödeme sayfası** artık girişi zorunlu tutar. Supabase ayarları Vercel'de yoksa "Abone ol"
  "Hesaplar henüz açılmadı" der ve ödeme açılmaz.
- Çok ürünlü yapı: `licenses.product` alanı şimdilik `lab`. İkinci ürün gelince aynı hesap, yeni bir
  ürün değeri ve kendi lisans kayıtları; şema değişmez.
