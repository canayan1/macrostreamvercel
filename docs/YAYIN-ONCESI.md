# Ürün sitesi: canlıya almadan önce

`urun-sitesi` dalı canlıya alınmadan önce tamamlanması gerekenler. İşaretlenmeyen madde varken
`vercel --prod` yapılmaz. Güncel ve ayrıntılı liste: `docs/CANLIYA-CIKIS.md` (25.10.2026: bu
hafta beta olarak, ödemeler açık; ayrı beta adresi yok).

## Önizleme

Son önizleme: https://macrostreamvercel-ecylm9qpq-canayan1s-projects.vercel.app (24.10.2026,
`vercel deploy --yes`, canlı değil). Her yeni yüklemede adres değişir; proje panelindeki son
"Preview" yüklemesi geçerlidir. Koruma: Settings → Deployment Protection → Vercel Authentication.

## Can'ın yapacakları (hesap ve anahtar gerektirir)

- [ ] **Upstash Redis**: Vercel → Storage → Upstash. Köprü rölesi ve lisans kayıtları kullanır.
      Projede eski `KV_*` değişkenleri duruyor ve önizlemede `/api/kopru` 502 veriyor: ya eski depo
      silinmiş ya da erişilemiyor. Yeni depo bağlanınca eski `KV_*` değişkenleri kaldırılmalı.
- [ ] **Hesaplar (Supabase)**: `docs/HESAP-KURULUMU.md` adım 1-6 (proje, SQL, adresler, SMTP,
      Google, anahtarlar). Bunlar olmadan "Abone ol" çalışmaz: ödeme hesap ister.
- [ ] **Stripe (önce test modu)**
  - [ ] Ürün "Kalibre Lab", aylık yinelenen tek fiyat: 19 USD, aynı fiyata para birimi seçeneği
        (currency options) 17 EUR; TRY yok. Ödemeler şirket kurulana kadar kapalı (`ODEME_ACIK = False`) → `STRIPE_PRICE_ID`. Ödeme sayfası müşterinin konumuna göre
        para birimini kendisi seçer.
  - [ ] Webhook: `https://kalibremarkets.com/api/odeme/webhook`, olaylar:
        `checkout.session.completed`, `customer.subscription.created|updated|deleted`,
        `invoice.paid`, `invoice.payment_failed` → `STRIPE_WEBHOOK_SECRET`
  - [ ] Müşteri portalı: iptal, kart güncelleme, faturalar açık
  - [ ] Davet kuponu "Kalibre ilk testçiler": %100, 3 ay yinelenen, metadata `urunler=kopru`;
        testçi başına tek kullanımlık promosyon kodu (ayrıntı `CANLIYA-CIKIS.md`)
  - [ ] `STRIPE_SECRET_KEY`
- [ ] **Lisans sırrı**: `openssl rand -hex 32` → Vercel'de `KALIBRE_LISANS_SIRRI`; aynı değer
      kalibre-lab'de `mql5/Include/Kalibre/LisansSirri.mqh` içine (repoya girmez). Motor ve Köprü
      bu dosyayla yeniden derlenir.
- [ ] Gizlilik politikasında `[STRIPE TÜZEL KİŞİSİ]`, `[DEPO SAĞLAYICI]`, `[UNVAN]`, `[ADRES]`
- [ ] Avukat incelemesi: gizlilik ve şartlardaki `AVUKAT İÇİN` yorumları ve İngilizce
      sürümlerdeki `FOR COUNSEL` notları (AB/İngiltere tüketicileri için bağımsız İngilizce metin gerekir mi?) (yurt dışı aktarım,
      mesafeli satış ve cayma hakkı, lisans maddesi, Stripe'ın rolü)

## Geliştirme tarafında kalanlar

- [x] **Eklenti indirme**: `/hesap` sayfasında geçerli lisansa `/api/indir` ile (POST, anahtar URL'de
      görünmez). Dosyalar depoda `eklenti:kopru|motor` anahtarında.
- [ ] **Eklentileri yükle**: lisans sırrıyla derlenmiş `.ex5`'ler, Upstash bilgileri ortamdayken
      `node yerel/eklenti-yukle.mjs kopru <yol> 1.00` ve `... motor <yol> 0.21`.
- [ ] Kurulum sayfasına ekran görüntüleri (hesap numarası ve ad görünmeyecek şekilde).
- [x] OG görseli yeni tasarımda (`yerel/og-uret.py`).
- [ ] Test kartıyla gerçek Stripe test modunda uçtan uca deneme (önizleme adresinde), promosyon
      koduyla kartsız abonelik dahil.
- [x] Beta metinleri: beta bandı, risk bildirimi (TR/EN), şartlar 8a/8b, fiyat sayfasında 503'te
      "Ödemeler yakında" yedeği, site haritası ve robots.txt (25.10.2026).
- [x] Motor 0.21: gerçek hesapta açık onay ve kayıp sınırı olmadan yeni işlem yok (kalibre-lab).

## Bilinen notlar

- MT5, `/config:` başlangıç dosyasıyla açıldığında WebRequest izin listesini uygulamıyor
  (build 6275, Wine). Normal açılışta liste korunur; yerel denemede izin her yeniden başlatmada
  tekrar eklenmeli.
- MT5, OnInit içinde WebRequest'e izin vermez (4014). Motor ve Köprü lisansı ilk zamanlayıcı
  adımında denetler.
