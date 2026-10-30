// FX Blotter Analizi etiketleri (Türkçe kaynak metin; ekranda ve sonuç dosyalarında t() ile çevrilir).

export const TUR_AD = { gerceklesen: 'Gerçekleşen', swap: 'Swap (roll)', ndf: 'NDF uzlaşma', mtm: 'MTM', tasima: 'Taşıma' };
export const DEGER_AD = { musteri: 'Müşteri', interbank: 'İnterbank', 'grup-ici': 'Grup içi', bilinmiyor: 'Bilinmiyor', spot: 'Spot', forward: 'Vadeli', swap: 'Swap', ndf: 'NDF', ...TUR_AD };
export const LIMIT_AD = { 'nop-doviz': 'NOP {d}', gece: 'Gece pozisyonu', gunici: 'Gün içi tepe: {a}', 'stop-loss': 'Günlük zarar: {a}', 'valor-araligi': 'Valör aralığı {d} {k}' };
export const LIMIT_DURUM = { asildi: 'Aşıldı', yakin: 'Yakın', icinde: 'İçinde', hesaplanamadi: 'Hesaplanamadı' };
export const GEREKCE_AD = {
  opsiyon: 'Opsiyon (desteklenmiyor)', iptal: 'İptal', reddedildi: 'Reddedildi', 'eski-surum': 'Eski sürüm (aynı işlem no daha aşağıda)', onaysiz: 'Onaysız / beklemede',
  'toplam-satiri': 'Toplam satırı', 'baslik-oncesi': 'Rapor başlığı satırı', 'tutar-kur-tutarsiz': 'Tutar ve kur tutarsız', 'valor-islem-tarihinden-once': 'Valör işlem tarihinden önce',
  'bilinmeyen-doviz': 'Bilinmeyen döviz', 'tek-bacakli-swap': "Swap'in diğer bacağı yok", 'ndf-fixing-eksik': 'NDF fixing tarihi yok', 'bos-zorunlu-alan': 'Zorunlu alan boş',
  'tarih-okunamadi': 'Tarih okunamadı', 'tutar-okunamadi': 'Tutar okunamadı', 'yon-okunamadi': 'Yön okunamadı',
};
export const UYARI_AD = { 'tekrar-eden-islem-no': 'Aynı işlem no tekrar ediyor; son satır geçerli sayıldı', 'swap-baglanti-onerildi': 'Swap bacakları işlem no sonekinden bağlandı', 'dengesiz-swap': 'Swap bacak tutarları farklı; roll sayılmadı', 'valor-tenordan': 'Valör vade kodundan hesaplandı' };
