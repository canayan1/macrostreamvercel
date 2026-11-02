# Demo günü kontrol listesi

Her demo görüşmesinden önce, görüşmeden en az 30 dakika önce. Toplam 10 dakika.

## 1. Otomatik kontrol (2 dakika)

Site kökünde:

```bash
npm run e2e
```

Altı adımı gerçek Chromium'da canlı sitede koşar: demo talep formu (kayıt bırakmaz), Trade Analytics
örneği → hesap incelemesi, FX Blotter örneği → masa raporu → mühürlü paylaşım bağlantısı → ikinci
tarayıcıda açılış, backtest örneği, canlı masa (şef + trader, bir sinyal görüldü ve bitti; gecikme
yazdırılır). "6/6 passed" görünmeden görüşmeye girilmez. Kırmızı varsa önce `BASE=http://localhost:8793`
ile yerelde koş; yerelde geçip canlıda geçmiyorsa sorun deploy ya da Upstash'tedir.

## 2. Elle kontrol (5 dakika, demo yapılacak tarayıcıda)

- [ ] Tarayıcı: Chrome ya da Edge güncel; başka profil ya da gizli pencere değil (Desk Signal
      masa anahtarı bu tarayıcının depolamasında).
- [ ] Ekran paylaşımı açıkken bildirimler kapalı (macOS Odaklanma / Windows Rahatsız Etmeyin).
- [ ] https://kalibremarkets.com/demo açık; örnek dosyalar bu bilgisayara indirilmiş
      (fx-blotter-sample.xlsx, kalibre-trade-log-example.xlsx) ki "kendi dosyanı bırak" hareketi
      canlıda gösterilebilsin.
- [ ] FX Blotter örneği açıldı, rapor sayfası açıldı, paylaşım bağlantısı üretildi ve not alındı
      (yedek: bağlantı kopmazsa raporu bu linkten gösterirsin).
- [ ] Trade Analytics örneği açıldı, hesap incelemesi açıldı.
- [ ] Desk Signal: "Demo masası" adıyla masa kuruldu, davet bağlantısı telefona gönderildi, telefondan
      trader olarak katılındı ve bir sinyal gidip geldi. Görüşmede trader ekranı telefon olur.
- [ ] Müşteri kendi dökümünü getirecekse: önce anonimleştirildi mi diye sor; dosyayı görüşmeden önce
      senin tarayıcında dene (tarayıcıdan çıkmaz). Sütun eşleşmedi uyarısı gelirse eşleştirmeyi
      görüşmeden önce yap.

## 3. Yedek plan

- İnternet ya da site: örnek sonuç dosyaları (`/lab/samples/*-result.xlsx`) yerelde açık dursun;
  rapor sayfası PDF olarak önceden kaydedilmiş olsun.
- Upstash ya da röle: paylaşım bağlantısı ve canlı masa düşer; rapor sayfası ve demolar (tarayıcı içi)
  çalışmaya devam eder. Desk Signal için `/lab/desk` (sunucusuz demo) gösterilir.
- Müşteri dosyası okunmazsa: "sütunları ekranda eşleştiriyoruz" adımını göster; okunmayan satırlar
  gerekçesiyle listelenir. Dosyayı görüşme sonrası (anonim) iste, sözlüğe ekle, testini yaz.

## 4. Görüşme sonrası (5 dakika)

- [ ] Tek soru soruldu mu: "Bunu masanızda bir hafta denemek ister misiniz?"
- [ ] Liste dosyasına yanıt, demo tarihi, not.
- [ ] Yeni bir dosya biçimi ya da istek çıktıysa `kalibre-lab/lab/test/musteri-dosyasi.test.mjs`'e
      vaka olarak eklenir; önce test, sonra sözlük.
