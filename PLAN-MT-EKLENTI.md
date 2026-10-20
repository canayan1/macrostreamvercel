# Kalibre Lab: MetaTrader Eklentisi Mimari Taslağı

> **Tarih:** 2026-10-20
> **Durum:** Taslak, tartışma için. Kod yok.

## 1. Ana ilke

**Biz mantığı göndeririz, fiyat kullanıcının makinesinde kalır.**

Kullanıcının fiyatı zaten var, çünkü MetaTrader hesabı aracı kurumundan geliyor. Bizim
işimiz o fiyatın üzerine analiz, laboratuvar, backtest ve eğitim katmanı koymak.

Fiyat verisi bizim sunucumuza hiç gelmezse:
- Veri dağıtıyor sayılmayız. BIST ya da aracı kurumun veri şartlarıyla çatışmayız.
- Saklayacak, koruyacak, lisanslayacak veri yükümüz olmaz.
- Sunucu maliyeti düşük kalır.

Sunucumuza gelebilecekler: hesap/lisans bilgisi, strateji tanımları (kurallar, parametreler),
kullanıcı isterse kendi işlem günlüğü. Mum, tick, kotasyon gelmez.

## 2. Üç katman

```
┌──────────────────────────── Kullanıcının bilgisayarı ────────────────────────────┐
│                                                                                  │
│  MetaTrader 5                              Kalibre Lab (masaüstü uygulama)       │
│  ┌──────────────────────────┐   127.0.0.1  ┌──────────────────────────────────┐  │
│  │ Kalibre Bağlayıcı (EA)   │ ───────────► │ Grafik, laboratuvarlar,          │  │
│  │  · mumlar, işlemler      │   soket      │ strateji kurucu, opsiyon lab,    │  │
│  │  · ekonomik takvim       │ ◄─────────── │ Monte Carlo, raporlar            │  │
│  │  · plan çizgileri        │  plan/kural  └──────────────────────────────────┘  │
│  │ Kalibre Motor (EA)       │                         │                          │
│  │  · strateji JSON yürütür │                         │ yalnız: lisans, strateji │
│  │  · Strategy Tester uyumlu│                         │ tanımı, (isteğe bağlı)   │
│  │ Kalibre İndikatörleri    │                         │ işlem günlüğü            │
│  └──────────────────────────┘                         ▼                          │
└──────────────────────────────────────────────── kalibremarkets.com ──────────────┘
                                                  eğitim, hesap, strateji kütüphanesi,
                                                  sentetik oyun alanı
```

**A. MQL5 çekirdeği** (MetaTrader'ın içinde)
- **Kalibre İndikatörleri:** kendi teknik analiz göstergelerimiz.
- **Kalibre Motor:** tek bir EA. Strateji kurucudan gelen kural dosyasını (JSON) okur ve
  yürütür. Yeni strateji = yeni JSON, yeni EA değil. MT5 **Strategy Tester** ile uyumlu
  olduğu için backtest, optimizasyon ve görsel mod bedavaya gelir. Üstelik kullanıcının
  kendi aracı kurumunun geçmiş verisiyle, yerelde çalışır.
- **Kalibre Bağlayıcı:** MT5'teki mumları, işlemleri ve MT5'in yerleşik ekonomik takvimini
  yerel uygulamaya aktarır. Plan seviyelerini grafiğe çizer.

**B. Kalibre Lab masaüstü uygulaması** (Tauri ya da Electron, Windows ve Mac)
- MQL5'in arayüz imkânları kısıtlı. Zengin ekranlar burada olur.
- Bağlayıcı ile yalnız `127.0.0.1` üzerinden konuşur. Veri makineden çıkmaz.
- MT5 kapalıyken sentetik piyasayla çalışmaya devam eder.

**C. Web sitesi**
- Eğitim, hesap ve lisans, strateji kütüphanesi (yalnız kurallar), indirme sayfası.
- Sitede grafik gerekiyorsa sentetik.

## 3. Modüller

| Modül | Nerede | Veri |
|---|---|---|
| Teknik analiz | MQL5 indikatörleri + Lab grafikleri | Kullanıcının MT verisi, yerel |
| İndikatör laboratuvarı | Lab | MT verisi ya da sentetik: "bu gösterge hangi rejimde yanılıyor?" |
| Backtest | MT5 Strategy Tester (Kalibre Motor ile) | Aracı kurum geçmişi, yerel |
| Sağlamlık testleri | Lab | Monte Carlo, walk-forward, aşırı uydurma (overfitting) kontrolü, işlem sırası karıştırma |
| Manuel strateji kurucu | Lab (kodsuz) | Çıktı JSON → Kalibre Motor yürütür |
| Strateji şablonları | Web kütüphanesi + Lab | Yalnız kurallar; kullanıcı kendi parametresini seçer |
| Makro temelli stratejiler | Lab | MT5 ekonomik takvimi (kullanıcının terminalinden) + kullanıcının seçtiği makro senaryo |
| Opsiyon laboratuvarı | Lab | Getiri diyagramı, Greeks, strateji karşılaştırma; dayanak fiyat MT'den, volatilite kullanıcıdan |
| İşlem günlüğü ve inceleme | Lab, isteğe bağlı bulut senkronu | Kullanıcının kendi işlemleri |
| Eğitim | Web + Lab içi bağlamsal ipuçları | Yok |

## 4. Teknik notlar

- **Yalnız MT5.** MT4 yeni aracı kurumlara artık lisanslanmıyor, sönümleniyor.
- **MQL5 soketleri istemci tarafı.** EA, Lab'in açtığı yerel sunucuya bağlanır.
  Kullanıcı `127.0.0.1`'i MT5 ayarlarında izin verilen adreslere bir kez ekler.
- **DLL kullanılmaz.** Kullanıcıyı korkutur ve MQL5 Market'te yasak.
- **Mac:** MT5 Mac'te sarmalayıcıyla çalışıyor. Bağlayıcı aynı, Lab yerel çalışır.
- **Mobil MT5 eklenti çalıştırmaz.** Mobil kullanıcıya yalnız web ve sentetik içerik.
- **Dağıtım:**
  - **MQL5 Market:** lisanslama, kopya koruma ve ödeme MetaQuotes'ta, karşılığında komisyon kesiyorlar.
  - **Kendi sitemiz:** daha fazla kontrol, ama lisans doğrulamasını biz yazarız.
  - İndikatör ve EA için Market, Lab için kendi site mantıklı.

## 5. Hukuki sınırlar (avukata sorulacak)

- **Yatırım danışmanlığı (SPK):** Kişiye özel "şunu al, şunu sat" önerisi danışmanlık
  izni gerektirir. "Strateji önerileri" kişiselleştirilmemiş, eğitim amaçlı şablon olarak
  sunulmalı. Seçimi ve parametreyi kullanıcı yapmalı.
- **Otomatik işlem:** Motor kullanıcının kendi kurduğu kuralları yürütüyor. Hazır
  "otomatik kazanç" stratejisi satmak portföy yönetimine kayabilir. Sınırı netleştirelim.
- **Aracı kurum veri şartları:** Fiyat yerelde kaldığı sürece risk düşük. Bulut senkronu
  açılırsa yalnız işlem kayıtları gitmeli.
- **KVKK:** İşlem günlüğü buluta giderse kişisel veri sayılır.

## 6. Önerilen sıra

1. **Kalibre Motor + JSON şeması:** ürünün çekirdeği. İki-üç şablon stratejiyle Strategy Tester'da çalışır hale gelsin.
2. **Strateji kurucu (Lab, kodsuz):** JSON üretir, Motor yürütür.
3. **Bağlayıcı + Lab grafik ve günlük ekranı.**
4. **Sağlamlık laboratuvarı** (Monte Carlo, walk-forward).
5. **Opsiyon laboratuvarı ve makro senaryo modülü.**
6. **Web sitesinin yeni haliyle** eğitim ve strateji kütüphanesi bağlantısı.
