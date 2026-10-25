// Arayüz dili (Türkçe / İngilizce). Kaynak metin Türkçedir: t('Türkçe metin') İngilizcede
// sözlükteki karşılığı döner, karşılık yoksa Türkçe kalır. Değişkenler {ad} biçiminde yazılır:
// t('{n} sorun var', { n: 3 }).
//
// Dil sırası: ?dil=en|tr > sayfanın <html lang> özniteliği (lab sayfalarında yoktur; başka bir
// sayfa laboratuvarı kendi diliyle gömdüğünde kullanılır) > tarayıcıda kayıtlı seçim
// ('kalibre-dil') > İngilizce. Site küresel pazara İngilizce çıkar; Türkçe yalnız açıkça
// seçilince (?dil=tr ya da kayıtlı seçim) gelir. Node'da (testler) varsayılan Türkçedir.

import { EN } from './dil-en.js';

const DEPO = 'kalibre-dil';
const gecerli = d => d === 'tr' || d === 'en';

function oku() { try { return globalThis.localStorage?.getItem(DEPO) ?? null; } catch { return null; } }
function yaz(d) { try { globalThis.localStorage?.setItem(DEPO, d); } catch { /* depo yok */ } }

function belirle() {
  const loc = globalThis.location;
  if (!loc) return 'tr';
  const q = new URLSearchParams(loc.search ?? '').get('dil');
  if (gecerli(q)) { yaz(q); return q; }
  const h = (globalThis.document?.documentElement?.getAttribute('lang') ?? '').slice(0, 2).toLowerCase();
  if (gecerli(h)) return h;
  const k = oku();
  if (gecerli(k)) return k;
  return 'en';
}

export let dil = belirle();
export let yerel = dil === 'en' ? 'en-US' : 'tr-TR';
if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = dil;
// Logo site ana sayfasına gider: İngilizce kök "/", Türkçe "/tr".
if (dil === 'tr') for (const a of globalThis.document?.querySelectorAll?.('a.logo[href="/"]') ?? []) a.setAttribute('href', '/tr');

// Testler için: dili değiştirir (canlı bağlama: içe aktaranlar yeni değeri görür).
export function dilAyarla(d) {
  if (!gecerli(d)) return;
  dil = d;
  yerel = d === 'en' ? 'en-US' : 'tr-TR';
}

export function t(tr, d) {
  let s = dil === 'en' ? (EN[tr] ?? tr) : tr;
  if (d) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in d ? String(d[k]) : m));
  return s;
}

// Sayı biçimi: Türkçede ondalık virgül, İngilizcede nokta.
export const sayiMetni = (v, b = 1) => (dil === 'en' ? v.toFixed(b) : v.toFixed(b).replace('.', ','));
// Düz sayıyı (ör. 0.94) dile göre yazar; tam sayıyı olduğu gibi bırakır.
export const ondalik = v => (dil === 'en' ? String(v) : String(v).replace('.', ','));
// Yüzde: Türkçede %5, İngilizcede 5%.
export const yuzdeMetni = metin => (dil === 'en' ? `${metin}%` : `%${metin}`);
// İşaretli yüzde: +%5,2 / −%1,0 ya da +5.2% / −1.0%.
export const isaretliYuzde = (v, b = 1) => `${v >= 0 ? '+' : '−'}${yuzdeMetni(sayiMetni(Math.abs(v), b))}`;

// data-t: öğenin içeriği (boşluklar sadeleştirilmiş HTML) anahtar olarak çevrilir.
// data-t-attr="title,aria-label": bu özniteliklerin değerleri çevrilir.
export const sade = s => s.replace(/\s+/g, ' ').trim();
export function sayfayiCevir(kok = globalThis.document) {
  if (!kok || dil === 'tr') return;
  for (const el of kok.querySelectorAll('[data-t]')) {
    const k = sade(el.innerHTML);
    if (EN[k] !== undefined) el.innerHTML = EN[k];
  }
  for (const el of kok.querySelectorAll('[data-t-attr]')) {
    for (const a of el.dataset.tAttr.split(',')) {
      const v = el.getAttribute(a.trim());
      if (v && EN[v] !== undefined) el.setAttribute(a.trim(), EN[v]);
    }
  }
  if (kok.title && EN[kok.title] !== undefined) kok.title = EN[kok.title];
}

// Başlıktaki TR | EN anahtarı: seçimi kaydeder ve sayfayı o dilde yeniden açar.
export function dilAnahtari(yer) {
  if (!yer) return;
  const kutu = globalThis.document.createElement('span');
  kutu.className = 'dil-anahtari';
  kutu.setAttribute('role', 'group');
  kutu.setAttribute('aria-label', dil === 'en' ? 'Language' : 'Dil');
  for (const d of ['tr', 'en']) {
    const b = globalThis.document.createElement('button');
    b.type = 'button';
    b.textContent = d.toUpperCase();
    b.setAttribute('aria-pressed', String(d === dil));
    b.addEventListener('click', () => {
      if (d === dil) return;
      yaz(d);
      const u = new URL(globalThis.location.href);
      u.searchParams.set('dil', d);
      globalThis.location.href = u.toString();
    });
    kutu.append(b);
  }
  yer.prepend(kutu);
}
