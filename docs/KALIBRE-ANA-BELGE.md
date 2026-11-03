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
| Analytics (çatı, 1.11) | Bağla (MT5 raporu, trade log, blotter, Bridge) → kur (hazır analizler: Trade Analytics, FX Blotter, Backtest; görünüm kurucu) → sun (Excel çalışma kitabı, rapor sayfası, mühürlü paylaşım bağlantısı) | Beta; /analytics |
| Desk Signal (masa sinyali) | Masa şefinden trader'lara tek tuşla renkli sinyal; acil sinyaller yanıtlanana kadar çalar; kimin gördüğü ve bitirdiği saniyesine kadar kayıtlı (CSV/Excel) | Tarayıcı demosu (/lab/desk) ve çalışan canlı masa (/lab/desk-live): şifreli röle, şef konsolu, trader ekranı; erken erişimde ücretsiz |
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

### 30.10 ek 6: Ana sayfa girişi
- Başlık "FX, solved." (TR "FX'i çözüyoruz."), tek satır alt cümle, altında tam genişlik ürün görseli: gerçek FX Blotter ekranı çizilmiş bir dizüstünde (yerel/hero-render.mjs + yerel/hero/hero.html, static/urun/hero/). Yapay zekâ görseli kullanılmadı: uydurma arayüz ve rakam göstermemek için.
- Ana sayfa metinleri kısaltıldı. Lab'deki "giriş yapılandırılmadı" önizleme notu gizlendi; çerez penceresi orijinal palete alındı.

### 30.10 ek 7: Her sayfada ilk ekranda görsel, ürün sayfaları basitten ayrıntıya
- Ortak bileşen `page_hero()` (yerel/sayfa-uret.py): kısa başlık, tek satır alt cümle, eylemler ve sayfanın ana görseli ilk ekranda. Üst menüdeki her sayfa bunu kullanır.
  - Trade Analytics, FX Blotter, Kalibre Lab: gerçek ekranlar dizüstünde (static/urun/hero/<ürün>-<dil>), Demolar: üç ürün penceresi (suite), Rule Guard: prop grafiği.
  - Security: şifreleme akış diyagramı (MT5 şifreler, röle yalnız şifreli paket tutar, tarayıcı doğrulayıp çözer; eşleştirme kodu sunucuya gitmez). Company: işlem kayıtları, Kalibre Markets, kararlar diyagramı. `flow_diagram()` masaüstü ve telefon için iki çizim üretir.
  - Pricing yeniden kuruldu (yerel/product-pages.py, ödemeler kapalıyken): dört ürün kartı ilk ekranda, sabit fiyat yok (fiyat testiyle çakışmasın), bekleme listesi formu korunuyor. Ödemeler açılınca (ODEME_ACIK) eski abonelik sayfası yeniden üretilir.
- Ürün sayfalarının sırası: görsel, üç adım, öne çıkanlar, ayrıntılar (mutabakat, şablon, doğrulama), fiyat ve SSS.

### 30.10 ek 8: Şimdilik yalnız İngilizce; MVP önceliği
- Türkçe kamuya kapalı: İngilizce sayfalarda Türkçe bağlantısı, hreflang ve "Articles (Turkish)" yok, /tr site haritasından çıktı, hesap sayfasında dil seçeneği yalnız English. Lab varsayılan İngilizce; Türkçe yalnız açık ?lang=tr ile, kaydedilmez, TR|EN anahtarı gizli. /tr sayfaları üretilmeye devam ediyor. Anahtar: TURKISH_PUBLIC (yerel/sayfa-uret.py, yerel/site-haritasi.py, kalibre-lab lab/src/dil.js).
- Para kazandırma ihtimaline göre öncelik:
  1. FX Blotter Analytics (hazine ve dealing masaları): en yüksek ödeme isteği, kurucunun alanı ve ağı, az sayıda anlaşma yeter; örnek blotter uçtan uca çalışıyor. Demo için eksik: rehberli demo modu, masa günlük raporu (Excel/PDF), gerçek döküm biçimleriyle (anonim) eşleştirme sınavı.
  2. Rule Guard: parası olan net acı (sınav ücreti), abonelik ve prop firma/aracı kurum B2B yolu. Demo için eksik: web üzerinde örnek hesabın tekrar oynatımı (nerede işlem bekletilirdi), derlenmiş EA (Can derler).
  3. Trade Analytics: ücretsiz rakipler var; ücretsiz giriş kapısı, Rule Guard'a yönlendirir.
  4. Kalibre Lab: backtest ücretsiz kalır; para otomasyonda ve o alan kısıtlı. Şimdilik yatırım yok.
  5. Kalibre Bridge: altyapı, tek başına satılmaz. Aracı kurum/prop firma çözümü Rule Guard kullanıcı kazanınca.

### 30.10 ek 9: FX Blotter ve Rule Guard demo hazırlığı
- FX Blotter: tarayıcıdan "Download desk report (Excel)" (örnek sonuç dosyasıyla aynı kod: lab/src/blotter/desk-report.js); 2 dakikalık rehberli tur (?tour=1, lab/src/tour.js); aynı işlemlerin beş sistem biçimi (işlem platformu, hazine sistemi, MT300 teyitleri, FIX işlem kopyası, Almanca elle tutulan Excel; lab/samples/formats, araclar/blotter-formats.mjs). Beşi de 224 bacak ve +99.400 USD veriyor; test bunu denetler. Okuyucu artık B/S kodlarını, kendi kimliğiyle gelen düzeltmeleri (AMND, ExecType G), tek kimlikli swap bacaklarını ve 98D zaman damgasını okuyor. MT300 ve FIX alan numaraları kaynakla doğrulandı (spec K10).
- Rule Guard: sayfada örnek hesabın tabana en yakın günü (17 Temmuz, FTMO 2-Step) eklentinin varsayılan paylarıyla tekrar oynatılıyor (pay başlangıcın %0,5'i; 2 pay yeni işlem bekler, 1 pay kapat ve kilitle).
- Trade Analytics → Rule Guard yolu: prop sınırları kartında ziyaretçinin kendi günlerinden hesaplanan not (kaç gün mesafe 2 payın, kaç gün 1 payın altına indi; varsayılan pay başlangıcın %0,5'i) ve "Get early access to Rule Guard" düğmesi.

### 30.10 ek 10: Canlıya alındı; FX Blotter ilk kullanım
- Canlı (kalibremarkets.com): tamamen İngilizce site, ilk ekranda görsel, FX Blotter ve Rule Guard demoları.
- FX Blotter ilk kullanım (kendi dosyasıyla gelen kullanıcı): kur tablosu boşsa dosyadaki her paritenin son işlem kuruyla dolar (önceden USD/TRY K/Z'si 0 görünüyor, toplam yanlış küçük çıkıyordu); özetin altında "Change the rates". Dosya temiz okununca sütun eşleşmesi ve ayarlar katlanır, sayfa özete kayar; zorunlu alan eksikse eşleşme açık kalır ve oraya kayar.

### 31.10 ek 11: Desk Signal (yeni ürün, MVP sırasının başında)
- Can'ın fikri: dealing room'da masa şefi trader'lara Teams/Bloomberg sohbeti yerine tek tuşla renkli sinyal versin; masaüstünde köşede yanan top; acil sinyal yanıtlanana kadar susmaz (AlarmKit benzeri); çoklu lokasyon. Karar: önce tarayıcı demosu, hemen ardından çok kullanıcılı web MVP; ilk müşteri prop firmaları ve küçük masalar.
- Çekirdek: kalibre-lab `lab/src/desk/signal.js` (pano, alıcılar, sent → delivered → seen → done / cancelled, eskalasyon 10 sn büyür, 20 sn şefe kırmızı, öncelik sırası, özet, log CSV/XLSX). Testler `lab/test/desk.test.mjs` (npm test'te).
- Demo: `/lab/desk` (desk.html, desk.css, src/desk/demo.js). 5 örnek sinyal, 4 örnek trader (Londra x2, Tokyo, İstanbul), klavye: 1-5 sinyal, Q W E R kişi, A S D F grup, Enter tekrar, Esc temizle. Sinyal anlamları düzenlenebilir; "trader'lar kendi yanıtlasın" seçeneği; tur (?tour=1); görsel sahne (?scene=1). Sunucuya hiçbir şey gitmez.
- Site: `/desk-signal` ürün sayfası (product-pages.py desk_signal), /demo'da bölüm, site haritası, ilk ekran görseli hero-render.mjs `desk-signal` hedefi. Erken erişim formu api/_lib/talep.ts sayfa kimliği `desk-signal` (kurum, masa büyüklüğü, bugün nasıl ulaşıyor). Ana menüye eklenmedi (ana sayfa ve menü değişikliği Can onayı ister).
- Mesaj: sabit anlamlar, serbest metin yok, emir yok, piyasa verisi yok. Kayıt yükümlülüğü iddiası (MiFID II 16(7) vb.) metinlere kaynak doğrulanmadan konmadı.
- Sırada (plan: /Users/can/.claude/plans/bright-knitting-moonbeam.md): 2) çok kullanıcılı web MVP: davet kodlu masa, `api/desk.ts` röle (kopru.ts deseni, Upstash, uçtan uca şifreli), tarayıcı bildirimi ve ses; 3) Tauri masaüstü top uygulaması; 4) iPhone AlarmKit eskalasyonu; 5) Stream Deck eklentisi.
- Önizleme: https://macrostreamvercel-h8rz4p9gn-canayan1s-projects.vercel.app/desk-signal (canlıya alınmadı).

### 31.10 ek 12: Canlıya çıkış
- Can'ın onayıyla ("gayet iyi siteyi canlıya alabiliriz") kalibremarkets.com güncellendi (deploy macrostreamvercel-9iiliw7hp). Çıkanlar: Desk Signal ürün sayfası ve /lab/desk demosu, FX Blotter ilk kullanım iyileştirmeleri, görsellere tıklayınca büyütme (static/lightbox.js yeni sayfa sınıflarına bağlandı; telefonda büyütülen ekran kaydırılarak okunur).
- Tarayıcıyla doğrulandı: /desk-signal başlık ve büyütme, /lab/desk örnek sahne (3 top, 4 satır), /lab/blotter örnek (+99,400 USD).
- Müşteri sunumları: ~/Desktop/kalibre-sunumlar (5 pptx). Tanıtım filmleri: ~/Desktop/kalibre-videolar (konsept, HeyGen denemeleri).

### 31.10 ek 13: Lab Türkçe kalıntıları ve canlıya çıkış
- Lab sayfaları çeviri bitene kadar gizli (en çok 2,5 sn), Türkçe kaynak metin artık bir an bile görünmüyor. FX Blotter turu 13 adım, 12 bölümün hepsi. "Synthetic" yerine "Example". Denetim betiği kalibre-lab `araclar/turkce-tara.mjs` (12 sayfa durumu, canlıda 0). Can'ın "canlıya al" onayıyla yayımlandı (deploy macrostreamvercel-k2j8lwk94).

### 31.10 ek 14: Desk Signal canlı masa (çok kullanıcılı MVP)
- Sayfa: `/lab/desk-live` (kalibre-lab lab/desk-live.html, src/desk/live-ui.js). Üç görünüm: masa kur ya da katıl; `#head=<masa>` şef konsolu; `#join=<davet>` trader ekranı.
- Güvenlik modeli (src/desk/kasa.js): masa kodu "KDS1"+32 bayt, yalnız davet bağlantısının # kısmında (sunucuya gitmez). Olaylar AES-256-GCM ile tarayıcıda mühürlenir; röle içini okuyamaz. Şefin tarayıcısı ECDSA P-256 anahtarı üretir; sinyal, pano, iptal ve çıkarma olayları imzalıdır, trader kodla sinyal gönderemez. Trader yanıtları (görüldü/bitti) imzasız: masa kodunu bilen biri başkası adına yanıt uydurabilir; sonraki adımda trader anahtarı eklenebilir. Şef anahtarı tarayıcıda durur; "head key backup" JSON'u indirilip başka tarayıcıda açılabilir.
- Olaylar (src/desk/live.js, saf ve testli): board, join, remove, send, mark, cancel. Herkes aynı kayıtları aynı sırayla oynatır; zamanlar rölenin saatidir.
- Röle: site `api/desk.ts`. POST tek Upstash EVAL ile sınır + sıra no + kayıt (son 5000, 30 gün) + PUBLISH. GET akışı (SSE) Redis SUBSCRIBE ile (api/_lib/abone.ts, REST adresinin ana makinesine TLS 6379; yeni gizli anahtar gerekmedi), kopunca kaldığı yerden; akış kurulamazsa tarayıcı 1,5 sn'lik okumaya düşer. Çevrimiçi tablosu (rastgele kişi kimliği → son görülme).
- Ölçüm (önizleme, gerçek Upstash): gönderimden trader ekranına 228-248 ms; POST ~225 ms (4 ayrı istekken ~520 ms idi).
- Trader: büyük top, Seen/Done, ses (ilk tıklamayla açılır), tarayıcı bildirimi (acilse kapanana kadar durur), başlıkta yanıp sönen sinyal, Chrome/Edge'de "Keep the orb on top" (Document Picture-in-Picture). Şef: 20 sn'de kırmızı satır + ton + bildirim, Connected sütunu, trader çıkarma, log CSV/Excel.
- Testler: kalibre-lab `lab/test/desk-live.test.mjs` (5), site `test/desk.test.mjs` (5).
- Ürün sayfası: "Start a desk" düğmesi, yeni SSS (Kalibre okuyabilir mi, log ne kadar tutulur). Can'ın onayıyla canlıda (deploy macrostreamvercel-mv7szcyvu); kalibremarkets.com'da masa kur, katıl, gönder, Delivered tarayıcıyla doğrulandı.

### 31.10 ek 15: FX Blotter kur, taşıma ve limit tabloları (MVP sırası 1)
- 03 Analysis settings'te üç metin kutusu satır satır tabloya döndü (kalibre-lab `lab/src/blotter/girdi-tablo.js`). Kaynak yine metin: ayrıştırıcılar, yerel kayıt ve örnek yükleme değişmedi; tablo metni satırlara böler ve düzenlenince yeniden yazar. "Paste as text" ile metin kutusu açılır; Excel'den çok satırlı yapıştırma tabloya satır satır eklenir.
- Limit satırı alanlarla: tür (Currency NOP, Overnight total, Intraday peak, Daily loss, Value date bucket), kapsam, ad ya da valör aralığı, tutar (basamak ayraçlı). Okunamayan satır kaybolmaz, kırmızı kalır; yorum satırları (# Example rates, dosyadan gelen kurlar) tablonun üstünde not.
- Mesajlar: eksik zorunlu sütunlar adıyla söylenir; tablo hataları satır numarası yerine "kırmızı satırları düzelt ya da sil"; özette "kur yok" çıkınca "Add the missing rates" eksik pariteleri boş değerli satır olarak ekler ve kur kutusuna odaklanır.
- Doğrulama: örnekte toplam +99,400 USD; kur değişikliği anında yeniden hesaplar ve kaydedilir; yeni gün içi limit hemen değerlendirilir; GBP/USD silinip düğmeyle geri eklenince uyarı kalkar. Testler `lab/test/girdi-tablo.test.mjs` (4), lab toplam 447. Telefonda yatay kaydırma yok.
- Ek (canlıda, deploy macrostreamvercel-4p9v13rbp): uzun satır tabloları (müşteri marjı, swap, dışlanan satırlar) ilk 10 satırla açılır, "Show all N rows" ile aşağı uzar. Can'ın isteği.

### 31.10 ek 16: Trade Analytics ilk kullanım (MVP sırası 3)
- Yürüyüş: boş sayfa → MT5 raporu (HTML ve XLSX fikstürü; gerçek terminal çıktısı değil, Python ile MT5 yapısı taklit edilerek üretilmiş) → özet. Rapor sorunsuz okunuyor.
- Bulunan ve düzeltilen takılmalar: (1) yanlış dosya bırakılınca önceki hesabın sonuçları ekranda kalıyordu; artık gizlenir. (2) Kendi tablosunda üstte başlık/açıklama satırı ya da eş anlamlı sütun adları (Open Time, Type, Lots, Entry, Exit, PnL) olan dosya tanınmıyordu; başlık satırı artık ilk 30 satırda en çok sütunu tanınan satırdır. (3) Hiç işlem sütunu yoksa "bu dosya bir işlem geçmişine benzemiyor" denir. (4) 20 işlemin altında iki boş liste ve tekrar eden metin yerine tek açıklama.
- Açık: gerçek bir MT5 terminal raporuyla deneme (Can'ın hesabından bir rapor) en güvenilir test olur.

### 31.10 ek 17: Portföy incelemesi
- Trade Analytics ilk kullanım düzeltmeleri Can'ın onayıyla canlıda (deploy macrostreamvercel-fwtityh2o).
- Can'ın sorusu üzerine ürün portföyü incelemesi yazıldı: `docs/STRATEJI-INCELEMESI-2026-10-31.md`. Öneri: iki pazarlanan ürün (Kalibre Desk = FX Blotter + Desk Signal; Trade Analytics = analiz + ileride Guard sekmesi) + pazarlanmayan motor (Lab/Engine); web tek platform, masaüstü yalnız top için ince kabuk; şirket kurulumu kritik yolda. Kararlar Can'da (belgenin 7. bölümü). Talep testi rakamları bu incelemede yok (Claude gizli anahtar okumaz); Can `node yerel/talep-ozet.mjs` ile alacak.

### 1.11 ek 18: İki ürün çatısı ve sunum katmanı (Can'ın kararı, bkz. STRATEJI-INCELEMESI bölüm 8)
- Site: menü Analytics, Desk Signal, Demos, Security, Company. Yeni çatı sayfası `/analytics` (bağla, kur, sun; kimin için; fiyat yok, "contact us"). Ana sayfa "Your trading data, explained." ve iki ürün. Rule Guard "Planned" (fiyat bloğu kalktı, erken erişim formu duruyor). Kalibre Lab sayfası "Analytics · Backtest" olarak kalıyor (menüde değil, altbilgide). /pricing fiyatsız: iki ürün ücretsiz, plan için iletişim. Demolar iki ürün altında. Eski `/analytics` → `/lab/analytics` yönlendirmeleri kaldırıldı. Desk Signal görselleri static/urun/demo/desk-grid, desk-console (yerel/demo-screens.mjs ONLY=desk).
- Sunum katmanı 1: masa raporu sayfası. FX Blotter'da "Open the report page" → `/lab/report#local` (model localStorage ile geçer). Model kalibre-lab `lab/src/report/blotter-model.js` (saf, testli): KPI'lar, parite/dealer/kalem türü K/Z, pozisyon, limitler, valör merdiveni, dışlanan satırlar, mutabakat, notlar. Sayfa `lab/report.html` + `report.css` (kağıt görünümü, yazdırma CSS'i) + `src/report/goster.js`. "Print or save as PDF" tarayıcının yazdırmasıdır.
- Paylaşım: `src/report/muhur.js` rastgele anahtarla AES-GCM; zarf `api/rapor.ts`'ye (Upstash, 30 gün, saatte 60/IP özeti), anahtar bağlantının # kısmında. `/lab/report#<id>.<key>` salt okuma (paylaş ve geri düğmeleri yok). Yerelde uçtan uca doğrulandı: rapor açıldı, bağlantı üretildi, ikinci sekmede açıldı.
- Testler: lab `lab/test/rapor.test.mjs` (3), site `test/rapor.test.mjs` (3); lab toplam 451, site 66.
- Canlıya alınmadı; önizlemede, Can onayı bekliyor.
- Vercel Hobby sınırı: en çok 12 sunucusuz işlev. /api/rapor eklenince 13 oldu; eski BIST "Kalabalık" sayacı `api/pulse-ping.ts` (hiçbir sayfa çağırmıyordu, sitede piyasa verisi yok) silindi. Şimdi 12: asistan, desk, hesap, indir, kopru, lisans, rapor, talep, odeme/{baslat,oturum,portal,webhook}. Yeni uç gerekirse Pro plan ya da birleştirme.
- Ana sayfa başlığı Can'ın isteğiyle "FX, solved." olarak kaldı.
- Sunum katmanı 2 (1.11): Trade Analytics için "Account review" rapor sayfası (`lab/src/report/account-model.js`, kind account-review): KPI'lar, bakiye eğrisi (satır içi SVG, 160 nokta), kazandıran/kaybettiren dilimler, sembol/gün/seans/önceki işlem kırılımları, seçili prop kuralıyla tabana en yakın 10 gün. Aynı rapor sayfası ve aynı paylaşım bağlantısı. Test lab/test/rapor.test.mjs (4). Önizlemede, canlıya alınmadı.
- Aşama C, ilk dilim (1.11): (1) Tek Analytics kabuğu: /lab/analytics, /lab/blotter ve /lab (backtest) başlığı "Kalibre Markets · Analytics · <analiz>" ve aynı gezinme (Trade Analytics, FX Blotter, Backtest, Demos, About Analytics); sayfa başlıkları "… · Kalibre Markets". (2) Ortak görünüm kurucu `lab/src/gorunum.js` (boyut × ölçü × çubuk/çizgi/tablo, görünümü kaydet): Trade Analytics eski kodunu bıraktı, FX Blotter'a "12 Your own view" bölümü eklendi (boyutlar parite/portföy/trader/kalem türü/ürün/karşı taraf/büyüklük/saat/gün; ölçüler toplam, fiyat, puan, taşıma, MTM, kalem). Tur 14 adım. Tek "veri kümesi" kavramı henüz yok: iki motorun modeli farklı (kapanmış işlem ve bacak); kurucu `grupla` sözleşmesiyle bağlanır, modelleri birleştirmek sonraya. Lab 452 test; Türkçe tarama 0. Önizlemede, canlıya alınmadı.

### 1.11 ek 19: FXall yönü, bilet içe aktarma, site metni
- Can: Trade Analytics az kullanılıyor; kurumlarda FXall (LSEG, eski Reuters) çok yaygın; entegre çözüm istendi. Araştırma (kaynaklar: lseg.com FXall sayfası ve belgeleri, developers.lseg.com): (1) dosya yolu: FXall işlem geçmişi dökümü altıncı blotter düzeni olur; kamuya açık belgede Excel dışa aktarma teyit edilemedi, Can'dan örnek bekleniyor; (2) STP yolu: FXall işlem detaylarını TMS/OMS'ye QuickConnect, FIX, HTTPS, SFTP ile gönderiyor; biz FIX drop copy okuyoruz; yerel alıcı pilotla; (3) API yolu: FX Participant Insight Reporting API (REST, Trade History, JSON/CSV/XML) ve FX Post Trade API (FIX 5.0 SP2 TCR) bugün yalnız NDF Matching; FXall "planlanıyor". LSEG'in kendi analitiği (Trade Performance Reporting, Tradefeedr ortaklığı) işlem kalitesi; biz K/Z, pozisyon, limit, mutabakat, sunum alanında kalırız. FXall sayfası iddiası: 2.400+ kurumsal müşteri, 200+ likidite sağlayıcı (LSEG'in kendi rakamı). Patent WO2003023564A2 (FX Alliance, 2002, "Ceased"): çok bankalı RFQ, dealer uyarısı, deal ticket, deal log blotter CSV; yürürlükte değil, bizi bağlamaz.
- Yeni özellik: e-postadan işlem biletleri. kalibre-lab `lab/src/blotter/bilet.js`: .eml (MIME, quoted-printable, base64, HTML tablo) ya da yapıştırılan metin → "Etiket: değer" satırları → bilet başına bir satır → iceAktar. Blotter yükleme kutusu çok dosya ve .eml kabul ediyor; "Paste trade tickets (from email)" açılır kutusu. Test lab/test/bilet.test.mjs (3). Yerelde 3 yapıştırılan bilet → 3 bacak, sütunlar kendiliğinden eşleşti. FXall bilet biçimi için Can Outlook örneği gönderecek; etiket sözlüğü onunla ayarlanacak. Outlook'un kendisine bağlanma (Graph/eklenti) yapılmadı: şifre ve yetki istemez, kullanıcı e-postayı kaydedip bırakır.
- Site (Can'ın isteği): "Who it is for" kalktı, yerine 6 kullanım örneği; "free during early access" metinleri her yerden kalktı; fiyat her sayfada "Contact us for pricing" (Analytics masa/hesap başına, Desk Signal koltuk başına). Lab 455 test. Önizlemede.

### 1.11 ek 20: rakip ve maliyet taraması (2 Kasım 2026)
- Dört paralel tarama (kurumsal FX/hazine, bireysel trade analytics, masa iletişimi, e-posta bilet okuma); özet ve bizim maliyet modeli `docs/RAKIP-VE-MALIYET-2026-11-02.md`.
- Ana bulgular: dosya tabanlı ucuz masa blotter'ı satan yok (Hedgebook 250 USD/ay en yakın, TMS'ler 23K-200K USD/yıl); FXall/360T'yi adıyla sayan yalnız Kantox ve Kyriba. Trade journal bandı 15-99 USD/ay, hepsi prop firmaları adıyla sayıyor; girişsiz dosya analizi veren yok. Desk Signal'ın birebir rakibi yok; onaylı uyarı araçları 15-41 USD/koltuk, Speakerbus 2025'te tasfiye, Opsgenie 2027'de kapanıyor. E-posta okuyucular 0,03-0,50 USD/belge; hepsi e-postanın kiracıdan çıkmasını ister, bizim sıfır çıkışlı yaklaşım farklı.
- Maliyet: sabit 30-80 USD/ay (Vercel Pro ödeme açılınca şart), değişken masa/koltuk başına 1 USD altı; 200-500 USD/masa ve 15-40 USD/koltuk fiyatlarında brüt marj %95 üstü. Asıl maliyet satış, güven (CAIQ/SOC 2) ve destek.

### 2.11 ek 21: demo alınabilir altyapı ve mailing hazırlığı
- Can: "ürünlerin MVP'lerini bitirelim; hepsi demo alınabilir altyapı olunca potansiyel müşterilere mailing". Demo yolları (Trade Analytics örneği → hesap incelemesi raporu, FX Blotter örneği → masa raporu → mühürlü paylaşım bağlantısı, backtest örneği, Desk demo ve canlı masa) yerelde uçtan uca yeniden doğrulandı; /demo'daki 36 bağlantı 200 dönüyor.
- Yeni sayfa `/request-a-demo` (yerel/product-pages.py `request_demo`): form ilk ekranda (page_hero'nun görsel yerinde), dört soru (ürün, kurum, kişi sayısı, kayıt kaynağı), iş e-postası, onay; `?product=analytics|desk-signal` ürünü önceden seçer, `?ref=` kaynağı kaydeder. Üç adım ve üç SSS. Sunucu: `api/_lib/talep.ts` SAYFALAR'a `demo` eklendi (urun/kurum/masa/sistem). Sitede tüm "Contact us for pricing" mailto düğmeleri "Request a demo" olarak bu sayfaya bağlandı (analytics, desk-signal, pricing, fx-blotter, ana sayfa ikincil bağlantı); fx-blotter ve desk-signal'daki ayrı dialog formları kaldırıldı. `static/talep.js` dialog olmadan da çalışır. site.css: `.talep-kart` (dialog kurallarının sayfa içi kopyası).
- Bildirim: `api/_lib/bildirim.ts` `demoBildir`: form kaydından sonra Resend ile kurucuya e-posta; `RESEND_API_KEY` ve `TALEP_BILDIRIM_KIME` yoksa atlanır, kayıt yine Upstash'te. Varsayılan gönderici Resend test adresi (yalnız hesap sahibine ulaşır, domain doğrulaması gerekmez); `TALEP_BILDIRIM_KIMDEN` ile değişir. reply_to talep sahibi. Testler: test/bildirim.test.mjs (3), test/talep.test.mjs demo senaryosu; site 70 test.
- Mailing planı `docs/MAILING-PLANI.md`: ön koşullar (Resend anahtarları Can girer, canlıya al, kişisel adresten tek tek gönderim), üç segment (banka/kurumsal hazine → Analytics; prop/küçük masa → Desk Signal; aracı kurum/fon), liste şablonu `docs/mailing-liste-sablon.csv` (liste repoya girmez), kadans (ilk, +4 iş günü hatırlatma, +7 iş günü kapanış), dört İngilizce taslak, ölçüm (`?ref` + talep-ozet). Hedef ilk 4 hafta 90 e-posta, 5 demo, 2 pilot.
- Önizlemede; canlı için Can onayı. Sitemap'e /request-a-demo eklendi.

### 2.11 ek 22: müşteri dosyası ön uçuş testi, uçtan uca demo kontrolü, demo günü listesi
- Can'ın sorusu: "gerçek müşteri plug in yaptığında demo çalışmazsa diye önceden test edemez miyiz?" Üç parça yapıldı.
- (1) kalibre-lab `lab/test/musteri-dosyasi.test.mjs` (68 test): beş döküm biçiminin her biri başlık satırları, boş satır/sütun, büyük harf ve satır sonu içeren başlıklar, ters sıralı sütunlar, ara toplam satırları, sayfa sonlarında yinelenen başlıklar, serbest metin not sütunu, TSV, UTF-16, Windows-1254, özet sayfasının arkasındaki ikinci sayfa ve 11.000 bacaklık dosya altında referansla aynı bacak ve K/Z'yi vermek zorunda; okunamayan dosyalar (.xls, boş, yalnız başlık, rastgele bayt, düz yazı) fırlatmadan ve NaN'sız "eksik" raporlar. MT5 raporu sıkıştırılmış/yorumlu/CRLF/kesik sürümleri ve 10.000 işlemlik kayıt. İlk koşuda 9 kırmızı çıktı ve iki gerçek hata düzeltildi: yinelenen başlık satırları veri sayılıyordu (şimdi `baslik-tekrari`), toplam etiketi ilk hücrede değilse (ters sütun, "Summe" ortada) satır hata oluyordu (şimdi herhangi bir hücrede tam etiket). Başlıksız dosyada `ozet` eksikti (mutabakat çökerdi), eklendi. Lab 523 test; `npm test` listesine eklendi.
- (2) site `test/e2e/demo-yollari.mjs` (`npm run e2e`, playwright-core + önbellekteki Chromium, indirme yok): canlı sitede altı adım; demo formu bot tuzağıyla gönderilir (204, kayıt yok), raporlar yeni sekmede açılır, paylaşım bağlantısı ikinci tarayıcı bağlamında salt okuma açılır, backtest örneği istatistik gösterir, canlı masa iki ayrı tarayıcıda şef+trader (gönder → görüldü → bitti; gecikme yazdırılır: yerel 23 ms, canlı 589 ms). Canlıda 6/6.
- (3) `docs/DEMO-GUNU-KONTROL.md`: görüşme öncesi otomatik + elle kontrol, yedek plan, görüşme sonrası.
- Lab içe aktarma düzeltmeleri siteye eşitlendi; önizlemede, canlı için Can onayı.

### 2.11 ek 23: "Sor" kutusu (soru → görünüm, veri dışarı çıkmadan)
- Can'ın yönü: Tableau'nun genel kurucusu değil, Legora gibi dikey katman; masanın kendi verisiyle, verisi dışarı çıkmadan. İlk adım: Trade Analytics ve FX Blotter'daki ortak görünüm kurucunun üstüne "sor" kutusu.
- kalibre-lab `lab/src/sor.js` (saf, 8 test): şema yalnız boyut ve ölçü adları; yerel çözümleyici (ad eşleşmesi, çoğul ve Türkçe ek toleransı, masa eşanlamları: legs/items/kalem, p&l/profit/kâr, counterparty/client/cpty, pair/currency, hour/saat, weekday/day/gün…; top/worst N, only X, table/line) soruyu modelsiz tarife çevirir; `tarifDogrula` modelden ya da depodan gelen her tarifi süzer (bilinmeyen id ret, ilkN en çok 50, filtre 40 karakter); `tarifUygula` toplanmış satırlarda süz/sırala/kes. `gorunum.js`: `#g-sor` formu, aktif süzme çipi (Temizle), kayıtlı görünümler süzme ve ilk N'i de taşır; seçici değişince ek ayar sıfırlanır.
- Sunucu: 12 işlev sınırı yüzünden yeni uç yok; `api/asistan.ts` `{ mod: 'gorunum', soru, sema }` dalı (`api/_lib/gorunum.ts`, 3 test): şema temizlenir (id deseni, ad 60 karakter, en çok 40 kalem), soru 200 karakter, Gemini (yedek Groq) yalnız "JSON tarif" ister, yanıt `gorunumCevabi` ile doğrulanır; hata 422/503. Yerel çözümleyici anlamazsa tarayıcı bu yolu dener; anahtar yoksa "Anlaşılmadı" mesajı. Hiçbir satır veri hiçbir yere gitmez; sayfa dipnotu bunu söyler.
- Yerelde doğrulandı: blotter "top 3 counterparties by total P&L" → karşı taraf tipi, ilk 3; "legs by weekday as a table, only mon" → tek satır tablo; analytics "net by symbol, worst 5", "number of trades per hour" → açılış saati. Lab 531 test (performans testi yük altında dalgalı, tek başına 1,5 s), site 73.
- Sırada (Can'ın onayıyla): satış masası için bilet dökümünden "satış masası raporu" (müşteri, satışçı, kağıt, dönüş süresi); gerçek anonim döküm gelince.
- Ek (2.11 gece): önizlemede model yolu 503 verdi; neden sitenin mevcut asistanının zaten kırık olması (Groq `llama-3.3-70b-versatile` kaldırılmış, Gemini 2.0 Flash düşüyor). `api/asistan.ts`: model adı ortamdan (`GEMINI_MODEL`, `GROQ_MODEL`; varsayılan gemini-2.5-flash), 404'te sağlayıcının model listesinden uygun olan seçilip hatırlanıyor; iki sağlayıcı da düşerse ikisinin hatası birlikte raporlanır. Önizlemede "where do we lose the most money, show the five biggest losers" → parite × toplam, artan, ilk 5 (200); Türkçe sohbet yolu da yeniden çalışıyor. Önizleme https://macrostreamvercel-comhud131-canayan1s-projects.vercel.app; canlı için Can onayı.

### 3.11 ek 24: Rule Guard beta, kendi kendine kurulum rehberleri
- Can: "Rule Guard'ı da kuralım"; arkadaşına demo yaptırırken yalnız kalibremarkets.com bağlantısını paylaşacak, geri kalan her şey (ne olduğu, ne elde edileceği, adımlar) siteden ve indirilebilir olmalı; site aynı zamanda vitrin.
- Bulgu: Rule Guard ayrı eklenti olarak yoktu; kalkan yalnız işlem açan Motor'un içindeydi (Motor test kullanıcılarına verilmez). Yeni `kalibre-lab/mql5/Experts/Kalibre/KalibreRuleGuard.mq5` 0.10: hiç işlem açmaz; Kalkan.mqh ile günlük/azami taban; güvenlik payının 2 katında uyarı, 1 katında gün sonuna kadar kilit; Watch (varsayılan, uyarı + ses + MetaQuotes push) ve Protect (kilitte hesaptaki tüm pozisyonları kapatır, bekleyen emirleri siler; gerçek hesapta `InpRealConfirm` şart, Algo Trading kapalıysa panel söyler); başlangıç sermayesi varsayılanı hesabın ilk yatırımı; lisans, WebRequest, ağ yok; kendi global değişken öneki (`Kalibre.RuleGuard.`), Motor ile çakışmaz (Kalkan.mqh `Kur` isteğe bağlı önek aldı; Motor değişmedi, yeniden derlendi).
- Doğrulama: MetaEditor (Wine) 0 hata; kalkan senaryo betiği 23/23; yerel MetaQuotes-Demo hesabında grafiğe Watch modunda bağlandı: başlangıç 100.000 (ilk yatırım), FTMO 2-Step taban 95.144,79 (gün başı 100.144,79 − 5.000), hesap tabanın altında olduğu için kilit uyarısı doğru verildi. Protect modunun Strategy Tester denemesi yapılamadı: MT5 build 6285 sonrası yerel test ajanı Wine altında 13 sn geç yanıt veriyor ve terminal "tester agent authorization error" ile vazgeçiyor (23 Ekim'de çalışıyordu). Protect'in kapatma kodu Motor'un doğrulanmış kapatma koduyla aynı CTrade çağrısı; yine de gerçek hesapta önerilen mod Watch.
- Site: `/rule-guard` "Planned"dan Beta'ya: "Download for MT5" (`/static/downloads/KalibreRuleGuard.ex5`, SHA-256 sayfada), 3 adım, özellikler, SSS (firma izni, elle emir engellenemez, MT5 kapalıyken çalışmaz, garanti yok). `/demo` Rule Guard bloğu indirme ve rehberle. Altbilgide "Rule Guard (planned)" → "Rule Guard" + "Guides".
- Rehberler: `/guides/{trade-analytics,fx-blotter,desk-signal,rule-guard}` (ne gerekir, adımlar, ne görürsün, bilmen gerekenler) ve her biri PDF (`static/guides/kalibre-<key>-guide.pdf`, `node yerel/guide-pdf.mjs` yerel sunucudan basar; beta şeridi ve çerez penceresi baskıdan çıkarılır). `/get-started` merkez sayfa. Ürün sayfalarının ilk ekranında rehber bağlantısı. Ana menüye "Get started" eklendi (İngilizce 30 sayfa; Türkçe sayfalar kapalı, dokunulmadı): menü değişikliği Can onayı ister.
- `npm run e2e` 7 adım: yeni adım rehber PDF'leri ve .ex5 indirmesini denetler. Yerelde 7/7.

### 3.11 ek 25: kişisel davet sayfası
- Can: arkadaşına paylaşılacak bir davet bağlantısı; ürünü sorunsuz anlasın, "bedavaya satın alıyormuş gibi" demoya yönlensin.
- `/invite/<kod>` (kodlar `yerel/davetler.json`; ilk kod `b94d6b`, kimden "Can"): noindex, site haritasında yok. İlk ekranda "Can invited you" ve "Trader access" kartı (Trade Analytics, Rule Guard, Desk Signal, raporlar, rehberler; Total 0 USD, "Your invitation covers it. No card, no subscription."), e-posta + platform + hesap türü + onay → "Claim my access" → "You're in" özeti. Altında üç adım (Trade Analytics rehberi, Rule Guard indir + rehber, isteğe bağlı Desk Signal), işaretler bu tarayıcıda saklanır. "Tell Can how it went": dört soru (bugün nasıl takip ediyorsun, ne şaşırttı, her hafta açar mısın, neden), aynı kaydı günceller.
- Sunucu: `api/_lib/talep.ts` SAYFALAR'a `davet` (kod, platform, hesap, takip, sasirtan, haftalik, neden); test eklendi, site 74. Kayıt bildirimi Resend anahtarı girilince Can'a e-posta.
- Yerelde doğrulandı: onaysız gönderim uyarı verir, talep 200, geri bildirim 200, yeniden yüklemede durum korunur, telefonda taşma yok.
