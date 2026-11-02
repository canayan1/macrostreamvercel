# Mailing planı (2 Kasım 2026)

Amaç: iki ürün demo alınabilir hale gelince potansiyel müşterilere doğrudan e-posta ile ulaşmak.
Hedef çıktı demo görüşmesi; satış değil. Fiyat e-postada yazılmaz ("contact us" kararı).

## 1. Başlamadan önce (ön koşullar)

Claude tarafı (yapıldı, önizlemede):
- `/request-a-demo` sayfası: dört soru (ürün, kurum, kişi sayısı, kayıt kaynağı), e-posta, onay.
  Kayıt Upstash'e (`talep:kayit:demo:*`), `?product=analytics|desk-signal` ürünü önceden seçer,
  `?ref=<kampanya>` kaynağı kaydeder. Tüm "Contact us for pricing" düğmeleri buraya gider.
- Her form kaydında kurucuya e-posta bildirimi (`api/_lib/bildirim.ts`, Resend). Anahtar yoksa
  bildirim atlanır, kayıt yine düşer.

Can tarafı:
1. Vercel ortam değişkenleri (Production + Preview): `RESEND_API_KEY`, `TALEP_BILDIRIM_KIME`
   (bildirimin gideceği adres). `TALEP_BILDIRIM_KIMDEN` boş kalabilir; Resend'in test göndericisi
   yalnız hesap sahibinin adresine ulaşır, alan adı doğrulaması gerekmez. Kendi alan adından
   gönderim istenirse Resend'de domain doğrulanır ve bu değişkene yazılır.
2. "canlıya al": önizlemedeki iki ürünlü site, rapor sayfaları ve demo talep sayfası canlıya alınmadan
   mailing başlamaz (bağlantılar kalibremarkets.com'a gider).
3. Vercel Pro: ilk ücretli müşteriden önce şart (Hobby ticari kullanıma kapalı). Mailing için şart değil.
4. Gönderici adres: markets@kalibrefin.com'dan mı, kişisel adresten mi? Öneri: ilk 100 e-posta
   Can'ın kendi adından, kişisel, tek tek (toplu araç yok). Yanıt oranı toplu araçtan yüksek,
   spam riski düşük.
5. İmza: ad, "Founder, Kalibre Markets", eski banka hazine deneyimi tek satır, site bağlantısı.

Hukuki not (kaynak doğrulanmadan metne girmez): B2B iş adresine, ürünle ilgili tek seferlik
e-posta; her e-postada "reply 'no' and I will not write again" satırı. KVKK/GDPR için meşru menfaat
dayanağı ve çıkış seçeneği yeterli sayılır; kesin karar Can'ın hukuk danışmanında.

## 2. Segmentler ve sıra

| Sıra | Segment | Ürün | Kaynak | Hedef |
|---|---|---|---|---|
| 1 | Banka ve kurumsal hazine FX masaları (Türkiye, Körfez, Londra) | Analytics (FX Blotter + rapor) | Can'ın ağı; LinkedIn | 30 kişi, 5 demo |
| 2 | Prop firmaları ve 5-20 kişilik masalar | Desk Signal (+ Trade Analytics) | LinkedIn, Discord/forum yöneticileri | 40 kişi, 5 demo |
| 3 | Aracı kurumlar ve küçük fonlar | Analytics | Can'ın ağı | 20 kişi, 3 demo |

Önce 1. segment: Can'ın tanıdığı masalar, kişisel e-posta, "senin masanın dökümünde 30 dakika".
Kapı açılırsa referans ister, 3. segmente geçilir. 2. segment paralel ama ayrı metinle.

## 3. Liste

Şablon: `docs/satis/contacts-sablon.csv` (Apps Script sütun sırası; kurulum `docs/satis/KURULUM.md`). Sütunlar: ad, soyad, unvan, kurum, şehir, e-posta,
segment, kaynak, ilişki (tanıdık/soğuk), kampanya kodu, gönderim tarihi, yanıt, demo tarihi, not.
Liste repoya girmez (kişisel veri); yalnız şablon girer. Can listeyi yerelde tutar.

Kampanya kodu her e-postadaki bağlantıya `?ref=` olarak eklenir, örnek
`https://kalibremarkets.com/request-a-demo?product=analytics&ref=tr-bank-1`.
Böylece hangi dalganın form getirdiği `node yerel/talep-ozet.mjs` ile görülür.

## 4. Kadans

- Günde 10-15 e-posta, hafta içi sabah (alıcının saatine göre 08:30-10:00).
- 1. e-posta → 4 iş günü sonra kısa hatırlatma → 7 iş günü sonra son e-posta (farklı açı) → kapat.
- Yanıt gelince 24 saat içinde iki zaman önerisiyle dönülür; demo 30 dakika, örnek dosyada.
- Her demo sonunda tek soru: "Bunu masanızda bir hafta denemek ister misiniz?"

## 5. Taslaklar (İngilizce; kişiselleştirilecek yerler köşeli parantezde)

### 5a. Segment 1, ilk e-posta (FX masası, Analytics)

Subject: [Desk name] end-of-day blotter, explained in seconds

Hi [First name],

I ran a bank treasury desk for [n] years, and the end of every day was the same: export the
blotter, rebuild the P&L in Excel, chase the row that did not reconcile.

I built Kalibre Markets Analytics to make that a one-step job. You drop the blotter as your
platform or treasury system exports it. In your browser, without an upload, you get P&L by pair
and dealer with price and points apart, carry, MTM, net position by value date, limit usage and
seven reconciliation checks. One click turns it into the desk report your management and risk
teams read, as a PDF or a sealed read-only link.

Nothing is installed and no file leaves the building. Trade tickets that arrive by email can be
pasted straight in.

Could I show it to you on our sample blotter, or on one anonymized day of yours? Thirty minutes,
any day next week.

[Sample blotter, opens in the browser]: https://kalibremarkets.com/lab/blotter?file=samples/fx-blotter-sample.xlsx
[Request a demo]: https://kalibremarkets.com/request-a-demo?product=analytics&ref=[code]

Reply "no" and I will not write again.

[Name]
Founder, Kalibre Markets

### 5b. Segment 2, ilk e-posta (prop firması / küçük masa, Desk Signal)

Subject: One key from the head of desk to every trader's screen

Hi [First name],

When a head of desk needs ten traders to cut risk now, a chat message is the slow way: find the
window, type, hope it is read.

Desk Signal replaces that with one key. The head picks a colour with an agreed meaning, picks a
trader, a city or everyone, and the signal lights up in the corner of each screen. Urgent signals
ring until opened; the head sees who has seen it and who has done it, with time to respond. Every
signal is logged to the second and downloads as CSV or Excel.

Traders open an invite link in a browser tab. Nothing to install. Signals are sealed in your
browsers; our relay cannot read them.

The demo runs in your browser with no sign-up: https://kalibremarkets.com/lab/desk
If it looks useful, I can set up a live desk for your team in thirty minutes:
https://kalibremarkets.com/request-a-demo?product=desk-signal&ref=[code]

Reply "no" and I will not write again.

[Name]
Founder, Kalibre Markets

### 5c. Hatırlatma (her iki segment, 4 iş günü sonra)

Subject: Re: [original subject]

Hi [First name],

Short follow-up in case the first note sank. The sample opens in the browser and takes two
minutes: [link]. If the timing is wrong, a one-line reply with a better month is enough.

[Name]

### 5d. Son e-posta (7 iş günü sonra, farklı açı)

Subject: Closing the loop

Hi [First name],

Last note from me. One question that helps me either way: at the end of the day, which number on
your desk takes the longest to trust? If it is the P&L, the position or the reconciliation,
Kalibre was built for exactly that. If it is something else, I would like to know what.

Either way, thank you for reading.

[Name]

## 6. Ölçüm

Haftalık tablo: gönderilen, açılan (bilinmez; kişisel e-postada takip yok), yanıt, demo, pilot.
Form kayıtları ve `?ref` kırılımı: `node yerel/talep-ozet.mjs --csv talep.csv` (Can, `vercel env pull` ile).
Hedef ilk 4 hafta: 90 e-posta, 10 yanıt, 5 demo, 2 pilot.
