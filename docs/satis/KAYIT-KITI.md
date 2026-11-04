# Kalibre Markets: ücretsiz kanal kayıt kiti

Her kanal için: nereye gidilecek, hangi alana ne yazılacak. Metinler sitedeki gerçek iddialardan yazıldı:
performans rakamı yok, kurucu göndermesi yok, uzun tire yok, "investment advice" yok.
Her kayıt için aynı e-posta ve aynı yazım kullanın: **Kalibre Markets**, site **https://kalibremarkets.com**,
iletişim **markets@kalibrefin.com**.

Sıra önemli: 0 → 1 → diğerleri. Kayıtlar kalıcı sayfalar üretir; yasal sayfalar dolmadan yapılan kayıt,
boş yer tutuculu sözleşmeye bağlantı verir.

---

## 0. Önce (yarım gün)

- [ ] Yasal sayfalardaki yer tutucular dolduruldu ya da sayfalar "draft" uyarısıyla geri çekildi.
- [ ] `FOR COUNSEL` yorumları ve "former bank treasurer / Talk to the founder" ifadeleri kaldırıldı (PR hazır olunca).
- [ ] Görseller klasörü hazırlandı (`kayit/gorsel/`):
  - Logo kare: 512×512 PNG, şeffaf ve koyu zeminli iki sürüm (mevcut `icon-512.png`'den).
  - Logo yatay: 1200×300 PNG.
  - Kapak: 1200×630 (`og-default.png` mevcut), ayrıca 1920×1080.
  - Ekran görüntüleri, her ürün için 3 adet, 1920×1080, örnek dosyayla, tarayıcı çerçevesiz:
    - Trade Analytics: overview, segments, prop limits.
    - FX Blotter: day P&L, positions ladder, seven checks.
    - Desk Signal: board, trader screen, log.
    - Rule Guard: MT5 panel, alert, settings.
  - 60 saniyelik ekran kaydı (sessiz), her ürün için bir tane. G2 ve Capterra video kabul ediyor.
- [ ] Ortak metinler (aşağıda) tek dosyada, kopyala yapıştır.

### Ortak metinler (EN)

**Şirket, 1 cümle (≤120 karakter)**
Analytics software for trading records: MT5 reports, trade logs and FX blotters, read in the browser.

**Şirket, kısa (≤300 karakter)**
Kalibre Markets builds analytics software for trading data. Trade Analytics, FX Blotter and Desk Signal read the files a desk, firm or trader already keeps and explain every result. Files are read in the browser and stay there. Software only: no advice, no client funds, no orders.

**Şirket, uzun (≤1000 karakter)**
Kalibre Markets builds analytics software for trading data, for treasury and dealing desks, brokers, prop firms and traders.

Analytics reads MT5 history reports, Excel or CSV trade logs and FX blotters exported from 360T, Murex, Bloomberg or a hand-kept sheet. Three analyses come ready: Trade Analytics (results by symbol, hour, session and habit, plus prop firm limits day by day), FX Blotter (realized P&L with price and points apart, carry, MTM, positions by value date and seven reconciliation checks on every file) and a backtest. Every total opens the deals behind it. Files are read in the browser and are not uploaded.

Desk Signal sends colour signals from the head of desk to every trader's screen with one key. Urgent signals ring until answered, and every signal is logged to the second.

Rule Guard is a free MetaTrader 5 add-on that watches a prop firm's daily and total loss limits and warns before they are reached. It never opens a trade.

Kalibre Markets is software only. It gives no advice, holds no client funds and places no orders.

**Trade Analytics, tagline (≤60):** Find your edge in your own MT5 report.
**Trade Analytics, kısa:** Drop in an MT5 report or a trading log and see results by symbol, hour, session and habit, plus prop firm limits day by day. Files are read in your browser. No install, no account.

**FX Blotter, tagline:** Your desk's blotter, explained.
**FX Blotter, kısa:** Reads your desk's FX blotter as it is: realized P&L with price and points apart, carry, MTM, positions by value date and seven reconciliation checks on every file. Headers in English, Turkish, German or French.

**Desk Signal, tagline:** One key to the whole desk.
**Desk Signal, kısa:** Colour signals from the head of desk to one trader, a city or everyone, with a record of who saw it and when. Urgent signals ring until answered. Fixed meanings, never orders, no market data.

**Rule Guard, tagline:** Stay inside your prop firm's loss limits on MT5.
**Rule Guard, kısa:** A free MetaTrader 5 add-on that watches your firm's daily and total loss limits every second and warns you before you reach them. FTMO and The5ers presets or your own percentages. It never opens a trade.

**Risk cümlesi (her profilin sonuna):**
Kalibre Markets provides software only and does not give investment advice. Trading carries risk of loss.

**Kategoriler:** Treasury Software · Financial Risk Management · Trading Software · Investment Management · Team Communication (Desk Signal).
**Fiyat alanı:** "Contact vendor" / "Quote based". Ücretsiz deneme: "Free sample, no card". Rule Guard: "Free".
**Dağıtım:** Web (browser), Windows (MT5 add-on). Mobil yok.
**Diller:** English. (Türkçe arayüz kapalı; yazmayın.)
**Kuruluş yılı:** 2026. **Çalışan:** 1-10.

---

## 1. MQL5 Market (en uzun bekleme, bugün başlayın)

1. mql5.com → hesap → Profil → "Seller" sekmesi → kayıt. Kimlik: pasaport ya da ehliyet, renkli fotoğraf; adres belgesi istenebilir. Şahıs ya da şirket seçimi: şirket sonra kurulacaksa şahıs; dönüşümü MQL5 desteğine sorun.
2. Ödeme bilgileri: MQL5 bakiyesi, oradan banka ya da ödeme sistemi.
3. İlk ürün, **ücretsiz** "Kalibre History Export" (Scripts kategorisi):
   - Ad: Kalibre History Export
   - Kısa açıklama: Exports your closed trades and balance operations from MT5 to CSV and Excel, with a row for every deal. Read-only.
   - Açıklama: kullanım adımları, dosya nereye yazılır, hangi sütunlar; "no WebRequest, no DLL, nothing leaves the terminal".
   - Ekran görüntüsü: Navigator'da script, çıkan CSV.
4. İkinci ürün, **Rule Guard** (Utilities kategorisi), yalnız Market derlemesi:
   - `KALIBRE_MARKET` ile derlenir; lisans kontrolü ve masa bağlantısı (InpDeskLink, InpDeskRelay) derlemede dışarıda bırakılır. Market kuralı IV: WebRequest ile lisans/güncelleme yasak, DLL yasak.
   - Tester'da otomatik doğrulama: açıklamada "In the Strategy Tester the add-on opens one small test position (InpTesterLots) so that the protection can be seen. On a live or demo chart it never opens a trade." yazılmalı.
   - Fiyat: Watch modu ücretsiz; Protect ücretli sürüm ayrı ürün (asgari 30 USD, komisyon %20).
5. Yayın sonrası: ürün sayfasından site bağlantısı; forum imzasında ürün bağlantısı.

Kaynak: https://mql5.com/en/market/rules · https://www.metatrader5.com/en/terminal/help/market/market_sell.md

## 2. G2

1. https://sell.g2.com/claim-your-profile → arama: "Kalibre" (önce var mı bakın) → yoksa "Create free profile".
2. Doğrulama: şirket e-postası (markets@kalibrefin.com alan adı siteyle farklı; "kalibremarkets.com" uzantılı bir adres açmanız daha iyi) ya da LinkedIn.
3. Ürün başına bir profil. Önerim üç profil: **Kalibre Analytics** (Trade Analytics ve FX Blotter tek üründe; site de öyle), **Desk Signal**, **Rule Guard**.
4. Alanlar: ürün adı (site ile birebir), kısa açıklama (ortak metin), uzun açıklama, kategori (Analytics → Financial Risk Management ve Treasury Management; Desk Signal → Business Instant Messaging), fiyat "Contact", logo 512, 3 ekran görüntüsü, video.
5. Onay 1-3 iş günü. Ücretsiz profilde site düğmesi olmayabilir; açıklamaya adresi düz metin yazın.
6. Yorum: ilk 10 yorumu pilot ve demo kullanıcılarından isteyin; G2'nin kendi davet bağlantısıyla.

## 3. Capterra, GetApp, Software Advice (tek kayıt, üç site)

1. https://digital-markets.gartner.com/capterra-vendor-signup → "Get listed for free". Ekim 2026'da düğme G2 formuna yönleniyor olabilir; o zaman G2 kaydı yeterli, Capterra'dan "Manage this product listing" ile sahiplenin.
2. Kategori: Treasury Software (Analytics), Financial Risk Management, Trading. Desk Signal: Team Communication.
3. Alanlar G2 ile aynı; ek olarak "Deployment: Cloud/Web", "Support: Email", "Training: Documentation".
4. PPC kampanyasını kapalı bırakın.

## 4. AFP Treasury & Finance Marketplace

1. https://www.afponline.org/ideas-inspiration/topics/articles/Details/introducing-the-afp-corporate-treasury-and-finance-marketplace → "Add your company" (MediaBrains formu).
2. Kategori: Treasury Management Systems / Risk Management / FX. Ürün: Kalibre Analytics, FX Blotter metniyle.
3. Ücretsiz; öne çıkarma teklifleri gelecek, reddedin.

## 5. CTMdirectory (CTMfile / Treasury News Network)

1. https://ctmfile.com/account/register → vendor hesabı → ücretsiz dizin kaydı.
2. Kısa şirket metni ve FX Blotter kısa metni.

## 6. Trustpilot

1. https://business.trustpilot.com → "Claim your free profile" → kalibremarkets.com → alan adı/e-posta doğrulaması.
2. Profil: logo, kısa şirket metni, kategori "Software company".
3. Davetleri (ayda 50) yalnız gerçek kullanıcıya gönderin; erken yorum satın alma ya da karşılık yok.

## 7. Forex Peace Army

1. https://www.forexpeacearmy.com → Reviews → arama "Kalibre" → yoksa "Submit a company" formu. Kategori: Forex Software / EA.
2. Metin: Rule Guard kısa + "free, read-only, never opens a trade".
3. Ücretli listeleme ve banner tekliflerini reddedin.

## 8. LinkedIn

1. Şirket sayfası: ad Kalibre Markets, sektör "Financial Software", büyüklük 1-10, konum (yasal adres neredeyse), kapak 1128×191, logo 300×300.
2. "About": uzun şirket metni. Ürün sekmesine 3 ürün.
3. Haftalık bir gönderi; ilk 4 konu: (a) blotter'da price ve points'i ayırmak neden önemli, (b) prop limitine en yakın gün nasıl okunur, (c) seven checks: hangi hata nerede çıkar, (d) masa sinyalinde "seen" ile "done" farkı. Hepsi sentetik örnek dosyayla.
4. Kişisel profilinizden paylaşabilirsiniz; metinde kurucu kimliği geçmez.

## 9. Product Hunt (0 ve 2 bitince)

1. Ürün: Kalibre Analytics. Tagline ≤60: "Explain any trading record, in the browser". İlk yorum: ne okur, ne okumaz, ne göndermez.
2. Hazırlık: 3 ekran görüntüsü + 60 sn video + 10 destekçi listesi; Pazartesi 00:01 PST gönderim.
3. Launch günü site ana sayfasında PH rozeti; "Request a demo" yerine "Open the sample" düğmesi öne.

## 10. Diğer ücretsiz dizinler (10 dakika, düşük etki)

AlternativeTo, SourceForge, Slashdot, SaaSHub: ortak kısa metin, logo, kategori "Finance". Her birinde aynı ad ve adres.

---

## Takip tablosu

| Kanal | Hesap e-postası | Kayıt tarihi | Onay | Profil adresi | Not |
|---|---|---|---|---|---|
| MQL5 Market | | | | | |
| G2 | | | | | |
| Capterra ailesi | | | | | |
| AFP Marketplace | | | | | |
| CTMdirectory | | | | | |
| Trustpilot | | | | | |
| Forex Peace Army | | | | | |
| LinkedIn | | | | | |
| Product Hunt | | | | | |

Bu tabloyu `docs/satis/` altındaki Apps Script tablosuna da ekleyin; demo formundaki "nereden geldiniz" alanına bu kanal adları seçenek olarak girilsin.
