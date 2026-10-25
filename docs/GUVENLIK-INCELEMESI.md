# Güvenlik incelemesi (aşama 2: gerçek hesaplarda yalnız okuma öncesi)

Tarih: 25 Ekim 2026. Kapsam: kalibremarkets.com ürün sitesi (`urun-sitesi` dalı), `/api/*` uçları,
laboratuvar (`lab/`), MT5 eklentileri. Her madde ya bir kontrol ya da bir bulgudur; bulgular
ciddiyet ve dosya:satır ile yazılmıştır.

## 1. Köprü rölesi (`api/kopru.ts`)

- [x] Kanal ve yuva kimlikleri sabit biçimli (32 ve 16 hex); başka girdi 400.
- [x] Zarf denetimi: yalnız bilinen alanlar yeniden kurulup saklanır; en çok 2 MB.
- [x] TTL 2 saat; daha yenisi gelince üzerine yazılır.
- [x] Kanal başına dakikada 60 yazma sınırı.
- [x] Gövde günlüğe yazılmaz; depo hatası istemciye ayrıntı vermez.
- [x] CORS: okuma her kökenden açık (içerik şifreli). Yazma yalnız eklentiden (tarayıcı yazmaz).
- [ ] **Yapılacak:** okuma (GET) için kanal başına hız sınırı yok. Kanal kimliği 128 bit ve tahmin
      edilemez olduğu için risk düşük; yine de depo maliyetini korumak için IP başına basit bir sınır
      eklenmeli. Ciddiyet: düşük.
- [ ] **Yapılacak:** üretimde Upstash bölgesi ve yedeklemesi belirlenmeli; eski `KV_*`
      değişkenleri kaldırılmalı.

## 2. Lisans ucu (`api/lisans.ts`, `api/_lib/lisans.ts`)

- [x] Anahtar 100 bit (20 karakter Crockford base32); biçim denetimi.
- [x] Hesap numarası başına dakikada 20 istek; aşılırsa 429.
- [x] Belirteç HMAC-SHA256 ile imzalı; sır Vercel ortam değişkeninde.
- [ ] **Bilinen sınır:** aynı sır derlenmiş `.ex5` içinde gömülü. Kararlı bir saldırgan çıkarıp sahte
      belirteç üretebilir. Etki: lisans atlama (veri sızıntısı değil). Öneri: asimetrik imza
      (Ed25519) ile eklenti yalnız açık anahtarı taşır. Ciddiyet: orta (gelir), aşama 2 için engel değil.
- [ ] **Yapılacak:** anahtar başına (hesap numarasından bağımsız) bir deneme sınırı. Ciddiyet: düşük.
- [x] Beta lisansları (`yerel/beta-lisans.mjs`) aynı kayıt biçimini kullanır; Stripe kayıtlarına dokunmaz.
- [x] Ürün kapsamı: kayıttaki `urunler` alanı lisans ucu ve indirmede uygulanır; beta lisansları yalnız `kopru`'yu kapsar, Motor isteği 403 (testli).

## 3. Ödeme uçları (`api/odeme/*`)

- [x] Webhook imzası ham gövde üzerinden, 300 sn tolerans, zamanlamaya dayanıklı karşılaştırma.
- [x] Dönüş adresleri bilinen alanlarla sınırlı (`kokAdres`); sahte Host başlığı dış siteye döndüremez.
- [x] Şartlar onayı olmadan Checkout açılmaz.
- [x] Portal: beta lisansına anlaşılır mesaj, Stripe müşterisi olmayan kayda 404.
- [ ] **Yapılacak:** `vercel.app` alt alanlarının tümü izinli; üretimde yalnız kendi proje önizleme
      desenine daraltılmalı. Ciddiyet: düşük.

## 4. Tarayıcıda saklanan sırlar ve XSS

Tarayıcının yerel deposunda (localStorage) duranlar: eşleştirme kodu (`kalibre-kopru-kod`),
lisans anahtarı (`kalibre-lisans-anahtari`), Alpaca anahtarları (`kalibre-alpaca`), Tradier
belirteci (`kalibre-tradier`). Sayfada çalışan herhangi bir betik bunları okuyabilir. Bu yüzden
XSS bu ürünün en önemli riskidir.

### innerHTML incelemesi (lab/src ve site static/, 25.10.2026)

Ağdan gelen ya da kullanıcının içe aktardığı veriyi HTML'e koyan yerler tek tek okundu.
Ortak kaçış işlevi `kacis` (& < > " ' dönüştürür) her modülde tanımlı.

| Dosya:satır | Ne yazılıyor | Kaynak | Durum | Ciddiyet |
|---|---|---|---|---|
| lab/src/uygulama.js:120 (`sayiAlani`) | `value="${v}"` ve `data-yol="${yol}"` kaçışsız | İçe aktarılan ya da taslaktan gelen strateji JSON'u (`yol` gösterge adını içerir) | **Güvensiz**: içe aktarılan bir strateji dosyasında sayısal alana ya da gösterge adına `"` ve olay özniteliği konursa betik çalışır; localStorage'daki anahtarlar okunabilir | **Yüksek** |
| lab/src/uygulama.js:145 ve gösterge kartları | `data-yol` içinde gösterge adı (`gostergeler.${ad}...`) | İçe aktarılan strateji | Ad değeri `kacis`'li ama `data-yol` öznitelikleri kaçışsız | **Yüksek** (yukarıdakiyle aynı kök neden) |
| lab/src/blok-arayuz.js:83, 84 | `value="${t.periyot}"`, `value="${t.sapma}"` | İçe aktarılan strateji | **Güvensiz** (sayı yerine metin gelirse) | **Yüksek** |
| lab/src/blok-arayuz.js:90 (`sayiGirdisi`) | `value="${v}"` (eşikler) | İçe aktarılan strateji | **Güvensiz** (aynı) | **Yüksek** |
| lab/src/uygulama.js:110 | `value="${deger}"` | Yalnız `typeof number` iken | Güvenli | - |
| lab/src/uygulama.js:320 | doğrulama mesajları ve yol | `dogrula` (içe aktarılan anahtar adları mesajda geçer) | `kacis`'li, güvenli | - |
| lab/src/uygulama.js:349, 437-470 (`provaBos`) | hata mesajları | dosya/röle hataları | Çağıranlar `kacis` kullanıyor, güvenli | - |
| lab/src/panom.js:120 (kotalar) | sembol, tanım | MT5 / Alpaca / Tradier | `kacis`'li; fiyatlar çözücüde sayı denetiminden geçiyor, güvenli | - |
| lab/src/panom.js:37 (`backtestBaglantisi`) | href içinde sembol | aracı kurum | `encodeURIComponent`, güvenli | - |
| lab/src/panom.js:144, 198, 206 | pozisyon ve işlem tabloları | aracı kurum | Metinler `kacis`'li, sayılar çözücüde doğrulanmış, güvenli | - |
| lab/src/baglanti-arayuz.js:79, 96 | seri listesi, pozisyonlar, para birimi | MT5 köprüsü | `kacis`'li, güvenli | - |
| lab/src/tradier-baglan.js:44 | hesap listesi | Tradier | `kacis`'li, güvenli | - |
| lab/src/tradier-kaynak.js:20, 26, 60 | sembol, notlar | kullanıcı/aracı kurum | `kacis`'li, güvenli | - |
| lab/src/optimizasyon-arayuz.js:90-95 | parametre etiketleri ve yolları | içe aktarılan strateji | Etiket ve yol `kacis`'li; min/max/adım motorun ürettiği sayılar, güvenli | - |
| lab/src/optimizasyon-arayuz.js:308-330 | sonuç tablosu | motor çıktısı | `kacis`'li ya da sayı, güvenli | - |
| lab/src/oynaklik-lab.js:84 | `veri.zamanDilimi`, tarih aralığı | kullanıcının yüklediği dosya | Kaçışsız; zaman dilimi çözücüde bilinen değerlerle sınırlı olduğu için pratikte düşük risk; yine de `kacis` eklenmeli | Düşük |
| lab/src/oynaklik-lab.js:48, 50 | seri adları ve tablo hücreleri | iç sabitler ve hesaplanan sayılar | Güvenli | - |
| lab/src/dil.js:61-62 | çeviri sözlüğü | statik sözlük | Güvenli | - |
| static/beta.js, kabuk.js, kalkan-hesap.js, karar-notu.js | sabit metinler, hesaplanan sayılar | sayfa | `textContent` ya da sabit, güvenli | - |

**Senaryo (yüksek bulgular):** biri "harika strateji" diye bir JSON dosyası paylaşır; kullanıcı
"İçe aktar" ile yükler; form çizilirken öznitelik kırılır ve betik çalışır; betik localStorage'daki
eşleştirme kodunu, lisans anahtarını ve Alpaca/Tradier anahtarlarını dışarı gönderir. Alpaca ve
Tradier anahtarları emir verme yetkisi taşıdığı için etki yüksektir.

**Düzeltme (lab/ üzerinde çalışan geliştirici için):** bütün öznitelik değerleri (`value`, `data-*`,
`aria-label` içindeki dinamik kısımlar) `kacis` ile yazılmalı; içe aktarılan dosya form çizilmeden önce
biçim olarak süzülmeli (bilinmeyen alanlar atılmalı, sayısal alanlara yalnız sayı kabul edilmeli);
bir regresyon testi eklenmeli: kötü niyetli örnek dosya içe aktarılınca `document` içinde olay
özniteliği oluşmamalı. Aşama 2 için **engel**.

### İçerik Güvenliği Politikası (CSP) önerisi

Henüz açılmadı. Açmadan önce sayfalardaki satır içi `<script>` blokları (ör. `/pro`, `/hesap`,
`/beta` sayfa betikleri) ayrı dosyalara taşınmalı; aksi halde `'unsafe-inline'` gerekir ve CSP'nin
XSS'e karşı değeri düşer. Hedef başlık (`vercel.json` > `headers`):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com;
  connect-src 'self' https://api.alpaca.markets https://paper-api.alpaca.markets https://data.alpaca.markets
              https://api.tradier.com https://sandbox.tradier.com
              https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com;
  form-action 'self' https://formsubmit.co;
  frame-ancestors 'none';
  base-uri 'self';
  object-src 'none'
```

Ek başlıklar: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.

Not: `connect-src` kısıtı, XSS olsa bile anahtarların bilinmeyen bir sunucuya gönderilmesini
zorlaştırır; içe aktarma bulgusu düzeltilse de bu katman eklenmeli.

## 5. Üçüncü taraf betikler

- [x] Google Analytics yalnız açık rızayla yüklenir (`static/kalibre-cerez.js`).
- [x] Google Fonts stil dosyası (yalnız CSS ve yazı tipi).
- [ ] **Yapılacak:** asistan bileşeni (`static/asistan.js` + `/api/asistan`) ürün sayfalarında
      kullanıcı metnini üçüncü taraf yapay zekâ hizmetine gönderir; beta sırasında ürün sayfalarında
      kapalı tutulması ya da gizlilik metniyle tutarlı olduğunun teyidi. Ciddiyet: düşük.
- [ ] **Yapılacak:** yazı tiplerini kendi alanımızdan sunmak (Google'a IP aktarımını kaldırır; KVKK/GDPR için temiz).

## 6. Bağımlılıklar

- Site: `@vercel/node`, `@vercel/blob` (çalışma zamanında yalnız `@vercel/node` tipleri). Laboratuvar
  tarayıcı tarafında dış bağımlılık yok. MT5 eklentileri standart kütüphane.
- [ ] **Yapılacak:** `npm audit` (site) ve yılda iki kez bağımlılık güncellemesi; Vercel CLI 52 → güncel.

## 7. MT5 eklentileri

- [x] Köprü yalnız okur; Motor yalnız kullanıcının kural dosyasıyla, kullanıcının terminalinde.
- [x] WebRequest izni kullanıcıda; eklenti yalnız izin verilen adrese konuşur.
- [ ] **Yapılacak:** dağıtılan `.ex5` dosyalarının SHA-256 özetleri `/hesap` sayfasında gösterilsin
      (indirilen dosyanın bizden geldiği doğrulanabilsin).

## Aşama 2 için engel olanlar

1. İçe aktarılan strateji dosyalarından XSS (bölüm 4, yüksek bulgular).
2. CSP ve ek güvenlik başlıkları (bölüm 4).
3. Gizlilik politikası boşlukları ve avukat incelemesi (`docs/BETA-PLANI.md` bölüm 6).
