// Sonuç kimliği satırı: kısa resultId, tam kimliği kopyalama ve çalıştırmayı (manifest + strateji +
// özet + işlemler) JSON olarak indirme. Lab ve optimizasyon sayfası kullanır.

import { t as ceviri } from './dil.js';
import { kisaKimlik } from '../core/src/manifest.js';

// kap: satırın çizileceği öğe. resultId: tam kimlik (64 hane). paket(): indirilecek nesne.
export function kimlikSatiri(kap, { resultId, paket, dosyaAdi = 'kalibre-run' }) {
  if (!kap) return;
  if (!resultId) { kap.hidden = true; kap.textContent = ''; return; }
  kap.hidden = false;
  kap.textContent = '';
  const etiket = document.createElement('span');
  etiket.textContent = ceviri('Sonuç kimliği');
  const kod = document.createElement('code');
  kod.textContent = kisaKimlik(resultId);
  kod.title = resultId;
  kap.title = ceviri('Aynı motor sürümü, strateji, veri ve ayarlar her zaman aynı kimliği verir.');
  const kopyala = document.createElement('button');
  kopyala.type = 'button';
  kopyala.className = 'kucuk';
  kopyala.textContent = ceviri('Kimliği kopyala');
  kopyala.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(resultId); kopyala.textContent = ceviri('Kopyalandı'); }
    catch { kopyala.textContent = ceviri('Kopyalanamadı'); }
    setTimeout(() => { kopyala.textContent = ceviri('Kimliği kopyala'); }, 1500);
  });
  const indir = document.createElement('button');
  indir.type = 'button';
  indir.className = 'kucuk';
  indir.textContent = ceviri('Çalıştırmayı indir');
  indir.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`${JSON.stringify(paket(), null, 2)}\n`], { type: 'application/json' }));
    a.download = `${dosyaAdi}-${resultId.slice(0, 12)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  kap.append(etiket, ' ', kod, ' ', kopyala, ' ', indir);
}
