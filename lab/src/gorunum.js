// "Kendi görünümün": her analizde aynı görünüm kurucu. Bir boyut, bir ölçü ve bir çizim türü seçilir;
// sonuç çubuk, çizgi, pasta ya da tablo olarak çizilir ve görünüm ayarı (veri değil) bu tarayıcıda saklanır.
// Trade Analytics ve FX Blotter aynı modülü kullanır; veri `grupla` ile gelir.
//
// gorunumKur({ kok, boyutlar, olculer, grupla, depoAnahtari, t, bicim, sinif, adetAd, varsayilan, uzak, sabitle, sabitMi })
//   → { ciz, uygula, sor, cizTarif(kutu, tarif), kayitlilar(), yenile() }
//   kok          : #g-boyut, #g-olcu, #g-tur, #g-cizim, #g-kaydet, #g-ad, #g-durum, #g-kayitli içeren bölüm;
//                  isteğe bağlı #g-sor (form) + #g-soru + #g-sor-durum ve #g-filtre (soru kutusu, bkz. sor.js)
//   boyutlar     : [{ id, ad }]           olculer: [{ id, ad, tur: 'para' | 'sayi' | 'yuzde' | 'oran' }]
//   grupla(boyutId) → [{ etiket, degerler: { olcuId: sayı | null }, adet }]   (veri yoksa [] ya da null)
//   bicim(tur, x) → metin               sinif(x) → 'pozitif' | 'negatif' | ''
//   t(metin) çeviri; adetAd sayım sütununun adı ('İşlem' ya da 'Kalem')
//   sabitle(gorunum) / sabitMi(ad): kayıtlı bir görünümü sayfanın üstüne sabitleme (isteğe bağlı)
//
// cizimHtml(...) ve pastaSvg(...) dışa açıktır: grafik bölümü ve sabitlenen kartlar aynı çizimi kullanır.

import { kacis } from './guvenlik.js';
import { semaOlustur, yerelCoz, tarifDogrula, tarifUygula, tarifMetni } from './sor.js';

const TURLER = new Set(['cubuk', 'sutun', 'cizgi', 'pasta', 'tablo']);
export const PALET = ['#ffa630', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#2dd4bf', '#94a3b8'];

// Pasta: dilimler [{ etiket, deger >= 0, renk? }]. En büyük 7 dilim ve "Diğer". Yanında renkli açıklama.
// renk: anlamlı renk (kazanan yeşil, kaybeden kırmızı); verilmezse sıradaki palet rengi.
export function pastaSvg(dilimler, { bicim = (_, x) => String(x), tur = 'sayi', t = s => s, W = 520 } = {}) {
  const sirali = dilimler.filter(d => d.deger > 0).sort((a, b) => b.deger - a.deger).map((d, i) => ({ ...d, renk: d.renk ?? PALET[i % PALET.length] }));
  const ust = sirali.slice(0, 7);
  const kalan = sirali.slice(7).reduce((s, d) => s + d.deger, 0);
  if (kalan > 0) ust.push({ etiket: t('Diğer'), deger: kalan, renk: PALET[7] });
  const toplam = ust.reduce((s, d) => s + d.deger, 0);
  if (!toplam) return `<p class="dipnot">${kacis(t('Gösterilecek değer yok.'))}</p>`;
  const R = 84, cx = 96, cy = 96, H = Math.max(192, ust.length * 22 + 16);
  let aci = -Math.PI / 2;
  const nokta = a => `${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`;
  const yol = ust.map((d, i) => {
    const pay = d.deger / toplam, a2 = aci + pay * 2 * Math.PI;
    const baslik = `<title>${kacis(`${d.etiket}: ${bicim(tur, d.deger)} (${(pay * 100).toFixed(1)}%)`)}</title>`;
    const s = pay >= 0.9999
      ? `<circle cx="${kacis(cx)}" cy="${kacis(cy)}" r="${kacis(R)}" fill="${kacis(d.renk)}">${baslik}</circle>`
      : `<path d="M${kacis(cx)},${kacis(cy)} L${kacis(nokta(aci))} A${kacis(R)},${kacis(R)} 0 ${kacis(pay > 0.5 ? 1 : 0)} 1 ${kacis(nokta(a2))} Z" fill="${kacis(d.renk)}">${baslik}</path>`;
    aci = a2;
    return s;
  }).join('');
  const lejant = ust.map((d, i) => `<g transform="translate(212,${kacis(16 + i * 22)})"><rect width="12" height="12" rx="2" fill="${kacis(d.renk)}"></rect><text x="20" y="10.5" class="g-etiket">${kacis(d.etiket.length > 22 ? d.etiket.slice(0, 21) + '…' : d.etiket)}</text><text x="${kacis(W - 220)}" y="10.5" text-anchor="end" class="g-deger">${kacis(`${(d.deger / toplam * 100).toFixed(1)}%`)}</text></g>`).join('');
  return `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="100%" height="${kacis(H)}" class="g-svg g-pasta" role="img" aria-label="${kacis(t('Pasta grafik'))}">${yol}<circle cx="${kacis(cx)}" cy="${kacis(cy)}" r="${kacis((R * 0.52).toFixed(1))}" class="g-delik"></circle>${lejant}</svg>`;
}

// Satırlar [{ etiket, deger, adet }] → çizim HTML'i.
export function cizimHtml({ satirlar, olcu, tur, boyutAd, t, bicim, sinif, adetAd = 'İşlem', W: genislik = 680 }) {
  if (tur === 'tablo' || !satirlar.length) {
    return satirlar.length
      ? `<div class="tablo-kutu"><table class="pozisyon"><thead><tr><th>${kacis(boyutAd)}</th><th>${kacis(t(olcu.ad))}</th><th>${kacis(t(adetAd))}</th></tr></thead><tbody>${satirlar.map(s => `<tr><td>${kacis(s.etiket)}</td><td class="${kacis(olcu.tur === 'para' ? sinif(s.deger) : '')}">${kacis(bicim(olcu.tur, s.deger))}</td><td>${kacis(bicim('sayi', s.adet))}</td></tr>`).join('')}</tbody></table></div>`
      : `<p class="dipnot">${kacis(t('Önce bir dosya yükle.'))}</p>`;
  }
  const W = Math.max(320, Math.round(genislik - 26));
  if (tur === 'pasta') {
    const degerler = satirlar.map(s => s.deger ?? 0);
    const karisik = degerler.some(v => v < 0) && degerler.some(v => v > 0);
    if (olcu.tur === 'sayi' || (olcu.tur === 'para' && !karisik)) {
      return pastaSvg(satirlar.map(s => ({ etiket: s.etiket, deger: Math.abs(s.deger ?? 0) })), { bicim, tur: olcu.tur, t, W });
    }
    const not = olcu.tur === 'para' ? t('Pasta tek işaretli değer ister; bu ölçüde artı ve eksi var, çubuk gösteriliyor.') : t('Oran ve yüzde pasta ile gösterilmez; çubuk gösteriliyor.');
    return `<p class="dipnot">${kacis(not)}</p>` + cizimHtml({ satirlar, olcu, tur: 'cubuk', boyutAd, t, bicim, sinif, adetAd, W: genislik });
  }
  const degerler = satirlar.map(s => s.deger ?? 0);
  const enAz = Math.min(0, ...degerler), enCok = Math.max(0, ...degerler);
  const dar = W < 520;
  if (tur === 'sutun') {
    // Dikey sütunlar: zaman gibi sıralı boyutlar için (günler, aylar, saatler).
    const H = 220, ust = 18, alt = 30, sol = dar ? 8 : 12;
    // Sütun en çok 44 px; az sütunda grafik ortalanır.
    const n = satirlar.length, genis = Math.min(44, (W - 2 * sol) / n), bosluk = Math.min(6, genis * 0.25);
    const kay = Math.max(0, (W - 2 * sol - n * genis) / 2);
    const Y = v => ust + (1 - (v - enAz) / (enCok - enAz || 1)) * (H - ust - alt);
    const sifir = Y(0), etiketAdim = Math.max(1, Math.ceil(n / (dar ? 5 : 10)));
    return `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(t(olcu.ad))}">${satirlar.map((s, i) => {
      const v = s.deger ?? 0, x = sol + kay + i * genis + bosluk / 2, y1 = Math.min(Y(v), sifir), y2 = Math.max(Y(v), sifir);
      return `<rect x="${kacis(x.toFixed(1))}" y="${kacis(y1.toFixed(1))}" width="${kacis(Math.max(1, genis - bosluk).toFixed(1))}" height="${kacis(Math.max(1, y2 - y1).toFixed(1))}" class="${kacis(olcu.tur === 'para' ? (v < 0 ? 'g-neg' : 'g-poz') : 'g-not')}"><title>${kacis(`${s.etiket}: ${bicim(olcu.tur, s.deger)}`)}</title></rect>`
        + (i % etiketAdim ? '' : `<text x="${kacis((x + (genis - bosluk) / 2).toFixed(1))}" y="${kacis(H - 10)}" text-anchor="middle" class="g-etiket">${kacis(s.etiket.slice(-5))}</text>`);
    }).join('')}<line x1="${kacis(sol)}" x2="${kacis(W - sol)}" y1="${kacis(sifir.toFixed(1))}" y2="${kacis(sifir.toFixed(1))}" class="g-eksen"></line>
      <text x="${kacis(sol)}" y="12" class="g-deger">${kacis(bicim(olcu.tur, enCok))}</text>${enAz < 0 ? `<text x="${kacis(sol)}" y="${kacis(H - alt + 12)}" class="g-deger">${kacis(bicim(olcu.tur, enAz))}</text>` : ''}</svg>`;
  }
  const enUzun = Math.max(...satirlar.map(s => Math.min(26, s.etiket.length)));
  const solEtiket = Math.min(dar ? 120 : 220, 16 + enUzun * 7), sag = dar ? 92 : 120;
  if (tur === 'cubuk') {
    const yuk = 22, H = satirlar.length * yuk + 8;
    const X = v => solEtiket + ((v - enAz) / (enCok - enAz || 1)) * (W - solEtiket - sag);
    const sifir = X(0);
    return `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(t(olcu.ad))}">${satirlar.map((s, i) => {
      const v = s.deger ?? 0, y = 4 + i * yuk, x1 = Math.min(X(v), sifir), x2 = Math.max(X(v), sifir);
      return `<text x="${kacis(solEtiket - 6)}" y="${kacis(y + 14)}" text-anchor="end" class="g-etiket">${kacis(s.etiket.length > (dar ? 16 : 26) ? s.etiket.slice(0, dar ? 15 : 25) + '…' : s.etiket)}</text>
        <rect x="${kacis(x1)}" y="${kacis(y + 3)}" width="${kacis(Math.max(1, x2 - x1))}" height="${kacis(yuk - 8)}" class="${kacis(olcu.tur === 'para' ? (v < 0 ? 'g-neg' : 'g-poz') : 'g-not')}"></rect>
        <text x="${kacis(x2 + 4)}" y="${kacis(y + 14)}" class="g-deger">${kacis(bicim(olcu.tur, s.deger))}</text>`;
    }).join('')}<line x1="${kacis(sifir)}" x2="${kacis(sifir)}" y1="0" y2="${kacis(H)}" class="g-eksen"></line></svg>`;
  }
  const H = 240, pad = 34;
  const Xi = i => pad + (i / Math.max(1, satirlar.length - 1)) * (W - 2 * pad);
  const Y = v => H - pad - ((v - enAz) / (enCok - enAz || 1)) * (H - 2 * pad);
  const nokta = satirlar.map((s, i) => `${Xi(i)},${Y(s.deger ?? 0)}`).join(' ');
  const etiketAdim = Math.max(1, Math.ceil(satirlar.length / (dar ? 4 : 8)));
  return `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(t(olcu.ad))}">
      <line x1="${kacis(pad)}" x2="${kacis(W - pad)}" y1="${kacis(Y(0))}" y2="${kacis(Y(0))}" class="g-eksen"></line>
      <polyline points="${kacis(nokta)}" class="g-cizgi"></polyline>
      ${satirlar.map((s, i) => `<circle cx="${kacis(Xi(i))}" cy="${kacis(Y(s.deger ?? 0))}" r="3" class="${kacis(olcu.tur === 'para' && (s.deger ?? 0) < 0 ? 'g-neg' : 'g-poz')}"><title>${kacis(`${s.etiket}: ${bicim(olcu.tur, s.deger)}`)}</title></circle>`).join('')}
      ${satirlar.map((s, i) => (i % etiketAdim ? '' : `<text x="${kacis(Xi(i))}" y="${kacis(H - 8)}" text-anchor="middle" class="g-etiket">${kacis(s.etiket.slice(0, 12))}</text>`)).join('')}
      <text x="${kacis(pad)}" y="14" class="g-deger">${kacis(bicim(olcu.tur, enCok))}</text>
    </svg>`;
}

// uzak(soru, sema) → tarif nesnesi ya da null: yerel çözümleyici soruyu anlamazsa çağrılır (sunucudaki model;
// yalnız şema ve soru gider, veri gitmez). Verilmezse yalnız yerel çözümleyici çalışır.
export function gorunumKur({ kok, boyutlar, olculer, grupla, depoAnahtari, t, bicim, sinif, adetAd = 'İşlem', varsayilan = {}, uzak = null, sabitle = null, sabitMi = null }) {
  const $ = s => kok.querySelector(s);
  const BOYUT = new Set(boyutlar.map(b => b.id)), OLCU = new Set(olculer.map(o => o.id));
  const boyutAd = id => t(boyutlar.find(b => b.id === id)?.ad ?? id);
  const sema = semaOlustur(boyutlar, olculer, t);
  // Soru ile gelen süzme/sıralama/ilk N; boyut ya da ölçü değişince ya da temizlenince sıfırlanır.
  let ek = {};
  const oku = () => { try { const d = JSON.parse(localStorage.getItem(depoAnahtari) ?? '[]'); return Array.isArray(d) ? d.filter(g => g && typeof g.ad === 'string' && BOYUT.has(g.boyut) && OLCU.has(g.olcu) && TURLER.has(g.tur)).slice(0, 30) : []; } catch { return []; } };
  const yaz = d => { try { localStorage.setItem(depoAnahtari, JSON.stringify(d.slice(0, 30))); } catch { /* depo yok */ } };
  const secenek = (el, liste, sec) => { el.innerHTML = liste.map(x => `<option value="${kacis(x.id)}"${x.id === sec ? ' selected' : ''}>${kacis(t(x.ad))}</option>`).join(''); };
  secenek($('#g-boyut'), boyutlar, varsayilan.boyut ?? boyutlar[0].id);
  secenek($('#g-olcu'), olculer, varsayilan.olcu ?? olculer[0].id);

  // Bir tarifi (boyut, ölçü, tür ve isteğe bağlı süzme) verilen kutuya çizer.
  function cizTarif(kutu, tarif) {
    const olcu = olculer.find(o => o.id === tarif.olcu);
    if (!olcu || !BOYUT.has(tarif.boyut)) { kutu.innerHTML = ''; return; }
    const ham = grupla(tarif.boyut) ?? [];
    const kalan = { filtre: tarif.filtre, sirala: tarif.sirala, ilkN: tarif.ilkN };
    const satirlar = tarifUygula(ham.map(s => ({ etiket: s.etiket, deger: s.degerler[olcu.id] === Infinity ? null : s.degerler[olcu.id] ?? null, adet: s.adet })), kalan);
    kutu.innerHTML = cizimHtml({ satirlar, olcu, tur: TURLER.has(tarif.tur) ? tarif.tur : 'cubuk', boyutAd: boyutAd(tarif.boyut), t, bicim, sinif, adetAd, W: kutu.clientWidth || 680 });
  }

  function ciz() {
    cizTarif($('#g-cizim'), { boyut: $('#g-boyut').value, olcu: $('#g-olcu').value, tur: $('#g-tur').value, ...ek });
    ekCiz();
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
    $('#g-boyut').value = boyut; $('#g-olcu').value = olcu; $('#g-tur').value = TURLER.has(ham.tur) ? ham.tur : tur;
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
    $('#g-kayitli').innerHTML = d.map((g, i) => {
      const ustte = !!sabitMi?.(g.ad);
      const pin = sabitle ? `<button type="button" class="kucuk${kacis(ustte ? ' sabit' : '')}" data-sabitle="${kacis(i)}" aria-pressed="${kacis(ustte)}">${kacis(ustte ? t('Üstte') : t('Üste sabitle'))}</button>` : '';
      return `<li><button type="button" class="kucuk" data-ac="${kacis(i)}">${kacis(g.ad)}</button> <span class="dipnot">${kacis(boyutAd(g.boyut))} · ${kacis(t(olculer.find(o => o.id === g.olcu).ad))}</span> ${pin} <button type="button" class="kucuk sil" data-sil="${kacis(i)}" aria-label="${kacis(t('Sil'))}">×</button></li>`;
    }).join('');
  }

  for (const id of ['#g-boyut', '#g-olcu']) $(id).onchange = () => { ek = {}; ciz(); };
  $('#g-tur').onchange = ciz;
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
    if (b.dataset.sabitle !== undefined) { const g = d[Number(b.dataset.sabitle)]; if (g) sabitle?.(g); kayitliCiz(); }
    if (b.dataset.sil !== undefined) { d.splice(Number(b.dataset.sil), 1); yaz(d); kayitliCiz(); }
  };
  kayitliCiz();
  return { ciz, uygula, sor, cizTarif, kayitlilar: oku, yenile: kayitliCiz };
}
