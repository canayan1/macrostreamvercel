# Talep programı (4 Kasım 2026, 3 hafta)

Neden: 26.10'daki "talep görülmeden ürün geliştirilmez" kuralından bu yana hiçbir talep ölçümü
kaydedilmedi (denetim 4.11). Bu belge ölçümü başlatır. `MAILING-PLANI.md` (kadans, taslaklar) ve
`TALEP-TESTI.md` (uç, kanal kodları) olduğu gibi geçerli; burada yalnız eksikler var:
segment hipotezleri, liste çıkarma yöntemi, family office, kayıt kanalları ve karar eşiği.

Kararlar (Can, 4.11.2026):
- Kurucu göndermesi hiçbir dış metinde geçmez (site, e-posta, profil). Gönderenin adı ve posta
  adresi yasal zorunluluk olduğu için e-posta imzasında kalır.
- Family office hedef segmenttir; talep görülürse şirket hemen kurulur.
- Benzer B2B ürünlerin müşterileri kamuya açık kaynaklardan çıkarılır ve e-posta ile ulaşılır.
- Bu süre boyunca yeni özellik yok. Düzeltme ve ölçüm var.

## 1. Segmentler, hipotez ve "aha" demosu

| # | Segment | Ürün | Hipotez (tek cümle) | 30 dk demoda gösterilen |
|---|---|---|---|---|
| 1 | Orta ölçekli şirket hazineleri (ihracatçı, çok para birimli; TR, Körfez, Londra) | FX Blotter | Gün sonu blotter'ı Excel'de yeniden kuran masa, 7 kontrol ve ayrışmış P&L için ayda masa başı ücret öder | Örnek blotter → 7 kontrol → bir totali tıklayıp işlemleri açmak |
| 2 | Küçük banka ve aracı kurum dealing masaları (5-20 kişi) | Desk Signal (+ Trade Analytics) | Şef, chat yerine kimin gördüğü kayıtlı tek tuş sinyali için koltuk başı öder | Demo masa: sinyal gönder, 20 sn'de kırmızı, log indir |
| 3 | Tek aileli, kendi masası olan family office'ler | Analytics (Trade Analytics + FX Blotter) | İçeride işlem yapan FO, kendi işlem kaydından kural ve hata raporunu dış denetim gibi ister | MT5 raporu ya da trade log → segments → prop/kendi limitleri |
| 4 | Prop sınavı trader'ı (B2C) | Rule Guard | Ücretsiz Watch'u yükleyen, Protect ve rapor için ay­lık öder | MQL5 Market ve forum; e-posta yok |

Segment 4 e-posta programının dışında; kanalı `docs/satis/KAYIT-KITI.md` (MQL5 Market, FPA, Reddit).

## 2. Liste çıkarma (kamuya açık kaynaklar, kişisel adres yok)

Hedef: segment başına 50 isimli kişi, 3 haftada toplam 150. Yalnız kurumsal e-posta adresi.

| Kaynak | Ne verir | Nasıl |
|---|---|---|
| Rakip "customers" ve vaka çalışması sayfaları (Kyriba, GTreasury, ION/Reval, 360T, FXall, FX Blue, Myfxbook, Edgewonk) | O aracı kullanan kurumlar | Kurum adı → LinkedIn'de unvan araması |
| İş ilanları ("Kyriba experience", "360T", "treasury dealer", "FX desk") | Kurum, ekip büyüklüğü, kullanılan sistem | LinkedIn Jobs, Indeed, kariyer.net; ilan metni not alınır |
| G2/Capterra yorumları (Treasury Software kategorisi) | Şikâyet eden kullanıcı = değişmeye yakın müşteri | Yorumcu adı ve kurumu çoğu zaman görünür |
| Konferans sponsor ve konuşmacı listeleri (EuroFinance, AFP, ACT; FO için Campden, FOX, Prestel) | Masa şefleri ve hazine müdürleri | Program PDF'leri |
| LinkedIn unvan araması | "Head of FX desk", "treasury dealer", "chief dealer", "family office trader", "CIO single family office" | Haftada 50 bağlantı isteği sınırı |
| Simple ve familyoffice-software.com dizinleri | FO hizmet sağlayıcıları (danışman üzerinden giriş) | Tanıtım isteyen danışmanlar ayrı liste |

Liste repoya girmez; `docs/satis/contacts-sablon.csv` sütunlarıyla Can'ın tablosunda tutulur.
`segment` sütununa 1-4, `source` sütununa yukarıdaki kaynak adı yazılır; sonunda hangi kaynağın
yanıt getirdiği görülür.

Hukuk: kurumsal adrese B2B, ürünle ilgili, tek konu, her e-postada "reply no" satırı ve gönderenin
posta adresi (CAN-SPAM, GDPR meşru menfaat, UK PECR kurumsal abone). Kişisel adreslere (gmail vb.)
gönderim yok. Bu yorum doğrulanmış hukuki görüş değildir; avukat brifingine girer.

## 3. Haftalık plan

| Hafta | İş | Çıktı |
|---|---|---|
| 0 (bu hafta) | PR #2 birleşir ve canlıya alınır; yasal yer tutucular dolar; demo formuna "nereden duydunuz" alanı. Fiyat sitede gösterilmez (karar 1.11); aralık demoda sözlü verilir: masa başı aylık 200 USD'den, koltuk başı 15 USD'den (öneri, Can onaylar) | Sayılabilir huni |
| 1 | Segment 1 ve 2 listesi (50+50); kayıt kanalları (G2, Capterra, AFP, CTMdirectory, Trustpilot, FPA, LinkedIn sayfası); MQL5 Market seller başvurusu | 100 isim, 7 profil |
| 1-2 | İlk e-postalar, günde 10-15; Segment 3 listesi (50) | 150 gönderim |
| 2-3 | Hatırlatma ve son e-posta; demolar; her demoda 3 keşif sorusu | Görüşme notları |
| 3 sonu | Sayılar ana belgeye yazılır; karar | Devam / değiştir / durdur |

Keşif soruları (satış değil): Bugün bu işi nasıl yapıyorsunuz? En son ne zaman canınızı yaktı?
Buna bütçesi olan kim? Cevaplar `note` sütununa.

## 4. Eşikler ve karar (3 hafta sonunda)

| Ölçü | Devam | Yeniden düşün |
|---|---|---|
| Yanıt / gönderim | ≥ %10 (15/150) | < %5 |
| Demo | ≥ 5 | ≤ 2 |
| Pilot taahhüdü (bir hafta kendi verisiyle) | ≥ 2 | 0 |
| Segment başına en az 1 demo | evet | bir segment sıfırsa o segment düşer |
| Demoda söylenen fiyat aralığına itiraz | demoların yarısından azı | çoğu "pahalı" derse aralık düşer, çoğu "ucuz" derse yükselir |

Hiçbir eşik tutmazsa: ürün değil mesaj ya da segment yanlıştır; bir hafta içinde ikinci bir
mesaj varyantıyla aynı listeye değil yeni 50 kişiye gidilir. İkinci tur da tutmazsa ürün kapsamı
daraltılır (tek ürün).

Family office özel kuralı: bu segmentten 1 pilot taahhüdü gelirse şirket kuruluşu başlar
(STRATEJI-INCELEMESI §5.1: ilk masa görüşmesinden önce şirket gerekir; FO için pilot öncesi yeter).

## 5. Ölçüm altyapısı (bir gün iş, hafta 0)

- Demo formu: "How did you hear about us?" seçenekleri = kanal adları (`?ref` ile aynı kodlar).
- `node yerel/talep-ozet.mjs --csv` haftalık; sayılar `KALIBRE-ANA-BELGE.md` §12'ye yazılır.
- Satış tablosu (`docs/satis/kalibre-satis.gs`): haftalık özet sekmesi: gönderim, yanıt, demo, pilot,
  segment ve kaynak kırılımı.
- Kayıt kanalları takip tablosu: `docs/satis/KAYIT-KITI.md`; kanal araştırması `docs/satis/KANALLAR.md`.
