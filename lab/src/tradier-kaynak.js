// Strateji kurucu ve optimizasyon panelinde "Tradier (ABD)" veri kaynağı: sembol ve zaman dilimi
// seçip Tradier'den mum serisi yükler. Veri, MT5 köprüsünden gelen seriyle aynı biçimdedir.

import { t as ceviri, dil } from './dil.js';
import { kayitliTradierIstemci, tradierOku, TRADIER_ZAMAN_DILIMLERI } from './veri/tradier.js';

const kacis = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TD_ADI = () => ({ D1: ceviri('Günlük'), W1: ceviri('Haftalık'), M15: ceviri('15 dakika'), M5: ceviri('5 dakika'), M1: ceviri('1 dakika') });
export const SEMBOL_RE = /^[A-Z0-9.\-/]{1,16}$/;

// kok: boş bir kapsayıcı öğe. yukle(veri): seri yüklendi. hata(mesaj): yüklenemedi.
// istenenSembol: Panom'dan gelen ?sembol=. Dönüş: { baslat(), durdur(), bagli }
export function tradierSecici(kok, { yukle, hata, istenenSembol = '', zamanDilimi = 'D1' } = {}) {
  const ayar = tradierOku();
  const ek = dil === 'en' ? '&dil=en' : '';
  if (!ayar) {
    kok.innerHTML = `<p class="dipnot">${kacis(ceviri('Tradier bağlı değil.'))} <a href="baglan.html?kaynak=tradier${ek}">${kacis(ceviri("Tradier'i bağla"))}</a></p>`;
    return { baslat() { hata?.(ceviri('Tradier bağlı değil.')); }, durdur() {}, bagli: false };
  }
  const ist = kayitliTradierIstemci();
  const ortamAdi = ayar.ortam === 'canli' ? ceviri('Canlı') : 'Sandbox';
  const td = TRADIER_ZAMAN_DILIMLERI.includes(zamanDilimi) ? zamanDilimi : 'D1';
  kok.innerHTML = `
    <div class="tradier-secim">
      <label><span>${kacis(ceviri('Sembol'))}</span><input id="tr-sembol" list="tr-semboller" spellcheck="false" autocomplete="off" value="${kacis(istenenSembol)}"><datalist id="tr-semboller"></datalist></label>
      <label><span>${kacis(ceviri('Zaman dilimi'))}</span><select id="tr-td">${TRADIER_ZAMAN_DILIMLERI.map(z => `<option value="${z}"${z === td ? ' selected' : ''}>${kacis(TD_ADI()[z])}</option>`).join('')}</select></label>
      <button type="button" class="kucuk" id="tr-yukle">${kacis(ceviri('Yükle'))}</button>
    </div>
    <p class="dipnot" id="tr-not" role="status">${kacis(ceviri('Tradier · {o}. Günlük ve haftalık seriler son 5 yıldır; gün içi seriler en çok 20 (1 dk) ya da 40 (5 ve 15 dk) gündür.', { o: ortamAdi }))}</p>`;
  const $ = s => kok.querySelector(s);
  let istek = 0;

  async function yukleSeri() {
    const sembol = $('#tr-sembol').value.trim().toUpperCase();
    const z = $('#tr-td').value;
    if (!SEMBOL_RE.test(sembol)) { $('#tr-not').textContent = ceviri('Geçerli bir sembol yaz (ör. AAPL).'); return; }
    const n = ++istek;
    $('#tr-not').textContent = ceviri('{s} yükleniyor…', { s: sembol });
    try {
      const r = await ist.seri(sembol, z, { enAz: 50 });
      if (n !== istek) return;
      $('#tr-not').textContent = ceviri('{s} {z}: {n} mum.', { s: sembol, z, n: r.mumlar.length });
      yukle?.({
        mumlar: r.mumlar, zamanDilimi: r.meta.zamanDilimi, takvim: r.meta.takvim, sembol: r.meta.sembol,
        ornek: false, atlanan: r.atlanan, uyarilar: r.uyarilar, ad: `Tradier · ${ortamAdi} · ${sembol} ${z}`,
      });
    } catch (e) {
      if (n !== istek) return;
      const m = ceviri('{s} {z} okunamadı: {m}', { s: sembol, z, m: e.message });
      $('#tr-not').textContent = m;
      hata?.(m);
    }
  }
  async function sembolleriDoldur() {
    try {
      const s = await ist.izlenenSemboller();
      $('#tr-semboller').innerHTML = s.map(x => `<option value="${kacis(x)}">`).join('');
      if (!$('#tr-sembol').value && s.length) $('#tr-sembol').value = s[0];
    } catch { /* izleme listesi yoksa kullanıcı sembolü kendisi yazar */ }
  }
  $('#tr-yukle').addEventListener('click', yukleSeri);
  $('#tr-td').addEventListener('change', yukleSeri);
  $('#tr-sembol').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); yukleSeri(); } });
  let basladi = false;
  return {
    bagli: true,
    async baslat() {
      if (basladi) return;
      basladi = true;
      await sembolleriDoldur();
      if ($('#tr-sembol').value) yukleSeri();
    },
    durdur() {},
  };
}
