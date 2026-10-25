// Gerçekçi maliyetler ve dolum modeli (gercekci-arayuz.js) için İngilizce karşılıklar.
// İçe aktarıldığında dil-en.js sözlüğüne eklenir. Anahtar Türkçe kaynak metindir.
import { EN } from './dil-en.js';

export const GERCEKCI_EN = {
  'Gerçekçi maliyetler ve dolum': 'Realistic costs and fills',
  'açık': 'on',
  'kapalı': 'off',
  'varsayılan': 'default',
  'Lot, kur çevrimi, lot başı komisyon, swap ve teminatı hesaba kat': 'Include lots, currency conversion, per-lot commission, swap and margin',
  'Sembol örneği': 'Symbol example',
  'Diğer (elle gir)': 'Other (enter manually)',
  'Baz para': 'Base currency',
  'Kote para': 'Quote currency',
  'Hesap para birimi': 'Account currency',
  'Sözleşme büyüklüğü': 'Contract size',
  'lot başına birim': 'units per lot',
  'Tick büyüklüğü': 'Tick size',
  'en küçük fiyat adımı': 'smallest price step',
  'Lot adımı': 'Lot step',
  'En az lot': 'Min lot',
  'En çok lot': 'Max lot',
  'Komisyon (lot başına, taraf başına)': 'Commission (per lot, per side)',
  'hesap para biriminde': 'in account currency',
  'Swap long': 'Swap long',
  'Swap short': 'Swap short',
  'lot başına gecelik, hesap para biriminde; eksi ödenir': 'per lot per night, in account currency; negative means you pay',
  'Kaldıraç': 'Leverage',
  '0 ise teminat denetimi yok': '0 means no margin check',
  'Stop out (%)': 'Stop out (%)',
  'teminat seviyesi': 'margin level',
  'Üç gecelik swap günü': 'Triple swap day',
  'Pazar': 'Sunday', 'Pazartesi': 'Monday', 'Salı': 'Tuesday', 'Çarşamba': 'Wednesday',
  'Perşembe': 'Thursday', 'Cuma': 'Friday', 'Cumartesi': 'Saturday',
  "Örnek değerler tipik bir standart hesaptandır, senin aracı kurumunla aynı olmayabilir. Kendi değerlerini MT5'te sembole sağ tıklayıp Specification penceresinden al ve burada düzelt. Yukarıdaki spread ve kayma da uygulanır; lot başı komisyon kullanıyorsan yüzde komisyonu 0 yap.":
    "Example values are from a typical standard account and may differ from your broker. Get your own values in MT5: right-click the symbol, open Specification, and correct them here. The spread and slippage above also apply. If you use per-lot commission, set the percent commission to 0.",
  'MT5 bağlıyken puan mesafeleri MT5 nokta büyüklüğüyle ({n}) hesaplanır. Kalibre Bridge sözleşme büyüklüğü, lot sınırları ve swap göndermez.':
    'With MT5 connected, point distances use the MT5 point size ({n}). Kalibre Bridge does not send contract size, lot limits or swap.',
  'Mum içi dolum modeli': 'Intrabar fill model',
  'Stop önce': 'Stop first',
  'Açılışa yakın uç önce': 'Extreme nearer the open first',
  'OHLC yolu': 'OHLC path',
  'M1 büyüteç': 'M1 magnifier',
  'Alt zaman dilimi dosyası (M1 büyüteç için)': 'Lower-timeframe file (for M1 magnifier)',
  'Aynı mumda hem stop hem hedef görüldüğünde hangisinin önce dolduğunu mum verisinden bilmek mümkün değildir. Model bu durumda ne varsayılacağını seçer. Sonuçta bu tür mumların sayısı gösterilir.':
    'When one candle touches both the stop and the target, the candle data cannot tell which filled first. The model sets the assumption for these cases. Results show how many such candles there were.',
  'Alt zaman dilimi: {n} mum yüklendi.': 'Lower timeframe: {n} candles loaded.',
  'Alt zaman dilimi dosyası okunamadı: {m}': 'Could not read the lower-timeframe file: {m}',
  'M1 büyüteç için alt zaman dilimi dosyası yüklenmedi; stop önce kabul edildi.': 'No lower-timeframe file loaded for the M1 magnifier, so stop first was used.',
  'Gerçekçi maliyetler uygulanmadı: {k} kotasyonlu bir sembolde {h} hesabı için kur serisi gerekir. Hesap para birimini {k} ya da {b} yap.':
    'Realistic costs were not applied: a {k}-quoted symbol in a {h} account needs a conversion series. Set the account currency to {k} or {b}.',
  'Dolum modeli: {m}. Belirsiz mum: {n} (işlemlerin %{o}).': 'Fill model: {m}. Ambiguous candles: {n} ({o}% of trades).',
  'Gerçekçi maliyetler: komisyon {k}, swap {s}, en az lot altında kalan giriş {m}, teminat yetmeyen giriş {t}, stop out {o}.':
    'Realistic costs: commission {k}, swap {s}, entries below min lot {m}, entries without enough margin {t}, stop outs {o}.',
  'Gerçekçi maliyetler açık': 'Realistic costs on',
  'Gerçekçi maliyetler kapalı': 'Realistic costs off',
  'lot, kur çevrimi, lot başı komisyon, swap ve teminat dahil': 'lots, currency conversion, per-lot commission, swap and margin included',
  'dolum modeli: {m}': 'fill model: {m}',
  'Optimizasyonun sonuç kimliği bu taslakta daha önce denenen ayar sayısını da içerir. Aynı taramayı tekrar çalıştırmak sayacı artırır, bu yüzden yeni bir kimlik verir.':
    'The optimization result ID also includes the number of settings tried earlier on this draft. Running the same scan again raises that count, so it gives a new ID.',
  // Çekirdek uyarıları (core/src/motor.js, enstrüman v2)
  'Verilen tick değeri ({v}) hesaplanandan ({h}) farklı; kâr sözleşme büyüklüğü ve kurla hesaplandı.':
    'The tick value given ({v}) differs from the computed value ({h}); profit was computed from contract size and the exchange rate.',
  '{n} girişte hesaplanan lot en küçük lotun altında kaldı; işlem açılmadı.': 'On {n} entries the computed lot was below the minimum lot, so no trade was opened.',
  '{n} girişte serbest teminat yetmedi; işlem açılmadı.': 'On {n} entries free margin was not enough, so no trade was opened.',
  'Teminat seviyesi {n} kez stop out sınırının altına indi.': 'Margin level fell below the stop-out level {n} times.',
  'Sentetik fiyatlar bu sembolün ölçeğinde değildir; lot ve maliyet sonuçları anlamlı olmayabilir. Gerçekçi maliyetleri kendi verinle kullan.':
    "Synthetic prices are not on this symbol's scale, so lot and cost results may not be meaningful. Use realistic costs with your own data.",
};

Object.assign(EN, GERCEKCI_EN);
