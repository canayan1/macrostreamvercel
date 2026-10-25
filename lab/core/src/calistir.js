// Kimlikli prova: prova() sonucuna çalıştırma manifesti ve resultId ekler.
// Identified backtest: prova() plus run manifest and resultId.
// prova() optimizasyon döngülerinde binlerce kez çağrıldığı için özet hesaplamaz; kimlik gereken
// her tekil çalıştırma (arayüz, CLI, dışa aktarma) bunu kullanır.

import { prova } from './motor.js';
import { manifestOlustur, calistirmaPaketi } from './manifest.js';

// ayar: prova() seçenekleri (baslangic, maliyet, enstruman, dolum, altMumlar, ...).
// ek: kimliğe girmesi gereken ek bilgi (ör. sentetik serinin rejimi ve tohumu); seed: rastgelelik tohumu.
export function calistir(strateji, mumlar, ayar = {}, { seed = null, ek } = {}) {
  const sonuc = prova(strateji, mumlar, ayar);
  const manifest = manifestOlustur({ strateji, mumlar, ayar, seed, tur: 'prova', ek });
  return { ...sonuc, manifest, resultId: manifest.resultId };
}

export function disaAktar(strateji, ayar, sonuc) {
  return calistirmaPaketi({
    manifest: sonuc.manifest, strateji, ayar, istatistik: sonuc.istatistik, islemler: sonuc.islemler,
    uyarilar: sonuc.uyarilar, ek: { dolum: sonuc.dolum, ...(sonuc.enstruman ? { enstruman: sonuc.enstruman } : {}) },
  });
}
