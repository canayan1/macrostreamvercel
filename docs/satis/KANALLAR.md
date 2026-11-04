# Kalibre: görünürlük kanalları ve kayıt listesi (4 Kasım 2026)

Kaynaklar web aramasıyla doğrulandı; ücret ve kurallar değişebilir, kayıt öncesi sayfayı yeniden açın.
"Doğrulanamadı" yazanlar için kaynak bulunamadı.

## A. MT5 trader'ı (Rule Guard, Bridge, HistoryExport)

### 1. MQL5 Market — öncelik 1
- Kayıt: normal MQL5.community hesabı üstüne ayrı "Seller" kaydı. Kimlik belgesi (pasaport/ehliyet, renkli fotoğraf) gerekir. Onay garanti değil; bazı kullanıcılar aylarca beklemiş.
  Şirket olarak kayıt da mümkün (forum: "Register a company as Seller").
- Ücret: asgari ürün fiyatı 30 USD; komisyon %20 (kategoriye göre değişebilir). Ücretsiz ürün koymak mümkün.
- **Kritik kural (Market Rules IV):** üçüncü taraf lisans kontrolü, satış ve güncelleme sistemi yasak, WebRequest ile olanlar dahil. DLL yasak.
  Sonuç: Market sürümünde kendi HMAC lisansımız olamaz (zaten `KALIBRE_MARKET` bayrağı bunun için var) ve **Rule Guard'ın masa bağlantısı (WebRequest → kalibremarkets.com/api/desk) Market derlemesinde kapatılmalı**. Veri çeken WebRequest için resmî bir cevap yok; MetaQuotes'a yazılı sorulmalı.
- Doğrulama: ürün Strategy Tester'da varsayılan girdilerle otomatik koşulur; EA açıklamasına uygun işlem yapmalı. Rule Guard "işlem açmaz" olduğu için Tester'da `InpTesterLots` ile deneme işlemi açması bu yüzden gerekli, açıklamaya da yazılmalı.
- Plan: önce ücretsiz "Kalibre History Export" script'i (profil ve güven), sonra Rule Guard Watch modu ücretsiz, Protect modu ücretli.
- Kaynaklar: https://mql5.com/en/market/rules · https://www.metatrader5.com/en/terminal/help/market/market_sell.md · https://mql5.com/en/about/agencyagreement · https://www.mql5.com/en/forum/481319 · https://www.mql5.com/en/forum/518387

### 2. MQL5 Codebase ve Freelance
- Codebase'e ücretsiz script koymak Market kaydı gerektirmez; profil sayfasından siteye bağlantı verilir.

### 3. Forex Factory
- Üyelerin ürün tanıtımı yasak. Tanıtım için ücretli "Commercial Member" statüsü gerekir; çoklu hesap tespit ediliyor. Ücretsiz yol yok.
- https://www.forexfactory.com/thread/post/6783865

### 4. Forex Peace Army
- Şirket listesi ücretsiz eklenebilir (önce listede olup olmadığına bakılır); "sponsored service listing" ve banner ücretli. EA sağlayıcıları için "Forex Testing Program" var.
- https://www.forexpeacearmy.com/ad · https://www.forexpeacearmy.com/community/threads/how-do-i-get-my-company-listed-in-the-forex-peace-armys-reviews.42577/latest

### 5. Trustpilot
- Profil sahiplenme ücretsiz (alan adı/e-posta doğrulaması). Ücretsiz planda ayda 50 davet.
- https://es.corporate.trustpilot.com/legal/for-businesses/terms-of-use-and-sale-for-businesses

### 6. Topluluklar (ücretsiz, kural: satış değil paylaşım)
- r/Forex, r/Daytrading, r/algotrading; prop firma Discord'ları; Trade2Win, Elite Trader. Kural: "bunu yaptım, deneyin" + kaynak kod/ücretsiz araç.

## B. Perakende trader (Trade Analytics)

### 7. Product Hunt
- Ücretsiz. Tek günlük lansman, çok haftalık hazırlık: hunter, 60 karakter altı tagline, Pazartesi gecesi PST gönderim.
- Yasal sayfalar ve "founder" ifadesi düzeltilmeden yapılmamalı; PH sayfası uzun süre Google'da kalır.
- https://app.getlaunchlist.com/blog/how-to-launch-on-product-hunt-2026

### 8. BetaList
- Ekim 2026 itibarıyla ücretsiz gönderim yok; ücret formda görünüyor, seçilmezse iade. ~20 USD "sırayı atla" seçeneği.
- https://orangebot.ai/blog/betalist-alternatives-2026

### 9. G2 / Capterra / GetApp / Software Advice
- G2: profil ücretsiz; isim ürün adıyla aynı olmalı; LinkedIn ya da şirket e-postasıyla doğrulama; araştırma ekibi 1–3 iş günü. Ücretsiz profilde site bağlantısı düğmesi yokmuş (üçüncü taraf iddiası).
- Capterra/GetApp/Software Advice (Gartner Digital Markets): ücretsiz profil + yorum toplama; tıklama başı ödeme isteğe bağlı (~2 USD/tık, resmî değil). Ekim 2026'da "get listed" düğmesinin G2 formuna gittiği bildirildi; iki ağ birleşmiş olabilir, kayıt sırasında görülür.
- Kategori: Capterra "Treasury Software" (63 ürün, GetApp); Trade Analytics için "Trading Software"/"Investment Management".
- https://sell.g2.com/claim-your-profile · https://documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2 · https://digital-markets.gartner.com/capterra-vendor-signup · https://www.capterra.com/treasury-software/

### 10. AlternativeTo, SourceForge, Slashdot
- Doğrulanamadı (arama sonuç vermedi). Genelde ücretsiz, düşük etki, zararsız.

## C. Kurumsal hazine (FX Blotter, Analytics)

### 11. AFP Treasury & Finance Marketplace (MediaBrains)
- Şirket eklemek ücretsiz; öne çıkarma ücretli. Alıcılar için yorum ve whitepaper var. ABD ağırlıklı.
- Satış: +1 301 961 8861.
- https://www.afponline.org/ideas-inspiration/topics/articles/Details/introducing-the-afp-corporate-treasury-and-finance-marketplace

### 12. ACT (İngiltere)
- Resmî bir tedarikçi dizini bulunamadı; yalnız banner/sponsorluk. Sponsorship & Publications ekibine yazılmalı. Düşük öncelik.
- https://www.treasurers.org/node/358855

### 13. CTMfile / Treasury News Network — CTMdirectory
- Kademeli: ücretsiz dizin kaydı + ücretli seviyeler. Hazine okurları için niş ama ilgili.
- https://ctmfile.com/account/register

### 14. Global Finance "TCM Directory" (yıllık ek)
- Yıllık tedarikçi dizini; reklam satışıyla gidiyor. Düşük öncelik.
- https://gfmag.com/supplement/treasury-a-cash-management-annual-tcm-directory/

### 15. EuroFinance (Barselona, 16–18 Eylül 2026 geçti; 2027 için)
- Sponsor/exhibitor ücretleri yayınlanmıyor, bankalar sponsor. Erken aşama için pahalı; katılımcı olarak gidip görüşme yapmak daha mantıklı. Diğer 2026 etkinlikleri: Miami, Brezilya (Kasım).
- https://www.eurofinance.com/conferences/be-noticed-by-the-people-who-matter/

### 16. Treasury Today, Treasury-Management.com
- Dizin doğrulanamadı; şirket profili sayfaları var (treasury-management.com/companies). İçerik ortaklığı ücretli.

### 17. LinkedIn (ücretsiz, en önemli)
- Şirket sayfası; haftada bir "blotter'dan ne çıkar" gönderisi; unvan araması ("treasury dealer", "head of FX desk").

## D. Dealing masası (Desk Signal)

### 18. Microsoft Teams Store / AppSource
- Partner Center hesabı + publisher verification; paket doğrulama aracı; test notları; mağaza listesi. Temmuz 2026'dan itibaren kanal uygulamaları manifest 1.25+.
- Teknik iş (uygulama gerekir) ama masaların zaten olduğu yerde görünmek demek. Orta vade.
- https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/submission-checklist

### 19. Slack App Directory
- İki aşamalı elle inceleme (ön kontrol ~10 iş günü, sonra işlev ve scope incelemesi). Test kurulumu sağlanmalı; güvenlik incelemesine izin verilir. Mesaj dışa aktaran uygulamalar listelenmez.
- https://api.slack.com/directory/guidelines · https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide

### 20. Finextra, FX Markets / Risk.net
- Finextra'nın vendor dizini yok; şirket profili ve basın bülteni (ücretli PR). FX Markets dizini doğrulanamadı.

## E. Family office

### 21. Simple (andsimple.co) yazılım dizini
- Bağımsız vendor dizini ve yıllık rapor; kategoriler raporlama, muhasebe, portföy, veri, CRM. Bizim ürün doğrudan kategoriye oturmuyor; "risk/analytics" olarak başvurulabilir. Kayıt şartı doğrulanamadı.
- https://andsimple.co/directory/software · https://familyoffice-software.com/vendors (95 vendor, bağımsızlığı belirsiz)

### 22. FOX (Family Office Exchange)
- Teknoloji vendor programı "Technology Resource Partner": 2023 broşüründe Classic 20.000 USD/yıl. Üyelik 20–80 bin USD. "Coming in to hawk your wares doesn't work."
- Erken aşama için kapalı. Önce bir FO referansı gerekir.
- https://archive.familyoffice.com/sites/default/files/ad_company_materials/FOX-Technology-Resource-Partner-Brochure-2023.pdf

### 23. Campden Wealth
- Sponsorluk şartları doğrulanamadı; etkinlik sponsorluğu üzerinden gidiyor, pahalı.

### 24. FINTRX (FO veritabanı, hedef listesi için)
- Fiyat yayınlanmıyor; kullanıcı beyanlarına göre yıllık 10–20 bin USD. Şimdi değil.
- https://prospeo.io/s/fintrx-pricing-reviews-pros-and-cons

## Öncelik ve sıra

| Sıra | Kanal | Ücret | İş | Önkoşul |
|---|---|---|---|---|
| 1 | MQL5 Market seller kaydı | 0 (komisyon %20) | kimlik, bekleme | Market derlemesi: lisans ve desk WebRequest kapalı |
| 2 | G2 + Capterra ailesi profilleri | 0 | 2 saat | yasal sayfalar dolu |
| 3 | AFP Marketplace, CTMdirectory ücretsiz kademe | 0 | 1 saat | — |
| 4 | Trustpilot, Forex Peace Army listesi | 0 | 1 saat | — |
| 5 | LinkedIn şirket sayfası + haftalık gönderi | 0 | sürekli | — |
| 6 | Product Hunt | 0 | 3 hafta hazırlık | yasal + founder ifadeleri düzeltilmiş |
| 7 | Teams/Slack uygulaması (Desk Signal) | 0 | geliştirme | ürün talebi görülünce |
| 8 | FOX / Campden / EuroFinance sponsorluk | 20k+ USD | — | ilk referans müşteri |
