# Kapalı beta planı (yalnız demo hesaplar)

Hedef başlangıç: 1-2 Kasım 2026. Süre: 2 hafta. Katılımcı: 10-20 kişi.
Tester rehberi: `/beta/` (TR) ve `/en/beta/` (EN); sitede her sayfadaki beta bandı oraya götürür.

**Kapsam:** MT5 köprüsü (yalnız okuma) ve Panom, Alpaca paper / Tradier sandbox bağlantıları, strateji
kurucu (Basit/İleri), hızlı prova, optimizasyon. **Otomatik işlem betanın parçası değildir:** Kalibre
Motor ve prop kalkanı testerlara verilmez. Beta lisansları yalnız `kopru` ürününü kapsar
(`urunler: ["kopru"]`); Motor için lisans ya da indirme isteği açık bir mesajla 403 döner.

## 1. Kimleri davet edelim

- **Demo MT5 kullananlar:** forex/CFD işlem yapan, MT5'i kurup bir eklenti ekleyebilecek kişiler.
- **Prop sınavına girenler:** FTMO / The5ers deneyimi olanlar; Panom ve optimizasyonu risk gözüyle en iyi onlar değerlendirir (kalkan betada yok).
- **Alpaca paper kullanıcıları:** ABD hisse tarafını denemek için (hesap e-postayla açılıyor).
- **Karışım:** en az 3 Windows, en az 3 macOS; en az 2 kişi İngilizce arayüzü kullansın.
- **Kaçın:** yalnız gerçek hesapla çalışmak isteyenler; "sinyal/bot ne kadar kazandırır" beklentisiyle gelenler.

## 2. Davet e-postası

Her tester için yerelde bir beta lisansı üret (Upstash bilgileri ortamdayken):

```
node --env-file=.env.local yerel/beta-lisans.mjs olustur --eposta kisi@ornek.com --gun 60 --not "demo MT5, Windows"
node --env-file=.env.local yerel/beta-lisans.mjs listele
node --env-file=.env.local yerel/beta-lisans.mjs uzat --anahtar KLM-... --gun 30
node --env-file=.env.local yerel/beta-lisans.mjs iptal --anahtar KLM-...
```

### Türkçe şablon

> Konu: Kalibre Lab kapalı beta davetin
>
> Merhaba {ad},
>
> Kalibre Lab'in kapalı betasına katıldığın için teşekkürler. Kalibre Lab, MetaTrader 5 için bir strateji ve risk laboratuvarı. Betada **yalnız demo hesap** kullanacağız.
>
> Beta lisans anahtarın: **{KLM-XXXXX-XXXXX-XXXXX-XXXXX}** (kimseyle paylaşma).
>
> 1. https://kalibremarkets.com/hesap adresinde anahtarı "Kaydet" ile kaydet ve Kalibre Köprü eklentisini indir.
> 2. https://kalibremarkets.com/baglan adresindeki adımlarla demo MT5 hesabını bağla.
> 3. https://kalibremarkets.com/beta adresindeki "İlk oturum" bölümünü izle (yaklaşık 30 dakika).
> 4. Takıldığın her yeri aynı sayfadaki formdan ya da bu e-postaya yanıt vererek bildir.
>
> Betanın ilk haftası kurulum ve bağlantı, ikinci haftası strateji kurma, hızlı prova ve optimizasyon üzerine. Otomatik işlem betanın parçası değil; hiçbir hesapta emir açılmayacak. Lisansın {tarih} tarihine kadar geçerli.
>
> Sonuçların hepsi simülasyondur; gerçek parayla karar vermeye uygun değildir.
>
> Teşekkürler,
> Kalibre

### English template

> Subject: Your Kalibre Lab closed beta invitation
>
> Hi {name},
>
> Thank you for joining the Kalibre Lab closed beta. Kalibre Lab is a strategy and risk lab for MetaTrader 5. In the beta we use **demo accounts only**.
>
> Your beta licence key: **{KLM-XXXXX-XXXXX-XXXXX-XXXXX}** (do not share it).
>
> 1. At https://kalibremarkets.com/en/license, save the key and download the Kalibre Bridge add-on.
> 2. Connect your demo MT5 account following the steps at https://kalibremarkets.com/en/connect.
> 3. Follow "First session" at https://kalibremarkets.com/en/beta (about 30 minutes).
> 4. Report anything that gets in your way with the form on that page or by replying to this email.
>
> Week 1 is about setup and connection; week 2 is about building strategies, the quick test and optimization. Automated trading is not part of the beta; no orders will be placed on any account. Your licence is valid until {date}.
>
> All results are simulations and are not suitable for real-money decisions.
>
> Thanks,
> Kalibre

## 3. İki haftalık takvim

| Gün | Ne | Bizim işimiz |
|---|---|---|
| Hafta 1, gün 1 | Davetler gider (dalga dalga: önce 5 kişi) | Gelen kutusu ve geri bildirim formu izlenir |
| Hafta 1, gün 1-3 | Kurulum: lisans, eklenti, /baglan, Panom | Takılma noktaları günlük toplanır; P1'ler aynı gün |
| Hafta 1, gün 3 | Kalan davetler | İlk 5 kişinin bulgularıyla kurulum metni düzeltilir |
| Hafta 1, gün 5 | Kısa anket: kuruldu mu, ne kadar sürdü, nerede takıldı | |
| Hafta 2, gün 1-3 | Strateji kurucu (Basit/İleri), hızlı prova, optimizasyon | Yanlış sayı bildirimleri önce doğrulanır |
| Hafta 2, gün 3-5 | Alpaca paper / Tradier sandbox ile Panom; Panom sayılarının MT5 ve aracı kurumla karşılaştırılması | Uyuşmazlıklar P0 olarak doğrulanır |
| Hafta 2, sonu | 20 dakikalık görüşme (en az 5 kişiyle) ve kapanış anketi | Aşama 2 kararı |

## 4. Ne ölçeceğiz

- **İlk bağlantıya kadar geçen süre** (davetten Panom'da "Bağlı" görene kadar; tester bildirir).
- **MT5'i bağlayabilenlerin oranı.**
- **Hızlı provayı en az bir kez çalıştıranların oranı.**
- **Optimizasyonu en az bir kez çalıştıranların oranı.**
- **En sık 5 takılma noktası** (adım ve ekrandaki mesajla).
- **Hata sayısı ciddiyete göre** (P0 / P1 / P2).

Not: sitede kullanıcı davranışı izlenmiyor (Analytics yalnız onayla ve sayfa düzeyinde). Oranlar tester anketinden ve geri bildirimden çıkarılır; ayrıca bir izleme eklenmez.

## 5. Önceliklendirme

- **P0, dur ve düzelt:** yanlış sayı (Panom, prova ya da optimizasyon MT5'teki ya da aracı kurumdaki değerle uyuşmuyor), veri sızıntısı şüphesi, lisansın yanlış hesaba bağlanması, bir beta lisansının Motor'a erişebilmesi. Yeni davet gönderilmez; düzeltme ve doğrulama yapılmadan devam edilmez.
- **P1:** kurulum ya da kullanım engelleniyor (eklenti bağlanmıyor, sayfa açılmıyor). 24 saat içinde çözüm ya da geçici yol.
- **P2:** kafa karıştıran ifade, görsel hata, küçük kusur. Haftalık toplu düzeltme.

## 6. Aşama 2'ye (gerçek hesaplarda yalnız okuma) geçiş koşulları

Hepsi sağlanmadan gerçek hesap bağlantısı açılmaz:

- [ ] 7 gün boyunca açık P0 yok.
- [ ] Testerların en az %70'i bağlantıyı kendi başına kurabildi.
- [ ] `docs/GUVENLIK-INCELEMESI.md` maddeleri tamamlandı (özellikle içe aktarılan dosyalardan XSS ve CSP).
- [ ] Gizlilik politikasındaki boşluklar dolduruldu ([UNVAN], [ADRES], [DEPO SAĞLAYICI], [STRIPE TÜZEL KİŞİSİ]) ve avukat incelemesi yapıldı.
- [ ] Motor doğrulamasının A-C aşamaları bitti (kurallar yayımlandı, bilinen-cevap testleri, MT5 ile işlem işlem karşılaştırma).
- [ ] Aşama 2'de Motor gerçek hesapta emir açmaz; yalnız köprü (okuma) ve Panom açılır.

## 7. Kalibre Motor (otomatik işlem): yalnız kurucu, yalnız demo

- Motor ve prop kalkanı betada testerlara verilmez.
- Kurucu Motor'u demo hesapta **en az 4 hafta** kesintisiz çalıştırır: kalkan ön ayarları, lisans
  yenileme, MT5 yeniden başlatma, internet kesintisi, haber filtresi, açık pozisyonların yönetimi.
  Her hafta Uzmanlar günlüğü ve işlem listesi saklanır; beklenmeyen her emir P0'dır.
- Motor doğrulamasının A-C aşamaları (kurallar, bilinen-cevap testleri, MT5 Strategy Tester ile işlem
  işlem karşılaştırma) bitmeden ve bu 4 hafta sorunsuz geçmeden, Motor'un herhangi bir gerçek hesapta
  kullanılması ya da kullanıcılara sunulması söz konusu değildir.
