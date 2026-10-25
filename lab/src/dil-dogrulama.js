// Aşırı uyum ölçüleri (PBO, Harvey-Liu, yürüyen ileri, deneme sayacı) için İngilizce karşılıklar.
// Ayrı dosyadadır; içe aktarıldığında dil-en.js sözlüğüne eklenir. Anahtar Türkçe kaynak metindir.
import { EN } from './dil-en.js';

export const DOGRULAMA_EN = {
  'bu taslakta toplam deneme (önceki taramalar dahil); şans düzeltmesi bu sayıyla yapılır':
    'total trials on this draft (including earlier scans); the luck adjustment uses this number',
  'Sayacı sıfırla': 'Reset counter',
  'Bu taslağın deneme sayacı sıfırlansın mı? Sıfırlamak, daha önce denenen ayarları silmez; yalnız şans düzeltmesini zayıflatır.':
    'Reset the trial counter for this draft? Resetting does not undo earlier trials; it only weakens the luck adjustment.',
  'aşırı uyum olasılığı (PBO, {k} bölme): eğitimde en iyi görünen ayarın sınamada ortanın altında kalma oranı; {a}':
    'probability of backtest overfitting (PBO, {k} splits): how often the setting that looks best in training ranks below the median out of sample; {a}',
  'düşük: seçim görülmemiş dönemlerde de büyük ölçüde tutuyor': 'low: the selection mostly holds in unseen periods',
  'orta: seçim görülmemiş dönemlerde kısmen tutuyor': 'medium: the selection partly holds in unseen periods',
  'yüksek: seçim büyük olasılıkla geçmişe uyumun ürünü': 'high: the selection is likely a product of fitting the past',
  'PBO hesaplanamadı: {n}': 'PBO could not be calculated: {n}',
  'ayarların sonuçları özdeş': 'all settings give identical results',
  'veri bölmeler için kısa': 'not enough data for the splits',
  'en az iki ayar gerekir': 'at least two settings are needed',
  'düzeltilmiş Sharpe (Harvey-Liu, BHY): {n} deneme hesaba katılınca ilk ayarın mum başı Sharpe\'ı {a}, kırpma {k}':
    'adjusted Sharpe (Harvey-Liu, BHY): with {n} trials taken into account, the first setting\'s per-bar Sharpe is {a}, a haircut of {k}',
  'Eğitimde en iyi görünen ayarlar, görülmemiş dönemlerde çoğunlukla ortanın altında kaldı (PBO {p}). Sıralama büyük olasılıkla geçmişe uyumu yansıtıyor.':
    'The settings that looked best in training mostly ranked below the median in unseen periods (PBO {p}). The ranking most likely reflects fitting to the past.',
  'Yürüyen ileri analiz': 'Walk-forward analysis',
  'Ayar her pencerede yalnız o güne kadarki veriyle yeniden seçilir ve hemen sonraki dönemde sınanır. Sınama dönemleri uç uca eklenir.':
    'The setting is re-selected in each window using only data up to that point, then tested on the period right after it. Test periods are joined end to end.',
  'Çalıştır': 'Run',
  'Pencere': 'Window',
  'Kayan': 'Rolling',
  'Çapalı (büyüyen)': 'Anchored (expanding)',
  'Yürüyen ileri analiz sürüyor: {i}/{n}': 'Walk-forward running: {i}/{n}',
  'Yürüyen ileri analiz tamamlanamadı: {m}': 'Walk-forward analysis could not finish: {m}',
  'Yürüyen ileri için veri kısa: en az iki pencere gerekir.': 'Not enough data for walk-forward: at least two windows are needed.',
  'yürüyen ileri verimliliği (WFE): sınamadaki ortalama getirinin eğitimdekine oranı; 1\'e yakınsa seçim tutmuş, 0 ya da altıysa tutmamış':
    'walk-forward efficiency (WFE): average out-of-sample return divided by the in-sample average; near 1 means the selection held, 0 or below means it did not',
  'birleştirilmiş sınama getirisi, {n} pencere': 'combined out-of-sample return, {n} windows',
  'ardışık pencerelerde seçilen ayarın değişme oranı': 'how often the selected setting changed between consecutive windows',
  'Eğitim': 'Training',
  'Sınama': 'Test',
  'Seçilen ayar': 'Selected setting',
  'Sınama getirisi': 'Test return',
  'uygun ayar yok': 'no eligible setting',
  'mum {a}-{b}': 'bars {a}-{b}',
};

Object.assign(EN, DOGRULAMA_EN);
