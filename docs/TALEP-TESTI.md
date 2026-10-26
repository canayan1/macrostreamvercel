# Talep testi: Rule Guard ve MT5 Analytics (4 hafta, reklamsız)

Karar (Can, 26.10.2026): talep görülmeden yeni ürün geliştirilmez. İki segment ayrı sayfalarla
test edilir, reklam bütçesi yok. Dayanak: `reports/Talep analizi.md` (worktree reports klasörü).
Ödeme yok, ön sipariş yok (şirket kurulmadan ve ödeme sağlayıcının yazılı onayı alınmadan
alınmaz). Bu belge yalnız ölçümü ve kararı tarif eder.

## 1. Neyi test ediyoruz

| Sayfa | Kime | Hipotez |
|---|---|---|
| `/rule-guard` (TR: `/tr/rule-guard`) | MT5'te prop firması sınavına giren trader | Firmanın günlük ve toplam kayıp kuralına uyumu izleyen ve haftalık kural/hata raporu veren bir araca aylık ya da yıllık ödeme yapılır. |
| `/mt5-analytics` (TR: `/tr/mt5-analytics`) | MT5 kullanan bireysel trader | Kendi MT5 hesabının panelini, kendi verisinde backtesti ve (planlanan) replay'i ücretli bulur; Myfxbook ve FX Blue'nun ücretsiz olmasına rağmen. |

Her iki sayfada fiyat iki varyantla gösterilir: A = 19 USD/ay, B = 29 USD/ay. Rule Guard
sayfasında iki varyantta da "ya da yıllık 99 USD" yazar. Varyant ziyaretçiye rastgele atanır ve
tarayıcıda saklanır (aynı kişi hep aynı fiyatı görür). Sayfalar neyin beta'da, neyin demo
hesapta testte, neyin planlanıyor olduğunu etiketle açıkça söyler.

## 2. Ne ölçülüyor

Uç: `/api/talep` (`api/_lib/talep.ts`). Depo: Upstash (köprü ve lisansla aynı).

| Olay | Ne zaman |
|---|---|
| `goruntuleme` | Sayfa açılınca, oturum başına bir kez |
| `fiyat-tik` | Fiyat kartındaki "Get early access" düğmesine tıklanınca (üstteki düğme sayılmaz; fiyatı görmeden tıklanır) |
| `form-gonder` | Erken erişim formu onayla gönderilince; aynı e-posta aynı sayfada ikinci kez sayılmaz |

Her sayaç gün, sayfa, varyant, kaynak (`?ref=` ya da `utm_source`) ve dil kırılımında tutulur.
Form kaydı: e-posta, üç anket cevabı, varyant, kaynak, dil, zaman, onay metni sürümü. Ham IP
saklanmaz; hız sınırı için IP'nin tuzlu özeti en çok 1 saat tutulur. Form kayıtları 13 ay sonra
kendiliğinden silinir (gizlilik politikası 2.10 ve 5).

Özet almak (Upstash bilgileri ortamdayken, site kökünden):

```
vercel env pull .env.talep --environment=production
set -a; . ./.env.talep; set +a
node yerel/talep-ozet.mjs
node yerel/talep-ozet.mjs --csv ~/Desktop/talep.csv
rm .env.talep
```

`.env.talep` sırlar içerir; repoya eklenmez, iş bitince silinir. CSV e-posta içerir; paylaşılmaz.
Yerel deneme: `node yerel/sahte-upstash.mjs 8796` ve
`UPSTASH_REDIS_REST_URL=http://127.0.0.1:8796 UPSTASH_REDIS_REST_TOKEN=yerel node yerel/site-sunucu.mjs 8793`.

## 3. Kanal kodları (`?ref=`)

Her paylaşımda bağlantıya kanal kodu eklenir; özet bu kodla kırılır. Kod küçük harf, rakam ve
tire, en çok 32 karakter. Biçim dışı kodlar `diger`, kodsuz gelişler `dogrudan` sayılır.

| Kod | Kanal | Örnek bağlantı |
|---|---|---|
| `ff` | Forex Factory gönderi ya da imza | `https://kalibremarkets.com/rule-guard?ref=ff` |
| `mql5` | MQL5 forum, profil, Code Base açıklaması | `https://kalibremarkets.com/rule-guard?ref=mql5` |
| `dc-<sunucu>` | Discord (örn. `dc-ftmo`, `dc-fundednext`) | `https://kalibremarkets.com/rule-guard?ref=dc-ftmo` |
| `rd-<alt>` | Reddit (örn. `rd-propfirm`, `rd-forex`, `rd-algotrading`) | `https://kalibremarkets.com/mt5-analytics?ref=rd-forex` |
| `x` | X gönderi ya da yanıt | `...?ref=x` |
| `yt` | YouTube yorum ya da açıklama | `...?ref=yt` |
| `tg` | Telegram grubu | `...?ref=tg` |
| `li` | LinkedIn | `...?ref=li` |
| `eposta` | Doğrudan e-posta | `...?ref=eposta` |
| `gorusme` | Görüşmede paylaşılan bağlantı | `...?ref=gorusme` |
| `beta` | Mevcut beta testçileri | `...?ref=beta` |

## 4. Başarı eşikleri (4. hafta sonunda, sayfa başına)

Reklam olmadığı için trafik az olacak. Oranlar ancak yeterli ziyaret varsa okunur; az ziyarette
mutlak sayılar ve görüşmeler belirleyicidir. Eşikler raporun 6.4 bölümünden uyarlandı; çapası
olmayanlar Kalibre'nin iç seçimi.

| Ölçüt | Devam | Belirsiz | Vazgeç | Not |
|---|---|---|---|---|
| Tekil görüntüleme (oturum) | 150 ve üstü | 75-150 | 75'in altı | Altındaysa sonuç "veri yetersiz"; kanal planı gözden geçirilir |
| Görüntüleme → form | %8 ve üstü | %4-8 | %4'ün altı | Unbounce 2024 finans medyanı %8,3 (ücretli trafik); organik trafik için iyimser değil |
| Mutlak kayıt (onaylı e-posta) | 30 ve üstü | 15-29 | 15'in altı | İç eşik |
| Görüntüleme → fiyat tıklaması | %3 ve üstü | %1,5-3 | %1,5'in altı | İç eşik |
| B (29 USD) varyantının A'ya göre fiyat tıklaması kaybı | %30'dan az | %30-50 | %50'den fazla | Az veride yalnız yön gösterir |
| Görüşmede son 12 ayda bir trading aracına ödeme yaptığını söyleyen | %60 ve üstü | %40-60 | %40'ın altı | İç eşik |
| Görüşmede taahhüt (bkz. 6. bölüm) | 15 görüşmeden 5 ve üstü | 3-4 | 2 ve altı | İç eşik |
| Rule Guard: sınav sayısı "2-3" ve üstü diyen kayıt oranı | %50 ve üstü | %30-50 | %30'un altı | Tekrar alıcı olma işareti; iç eşik |
| MT5 Analytics: "Hiçbiri" ya da "Tablo" diyen kayıt oranı | %40 ve üstü | %20-40 | %20'nin altı | Ücretsiz rakiplerden memnun olmayanların payı; iç eşik |

## 5. Dört haftalık takvim

| Hafta | İş |
|---|---|
| 0 (canlıya alma) | Sayfalar canlıda; `/api/talep` Upstash'e yazıyor mu kontrol (`talep-ozet.mjs`). Kanal listesi ve kurallar okunur (aşağıda). |
| 1 | Forex Factory ve MQL5 forumunda değer veren 2-3 gönderi (bkz. 7); 3 prop Discord'unda kural sorularına yanıt; ilk 5 görüşme daveti. Beta testçilerine `?ref=beta` ile iki sayfa. |
| 2 | 5-7 görüşme. İlk özet: kaynak bazında görüntüleme ve kayıt. İşe yaramayan kanal bırakılır. |
| 3 | 5-7 görüşme. Gerekirse MQL5'e ücretsiz, yerel çalışan bir lite koruyucu (ayrı karar; yalnız 1-2. hafta sinyali güçlüyse). |
| 4 | Son görüşmeler, CSV dışa aktarımı, eşik tablosunun doldurulması, karar. |

## 6. Görüşme (15-20 kişi, 25 dakika, Mom Test usulü)

Kural: geçmişte ne yaptığını sor, gelecekte ne yapacağını sorma. Ürünü en sona bırak. Ödeme ya da
ön sipariş isteme (ödeme kapalı).

**Tarama (Rule Guard):** son 6 ayda en az bir prop sınavı aldı; MT5 kullanıyor; son 12 ayda en az
bir trading aracına para ödedi. Kotalar: yaklaşık 5 kişi şu an sınavda, 5 kişi son 3 ayda sınav
kaybetmiş, 5 kişi fonlanmış.

**Tarama (MT5 Analytics):** MT5'te kendi hesabıyla işlem yapıyor; son 3 ayda hesabını bir araçla
(Myfxbook, FX Blue, günlük, tablo) incelemiş ya da incelemeyi denemiş.

**Sorular (İngilizce; görüşmeler İngilizce yapılır):**

1. "Tell me about your last challenge. How did it end?" (Kayıpsa: "What happened on that day, step by step?")
   Not: kuralı mı yoksa stratejiyi mi suçluyor, ayır.
2. "How does your firm calculate the daily loss limit? Walk me through it."
   Not: yanlış ya da eksik anlatıyorsa acı doğrulanır (raporda Forex Factory konusunda 20 gönderinin 12'si bu konudaydı).
3. "What do you use today to stay inside the limits? When did you last pay for a trading tool, how much, and why?"
4. "Which tools did you stop using? Why?"
5. (MT5 Analytics) "How do you review your trades today? Show me, if you can."
6. "Do you backtest or replay before a challenge? With what, how often?"
7. En sonda kısa gösterim (Prop Shield hesaplayıcısı ve Pano örneği), sonra taahhüt sorusu.

**Taahhüt (ödeme olmadan):** şunlardan biri taahhüt sayılır:
- Kalibre Bridge beta'yı demo ya da challenge hesabında iki hafta boyunca haftada en az bir kez açmayı kabul etmek ve bunu yapmak (Bridge salt okur; Kalibre Engine testçilere verilmez),
- gerçek hesap verisiyle (ekran paylaşımı, hesap numarası gizli) ikinci bir 20 dakikalık oturuma gelmek,
- bir başka trader'ı görüşmeye yönlendirmek.

Her görüşmeden sonra tek satır not: araçlara harcadığı para, son kayıp nedeni, kuralı doğru
anlattı mı, taahhüt (evet/hayır, hangisi), kaynak kodu.

## 7. Kanal planı (organik, reklamsız)

İlke: önce değer, sonra bağlantı. Kuralları okunmayan yerde paylaşım yapılmaz. Spam, toplu DM,
sahte hesap ve "bu aracı denedim, harika" türü gizli tanıtım yok. Kalibre adına yazıldığı her
zaman açıkça söylenir.

| Kanal | Ne paylaşılır | Dikkat |
|---|---|---|
| Forex Factory | Günlük kayıp kuralının firma firma nasıl hesaplandığını anlatan bir konu; Prop Shield hesaplayıcısı (`/prop#calculate`) | Forumun tanıtım kurallarını oku; ticari bağlantı imza ya da ilgili yanıtta |
| MQL5 forum ve Code Base | Günlük taban hesabının MQL5 kodu örneği (eğitim), sonra profilde bağlantı | Forumun tanıtım kurallarını oku; MQL5 Market kuralları üçüncü taraf lisans sistemini yasaklar, Code Base ya da Market ürünü ayrı karar |
| Prop firması Discord'ları | Kural sorularına yanıt; istenirse hesaplayıcı bağlantısı | Çoğu sunucu tanıtımı yasaklar; moderatöre sor |
| Reddit (r/Forex, r/Daytrading, r/algotrading, r/propfirm) | Yöntem anlatan gönderi (örn. backtest aşırı uyum kontrolü) | Her alt forumun kendi tanıtım kuralı var; araçlar Reddit'i okuyamadı, kurallar elle okunmalı |
| X ve YouTube | Kural hesaplarını anlatan kısa içerik, ilgili yorumlara yanıt | Yanıtlar konuya katkı vermeli |
| Mevcut beta testçileri | İki sayfanın bağlantısı (`?ref=beta`) ve görüşme daveti | En sıcak kitle |

## 8. Mesaj şablonları (İngilizce; kısa, dürüst)

**Discord / forum yanıtı (soru soran birine):**

> At FTMO, the daily loss limit is measured from your balance at the start of the day (midnight CE(S)T), so a winning morning doesn't widen it. Other firms differ, so check yours. I built a small calculator that shows your floor and the room left: https://kalibremarkets.com/prop?ref=dc-ftmo#calculate (I work on Kalibre, the tool behind it.)

**Görüşme daveti (bekleme listesinden):**

> Hi, thanks for joining the Rule Guard early access list. I'm talking to 15 prop traders this month about how they handle loss limits. Would you have 25 minutes for a call this week? No sales pitch, I'm trying to learn what actually goes wrong. Reply with a time that suits you.

**Görüşme daveti (forumda tanıştığın biri):**

> Hi, I saw your post about failing on the daily limit. I'm researching how traders track prop firm rules and would value 25 minutes of your time. Nothing to buy. Would that work this week?

**Beta testçilerine:**

> We're deciding what to build next and need your view. Two pages describe the options: https://kalibremarkets.com/rule-guard?ref=beta and https://kalibremarkets.com/mt5-analytics?ref=beta. If one of them matters to you, join its early access list. If you have 20 minutes for a call, reply to this email.

## 9. Karar kuralı (4. haftanın sonunda)

1. Bir sayfa "Devam" sütununda en az şu üç ölçütü sağlarsa o segment seçilir: mutlak kayıt,
   görüşme taahhüdü ve sayfaya özgü anket ölçütü. Oranlar yalnız 150 ve üstü görüntülemede sayılır.
2. İki sayfa da sağlarsa taahhüt sayısı yüksek olan seçilir; eşitse Rule Guard (rapordaki ödeme
   kanıtı daha güçlü).
3. Seçilen segment için yalnız sayfada "planlanıyor" yazan ve görüşmelerde en çok istenen tek
   özellik yapılır (Rule Guard için muhtemelen sınav paneli ya da haftalık rapor; MT5 Analytics
   için replay). Ödemeler şirket ve ödeme sağlayıcı onayı olmadan açılmaz.
4. Fiyat: B'nin tıklama kaybı %30'dan azsa lansman fiyatı 29 USD, değilse 19 USD.
5. Hiçbir sayfa eşikleri sağlamazsa yeni geliştirme durur; görüşme notlarından yeni bir segment ya
   da teklif (örn. işlem günlüğü, replay) seçilip bu test tekrarlanır.
6. Sonuç `docs/KALIBRE-ANA-BELGE.md` ve bu belgeye tarih ve sayılarla yazılır.

## 10. Canlıya almak için

- Sayfalar ve uç `urun-sitesi` dalında. Canlıya alma kurucunun açık "canlıya al" onayıyla, `git pull` sonrası.
- Upstash değişkenleri Production'da mevcut (önekli adlar `redisBilgisi()` ile bulunur). İsteğe bağlı `TALEP_TUZ` (rastgele bir değer) Production'a eklenebilir; eklenmezse sabit tuz kullanılır.
- Canlıya aldıktan sonra her iki sayfada bir görüntüleme ve bir test kaydı yapıp `talep-ozet.mjs` ile görülür; test kaydı Upstash panelinden silinir (`talep:kayit:` ile başlayan anahtar).
- Gizlilik politikası (EN ve TR) erken erişim listesini anlatıyor; yer tutucular (ad, adres, ülke) hâlâ boş.
