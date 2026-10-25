// Strateji kurucu ve optimizasyon panelinde aracı kurum veri kaynağı ("Tradier (ABD)", "Alpaca (ABD)"):
// sembol ve zaman dilimi seçip mum serisi yükler. Veri, MT5 köprüsünden gelen seriyle aynı biçimdedir.

import { t as ceviri, dil } from './dil.js';
import { ARACI } from './veri/araci.js';

import { kacis } from './guvenlik.js';
const TD_ADI = () => ({ D1: ceviri('Günlük'), W1: ceviri('Haftalık'), H1: ceviri('Saatlik'), M15: ceviri('15 dakika'), M5: ceviri('5 dakika'), M1: ceviri('1 dakika') });
export const SEMBOL_RE = /^[A-Z0-9.\-/]{1,16}$/;

// kok: boş bir kapsayıcı öğe. kaynak: 'tradier' | 'alpaca'. yukle(veri): seri yüklendi. hata(mesaj): yüklenemedi.
// istenenSembol: Panom'dan gelen ?sembol=. Dönüş: { baslat(), durdur(), bagli }
export function araciSecici(kok, kaynak, { yukle, hata, istenenSembol = '', zamanDilimi = 'D1' } = {}) {
  const t = ARACI[kaynak];
  const ayar = t.oku();
  const ek = dil === 'tr' ? '&dil=tr' : '';
  const on = kaynak === 'tradier' ? 'tr' : 'ap';
  if (!ayar) {
    const m = ceviri('{a} bağlı değil.', { a: t.ad });
    kok.innerHTML = `<p class="dipnot">${kacis(m)} <a href="baglan.html?kaynak=${kaynak}${ek}">${kacis(ceviri('{a} bağla', { a: t.ad }))}</a></p>`;
    return { baslat() { hata?.(m); }, durdur() {}, bagli: false };
  }
  const ist = t.istemci();
  const ortamAdi = t.ortamAdi(ayar);
  const td = t.zamanDilimleri.includes(zamanDilimi) ? zamanDilimi : 'D1';
  kok.innerHTML = `
    <div class="tradier-secim">
      <label><span>${kacis(ceviri('Sembol'))}</span><input id="${on}-sembol" list="${on}-semboller" spellcheck="false" autocomplete="off" value="${kacis(istenenSembol)}"><datalist id="${on}-semboller"></datalist></label>
      <label><span>${kacis(ceviri('Zaman dilimi'))}</span><select id="${on}-td">${t.zamanDilimleri.map(z => `<option value="${kacis(z)}"${z === td ? ' selected' : ''}>${kacis(TD_ADI()[z])}</option>`).join('')}</select></label>
      <button type="button" class="kucuk" id="${on}-yukle">${kacis(ceviri('Yükle'))}</button>
    </div>
    <p class="dipnot" id="${on}-not" role="status">${kacis(t.not(ortamAdi))}</p>`;
  const $ = s => kok.querySelector(s);
  let istek = 0;

  async function yukleSeri() {
    const sembol = $(`#${on}-sembol`).value.trim().toUpperCase();
    const z = $(`#${on}-td`).value;
    if (!SEMBOL_RE.test(sembol)) { $(`#${on}-not`).textContent = ceviri('Geçerli bir sembol yaz (ör. AAPL).'); return; }
    const n = ++istek;
    $(`#${on}-not`).textContent = ceviri('{s} yükleniyor…', { s: sembol });
    try {
      const r = await ist.seri(sembol, z, { enAz: 50 });
      if (n !== istek) return;
      $(`#${on}-not`).textContent = ceviri('{s} {z}: {n} mum.', { s: sembol, z, n: r.mumlar.length });
      yukle?.({
        mumlar: r.mumlar, zamanDilimi: r.meta.zamanDilimi, takvim: r.meta.takvim, sembol: r.meta.sembol,
        ornek: false, atlanan: r.atlanan, uyarilar: r.uyarilar, ad: `${t.ad} · ${ortamAdi} · ${sembol} ${z}`,
      });
    } catch (e) {
      if (n !== istek) return;
      const m = ceviri('{s} {z} okunamadı: {m}', { s: sembol, z, m: e.message });
      $(`#${on}-not`).textContent = m;
      hata?.(m);
    }
  }
  async function sembolleriDoldur() {
    try {
      const s = await ist.izlenenSemboller();
      $(`#${on}-semboller`).innerHTML = s.map(x => `<option value="${kacis(x)}">`).join('');
      if (!$(`#${on}-sembol`).value) $(`#${on}-sembol`).value = s[0] ?? t.ornekSembol;
    } catch { /* izleme listesi yoksa kullanıcı sembolü kendisi yazar */ }
  }
  $(`#${on}-yukle`).addEventListener('click', yukleSeri);
  $(`#${on}-td`).addEventListener('change', yukleSeri);
  $(`#${on}-sembol`).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); yukleSeri(); } });
  let basladi = false;
  return {
    bagli: true,
    async baslat() {
      if (basladi) return;
      basladi = true;
      await sembolleriDoldur();
      if ($(`#${on}-sembol`).value) yukleSeri();
    },
    durdur() {},
  };
}

export const tradierSecici = (kok, secenek) => araciSecici(kok, 'tradier', secenek);
export const alpacaSecici = (kok, secenek) => araciSecici(kok, 'alpaca', secenek);
