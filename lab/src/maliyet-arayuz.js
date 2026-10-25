// Maliyet bölümü: hızlı provaya isteğe bağlı spread, komisyon ve kayma (motor.js maliyet modeli,
// docs/motor-kurallari.md). Varsayılan sıfırdır; sıfırken sonuçlar maliyetsiz (brüt) provayla aynıdır.
// Kurucu ve optimizasyon aynı ayarı paylaşır; ayar yalnız bu tarayıcıda durur.

import { MALIYETSIZ, maliyetVar } from './motor.js';
import { t as ceviri, dil } from './dil.js';
import { kacis } from './guvenlik.js';

const ANAHTAR = 'kalibre-lab-maliyet';
// [alan, etiket, ipucu]; metinler yüklemede çevrilir (dil sayfa açılırken belirlenir).
const ALANLAR = [
  ['spread', ceviri('Spread'), ceviri('fiyat birimi')],
  ['komisyonYuzde', ceviri('Komisyon (%)'), ceviri('işlem değerinin yüzdesi, giriş ve çıkışta ayrı ayrı')],
  ['kayma', ceviri('Kayma'), ceviri('fiyat birimi, piyasa emirlerinde')],
];

const temiz = v => { const x = Number(v); return Number.isFinite(x) && x > 0 ? x : 0; };

export function maliyetOku() {
  try {
    const v = JSON.parse(globalThis.localStorage?.getItem(ANAHTAR) ?? 'null');
    if (v && typeof v === 'object') return { spread: temiz(v.spread), kayma: temiz(v.kayma), komisyonYuzde: temiz(v.komisyonYuzde) };
  } catch { /* depo yok ya da bozuk */ }
  return { ...MALIYETSIZ };
}
function maliyetYaz(m) { try { globalThis.localStorage?.setItem(ANAHTAR, JSON.stringify(m)); } catch { /* özel pencere vb. */ } }

const sayiYaz = v => (dil === 'en' ? String(v) : String(v).replace('.', ','));

// Sonuç etiketi: "Brüt (maliyetsiz)" ya da "Net (maliyetli: spread X, komisyon %Y, kayma Z)".
export function maliyetEtiketi(m) {
  if (!maliyetVar(m)) return ceviri('Brüt (maliyetsiz)');
  return ceviri('Net (maliyetli: spread {s}, komisyon %{k}, kayma {y})', { s: sayiYaz(m.spread), k: sayiYaz(m.komisyonYuzde), y: sayiYaz(m.kayma) });
}

// Bölümün HTML'i (DOM'suz da çağrılabilir; testler kullanır).
export function maliyetHtml(m = maliyetOku()) {
  const girdiler = ALANLAR.map(([k, etiket, ipucu]) =>
    `<label><span>${kacis(etiket)}</span><input type="number" min="0" step="any" inputmode="decimal" data-maliyet="${kacis(k)}" value="${kacis(m[k] || 0)}" title="${kacis(ipucu)}"></label>`).join('');
  return `<details class="maliyet"${maliyetVar(m) ? ' open' : ''}>
    <summary>${kacis(ceviri('Maliyet'))} <span class="rozet ikincil" data-maliyet-etiket>${kacis(maliyetEtiketi(m))}</span></summary>
    <div class="prova-ayar">${girdiler}</div>
    <p class="dipnot">${kacis(ceviri('Mumlar bid fiyatıdır; ask = bid + spread. Long ask fiyatından girer, bid fiyatından çıkar. Short bid fiyatından girer, ask fiyatından çıkar; stopu ve hedefi de ask fiyatına göre tetiklenir. Kayma her piyasa emrinde (giriş, stop, kural çıkışı) aleyhe eklenir; hedef limit emir sayılır. Komisyon giriş ve çıkışta ayrı ayrı işlem değerinin yüzdesidir. Swap yoktur.'))}</p>
  </details>`;
}

// kok: bölümün çizileceği öğe. degisince(maliyet): her geçerli değişiklikte çağrılır.
export function maliyetAlani(kok, degisince = () => {}) {
  kok.innerHTML = maliyetHtml();
  kok.addEventListener('input', e => {
    const k = e.target?.dataset?.maliyet;
    if (!k) return;
    const m = maliyetOku();
    m[k] = temiz(String(e.target.value).replace(',', '.'));
    maliyetYaz(m);
    const et = kok.querySelector('[data-maliyet-etiket]');
    if (et) et.textContent = maliyetEtiketi(m);
    degisince(m);
  });
}
