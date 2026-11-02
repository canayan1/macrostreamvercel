# Rakipler, iş ortakları ve maliyet karşılaştırması (2 Kasım 2026)

Amaç: Kalibre Markets'in iki ürününe (Analytics: Trade Analytics, FX Blotter, Backtest; Desk Signal) ve yeni e-posta bilet otomasyonuna en yakın başarılı fintech'leri bulmak, sitelerinde saydıkları iş ortaklarını çıkarmak ve "biz daha ucuza mal edebilir miyiz" sorusunu rakamla yanıtlamak.

Yöntem: dört paralel tarama (kurumsal FX/hazine analitiği, bireysel trade analytics, masa iletişimi, e-posta bilet/doküman okuma). Her rakam kaynağın adresiyle geldi; doğrulanamayanlar "bulunamadı" olarak bırakıldı. Üçüncü taraf fiyat tahminleri (Vendr, G2, basın) ayrıca işaretli. Bazı satıcı siteleri (Coupa, FIS, Bloomberg, Embrava, TraderSync, Myfxbook) erişimi engelledi; o satırlar ikincil kaynağa dayanır.

## 1. Kurumsal FX masası analitiği (FX Blotter'ın rakipleri)

| Satıcı | Kim, para | Ürün | Sitesinde saydığı iş ortakları | Fiyat |
|---|---|---|---|---|
| Kyriba | San Diego, 2000; Bridgepoint çoğunluk, 2024'te 3 milyar USD üstü değerleme | Tam hazine sistemi (TMS): nakit, ödeme, FX riski, hedge muhasebesi | Fact sheet: FXall, 360T, Bloomberg API; SAP sertifikalı bağlayıcı; ortak sayfasında ad yok, "10.000 banka" | Açık değil. Vendr medyanı 22.787 USD/yıl (pazar yeri sayfası) ile ~205.000 USD/yıl (alıcı rehberi) arasında; üçüncü taraf 75-200 bin USD/yıl, 3 yıllık sözleşme |
| ION Treasury | Londra; Wallstreet Suite, Reval, IT2, Treasura | Büyük kurumlar ve bankalar | Hazine sayfasında ad yok | Teklif |
| FIS Treasury & Risk (Quantum/Integrity) | Jacksonville | Büyük kurum (Quantum) ve orta ölçek SaaS (Integrity) | "ERP, kur sağlayıcı, işlem portalleri" (ad yok); FIS SWIFT bürosu | Açık değil |
| GTreasury (Ripple Treasury) | Chicago; Ripple 1 milyar USD'ye aldı (Ekim 2025) | TMS | Fides, SWIFT, Goldman Mosaic, JPM balances API, Fenics Market Data, Refinitiv Datascope; 360T/FXall yok | Açık değil |
| Coupa Treasury (eski Bellin) | Coupa, Bellin 121 milyon USD (2020) | TMS | Vaka çalışmasında 360T XML bağlantısı | Açık değil |
| Nomentia | Helsinki, Inflexion | Nakit, ödeme, FX türev yaşam döngüsü | SWIFT, Fides, SEB, NetSuite, Infront, Zanders, Deloitte, Capgemini; 360T/FXall yok | Teklif |
| Hedgebook | NZ kökenli, İngiltere merkezli, 2011 | FX maruziyet, forward/opsiyon/IRS kaydı, bağımsız MTM, kurul raporu; 1.400+ şirket iddiası | Ad yok; "üçüncü taraf FX sistemlerine API" | **Açık: 250 USD / 200 GBP aylık, şirket lisansı başına**, ücretsiz deneme, 24 saatte kurulum |
| Kantox (BNP Paribas) | Londra/Barselona, 2011; BNP ~120 milyon EUR (2022); 2023 geliri 7,4 milyon GBP (Preqin) | Dinamik hedge, fiyatlama, ödeme | **SAP, Oracle, Dynamics, NetSuite, FXall, 360T** (entegrasyon sayfası); ortak logoları 360T, BNP | Açık değil; abonelik + işlem ücreti |
| Hazeltree | New York, 2011; ~33 milyon USD | Hedge fonlar için hazine, mutabakat, FX hedge | **360T, Enfusion, FIS, Sage, Dynamics 365, Salesforce** (ortak sayfası) | Teklif |
| Bound | Londra, 2021; 24,5 milyon USD Series A (Şubat 2026) | KOBİ için otomatik hedge, EMI | Ad yok | Açık: kurulum/aylık ücret yok; spot 3 bp'den, hedge %0,25-0,75 |
| HedgeFlows | Londra | KOBİ hazine platformu | Xero, QuickBooks, NetSuite, Business Central | Açık: 99 / 499 GBP aylık |
| TreasuryView (emformX) | Frankfurt, 2009 | Borç, hedge, türev değerleme SaaS | SAP, Azure SSO, REST API | Açık: 250 EUR/ay, 5 kullanıcı |
| CorpHedge | bulunamadı | KOBİ FX hedge SaaS | bulunamadı | Capterra: 500 EUR/ay sabit |
| Trovata | San Diego, 2016; ~60 milyon USD | Banka API ile nakit yönetimi | Banka API'leri (JPM, Wells), ERP'ler | Satıcı: "25 bin USD'den başlar" (10 kullanıcı) |
| TCA tarafı: Tradefeedr, BestX (State Street), 360T Vantage, Bloomberg BTCA, LSEG TPR, FairXchange | | İşlem kalitesi analitiği; yalnız kendi platformunda yapılan işlemleri görür | Tradefeedr: LSEG, FlexTrade, Goldman, UBS, XTX; BestX: FX Connect, FlexTrade | Tradefeedr alıcı tarafa bedava (LP öder); diğerleri açık değil |

Bulgular:
- Bu kümede dosya yükleyip çalışan ucuz bir masa blotter'ı satan **kimse yok**. Ya 25 bin USD/yıl üstü entegre TMS, ya kendi platformunu gören TCA, ya da spread'den kazanan hedge aracısı.
- FXall ve 360T'yi kendi sitesinde adıyla sayan yalnız Kantox ve Kyriba; Hazeltree 360T logosu koyuyor. Çoğu ortak sayfası danışmanlık ve ERP sayıyor, FX platformu değil. "Entegrasyon gerekmez, elindeki dökümle çalışır" saklanacak bir zayıflık değil, boş duran bir konum.
- Pazarın ödediği açık fiyatlar: tek şirket, entegrasyonsuz araç için 250-600 USD/EUR aylık (Hedgebook, TreasuryView, CorpHedge); banka bağlantısı eklenince 2-3,5 bin USD aylık (Trovata); TMS için yılda beş-altı hane.
- Kimse "platform dökümü ile sistem kaydının mutabakatı"nı ayrı özellik olarak pazarlamıyor; FX Blotter'ın 7 kontrollü mutabakat paneli bu açığa oturuyor.

## 2. Bireysel trade analytics (Trade Analytics'in rakipleri)

| Ürün | Kim | Sitesinde saydığı platform ve prop firmalar | Fiyat (kaynak: kendi fiyat sayfası) |
|---|---|---|---|
| TradeZella | Bootstrap, 2022; "50K+ trader", 500+ broker iddiası | MT4/MT5 (otomatik + dosya), cTrader, NinjaTrader, Tradovate, Rithmic, DXtrade, Match-Trader, TradeLocker, TopstepX; prop kuralları: günlük zarar, drawdown, tutarlılık | 35 / 59 / 99 USD aylık; ücretsiz plan yok |
| Tradervue | SureSwift, 2011; "207.623 trader" | 80+ entegrasyon; MT5 HTML raporu dosya yükleme | 29,95 / 49,95 USD; ücretsiz: ayda 30 işlem |
| Edgewonk | Quantum Trade Solutions GmbH, Offenbach | ~60 broker/firma adıyla: FTMO, FundedNext, Funding Pips, The5ers, E8; cTrader, NinjaTrader, Tradovate, Rithmic, Match Trader, TopstepX | 35 USD/ay ya da 197 USD/yıl; ücretsiz yok |
| TraderSync | 2014 | 700+ broker (ikincil) | 29,95 / 49,95 / 79,95 USD (ikincil, Eylül 2026) |
| TradesViz | 2019 | Tüm MT4/MT5 ve cTrader; prop sayfasında Apex, Topstep, FTMO, FundedNext, The5ers, "37+ firma, 65+ profil", trailing/statik drawdown modeli | Ücretsiz (3.000 işlem/ay, yalnız hisse); 17,99 / 25,99 EUR |
| FX Blue | Eski MT4i | "Kullananlar": GO Markets, Tickmill, Vantage, FTMO, IC Markets, Pepperstone, OANDA; yalnız MT4/MT5 | Ücretsiz (broker beyaz etiket) |
| Myfxbook | 2009, bootstrap, İsrail | MT4, MT5, cTrader, TradeLocker; AutoTrade broker ortakları | Ücretsiz |
| Trademetria | ABD şirketi, Brezilya ekip; "80.000+ kullanıcı" | MT5, cTrader, NinjaTrader, Tradovate, 140+ broker | Ücretsiz (30/ay); 19,95 / 29,95 USD |
| Tanto | New York, 2025 | Tradovate, NinjaTrader, Rithmic, cTrader, MT5, IB, ProjectX, TopstepX; Apex, Topstep, FTMO, Lucid, FundedNext | 13,99 / 24,99 / 39,99 USD |
| TraderWaves | Londra, 2024 | MT4/MT5, cTrader, MatchTrader, TradeLocker, DXtrade, Tradovate, NinjaTrader | Ücretsiz (3 hesap); Pro 19,99 USD |
| Prop firmaların kendi panelleri: FTMO Account MetriX, FundedNext dashboard, TopstepX | | | Hesapla birlikte bedava |

Bulgular:
- Fiyat bandı: giriş 15-35 USD/ay, orta 30-60 USD/ay, yıllıkta %20-30 indirim. Ücretsiz katmanlar özellikle değil içe aktarma sayısıyla sınırlı (ayda 30 işlem gibi).
- Olmazsa olmaz entegrasyonlar: MT4/MT5 (yatırımcı şifresiyle otomatik + HTML/CSV rapor), cTrader, sonra Match-Trader, DXtrade, TradeLocker (prop firmalar MetaTrader'dan göç etti). Herkes prop firmaları **adıyla** sayıyor; standart prop özellikleri: trailing/statik drawdown, günlük zarar, tutarlılık kuralı, geçmişe dönük geçti/kaldı.
- Boşluk: Hiçbir rakip "dosyayı bırak, incelemeyi al, bağlantıyı paylaş" biçiminde hesapsız, şifresiz anlık analiz vermiyor. Tradervue ve TradeZella MT5 HTML'i alıyor ama üye girişinin arkasında. Yatırımcı şifresi paylaşmak bilinen bir itiraz (TraderWaves bu yüzden OAuth'u pazarlıyor).
- Gerçekçi konum: 10-20 USD/ay ya da ücretsiz huni girişi; derinlikte 35-99 USD'lik tam günlüklerle değil, broker tarafındaki bedava istatistiklerle (FX Blue, Myfxbook, MetriX) gizlilik ve prop kural kontrolü üzerinden yarışmak. İnandırıcılık için MT4/MT5 HTML+CSV, cTrader XLSX, Match-Trader/DXtrade/TradeLocker dökümleri ve adlı prop profilleri (FTMO, FundedNext, The5ers, Funding Pips, Topstep, Apex) gerekiyor.

## 3. Masa iletişimi (Desk Signal'ın rakipleri)

| Satıcı | Kim, para | Ürün | Sitesinde saydığı iş ortakları | Fiyat |
|---|---|---|---|---|
| Symphony (+ Cloud9 ses) | 2014, Goldman ve 14 banka; ~510 milyon USD; 1.400+ müşteri | Uyumlu mesajlaşma, WhatsApp federasyonu, Teams birlikte çalışma, Cloud9 bulut turret (intercom, ringdown, hoot) | IPC, NICE, Verint, Global Relay, Smarsh, Behavox, Theta Lake, SteelEye, VoxSmart, OpenFin, interop, FlexTrade, TradingView; uygulamalar: Teams, Zoom, WhatsApp, Jira, Salesforce, ServiceNow. Bloomberg ve LSEG yok | Açık değil; basın 15-20 USD/kullanıcı/ay (2017-2019). Cloud9 koltuk fiyatı yok |
| IPC Systems (Unigy, IPC One) | 1973, NJ/NY; 2015'te 1,2 milyar USD; 7.000+ müşteri | Turret, soft turret, hoot, Connexus; IPC One "head trader için gerçek zamanlı gözetim" | Cisco, Smarsh, OpenFin, AWS, Equinix, Nokia, Fortinet, Beeks; ICE Voice ortaklığı | Açık değil |
| Speakerbus | İngiltere, 1984 | Turret ve hoot | yok | **2025'te tasfiye**; comitFS bazı varlıkları aldı |
| BT Trading | BT Group; 2017'de IP Trade'i aldı | Dealerboard, Radianz üstü UCC | Microsoft (2011) | Açık değil |
| Bloomberg IB / Enterprise IB | Bloomberg LP | Terminal içi sohbet; Enterprise IB terminalsiz personel için | Site erişimi engelli | Enterprise IB ~10 USD/kullanıcı/ay (2017); Terminal ~2.360-2.665 USD/ay (üçüncü taraf tahmin) |
| ICE Chat | ICE | Emtia/türev IM; Chat API ile risk uyarısı itme (onay akışı yok); 120.000+ kullanıcı | ICE Voice IPC ile | Standalone fiyat yok |
| Microsoft Teams | | Yüzeyde uyumlu kayıtla (NICE, Verint, ASC, AudioCodes, CallCabinet) | | Essentials 4 USD, Teams Phone ~10 USD/kullanıcı/ay |
| Slack | Salesforce | | | 7,25 / 15 USD yıllık |
| PagerDuty | NYSE: PD; FY2026 gelir 493 milyon USD | Nöbet uyarısı, onay, eskalasyon, MTTA/MTTR | | Ücretsiz (5 kullanıcı); 21 USD yıllık / 25 aylık; Business ~41 |
| Opsgenie (Atlassian) | | | | 19,95 / 31,90 USD; **5 Nisan 2027'de kapanıyor** |
| xMatters / Everbridge | Thoma Bravo 1,8 milyar USD (2024) | | | xMatters 15 / 39 USD; Everbridge teklif |
| Squadcast (SolarWinds) | | | | 15 / 24 USD |
| DeskAlerts | | Masaüstü uyarı + onay takibi (kurumsal iletişim) | | 1.400 USD/yıldan, alıcı başına |
| Durum ışıkları: Luxafor, Kuando Busylight, Embrava | | Renkli USB ışık; Teams/Zoom durumu; onay ve kayıt yok | Teams, Zoom, Zapier, API | 27-69 EUR/USD tek seferlik |
| Elgato Stream Deck | Corsair | Kısayol tuş takımı | | 59,99 / 149,99 / 249,99 USD |
| Prop firmalar (FTMO, Topstep, Apex) | | Discord, canlı sohbet, e-posta/Telegram drawdown uyarısı; şeften trader'a sinyal aracı yok | | |

Bulgular:
- **Birebir rakip yok.** Renk kodlu, önceden tanımlı, tek tıkla şeften trader'a giden, onaylanana kadar süren, görüldü/bitti zaman damgalı ve yanıt süresi ölçen bir ürün bulunamadı. En yakınlar: RiskVal'in onaylanana kadar vurgulu kalan uyarı satırı, ICE Chat API risk uyarısı (onaysız), IT nöbet araçları (PagerDuty vb., onay ve MTTA var ama olay odaklı), DeskAlerts (kurumsal pop-up + onay), durum ışıkları (renk var, onay ve kayıt yok). Hoot/squawk sistemleri sesli yayın, onay yok.
- Koltuk fiyat bandı: uyumlu masa sohbeti 10-20 USD/kullanıcı/ay; onaylı uyarı araçları 15-41 USD/kullanıcı/ay; turret/ses tarafında açık fiyat hiç yok (teklif). Desk Signal için 15-40 USD/koltuk/ay yerleşik banda düşer; uyarı kategorisinde 5 kullanıcılık ücretsiz katman standart.
- Herkesin saydığı ekosistem uyumluluk kayıt/arşiv: NICE, Verint, Global Relay, Smarsh, Behavox, Theta Lake, SteelEye, VoxSmart. Teams evrensel birlikte çalışma hedefi, Zoom ikinci. Desk Signal'da Global Relay/Smarsh'a dışa aktarım ve Teams kancası alıcı beklentisine denk düşer.
- Rekabet riski var olan üründen değil komşuluktan gelir: Symphony veya IPC'nin sohbete/turret'e "onaylı sinyal" eklemesi ya da bir Teams uygulaması. Speakerbus'ın tasfiyesi ve Opsgenie'nin kapanışı birer açık kapı.

## 4. E-postadan işlem bileti okuma (yeni otomasyonun rakipleri)

| Satıcı | Kim | Ürün | Sitesinde saydıkları | Fiyat |
|---|---|---|---|---|
| Xceptor | Londra, 2003; Astorg | "Confirmations Extraction Agent": her karşı taraf, her düzen; "FX ve emtia OTC teyitleri için doğrulandı"; PDF, teyit, e-posta | E-posta, SFTP, REST, SharePoint, Azure, AWS, UiPath, Snowflake, Power BI; Murex, Summit, Adenza, Aladdin; SWIFT, FIX; Bloomberg, Reuters; DTCC | Açık değil |
| Duco | Londra, 2010; Nordic Capital | Mutabakat + yapısız belge çıkarımı (10 örnekle eğitim) | Müşteri logoları; ortak adı yok | Açık değil |
| Gresham (Control) | Londra/NY; STG 147 milyon GBP (2024) | Mutabakat; S&P belge çıkarımı | S&P IDE | Açık değil |
| SmartStream TLM Confirmations | Londra; Dubai (ICD) | SWIFT Accord yerine teyit eşleme; %96-98 otomatik eşleme iddiası | SWIFT | Açık değil |
| ipushpull | Londra; TP ICAP azınlık (2023) | **"Sohbet, e-posta ve diğer kaynaklardan" AI ile ön doldurulmuş trade ticket**, trader onayı, OMS/ETRM'ye yazım | Bloomberg chat, Symphony, Teams, WhatsApp, Excel; Outlook yok | Çeyreklik/yıllık lisans; Capterra "100 GBP'den" (doğrulanmadı) |
| OSTTRA, CLS, TradeNeXus, Finastra CMS, AccessFintech, Broadridge | Piyasa altyapısı | E-postayı yapılandırılmış mesajla (MT300, FIX, FTP) **değiştirir**; e-posta okumaz | | Yalnız CLS tarife yayımlıyor (talimat başına 0,055-0,275 GBP) |
| LSEG FXall STP | | QuickConnect / FIX / HTTPS / SFTP; Settlement Center FTP; Trade Notification hub; Partner Channel 25+ TMS satıcısı; **e-posta STP kanalı olarak hiçbir yerde sayılmıyor** | | |
| Parseur | Singapur, 2016, bootstrap | AI e-posta/PDF okuyucu; "broker e-postasından işlem takibi" kullanım sayfası var | Outlook otomatik yönlendirme (uyarı: "çoğu Microsoft 365 kiracısı dış adrese yönlendirmeyi engeller"), Power Automate, Zapier, Make | Ücretsiz 20 sayfa; 49 / 129 / 269 / 499 EUR aylık (~0,05-0,50 EUR/sayfa) |
| Mailparser / Docparser | SureSwift | E-posta/PDF okuyucu | Zapier, Salesforce, Power Automate | 29,95-299,95 USD (~0,03-0,12 USD/e-posta); Docparser 39-159 USD |
| Zapier Email Parser | | | Gmail, Outlook | Zapier planı 19,99-129 USD |
| Airparser, Parsio | | LLM okuyucu | Zapier, Make, n8n | 24-299 USD |
| Nanonets | SF; 29 milyon USD Series B (2024) | IDP + iş akışı | SAP, Oracle, Salesforce | 100 USD/ay'dan; blok başına 0,02-0,30 USD |
| Rossum | Prag; 100 milyon USD Series A | Belge AI (AP odaklı) | SAP, Coupa, Workday, NetSuite | **18.000 USD/yıldan** |
| ABBYY Vantage | Austin | IDP | Power Automate, UiPath, Blue Prism | G-Cloud: ~0,06-0,11 USD/sayfa |
| Blotter (blotterapp.io) | Dubai | Bireysel günlük: broker teyit e-postasını yönlendir, AI işlemi alır; 200+ broker | | Ücretsiz 50 işlem/ay |

Bulgular:
- Belge okuma fiyatı sayfa/e-posta başına 0,03-0,50 USD, giriş 24-49 USD/ay, 10 bin birim 300-500 USD/ay; kurumsal IDP 18 bin USD/yıldan. Koltuk başına fiyat bu kategoride yok. Sermaye piyasası satıcıları hiç fiyat yayımlamıyor.
- FX bilet e-postasını açıkça hedefleyen tek satıcı Xceptor (kurumsal, fiyatsız); ipushpull sohbet öncelikli ve banka tarafı. Hazine sistemleri (Kyriba, GTreasury, Hazeltree) gelen e-postadan işlem alma değil portal/API STP anlatıyor.
- Pazardaki her e-posta okuyucu e-postanın kiracıdan çıkmasını ister (yönlendirme kuralı, SFTP, bağlayıcı). Bizim yapıştır/bırak yaklaşımı tam bu sürtünmeyi kaldırıyor: veri dışarı çıkmıyor. Outlook eklentisi ya da Graph bağlayıcısı eklenirse Parseur/Xceptor ile aynı kiracı izni alanına gireriz; **sıfır çıkışlı sürüm varsayılan katman olarak kalmalı**.

## 5. Bizim maliyetimiz

Altyapı fiyatları satıcıların kendi fiyat sayfalarından (2 Kasım 2026):

| Kalem | Fiyat | Not |
|---|---|---|
| Vercel Pro | 20 USD/ay (geliştirici koltuğu), 20 USD kullanım kredisi, 1 TB aktarım, işlev çağrısı 0,60 USD/milyon | Hobby ticari kullanıma kapalı; ücret alınmaya başlanınca Pro şart. 12 işlev sınırı Pro'da kalkar |
| Upstash Redis | Ücretsiz 500K komut/ay, 250 MB; sonra 0,20 USD/100K komut, ilk 1 GB depolama bedava; sabit 250 MB plan 10 USD/ay | Desk Signal rölesi, rapor zarfları, lisans |
| Supabase | Ücretsiz 50K MAU, 500 MB; Pro 25 USD/ay | Yalnız hesap katmanı açılırsa |
| Resend | Ücretsiz 3.000 e-posta/ay (günde 100); Pro 20 USD | Bekleme listesi ve bildirimler |
| Stripe | Billing %0,7 + kart ücreti (EEA standart kart %1,5 + 0,25 EUR; uluslararası %3,15 + 0,25 EUR; kur çevrimi +%2; fiyat sayfası İrlanda sürümünde görüldü, Türkiye koşulları ayrıca bakılmalı) | Ödeme açılınca |
| Apple Developer Program | 99 USD/yıl | Tauri top uygulamasını imzalamak için (2. aşama) |
| Alan adı, Vercel'de barındırma | mevcut | |

Kullanım tahmini (Desk Signal, ölçülmüş değil, hesaplanmış): 10 koltuklu bir masa, günde 200 sinyal, 30 sn'de bir çevrimiçi yoklaması, 22 iş günü: ~4.400 EVAL + ~210.000 yoklama ≈ **ayda 215K komut ≈ 0,43 USD / masa**. Rapor paylaşımı ve bilet okuma tarayıcıda çalışır; sunucuya yalnız şifreli zarf gider (zarf başına 1-2 komut). Yoklama SSE'ye taşınırsa bu rakam onda birine iner.

Toplam:
- **Sabit:** ödeme öncesi 0 USD/ay (bugünkü durum); ödeme açılınca 20-25 USD (Vercel Pro) + 0-25 (Supabase) + 0-20 (Resend) + 99 USD/yıl Apple ≈ **30-80 USD/ay**.
- **Değişken:** masa ya da hesap başına **1 USD/ay'ın altında** + Stripe kesintisi (%2,2-5,9 arası, karta göre).
- **İşçilik:** tek kurucu + Claude; bordro yok. Rakiplerde (Kyriba, Symphony, IPC, Xceptor) yüzlerce çalışan, satış ekibi ve sertifikasyon maliyeti var; bu, onların fiyatını belirleyen asıl kalem.

## 6. Daha ucuza mal edebilir miyiz?

Evet, üretim maliyetinde açık ara. Karşılaştırma (aylık, bir müşteri birimi için):

| Ürün | Rakip fiyatı (pazarın ödediği) | Bizim değişken maliyetimiz | Olası fiyatımız | Brüt marj |
|---|---|---|---|---|
| FX Blotter (masa başına) | Hedgebook 250 USD, TreasuryView 250 EUR, CorpHedge 500 EUR; TMS 2-17 bin USD/ay | < 1 USD | 200-500 USD/masa (yerleşik band) | > %95 |
| Trade Analytics (hesap başına) | 15-35 USD giriş, 30-99 USD orta/üst | < 0,10 USD (sunucuya veri gitmiyor) | ücretsiz huni + 10-20 USD ya da Analytics paketinde | > %95 |
| Desk Signal (koltuk başına) | Uyarı araçları 15-41 USD, uyumlu sohbet 10-20 USD | ~0,05 USD/koltuk | 15-40 USD/koltuk | > %95 |
| E-posta bilet okuma | 0,03-0,50 USD/belge, 24-49 USD/ay giriş; Rossum 18 bin USD/yıl | 0 (tarayıcıda) | FX Blotter'a dahil, ayrı satılmaz | |

Nerede ucuz olmayız, dürüstçe:
1. **Satış ve güven maliyeti.** Kurumsal alıcı CAIQ/SOC 2, sözleşme, veri işleme ekleri ister. SOC 2 Tip 1 denetimi on binlerce USD; bunu ancak ilk ödeyen masalar talep ettiğinde yaparız. Şimdilik kozumuz: veri tarayıcıdan çıkmıyor, sunucu yalnız şifreli zarf görüyor; CAIQ Lite'ı kendi başımıza doldurabiliriz.
2. **Entegrasyon.** Kantox ve Kyriba FXall/360T API'siyle bağlanıyor; biz dosya ve e-posta biletiyle giriyoruz. Bu bizi ucuz tutuyor ama "otomatik" kelimesini sınırlıyor. API ancak LSEG açarsa (bugün FX Post Trade API yalnız NDF Matching).
3. **Destek.** Tek kişilik ekip; onboarding ve destek süresi tek gerçek değişken maliyet. Ürün tasarımında "ilk kullanımda kendi kendine çalışsın" ilkesi bu yüzden kritik (örnek veri, tur, otomatik sütun eşleme).
4. **Vercel Hobby'den çıkış.** İlk ücretli müşteriyle Pro'ya geçmek zorunlu (ticari kullanım yasağı). 20 USD/ay, sorun değil ama tarihini unutmamalı.

Sonuç: Rakiplerin fiyatını altyapı değil ekip, satış ve sertifikasyon belirliyor. Biz aynı işi masa başına 1 USD altı değişken maliyetle veriyoruz; 200-500 USD/masa (Analytics) ve 15-40 USD/koltuk (Desk Signal) fiyatları hem pazarın alıştığı banda oturuyor hem de %95 üstü brüt marj bırakıyor. "Daha ucuz" iddiası doğru; ama alıcıya söylenecek asıl cümle "daha ucuz" değil, "entegrasyon projesi olmadan, veri dışarı çıkmadan, ilk gün çalışır". Sitede fiyat göstermeme kararı (iletişime geçin) bu bandı pazarlıkla test etmeye izin veriyor.

## 7. Siteye ve ürüne yansıması (öneri, onay bekler)

- Trade Analytics'e adlı prop profilleri (FTMO, FundedNext, The5ers, Funding Pips, Topstep, Apex) ve Match-Trader/DXtrade/TradeLocker dökümleri; bugün prop limitleri genel ayar olarak var, firma adıyla yok.
- Desk Signal'a Global Relay/Smarsh biçiminde denetim dışa aktarımı (CSV/XLSX zaten var; alan adlarını onların içe aktarım biçimine yaklaştırmak) ve Teams durum kancası.
- FX Blotter'a "works with exports from" listesi: FXall, 360T, Bloomberg FXGO, bank portal; her biri yalnız gerçek dökümle doğrulandıktan sonra, marka notu ile.
- Fiyat sayfasında rakamsız kalmaya devam; satışta çapalar: Hedgebook 250 USD/ay, PagerDuty 21 USD/koltuk.

Kaynaklar ajan raporlarında satır satır adresle duruyor; bu belge özetidir. Doğrulanmamış üçüncü taraf rakamlar (Vendr, G2, basın) metinde böyle işaretlendi.
