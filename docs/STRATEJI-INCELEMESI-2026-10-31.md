# Kalibre Markets: ürün portföyü incelemesi (31 Ekim 2026)

Can'ın sorusu: ürün sayısı fazla; en çok üçe inmeli. Hangisi en net para kazandırır ve ilk günden
değer yaratır? Birleştirilebilirler mi? Web uygulaması mı, indirilebilir Mac/Windows uygulaması mı?
Start-up fintech kafasıyla analiz.

Talep testi sayıları (/api/talep: görüntüleme, fiyat tıklaması, form) bu incelemede YOK; betik
gizli anahtar istediği için Claude okumadı. Can `docs/TALEP-TESTI.md` bölüm 2'deki komutla alır.
Kararlar o rakamlarla birlikte verilmeli.

## 1. Elimizdeki envanter (dürüst sayım)

| Yüzey | Durum | Kime | Değer anı | Satın alma yolu |
|---|---|---|---|---|
| Trade Analytics | Canlı, çalışıyor, ücretsiz | MT5 bireysel ve prop trader | Dosya bırak, 10 sn | Self-servis, Stripe, 12-19 USD/ay |
| FX Blotter Analytics | Canlı, çalışıyor, ücretsiz | Banka ve kurumsal hazine FX masası | Dosya bırak, 10 sn | B2B pilot, teklif, fatura (şirket gerekir) |
| Rule Guard | "In testing"; EA derlenmedi, kimse kullanmadı | Prop sınav trader'ı | Kurulum + ilk ihlal anı (günler) | Self-servis; Stripe ve EA yasağı riski |
| Kalibre Lab | Canlı, ücretsiz, en ağır mühendislik | Kural kuran trader | Saatler sonra (strateji yazılınca) | Sektör kalıbı: backtest bedava |
| Desk Signal | Canlı masa bugün çıktı, ücretsiz | Masa şefi | Davet bağlantısı, 1 dk | B2B, koltuk başı |
| Kalibre Bridge | Beta altyapı | Analytics ve Lab için | Yok (araç) | Satılmaz |
| Kalibre Engine | Yalnız kurucunun demo hesabı | Algo trader | Haftalar | Hukuki ve itibar riski en yüksek |
| Davranışsal finans | Fikir | MT5 trader | Yok | Yok |
| Eski Türkçe içerik (eğitim, oyun, grafik-oku, hesaplayıcılar, takvim, defter) | Eski adreslerde duruyor, menüde yok | TR bireysel | Yok | Yok |

Beş pazarlanan ürün, üç segment (bireysel MT5, prop, kurumsal masa), iki dil, beş sunum, beş
film planı. Tek kurucu. Bakım yükü ve mesaj dağınıklığı gerçek: ana sayfa "FX, solved" diyor,
menüde dört ürün, demolarda beş.

Bir de kural ihlali var: 26.10'da "talep görülmeden yeni ürün geliştirilmez" dendi; sonra FX
Blotter ve Desk Signal talep kanıtı olmadan yapıldı. İkisi de iyi ürünler ama bu, kuralı değil
istisnayı büyüttü. Bundan sonra kural geçerli olmalı.

## 2. Her ürünü üç soruyla tartmak

Soru A: Alıcı kim, parayı kim onaylar, ne kadar öder?
Soru B: İlk günden değer var mı (kurulumsuz, veri bağlamadan)?
Soru C: Tek kurucunun satabileceği bir kanal var mı?

### FX Blotter Analytics
- A: Alıcı masa şefi ya da hazine müdürü; bütçe var; yıllık binlerce USD normal. Rakipleri
  (Kyriba, FIS, Reval, Bloomberg) büyük ve pahalı; küçük ve orta bankalar, gelişen pazar
  hazineleri Excel'de. Tam boşluk burası.
- B: Evet. Blotter bırak, FIFO/ortalama K/Z, pozisyon, limit, mutabakat 7/7. Tarayıcıda
  kalması bankanın "veri dışarı çıkmaz" şartını baştan karşılıyor; bu rakiplerin çoğunun
  yapamadığı şey.
- C: Evet, en güçlü kanal: Can'ın hazine ağı. Bu ürünü Can'dan iyi kimse anlatamaz.
- Sakınca: satış döngüsü uzun (3-9 ay), tüzel kişilik şart, güvenlik anketi (CAIQ/SIG) ister,
  ilk gelir aylar sonra.

### Trade Analytics
- A: Alıcı bireysel trader, kendi kartıyla, 12-19 USD/ay. Rakip TradesViz (17,99 EUR), TradeZella
  (35-99 USD), ücretsiz Myfxbook/FX Blue. Fiyat baskısı yüksek, kayıp oranı yüksek müşteri
  (ESMA %74-89), churn yüksek.
- B: Evet. Dosya bırak, sızıntı gör. Hesapsız ve yerel olması tanınmış rakiplerde yok.
- C: Zor ve emek ister: forum, Reddit, YouTube, MQL5. Tek kişiyle yavaş büyür.
- Sakınca: düşük ACV, dağıtım maliyeti; ilk 1.000 USD/ay için 60-80 abone gerekir.

### Rule Guard
- A: Prop trader. Kağıt üstünde en iyi değer önerisi: 500 USD'lik sınavı korumak için 99 USD/yıl.
- B: Hayır. EA kurulumu, WebRequest izni, lisans; değer ilk ihlal anında.
- C: Kanal prop toplulukları; mümkün.
- Sakınca üçlü: (1) Stripe "funded prop trading" işini yasaklıyor, araç yazılımı için yazılı
  onay alınmadı; (2) bazı firmalar EA'yı yasaklıyor; (3) 2024'te MetaQuotes'un prop firmalarına
  baskısıyla ABD müşterili firmalar MT5'ten cTrader/DXtrade/Match-Trader'a kaydı (kullanılmadan
  önce kaynakla doğrulanmalı). Üstelik EA derlenmedi; ürün bugün yok.

### Kalibre Lab
- A: Alıcı yok. Sektör kalıbı backtest bedava (TradingView, MT5 Strategy Tester bedava).
  Para otomasyon ve alarmdan gelir; o da Engine'i gerçek hesapta çalıştırmak demek (en riskli iş).
- B: Hayır; değer strateji yazıldıktan saatler sonra.
- C: TradingView 100M kullanıcıya karşı tek kurucu.
- Asıl değeri: doğrulanmış motor (97 MT5 koşusu, Python referansı, 0 fark). Bu bir ürün değil,
  güven varlığı ve ileride B2B lisanslanabilir çekirdek.

### Desk Signal
- A: Masa şefi, koltuk başı 5-15 USD/ay; 10 kişilik masa 100-150 USD/ay. Tek başına küçük.
- B: Evet, davet bağlantısıyla 1 dakikada.
- C: FX Blotter ile aynı alıcı, aynı görüşme.
- Sakınca: tek başına "vitamin" olma riski (Symphony, Teams, turret zaten var). Blotter'ın
  yanında ise "limit yaklaşınca şefin tuşu" olur ve ağrı kesiciye dönüşür.

## 3. Karar önerisi: iki ürün, bir motor

### Ürün 1 (işin kendisi): Kalibre Desk
FX Blotter Analytics + Desk Signal tek üründe. Alıcı aynı kişi, görüşme aynı, fiyat tek.
- Blotter: K/Z, pozisyon, limitler, mutabakat, masa raporu (bugün var).
- Signal: şefin tek tuşu; limit yakınlığı sinyale bağlanır (NOP %90'a gelince amber otomatik
  önerilir, şef tek tuşla gönderir). Kayıt (audit log) ikisini birleştirir.
- Fiyat: masa başına yıllık; başlangıç için 3.000-6.000 USD/yıl/masa pilot sonrası, pilot
  ücretsiz 60 gün anonim veriyle. Rakam Can'ın ağındaki ilk 3 görüşmeyle kalibre edilir.
- Hedef: 90 günde 3 pilot (biri Türkiye dışı), 180 günde ilk ücretli masa.
- Şart: tüzel kişilik. Bu artık ertelenemez; bankaya fatura ve NDA şahısla olmaz.

### Ürün 2 (self-servis ve huni): Trade Analytics
MT5 trader'ı için tek uygulama; Rule Guard ve davranışsal analiz ayrı ürün değil, bunun
içinde sekme.
- Ücretsiz: özet, kırılımlar, örnek.
- Ücretli 12-15 USD/ay: kayıtlı görünümler, prop sınırları, haftalık rapor, "ne olurdu"
  (Lab'in backtest motoru burada "kendi işlemlerinde ne olurdu" olarak yaşar).
- Rule Guard: yalnız talep testi sinyal verirse VE Stripe yazılı onayı VE firmaların EA
  tutumu yazılı alınırsa, bu ürünün "Guard" sekmesi olarak gelir. O güne kadar sayfası kalkar
  ya da "planlanıyor" olur; "In testing" yazmak yanıltıcı, çünkü test edilen bir şey yok.
- Görevi: nakit akışı, marka, ve Desk için güven ("aynı motor 44.015 MT5 işleminde doğrulandı").

### Motor (ürün değil): Kalibre Engine / Lab çekirdeği
- Lab menüden çıkar; "Methodology" sayfasının altında ücretsiz araç olarak kalır.
- Engine gerçek hesapta satılmaz. Çekirdek, Desk ve Analytics'in hesap motoru; ileride broker
  ya da prop firmasına gömülü lisans (B2B) konuşulabilir, bugün değil.
- Oynaklık laboratuvarı, optimizasyon yenilikleri, Alpaca/Tradier, kripto, hazır botlar: dondurulmuş
  kalır (26.10 kararı).

Üç ürün isteniyorsa üçüncüsü Rule Guard değil, "Kalibre Core (B2B motor lisansı)" olur; ama
bugün satılacak hâlde değil, o yüzden pazarlanmaz.

### Ne kaldırılır (site)
- Menü: Products = Kalibre Desk, Trade Analytics. Solutions = Dealing desks, MT5 traders.
- /kalibre-lab ürün sayfası → /methodology altına "Try the engine".
- /rule-guard → kaldır ya da "planned", fiyat testi sayfası olarak kalabilir (talep ölçümü için).
- /desk-signal → /desk (Kalibre Desk) içinde bölüm.
- Eski Türkçe içerik: TURKISH_PUBLIC=False zaten; eski adresler 410 ya da /tr'ye yönlendirme.
- Sunumlar ve filmler: iki ürüne iner (Desk, Trade Analytics). Beş film yerine iki.

## 4. Web uygulaması mı, indirilebilir uygulama mı?

Karar: web, tek platform, yerel-öncelikli (bugünkü mimari). İndirilebilir uygulama yalnız
işletim sistemi gerektiren iki parça için ince bir kabuk; ürün olarak değil.

Gerekçeler:
- Bankada kurulum yasak, tarayıcı serbest. Desk'in alıcısı kilitli PC'de çalışır; "indir ve kur"
  IT onayı demek, pilot aylarca gecikir. Tarayıcıda yerel işleme ("dosya dışarı çıkmaz") hem
  demo hem güvenlik anketi için en iyi cevap.
- Demo anında: bağlantı gönder, 10 saniyede değer. Sunum ve filmler buna dayanıyor.
- Tek kurucu için dağıtım maliyeti: imzalama, notarization, güncelleme kanalı, Windows SmartScreen
  itibarı, iki platform destek. Hepsi ürün dışı iş.
- Gelir modeli: Stripe abonelik ve B2B fatura web'de doğal; masaüstü lisans anahtarı ayrı bir
  altyapı ister.

Masaüstü gereken yerler:
- Desk Signal topu: Chrome/Edge'de Document Picture-in-Picture bugün çalışıyor (her pencerenin
  üstünde küçük top). Tauri kabuğu yalnız global kısayol (⌃⌥) ve otomatik başlatma için, 2. aşama.
- MT5 tarafı: zaten EA (Bridge/Guard). Tarayıcı MT5 klasörünü okuyamıyor (21.10 bulgusu); bu
  masaüstü uygulama yapmakla da değişmez, EA kalır.

Yani: tek web platformu + MT5 EA + ileride ince Tauri topu. "Mac/Windows app" diye bir ürün yok.

## 5. Start-up gerçekleri (söylenmesi gerekenler)

1. Tüzel kişilik kritik yolda. Desk-öncelikli yolda ilk görüşmeden önce şirket lazım.
   Stripe hesabı kişisel; B2B faturası, NDA ve güvenlik anketi şirket ister.
2. Vercel Hobby planı ticari kullanımı yasaklıyor (Vercel şartları). Para alınmaya başlanınca
   Pro'ya geçilmeli (20 USD/ay). Ücretsiz Supabase/Upstash kotaları pilotla yeter.
3. Talep kanıtı yok. Elde çalışan ürün çok, ödeyen sıfır. Önümüzdeki 30 günün işi kod değil,
   görüşme: Desk için 10 hazine görüşmesi, Analytics için 10 trader görüşmesi (talep testi
   kanalları hazır: ff, mql5, rd-*, dc-*).
4. Kaynak: tek kurucu + Claude. Her ek yüzey (dil, sunum, film, sayfa) bakım demek. Dondurma
   listesi açıkça tutulmalı.
5. Hukuk: Rule Guard'ın üç riski kapanmadan satılmaz. Engine gerçek hesapta hiç satılmaz.
   Desk ve Analytics "yazılım, tavsiye değil" sınırında kalıyor; mevcut uyarı metinleri yeter.
6. Rakamlar: pazar büyüklüğü iddiaları (prop 0,85-4,5 mlr USD, FTMO 4,5M müşteri, MT5 %58,3 CFD
   hacmi) sunumlardaki kaynaklı satırlardır; FX masası sayısı için kaynaklı rakam yok, uydurulmaz.

## 6. 90 günlük plan (öneri)

Hafta 1-2
- Can: şirket süreci başlat; talep özetini al (`node yerel/talep-ozet.mjs`); hazine ağından 10
  isim listele.
- Claude: siteyi iki ürüne indir (menü, ana sayfa, demolar; Can onayıyla canlı), Desk'te limit
  yakınlığı → sinyal önerisi, Analytics'te ücretli katman taslağı (Stripe kapalı, "soon").

Hafta 3-6
- Can: 3 Desk pilot görüşmesi (anonim blotter ile), 10 trader görüşmesi.
- Claude: pilot geri bildirimleriyle Blotter (limit türleri, fırsat maliyeti kararı), Analytics
  ilk kullanım düzeltmeleri gerçek MT5 raporuyla, güvenlik anketi cevap dosyası (CAIQ Lite).

Hafta 7-12
- İlk pilot canlı; ilk ücretli trader (Stripe açık, şirket kurulunca).
- Rule Guard kararı: talep + Stripe yazılı cevabı + firma tutumu üçü de olumluysa Guard sekmesi
  planlanır; değilse rafa.

## 7. Karar listesi (Can)

1. Ürün sayısı: iki pazarlanan ürün (Desk, Trade Analytics) + motor. Onay?
2. Desk Signal'ın FX Blotter ile birleşmesi (Kalibre Desk). Onay?
3. Rule Guard sayfasının "planned"a çekilmesi ya da kaldırılması.
4. Lab'in menüden çıkıp Methodology altına inmesi.
5. Web-tek-platform kararı; masaüstü yalnız top için ince kabuk.
6. Şirket kurulumu takvimi.
7. Talep özetinin alınması ve bu belgeye eklenmesi.

## 8. Karar (Can, 1 Kasım 2026)

Seçilen yapı bölüm 3'teki değil, Can'ın çatısı:
- **Kalibre Markets** marka ve platform adı; ayrı ürün markası yok. Altında iki ürün:
  - **Analytics**: bağlan (MT5 raporu, trade log, blotter, Bridge) → kur (hazır analizler: Trade Analytics, FX Blotter, backtest "ne olurdu"; görünüm kurucu) → sun (rapor sayfası, PDF, paylaşım bağlantısı). Trade Analytics, FX Blotter ve Lab artık ürün değil, hazır analiz.
  - **Desk Signal**: takım içi iletişim ürünü, ayrı. Analytics'e bağlanması (limit yakınlığı → sinyal) ileride özellik.
  - Rule Guard çatı dışında, "planned"; üç şart (talep, Stripe yazılı onayı, firmaların EA tutumu) sağlanmadan gelmez.
- Sunum katmanı ilk adım: gün sonu masa raporu (PDF, salt-okuma paylaşım bağlantısı).
- Fiyat: tek fiyat, Creator/Viewer yok; sitede fiyat gösterilmez, "contact us".
- Platform: web, tek platform, yerel-öncelikli (bölüm 4 aynen).

Sıra: (A) site yapısı iki ürüne iner (önizleme, canlı Can onayıyla); (B) masa raporu sayfası ve paylaşım bağlantısı; (C) tek kabuk, tek veri kümesi, tek görünüm kurucu.
