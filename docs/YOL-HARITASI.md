# Kalibre Lab yol haritası (24 Ekim 2026)

Durum: ürün, site ve abonelik altyapısı yerelde bitti ve test edildi; canlıda eski site duruyor.
Sıra, bağımlılığa göre. Her aşama bitince bir sonrakine geçilir; canlıya alma her seferinde
açık onayla yapılır.

## 1. Canlıya hazırlık (bu hafta)

Can:
- Stripe test modu: ürün, tek aylık fiyat 399 TRY + para birimi seçenekleri 19 USD / 17 EUR,
  webhook, müşteri portalı → anahtarlar Vercel'e
- Upstash Redis (Vercel Storage)
- Lisans sırrı (`openssl rand -hex 32`) → Vercel + LisansSirri.mqh
- Gizlilik/şartlardaki boşluklar: unvan, adres, Stripe şirketi, depo sağlayıcı
- Avukata gönder: AVUKAT İÇİN / FOR COUNSEL notları

Claude:
- Eklentileri sırla derleyip depoya yükle
- Kurulum sayfaları için temiz MT5 ekran görüntüleri (TR + EN)
- Önizleme adresinde test kartıyla uçtan uca deneme (abonelik → lisans → eklenti indir →
  MT5'te lisans doğrulama → iptal)

Çıkış ölçütü: YAYIN-ONCESI.md'de açık madde kalmaması.

## 2. Canlıya alma (onayla)

- `urun-sitesi` → main, `vercel --prod`
- Stripe canlı moda geçiş, webhook adresi canlı
- İlk 48 saat: lisans ve röle uçlarının günlüklerini izle; MT5'ten gerçek bağlantı
- Arama motorları: yeni site haritası, eski adreslerin 301'leri

## 3. İlk kullanıcılar (canlıdan sonraki 4 hafta)

- 10-20 kişilik kapalı deneme: bekleme listesi + Türkçe prop/forex toplulukları
- Geri bildirim döngüsü: kurulumda takılma noktaları, kalkan ön ayarlarının doğruluğu
- Ölçüm: deneme → abonelik dönüşümü, ilk ay iptali, MT5 bağlantısı kuran oranı
- Fiyat ve mesaj düzeltmeleri bu geri bildirime göre

## 4. Ürün: ikinci dalga

- Kalkan: FundingPips ve FundedNext ön ayarları (firma sayfalarından teyitle), FTMO "en iyi gün"
  tutarlılık kuralı, firma bazında haber penceresi
- Hesap düzeyinde net döviz pozisyonu görünümü (pariteler toplanınca USD/EUR/JPY net riski)
- Makro takvim katmanı: TCMB, Fed, ECB, NFP, TÜFE öncesi uyarı ve isteğe bağlı durdurma
- Laboratuvar: Monte Carlo ve parametre hassasiyeti (aşırı uyum uyarısı)
- Çoklu zaman dilimi ve çoklu sembol kural dosyası

## 5. Kanal ve içerik

- MQL5 Market: köprüsüz ve lisanssız "vitrin" sürümü (yalnız Strategy Tester + kalkan),
  siteye yönlendiren
- Eğitim yazılarının İngilizcesi (önce risk yönetimi ve backtest tuzakları)
- Her ay bir "karar notu": SENTETİK seride bir kuralın maliyet/oynaklık/rejim analizi;
  kimlik vurgusu yok, yöntem vurgusu var
- YouTube/kısa video: kurulum ve kalkanın çalışması (ekran kaydı, hesap bilgisi gizli)

## 6. Dayanıklılık

- MetaQuotes riski: çekirdek mantık (kural dosyası, kalkan, oynaklık) platformdan bağımsız;
  cTrader için keşif
- Lisans sırrının derlenmiş dosyadan çıkarılma riski: asimetrik imzaya geçiş (Ed25519)
- Röle: Upstash bölge seçimi ve yedek; kota ve maliyet izleme
- Yedekleme ve olay planı: lisans kayıtlarının günlük dışa aktarımı

## 7. ABD (araştırma: reports/ABD genişleme araştırması.md, 24.10.2026)

Sıra (Can'ın istediği: önce ABD'ye satış, sonra Robinhood benzeri aracı kurumlar, sonra tahmin piyasaları):
1. İngilizce arayüz (bitti) + CSV içe aktarma + tarayıcıda backtest; performans iddiası yok.
2. Aracı kurum bağlantısı: önce Tradier (tarayıcıdan doğrudan, kişisel anahtar), sonra Alpaca ve
   tastytrade (CORS denemesiyle). Robinhood'un hisse API'si yok; kripto API'si ve Mayıs 2026'daki
   ajan MCP'si izlenir. Schwab/IBKR onay süreçleri uzun.
3. ABD avukatı görüşü gelmeden: MT5 eklentisinin ABD sürümü ve hazır örneklerin ABD'de sunumu yok.
   MT5'in ABD sürümü netting + FIFO desteği ister.
4. Tahmin piyasası analitiği (Kalshi, Polymarket US): veri kullanım izni yazılı alınınca.

Tasarım kuralları (CFTC 4.14(a)(9) ve personel yazıları): araç hesaplar, kullanıcı seçer; "önerilen
ayar" yok; varsayımsal sonuçlarda 4.41 tarzı uyarı; sunucu tarafında emir yok; işlem başı ücret yok.
Satış vergisi: eşik altında başlanır, Stripe Tax ile izlenir; eyalet kaydı için ABD dışı satıcıya
Stripe değil Taxually gibi bir hizmet gerekir.

## Kararlar (verildi)

- Segment: prop sınavı + bireysel forex, iki tanıtım sayfası
- Kurucu kimliği tanıtımda yok
- İki dil baştan; 399 TL / 19 USD / 17 EUR
- Ödeme Stripe (kurucu yurt dışında); MQL5 Market yalnız vitrin
- Hazır stratejiler eğitim örneği; risk parametreleri kullanıcıda (SPK)

## Açık sorular (Can'a)

- Kapalı deneme için kaç kişi, nereden? Deneme süresi ücretsiz mi (ör. 14 gün)?
- Yıllık plan olsun mu (ör. 10 ay fiyatına 12 ay)?
- Türkiye dışı ilk pazar: İngilizce konuşan prop trader'lar mı, Almanya'daki Türkçe
  konuşanlar mı?
