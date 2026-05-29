# Landing — Türkçe içerik draft (L1)

> Onaya sunulan içerik. Her bölüm aşağıda. Onaylar/değiştirirsin sonra HTML'e dönüştürülür.

---

## HERO

**Üst chip (animasyon)** — canlı güncellenen 4 sayı sıra ile geçer:
```
● USD/TRY 45.65  ▸  ● BIST 100 13,891  ▸  ● TÜFE 32.4%  ▸  ● Fed 3.64%
```

**Hero başlığı (h1):**
> Türkçe finansal verinin terminal hissi.

**Alt başlık:**
> Yatırım tavsiyesi değildir. Veriyi anlamlı kılar, eğitir, kararı sana bırakır.

**CTA'lar (iki buton):**
```
[ TERMİNALİ AÇ → ]    [ ▸ 3 dakikada yatırımcı önyargı testini yap ]
```

**CTA altı küçük metin:**
> Hesap açma yok. Ücretsiz. Reklamsız.

---

## "BU SİTE NEDİR" — 3 KOLON

### 📊 Günlük makro & piyasa
Her sabah otomatik üretilen raporlar: BIST nabzı, döviz, FED & TCMB politikası, TÜFE, TCMB analitik bilanço, sektör rotasyon. Veri kaynakları açık, formüller görünür.

### 🎓 Eğitim kütüphanesi
24 makale: temel analiz, teknik göstergeler, risk yönetimi, yatırımcı psikolojisi, davranışsal önyargılar, TCMB faiz politikası. Sade Türkçe, akademik kaynakça.

### 🧠 Karar destek araçları
Yatırımcı önyargı testi, işlem öncesi disiplin kontrolü, strateji laboratuvarı (5 algoritma backtest), sıfır risk borsa simülasyonu. Öğret → dene → analiz et üçlüsü.

---

## "BİZİ NE AYIRIR" — 4 madde

### 1. Yatırım tavsiyesi vermeyiz
Diğer borsa siteleri "şu hisseyi al, şu seviyeye gelsin" der. Biz vermeyiz. Bizim işimiz veriyi açıklamak, çerçeveyi sunmak, kararı bırakmak. Bu hem felsefi hem yasal bir tercih.

### 2. Tüm metodoloji açık
Her grafik altında veri kaynağı (TCMB EVDS, FRED, KAP, yfinance), hesap formülü (Net Interest Margin = Net Faiz Geliri / Ortalama Aktif × 4) ve parametreler yazılı. Kara kutu yok.

### 3. Eğitim entegre
Her teknik metrik yanında *"ne anlama gelir"* tooltip'i + ilgili eğitim makalesine link. F/K oranını gördün, tıkla, 8 dakikada öğren.

### 4. Ücretsiz — reklamsız
AdSense yok, abonelik yok, paywall yok. Mevcut tüm araçlar kalıcı olarak ücretsiz. *(İleride opsiyonel premium analiz talebi gelebilir; mevcut hiçbir özellik para arkasına geçmez.)*

---

## "BİZDE NE VAR" — 8 modül galerisi

Her modül kartı: screenshot + başlık + 1 cümle + CTA link

### 1. 📊 Günlük Nabız
Her sabah BIST, USD/TRY, VIX, DXY, ABD 10Y için tek sayfa özet. 5 grafik + LLM yorum + makro bağlam.
**[ Bugünün Nabzını Gör → ]** `/reports/pulse/2026-05-27`

### 2. 🏦 TCMB Analitik Bilanço
Günlük net rezerv (klasik + swap-arındırılmış), brüt rezerv, döviz yükümlülükleri. T+1 EVDS verisi.
**[ Bugünkü Bilançoyu Gör → ]** `/reports/tcmb/2026-05-27`

### 3. 🧠 Yatırımcı Önyargı Testi
12 senaryo, 8 davranışsal önyargı için kişisel skor, radar chart, üst 3 önyargı için pratik öneriler.
**[ Testi Başlat (3 dk) → ]** `/trading/onyargi-testi/`

### 4. 🔬 Strateji Laboratuvarı
5 algoritmik yöntem (momentum, mean reversion, golden cross, breakout, RSI) × 60+ BIST + US hissesi. Sharpe, MaxDD, hit rate gösterilir.
**[ Lab'a Gir → ]** `/algo/`

### 5. 🎓 Eğitim Kütüphanesi
24 makale: PE, RSI, drawdown, portföy optimizasyonu, Kelly kriteri, NIM, carry trade, BTC dominance, likidite riski. Tümü Türkçe, kaynakçalı.
**[ Kütüphaneye Gir → ]** `/egitim/`

### 6. 🎮 Borsa Simülasyonu
Sanal sermaye ile pratik. Gerçek BIST verisi, gerçek zamanlı emir defteri. Sıfır risk.
**[ Simülasyona Başla → ]** `/simulasyon/`

### 7. 🏛 Banka Bilanço Raporu
6 büyük BIST bankası için KAP doğrulamalı çeyreklik NIM, ROE, CAR analizi. Çapraz karşılaştırma + tarihsel trend.
**[ Q4 2025 Raporunu Aç → ]** `/banka-raporu/2025-q4/`

### 8. 🗓 Haftanın Grafiği & Haberleri
Her hafta bir konu derinlemesine grafik (TCMB rezerv, tahvil getirileri, vb.) + global press (FT, Bloomberg, Reuters, WSJ) sentezi.
**[ Bu Haftaya Bak → ]** `/haftanin-grafikleri/` & `/haftanin-haberleri/2026-05-23/`

---

## "NASIL ÇALIŞIYOR" — şeffaflık akışı

Görsel: dikey timeline gibi 5 adım

```
◷  Her gece 03:00 itibariyle otomatik tetiklenir
  ↓
📡  Veri kaynakları çekilir:
    • yfinance (BIST, US hisse, FX — 15 dk gecikmeli)
    • TCMB EVDS (analitik bilanço, faiz, döviz)
    • FRED (ABD makro)
    • Dünya Bankası (uluslararası karşılaştırma)
    • KAP (Türk şirket finansal tablolar)
  ↓
🐍  Python publisher script'leri grafikleri + LLM yorumları üretir
  ↓
📤  HTML raporlar Vercel'e push edilir
  ↓
✓  Sabah 09:00 itibariyle yayında
```

**Alt metin:**
> Kaynak kodu kapalı tutuyoruz ama metodoloji açık. Her sayfada formül, veri kaynağı, hesap parametresi belirtilir.

---

## "ÖRNEK KULLANIM" — 3 kullanıcı portresi

### 👤 Acemi yatırımcı
Borsa hakkında öğrenmek istiyorsun ama parayı riske atmadan başlamak istiyorsun.
1. **Eğitim Kütüphanesi**'nden başla → PE, F/K, drawdown gibi temel kavramlar
2. **Önyargı Testi**'ni yap → kendi karar zaaflarını anla
3. **Simülasyon**'da pratik yap → sanal sermayeyle deneyim
4. *Eğer hala merak ediyorsan*, gerçek hesaba geç (başka platformlardan)

### 👤 Aktif yatırımcı
Zaten pozisyon alıyorsun. Daha sistemli karar için araç istiyorsun.
1. Her sabah **Günlük Nabız** + **Döviz Günlük** + **TCMB Analitik Bilanço**
2. Hafta sonu **Sektör Rotasyon** + **Haftanın Grafiği**
3. Yeni pozisyon öncesi **İşlem Öncesi Disiplin Kontrolü**
4. Backtest için **Strateji Laboratuvarı**

### 👤 Profesyonel / araştırmacı
Veri ve metodoloji şeffaflığı istiyorsun.
1. **Banka Bilanço Raporu** — KAP doğrulamalı çeyreklik analiz
2. **TR Makro** + **ABD Makro** + **Dünya Bankası** raporları
3. **Haftanın Grafiği** uzun-form analiz
4. **Özel Analiz Talebi** ile spesifik konu için derinleştirme

---

## SSS — 7 soru

### Bu site para mı kazandırır?
Hayır. Bu site para kazandırma garantisi vermez ve veremez. Yatırımcı eğitimine ve karar destek araçlarına odaklanır. Verdiğin yatırım kararlarının sonuçları sana aittir.

### Yatırım danışmanlığı şirketi misiniz?
Hayır. SPK lisanslı bir kurum değiliz, lisansa tabi yatırım danışmanlığı vermeyiz. Veri sağlarız, eğitim sunarız, davranışsal araçlar geliştiririz. "Şu hisseyi al" demeyiz, dememeliyiz.

### Ücretsiz olması garip değil mi, nasıl sürdürülebilir?
Şu anda site reklamsız ve ücretsiz. İleride opsiyonel premium hizmetler (örn. özel analiz talebi, gelişmiş alarm, API erişimi) gelir modeli olabilir. Ancak mevcut tüm araçlar kalıcı olarak ücretsiz kalacak.

### Veriler ne kadar günceldir?
Günlük raporlar her sabah 09:00 TR itibariyle otomatik üretilir. Veri kaynakları: yfinance (BIST 15 dk gecikmeli), TCMB EVDS (T+1 resmi), FRED (resmi), Dünya Bankası (çeyreklik), KAP (resmi finansal raporlar). Haftalık ve çeyreklik raporlar kendi ritminde yayınlanır.

### Hesap açmam gerekiyor mu?
Hayır. Tüm araçlar hesapsız erişilebilir. Sadece önyargı testi sonuçlarını saklamak için tarayıcıda yerel depolama (localStorage) kullanılır; bu hiçbir yere gönderilmez.

### Mobil çalışıyor mu?
Evet. Tüm sayfalar mobil-uyumlu. Ancak terminal arayüzü yoğun veri içerdiğinden masaüstü deneyimi daha rahattır.

### Kim kullanıyor, kaç kişi?
Site yeni başladı, henüz büyük bir kullanıcı kitlesi yok. Şu an erken kullanıcı + finans öğrencisi + amatör yatırımcı küçük bir grup. Tanıdık çevren varsa paylaşabilirsin.

---

## FİNAL CTA

**Üst metin:**
> Terminale gir, içeriği keşfet.

**Birinci buton (büyük):**
```
[ TERMİNALİ AÇ → ]
```

**Alt metin:**
> Veya 3 dakikada kendini tanı:

**İkinci buton (orta):**
```
[ YATIRIMCI ÖNYARGI TESTİ ]
```

**En alt küçük link:**
```
🐦 Twitter'da takip et    ·   📧 İletişim   ·   📰 RSS aboneliği
```

---

## FOOTER

```
KALIBRE · MARKETS
v2026.05 · son güncelleme {bugün} 09:00 TR
Veriler: Yahoo Finance (gecikmeli) · TCMB EVDS · FRED · Dünya Bankası · KAP

Hakkında · İletişim · Kullanım Şartları · Gizlilik · RSS

© 2026 Kalibre Markets
Yatırım tavsiyesi değildir. Site içerikleri büyük ölçüde yapay zeka destekli üretilir;
hata olabilir. Kararlar size aittir.
```

---

## DİL TONU NOTLARI

- "Sen" ekiyle hitap (Türkçe samimi ama profesyonel)
- Sözcükler kısa, cümleler kısa
- Em-dash (—) yok, düz tire (-) veya virgül
- Devrik cümle yok ("Acemi yatırımcı için ideal" değil → "Acemi yatırımcıya uygundur")
- Aşırı satış yok ("dünya değişti", "yatırımın geleceği", "devrim niteliğinde" gibi kelimelerden kaçın)
- Akademik kaynak referansı tutarlı (örn. "Kahneman & Tversky 1979" gibi)
- Sayılar tabular-nums ile mono font

---

## SCREENSHOT ÇEKİM LİSTESİ (L2 task için)

8 modül için canlı siteden ekran görüntüsü:

| # | Modül | URL | Çekim notu |
|---|---|---|---|
| 1 | Günlük Nabız | `/reports/pulse/2026-05-27` | İlk fold (header + ilk grafik), 1600×1000 |
| 2 | TCMB Bilanço | `/reports/tcmb/2026-05-27` | Net rezerv + swap-arındırılmış grafikler |
| 3 | Önyargı Testi | `/trading/onyargi-testi/` | Sonuç sayfası (örnek profil ile), radar chart görünür |
| 4 | Strateji Lab | `/algo/` | Ana sayfa, 5 strateji + tablo |
| 5 | Eğitim | `/egitim/` | Kategori listesi sayfası |
| 6 | Simülasyon | `/simulasyon/` | Ana ekran (portföy + grafik) |
| 7 | Banka Raporu | `/banka-raporu/2025-q4/` | NIM tablosu + grafik |
| 8 | Haftanın Grafiği | `/haftanin-grafikleri/` | En son yayın (2026-05-20 tahvil getirileri) |

Tüm screenshot'lar:
- `static/landing/{modul}-preview.png` (1600×1000)
- `static/landing/{modul}-preview.webp` (WebP alternatif, %30 daha küçük)
- Alt text düzgün yazılmış (SEO + a11y)

---

**Bu içerik bekliyor onayını.** Üzerinde değişiklik istediğin yer varsa belirt — yoksa direkt L2 + L4'e geçerim (screenshot + HTML).
