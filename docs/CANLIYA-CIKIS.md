# Canlıya çıkış: kalibremarkets.com, Kalibre Lab (beta)

Hazırlandı: 25 Ekim 2026. Hedef: bu hafta, beta olarak.

**Güncelleme 25.10.2026 (Can):** şirket kurulana kadar ödemeler KAPALI. Çıkış = bekleme listesi +
davetli demo/beta kullanıcıları (ücretsiz beta lisansı, hesaba "Hesabıma bağla" ile). Fiyat
sayfaları planlanan lansman fiyatını (19 USD/ay, 17 EUR) gösterir, birincil düğme "Join the
waitlist" / "Request beta access". `yerel/sayfa-uret.py` içinde `ODEME_ACIK = False`; Stripe kod
yolu duruyor. Site kökü İngilizce, Türkçe `/tr` altında (adres haritası `yerel/kok-ingilizce-tasi.py`).
Ürün adları iki dilde de çevrilmez: Kalibre Bridge, Kalibre Engine.
Ayrı bir beta adresi yok: canlı site beta etiketiyle yayına girer. Her sayfada beta bandı var
(`static/beta.js`): "Kalibre Lab beta sürümünde. Sonuçlar simülasyondur; gerçek parayla karar
vermeden önce riskleri oku." Bant risk bildirimine ve beta rehberine götürür.

Ürün adları: **Kalibre Lab (beta)** (site ve laboratuvar), **Kalibre Köprü / Kalibre Bridge**
(MT5'ten yalnız okuma), **Kalibre Motor / Kalibre Engine** (kural dosyasını MT5'te yürüten eklenti).

## Neler hazır (Claude, 25.10.2026)

- Fiyat sayfaları `/pro/` ve `/en/pricing/`: gerçek "Abone ol" akışı, "beta" etiketi. Sunucuda
  Stripe yapılandırılmamışsa (`/api/odeme/baslat` 503 dönerse) sayfa kendiliğinden "Ödemeler yakında"
  kartına düşer. Derleme anındaki anahtar: `yerel/sayfa-uret.py` içinde `ODEME_ACIK = True`.
- Ana sayfa CTA'sı: "Kalibre Lab is in beta. Planned price at launch: $19 per month." + bekleme listesi ve beta erişimi.
- Risk bildirimi: `/risk-bildirimi/` ve `/en/risk-disclosure/` (beta, simülasyon uyarısı CFTC 4.41
  tarzında, kaldıraç kayıp oranları ESMA 2018 ve SPK 2015, Motor'un gerçek hesap riskleri,
  tavsiye değildir, veri). Alt bilgide ve kurulum/prop sayfalarında bağlantı.
- Kullanım şartları (TR ve EN): madde 8a "Beta sürümü" ve 8b "Kalibre Motor'un gerçek hesapta
  kullanımı". Yürürlük 25 Ekim 2026. Avukat notları metnin içinde.
- Motor 0.21: gerçek para hesabında açık onay (`InpGercekOnay`) ve bir kayıp sınırı (prop kalkanı
  ya da strateji `gunluk_max_kayip`) yoksa yeni işlem açmaz; panelde "BETA". Demo, yarışma ve
  Strategy Tester etkilenmez. Ayrıntı: kalibre-lab `docs/kalkan.md`.
- Ödeme: `payment_method_collection: 'if_required'` (%100 indirimli davet kodunda kart istenmez),
  promosyon kodları açık.
- Kupon kapsamı: kupon metadata'sında `urunler=kopru` varsa açılan lisans, kupon etkin olduğu
  sürece yalnız Köprü'yü kapsar (Motor lisans ve indirme istekleri 403). Kupon bitip
  `customer.subscription.updated` ya da `invoice.paid` kuponsuz gelince kayıttaki `urunler` silinir
  ve lisans tam ürünü kapsar. İndirim açılmamış kimlik olarak gelirse abonelik açılmış hâliyle
  yeniden çekilir; kupon okunamazsa kapsam değişmez. Testler: `test/lisans.test.mjs`.
- Ödeme onayı: `/pro` ve `/en/pricing` sayfalarında şartlar kutusuna ek olarak zorunlu cayma onayı
  kutusu var (lisans etkinleşince ifaya başlanır, cayma hakkı sona erer; şartlar 12a).
  `/api/odeme/baslat` `cayma_onay: true` olmadan 400 döner; onay, zamanı ve şart sürümü
  (`2026-10-25`) Checkout ve abonelik metadata'sına yazılır. Testler: `test/odeme.test.mjs`.
- Şartlar 25 Ekim 2026 sürümü: ehliyet ve yaptırımlar (2a), aracı kurum bağlantıları ve anahtarlar
  (8c), stratejiler kullanıcının (10a), cayma, fiyat değişikliği, deneme ve kodlar, vergiler
  (12a-12d), azami sorumluluk ve mücbir sebep (13), üçüncü kişi talepleri (13a), askıya alma ve
  fesih (14), genel hükümler ve bildirimler (16, 16a). Taslak ve rakip karşılaştırması avukata
  ayrıca verilecek.
- Site haritası: `sitemap.xml` (55 adres, TR/EN eşleri hreflang ile), `yerel/site-haritasi.py` ile
  yeniden üretilir. `robots.txt` `/api/` yolunu taramaya kapatır.

## Can'ın yapacakları (canlıya çıkmadan önce)

Hepsi hesap, anahtar ya da hukuki karar gerektirir; Claude bunları yapamaz.

### 1. Altyapı

- [ ] **Upstash Redis**: Vercel → Storage → Upstash, projeye bağla (Production + Preview).
      Eski `KV_*` değişkenlerini kaldır (önizlemede `/api/kopru` 502 veriyordu).
- [ ] **Lisans sırrı**: `openssl rand -hex 32` → Vercel'de `KALIBRE_LISANS_SIRRI` (Production +
      Preview); aynı değeri kalibre-lab'de `mql5/Include/Kalibre/LisansSirri.mqh` içine yaz (repoya
      girmez). Sonra Claude'a "eklentileri derle ve yükle" de.

### 2. Stripe: önce test modunda tam deneme

Aynı adımları önce **test modunda** yap, Preview ortamına test anahtarlarını gir ve aşağıdaki
"Uçtan uca deneme"yi Claude ile bitir. Sorunsuzsa canlı modda tekrarla.

- [ ] **Ürün ve fiyat**: Product catalog → Add product "Kalibre Lab". Tek fiyat: Recurring, Monthly,
      **19 USD** (ana para birimi). Aynı fiyatın içinde "Add currency" (currency options) ile **17 EUR**. TRY yok.
      Fiyatın kimliği (`price_...`) → `STRIPE_PRICE_ID`. Ödeme sayfası müşterinin konumuna göre para
      birimini kendisi seçer.
- [ ] **Webhook**: Developers → Webhooks → Add endpoint
      `https://kalibremarkets.com/api/odeme/webhook` (test denemesinde önizleme adresi). Altı olay:
      - `checkout.session.completed`
      - `customer.subscription.created`
      - `customer.subscription.updated`
      - `customer.subscription.deleted`
      - `invoice.paid`
      - `invoice.payment_failed`

      Signing secret (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.
- [ ] **Müşteri portalı**: Settings → Billing → Customer portal. Açık: aboneliği iptal (dönem
      sonunda), ödeme yöntemini güncelle, fatura geçmişi. Kapalı: plan değiştirme ve adet. İşletme
      bilgileri, kullanım şartları (`/kullanim-sartlari/`) ve gizlilik (`/gizlilik/`) bağlantıları.
- [ ] **Davet kuponu**: Product catalog → Coupons → New.
      - Ad: **Kalibre ilk testçiler**
      - Tür: yüzde, **%100**
      - Süre: **Repeating, 3 ay**
      - Metadata: anahtar `urunler`, değer `kopru`
      - İsteğe bağlı: "Apply to specific products" ile yalnız Kalibre Lab
- [ ] **Testçi başına promosyon kodu**: kuponun içinde "Add promotion code"; her testçiye ayrı kod,
      **Max redemptions: 1**. İsteğe bağlı: son kullanma tarihi ve "first-time order only".
- [ ] **E-postalar**: Settings → Billing → Subscriptions and emails. Ödeme başarısız olunca ve
      ücretsiz dönem bitmeden müşteriye e-posta gitsin (testçiler 3 ay sonunda haberdar olsun).
- [ ] **Ortam değişkenleri** (Vercel → Settings → Environment Variables, **Production**):
      `STRIPE_SECRET_KEY` (`sk_live_...`), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`.
      Test denemesinde aynıları test değerleriyle **Preview** ortamına.

### 3. Hukuk ve metin

- [ ] Gizlilik politikasında `[STRIPE TÜZEL KİŞİSİ]`, `[DEPO SAĞLAYICI]`, `[UNVAN]`, `[ADRES]`.
- [ ] Avukata: şartlardaki `AVUKAT İÇİN` ve `FOR COUNSEL` notları; özellikle 8a (6502 sayılı kanun,
      "olduğu gibi" sınırları) ve 8b (SPK, ABD CFTC 4.14(a)(9), İngiltere FCA PERG 8.30). Canlıya
      çıkmadan önce en azından 8b ve risk bildirimi okunmalı.
- [x] Karar verildi: **kupon bittiğinde kapsam** tam ürüne genişler. Kısıt yalnız kupon etkinken
      geçerli; 3 ay sonra ücretli devam eden testçinin lisansı Motor'u da kapsar.
- [ ] Stripe yenileme ve deneme bitiş e-postalarının açık olduğunu doğrula: şartlar 12c "ücret
      alınmadan önce e-postayla bildirim" diyor.
- [ ] Canlıya alma onayı: "canlıya al" demeden Claude `vercel --prod` yapmaz.

## Claude'un yapacakları

- [ ] Lisans sırrı gelince Motor 0.21 ve Köprü'yü sırla derle, depoya yükle
      (`node yerel/eklenti-yukle.mjs motor <yol> 0.21`, `... kopru <yol> 1.00`).
- [ ] **Uçtan uca deneme (Stripe test modu, önizleme adresi)**:
      1. Test kartı `4242 4242 4242 4242` ile abonelik → `/hesap` lisansı gösterir → eklenti indir →
         MT5 demo hesapta Motor ve Köprü lisansı doğrular.
      2. Promosyon koduyla abonelik: kart sorulmaz, lisans yalnız Köprü; Motor lisansı ve indirmesi
         açık mesajla reddedilir.
      3. Portaldan iptal → dönem sonunda lisans kapanır; Stripe panelinde webhook teslimleri 2xx.
      4. Stripe anahtarı yokken fiyat sayfası "Ödemeler yakında" kartına düşer.
- [ ] Kurulum sayfalarına temiz MT5 ekran görüntüleri (hesap numarası ve ad görünmez).
- [ ] Canlıya alma (Can'ın onayıyla): önce `git pull --rebase --autostash origin main`, sonra
      `vercel --prod`. Ardından tarayıcıyla doğrula: ana sayfa TR/EN, fiyatlar, risk sayfaları,
      beta bandı, şartlar 8a/8b, `/sitemap.xml`, `/robots.txt`, gerçek bir test aboneliği.
- [ ] İlk 48 saat: lisans, ödeme ve röle uçlarının günlüklerini izle.

## Bir ay içinde

- [ ] Search Console'a yeni site haritasını gönder (Can), eski adreslerin 301'lerini izle.
- [ ] Kanonik adresler: sayfalar `/pro/` gibi sondaki eğik çizgili kanonik yazıyor, Vercel ise
      `trailingSlash: false` ile `/pro`'ya yönlendiriyor. Kanonik ve hreflang adresleri eğik
      çizgisiz yapılmalı (üreticiler ve elle yazılan eğitim sayfaları birlikte).
- [ ] Laboratuvardaki "önizleme özelliği" ifadeleri (`lab/baglan.html`, `lab/src/dil-en.js`) beta
      diliyle uyumlu hale getirilmeli.
- [ ] Kullanım şartlarının rakiplerle karşılaştırmalı gözden geçirilmesi (ayrı çalışma).
- [ ] Yeni ana sayfa tasarımı (ayrı çalışma, onayla).
- [ ] Motor: gerçek hesap yolunun elle denenmesi (önce onaysız, sonra kalkansız açılınca yeni işlem
      açmadığı görülmeli); `MANUEL-TEST.md`'ye eklenmeli.
- [ ] Davet edilen testçilerden ilk geri bildirim turu (`BETA-PLANI.md`).
