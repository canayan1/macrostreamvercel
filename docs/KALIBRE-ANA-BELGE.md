# Kalibre Markets ana belge

Son güncelleme: 30 Ekim 2026 (yeni site, Excel/CSV şablonu, FX Blotter Analytics sonrası). Bu belge projenin tek özetidir. Her önemli aşamadan sonra
güncellenir. Ayrıntılar bağlantı verilen belgelerdedir. Bu dosya `docs/` altında olduğu için
canlı siteye yüklenmez.

## 0. Güncel yön (26.10.2026)

Kural (Can): talep görülmeden yeni ürün geliştirilmez. Talep analizi: `reports/Talep analizi.md`.
- Önerilen ürün: prop sınavı trader'ı için **Kalibre Rule Guard**. Üç parça: firma kurallarını firmanın yöntemiyle uygulayan MT5 koruması, sınav paneli ve haftalık hata raporu. Davranışsal ürün bu rapora dönüşür.
- Lab (backtest, optimizasyon) ücretsiz kalır. Görevi siteye kullanıcı çekmek ve güven kurmak.
- Duraklatılanlar:
  - Oynaklık laboratuvarı ve optimizasyona yeni özellik
  - Alpaca ve Tradier
  - Kripto
  - Kurumsal yol haritası
  - Hazır botlar
  - Bridge sembol özellikleri (`park/kopru-sembol-ozellik` dalı)
- Talep testi, iki segment ve reklamsız:
  - Sayfalar: `/rule-guard` ve `/mt5-analytics` (TR: /tr/...). Fiyat 19 ya da 29 USD/ay, Rule Guard sayfasında ayrıca 99 USD/yıl.
  - Erken erişim formu ve `/api/talep` ölçümü.
  - Plan, eşikler ve görüşme metni: `docs/TALEP-TESTI.md`. Özet komutu: `node yerel/talep-ozet.mjs`.
- Riskler:
  - Prop firmalarının EA yasakları: firmalara yazılı sorulacak.
  - Stripe "Funded prop trading" işini yasaklıyor. "Investment services" kısıtlı, yazılı onay alınmalı.

MVP (28.10.2026): **İşlem Analizi** (`/analytics`, lab/analiz.html). MT5 geçmiş raporu (HTML/XLSX), Bridge ya da CSV okunur. Gösterilenler: özet, kazanılan ve kaybedilen durumlar, prop sınırları, kaydedilen kendi görünümün. Hepsi tarayıcıda çalışır, hesap gerekmez. Model: kalibre-lab `docs/analiz-modeli.md`. Sırada kurucunun gerçek MT5 raporuyla denemesi var, ardından müşteri bulma.
Ek (30.10.2026):
- Excel/CSV işlem kaydı şablonu v1 (`/lab/sablon/`).
- **FX Blotter Analytics** (`/lab/blotter`, şartname kalibre-lab `docs/fx-blotter-spec.md`; kurucu yanıtları bölüm 9). Blotter olduğu gibi okunur. FIFO ve ortalama maliyet hesaplanır, fiyat ve puan ayrı. Taşıma, MTM, pozisyon, limitler, valör merdiveni, marj, tek tıkla ayrıntı ve 7 kontrollü mutabakat paneli var. 409 lab testi geçiyor. Fırsat maliyeti tanımı kurucu onayını bekliyor.
- Yeni site tasarımı (Stripe, Linear ve TradingView örneklerinin birleşimi; `yerel/pitch-uret.py`): Products ve Solutions menüleri, /treasury, /company. Önizlemede, "canlıya al" onayı bekliyor.
- Rakip analizi: `reports/Trade Analytics rakip analizi.md`.
Planlar ücretsiz kalır (Vercel Hobby, Supabase free, Resend free, Upstash free). Talep ve çalışan bir değer hattı olmadan genişleme yapılmaz.
Çalışma klasörleri `/private/tmp` altında tutulmaz, çünkü macOS 3 günden eski dosyaları siliyor.

## 1. Amaç ve konum

- **Kalibre Markets** çatı marka ve hesap markası. Henüz şirket yok: satıcı kurucu (Can), şahıs
  olarak "Kalibre Markets" ticari adıyla. Şirket bekleme listesi ve demo kullanıcılardan sonra
  kurulacak; kurumsal (B2B) pilotlar için şart.
- **Hedef pazar küresel**, dil İngilizce. Türkçe ikincil çeviri (/tr). Türkiye hedef pazar değil.
- **Konum:** trader'lar için teknik analiz, strateji kurma, backtest ve risk araçları. Yazılım
  satılır; danışmanlık, sinyal, kopya işlem, para tutma ve sunucudan emir yok.
- **Uzun vadeli hedef:** motorun bankalara, aracı kurumlara ve prop firmalarına satılabilecek
  kadar sağlam, tekrar üretilebilir ve belgelenmiş olması.
- **Kurucu kimliği** pazarlamada kullanılmaz. Yasal sayfalarda satıcı kimliği (ad, adres) yasal
  zorunluluk olduğu için yer alır.
- **Lansman:** kalibremarkets.com'da beta etiketiyle; bekleme listesi + davetli demo
  kullanıcılar; ödemeler KAPALI (`ODEME_ACIK=False`). Planlanan fiyat 19 USD / 17 EUR aylık.

## 2. Ürünler

| Ürün | Ne yapar | Durum |
|---|---|---|
| Kalibre Lab (tarayıcı) | Strateji kurucu (Basit bloklar + İleri form), Quick Backtest, optimizasyon (ızgara, eğitim/sınama, komşuluk, DSR, PBO/CSCV, yürüyen ileri, Harvey-Liu), oynaklık laboratuvarı (GARCH), Pano (MT5 hesap paneli), bağlantı sihirbazı | Beta |
| Kalibre Bridge (MT5 EA) | MT5'ten fiyat geçmişi, Market Watch fiyatları, açık pozisyonlar, 90 günlük kapanmış işlemler ve bakiye hareketlerini şifreli röle üzerinden tarayıcıya taşır; salt okuma | Beta (testçilere açık) |
| Kalibre Engine (MT5 EA) | Kullanıcının kendi kurallarını MT5'te çalıştırır; prop kalkanı (günlük/toplam kayıp tabanı); gerçek hesapta açık onay ve zorunlu kayıp sınırı | Yalnız kurucunun demo hesabında; testçilere YOK |
| Alpaca / Tradier bağlantısı | ABD hisseleri için tarayıcıdan doğrudan, kullanıcının kendi anahtarıyla, salt okuma | Beta; ticari kullanım için yazılı onay gerekir |
| 2. ürün: davranışsal finans | İşlem geçmişinden önyargı analizi ve uyarılar; günlük (Edgewonk/TradeZella alanı) | Adı ve tasarımı sonra |

Ortak paket ya da ayrı satış açık. Lisans ve hesap modeli ürün eklemeye hazır (`licenses.product`).

## 3. Benzediğimiz şirketler ve rakip yaklaşımı

Kalibre üç grubun birleşimi gibi düşünülür:
- FX Blue / Myfxbook: MT5 hesabını bağlama, izleme, analiz.
- TradingView / QuantConnect: strateji kurma, backtest, optimizasyon.
- Edgewonk / TradeZella: işlem günlüğü, davranış analizi (2. ürün).

Kural (Can, 25.10.2026): hukuki ve politika sorularında rakiplerin çoğunluğu ne yapıyorsa o yapılır.
Metinler kopyalanmaz (telif), tutum alınır ve kendi cümlelerimizle yazılır.

## 4. Dil ve metin yönergeleri

Rehber: `docs/METIN-REHBERI.md`.
- Önce İngilizce yazılır, sonra Türkçeye uyarlanır. ABD İngilizcesi.
- Ürünün ne olduğu ve kimin için olduğu açıkça söylenir. Cümleler kısa, öznesi belli.
- Güvenlik: kontrol edilebilir gerçekler (ne okunur, ne gönderilir, ne saklanır, ne kadar süre).
  Kodda doğru olmayan hiçbir iddia yazılmaz.
- Yasak kalıplar: ikili sloganlar ("Your data. Your key."), "X değil Y" tekrarı (sayfada en çok
  bir), vecize, anekdot, ders verme, verinin kendi kendine hareket ettiği cümleler, kurucu kimliği.
- Uzun tire yok. Performans rakamı yok (motor doğrulaması tamamlanmadan).
- Butonlar 1-3 kelime, fiil + nesne. Ürün adları çevrilmez: Kalibre Lab, Kalibre Bridge,
  Kalibre Engine, Quick Backtest.
- Risk uyarısı alt bilgide standart blok; varsayımsal sonuçlarda CFTC 4.41(b)(1)(i) metni (aynen,
  e-CFR'den doğrulandı); ESMA 2018 %74-89 kayıp oranı (ESMA açıklamasından doğrulandı).
- Her rakam bağımsız kaynaktan doğrulanmadan yayımlanmaz.
- Kurucuyla Türkçe konuşulur.

## 5. Depolar ve yapı

| Depo | Dal | İçerik |
|---|---|---|
| github.com/canayan1/macrostreamvercel (yerel: `/Users/can/Documents/kalibre/site`) | `urun-sitesi` (canlıda değil; canlı `main`) | Site, Vercel uçları, yasal metinler, lab kopyası |
| github.com/canayan1/kalibre-lab (yerel: `/Users/can/Documents/kalibre/kalibre-lab`) | `kopru-sozlesmesi` | Lab kaynakları, MQL5 eklentileri, testler, doğrulama |

Site yapısı:
- İngilizce kökte (/, /pricing, /security, /prop, /forex, /setup, /methodology, /about, /beta,
  /account, /sign-in, /terms, /privacy, /refunds, /risk-disclosure, /cookies), Türkçe /tr altında.
  Eski adresler 308 ile yönlenir (`vercel.json`). Eski Türkçe eğitim yazıları ve hesaplayıcılar
  kendi adreslerinde kalır.
- Sayfa üreticileri `yerel/`: `sayfa-uret.py`, `sayfa-uret-en.py`, `ana-en-uret.py`,
  `ana-yeni-uret.py` (yeni ana sayfa, `--canli` ile değiştirilir; kurucu onayı şart),
  `hesap-uret.py`, `yasal-uret.py` (kaynak `yerel/yasal/{en,tr}/*.md`), `site-haritasi.py`,
  `og-uret.py`. Üretilen HTML elle düzenlenmez.
- Lab, kalibre-lab'den rsync ile `lab/` altına kopyalanır; `<base href="/lab/">` şart; varsayılan
  İngilizce, `?dil=tr` ile Türkçe.
- Yeni ana sayfa adayı: `yeni-ana/` (EN) ve `yeni-ana/tr/` (TR): amaç + entegrasyonlar + canlı
  ürün gösterimi (SENTETİK veri).

## 6. Backend (Vercel uçları)

| Uç | Görev |
|---|---|
| `/api/kopru` | Şifreli röle: MT5 Bridge yazar, tarayıcı okur; sunucu yalnız şifreli metin görür; TTL 2 saat (Upstash) |
| `/api/lisans` | Lisans kontrolü: anahtar + MT5 hesap numarası; en çok 2 hesap; imzalı belirteç (HMAC, `KALIBRE_LISANS_SIRRI`) |
| `/api/indir` | Geçerli lisansa eklenti (.ex5) indirme, POST |
| `/api/odeme/{baslat,webhook,oturum,portal}` | Stripe abonelik (giriş şart, cayma onayı, kupon kapsamı); şu an kapalı |
| `/api/hesap?islem=lisanslar\|lisans-bagla\|sil` | Hesaba bağlı lisanslar, anahtar bağlama, hesap silme (abonelik dönem sonunda biter) |
| `/api/asistan`, `/api/pulse-ping` | Eski site yardımcıları |

Ortak kütüphane `api/_lib/`: `depo.ts` (Upstash; önekli değişken adlarını da bulur), `lisans.ts`,
`stripe.ts` (SDK yok, fetch), `supabase.ts` (jeton doğrulama `/auth/v1/user`), `hesap.ts`,
`dil.ts` (EN varsayılan, TR çeviri).

Veri saklama:
- **Supabase** (hesaplar): `profiles`, `user_items` (strateji, izleme, ayar, not), `licenses`
  (yalnız anahtarın son 5 karakteri), hepsi RLS ile. Fiyat, pozisyon, işlem geçmişi, eşleştirme
  kodu ve aracı kurum anahtarı SAKLANMAZ. SQL: `docs/supabase-kurulum.sql`.
- **Upstash Redis:** lisans kayıtları (en çok 2 MT5 hesap numarası), röle paketleri (2 saat),
  sayaçlar, ödeme oturumu işaretçisi (7 gün), eklenti dosyaları.
- **Stripe:** müşteri, abonelik, şartlar sürümü ve cayma onayı metadata'da.

Protokoller:
- Röle v1: KLB1 eşleştirme kodu; HMAC ile türetilen kanal/şifre/mühür/yuva; AES-256-CTR +
  HMAC-SHA256; zarf {v,n,u,c,m}. Ayrıntı: kalibre-lab `docs/kopru.md`.
- Lisans v1: `v1|urun|hesap|bitis|imza`; anahtar biçimi KLM-XXXXX-XXXXX-XXXXX-XXXXX; ürünler
  `motor`, `kopru`; testçi kuponunda `urunler=kopru`. Ayrıntı: `docs/lisans.md`.

Ortam değişkenleri (değerleri yalnız kurucu girer; Claude okumaz):
`KALIBRE_LISANS_SIRRI` (Production + Preview), Upstash çifti, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (Sensitive).

## 7. Frontend

- Tasarım: `static/site.css` (mürekkep #0e1724, yeşil #5fb89a, kehribar #d9a441; Source Serif 4 +
  IBM Plex). Ortak kabuk `static/kabuk.js`. Üst menü 1080 px altında iki satır.
- Hesap: `static/kalibre-auth.js`, `kalibre-config.js` (URL + anon key, herkese açık),
  `giris.js`, `hesap-sayfa.js`. supabase-js 2.117.3 sabit sürüm (jsDelivr).
- Çerez: `static/kalibre-cerez.js`; yalnız gerekli depolama + kabul edilirse Google Analytics;
  `data-cerez-ayar` seçimi yeniden açar.
- Lab modülleri (kalibre-lab `lab/src`): `motor.js`, `gostergeler.js`, `optimizasyon.js`,
  `asiri-uyum.js` (DSR, PBO/CSCV, Harvey-Liu, deneme sayacı), `yuruyen-ileri.js`, `bloklar.js`,
  `panom/` (Pano), `veri/` (kopru, role, alpaca, tradier, csv), `modeller/` (GARCH, SARIMA),
  `hesap-senkron.js` (giriş yapılmışsa taslak eşitleme), `guvenlik.js` (XSS kaçışı),
  `dil.js` / `dil-en.js` / `dil-dogrulama.js`.

## 8. Motor ve doğrulama

| Aşama | İçerik | Durum |
|---|---|---|
| A | Motor kuralları şartnamesi (`docs/motor-kurallari.md`, MQL5 ile 22 fark) | Bitti |
| B | Elle hesaplı vakalar, MT5 gösterge eşleşmesi, maliyet modeli | Bitti (ADX ısınma hatası düzeltildi) |
| C | MT5 Strategy Tester ile işlem işlem karşılaştırma | Bitti: 97 koşunun 96'sı geçti, açıklanamayan fark yok (`docs/dogrulama/C-raporu.md`). Motor 0.22: XAUUSD'de 10 kat risk hatası düzeltildi |
| D | Sıfır testi, gömülü kenar, PBO/CSCV, yürüyen ileri, Harvey-Liu | Bitti, tüm ölçütler geçti (`docs/dogrulama/D-raporu.md`) |
| E | Bağımsız Python referansıyla karşılaştırma (yalnız yazılı kurallardan, kodu görmeden): 1.035 vaka, 87.315 işlem, 1,33 milyon gösterge değeri; açıklanamayan fark 0. Bulunan tek fark (düz pencerede RSI) motor 0.1.1'de düzeltildi (`docs/dogrulama/E-raporu.md`) | Bitti |
| Paket | Banka düzeninde doğrulama paketi (SR 26-2 / PRA SS1/23 ilkeleri): `docs/dogrulama/DOGRULAMA-PAKETI.md` | Taslak; bağımsız dış inceleme gerekir |

Kalkan (prop): günlük taban = gün başı bakiye − g% × başlangıç; toplam taban statik / gün sonu
izleyen / gün içi izleyen; ön ayarlar FTMO 2-Step, 1-Step, Instant (23.10.2026 doğrulandı),
The5ers HS. Strategy Tester kanıtı: kalkansız en kötü gün 18.900 kayıp, kalkanla 4.009 (sınır 5.000).
Kalkan "sunucu tarafı denetim" olarak satılmaz: aynı hesaptaki başka EA'yı ya da elle emri durduramaz.

Kurumsal hedef (rapor: `reports/Kurumsal motor gereksinimleri.md`). Sıradaki işler:
Biten: `@kalibre/core` (kalibre-lab `lab/core/`, CLI, `docs/core.md`), `resultId` (kanonik JSON + SHA-256), maliyet modeli v2 ve çubuk içi dolum modelleri (isteğe bağlı; varsayılan sonuçlar değişmedi, 337 test).
4. Enstrüman ve maliyet modelinin 2. sürümü: lot adımı, kur çevrimi, swap, teminat
5. Çubuk içi dolum modelleri
8. CAIQ/SIG taslakları, sızma testi, SOC 2
9. Pilotlar: prop firmasına Kalkan lisansı, aracı kuruma gömülü lab

## 9. Hukuki durum

- Yasal metinler İngilizce asıl, Türkçe çeviri: `yerel/yasal/{en,tr}/*.md`, sürüm `2026-10-25-en1`
  (`SARTLAR_SURUMU`). Tutumlar ve rakip karşılaştırması: `docs/HUKUK-RAKIP-TUTUMLARI.md`.
- Seçilen tutumlar:
  - Hukuk ve mahkeme: satıcının ülkesi. Tüketici kendi ülkesinin korumalarını saklı tutar.
  - Tahkim yok.
  - Sorumluluk sınırı: son 12 ayın ücreti ya da 100 USD (hangisi büyükse).
  - Tazminat: üçüncü taraf talepleriyle sınırlı.
  - AB/İngiltere cayma hakkı: 14 gün; lisans MT5'te ilk kez etkinleşince biter. Ödemede onay kutusu var.
  - Başlamış aylık dönem iade edilmez. Ücretsiz ya da testçi dönemden sonraki ilk çekim, 14 gün
    içinde istenir ve lisans kullanılmamışsa iade edilir.
  - Yenileme otomatik. Ücretsiz dönem bitmeden e-posta gönderilir. Fiyat değişikliği 30 gün önceden bildirilir.
  - İngilizce metin esastır.
  - Uygunluk: 18 yaş. BM, AB, İngiltere ve ABD (OFAC) yaptırımları uygulanır. ABD kullanıcıları dışlanmaz.
  - Pazarlama e-postası: hesap sahiplerine soft opt-in. Kayıtta ve her e-postada çıkış seçeneği var.
- Doldurulacak yer tutucular: tam ad, posta adresi, ikamet ülkesi, iletişim e-postası, Supabase ve
  Upstash bölgesi, e-posta sağlayıcısı, vergi kaydı saklama süresi.
- Avukata (şirket kurulurken): ABD'de Engine için CFTC/NFA, sorumluluk sınırının tüketiciye karşı
  geçerliliği, dijital içerik/hizmet ayrımı, İngiltere DMCC ve ABD eyalet otomatik yenileme
  yasaları, yaptırım listesi, şahıs satıcı kaydı ve vergisi.
- Düzenleyici sınırlar: hazır stratejiler eğitim örneği, risk parametreleri kullanıcıda (SPK);
  "araç hesaplar, kullanıcı seçer", önerilen ayar yok (CFTC); BIST verisiyle tarama yok (lisans
  ya da yazılı teyit olmadan); Alpaca/Tradier ticari kullanımı yazılı onaya bağlı.

## 10. Çalışma kuralları

- `vercel --prod` yalnız kurucunun o an verdiği "canlıya al" onayıyla. Öncesinde `git pull`
  (CI her gün main'e yazıyor). Ana sayfa değişikliği ayrıca onay ister.
- Önizleme serbest: `vercel deploy --yes`.
- Claude anahtar ve sır değerlerini görmez, girmez. MT5 ya da aracı kurum şifresi istenmez.
  Hesap açma, demo işlem açma kurucunun işidir.
- Testçilere algo trading (Engine) verilmez.
- MT5 notları: WebRequest izin listesi `/config` ile açılışta uygulanmaz; OnInit içinde WebRequest
  4014 verir (lisans ilk zamanlayıcıda); Tester .set dosyaları `MQL5\Profiles\Tester` altında.
  Derleme rehberi: kalibre-lab `docs/DERLEME-REHBERI.md`.

## 11. Kaynaklar ve raporlar

Raporlar (`/Users/can/Documents/macrostreamvercel/.claude/worktrees/loving-noyce-59a4b3/reports/`):
- Kalibre Lab pazar araştırması.md (23.10.2026)
- ABD genişleme araştırması.md (24.10.2026)
- Hazır botlar tarama ve motor.md (25.10.2026)
- Kurumsal motor gereksinimleri.md (25.10.2026)

Site belgeleri (`docs/`): CANLIYA-CIKIS.md, YAYIN-ONCESI.md, YOL-HARITASI.md, BETA-PLANI.md,
GUVENLIK-INCELEMESI.md, HESAP-KURULUMU.md. Lab belgeleri: kopru.md, lisans.md, kalkan.md,
motor-kurallari.md, sema-v2.md, alpaca.md, tradier.md, dogrulama/.

Doğrulanmış dış kaynaklar (25.10.2026):
- 17 CFR 4.41 (LII e-CFR kopyası)
- ESMA basın açıklaması, 27.03.2018
- Fed SR 26-2, 17.04.2026
- Supabase proje duraklatma belgesi
- FTMO kuralları (23.10.2026)

## 12. Durum ve sıradakiler

Biten (urun-sitesi, canlıda değil):
- Hesaplar
- İngilizce kök
- Metinlerin yeniden yazımı
- Yeni yasal metinler
- Aşama D
- Kurumsal araştırma

Son önizleme: https://macrostreamvercel-k7npwh9av-canayan1s-projects.vercel.app

Kurucunun yapacakları:
1. Supabase: eski projelerden birini duraklat, Frankfurt'ta yeni proje aç. Sonra SQL, giriş ayarları,
   Resend SMTP ve Google OAuth (`docs/HESAP-KURULUMU.md`). URL ve anon key Claude'a verilir,
   service_role yalnız Vercel'e girilir.
2. `KALIBRE_LISANS_SIRRI` değişkenine Preview ortamını ekle. Aynı değeri `LisansSirri.mqh` dosyasına yaz.
3. Yasal yer tutucuları ver.
4. Pazartesi demo işlemlerle Pano kâr/zarar kontrolü.

Claude'un yapacakları:
1. Bridge belgesine sembol özellikleri (sözleşme büyüklüğü, lot sınırları, swap) eklemek; arayüze kur serisi yükleme.
2. Motor 0.22'yi sırla derle ve yükle.
3. Eklentileri sırla derle ve yükle, önizlemede uçtan uca dene.
5. Canlıya çıkış listesini tamamla, ardından kurucunun "canlıya al" onayı.

### 30.10 ek 2: Demolar sayfası ve örnek dosyalar
- `/demo` ve `/tr/demo`: her ürün için 1) örnek girdi (indir), 2) üründe tek tıkla aç, 3) sonuç dosyası (indir). Menüde "Demos / Demolar", ana sayfa birinci düğmesi ve lab üst barı buraya gider.
- Dosyalar kalibre-lab `araclar/ornek-dosya-uret.mjs` ile üretilir (`lab/ornek/`), hepsi sentetik. Sonuçlar sayfaların motoru ve sayfanın örnek ayarlarıyla hesaplanır. Demo sayfasındaki rakamlar `lab/ornek/ozet.json`'dan okunur, elle yazılmaz. `lab/test/ornek-dosya.test.mjs` dosyaların güncel olduğunu, XLSX/CSV (TR ve EN) okununca aynı toplamın çıktığını ve Lab resultId'nin tuttuğunu denetler.
- Tek tık bağlantıları: `/lab/analiz?dosya=sablon/kalibre-trade-log-example.xlsx`, `/lab/blotter?dosya=ornek/fx-blotter-sample.xlsx` (TR: `fx-blotter-ornek.xlsx`), `/lab?demo=1`. `?dosya=` yalnız yayımlanmış örnek listesini açar.
- Örnek blotter artık iki dilde: İngilizce sayfa İngilizce başlıklı ve İngilizce sayı biçimli sürümü açar (EN arayüzde Türkçe sütun adları görünmesinin nedeni buydu). Limit tablosu İngilizce anahtar kelimeleri kabul eder (OVERNIGHT, INTRADAY, VALUE, desk, book, "≤ 1 month").
- Bağımsız denetim (Python/openpyxl): pozisyonlar USD −20.635.889, EUR 610.000, TRY 873.817.070 ve swap roll −43.750 USD motorla birebir; işlem kaydı 343 işlem, net 15.839,03 USD birebir.
- FX Blotter Analytics durumu "Beta"ya alındı; /treasury'de fırsat maliyeti iddiası kaldırıldı (tanım bekleniyor).
- Önizleme: https://macrostreamvercel-cmscyadmq-canayan1s-projects.vercel.app/demo (canlıya alınmadı).

### 30.10 ek 3: Dışarıdan görünen her şey İngilizce
- Karar (Can): dışarıdan görünen her şey şimdi native İngilizce; yeni kod İngilizce yazılır; mevcut iç kod dokunuldukça testlerle çevrilir.
- Kural dosyası biçimi `kalibre: 3` (İngilizce anahtar ve değerler; eski 1/2 okunmaya devam eder): lab/core/src/strategy-format.js. Backtest paketi formatVersion 2 (ayar, özet, işlemler, çıkış nedenleri, uyarılar İngilizce): run-format.js, messages-en.js. Optimizasyon ve yürüyen ileri paketleri de formatVersion 2.
- Manifest hash'leri İngilizce biçim üzerinden; motor 0.2.0. Ortak eşleme schema/kalibre-format.map.json; Python referansı onu okur (287 vaka, 0 fark, sonuç kimlikleri aynı).
- Şablon kütüphanesi lab/strategies/ (catalog.json + İngilizce adlı dosyalar), kaynak ornekler/ ve paketler/ olarak kalır (araclar/strategies-publish.mjs).
- Adresler: /lab/analytics, /lab/optimization, /lab/volatility, /lab/dashboard, /lab/connect, /lab/samples/, /lab/templates/; parametreler ?lang ?sample ?file ?symbol ?source. Eski adresler 308 ile yönlendirilir, eski parametreler okunur.
- Örnek etiketi EXAMPLE; "gerçek değildir" türü notlar yok.
- /company yeniden tasarlandı (B2B vizyon; ürün listesi yok).
- Sırada: Bridge dosya biçimi (seri-…json Türkçe anahtarlar) ve MQL5 dosya adları (KalibreKopru → KalibreBridge, KalibreMotor → KalibreEngine), Motor'un kalibre: 3 okuması; bunlar MT5'te yeniden derleme ister. Hesap senkron yükü (Supabase) anahtarları. Eski Türkçe içerik sayfaları (egitim vb.) Türkçe kalır.
- Önizleme: https://macrostreamvercel-9ent6lhte-canayan1s-projects.vercel.app (canlıya alınmadı).

### 30.10 ek 4: Apple tasarım standardına geçiş
- Can: site "AI hazırlamış gibi" duruyordu; Apple'ın ürün sayfası standartları istendi.
- static/site.css baştan yazıldı: açık zemin (#fff, #f5f5f7), ürün görüntüleri siyah bantlarda, sistem yazı tipi (Apple'da SF Pro), büyük sıkı başlıklar, mavi hap düğme (#0071e3) ve "Learn more ›" bağlantıları. Büyük harfli etiketler, monospace küçük yazılar, noktalı meta satırları ve aynı kart kalıpları kaldırıldı.
- Yeni üretici yerel/product-pages.py: ana sayfa, /trade-analytics, /fx-blotter, /rule-guard, /kalibre-lab (yeni), /demo, /company; her ürün sayfasında yapışkan yerel menü. Rakamlar lab/samples/summary.json'dan. pitch-uret.py ve talep-uret.py emekli (şirket metni yerel/company-copy.json).
- /mt5-analytics → /trade-analytics, /treasury → /fx-blotter (308). Talep ölçüm kimlikleri aynı (mt5-analytics, treasury, rule-guard).
- Belge sayfaları (güvenlik, metodoloji, yasal, kurulum) aynı kabukta; eski Türkçe içerik sayfaları kabuk.js ile eski görünümde kalır.
- Rule Guard görseli: örnek hesabın günlük kapanış bakiyesi FTMO 2-Step tabanlarına karşı (SVG, summary.json propDays).

### 30.10 ek 5: Orijinal Kalibre Markets kimliği
- Apple yerleşim kuralları korunarak orijinal kimliğe dönüldü: sıcak siyah #100e0c, yüzey #1a1612, çizgi #26221d, krem metin #ebe3d3, amber eylem #ffa630 (sıcak ton #ff7a00), kazanç #4ade80, kayıp #ef4444; Inter Tight ve Geist Mono. Logo: amber çerçeveli K + "KALIBRE // MARKETS".
- Terminal dokunuşları: ürün adları "// Ürün" amber monospace, rakamlar ve durum etiketleri monospace, adım numaraları 01/02/03.
- Lab uygulaması aynı palete geçti (stil.css değişkenleri canlı sitenin değerleri); bütün ekran görüntüleri yeniden çekildi.
