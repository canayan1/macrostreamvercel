// Kur, taşıma ve limit girdileri için satır satır tablo düzenleyici. Kaynak hâlâ metin kutusudur
// (ayrıştırıcılar, kayıt ve örnek yükleme onu okur); tablo metni satırlara böler, her satırı alanlara
// ayırır ve düzenlenince metni yeniden yazar. Okunamayan satır kaybolmaz: kırmızı bir metin satırı
// olarak kalır. Yorum satırları (#) korunur ve tablonun üstünde not olarak görünür.
//
// satirlar(tur, metin, dil) → [{ ... }]     tur: 'kur' | 'tasima' | 'limit'
// metin(tur, satirlar, dil) → metin
// satirHatali(tur, satir, dil) → true/false
// duzenleyiciKur(textarea, tur, { t, dil }) → { yenile() }

import { kurTablosuCoz, tasimaGirdiCoz } from './kur.js';
import { limitleriCoz, KOVALAR } from './analiz.js';
import { pariteCoz } from './model.js';

const KOVA_EN = { 'Geçmiş/bugün': 'past/today', '≤ 1 hafta': '≤ 1 week', '≤ 1 ay': '≤ 1 month', '≤ 3 ay': '≤ 3 months', '≤ 6 ay': '≤ 6 months', '≤ 1 yıl': '≤ 1 year', '> 1 yıl': '> 1 year' };
const TUR_YAZ = { tr: { GECE: 'GECE', GUNICI: 'GUNICI', VALOR: 'VALOR' }, en: { GECE: 'OVERNIGHT', GUNICI: 'INTRADAY', VALOR: 'VALUE' } };
const KAPSAM_YAZ = { tr: { masa: 'masa', trader: 'trader', portfoy: 'portfoy' }, en: { masa: 'desk', trader: 'trader', portfoy: 'book' } };
export const LIMIT_TURLERI = ['NOP', 'GECE', 'GUNICI', 'STOP', 'VALOR'];
export const LIMIT_TUR_AD = { NOP: 'Döviz (NOP)', GECE: 'Gece toplamı', GUNICI: 'Gün içi tepe', STOP: 'Günlük zarar', VALOR: 'Valör aralığı' };
export const KAPSAM_AD = { masa: 'Masa', trader: 'Trader', portfoy: 'Portföy' };

const ham = s => ({ ham: s, hatali: true });
const yorum = s => ({ yorum: s });
const parcala = s => s.trim().split(/[\s;\t=]+/).filter(Boolean);
const LIMIT_TUR = { NOP: 'NOP', GECE: 'GECE', OVERNIGHT: 'GECE', GUNICI: 'GUNICI', INTRADAY: 'GUNICI', STOP: 'STOP', VALOR: 'VALOR', VALUE: 'VALOR' };

function satirOku(tur, s) {
  if (tur === 'kur') {
    let p = parcala(s);
    if (p.length === 1) p = s.split(',').map(x => x.trim()).filter(Boolean);
    const c = pariteCoz(p[0]);
    if (!c || p.length !== 2 || kurTablosuCoz(s).hatalar.length) return ham(s);
    return { parite: `${c[0]}/${c[1]}`, deger: p[1] };
  }
  if (tur === 'tasima') {
    const p = parcala(s);
    if (tasimaGirdiCoz(s).hatalar.length || p.length < 2 || p.length > 3) return ham(s);
    const c = pariteCoz(p[0]);
    return { ad: c ? `${c[0]}/${c[1]}` : p[0].toUpperCase(), deger: p[p.length - 1] };
  }
  const r = limitleriCoz(s);
  if (r.hatalar.length || r.limitler.length !== 1) return ham(s);
  const l = r.limitler[0], p = s.trim().split(/\s+/);
  const t = LIMIT_TUR[p[0].toUpperCase()];
  const tutar = p[p.length - 1];
  if (t === 'NOP') return { tur: t, doviz: l.doviz, tutar };
  if (t === 'GECE') return { tur: t, tutar };
  if (t === 'GUNICI') return { tur: t, kapsam: l.kapsam, ad: l.ad, tutar };
  if (t === 'STOP') return { tur: t, kapsam: l.kapsam, ad: l.ad, tutar };
  return { tur: t, doviz: l.doviz, kova: l.kova, tutar };
}

export function satirlar(tur, metin) {
  return String(metin ?? '').split(/\r?\n/).map(x => x.trim()).filter(Boolean).map(s => (s.startsWith('#') ? yorum(s) : satirOku(tur, s)));
}

const temiz = v => String(v ?? '').trim().replace(/\s+/g, ' ');
export function satirMetni(tur, r, dil = 'tr') {
  if (r.yorum != null) return r.yorum;
  if (r.ham != null) return temiz(r.ham);
  if (tur === 'kur') return `${temiz(r.parite).toUpperCase()} ${temiz(r.deger)}`;
  if (tur === 'tasima') { const ad = temiz(r.ad).toUpperCase(); return `${ad}${pariteCoz(ad) ? ' TN' : ''} ${temiz(r.deger)}`; }
  const d = dil === 'en' ? 'en' : 'tr', tutar = temiz(r.tutar).replace(/\s/g, '');
  const kapsam = KAPSAM_YAZ[d][r.kapsam] ?? r.kapsam;
  switch (r.tur) {
    case 'NOP': return `NOP ${temiz(r.doviz).toUpperCase()} ${tutar}`;
    case 'GECE': return `${TUR_YAZ[d].GECE} ${tutar}`;
    case 'GUNICI': return `${TUR_YAZ[d].GUNICI} ${kapsam} ${temiz(r.ad)} ${tutar}`;
    case 'STOP': return `STOP ${kapsam}${r.kapsam === 'masa' ? '' : ` ${temiz(r.ad)}`} ${tutar}`;
    default: return `${TUR_YAZ[d].VALOR} ${temiz(r.doviz).toUpperCase()} ${d === 'en' ? KOVA_EN[r.kova] ?? r.kova : r.kova} ${tutar}`;
  }
}

// Boş satırlar (yeni eklenmiş, henüz doldurulmamış) metne yazılmaz.
// Değeri girilmemiş kur ve taşıma satırları da yazılmaz (eksik kur düğmesinin eklediği satırlar böyle başlar).
const bos = (tur, r) => r.yorum == null && r.ham == null && (tur === 'kur' || tur === 'tasima' ? !temiz(r.deger) : !temiz(r.tutar) && !temiz(r.ad));
export const metin = (tur, rs, dil) => rs.filter(r => !bos(tur, r)).map(r => satirMetni(tur, r, dil)).join('\n');

export function satirHatali(tur, r, dil) {
  if (r.yorum != null || bos(tur, r)) return false;
  const s = satirMetni(tur, r, dil);
  if (tur === 'kur') return kurTablosuCoz(s).hatalar.length > 0 || !Object.keys(kurTablosuCoz(s).tablo).length;
  if (tur === 'tasima') return tasimaGirdiCoz(s).hatalar.length > 0;
  const l = limitleriCoz(s);
  return l.hatalar.length > 0 || l.limitler.length !== 1;
}

export const yeniSatir = tur => (tur === 'kur' ? { parite: '', deger: '' } : tur === 'tasima' ? { ad: '', deger: '' } : { tur: 'NOP', doviz: 'USD', kapsam: 'trader', ad: '', kova: '≤ 1 ay', tutar: '' });

// ------------------------------------------------------------------ ekran
export function duzenleyiciKur(alan, tur, { t, dil }) {
  const kutu = document.createElement('div');
  kutu.className = 'b-tablo-duzen';
  const notlar = document.createElement('p'); notlar.className = 'dipnot b-tablo-not';
  const tablo = document.createElement('table'); tablo.className = 'b-girdi-tablo';
  const alt = document.createElement('div'); alt.className = 'b-tablo-alt';
  const ekle = document.createElement('button'); ekle.type = 'button'; ekle.className = 'kucuk'; ekle.textContent = t('Satır ekle');
  const gecis = document.createElement('button'); gecis.type = 'button'; gecis.className = 'kucuk b-metin-gecis'; gecis.textContent = t('Metin olarak yapıştır');
  alt.append(ekle, gecis);
  kutu.append(notlar, tablo, alt);
  alan.before(kutu);
  alan.hidden = true;
  let rs = [], metinModu = false;

  const yaz = () => {
    alan.value = metin(tur, rs, dil);
    alan.dispatchEvent(new Event('change'));
  };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const girdi = (deger, etiket, cls, oninput) => {
    const i = el('input', cls); i.value = deger ?? ''; i.setAttribute('aria-label', etiket); i.spellcheck = false;
    i.addEventListener('change', () => { oninput(i.value); isaretle(); yaz(); });
    return i;
  };
  const secim = (deger, etiket, secenekler, onchange) => {
    const s = el('select'); s.setAttribute('aria-label', etiket);
    for (const [v, ad] of secenekler) { const o = el('option', '', ad); o.value = v; s.append(o); }
    s.value = deger;
    s.addEventListener('change', () => { onchange(s.value); ciz(); yaz(); });
    return s;
  };
  // Hatalı satırı işaretler; çizimi baştan yapmadan (odak kaybolmasın).
  const isaretle = () => tablo.querySelectorAll('tbody tr').forEach((tr, i) => {
    const r = gorunen()[i];
    tr.classList.toggle('hatali-satir', !!r && satirHatali(tur, r, dil));
  });
  const gorunen = () => rs.filter(r => r.yorum == null);

  function basliklar() {
    if (tur === 'kur') return [t('Parite'), t('Kur'), ''];
    if (tur === 'tasima') return [t('Döviz ya da parite'), t('Faiz % ya da T/N'), ''];
    return [t('Limit'), t('Kapsam'), t('Ad ya da aralık'), t('Tutar (USD)'), ''];
  }

  function hucreler(r) {
    if (r.ham != null) {
      const i = girdi(r.ham, t('Okunamayan satır'), 'b-ham', v => { const yeni = satirlar(tur, v)[0] ?? { ham: v, hatali: true }; Object.keys(r).forEach(k => delete r[k]); Object.assign(r, yeni); });
      i.title = t('Bu satır okunamadı. Düzelt ya da sil.');
      i.addEventListener('change', () => ciz());
      const td = el('td'); td.colSpan = basliklar().length - 1; td.append(i);
      return [td];
    }
    const td = x => { const c = el('td'); if (x) c.append(x); return c; };
    if (tur === 'kur') return [td(girdi(r.parite, t('Parite'), 'b-kod', v => { r.parite = v; })), td(girdi(r.deger, t('Kur'), 'b-sayi', v => { r.deger = v; }))];
    if (tur === 'tasima') return [td(girdi(r.ad, t('Döviz ya da parite'), 'b-kod', v => { r.ad = v; })), td(girdi(r.deger, t('Faiz % ya da T/N'), 'b-sayi', v => { r.deger = v; }))];
    const turSec = secim(r.tur, t('Limit'), LIMIT_TURLERI.map(k => [k, t(LIMIT_TUR_AD[k])]), v => {
      r.tur = v;
      if ((v === 'NOP' || v === 'VALOR') && !/^[A-Z]{3}$/i.test(r.doviz ?? '')) r.doviz = 'USD';
      if (v === 'GUNICI' && r.kapsam === 'masa') r.kapsam = 'trader';
      if (v === 'STOP' && !r.kapsam) r.kapsam = 'masa';
      if (v === 'VALOR' && !r.kova) r.kova = '≤ 1 ay';
    });
    let a = null, b = null;
    if (r.tur === 'NOP' || r.tur === 'VALOR') a = girdi(r.doviz, t('Döviz'), 'b-kod', v => { r.doviz = v; });
    if (r.tur === 'GUNICI') a = secim(r.kapsam, t('Kapsam'), ['trader', 'portfoy'].map(k => [k, t(KAPSAM_AD[k])]), v => { r.kapsam = v; });
    if (r.tur === 'STOP') a = secim(r.kapsam, t('Kapsam'), ['masa', 'trader', 'portfoy'].map(k => [k, t(KAPSAM_AD[k])]), v => { r.kapsam = v; });
    if (r.tur === 'GUNICI' || (r.tur === 'STOP' && r.kapsam !== 'masa')) b = girdi(r.ad, t('Ad'), '', v => { r.ad = v; });
    if (r.tur === 'VALOR') b = secim(r.kova, t('Valör aralığı'), KOVALAR.map(k => [k, dil === 'en' ? KOVA_EN[k] ?? k : k]), v => { r.kova = v; });
    // Tutar basamak ayracıyla gösterilir (25,000,000); ayrıştırıcı ayraçlı tutarı okur.
    const ayracli = v => (/^\d+$/.test(temiz(v)) ? Number(temiz(v)).toLocaleString(dil === 'en' ? 'en-US' : 'tr-TR') : v);
    r.tutar = ayracli(r.tutar);
    return [td(turSec), td(a), td(b), td(girdi(r.tutar, t('Tutar (USD)'), 'b-sayi', v => { r.tutar = ayracli(v); }))];
  }

  function ciz() {
    const yorumlar = rs.filter(r => r.yorum != null).map(r => r.yorum.replace(/^#\s*/, ''));
    notlar.hidden = !yorumlar.length;
    notlar.textContent = yorumlar.map(x => t(x)).join(' · ');
    const thead = el('thead'), htr = el('tr');
    basliklar().forEach(h => htr.append(el('th', '', h)));
    thead.append(htr);
    const tbody = el('tbody');
    gorunen().forEach(r => {
      const tr = el('tr');
      tr.append(...hucreler(r));
      const sil = el('button', 'kucuk sil', '×'); sil.type = 'button'; sil.setAttribute('aria-label', t('Satırı sil'));
      sil.addEventListener('click', () => { rs.splice(rs.indexOf(r), 1); ciz(); yaz(); });
      const td = el('td', 'b-sil'); td.append(sil); tr.append(td);
      tbody.append(tr);
    });
    if (!gorunen().length) { const tr = el('tr'), td = el('td', 'dipnot', t('Henüz satır yok.')); td.colSpan = basliklar().length; tr.append(td); tbody.append(tr); }
    tablo.replaceChildren(thead, tbody);
    isaretle();
  }

  ekle.addEventListener('click', () => {
    rs.push(yeniSatir(tur));
    ciz();
    tablo.querySelector('tbody tr:last-child input, tbody tr:last-child select')?.focus();
  });
  gecis.addEventListener('click', () => {
    metinModu = !metinModu;
    alan.hidden = !metinModu; tablo.hidden = metinModu; ekle.hidden = metinModu; notlar.hidden = metinModu || notlar.hidden;
    gecis.textContent = t(metinModu ? 'Tablo olarak düzenle' : 'Metin olarak yapıştır');
    if (metinModu) alan.focus(); else yenile();
  });
  // Birden çok satır yapıştırılırsa (Excel'den kopya) tabloya satır satır eklenir.
  tablo.addEventListener('paste', e => {
    const s = e.clipboardData?.getData('text') ?? '';
    if (!/\n/.test(s.trim())) return;
    e.preventDefault();
    const odak = e.target.closest('tr');
    const i = odak ? [...tablo.querySelectorAll('tbody tr')].indexOf(odak) : -1;
    const yeni = satirlar(tur, s.split(/\r?\n/).map(x => x.replace(/\t/g, ' ')).join('\n'));
    const hedef = gorunen()[i];
    if (hedef && bos(tur, hedef)) rs.splice(rs.indexOf(hedef), 1, ...yeni); else rs.push(...yeni);
    ciz(); yaz();
  });
  alan.addEventListener('change', () => { if (metinModu) rs = satirlar(tur, alan.value); });

  function yenile() { rs = satirlar(tur, alan.value); ciz(); }
  // Verilen satırları ekler (aynı parite ya da döviz zaten varsa eklemez) ve ilk boş değere odaklanır.
  function ekleSatirlar(yeni) {
    const anahtar = r => temiz(r.parite ?? r.ad).toUpperCase();
    const var_ = new Set(rs.map(anahtar));
    for (const r of yeni) if (!var_.has(anahtar(r))) { rs.push(r); var_.add(anahtar(r)); }
    if (metinModu) gecis.click(); else ciz();
    const bosDeger = [...tablo.querySelectorAll('tbody input.b-sayi')].find(i => !i.value);
    bosDeger?.focus();
    return bosDeger ?? null;
  }
  yenile();
  return { yenile, ekleSatirlar };
}
