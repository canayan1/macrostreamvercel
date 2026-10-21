# Ürün sitesi: canlıya almadan önce

`urun-sitesi` dalı canlıya alınmadan önce tamamlanması gerekenler. İşaretlenmeyen madde varken
`vercel --prod` yapılmaz.

## Can'ın yapacakları (hesap ve anahtar gerektirir)

- [ ] **Upstash Redis**: Vercel → Storage → Upstash. Köprü rölesi ve lisans kayıtları kullanır.
- [ ] **Stripe (önce test modu)**
  - [ ] Ürün "Kalibre Lab", aylık yinelenen fiyat (ör. 399 TRY) → `STRIPE_PRICE_ID`
  - [ ] Webhook: `https://kalibremarkets.com/api/odeme/webhook`, olaylar:
        `checkout.session.completed`, `customer.subscription.created|updated|deleted`,
        `invoice.paid`, `invoice.payment_failed` → `STRIPE_WEBHOOK_SECRET`
  - [ ] Müşteri portalı: iptal, kart güncelleme, faturalar açık
  - [ ] `STRIPE_SECRET_KEY`
- [ ] **Lisans sırrı**: `openssl rand -hex 32` → Vercel'de `KALIBRE_LISANS_SIRRI`; aynı değer
      kalibre-lab'de `mql5/Include/Kalibre/LisansSirri.mqh` içine (repoya girmez). Motor ve Köprü
      bu dosyayla yeniden derlenir.
- [ ] Gizlilik politikasında `[STRIPE TÜZEL KİŞİSİ]`, `[DEPO SAĞLAYICI]`, `[UNVAN]`, `[ADRES]`
- [ ] Avukat incelemesi: gizlilik ve şartlardaki `AVUKAT İÇİN` yorumları (yurt dışı aktarım,
      mesafeli satış ve cayma hakkı, lisans maddesi, Stripe'ın rolü)

## Geliştirme tarafında kalanlar

- [x] **Eklenti indirme**: `/hesap` sayfasında geçerli lisansa `/api/indir` ile (POST, anahtar URL'de
      görünmez). Dosyalar depoda `eklenti:kopru|motor` anahtarında.
- [ ] **Eklentileri yükle**: lisans sırrıyla derlenmiş `.ex5`'ler, Upstash bilgileri ortamdayken
      `node yerel/eklenti-yukle.mjs kopru <yol> 1.00` ve `... motor <yol> 0.20`.
- [ ] Kurulum sayfasına ekran görüntüleri (hesap numarası ve ad görünmeyecek şekilde).
- [ ] OG görseli (`og-default.png`) yeni tasarıma göre.
- [ ] Test kartıyla gerçek Stripe test modunda uçtan uca deneme (önizleme adresinde).

## Bilinen notlar

- MT5, `/config:` başlangıç dosyasıyla açıldığında WebRequest izin listesini uygulamıyor
  (build 6275, Wine). Normal açılışta liste korunur; yerel denemede izin her yeniden başlatmada
  tekrar eklenmeli.
- MT5, OnInit içinde WebRequest'e izin vermez (4014). Motor ve Köprü lisansı ilk zamanlayıcı
  adımında denetler.
