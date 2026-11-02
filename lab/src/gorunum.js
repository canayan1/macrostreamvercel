// "Kendi görünümün": her analizde aynı görünüm kurucu. Bir boyut, bir ölçü ve bir çizim türü seçilir;
// sonuç çubuk, çizgi ya da tablo olarak çizilir ve görünüm ayarı (veri değil) bu tarayıcıda saklanır.
// Trade Analytics ve FX Blotter aynı modülü kullanır; veri `grupla` ile gelir.
//
// gorunumKur({ kok, boyutlar, olculer, grupla, depoAnahtari, t, bicim, sinif, adetAd, varsayilan, uzak }) → { ciz, uygula, sor }
//   kok          : #g-boyut, #g-olcu, #g-tur, #g-cizim, #g-kaydet, #g-ad, #g-durum, #g-kayitli içeren bölüm;
//                  isteğe bağlı #g-sor (form) + #g-soru + #g-sor-durum ve #g-filtre (soru kutusu, bkz. sor.js)
//   boyutlar     : [{ id, ad }]           olculer: [{ id, ad, tur: 'para' | 'sayi' | 'yuzde' | 'oran' }]
//   grupla(boyutId) → [{ etiket, degerler: { olcuId: sayı | null }, adet }]   (veri yoksa [] ya da null)
//   bicim(tur, x) → metin               sinif(x) → 'pozitif' | 'negatif' | ''
//   t(metin) çeviri; adetAd sayım sütununun adı ('İşlem' ya da 'Kalem')

import { kacis } from './guvenlik.js';
import { semaOlustur, yerelCoz, tarifDogrula, tarifUygula, tarifMetni } from './sor.js';

const TURLER = new Set(['cubuk', 'cizgi', 'tablo']);

// uzak(soru, sema) → tarif nesnesi ya da null: yerel çözümleyici soruyu anlamazsa çağrılır (sunucudaki model;
// yalnız şema ve soru gider, veri gitmez). Verilmezse yalnız yerel çözümleyici çalışır.
export function gorunumKur({ kok, boyutlar, olculer, grupla, depoAnahtari, t, bicim, sinif, adetAd = 'İşlem', varsayilan = {}, uzak = null }) {
  const $ = s => kok.querySelector(s);
  const BOYUT = new Set(boyutlar.map(b => b.id)), OLCU = new Set(olculer.map(o => o.id));
  const boyutAd = id => t(boyutlar.find(b => b.id === id)?.ad ?? id);
  const sema = semaOlustur(boyutlar, olculer, t);
  // Soru ile gelen süzme/sıralama/ilk N; seçiciler değişince ya da temizlenince sıfırlanır.
  let ek = {};
  const oku = () => { try { const d = JSON.parse(localStorage.getItem(depoAnahtari) ?? '[]'); return Array.isArray(d) ? d.filter(g => g && typeof g.ad === 'string' && BOYUT.has(g.boyut) && OLCU.has(g.olcu) && TURLER.has(g.tur)).slice(0, 30) : []; } catch { return []; } };
  const yaz = d => { try { localStorage.setItem(depoAnahtari, JSON.stringify(d.slice(0, 30))); } catch { /* depo yok */ } };
  const secenek = (el, liste, sec) => { el.innerHTML = liste.map(x => `<option value="${kacis(x.id)}"${x.id === sec ? ' selected' : ''}>${kacis(t(x.ad))}</option>`).join(''); };
  secenek($('#g-boyut'), boyutlar, varsayilan.boyut ?? boyutlar[0].id);
  secenek($('#g-olcu'), olculer, varsayilan.olcu ?? olculer[0].id);

  function ciz() {
    const boyut = $('#g-boyut').value, olcuId = $('#g-olcu').value, tur = $('#g-tur').value;
    const olcu = olculer.find(o => o.id === olcuId);
    const kutu = $('#g-cizim');
    const ham = grupla(boyut) ?? [];
    const satirlar = tarifUygula(ham.map(s => ({ etiket: s.etiket, deger: s.degerler[olcuId] === Infinity ? null : s.degerler[olcuId] ?? null, adet: s.adet })), ek);
    ekCiz();
    if (tur === 'tablo' || !satirlar.length) {
      kutu.innerHTML = satirlar.length
        ? `<div class="tablo-kutu"><table class="pozisyon"><thead><tr><th>${kacis(boyutAd(boyut))}</th><th>${kacis(t(olcu.ad))}</th><th>${kacis(t(adetAd))}</th></tr></thead><tbody>${satirlar.map(s => `<tr><td>${kacis(s.etiket)}</td><td class="${kacis(olcu.tur === 'para' ? sinif(s.deger) : '')}">${kacis(bicim(olcu.tur, s.deger))}</td><td>${kacis(bicim('sayi', s.adet))}</td></tr>`).join('')}</tbody></table></div>`
        : `<p class="dipnot">${kacis(t('Önce bir dosya yükle.'))}</p>`;
      return;
    }
    const degerler = satirlar.map(s => s.deger ?? 0);
    const enAz = Math.min(0, ...degerler), enCok = Math.max(0, ...degerler);
    const W = Math.max(320, Math.round((kutu.clientWidth || 680) - 26));
    const dar = W < 520;
    const enUzun = Math.max(...satirlar.map(s => Math.min(26, s.etiket.length)));
    const solEtiket = Math.min(dar ? 120 : 220, 16 + enUzun * 7), sag = dar ? 92 : 120;
    if (tur === 'cubuk') {
      const yuk = 22, H = satirlar.length * yuk + 8;
      const X = v => solEtiket + ((v - enAz) / (enCok - enAz || 1)) * (W - solEtiket - sag);
      const sifir = X(0);
      kutu.innerHTML = `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(t(olcu.ad))}">${satirlar.map((s, i) => {
        const v = s.deger ?? 0, y = 4 + i * yuk, x1 = Math.min(X(v), sifir), x2 = Math.max(X(v), sifir);
        return `<text x="${kacis(solEtiket - 6)}" y="${kacis(y + 14)}" text-anchor="end" class="g-etiket">${kacis(s.etiket.length > (dar ? 16 : 26) ? s.etiket.slice(0, dar ? 15 : 25) + '…' : s.etiket)}</text>
          <rect x="${kacis(x1)}" y="${kacis(y + 3)}" width="${kacis(Math.max(1, x2 - x1))}" height="${kacis(yuk - 8)}" class="${kacis(olcu.tur === 'para' ? (v < 0 ? 'g-neg' : 'g-poz') : 'g-not')}"></rect>
          <text x="${kacis(x2 + 4)}" y="${kacis(y + 14)}" class="g-deger">${kacis(bicim(olcu.tur, s.deger))}</text>`;
      }).join('')}<line x1="${kacis(sifir)}" x2="${kacis(sifir)}" y1="0" y2="${kacis(H)}" class="g-eksen"></line></svg>`;
    } else {
      const H = 240, pad = 34;
      const Xi = i => pad + (i / Math.max(1, satirlar.length - 1)) * (W - 2 * pad);
      const Y = v => H - pad - ((v - enAz) / (enCok - enAz || 1)) * (H - 2 * pad);
      const nokta = satirlar.map((s, i) => `${Xi(i)},${Y(s.deger ?? 0)}`).join(' ');
      const etiketAdim = Math.max(1, Math.ceil(satirlar.length / (dar ? 4 : 8)));
      kutu.innerHTML = `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(t(olcu.ad))}">
        <line x1="${kacis(pad)}" x2="${kacis(W - pad)}" y1="${kacis(Y(0))}" y2="${kacis(Y(0))}" class="g-eksen"></line>
        <polyline points="${kacis(nokta)}" class="g-cizgi"></polyline>
        ${satirlar.map((s, i) => `<circle cx="${kacis(Xi(i))}" cy="${kacis(Y(s.deger ?? 0))}" r="3" class="${kacis(olcu.tur === 'para' && (s.deger ?? 0) < 0 ? 'g-neg' : 'g-poz')}"><title>${kacis(`${s.etiket}: ${bicim(olcu.tur, s.deger)}`)}</title></circle>`).join('')}
        ${satirlar.map((s, i) => (i % etiketAdim ? '' : `<text x="${kacis(Xi(i))}" y="${kacis(H - 8)}" text-anchor="middle" class="g-etiket">${kacis(s.etiket.slice(0, 12))}</text>`)).join('')}
        <text x="${kacis(pad)}" y="14" class="g-deger">${kacis(bicim(olcu.tur, enCok))}</text>
      </svg>`;
    }
  }

  // Aktif süzme/ilk N çipi.
  function ekCiz() {
    const cip = $('#g-filtre'); if (!cip) return;
    const var_ = !!(ek.filtre || ek.ilkN || ek.sirala);
    cip.hidden = !var_;
    if (var_) cip.innerHTML = `<span>${kacis(tarifMetni({ boyut: $('#g-boyut').value, olcu: $('#g-olcu').value, tur: $('#g-tur').value, ...ek }, sema, t))}</span> <button type="button" class="kucuk" data-temizle>${kacis(t('Temizle'))}</button>`;
  }

  // Bir tarifi (yerel çözümleyici, model ya da kayıtlı görünüm) seçicilere ve ek ayarlara uygular.
  function uygula(ham) {
    const d = tarifDogrula(ham, sema);
    if (d.hata) return d;
    const { boyut, olcu, tur, ...rest } = d.tarif;
    $('#g-boyut').value = boyut; $('#g-olcu').value = olcu; $('#g-tur').value = tur;
    ek = rest;
    ciz();
    return d;
  }

  async function sor(soru) {
    const durum = $('#g-sor-durum');
    const de = m => { if (durum) durum.textContent = m; };
    const q = soru.trim().slice(0, 200);
    if (!q) return;
    let tarif = yerelCoz(q, sema);
    if (!tarif && uzak) {
      de(t('Soruya bakılıyor…'));
      try { tarif = await uzak(q, sema); } catch { tarif = null; }
    }
    if (!tarif) { de(t('Anlaşılmadı. Bir boyut ve bir ölçü adı yaz, örneğin "top 5 counterparties by total P&L".')); return; }
    const d = uygula(tarif);
    if (d.hata) { de(t('Anlaşılmadı. Bir boyut ve bir ölçü adı yaz, örneğin "top 5 counterparties by total P&L".')); return; }
    de(`${t('Gösteriliyor:')} ${tarifMetni(d.tarif, sema, t)}`);
  }

  function kayitliCiz() {
    const d = oku();
    $('#g-kayitli').innerHTML = d.map((g, i) => `<li><button type="button" class="kucuk" data-ac="${kacis(i)}">${kacis(g.ad)}</button> <span class="dipnot">${kacis(boyutAd(g.boyut))} · ${kacis(t(olculer.find(o => o.id === g.olcu).ad))}</span> <button type="button" class="kucuk sil" data-sil="${kacis(i)}" aria-label="${kacis(t('Sil'))}">×</button></li>`).join('');
  }

  for (const id of ['#g-boyut', '#g-olcu', '#g-tur']) $(id).onchange = () => { ek = {}; ciz(); };
  const sorForm = $('#g-sor');
  if (sorForm) sorForm.onsubmit = e => { e.preventDefault(); sor($('#g-soru').value); };
  $('#g-filtre')?.addEventListener('click', e => { if (e.target.closest('[data-temizle]')) { ek = {}; const d = $('#g-sor-durum'); if (d) d.textContent = ''; ciz(); } });
  $('#g-kaydet').onsubmit = e => {
    e.preventDefault();
    const ad = $('#g-ad').value.trim().slice(0, 60);
    if (!ad) { $('#g-durum').textContent = t('Bir ad yaz.'); return; }
    const d = oku().filter(g => g.ad !== ad);
    d.unshift({ ad, boyut: $('#g-boyut').value, olcu: $('#g-olcu').value, tur: $('#g-tur').value, ...ek });
    yaz(d);
    $('#g-ad').value = ''; $('#g-durum').textContent = t('Kaydedildi.');
    kayitliCiz();
  };
  $('#g-kayitli').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = oku();
    if (b.dataset.ac !== undefined) { const g = d[Number(b.dataset.ac)]; if (!g) return; uygula(g); }
    if (b.dataset.sil !== undefined) { d.splice(Number(b.dataset.sil), 1); yaz(d); kayitliCiz(); }
  };
  kayitliCiz();
  return { ciz, uygula, sor };
}
