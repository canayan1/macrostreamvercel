# Kalibre Markets: Verisiz Yeniden Tasarım Planı

> **Tarih:** 2026-10-20
> **Durum:** Plan ve ana sayfa taslağı. Canlı koda dokunulmadı.
> **Taslak:** `taslak/index.html` (tarayıcıda doğrudan açılır, dış veri çekmez)

---

## 0. Kural

Sitede **hiçbir dış piyasa ya da makro veri** olmayacak. API ile çekilen, elle kopyalanan
ya da bir veriden türetilen sayısal değer de buna dahil. Resmi kaynaklar da (EVDS, TÜİK,
FRED) ticari dağıtım lisansı olmadığı için kapsam dışı.

Sitede yalnız üç tür sayı bulunur:

1. **Kullanıcının girdiği sayı:** hesaplayıcılar, defter, portföy.
2. **Sentetik sayı:** tohumlanmış (seed) piyasa üreticisi. Her ekranda "sentetik" etiketi taşır.
3. **Sabit örnek sayı:** eğitim metnindeki "faiz %40, kur 35 olsun" gibi açıkça uydurma örnekler.

## 1. Acil: repoda hâlâ duran veri

`main` dalı her push'ta otomatik deploy oluyor ve şunlar hâlâ içinde:

| Dosya / uç | Ne | Yapılacak |
|---|---|---|
| `terminal/data/markets.json` (34 KB) | Kur, altın, endeks snapshot'ı | Sil |
| `terminal/data/portfoy-lab.json` (850 KB) | Tarihsel fiyat serileri (backtest) | Sil, sentetik üreticiyle değiştir |
| `terminal/data/kripto-ozet.json`, `changes.json` | Özet / değişim verisi | Sil |
| `terminal/latest.json`, `terminal/akis/` | Terminal akışı | Sil |
| `api/quotes.ts` | Stooq kotasyon proxy'si | Sil |
| `api/poll-aa-news.ts`, `api/watchlist-news.ts`, `api/canli/*` | Haber/akış uçları (askıda) | Sil |
| `reports/`, `arsiv.html`, `rss.xml` | Günlük bülten arşivi | Kaldır, 410 ya da yönlendirme |
| `publish_daily.py` (Mac'te, repoda değil) | Günlük otomatik yayın | **Zamanlayıcının kapalı olduğunu doğrula** |

Siteden kaldırdıysanız bile dosyalar repoda kaldıkça bir sonraki deploy'da yeniden yayına
çıkar. Repo public ise git geçmişinde de görünürler. Gerekirse geçmiş temizliği ayrıca
konuşulur.

## 2. Konumlandırma

**Eski:** "Türkçe makro & teknik analiz bülteni / terminal". Değeri veriydi.
**Yeni:** **"Karar laboratuvarı."** Değer veri değil, karar verme becerisi.

> Piyasayı izlemek için yüz yer var. Piyasada nasıl karar verdiğini görmek için bir yer.

Bu kayıp değil, farklılaşma. Veri her yerde bedava görünüyor ama lisanslı. Beceri, yöntem
ve öz-farkındalık ise sizin.

## 3. Bilgi mimarisi

Dört ana kapı. Her biri tek fiil:

| Kapı | Fiil | Sayfalar |
|---|---|---|
| **Öğren** | Kavramı anla | `/egitim/*` (23 makale), `/metodoloji`, `/arastirma` (sadece evergreen çerçeveler) |
| **Hesapla** | Kendi sayınla dene | `/carry-hesaplayici`, `/kur-riski-hesaplayici`, **yeni:** pozisyon büyüklüğü, risk/ödül, reel getiri |
| **Pratik yap** | Sentetik piyasada dene | `/simulasyon`, `/oyun`, `/portfoy-lab` (sentetik rejimler), `/grafik-oku` (sentetik grafik) |
| **Kendini tanı** | Kararını kaydet, ölç | `/defter`, `/islem-kontrolu`, `/portfoyum` (elle giriş), **yeni:** önyargı testi |

Yan kapılar: `/kurumsal` (ekip eğitimi ve simülasyon, B2B satılacak ürün budur), `/pro`, `/tradermind`.

### Kaldırılacak / yönlendirilecek

| Sayfa | Karar | Hedef (301) |
|---|---|---|
| `/terminal` | Kaldır | `/` |
| `/canli` | Kaldır | `/` |
| `/makro-raporu`, `/banka-raporu` | Kaldır | `/egitim/makro-gostergeler-rehberi`, `/egitim/nim-bankacilik` |
| `/haftanin-grafikleri`, `/haftanin-haberleri`, `/editor` | Kaldır | `/egitim` |
| `/kripto` | Kaldır ya da davranış koçu olarak verisiz yeniden yaz | `/defter` |
| `/trading` | İçeriği "Kendini tanı"ya böl | `/islem-kontrolu` |
| `/ekonomi-takvimi` | **Karar sizde:** sadece tarih listesi (veri değil) olarak kalabilir | — |
| `/talep` | Kişiye özel analiz veri gerektirir, kaldır | `/kurumsal` |

## 4. Sayfa bazında dönüşüm

**Hesaplayıcılar** (`carry`, `kur-riski`): `markets.json` fetch'i kalkar. Alanlar boş
gelir, yanında "Örnek değerlerle doldur" düğmesi olur. Örnek değerler açıkça uydurma ve
yuvarlak sayılar.

**Portföy Lab:** 850 KB'lık tarihsel seri yerine tarayıcıda çalışan **sentetik rejim
üreticisi** gelir. Rejimler: Boğa, Ayı, Yatay, Kriz şoku, Yüksek enflasyon. Varlık
sınıfları gerçek ticker değil, arketip: "Hisse sepeti", "Altın benzeri", "Döviz", "TL
mevduat", "Uzun tahvil". Mesaj değişir: "3 yıllık backtest" değil, "Bu stratejiyi 1000
farklı olası piyasada dene." Bu, tek bir geçmişe uyan backtest'ten daha dürüst ve
`backtest-tuzaklari` makalesiyle doğrudan bağlanır.

**Defter / Portföyüm / Panom:** Fiyatı kullanıcı kendi girer. "Güncel fiyat" sütunu
kalkar. Yerine "son girdiğin fiyat" ve tarihi gelir. Veri `localStorage` + hesap.

**Grafik Oku:** Gerçek grafik yerine sentetik grafik. Quiz mantığı aynen kalır.

**Eğitim makaleleri:** Tarama gerekiyor. Gerçek fiyat grafiği, tablo ya da KAP'tan alınmış
rakam içerenler sentetik/örnek sayılarla yeniden yazılır. TODO'daki
`temel-analiz-bilanco-okuma` (ASELS, BIMAS, AKBNK örnekleri) **kurgusal şirketle**
yazılmalı.

**Araştırma:** Sadece veri içermeyen çerçeve yazıları kalır. Tarihli piyasa yorumları
arşivden kaldırılır.

## 5. Ortak sentetik piyasa motoru

Tek dosya: `static/sentetik.js`. Bütün pratik sayfaları bunu kullanır.

- Tohumlanmış rastgele sayı üreteci. Aynı tohum aynı piyasayı verir, paylaşılabilir: `?tohum=4821`.
- Rejim değiştiren GBM ve sıçrama (jump) bileşeni. Volatilite kümelenmesi için basit GARCH.
- Çıktı: OHLC mumları ve varlık arketipleri arası korelasyon matrisi.
- Her grafiğin köşesinde "SENTETİK · tohum 4821" rozeti.

Bu motor aynı zamanda ürünün kendisi: indikatör kütüphanesinde RSI, MACD ve Bollinger
sentetik seri üzerinde canlı gösterilir. Kullanıcı rejimi değiştirip indikatörün nerede
yanıldığını görür.

## 6. Tasarım dili

Mevcut kimlik korunuyor: koyu zemin, amber vurgu (`#ffa630`), Inter Tight ve Geist Mono.
Değişen kısım ton:

- Terminal hissi (ticker şeridi, yanıp sönen fiyatlar, F1–F6) kalkıyor. Veri yokken
  terminal estetiği boş vaat gibi durur.
- Yerine "laboratuvar defteri" tonu geliyor: daha geniş boşluk, net başlıklar, her kartta
  tek fiil.
- Ana sayfanın kahramanı sentetik piyasa demosu. Sayfa açılınca canlı akan bir grafik var
  ama veri değil. "Bu piyasa gerçek değil. Kararların gerçek." mesajı.

## 7. Uygulama sırası

1. **Temizlik (1 PR):** Bölüm 1'deki dosyaları sil, `vercel.json`'a 301'leri ekle, sitemap'i güncelle.
2. **Sentetik motor + Portföy Lab (1 PR).**
3. **Hesaplayıcılar ve Defter/Portföyüm'ü verisizleştirme (1 PR).**
4. **Yeni ana sayfa ve navigasyon (1 PR):** taslak onaylanınca.
5. **Eğitim taraması (1–2 PR):** makale makale veri ayıklama.
6. **Yeni araçlar:** pozisyon büyüklüğü, önyargı testi, indikatör laboratuvarı.

## 8. Açık sorular

- `ekonomi-takvimi` tarih listesi olarak kalsın mı?
- `kripto` davranış koçu verisiz bir ürün olarak yaşar mı, yoksa kaldırılsın mı?
- Repo public mi? Değilse geçmiş temizliği gerekmeyebilir.
- AdSense devam edecek mi? (`ads.txt` var.) Verisiz eğitim sitesi için uygun, ama sayfa yapısını etkiler.
