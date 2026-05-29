# Kalibre Markets — Landing Page + IA Yeniden Düzenleme Planı

> **Hazırlayan:** Cowork (Opus)
> **Tarih:** 2026-05-27
> **Durum:** Plan — kod yazılmadı, onaya sunuldu

---

## 1. Problem teşhisi

Site şu an **veri-yoğun bir terminal**. İlk gelen biri için:
- **Çok kapı, az yön gösterimi** — F1-F6 sekmesi var ama "bu site bana ne sunuyor" tek bakışta belli değil
- **Tüm modüller eşit görünüyor** — eğitim, simülasyon, banka raporu, önyargı testi, makro rapor, FX, haftanın grafiği... yeni kullanıcı 5 saniye içinde overwhelm olur
- **"Niye bu site, başka yer yerine?"** sorusu cevapsız — value prop sözel olarak hiçbir yerde yok
- **Sosyal proof yok** — kim kullanıyor, kaç kullanıcı, ne diyorlar belirsiz (zaten yeni site)
- **Onboarding** = `site-tour` modal (line 486 civarı), iyi başlangıç ama yeni gelen onu görünce kapatma eğiliminde

**Sonuç:** Mevcut anasayfa **alışmış kullanıcı için harika** (terminal hissi, hızlı erişim) ama **acquisition tool değil**. Bu iki ihtiyaç farklı şeyler.

---

## 2. Stratejik karar — iki konsept arasında seçim

### Konsept A: Landing + Terminal yan yana (path split)
```
kalibremarkets.com           → Landing page (yeni kullanıcı, marketing)
kalibremarkets.com/terminal  → Mevcut terminal arayüz
```
- **Avantaj:** Tek domain, basit, SEO authority dağılmaz, mevcut iç linkler bozulmaz (sadece anasayfa değişir)
- **Dezavantaj:** "Terminal" path olarak hissedilir, marka ayrı bir UX gibi durmaz

### Konsept B: Landing + Terminal subdomain (önerilen)
```
kalibremarkets.com               → Landing page
terminal.kalibremarkets.com       → Mevcut terminal arayüz
```
- **Avantaj:** Net ayrım. "Site" pazarlama, "terminal" araç. Bookmark + bookmark hissi farklı. Profesyonel hissi yüksek (Bloomberg Terminal, terminal.bloomberg.com pattern'i).
- **Dezavantaj:** İç linkler güncellenmeli, SSL ek sertifika, Vercel'de domain entegrasyonu, Analytics 2 propertyye ayrılır

### Önerim: **Konsept B (subdomain)**

Sebepleri:
1. **UX semantiği net** — kalibremarkets.com'a giren "ne var burada" görür, terminal.kalibremarkets.com'a giren işine bakar
2. **Marketing ayrı yaşayabilir** — landing'e A/B test, video, blog, social proof eklenir; terminal saf araç kalır
3. **Sticky kullanıcılar terminal'e bookmark eder** — pazarlama ile boğulmaz
4. **Kalibre markası daha güçlü** — "kalibremarkets.com" = "Kalibre nedir, ne yapar" demek, terminal = "araç"
5. **Gelecek modüller** için temiz model — `egitim.kalibremarkets.com`, `simulasyon.kalibremarkets.com` yapılabilir, ama bu **şart değil**, ileride

**Hibrit ara çözüm:** Önce path split (kalibremarkets.com/terminal) ile launch, organik trafiği gözlemle. 1-2 ay sonra subdomain'e geç. Bu, **erkene Vercel/DNS kompleksitesini ertelemenin** doğru yolu.

---

## 3. Landing page wireframe (önerilen sections)

```
┌─────────────────────────────────────────────────────────────────────┐
│  K  KALIBRE // MARKETS              [Terminal'e Git →]  [Giriş]    │  (üst bar)
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   HERO                                                              │
│   ─────────────────────────────────                                │
│   "Türkçe finansal verinin terminal hissi."                        │
│   "Yatırım tavsiyesi değildir, kararı kolaylaştırır."               │
│                                                                     │
│   [ Terminal'i Aç ]  [ 3 dk: Yatırımcı önyargı testi ]              │
│                                                                     │
│   ▸ canlı USDTRY ▸ BIST ▸ TÜFE ▸ Fed Funds (auto-updating chip)    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   "BU SİTE NEDİR" — 3 KOLON                                         │
│   ────────────────                                                  │
│   [📊 GÜNLÜK     ] [🎓 EĞİTİM    ] [🧠 ARAÇLAR     ]               │
│   [TR makro rapor] [24 makale,   ] [Davranışsal     ]               │
│   [BIST, FX, FED] [psikoloji,   ] [test, simülasyon ]               │
│   [TCMB bilanço ] [risk yönetimi] [strateji lab    ]               │
│   [Otomatik gün-] [şeffaf       ] [öğret + dene +  ]               │
│   [cellenir     ] [kaynakça     ] [analiz et       ]               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   "BİZİ NE AYIRIR" — 4 farklılaşma                                  │
│   ───────────────                                                   │
│                                                                     │
│   1. ✓ YATIRIM TAVSİYESİ VERMEYİZ                                  │
│      Diğer "borsa siteleri" sinyal satar, biz veriyi anlamlandı-   │
│      rırız. "Şu hisseyi al" demeyiz; ne demek istediğini öğretiriz.│
│                                                                     │
│   2. ✓ TÜM METODOLOJİ AÇIK                                          │
│      Her grafik altında veri kaynağı + formül + Python script ↗    │
│                                                                     │
│   3. ✓ EĞİTİM ENTEGRE                                                │
│      Her teknik metrikte tooltip + 24 makale linki. PE, RSI, NIM   │
│      yanında "nedir?" tek tıkla.                                    │
│                                                                     │
│   4. ✓ ÜCRETSİZ — REKLAMSIZ                                          │
│      AdSense yok, abonelik yok, paywall yok.                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   "BİZDE NE VAR" — modül galerisi (8 kart + screenshot)             │
│   ──────────────                                                    │
│                                                                     │
│   ┌──────────────────────┐ ┌──────────────────────┐                │
│   │ [SCREENSHOT]         │ │ [SCREENSHOT]         │                │
│   │ Günlük Nabız         │ │ TCMB Analitik Bilanço│                │
│   │ BIST, USD/TRY, VIX,  │ │ Net rezerv, swap-    │                │
│   │ DXY her sabah        │ │ arındırılmış, günlük │                │
│   │ → Örnek raporu gör   │ │ → Örnek raporu gör   │                │
│   └──────────────────────┘ └──────────────────────┘                │
│                                                                     │
│   ┌──────────────────────┐ ┌──────────────────────┐                │
│   │ [SCREENSHOT]         │ │ [SCREENSHOT]         │                │
│   │ Yatırımcı Önyargı    │ │ Strateji Laboratuvarı│                │
│   │ Testi (interaktif)   │ │ 5 algoritma, 60+    │                │
│   │ 12 soru, 8 önyargı   │ │ hisse, backtest      │                │
│   │ → Testi başlat       │ │ → Lab'a gir         │                │
│   └──────────────────────┘ └──────────────────────┘                │
│                                                                     │
│   ┌──────────────────────┐ ┌──────────────────────┐                │
│   │ [SCREENSHOT]         │ │ [SCREENSHOT]         │                │
│   │ Eğitim Kütüphanesi   │ │ Borsa Simülasyonu    │                │
│   │ 24 makale: temel     │ │ Sıfır risk, sanal    │                │
│   │ analiz, RSI, psikol. │ │ sermaye, gerçek veri │                │
│   │ → Kütüphaneye gir    │ │ → Simülasyona başla │                │
│   └──────────────────────┘ └──────────────────────┘                │
│                                                                     │
│   ┌──────────────────────┐ ┌──────────────────────┐                │
│   │ [SCREENSHOT]         │ │ [SCREENSHOT]         │                │
│   │ Banka Bilanço Raporu │ │ Haftanın Grafiği &   │                │
│   │ KAP doğrulamalı,     │ │ Haftanın Haberleri   │                │
│   │ 6 büyük banka NIM    │ │ Global press sentezi │                │
│   │ → Raporu indir       │ │ → Bu haftaya bak    │                │
│   └──────────────────────┘ └──────────────────────┘                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   "NASIL ÇALIŞIYOR" — şeffaflık                                     │
│   ──────────────────                                                │
│                                                                     │
│   ◷ Her gece otomatik çalışır                                       │
│     ↓ yfinance, TCMB EVDS, FRED, World Bank, KAP                   │
│     ↓ Python publisher script'leri grafikleri + yorumları üretir   │
│     ↓ HTML raporlar Vercel'e push edilir                            │
│     ↓ Sabah 09:00 itibarıyla yayında                                │
│                                                                     │
│   "→ Kaynak kodu kapalı ama metodoloji açık. Her sayfada formül,   │
│      veri kaynağı, hesap parametresi belirtilir."                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   "ÖRNEK KULLANIM" — 3 kullanıcı portresi                          │
│   ──────────────                                                    │
│                                                                     │
│   👤 Acemi yatırımcı          → "Eğitim'den başla, simülasyonda    │
│                                  dene, önyargı testiyle kendini    │
│                                  tanı"                              │
│   👤 Aktif yatırımcı           → "Günlük Nabız + Sektör Rotasyonu  │
│                                  + İşlem Kontrolü kombosuyla       │
│                                  disiplin sağla"                    │
│   👤 Profesyonel / araştırmacı → "Banka Bilanço Raporu + Makro    │
│                                  + TCMB Bilanço derinleştirme"     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   SSS (FAQ — 5-7 soru)                                              │
│   ─────                                                             │
│   • Bu site para mı kazandırır?                                     │
│   • Yatırım danışmanlığı şirketi misiniz?                          │
│   • Veriler ne kadar güncel?                                        │
│   • Hesap açmak gerekiyor mu?                                       │
│   • Mobil çalışıyor mu?                                             │
│   • Ücret yok mu, garip?                                            │
│   • Kim kullanıyor?                                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   FİNAL CTA                                                         │
│   ─────                                                             │
│   "Terminale gir, içeriği keşfet."                                  │
│   [ Terminal'i Aç →]                                                │
│                                                                     │
│   "Veya 3 dakikada kendini tanı:"                                  │
│   [ Yatırımcı Önyargı Testini Başlat ]                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                             │
│  Hakkında · İletişim · Kullanım Şartları · Gizlilik · RSS · Twitter│
│  © 2026 Kalibre Markets · Yatırım tavsiyesi değildir.              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Görsel direksiyon — "Bloomberg meets Stripe"

İki ana referans estetik:
1. **Bloomberg Terminal**: koyu tema, monospace, veri yoğun (mevcut Kalibre estetiği)
2. **Stripe / Linear landing**: bol whitespace, büyük tipografi, animasyonlu kart, "her şey kontrol altında" hissi

Karışım:
- **Üst bölüm (hero):** Stripe tarzı — büyük başlık, geniş whitespace, animasyonlu live data chip'leri (USDTRY, BIST canlı sayılar arasından geçer)
- **Modül galerisi:** Linear tarzı — interaktif kart hover, screenshot büyüten lightbox
- **Aşağı bölümler:** Kalibre terminal estetiği geri gelir — koyu tema, monospace numbers, grid background

Bu hibrit kullanıcıya **"araç ciddi ama yaklaşımı modern"** mesajı verir.

### Renk paleti (mevcut + birkaç ek)
```
Hero ve giriş bölümü: --bg-1 #14110e (mevcut), büyük başlık #ebe3d3, accent #ffa630
Featured kartlar: gradient ile sıcak gölgeler — linear-gradient(135deg, rgba(255,166,48,.06), transparent)
Screenshot çerçeveleri: --border-2 #36302a, hover'da --accent yanar
```

### Tipografi hiyerarşisi
```
Hero h1: Inter Tight 600, 56-72px, line-height 1.1, letter-spacing -.02em
Hero sub: Inter Tight 400, 22px, color --text-dim
Section heading: Inter Tight 600, 32px, color --accent
Body: Inter Tight 400, 16px (mobil 15px), color --text
Mono numbers: Geist Mono 500, tabular-nums
```

---

## 5. Screenshot stratejisi — ne, nasıl

8 modülün her biri için **otantik production screenshot** (mock-up değil, gerçek site):
1. **Günlük Nabız** → 2026-05-27 raporundan ekran (Inter, grafik + yorum)
2. **TCMB Bilanço** → net rezerv grafiği büyük + side bar metrikleri
3. **Önyargı Testi** → sonuç sayfası, radar chart, top-3 bias kartları
4. **Strateji Laboratuvarı** → /algo/ ana sayfa, 5 strateji + Sharpe tablosu
5. **Eğitim** → /egitim/ kategori sayfası, makale listesi
6. **Simülasyon** → simulator UI (portföy + grafik + işlem)
7. **Banka Raporu** → /banka-raporu/2025-q4/ NIM tablosu
8. **Haftanın Grafiği** → 2026-05-20 tahvil getirileri grafiği

Her screenshot:
- **Aspect ratio:** 16:10 (kart için), gerçek site oranı
- **Hover:** light scale-up + accent border
- **Click:** lightbox modal (mevcut `kmShowLightbox()` JS pattern kullanılabilir)
- **Alt text:** SEO ve erişilebilirlik için açıklayıcı

**Üretim:** `static/landing/` klasörü
- `nabiz-preview.png`, `tcmb-preview.png`, vb.
- WebP versiyonları da (`*.webp`) bandwidth için
- 1600px wide, 80% quality JPEG fallback

---

## 6. Bilgi mimarisi (IA) yeniden yapısı

### Önce:
```
F1 Ana Sayfa (= terminal)
F2 Araştırma
F3 Eğitim
F4 Trading
F5 Oyun
F6 Hakkında
```

### Sonra (landing + terminal ayrımı):
```
kalibremarkets.com (landing — F-keys yok)
  ├─ /  (landing page)
  ├─ /hakkinda
  ├─ /sss (FAQ)
  ├─ /iletisim
  └─ /sartlar, /gizlilik

terminal.kalibremarkets.com (terminal — F-keys var)
  ├─ /  (mevcut anasayfa)
  ├─ F1 Ana Sayfa (terminal.kalibremarkets.com/)
  ├─ F2 🔍 Araştırma (/arastirma/)
  ├─ F3 🎓 Eğitim (/egitim/)
  ├─ F4 🎯 Trading (/trading/)
  ├─ F5 🎮 Oyun (/simulasyon/)
  ├─ F6 ℹ Hakkında (kalibremarkets.com/hakkinda'ya çıkar)
  └─ ...
```

### Önemli: link tutarlılığı
Landing'den terminal'e bağlantılar **mutlak URL** olmalı (subdomain için):
```html
<a href="https://terminal.kalibremarkets.com/">Terminal'i Aç</a>
```
Terminal'den landing'e:
```html
<a href="https://kalibremarkets.com/hakkinda">Site hakkında</a>
```

Sitemap iki ayrı (`kalibremarkets.com/sitemap.xml` ve `terminal.kalibremarkets.com/sitemap.xml`), her ikisi de search engine'lara ayrı tanıtılır. canonical URL'ler doğru.

---

## 7. Onboarding akışı (yeni kullanıcı yolu)

```
1. Google → "BIST analiz" / "TCMB rezerv" araması
   ↓
2. kalibremarkets.com/[blog-veya-modül-sayfası]'na inilir (organik)
   ↓
3. Top sticky bar: "▸ Kalibre Markets'a hoş geldin. Sitenin tamamını gör →"
   ↓
4. Landing page'i görür:
   ├─ Hero (5 saniyede ne olduğunu anlar)
   ├─ Modül galerisi (10 sn'de hangi araçlar olduğunu görür)
   ├─ Farkımız (45 sn'de niye kaldığını anlar)
   └─ Final CTA
   ↓
5. İki yol seçer:
   ├─ "Önyargı testi" → 3 dk → sonuç → ilgili eğitim makalesine link
   └─ "Terminal'e gir" → terminal.kalibremarkets.com → onboarding overlay (mevcut #site-tour)
```

**İlk ziyaret tracking:**
- localStorage `km-landing-seen`: true → ikinci ziyarette landing skip + terminal'e direkt git (cookie-set ile)
- Veya basit: "Sizi tanıdık. Terminal'e mi gidiyorsun?" yumuşak yönlendirme

---

## 8. Content stratejisi — value prop yazımı

### Hero başlığı: 3 seçenek
1. **"Türkçe finansal verinin terminal hissi."**
   *(kısa, mevcut estetiği yansıtır, "terminal" işaretler)*
2. **"Borsa kararlarını veriyle, eğitimle, disiplinle al."**
   *(daha eyleme yönelik, eğitim öne çıkar)*
3. **"Yatırımı öğrenmenin ücretsiz, açık metodolojili Türkçe terminali."**
   *(uzun ama net, niş'i belirtir)*

**Önerim:** #1 + sub-hero: *"Yatırım tavsiyesi değildir, kararı kolaylaştırır."*

### "Bizi ne ayırır" 4 farklılaşma — neden bu sıralama?
1. **Yatırım tavsiyesi vermeyiz** — bu **en büyük negatif farklılaşma** (rakipler bunu yapıyor, biz reddediyoruz, etik konum)
2. **Tüm metodoloji açık** — şeffaflık (formül + kaynak + parametre)
3. **Eğitim entegre** — her metrikte tooltip, makale linki
4. **Ücretsiz** — son söz, çünkü ücretsiz bir araç **niye** ücretsiz konusunda şüphe yaratır. Önce değer + metodoloji + etik göster, sonra fiyat sürprizini ver.

### FAQ — anahtar sorular ve cevaplar
- **"Bu site para mı kazandırır?"** → "Hayır, bu site para kazandırma garantisi vermez. Yatırımcı eğitimine ve karar destek araçlarına odaklanır. Yatırım sonuçlarınız size aittir."
- **"Yatırım danışmanlığı şirketi misiniz?"** → "Hayır. SPK lisanslı değiliz, tavsiye vermeyiz. Veri sağlarız, eğitim sunarız, kararı sen verirsin."
- **"Ücretsiz nasıl olabiliyor?"** → "Şu anda site reklamsız ve ücretsiz. İleride opsiyonel premium analiz talebi gibi gelir modelleri olabilir, ama mevcut tüm araçlar kalıcı olarak ücretsiz."
- **"Veriler ne kadar günceldir?"** → "Günlük raporlar her sabah 09:00 itibarıyla otomatik üretilir. Veri kaynakları: yfinance (15 dk gecikmeli BIST), TCMB EVDS (T+1), FRED (resmi), Dünya Bankası, KAP (resmi)."

---

## 9. Teknik geçiş — subdomain implementation

### Faz 1: Path-split MVP (1-2 gün)
1. Mevcut `index.html`'i `terminal/index.html`'e taşı
2. Yeni `index.html` landing page olarak yaz
3. Tüm root-relative linkleri `/terminal/...` ile başlat (büyük refactor)
4. Sitemap güncelle
5. 301 redirect yap: eski URL'leri terminal'e taşı (`vercel.json` rewrites)
6. Deploy

### Faz 2: Subdomain (1 hafta sonra, organik trafik gözlendikten sonra)
1. Vercel project'e `terminal.kalibremarkets.com` domain ekle
2. DNS'te CNAME: `terminal.kalibremarkets.com` → `cname.vercel-dns.com`
3. Vercel SSL otomatik sertifika alır (Let's Encrypt)
4. `vercel.json` redirects:
   ```json
   {
     "redirects": [
       { "source": "/terminal", "destination": "https://terminal.kalibremarkets.com/", "permanent": true },
       { "source": "/terminal/:path*", "destination": "https://terminal.kalibremarkets.com/:path*", "permanent": true }
     ]
   }
   ```
5. Google Search Console'da subdomain'i ekle, sitemap submit
6. Internal linkleri **mutlak URL** ile değiştir

### Vercel proje stratejisi: tek mi iki mi?
**Tek proje (önerilen):** kalibremarkets.com + terminal.kalibremarkets.com aynı Vercel deploy'da. Hem landing hem terminal aynı build'de. Dosya yolu:
```
/index.html                  → kalibremarkets.com (landing)
/terminal/index.html         → terminal.kalibremarkets.com (Vercel "Domains" ile yönlendirilir)
```

Vercel.json domain config:
```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/index.html",
      "has": [{ "type": "host", "value": "kalibremarkets.com" }]
    },
    {
      "source": "/:path*",
      "destination": "/terminal/:path*",
      "has": [{ "type": "host", "value": "terminal.kalibremarkets.com" }]
    }
  ]
}
```

**Avantaj:** Tek deploy, tek env, tek analytics. CDN cache verimli.

---

## 10. SEO etkisi ve dikkat

### Risk: organik trafik düşebilir mi?
**Kısa süreli:** Evet. Google mevcut `kalibremarkets.com/`'u "veri terminali" olarak indexlemiş. Landing'e geçince ilk haftalar tıklanma oranı düşebilir.

**Uzun vade:** Olumlu. Landing daha iyi click-through rate verir (clear value prop). Terminal subdomain ayrı authority kurar.

### Yapılacaklar:
- **301 redirect** eski terminal URL'leri için (kalibremarkets.com/reports/pulse/... → terminal.kalibremarkets.com/reports/pulse/...) — link equity geçer
- **Canonical URL'ler** doğru (landing'de hiç canonical yapılmasın terminal'e, çünkü farklı sayfa)
- **Sitemap'leri ayrı** ver (her domain için)
- **Internal linking strategy**: landing'den popüler raporlara link, terminal'den landing'e "site hakkında" link
- **Google Search Console**'da iki property kaydet

### Beklenen organik düşüş ve toparlama:
- Hafta 1-2: -%20 ila -%30 oturum (Google yeni yapıyı indexlerken)
- Hafta 3-6: kademeli toparlama
- Ay 2-3: önceki seviye + landing'in conversion fonksiyonu sayesinde **bounce rate düşer**, average session değeri artar

---

## 11. AdSense açısı

Site AdSense'e başvurmaya hazırlanıyor (kökte `adsense-apply-guide.txt` var).

### Landing AdSense için:
- **AdSense yerleştirme:** Landing page'de **reklamsız tut** ilk 3 ay. Yeni gelen kullanıcı reklamı görünce profesyonellik algısı düşer.
- **Terminal'de reklamlar:** Mevcut footer + sidebar slot'larında 1-2 ads unit. Düşük yoğunluk, sticky kullanıcıyı rahatsız etmez.
- **AdSense onayı sonrası 2-3 ay test**: hangi yerleşim conversion etkilemiyor.

### Premium çıkış kapısı (uzun vade):
- Landing'e ileride bir "Pro" tier ekle: özel analiz talebi, gelişmiş alarmlar, API erişim — €9-19/ay
- Mevcut serbest araçlar kalıcı ücretsiz kalır
- Bu monetization stratejisi landing'in **future-proof** olmasını sağlar

---

## 12. Implementation fazları (önerilen sıra)

### Hafta 1 — Landing MVP
- [ ] Mevcut `index.html`'i `terminal/index.html`'e taşı
- [ ] Yeni `index.html` landing yaz (HTML + inline CSS, mevcut design system)
- [ ] Hero, "Bizi ne ayırır" (4 madde), "Bizde ne var" (8 kart screenshot), FAQ, final CTA
- [ ] Screenshots: 8 modülün gerçek site screenshot'unu al, optimize, /static/landing/'a koy
- [ ] FAQ: 7 soru + cevap
- [ ] Footer + meta tags + Open Graph (paylaşıma uygun)
- [ ] Path-split deploy (subdomain ertelenebilir)
- [ ] Test: mobil, masaüstü, dark/light kontrast, screenshot lightbox

### Hafta 2 — Subdomain + dengeleme
- [ ] DNS ayarı: terminal.kalibremarkets.com CNAME
- [ ] Vercel domain ekle
- [ ] vercel.json rewrites
- [ ] 301 redirects (eski path-based linkler)
- [ ] Sitemap ikili, Google Search Console submit
- [ ] Analytics 2 property setup (landing + terminal ayrı, ama aggregate dashboard)
- [ ] Organik trafiği gözlemle, 1 hafta bekle

### Hafta 3-4 — İçerik + cilalama
- [ ] Hero metni A/B test (3 başlık varyantı)
- [ ] Landing CTA tıklanma oranı ölç
- [ ] FAQ'ı genişlet (Google'da çıkan related questions'a göre)
- [ ] Sosyal proof: ilk 5-10 kullanıcı testimonial'ı topla
- [ ] Blog/news bölümü ekle landing'e? (haftalık grafiği özet yazısı vb.) — opsiyonel

### Ay 2+ — Acquisition
- [ ] Landing performansını GA'da incele (bounce, avg session, terminal'e tıklama rate)
- [ ] SEO optimize (yer üzeri, meta description, Schema.org Organization markup)
- [ ] AdSense başvur (terminal subdomain'inde, landing reklamsız kalır)
- [ ] Twitter/X paylaşım kartları (haftalık grafik için OG image otomasyon)
- [ ] r/borsaistanbul + LinkedIn finans grupları soft paylaşım

---

## 13. Risk + trade-off'lar

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| Organik trafik geçici düşüş | Yüksek | Orta | 301 redirect doğru, Search Console hızlı resubmit |
| Sticky kullanıcı landing'i zorlayıcı bulur | Düşük | Düşük | localStorage `km-landing-seen` → ikinci ziyaret skip |
| Subdomain SSL/DNS config hatası | Düşük | Yüksek | Path-split MVP ile başla, subdomain sonra |
| Screenshot bakım yükü | Orta | Orta | Quarter sonu yenile, Vercel deploy preview screenshot otomasyonu (Playwright) |
| Yeni mimari için iç linkleri kaçırmak | Yüksek | Orta | Pre-deploy: `grep -r "href=\"/"` ile tüm internal linkleri tara, /terminal/'a prefix at |
| Landing fazla "marketing" hissi yaratır | Düşük | Düşük | Tasarımı veri-dolu tut, ham metrik chip'leri hero'da göster |

---

## 14. Karar gereken noktalar

Devam etmeden önce şu kararları al:

1. **Konsept A (path) mı B (subdomain) mu?**
   - Önerim: B, ama path-split ile MVP başla (Hafta 1)

2. **Hero metni hangisi?**
   - Önerim: *"Türkçe finansal verinin terminal hissi."* + *"Yatırım tavsiyesi değildir, kararı kolaylaştırır."*

3. **8 modül galerisinde sıralama hangisi?**
   - Önerim: günlük > eğitim > araçlar (test, simülasyon, lab) > raporlar (banka, makro)
   - Veya: kullanıcı portresine göre kümele

4. **AdSense ne zaman ve nereye?**
   - Önerim: Hafta 4'te başvuru, sadece terminal'de, landing reklamsız

5. **Premium tier düşüncesi var mı?**
   - Önerim: Hafta 1-4'te yok. 3 ay aktif kullanım sonrası karar.

6. **Screenshot otomasyonu**
   - Önerim: Manuel başla, ay 2'de Playwright automation düşün

7. **Domain için ek bütçe**
   - Subdomain ücretsiz (Vercel + Cloudflare). Premium SSL gerekmez.

---

## 15. Sonuç — sıradaki adım

Bu plan **stratejik karar dokümanı**. Onayladığında:

1. **Önce:** Hero copy + "Bizi ne ayırır" 4 madde + FAQ'yu birlikte yaz/oku (içerik kalitesi yeni kullanıcı için en kritik)
2. **Sonra:** Screenshot çek (mevcut site canlıyken, 8 modül)
3. **Sonra:** Landing HTML'i yaz (path-split, terminal/ altına mevcut anasayfa)
4. **Sonra:** Deploy + organik trafik gözlemle 1 hafta
5. **Sonra:** Subdomain'e geç (Hafta 2)

**Bu plan onaya sunulmuştur. Onayla → implement aşamasına geçeriz. Reddet → revize.**

İlk somut soru: **hero metni + FAQ ile başlayalım mı, yoksa direk HTML'e atla "landing skeleton" çıkar mı diyorsun?**
