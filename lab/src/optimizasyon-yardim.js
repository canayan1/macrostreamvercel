// Optimizasyon panelinin saf yardımcıları (DOM yok; Node testlerinde de çalışır).

import { publicPath } from '../core/src/run-format.js';
import { degerler } from './optimizasyon.js';

export const EN_COK_PARAMETRE = 3;
export const SERT_SINIR = 2000;       // kombinasyon sayısı bunu aşarsa tarama başlamaz
export const VARSAYILAN_ORNEK = 500;  // bunun üstünde tohumlu rastgele örneklem

// Prop kural ön ayarları: Motor'daki kalkan (mql5/Include/Kalibre/Kalkan.mqh) ve sitedeki
// hesaplayıcıyla (static/kalkan-hesap.js) aynı sayılar. Kaynak: firmaların sayfaları, 23.10.2026.
export const PROP_ON_AYAR = {
  ftmo2: { ad: 'FTMO 2-Step', gunluk: 5, azami: 10, tur: 'sabit' },
  ftmo1: { ad: 'FTMO 1-Step', gunluk: 3, azami: 10, tur: 'iz' },
  ftmoi: { ad: 'FTMO Instant', gunluk: 3, azami: 10, tur: 'iz' },
  the5ers: { ad: 'The5ers High Stakes', gunluk: 5, azami: 10, tur: 'sabit' },
};

// Seçilen parametrelerin kombinasyon sayısı; geçersiz aralıkta 0.
export function kombinasyonSayisi(secilen) {
  let n = 1;
  for (const p of secilen) {
    if (!(p.adim > 0) || !(p.max >= p.min)) return 0;
    n *= degerler(p).length;
  }
  return secilen.length ? n : 0;
}

// Tarama planı: başlatılabilir mi, örneklenecek mi?
export function plan(secilen, ornekSiniri = VARSAYILAN_ORNEK) {
  const toplam = kombinasyonSayisi(secilen);
  const sinir = Math.min(SERT_SINIR, Math.max(1, Math.round(ornekSiniri) || VARSAYILAN_ORNEK));
  if (!secilen.length) return { toplam, durum: 'secim_yok' };
  if (!toplam) return { toplam, durum: 'aralik_hatali' };
  if (toplam > SERT_SINIR && sinir >= toplam) return { toplam, durum: 'cok_buyuk' };
  return { toplam, sinir, durum: toplam > sinir ? 'orneklenecek' : 'tam', denenecek: Math.min(toplam, sinir) };
}

// Isı haritası (tam iki parametre): x = 1. parametre, y = 2. parametre. Her hücre bir sonuç ya da null
// (denenmemiş / geçersiz). enIyi: sıralamadaki ilk ayarın hücresi.
export function isiHaritasi(sonuc, secilen) {
  if (secilen.length !== 2) return null;
  const xs = degerler(secilen[0]), ys = degerler(secilen[1]);
  const hucre = ys.map(() => xs.map(() => null));
  const xi = new Map(xs.map((v, i) => [v, i])), yi = new Map(ys.map((v, i) => [v, i]));
  for (const r of sonuc.sonuclar) {
    const i = xi.get(r.degerler[0]), j = yi.get(r.degerler[1]);
    if (i === undefined || j === undefined) continue;
    hucre[j][i] = { puan: r.puan, yetersiz: !!r.yetersiz, propIhlal: !!r.propIhlal };
  }
  let enIyi = null;
  const e = sonuc.enIyiler[0];
  if (e) enIyi = { i: xi.get(e.degerler[0]), j: yi.get(e.degerler[1]) };
  const puanlar = sonuc.sonuclar.filter(r => !r.yetersiz && !r.propIhlal && Number.isFinite(r.puan)).map(r => r.puan);
  return { xs, ys, hucre, enIyi, min: puanlar.length ? Math.min(...puanlar) : 0, max: puanlar.length ? Math.max(...puanlar) : 0 };
}

// 0-1 arası değeri kırmızı → nötr → yeşil renge çevirir (sıfır puan nötr).
export function hucreRengi(puan, min, max) {
  if (!Number.isFinite(puan)) return null;
  if (puan >= 0) {
    const t = max > 0 ? Math.min(1, puan / max) : 0;
    return `rgba(95,184,154,${(0.15 + 0.8 * t).toFixed(3)})`;
  }
  const t = min < 0 ? Math.min(1, puan / min) : 0;
  return `rgba(224,122,110,${(0.15 + 0.8 * t).toFixed(3)})`;
}

// İndirilen kural dosyasının adı: strateji adı + parametre değerleri, dosya sistemine uygun.
export function dosyaAdi(stratejiAdi, secilen, degerListesi) {
  const temiz = v => String(v).toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]))
    .replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
  const ek = secilen.map((p, i) => `${temiz(publicPath(p.yol).split('.').slice(-2).join('-'))}-${temiz(degerListesi[i])}`).join('_');
  return `${temiz(stratejiAdi || 'strategy') || 'strategy'}_${ek}.json`;
}

// Komşuluk oranının düz anlatımı için sınıf: 'saglam' (≥ 0,8), 'orta' (0,5-0,8), 'kirilgan' (< 0,5).
export function komsulukSinifi(oran) {
  if (oran === null || oran === undefined || !Number.isFinite(oran)) return null;
  return oran >= 0.8 ? 'saglam' : oran >= 0.5 ? 'orta' : 'kirilgan';
}

// Deflated Sharpe olasılığının düz anlatımı için sınıf.
export function dsrSinifi(p) {
  if (p === null || p === undefined || !Number.isFinite(p)) return null;
  return p >= 0.95 ? 'guclu' : p >= 0.5 ? 'belirsiz' : 'zayif';
}
