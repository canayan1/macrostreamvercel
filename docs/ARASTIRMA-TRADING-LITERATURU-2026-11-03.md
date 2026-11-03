# Trading literatürü: katma değer nerede üretiliyor (3 Kasım 2026)

Soru (Can): ünlü trading kitapları ve makaleleri ürünlerde neyi geliştirmeye değer gösteriyor, en büyük
katma değer nereden geliyor. Kaynaklar web'de kontrol edildi; rakamlar makalenin kendisinden ya da
yayın özetinden, ikincil kaynaktan geldiyse belirtildi.

## 1. Zemin: çoğu kişi kaybediyor, kenar küçük

- ESMA 2018: AB'de ulusal otoritelerin analizine göre perakende CFD hesaplarının %74-89'u para kaybediyor
  ([ESMA](https://www.esma.europa.eu/node/84933)).
- Chague, De-Losso, Giovannetti, "Day Trading for a Living?" (2019/2020): Brezilya'da 300 günden fazla
  devam eden gün içi trader'ların %97'si kaybetmiş; yalnız %1,1'i asgari ücretten fazla kazanmış
  ([SSRN 3423101](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3423101)).
- Barber, Lee, Liu, Odean, "The Cross-Section of Speculator Skill" (J. Financial Markets 18, 2014):
  Tayvan'da gün içi trader'ların %1'inden azı ücretler sonrası öngörülebilir biçimde kâr ediyor; ama
  beceri dağılımı gerçek: en iyi 500 sonraki yıl da önde ([eScholarship](https://www.escholarship.org/uc/item/7k75v0qx)).

Ürün için anlamı: "daha çok sinyal" vaadi bu zeminde değer üretmez ve hukuken risklidir. Değer,
kaybı küçültmekte, kenarı ölçmekte ve kenar varsa onu bozmamakta.

## 2. Katma değerin geldiği beş yer

### 2.1 Risk ve pozisyon büyüklüğü (en büyük kaldıraç)
- Van Tharp: sonucu sinyalden çok pozisyon büyüklüğü belirler; ölçü birimi R (ilk riske göre sonuç),
  beklenti ve SQN = ortalama R / R'nin standart sapması × √N ([tanım özeti](https://www.luxalgo.com/library/concept/sqn/)).
- Robert Carver, *Systematic Trading* (Harriman House): "toplam riski seçmek sistem tasarımındaki en
  önemli karar"; oynaklık hedefleme ve forecast ölçekleme ([yayıncı](https://harriman.house/?p=7306); alıntı ikincil not).
- Ralph Vince ve Kelly geleneği: aynı işlem dizisi farklı büyüklükle iflas ya da büyüme verir.
- Kalibre'de bugün: prop sınırları, Rule Guard tabanları, "What if you had held". Eksik: kişinin kendi
  işlemlerini farklı büyüklük kurallarıyla yeniden oynatmak.

### 2.2 Davranış sızıntıları (paraya çevrilebilir, ölçülebilir)
- Odean (1998): eğilim etkisi; kazançlar kayıplardan daha hızlı realize ediliyor (PGR %14,8, PLR %9,8;
  aralıkta vergi etkisiyle ters) ([özet](https://en.wikipedia.org/wiki/Disposition_effect), ikincil).
- Locke ve Mann (JFE 2005): profesyonel vadeli işlem trader'ları; daha başarılı olanlarda eğilim etkisi
  daha zayıf, fark "disiplin" (çalışma sürümü) ([RePEc](https://ideas.repec.org/a/eee/jfinec/v76y2005i2p401-444.html)).
- Coval ve Shumway (JF 2005): CBOT piyasa yapıcıları sabah zarar edince öğleden sonra daha çok risk alıyor,
  daha büyük işlem yapıyor ([CFA özeti](https://rpc.cfainstitute.org/research/cfa-digest/2005/11/do-behavioral-biases-affect-prices-digest-summary)).
- Barber ve Odean, "Trading Is Hazardous to Your Wealth" (2000): en çok işlem yapan haneler yıllık %11,4,
  piyasa %17,9; açıklama işlem sıklığı ve maliyet ([Odean sayfası](https://faculty.haas.berkeley.edu/odean/papers/returns/Returns.html)).
- Mark Douglas, *Trading in the Zone*; Brett Steenbarger, *The Daily Trading Coach* (Wiley 2009; günlük
  tutma ve "kalıplarını tanı" dersleri): sorun bilgi değil, bildiğini uygulamak.
- Kalibre'de bugün: "kayıptan sonraki işlem", "arka arkaya kayıp", tutma süresi dilimleri. Eksik: bunları
  para cinsinden tek bir "sızıntı" ölçüsüne çevirip kurala bağlamak.

### 2.3 Çıkışlar (MAE/MFE, stopun işe yarayıp yaramadığı)
- John Sweeney, *Maximum Adverse Excursion* (Wiley 1997): işlem içi en kötü (MAE) ve en iyi (MFE) an;
  stop ve hedefin nereye konacağı ([Wiley](https://gov.wiley.com/WileyCDA/WileyTitle/productCd-0471141526.html)).
- Curtis Faith, *Way of the Turtle*: e-ratio, MFE/MAE oranıyla girişin kenarı ([açıklama](https://strategyquant.com/blog/edge-ratio-in-strategyquant-x/), ikincil).
- Kaminski ve Lo, "When Do Stop-Loss Rules Stop Losses?" (J. Financial Markets 18, 2014): rastgele
  yürüyüşte basit stop beklenen getiriyi düşürür; momentum varken değer katabilir; bazı kurallar oynaklığı
  belirgin azaltır ([RePEc](https://econpapers.repec.org/RePEc:eee:finmar:v:18:y:2014:i:c:p:234-254)).
- Kalibre'de bugün: "What if you had held" kapanış SONRASINI ölçüyor ve fiyat yolu artık elimizde. Eksik:
  işlem İÇİ MAE/MFE ve "stop X R'de olsaydı" simülasyonu.

### 2.4 Kendi model ve stratejilerinde dürüst test
- Bailey, Borwein, López de Prado, Zhu, "The Probability of Backtest Overfitting" (J. Computational
  Finance 2017): ne kadar çok varyant denenirse seçilen en iyinin dışarıda medyanın altında kalma olasılığı
  o kadar yükselir; CSCV ile ölçülür; eşlikçisi Deflated Sharpe Ratio ([SSRN](https://papers.ssrn.com/abstract=2326253)).
- Harvey, Liu, Zhu (RFS 29, 2016): çoklu test yüzünden yeni bir faktör için t > 3,0 eşiği
  ([NBER](https://nber.org/papers/w20592)).
- Hurst, Ooi, Pedersen, "A Century of Evidence on Trend-Following" (JPM 2017): 67 piyasada 1880'den beri
  trend takibi, brüt Sharpe ortalama 0,4, uç yıllarda iyi ([PDF](https://fairmodel.econ.yale.edu/ec439/hurst.pdf)): kenar
  vardır ama küçük ve maliyete duyarlı.
- Kalibre'de bugün: Lab motoru MT5'e karşı işlem işlem doğrulanmış, maliyet ve sağlamlık kontrolleri var.
  Eksik: denenen varyant sayısını sayıp Deflated Sharpe / PBO göstermek; canlı işlemleri backtest
  beklentisiyle karşılaştırmak.

### 2.5 Maliyet ve devir hızı
- Barber ve Odean (2000) ve Barber ve diğerleri (2014): ücretler sonrası tablo bambaşka.
- Carver: bir sistemin maliyeti ham Sharpe'ın en çok üçte biri olmalı (ikincil not).
- Kalibre'de bugün: komisyon ve swap toplamı. Eksik: spread tahmini, maliyetin brüt kâra oranı, devir hızı.

## 3. En büyük katma değer: "ölç → kural → uygula → ölç" döngüsü

Literatürün ortak noktası: kaybettiren şey çoğu zaman bilgi eksikliği değil, uygulama (Douglas,
Steenbarger, Locke ve Mann). Rakip günlük uygulamaları (TradeZella, Tradervue, Edgewonk) ölçüyor ama
uygulatmıyor; Kalibre'nin elinde ikisi de var: Trade Analytics ölçüyor, Rule Guard MT5'te uyguluyor.

Önerilen sıra:
1. **Kişisel kurallar (en yüksek değer).** Analytics sızıntıyı para cinsinden hesaplar ve kural önerir:
   "Günde 2 kayıptan sonra dursaydın +X", "Kayıptan sonraki işlemde lotu artırmasaydın +Y", "Günde N
   işlemden sonra dursaydın +Z". Tek tıkla Rule Guard ayar dosyası (.set) iner; Rule Guard'a yeni girdiler:
   günlük azami işlem, N kayıp sonrası bekleme, kayıp sonrası azami lot. Sonraki rapor kurala uyumu ve
   kazandırdığını gösterir.
2. **R, SQN ve güven aralığı.** Stoplu işlemler için R; "kazanma oranın rastlantıdan ayırt edilebiliyor mu"
   sorusuna örneklem büyüklüğüyle cevap (Douglas'ın "işlem dizisi" düşüncesi).
3. **MAE/MFE ve stop simülasyonu.** Fiyat dosyasıyla işlem içi en kötü/en iyi an, e-ratio, "stop 1R/1,5R/2R
   olsaydı" (Sweeney, Faith, Kaminski ve Lo).
4. **Büyüklük yeniden oynatma.** Aynı işlemler sabit oranlı ya da oynaklığa göre büyüklükle: düşüş, prop
   sınırı, sonuç (Tharp, Vince, Carver).
5. **Lab'da aşırı uyum rozeti.** Denenen varyant sayısı, Deflated Sharpe, PBO; canlı ile backtest farkı
   (Bailey ve López de Prado, Harvey ve diğerleri).
6. **Maliyet paneli.** Komisyon, swap, tahmini spread; brüt kâra oranı; devir hızı.

## 4. Sınırlar
- Bulgular belirli örneklemlerden (ABD aracı kurum haneleri, Tayvan ve Brezilya gün içi trader'ları, CBOT);
  her kullanıcıya genellenemez.
- Bazı rakamlar ikincil özetlerden; yayınlanmış metinle karşılaştırılmadan pazarlama metnine girmez.
- Ürün metni "öneri" değil "senin geçmişin şunu gösteriyor" dilinde kalır; getiri vaadi yok.
