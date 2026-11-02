# Satış hattı kurulumu (Google Workspace, sıfır maliyet)

Posta markets@kalibrefin.com Google Workspace'te; bu yüzden n8n, lemlist ya da sunucu gerekmez.
Her şey Workspace'in içinde döner: bir Google Sheet (CRM), Gmail taslakları ve bir Apps Script.
Gönderme tuşuna yalnız Can basar.

## 1. Google Sheet (CRM)

Drive'da yeni bir Sheet aç, adı "Kalibre Outreach". Üç sayfa:
- **Contacts**: başlık satırı `docs/satis/contacts-sablon.csv` ile aynı sırada (first, last, title, company,
  city, email, segment, source, relation, campaign, status, first_sent, follow1_sent, follow2_sent, replied,
  thread_id, note). Yeni kişi eklerken status = `ready`, segment = `fx-desk` | `prop` | `broker` | `sales-desk`,
  campaign = kısa kod (örn. `tr-bank-1`). Diğer sütunları betik doldurur.
- **Templates**: `docs/satis/templates.csv` içeriği (key, subject, body). Yer tutucular: {first} {last}
  {company} {city} {demo_link} {sample_link} {sender}. Metni Sheet'te düzeltmek yeter, betik değişmez.
- **Log**: boş; betik yazar.

Sheet kimliği adres çubuğunda `/d/<ID>/edit` kısmındadır.

## 2. Apps Script

script.google.com → New project → `kalibre-satis.gs` içeriğini yapıştır → `SHEET_ID` ve `SENDER_NAME`
değerlerini yaz → üstten `setup` fonksiyonunu bir kez çalıştır (Gmail ve Sheets izni yalnız bu betiğe,
yalnız bu hesaba verilir) → her sabah 07:00 tetikleyicisi kurulur.

Betik ne yapar:
1. `ready` satırlar için ilk e-postayı Gmail'e **taslak** olarak koyar (günde en çok 15), satırı `drafted` yapar,
   taslağı `Kalibre/Draft` etiketiyle işaretler.
2. Sen taslağı gönderince ertesi sabah bunu fark eder: `sent`, gönderim tarihi, etiket `Kalibre/Sent`.
3. Yanıt yoksa 4. iş günü aynı konuşmanın altına hatırlatma taslağı (`follow1-drafted`), 11. iş günü son
   e-posta taslağı (`follow2-drafted`); ikisi de gönderince dizi `closed`.
4. Yanıt gelince dizi durur: `replied`; yanıt "no", "not interested", "unsubscribe" ile başlıyorsa `declined`.
5. `weekly` fonksiyonu kampanya bazında gönderilen / yanıt / ret sayılarını sana e-postalar
   (isteğe bağlı haftalık tetikleyici).

## 3. Günlük 10 dakika

Sabah Gmail'de `Kalibre/Draft` etiketini aç, taslakları oku, gerekirse bir cümle ekle, gönder.
Yanıtları kendin yazarsın; Claude isterse yanıt taslağı hazırlar (Gmail bağlantısı açıkken).

## 4. Claude'un rolü

- Kişi listesini zenginleştirir (unvan, şehir, segment, kampanya kodu) ve Sheet'e yazar.
- Taslakları kişiye göre düzenler; Gmail bağlantısı varsa taslağı doğrudan yazar, yine göndermez.
- Haftalık sayıları okur, metni ve segmenti buna göre düzeltir.

## 5. Hukuk ve teslimat

- B2B iş adresine, ürünle ilgili, tek dizi (en çok 3 e-posta); her e-postada "reply no" satırı.
- Günde en çok 15 yeni ilk e-posta; Workspace alan adının itibarı korunur.
- Liste ve Sheet repoya girmez; bu klasörde yalnız şablonlar ve betik durur.
