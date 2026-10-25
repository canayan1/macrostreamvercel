# Kalibre Lab metin rehberi (copy style guide)

Hazırlanma: 2026-10-25. Rakip sayfaları bu tarihte okundu. Rakip cümleleri öneri metni olarak kullanılmadı; yalnız kalıp, ton, kelime ve yapı çıkarıldı. Her kaynaktan en fazla bir kısa alıntı var.

## 0. Kaynaklar (okunan sayfalar, 2026-10-25)

| Şirket | URL | Durum |
|---|---|---|
| Myfxbook | https://www.myfxbook.com/ , /help/connect-metatrader-5 | **403, okunamadı.** Bağlantı yöntemleri arama sonuçlarındaki myfxbook.com/help/knowledge-base/metatrader-5-connection-methods ve /verification sayfa özetlerinden alındı (ikincil). |
| FX Blue | https://www.fxblue.com/ , https://www.fxblue.com/live/ | Okundu. /help/mt4-mt5-publisher 404. |
| TradingView | https://www.tradingview.com/ , /pricing/ , /brokers/ | Okundu. |
| Composer | https://www.composer.trade/ , /pricing | Okundu. /security 404. |
| 3Commas | https://3commas.io/ , /security , /pricing | Okundu. |
| StockHero | https://stockhero.ai/ | Okundu. |
| Edgewonk | https://edgewonk.com/ | Okundu. |
| TraderSync | https://tradersync.com/ | **403, okunamadı.** Yalnız üçüncü taraf incelemeleri bulundu; bu rehberde TraderSync'ten alıntı yok. |
| TradeZella | https://www.tradezella.com/ , /pricing | Okundu. |
| Alpaca | https://alpaca.markets/ , /security | Okundu. |
| QuantConnect | https://www.quantconnect.com/ , /pricing/ | Okundu. |
| Darwinex | https://www.darwinex.com/ , /eu | **Yönlendirme döngüsü, okunamadı.** Risk uyarısı https://help.darwinex.com/trade-with-us sayfasından okundu. |
| FTMO | https://ftmo.com/en/ , /trading-objectives/ | Okundu. |

Not: TraderSync ve Myfxbook ana sayfaları okunamadığı için ton analizinde ağırlık verilmedi.

---

## 1. Rakiplerde gözlenen kalıplar

### 1.1 Hero başlığı ve alt başlık

- **Başlık ürünün ne olduğunu söyler, felsefesini değil.** Kategori adı + kime: FX Blue "Analysis, apps, and live charts for forex traders". Alpaca: ürün türü + varlık sınıfları (API for stock, options, crypto). QuantConnect: üç fiil sırayla (araştır, test et, işlem yap) + "your strategies".
- **Alt başlık 1 cümle, 12 ila 25 kelime, iş akışını fiillerle sayar.** Composer: kur, test et, çalıştır, ardından tek kısa ek ("No coding skills required."). Edgewonk: içe aktar, bul, gör. Fiiller ürünün gerçek ekranlarına karşılık gelir.
- **Soyut değer cümlesi yerine somut kapsam.** QuantConnect alt başlıkta "multi-asset", "one platform" gibi ölçülebilir kapsam verir.
- **Hype yapanlar da var ve güven kaybettiren onlar.** StockHero başlıkta kazanma oranı yüzdesi ve ünlem kullanıyor; TradeZella "consistent profitability" vaadi. Kalibre'nin konumu (SPK sınırı, sinyal yok) bu ucu yasaklar. Model alınacak olanlar: Alpaca, QuantConnect, FX Blue, FTMO kural sayfası.

### 1.2 Özellik adları

- **İsim tamlaması, Title Case, 1 ila 3 kelime:** "Parameter Optimization", "Trade Replay", "Currency Strength", "Prop Firm Sync", "Paper Trading". Slogan değil, menüde görünecek ad.
- **Açıklama tek cümle, fiille başlar, ne yaptığını söyler:** FX Blue "Track how strong each currency is in real time." kalıbı (fiil + nesne + koşul). QuantConnect açıklamalarında teknik içerik açıkça yazılıyor (fee, slippage, spread-adjusted).
- Özellik adı ile uygulamadaki menü adı aynı. Sayfada başka, uygulamada başka ad yok.

### 1.3 Bağlantı (broker, MT5, API anahtarı)

- **Yöntemin adı konur ve seçenek olarak sunulur.** Myfxbook üç yöntemi adlandırır (Live Update, Auto Update, EA Publisher); FX Blue iki yolu başlık yapar ("Set up with publisher tool" / "Set up with account sync").
- **Yetki kapsamı tek kelimeyle söylenir: "read-only".** Myfxbook investor password'ü "read-only" diye tanımlar. 3Commas "limited scope of permissions" der. Uzun açıklama yok; terim sektörde zaten biliniyor.
- **Ne olmadığını söyleyen cümle tek, düz ve öznesi şirket:** "3Commas does not have access to your exchange account and cannot withdraw your funds." (3Commas). Kalıp: [Şirket adı] + cannot + [somut eylem].
- **Sayılar:** güncelleme sıklığı (FX Blue: 60 saniyede bir), desteklenen broker sayısı (Edgewonk 200+, TradeZella 500+).
- **UI etiketleri kısa ve standart:** Add Account, Connect, Get API Keys, Sync.

### 1.4 Güvenlik ve gizlilik

- **Somut, doğrulanabilir olgular, öznesi şirket adı veya "we":** Alpaca güvenlik sayfası: sertifika adı ve yılı (ISO 27001:2022, SOC 2 Type 2), altyapı sağlayıcısı (Google Cloud), şifreleme (AES-256 at rest, TLS in transit), 2FA. Alıntı: "Confidential data is encrypted both at rest and in transit" (Alpaca).
- **Yapı:** kısa giriş cümlesi, ardından başlıklı alt bölümler (Compliance, Infrastructure, Data Handling), her biri madde işaretli olgular.
- **Sertifika yoksa başka somut şey söylenir:** 3Commas sertifika yerine mimariyi adlandırır (Sign Center, IP whitelist, 14 borsa tablosu). Edgewonk "independent penetration tests" der.
- **Veri kullanımı tek satırda:** TradeZella ve Edgewonk "satılmaz, modeli eğitmek için kullanılmaz" türü kısa cümleler.
- **Zayıf örnek:** "we are 100% secure" (TradeZella SSS) gibi mutlak iddialar. Kaçın.

### 1.5 Risk uyarısı

- **Yer:** neredeyse herkeste altbilgi (footer). Düzenlenen aracı kurumlar (Darwinex) ayrıca sayfanın en üstünde bant olarak tekrar eder. FTMO "demo hesap, sanal fon" notunu sayfanın sonunda onay düğmesiyle verir.
- **Ton:** pazarlama metninden tamamen ayrı, resmi, edilgen ya da genel özneli, kısa standart cümleler.
- **Standart kalıplar (sektörde ortak, kelimesi kelimesine telif sorunu olmayan kalıplar):**
  - "Past performance is not indicative of future results." (StockHero, Edgewonk, Alpaca'da var)
  - "Trading involves risk / substantial risk and is not appropriate for everyone." (TradeZella türü)
  - "Only risk capital should be used." (TradeZella)
  - "Your capital is at risk." (Composer)
  - ESMA formatı: "CFDs are complex instruments ... X% of retail investor accounts lose money ..." Darwinex: "55% of retail investor accounts lose money when trading CFDs with this provider." Bu yüzde yalnız aracı kurumlara ait; Kalibre aracı kurum olmadığı için kullanmaz.
  - Yazılım sağlayıcı ayrımı: "3Commas provides software only." Kalıp: [Ad] + yazılım sağlar + aracı kurum/danışman değildir.
  - Simülasyon: CFTC 4.41 tipi "hypothetical or simulated performance results have certain limitations" (Kalibre yeni-ana sayfasında bunun bir uyarlaması zaten var).
- **Ana sayfada iddia ile uyarı yan yana durmaz, ama iddia uyarıyı gerektirecek kadar büyük de değildir.** İyi örneklerde (Alpaca, QuantConnect) ana metin performans vaadi içermez, bu yüzden uyarı altbilgide yeterli.

### 1.6 CTA (düğme) etiketleri

- 1 ila 3 kelime, fiil + nesne: Get started, Create Free Account, Start free trial, Open account, Get API Keys, Backtest Your Algorithm, Compare plans, Contact sales, Log in.
- Ücretsizse düğmede veya hemen altında söylenir: TradingView düğme altında "$0, kredi kartı gerekmez" türü not.
- Aynı sayfada en fazla iki birincil eylem: biri "başla", biri "incele/öğren".

### 1.7 Fiyat sayfası

- Başlık kısa, çoğu zaman tek cümle (TradingView: "Free, until you're ready").
- Özellik maddeleri **sayı + birim** ile başlar: "2 charts per tab", "Connect 1 account", "500 AI credits / month". Cümle değil, ifade.
- İptal cümlesi tek ve düz: dönem sonuna kadar kullanırsın, otomatik yenilenmez (TradingView, 3Commas).

### 1.8 Kural metni tonu (FTMO)

- Kurallar büyük harfli tanımlı terimlerle yazılır (Maximum Daily Loss, Maximum Loss, Profit Target, Minimum Trading Days).
- Tanım cümlesi uzun olabilir; ama hemen ardından **"Example"** bölümü gelir: yuvarlak hesap büyüklüğü (100.000 $), adım adım hesap, sonuç kalın.
- Saat dilimi gibi koşullar açıkça yazılır (00:00 CE(S)T). Kalibre prop sayfası bu tona en yakın sayfa; aynı yönde devam edilmeli.

### 1.9 Genel ton özeti

- İkinci tekil şahıs ("you") ana ses; "we" yalnız şirketin yaptığı/yapmadığı eylemlerde.
- Cümleler 6 ila 15 kelime. Başlıklar cümle parçası olabilir ama aforizma değildir; bir şey adlandırır.
- Sayılar ürünün kendisinden: süre, adet, şifreleme standardı, desteklenen platform sayısı.
- Felsefe, anekdot, ahlak dersi yok. Banka masası, ekonomist gibi otorite hikâyeleri hiçbir rakipte yok.

---

## 2. Kalibre metnindeki "yapay zekâ kokan" kalıplar

Dosyalar (hepsi `.../scratchpad/site-wt/` altında): `en/index.html`, `yeni-ana/en/index.html`, `en/security/index.html`, `en/pricing/index.html`, `en/prop/index.html`, `lab/baglan.html`, `index.html`, `yeni-ana/index.html`, `guvenlik/index.html`. Yeni ana sayfa metni `yerel/ana-yeni-uret.py` içinden üretiliyor; düzeltme orada yapılmalı.

### 2.1 Aforizma çiftleri ve "X. Y de." ritmi
- "Your data. Your key." (`en/index.html`), "Verin senin. Anahtar da." (`index.html`), `guvenlik/index.html` başlığı "verin senin, anahtar da".
- "Test your own strategy on your own data. Risk first." / "Kendi stratejini, kendi verinle sına. Risk önce." (`yeni-ana/*`)
- "Risk is asked about before return." / "Getiriden önce risk sorulur." (`en/index.html`, `index.html`)
- Neden kötü: hiçbir rakip başlığı slogan çiftiyle kurmuyor. Bilgi taşımıyor, okuru durdurup "ne demek istedi" diye düşündürüyor.

### 2.2 Üçlü ritim + kapanış hükmü
- "You write the assumption, test it on data, measure the risk. The decision stays yours." / "Varsayımı yazarsın, veriyle sınarsın, riski ölçersin. Karar yine senindir." (`en/index.html`, `index.html`)
- "You make the decisions; we never sell signals." / "Kararı sen verirsin; biz sinyal satmayız." (`yeni-ana/*`)
- Neden kötü: üçlü fiil + kısa hüküm cümlesi, otomatik metin üretiminin en tanınır imzası.

### 2.3 "X değil, Y" karşıtlıkları
- "judged not by what it could earn but by what it could lose on its worst day" (`en/index.html`)
- "Position size comes not from a feeling but from ..." / "bir histen değil, ... hesaplanır" (`en/index.html`, `index.html`)
- "it is for ruling ideas out, not for confirming them" / "fikri elemek için vardır, onaylamak için değil" (ana sayfalar)
- "not lost to a bad strategy but to one bad day" (`en/prop/index.html`)
- "The shield does not turn a bad strategy into a good one; it stops one bad day from closing the account." (`en/prop/index.html`)
- "That shows usage, not content." / "Bu, içeriği değil yalnız kullanım biçimini gösterir." (`en/security`, `guvenlik`)
- Kural: sayfa başına en fazla bir karşıtlık, o da teknik bir ayrım için (ör. brüt/net).

### 2.4 Ahlak dersi ve otorite anekdotu
- "On a bank's treasury desk ... An economist, likewise, looks less at ... Kalibre Lab puts those two questions at the start of every test." (`en/index.html`; TR karşılığı `index.html`)
- "The strongest driver of losses is leverage and position size. Fix risk first ..." (`en/index.html`): kaynaksız genelleme + emir kipi nasihat.
- "Most accounts are lost to one bad day." (`en/index.html`), "Most prop firm challenges are not lost to a bad strategy but to one bad day" (`en/prop/index.html`): kaynaksız istatistik iddiası. Veri doğrulama kuralına (her rakam bağımsız kaynakla) aykırı. Ya kaynak gösterilmeli ya kaldırılmalı.

### 2.5 Kişileştirme ve mecaz
- "Your own broker's candles arrive in the lab." / "mumları laboratuvara düşer" (ana sayfalar)
- "Your data leaves MetaTrader 5 and reaches the lab encrypted." / "Verin MetaTrader 5'ten çıkar, laboratuvara şifreli gelir." ; "MetaTrader 5 verisi bilgisayarından şifreli çıkar" (`yeni-ana/index.html`, `yerel/ana-yeni-uret.py` satır 100). Kurucunun işaret ettiği kalıp tam olarak bu: veriyi özne yapıp hareket fiiliyle anlatmak.
- "The lab exists to make that easier to see." / "Laboratuvar bunu görmeni kolaylaştırmak için vardır." (ana sayfalar)
- "steps in before you notice" (`en/prop/index.html`): hem mecaz hem abartı.
- "rehearsed in the browser" / "prova edilir", "son sınav": tiyatro/okul mecazı. Rakipler "backtest", "quick backtest", "Strategy Tester" der.

### 2.6 Gereksiz açıklama araya sokmaları
- "The server in between, meaning us, cannot read the content." / "Aradaki sunucu, yani biz, içeriği okuyamayız." (`en/security`, `guvenlik`)
- "Nothing is rewritten in between." / "Arada yeniden yazılan bir şey yoktur." (ana sayfalar)
- "The rule you build is also written out as a plain sentence." (iyi bir özellik, ama "also" ile ek fikir gibi sunuluyor)

### 2.7 Soyut başlıklar
- "Worst period first", "Size from a risk budget", "Regimes change" / "Önce en kötü dönem", "Risk bütçesiyle büyüklük", "Rejim değişir" (ana sayfalar). Bunlar özellik adı değil, ilke cümlesi. Rakiplerde başlık = özellik adı.
- "What Kalibre Lab is not" bölümü: dört madde, her biri "It does not ..." ile başlıyor. İçerik doğru, biçim savunmacı. Rakipler bunu tek satırlık "software only" notu + altbilgi ile çözüyor.

### 2.8 Güvence tekrarı
- Aynı ana sayfada "encrypted" / "şifreli" en az 6 kez; "your" / "senin, kendi" sıfatı neredeyse her cümlede ("your own broker", "your own candles", "your own account", "your own computer"). Türkçede "kendi" + iyelik eki çifte vurgu yaratıyor: "kendi aracı kurumunun", "kendi mumlarında".
- "yalnız" Türkçe sayfalarda çok sık (güvenlik sayfasında 10'dan fazla).

### 2.9 Terim tutarsızlığı
- Test adları: quick test / final test / rehearsed; TR: hızlı prova / son sınav / sına / test et / sınama. Tek set seçilmeli.
- "Kalibre Engine" (EN) / "Kalibre Motor" (TR), "Kalibre Bridge" / "Kalibre Köprü". Ürün adları çevrilmez (MetaTrader, Strategy Tester çevrilmiyor). Öneri: her iki dilde "Kalibre Engine" ve "Kalibre Bridge".
- "Panom" (TR) / "Dashboard" (EN): iyelikli modül adı ("benim panom") sitede başlık olarak tuhaf duruyor; menüde "Pano".
- Altbilgide "Kalibre Markets is not a licensed investment firm" (`en/pricing/index.html`) ama ürün adı her yerde Kalibre Lab. Tek tüzel ad kullanılmalı.

### 2.10 Olgu tutarsızlıkları (güveni en çok bozan kısım, metin düzeltmesinden önce çözülmeli)
- Ana sayfa: eklenti "only reads price history and your open positions" (`en/index.html`). Güvenlik sayfası: ayrıca para birimi, bakiye, varlık (equity), aracı kurum adı, sunucu adı, demo/gerçek bilgisini okuyor. Ana sayfa eksik söylüyor.
- "What our server cannot see: Your account number" (ana sayfalar). Ama `en/security/index.html`: lisans kontrolü için MT5 hesap numarası lisans sunucusuna gidiyor. Teknik olarak "röle sunucusu görmez" doğru olabilir ama okur "Kalibre hesap numaramı bilmiyor" anlıyor. Doğru ifade: "Şifreli veri kanalı hesap numaranı taşımaz; lisans kontrolü hesap numaranı ayrıca alır."
- `guvenlik/index.html` (TR) lisans sunucusu cümlesini hiç içermiyor; EN içeriyor. TR eksik.
- "Kalibre Engine ... steps in before you notice" (`en/prop`) ile "The shield is ... not a guarantee" aynı sayfada çelişiyor.

---

## 3. Yeniden yazım kuralları

### 3.1 İngilizce

**Ses**
- Okura "you". Kalibre'nin eylemleri için özne "Kalibre" ya da "we"; ürün parçaları için ürün adı ("Kalibre Bridge reads ...").
- Özne her zaman bir aktör (sen, Kalibre, eklenti, tarayıcı, sunucu). Veri, mum, fiyat özne olup hareket etmez ("data leaves", "candles arrive" yok). Doğrusu: "Kalibre Bridge encrypts the data on your computer before sending it."
- Felsefe, anekdot, nasihat yok. Kalibre okura nasıl risk alacağını söylemez; aracın ne yaptığını söyler.

**Cümle**
- 6 ila 18 kelime. Paragraf en fazla 3 cümle. Hero alt başlığı 1 cümle (en fazla 2).
- Sayfa başına en fazla bir "not X but Y". Hiç aforizma çifti yok. Üçlü fiil listesi ancak gerçek bir iş akışını sayıyorsa (Connect, build, backtest) ve ardından hüküm cümlesi gelmiyorsa.
- Başlık = ne olduğunu söyleyen ad veya fiil öbeği. "Regimes change" değil "Volatility models".
- Noktalı virgül yerine iki cümle. Uzun tire kullanılmaz.

**Güvenlik olgularını yazma**
- Her madde doğrulanabilir bir olgu: algoritma (AES-256-CTR, HMAC-SHA256), boyut (32-byte key), süre (deleted within 2 hours), yer (stored in this browser's local storage), sınır (rate-limited per channel).
- Kalıp: [Aktör] + [somut fiil] + [nesne] + [koşul/sayı]. Örn. "The relay server deletes each packet within 2 hours."
- Olumsuz yetenek cümlesi tek ve düz: "Kalibre Bridge cannot place, modify or close orders."
- Sektörün bilinen terimini kullan: read-only, end-to-end encrypted, never sent to our servers, stored locally.
- Sertifika yoksa yazma, ima da etme. "Bank-grade", "military-grade", "100% secure" yok.
- Sınırlar bölümü kalsın (bu Kalibre'nin rakiplerden iyi olduğu nokta), ama başlık "Limits" ve maddeler olgu.

**Standart risk bloğu (EN, altbilgi, her sayfada aynı)**

> Kalibre Lab is software. Kalibre is not a broker, investment adviser or portfolio manager, does not hold client funds and does not provide investment advice or trading signals. Trading forex and CFDs on margin carries a high level of risk and may not be suitable for all investors. You can lose all of the money you deposit. Past performance, whether actual or simulated, is not indicative of future results. Backtests and simulations are hypothetical and do not reflect actual trading. MetaTrader is a trademark of MetaQuotes Ltd. Kalibre is not affiliated with MetaQuotes.

**Simülasyon notu (sonuç gösteren her bileşenin hemen altında, kısa)**

> Simulated results. Hypothetical performance has inherent limitations and does not represent actual trading. SYNTHETIC data, not a real market.

**Engine / gerçek hesap notu (fiyat ve prop sayfasında)**

> Kalibre Engine places orders only from a rule file you built, on an account you choose, after you start it. Test on a demo account first. You are responsible for all trades.

**CTA sözlüğü (EN)**

| Amaç | Etiket |
|---|---|
| Ana eylem (ücretsiz) | Open the lab |
| Örnek veriyle deneme | Try with sample data |
| Bağlantı | Connect MetaTrader 5 / Connect Alpaca / Connect Tradier |
| Kurulum | View setup guide |
| Fiyat | See pricing / Compare plans |
| Abonelik | Subscribe / Start subscription |
| Bekleme listesi | Join the waitlist |
| Sihirbaz adımları | Continue / Copy / Generate new code / Done |
| Güvenlik | Read the security details |

**Özellik adları (EN, menü ile aynı)**

Dashboard, Strategy Builder, Quick Backtest, Optimization, Volatility Lab, Prop Shield, Kalibre Bridge (MT5 add-on), Kalibre Engine (MT5 Expert Advisor), Pairing code, Rule file.

Not: "rehearse", "final exam", "final test" kullanılmaz. Doğrusu: "Quick Backtest (in your browser, no costs)" ve "MT5 Strategy Tester (your broker's spread and commission)".

### 3.2 Türkçe uyarlama kuralları

- **Hitap:** ürün metninde "sen" kalabilir (Türk fintech uygulamalarında yaygın). Risk bildirimi ve hukuki bloklarda edilgen ya da "siz" kullan; hukuki metinde "sen" gayriciddi okunur. Bu bir öneridir, rakip kaynaklı değil.
- **Özne:** veri "çıkmaz, gelmez, düşmez". "Kalibre Bridge veriyi bilgisayarında şifreler ve gönderir." Edilgen gerekiyorsa açık: "Veri bilgisayarında şifrelenir."
- **"kendi" + iyelik ekini bir cümlede bir kez kullan.** "kendi aracı kurumunun mumları" yerine "aracı kurumunun mumları".
- **"yalnız" yerine** gerektiğinde "sadece"; çoğu yerde hiç gerekmez ("Token bu tarayıcıda saklanır" zaten yeterli, ardından "Kalibre sunucusuna gönderilmez").
- **"da/de" ile biten çift cümle yok** ("Anahtar da.", "Sembol adları da şifrelidir." gibi kapanışlar).
- **Teknik terimler sektördeki haliyle:** backtest (geriye dönük test parantez içinde ilk geçişte), optimizasyon, spread, komisyon, kayma (slippage), lot, drawdown için "en büyük düşüş (max drawdown)" ilk geçişte, investor password için "salt okunur (yatırımcı) şifre".
- **Ürün adları çevrilmez:** Kalibre Bridge, Kalibre Engine, Strategy Tester, Market Watch, Expert Advisors.
- **Menü adları:** Pano, Strateji Kurucu, Hızlı Backtest, Optimizasyon, Oynaklık Laboratuvarı, Prop Kalkanı.
- **Cümle uzunluğu:** Türkçe yüklem sonda olduğu için 15 kelimeyi aşan cümleyi böl.

**Standart risk bloğu (TR, altbilgi)**

> Kalibre Lab bir yazılımdır. Kalibre aracı kurum, yatırım danışmanı ya da portföy yöneticisi değildir; müşteri parası tutmaz, yatırım tavsiyesi veya işlem sinyali vermez. Burada yer alan bilgi ve araçlar yatırım danışmanlığı kapsamında değildir. Kaldıraçlı forex ve CFD işlemleri yüksek risk içerir ve herkes için uygun değildir; yatırılan paranın tamamı kaybedilebilir. Gerçek ya da simülasyon olsun, geçmiş performans gelecekteki sonuçların göstergesi değildir. Backtest ve simülasyon sonuçları varsayımsaldır, gerçek işlemleri yansıtmaz. MetaTrader, MetaQuotes Ltd.'nin markasıdır; Kalibre, MetaQuotes ile bağlantılı değildir.

**Simülasyon notu (TR)**

> Simülasyon sonucu. Varsayımsal performansın doğal sınırları vardır, gerçek işlemleri temsil etmez. Veri SENTETİK, gerçek bir piyasa değildir.

**Engine notu (TR)**

> Kalibre Engine yalnızca sizin kurduğunuz kural dosyasıyla, seçtiğiniz hesapta ve siz başlattıktan sonra emir gönderir. Önce demo hesapta deneyin. Tüm işlemlerin sorumluluğu size aittir.

**CTA sözlüğü (TR)**

| Amaç | Etiket |
|---|---|
| Ana eylem | Laboratuvarı aç |
| Örnek veri | Örnek veriyle dene |
| Bağlantı | MetaTrader 5'i bağla / Alpaca'yı bağla / Tradier'i bağla |
| Kurulum | Kurulum rehberi |
| Fiyat | Fiyatları gör |
| Abonelik | Abone ol |
| Bekleme listesi | Listeye katıl |
| Sihirbaz | Devam / Kopyala / Yeni kod üret / Tamam |

---

## 4. Önce / sonra (en görünür 26 satır)

Kaynak dosya parantez içinde. "Sonra" metinleri yalnız sitede zaten yazan olgulara dayanır.

**1. Ana sayfa hero başlığı** (`en/index.html`, `index.html`)
- EN önce: Test your strategy on your own data before you put money behind it.
- EN sonra: Backtest your MetaTrader 5 strategies on your broker's data.
- TR önce: Stratejine para bağlamadan önce onu kendi verinle sına.
- TR sonra: MetaTrader 5 stratejilerini aracı kurumunun verisiyle test et.

**2. Hero alt başlık** (`en/index.html`, `index.html`)
- EN önce: Kalibre Lab is a strategy lab for MetaTrader 5. Your price history is encrypted on your own computer ... The decision stays yours.
- EN sonra: Build entry and exit rules, backtest them with spread and commission, and run the same rule file in MT5. Price data is end-to-end encrypted.
- TR önce: Kalibre Lab, MetaTrader 5 için bir strateji laboratuvarıdır. ... Karar yine senindir.
- TR sonra: Giriş ve çıkış kurallarını kur, spread ve komisyonla test et, aynı kural dosyasını MT5'te çalıştır. Fiyat verisi uçtan uca şifrelenir.

**3. Yeni ana sayfa hero başlığı** (`yeni-ana/en/index.html`, `yeni-ana/index.html`)
- EN önce: Test your own strategy on your own data. Risk first.
- EN sonra: Strategy backtesting for MetaTrader 5, Alpaca and Tradier accounts.
- TR önce: Kendi stratejini, kendi verinle sına. Risk önce.
- TR sonra: MetaTrader 5, Alpaca ve Tradier hesapları için strateji testi.

**4. Yeni ana sayfa alt başlık** (`yeni-ana/*`)
- EN önce: ... Your data stays with you ... You make the decisions; we never sell signals.
- EN sonra: Connect your account, build a rule and see gross and net results on separate training and test periods. Kalibre does not sell signals.
- TR önce: ... Verin sende kalır ... Kararı sen verirsin; biz sinyal satmayız.
- TR sonra: Hesabını bağla, kuralını kur, brüt ve net sonucu ayrı eğitim ve test dönemlerinde gör. Kalibre sinyal satmaz.

**5. Hero altı not** (`en/index.html`, `index.html`)
- EN önce: For MetaTrader 5. No signals, no custody of funds. Not investment advice.
- EN sonra: Software only. No signals, no client funds held. Not investment advice.
- TR önce: MetaTrader 5 için. Sinyal satmaz, para tutmaz. Yatırım tavsiyesi değildir.
- TR sonra: Yalnızca yazılım. Sinyal yok, müşteri parası tutulmaz. Yatırım tavsiyesi değildir.

**6. "Risk önce" bölüm başlığı + anekdot** (`en/index.html`, `index.html`)
- EN önce: Risk is asked about before return. / On a bank's treasury desk ...
- EN sonra: Risk metrics in every backtest. / Max drawdown, position size from a risk budget and volatility regime are shown next to return in every test.
- TR önce: Getiriden önce risk sorulur. / Bir bankanın hazine masasında ...
- TR sonra: Her testte risk ölçüleri. / En büyük düşüş, risk bütçesine göre pozisyon büyüklüğü ve oynaklık rejimi her testte getirinin yanında gösterilir.

**7. Üç ilke kartı başlıkları** (ana sayfalar)
- EN önce: Worst period first / Size from a risk budget / Regimes change
- EN sonra: Max drawdown / Risk-based position sizing / Volatility regimes
- TR önce: Önce en kötü dönem / Risk bütçesiyle büyüklük / Rejim değişir
- TR sonra: En büyük düşüş / Riske göre lot hesabı / Oynaklık rejimleri

**8. "Kendi hesabın" kartı** (`en/index.html`, `index.html`)
- EN önce: The strongest driver of losses is leverage and position size. Fix risk first ...
- EN sonra: Set a risk per trade, volatility-scaled lot size and a daily loss limit, then backtest the rule with them.
- TR önce: Kaybın en güçlü nedeni kaldıraç ve pozisyon büyüklüğü. Önce riski düzelt ...
- TR sonra: İşlem başına risk, oynaklığa göre lot ve günlük kayıp sınırı belirle, kuralı bunlarla test et.

**9. Prop kartı** (`en/index.html`, `index.html`)
- EN önce: Most accounts are lost to one bad day. The shield watches ...
- EN sonra: Prop Shield checks daily and total loss limits on every tick and sizes lots to the remaining room. Presets for FTMO and The5ers.
- TR önce: Hesapların çoğu tek bir kötü günden kaybedilir. Kalkan ...
- TR sonra: Prop Kalkanı günlük ve toplam kayıp sınırlarını her tikte kontrol eder, lotu kalan paya göre ayarlar. FTMO ve The5ers ön ayarları var.

**10. Kurulum bölüm girişi** (ana sayfalar)
- EN önce: Setup takes three steps. Your data leaves MetaTrader 5 and reaches the lab encrypted.
- EN sonra: Set up in 3 steps. Kalibre Bridge encrypts your data in MT5 before sending it.
- TR önce: Kurulum üç adımdır. Verin MetaTrader 5'ten çıkar, laboratuvara şifreli gelir.
- TR sonra: 3 adımda kurulum. Kalibre Bridge veriyi MT5'te şifreler, sonra gönderir.

**11. Kurulum adım 1** (ana sayfalar)
- EN önce: ... It places no trades; it only reads price history and your open positions.
- EN sonra: Install Kalibre Bridge in MetaTrader 5. The add-on is read-only: it cannot place, change or close orders.
- TR önce: ... Eklenti işlem açmaz; yalnız fiyat geçmişini ve açık pozisyonlarını okur.
- TR sonra: Kalibre Bridge'i MetaTrader 5'e kur. Eklenti salt okunurdur: emir açamaz, değiştiremez, kapatamaz.
- Not: "yalnız fiyat geçmişi ve pozisyonlar" ifadesi güvenlik sayfasıyla çeliştiği için kaldırıldı; okunan alanların tam listesi güvenlik sayfasında.

**12. Kurulum adım 3** (ana sayfalar)
- EN önce: Your own broker's candles arrive in the lab. Build your rule, run the quick test ...
- EN sonra: Your broker's candles load into the lab. Build a rule, run a quick backtest, then confirm it in MT5 Strategy Tester.
- TR önce: Kendi aracı kurumunun mumları laboratuvara düşer. ...
- TR sonra: Aracı kurumunun mumları laboratuvara yüklenir. Kural kur, hızlı backtest yap, sonra MT5 Strategy Tester'da doğrula.

**13. Hızlı test özelliği** (ana sayfalar)
- EN önce: Quick test. ... it is for ruling ideas out, not for confirming them.
- EN sonra: Quick Backtest. Runs a rule on your candles in seconds, in your browser. Costs are excluded, so use it to filter ideas.
- TR önce: Hızlı prova. ... fikri elemek için vardır, onaylamak için değil.
- TR sonra: Hızlı Backtest. Kuralı mumlarında saniyeler içinde, tarayıcında çalıştırır. Maliyet içermez; fikir elemek için kullan.

**14. Kural dosyası girişi** (ana sayfalar)
- EN önce: A strategy is a rule file. ... Nothing is rewritten in between.
- EN sonra: One rule file runs in the lab, in your browser and in MetaTrader 5.
- TR önce: Strateji bir kural dosyasıdır. ... Arada yeniden yazılan bir şey yoktur.
- TR sonra: Aynı kural dosyası laboratuvarda, tarayıcında ve MetaTrader 5'te çalışır.

**15. Güvenlik bölüm başlığı** (`en/index.html`, `index.html`)
- EN önce: Your data. Your key.
- EN sonra: End-to-end encryption
- TR önce: Verin senin. Anahtar da.
- TR sonra: Uçtan uca şifreleme

**16. Güvenlik bölüm metni** (ana sayfalar, `yerel/ana-yeni-uret.py` satır 100)
- EN önce: Your prices leave your computer encrypted and are opened only in your browser.
- EN sonra: Data is encrypted with AES-256 in MT5 and decrypted only in your browser. The key is your pairing code. We do not have a copy.
- TR önce: MetaTrader 5 verisi bilgisayarından şifreli çıkar ve yalnız senin tarayıcında açılır.
- TR sonra: Veri MT5'te AES-256 ile şifrelenir, şifresi yalnızca tarayıcında çözülür. Anahtar eşleştirme kodundur; bizde kopyası yok.

**17. "Sunucumuzun göremediği" maddesi** (ana sayfalar)
- EN önce: Your account number and password
- EN sonra: Your MT5 password (never requested). The data channel does not carry your account number; the licence check does.
- TR önce: Hesap numaran ve şifren
- TR sonra: MT5 şifren (hiç istenmez). Veri kanalı hesap numaranı taşımaz; lisans kontrolü taşır.

**18. Güvenlik sayfası girişi** (`en/security`, `guvenlik`)
- EN önce: ... The server in between, meaning us, cannot read the content. This page explains how that is achieved and where it ends.
- EN sonra: Kalibre Bridge encrypts your price history and positions on your computer. Our relay server stores only encrypted packets and cannot decrypt them. This page lists the methods and the limits.
- TR önce: ... Aradaki sunucu, yani biz, içeriği okuyamayız. Bu sayfa bunun nasıl sağlandığını ve nerede bittiğini anlatır.
- TR sonra: Kalibre Bridge fiyat geçmişini ve pozisyonlarını bilgisayarında şifreler. Röle sunucumuz yalnızca şifreli paketleri saklar, çözemez. Bu sayfa yöntemleri ve sınırları listeler.

**19. Güvenlik "Kısaca" maddeleri** (`en/security`, `guvenlik`)
- EN önce: The add-on encrypts and seals every packet before sending it. A packet whose seal does not match is not opened.
- EN sonra: Every packet is encrypted with AES-256-CTR and signed with HMAC-SHA256. Your browser rejects any packet with an invalid signature.
- TR önce: Eklenti her paketi göndermeden önce şifreler ve mühürler. Mührü tutmayan paket açılmaz.
- TR sonra: Her paket AES-256-CTR ile şifrelenir ve HMAC-SHA256 ile imzalanır. Tarayıcın imzası geçersiz paketi reddeder.

**20. Güvenlik sınırları maddesi** (`en/security`, `guvenlik`)
- EN önce: That traffic exists is not secret. ... That shows usage, not content.
- EN sonra: Traffic metadata is visible. The server sees packet size and timing for each channel.
- TR önce: Trafiğin varlığı gizli değildir. ... Bu, içeriği değil yalnız kullanım biçimini gösterir.
- TR sonra: Trafik üst verisi görünür. Sunucu her kanalın paket boyutunu ve zamanını görür.
- Ek: TR sayfaya EN'deki lisans cümlesinin karşılığı eklenmeli: "Lisans kontrolü için eklenti lisans anahtarını ve MT5 hesap numaranı lisans sunucumuza gönderir. Bu istek şifreli veri kanalından ayrıdır."

**21. Bağlantı sihirbazı MT5 girişi** (`lab/baglan.html`)
- TR önce: MT5 şifren hiçbir yere girilmez; giriş, senin MT5'indeki eklentiyle tarayıcın arasındaki eşleştirme kodudur. Verin şifreli gelir, anahtar yalnız sende.
- TR sonra: MT5 şifren gerekmez. Bağlantı, eklentiye yapıştıracağın bir eşleştirme koduyla kurulur. Kod bu tarayıcıda saklanır.
- EN karşılığı: No MT5 password needed. You connect with a pairing code that you paste into the add-on. The code is stored in this browser.

**22. Sihirbaz adım başlıkları** (`lab/baglan.html`)
- TR önce: 1 Eklentiyi indir ve kur / 2 Kodunu kopyala ve eklentiye yapıştır / 3 MetaTrader 5'te izin ver / 4 Bağlantı bekleniyor
- TR sonra: 1 Kalibre Bridge'i kur / 2 Eşleştirme kodunu yapıştır / 3 WebRequest iznini ver / 4 Bağlantı kontrolü
- EN karşılığı: 1 Install Kalibre Bridge / 2 Paste the pairing code / 3 Allow WebRequest / 4 Check connection
- Düğmeler: "Kurdum, devam" yerine "Devam"; "İzni verdim, OK'e bastım" yerine "Devam". Durum metni: "Henüz MT5'ten kalp atışı gelmedi." yerine "MT5'ten henüz sinyal yok. Eklentinin grafikte çalıştığını kontrol et." (EN: "No heartbeat from MT5 yet. Check that the add-on is running on a chart.") Not: TR'de "sinyal" kelimesi işlem sinyaliyle karışabilir; alternatif "MT5'ten henüz bağlantı yok."

**23. Alpaca / Tradier bağlantı uyarısı** (`lab/baglan.html`)
- TR önce: Anahtarların yalnız bu tarayıcıda saklanır ve yalnız Alpaca'ya gönderilir; Kalibre sunucusuna hiç gelmez. Alpaca kullanıcı adını ya da şifreni hiçbir zaman istemeyiz.
- TR sonra: API anahtarların bu tarayıcıda saklanır ve sadece Alpaca'ya gönderilir. Kalibre sunucularına gönderilmez. Alpaca şifren istenmez.
- EN karşılığı: Your API keys are stored in this browser and sent only to Alpaca. They are never sent to Kalibre servers. We never ask for your Alpaca password.
- İkinci uyarı (önce): "Kalibre yalnız okur, hiçbir emir göndermez." Sonra: "Kalibre bu anahtarla sadece okuma isteği yapar. Denemek için Paper hesap anahtarı kullan." (EN: "Kalibre makes read-only requests with this key. Use a Paper account key to try it.")

**24. Fiyat sayfası girişi** (`en/pricing/index.html`)
- EN önce: The free part of the lab lets you rule ideas out. The subscription is for running a rule you trust on your own MetaTrader 5 account and streaming your data live.
- EN sonra: Backtesting is free. The subscription adds Kalibre Engine, Prop Shield and the live data bridge for MetaTrader 5.
- TR sonra: Backtest ücretsiz. Abonelik; Kalibre Engine, Prop Kalkanı ve MetaTrader 5 canlı veri köprüsünü ekler.

**25. Fiyat kartı maddeleri** (`en/pricing/index.html`)
- EN önce: Up to 2 MT5 accounts / Everything in the free part
- EN sonra (sayı + birim önde): 2 MT5 accounts / Kalibre Engine for live and demo accounts / Prop Shield with FTMO and The5ers presets / Live encrypted data bridge / Everything in Free
- TR sonra: 2 MT5 hesabı / Canlı ve demo hesapta Kalibre Engine / FTMO ve The5ers ön ayarlı Prop Kalkanı / Şifreli canlı veri köprüsü / Ücretsiz plandaki her şey
- İptal cümlesi (EN): Cancel anytime from the Licence page. Access continues until the end of the billing period. (TR: İstediğin zaman Lisans sayfasından iptal et. Erişim dönem sonuna kadar sürer.)

**26. Prop sayfası hero** (`en/prop/index.html`)
- EN önce: Don't fail the challenge on a rule breach. / Most prop firm challenges are not lost to a bad strategy but to one bad day ... steps in before you notice.
- EN sonra: Prop Shield: daily and total loss limits for prop firm challenges. / Kalibre Engine checks your Maximum Daily Loss and Maximum Loss on every tick, blocks new trades near the limit and closes its own positions at the safety margin.
- TR sonra: Prop Kalkanı: prop firması sınavları için günlük ve toplam kayıp sınırları. / Kalibre Engine günlük ve toplam kayıp sınırını her tikte kontrol eder, sınıra yaklaşınca yeni işlem açmaz, güvenlik payında kendi pozisyonlarını kapatır.

**27. Prop deneme sonucu notu** (`en/prop/index.html`)
- EN önce: ... The shield does not turn a bad strategy into a good one; it stops one bad day from closing the account.
- EN sonra: Historical simulation. The shielded account ended the period at a loss and breached no limit. Prop Shield limits losses; it does not improve a strategy.
- TR sonra: Tarihsel simülasyon. Kalkanlı hesap dönemi zararla kapattı, hiçbir sınırı aşmadı. Prop Kalkanı kaybı sınırlar, stratejiyi iyileştirmez.

---

## 5. Kontrol listesi (her yeni metin için)

1. Başlık bir şeyin adı mı, yoksa bir slogan mı? Slogansa değiştir.
2. Cümlenin öznesi bir aktör mü (sen, Kalibre, eklenti, tarayıcı, sunucu)?
3. Sayfada birden fazla "X değil Y" var mı?
4. Her güvenlik maddesi algoritma, süre, yer ya da sayı içeriyor mu?
5. Rakam veya genelleme ("çoğu hesap...") kaynaklı mı? Değilse sil.
6. Aynı olgu başka bir sayfada farklı mı yazılmış (okunan alanlar, hesap numarası)?
7. Özellik adı uygulamadaki menü adıyla aynı mı, iki dilde de?
8. Risk bloğu standart metinle birebir aynı mı?
9. Uzun tire yok.
