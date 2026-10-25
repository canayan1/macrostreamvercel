// Aracı kurum veri kaynakları (Tradier, Alpaca) için ortak kayıt: sayfalar kaynağa göre istemci, ad ve
// seçenekleri buradan alır. MT5 köprüsü ayrı yoldan çalışır (veri/baglanti.js).

import { t as ceviri } from '../dil.js';
import { kayitliTradierIstemci, tradierOku, TRADIER_ZAMAN_DILIMLERI, etkinKaynak } from './tradier.js';
import { kayitliAlpacaIstemci, alpacaOku, ALPACA_ZAMAN_DILIMLERI } from './alpaca.js';

export const ARACI_KAYNAKLAR = ['tradier', 'alpaca'];
export const araciMi = k => ARACI_KAYNAKLAR.includes(k);
export { etkinKaynak };

export const ARACI = {
  tradier: {
    ad: 'Tradier', oku: tradierOku, istemci: kayitliTradierIstemci, zamanDilimleri: TRADIER_ZAMAN_DILIMLERI,
    ortamAdi: a => (a?.ortam === 'canli' ? ceviri('Canlı') : 'Sandbox'),
    not: o => ceviri('Tradier · {o}. Günlük ve haftalık seriler son 5 yıldır; gün içi seriler en çok 20 (1 dk) ya da 40 (5 ve 15 dk) gündür.', { o }),
    ornekSembol: 'AAPL',
  },
  alpaca: {
    ad: 'Alpaca', oku: alpacaOku, istemci: kayitliAlpacaIstemci, zamanDilimleri: ALPACA_ZAMAN_DILIMLERI,
    ortamAdi: a => (a?.ortam === 'canli' ? ceviri('Canlı') : 'Paper'),
    not: o => ceviri('Alpaca · {o}. Hisse fiyatları ücretsiz IEX akışındandır (tek borsa, tüm piyasa değil). Günlük ve haftalık seriler son 5 yıl, saatlik 2 yıl, 15/5/1 dakika 120/60/15 gündür. Kripto için BTC/USD gibi yaz.', { o }),
    ornekSembol: 'AAPL',
  },
};

// Etkin kaynak bir aracı kurumsa onun istemcisi; değilse null.
export function kayitliAraciIstemci(kaynak = etkinKaynak()) {
  return araciMi(kaynak) ? ARACI[kaynak].istemci() : null;
}
