// Basit mod arayüzü: stratejiyi tarif gibi dört bölümde, hazır kalıplı kartlarla kurdurur.
// Strateji nesnesi uygulama.js'teki `s`'tir; burada yalnız bloklar.js işlevleriyle değiştirilir.
// Genel ayarlar, risk ve filtre alanları formdaki data-yol / data-eylem düzenini kullanır; o alanları
// uygulama.js'in kendi dinleyicileri işler. Blok kartları data-blok kullanır ve burada işlenir.

import {
  stratejidenBloklar, oku, operandCoz, blokEkle, blokSil, blokTasi, grupTuru, kosulAyarla,
  gostergeAyarla, tarafaGosterge, mesafeAyarla, SABLONLAR,
} from './bloklar.js';
import { ZAMAN_DILIMLERI, HATLAR } from './dogrula.js';
import { t as ceviri, dil } from './dil.js';
import { kacis } from './guvenlik.js';

const MOD_ANAHTARI = 'kalibre-lab-mod';

// Basit modun stili ayrı dosyada; sayfa HTML'ine dokunmadan bir kez eklenir.
if (globalThis.document && !document.querySelector('link[data-blok-stil]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = new URL('../blok.css', import.meta.url).href; l.dataset.blokStil = '';
  document.head.append(l);
}

export function modOku() {
  try { return localStorage.getItem(MOD_ANAHTARI) === 'ileri' ? 'ileri' : 'basit'; } catch { return 'basit'; }
}
function modYaz(m) { try { localStorage.setItem(MOD_ANAHTARI, m); } catch { /* depo yok */ } }

export function modAnahtari(mod) {
  const b = (m, ad) => `<button type="button" data-blok="mod" data-mod="${kacis(m)}" aria-pressed="${kacis(mod === m)}">${ceviri(ad)}</button>`;
  return `<div class="mod-satiri">
    <span class="dil-anahtari mod-anahtari" role="group" aria-label="${kacis(ceviri('Kurucu modu'))}">${b('basit', 'Basit')}${b('ileri', 'İleri')}</span>
    <span class="ipucu">${ceviri('Basit: hazır kalıplarla kur. İleri: her ayrıntıyı elle düzenle. İkisi aynı stratejiyi düzenler.')}</span>
  </div>`;
}

// ---------------------------------------------------------------- metinler
const SABLON_AD = {
  kesisim: 'İki çizgi kesişirse',
  esik: 'Gösterge bir eşiği geçerse',
  bant: 'Fiyat Bollinger bandının dışına çıkarsa',
  rsi: 'RSI aşırı alım / aşırı satım',
  trend: 'Trend güçlüyse (ADX)',
  karsilastir: 'İki değeri karşılaştır',
  gelismis: 'Gelişmiş koşul',
};
const OP_AD = { '>': 'büyükse', '<': 'küçükse', '>=': 'büyük ya da eşitse', '<=': 'küçük ya da eşitse', yukari_keser: 'yukarı keserse', asagi_keser: 'aşağı keserse' };
const FIYATLAR = [['fiyat.kapanis', 'Kapanış fiyatı'], ['fiyat.acilis', 'Açılış fiyatı'], ['fiyat.yuksek', 'Yüksek'], ['fiyat.dusuk', 'Düşük']];
const HAT_AD = { orta: 'orta bant', ust: 'üst bant', alt: 'alt bant', sinyal: 'sinyal', arti: '+DI', eksi: '−DI', oran: 'oran', uzun: 'uzun dönem' };
const YENI = [['EMA', 20], ['SMA', 50], ['RSI', 14], ['ADX', 14], ['ATR', 14]];

function gostergeEtiketi(ad, t) {
  if (!t) return ad;
  if (t.tip === 'MACD') return `MACD ${t.hizli}/${t.yavas}/${t.sinyal}`;
  if (t.tip === 'BB') return `Bollinger ${t.periyot}`;
  if (t.periyot !== undefined) return `${t.tip} ${t.periyot}`;
  return t.tip;
}

// ---------------------------------------------------------------- operand düzenleyici
function operandSecici(s, konum, deger, { sayiYok = true } = {}) {
  const g = s.gostergeler ?? {};
  const op = operandCoz(deger, g);
  let html = `<select data-blok="operand" data-konum="${kacis(konum)}" aria-label="${kacis(ceviri('Değer'))}">`;
  for (const [v, e] of FIYATLAR) html += `<option value="${kacis(v)}"${v === deger ? ' selected' : ''}>${ceviri(e)}</option>`;
  for (const [ad, t] of Object.entries(g)) {
    const hatlar = (HATLAR[t.tip] ?? ['']).filter(h => h !== 'ana' && !(t.tip === 'BB' && h === ''));
    for (const h of hatlar) {
      const v = h ? `${ad}.${h}` : ad;
      const secili = v === deger || (op && op.ad === ad && (op.hat === h || (op.hat === 'ana' && h === '') || (t.tip === 'BB' && op.hat === '' && h === 'orta')));
      html += `<option value="${kacis(v)}"${secili ? ' selected' : ''}>${kacis(gostergeEtiketi(ad, t))}${h ? ' · ' + ceviri(HAT_AD[h] ?? h) : ''}</option>`;
    }
  }
  if (typeof deger === 'string' && op?.tip === null) html += `<option value="${kacis(deger)}" selected>${kacis(deger)} (${ceviri('tanımsız')})</option>`;
  for (const [tip, p] of YENI) html += `<option value="#yeni:${tip}:${p}">${ceviri('Yeni: {g}', { g: `${tip} ${p}` })}</option>`;
  html += '</select>';
  return html + periyotAlani(s, konum, deger);
}

function periyotAlani(s, konum, deger) {
  const op = operandCoz(deger, s.gostergeler ?? {});
  const t = op && op.tip !== 'fiyat' ? s.gostergeler?.[op.ad] : null;
  if (!t || t.periyot === undefined) return '';
  let html = `<label class="mini" data-hata-yol="gostergeler.${kacis(op.ad)}">${ceviri('periyot')}<input type="number" min="1" max="1000" step="1" data-blok="periyot" data-konum="${kacis(konum)}" value="${kacis(t.periyot)}"></label>`;
  if (t.tip === 'BB') html += `<label class="mini">σ<input type="number" min="0.1" max="10" step="0.1" data-blok="sapma" data-konum="${kacis(konum)}" value="${kacis(t.sapma)}"></label>`;
  return html;
}

const opSecici = (yol, op, liste) => `<select data-blok="op" data-byol="${kacis(yol)}" aria-label="${kacis(ceviri('Karşılaştırma'))}">${liste
  .map(o => `<option value="${kacis(o)}"${o === op ? ' selected' : ''}>${ceviri(OP_AD[o])}</option>`).join('')}</select>`;
const sayiGirdisi = (yol, v, etiket) => `<input type="number" step="any" data-blok="sayi" data-byol="${kacis(yol)}" value="${kacis(v)}" aria-label="${kacis(ceviri(etiket))}">`;

// ---------------------------------------------------------------- kartlar
const cumle = (a, baglac, b, yuklem) => dil === 'en'
  ? `<div class="cumle">${a}${yuklem}${b}</div>`
  : `<div class="cumle">${a}<span>${ceviri(baglac)}</span>${b}${yuklem}</div>`;

function blokGovdesi(s, b) {
  const y = b.yol;
  switch (b.sablon) {
    // Türkçede yüklem sondadır ("A, B'yi yukarı keserse"); İngilizcede ortada ("A crosses above B").
    case 'kesisim':
      return cumle(operandSecici(s, `${y}.sol`, b.sol), ', şu çizgiyi', operandSecici(s, `${y}.sag`, b.sag), opSecici(y, b.op, ['yukari_keser', 'asagi_keser']));
    case 'karsilastir':
      return cumle(operandSecici(s, `${y}.sol`, b.sol), ', şundan', operandSecici(s, `${y}.sag`, b.sag), opSecici(y, b.op, ['>', '<', '>=', '<=']));
    case 'esik':
      return cumle(operandSecici(s, `${y}.sol`, b.sol), ', şu sayıdan', sayiGirdisi(y, b.sag, 'Eşik'), opSecici(y, b.op, ['>', '<', '>=', '<=']));
    case 'rsi': {
      const sec = `<select data-blok="op" data-byol="${kacis(y)}" aria-label="${kacis(ceviri('Bölge'))}">
        <option value="<"${b.op === '<' ? ' selected' : ''}>${ceviri('aşırı satımda: şu sayının altında')}</option>
        <option value=">"${b.op === '>' ? ' selected' : ''}>${ceviri('aşırı alımda: şu sayının üstünde')}</option></select>`;
      return `<div class="cumle"><span>RSI</span>${periyotAlani(s, `${y}.sol`, b.sol)}${sec}${sayiGirdisi(y, b.sag, 'Eşik')}</div>`;
    }
    case 'trend':
      return `<div class="cumle"><span>ADX</span>${periyotAlani(s, `${y}.sol`, b.sol)}<span>${ceviri('şu sayının üstünde (trend güçlü)')}</span>${sayiGirdisi(y, b.sag, 'Eşik')}</div>`;
    case 'bant': {
      const hat = operandCoz(b.sag, s.gostergeler ?? {})?.hat;
      const sec = `<select data-blok="bant" data-byol="${kacis(y)}" aria-label="${kacis(ceviri('Bant'))}">
        <option value="alt"${hat === 'alt' ? ' selected' : ''}>${ceviri('alt bandın altına inerse')}</option>
        <option value="ust"${hat === 'ust' ? ' selected' : ''}>${ceviri('üst bandın üstüne çıkarsa')}</option></select>`;
      return `<div class="cumle">${operandSecici(s, `${y}.sol`, b.sol)}<span>${ceviri(', Bollinger')}</span>${periyotAlani(s, `${y}.sag`, b.sag)}${sec}</div>`;
    }
  }
  const ham = b.ham ?? { sol: b.sol, op: b.op, sag: b.sag };
  return `<p class="ipucu"><code>${kacis(JSON.stringify(ham))}</code></p><p class="ipucu">${ceviri('Bu koşul hazır bir kalıba uymuyor; olduğu gibi korunur. İleri modda düzenleyebilirsin.')}</p>`;
}

function grupKarti(s, m, yol, baslik) {
  const gr = m.gruplar[yol];
  const bloklar = gr?.bloklar ?? [];
  const baglac = ceviri(gr?.tur === 'herhangi' ? 'VEYA' : 'VE');
  const kartlar = bloklar.map((b, i) => (i ? `<div class="baglac">${baglac}</div>` : '') + `<div class="blok" data-hata-yol="${kacis(b.yol)}">
      <div class="blok-bas">
        <span class="ad">${ceviri(SABLON_AD[b.sablon])}</span>
        <span class="blok-eylem">
          <button type="button" class="kucuk" data-blok="yukari" data-byol="${kacis(yol)}" data-i="${kacis(i)}"${i === 0 ? ' disabled' : ''} aria-label="${kacis(ceviri('Yukarı taşı'))}">↑</button>
          <button type="button" class="kucuk" data-blok="asagi" data-byol="${kacis(yol)}" data-i="${kacis(i)}"${i === bloklar.length - 1 ? ' disabled' : ''} aria-label="${kacis(ceviri('Aşağı taşı'))}">↓</button>
          <button type="button" class="kucuk sil" data-blok="sil" data-byol="${kacis(yol)}" data-i="${kacis(i)}" aria-label="${kacis(ceviri('Koşulu sil'))}">✕</button>
        </span>
      </div>
      ${blokGovdesi(s, b)}
    </div>`).join('');
  const tur = bloklar.length > 1 ? `<select class="grup-tur" data-blok="tur" data-byol="${kacis(yol)}" aria-label="${kacis(ceviri('Koşulların nasıl birleşeceği'))}">
      <option value="hepsi"${gr.tur === 'hepsi' ? ' selected' : ''}>${ceviri('hepsi birden (VE)')}</option>
      <option value="herhangi"${gr.tur === 'herhangi' ? ' selected' : ''}>${ceviri('herhangi biri (VEYA)')}</option></select>` : '';
  const palet = `<details class="palet"><summary class="kucuk ekle">${ceviri('+ Koşul ekle')}</summary><div class="palet-liste">${SABLONLAR
    .map(k => `<button type="button" class="kucuk" data-blok="ekle" data-byol="${kacis(yol)}" data-sablon="${kacis(k)}">${ceviri(SABLON_AD[k])}</button>`).join('')}</div></details>`;
  return `<div class="grup blok-grup" data-hata-yol="${kacis(yol)}">
    <div class="grup-bas"><span class="ad">${ceviri(baslik)}</span>${tur}</div>
    ${bloklar.length ? `<div class="kosullar">${kartlar}</div>` : `<p class="ipucu">${ceviri('Henüz koşul yok.')}</p>`}
    ${gr?.bozuk !== undefined ? `<p class="ipucu">${ceviri('Bu grup okunamadı; İleri modda düzelt.')}</p>` : palet}
  </div>`;
}

function mesafeKarti(s, yol, baslik, tipler) {
  const mm = oku(s, yol);
  const tip = mm?.tip ?? '';
  const liste = tipler.concat(tip === 'oynaklik' ? [['oynaklik', 'Oynaklık katı']] : []);
  let ic = '';
  if (tip === 'atr') {
    const p = s.gostergeler?.[mm.gosterge]?.periyot ?? 14;
    ic = `<label class="mini">${ceviri('ATR periyodu')}<input type="number" min="1" max="1000" step="1" data-blok="mesafe-periyot" data-byol="${kacis(yol)}" value="${kacis(p)}"></label>
          <label class="mini">${ceviri('kaç katı')}<input type="number" min="0.1" step="0.1" data-blok="mesafe-alan" data-alan="carpan" data-byol="${kacis(yol)}" value="${kacis(mm.carpan)}"></label>`;
  } else if (tip === 'oynaklik') {
    ic = `<label class="mini">${ceviri('kaç katı')}<input type="number" min="0.1" step="0.1" data-blok="mesafe-alan" data-alan="carpan" data-byol="${kacis(yol)}" value="${kacis(mm.carpan)}"></label>`;
  } else if (tip) {
    const e = { yuzde: 'yüzde', puan: 'puan', r: 'stopun kaç katı' }[tip];
    ic = `<label class="mini">${ceviri(e)}<input type="number" min="0" step="any" data-blok="mesafe-alan" data-alan="deger" data-byol="${kacis(yol)}" value="${kacis(mm.deger)}"></label>`;
  }
  const sec = `<select data-blok="mesafe-tip" data-byol="${kacis(yol)}" aria-label="${kacis(ceviri(baslik))}">${liste
    .map(([v, e]) => `<option value="${kacis(v)}"${v === tip ? ' selected' : ''}>${ceviri(e)}</option>`).join('')}</select>`;
  return `<div class="mesafe" data-hata-yol="${kacis(yol)}"><span class="etiket">${ceviri(baslik)}</span><div class="cumle">${sec}${ic}</div></div>`;
}

const sayiAlani = (s, yol, etiket, { min = '', max = '', adim = 'any', yer = '' } = {}) =>
  `<label class="alan">${ceviri(etiket)}<input type="number" data-yol="${kacis(yol)}" data-tur="sayi" min="${kacis(min)}" max="${kacis(max)}" step="${kacis(adim)}" placeholder="${kacis(ceviri(yer))}" value="${kacis(oku(s, yol) ?? '')}"></label>`;

// ---------------------------------------------------------------- form
export function blokFormu(s) {
  const m = stratejidenBloklar(s);
  const zd = ZAMAN_DILIMLERI.map(z => `<option${z === s.zaman_dilimi ? ' selected' : ''}>${z}</option>`).join('');
  const yon = [['iki_yon', 'İki yön'], ['sadece_long', 'Sadece long'], ['sadece_short', 'Sadece short']]
    .map(([v, e]) => `<option value="${kacis(v)}"${(s.yon ?? 'iki_yon') === v ? ' selected' : ''}>${ceviri(e)}</option>`).join('');
  const f = s.filtre ?? {};
  const r = s.risk ?? {};
  return `
  <section class="kart">
    <div class="alanlar">
      <label class="alan genis">${ceviri('Strateji adı')}<input data-yol="ad" maxlength="60" value="${kacis(s.ad)}"></label>
      <label class="alan">${ceviri('Zaman dilimi')}<select data-yol="zaman_dilimi" data-eylem="secim">${zd}</select></label>
      <label class="alan">${ceviri('Yön')}<select data-yol="yon" data-eylem="secim">${yon}</select></label>
    </div>
  </section>

  <section class="kart">
    <h2><span class="bolum-no">1</span>${ceviri('Ne zaman gireyim?')}</h2>
    ${grupKarti(s, m, 'giris.long', 'Alış (long) için')}
    ${grupKarti(s, m, 'giris.short', 'Satış (short) için')}
    <p class="ipucu">${ceviri('Koşullar her yeni mumun açılışında, kapanmış son mumla değerlendirilir.')}</p>
  </section>

  <section class="kart">
    <h2><span class="bolum-no">2</span>${ceviri('Ne zaman çıkayım?')}</h2>
    ${mesafeKarti(s, 'cikis.stop', 'Zarar durdur (zorunlu)', [['atr', 'ATR katı'], ['yuzde', 'Fiyatın yüzdesi'], ['puan', 'Puan']])}
    ${mesafeKarti(s, 'cikis.hedef', 'Kâr al', [['', 'Yok'], ['r', 'Stopun katı (R)'], ['atr', 'ATR katı'], ['yuzde', 'Fiyatın yüzdesi'], ['puan', 'Puan']])}
    ${mesafeKarti(s, 'cikis.iz_suren_stop', 'İz süren stop', [['', 'Yok'], ['atr', 'ATR katı'], ['yuzde', 'Fiyatın yüzdesi'], ['puan', 'Puan']])}
    <div class="alanlar" style="margin:4px 0 12px">${sayiAlani(s, 'cikis.max_bar', 'En çok kaç mum açık kalsın', { min: 1, max: 10000, adim: 1, yer: 'sınırsız' })}</div>
    ${grupKarti(s, m, 'cikis.kosul.long', 'Alıştan kuralla çık (isteğe bağlı)')}
    ${grupKarti(s, m, 'cikis.kosul.short', 'Satıştan kuralla çık (isteğe bağlı)')}
  </section>

  <section class="kart">
    <h2><span class="bolum-no">3</span>${ceviri('Ne kadar risk?')}</h2>
    <p class="ipucu">${ceviri('Bunları sen belirlersin; hazır değer verilmez.')}</p>
    <div class="alanlar">
      ${sayiAlani(s, 'risk.islem_basi_yuzde', 'İşlem başı risk (bakiyenin %)', { min: 0.01, max: 5, adim: 0.1 })}
      ${sayiAlani(s, 'risk.gunluk_max_kayip_yuzde', 'Günlük kayıp sınırı (%)', { min: 0.1, max: 20, adim: 0.1, yer: 'yok' })}
      ${sayiAlani(s, 'risk.max_acik_pozisyon', 'Azami açık pozisyon', { min: 1, max: 10, adim: 1, yer: '1' })}
    </div>
    ${r.volatilite_hedefi ? `<p class="ipucu">${ceviri('Oynaklığa göre ölçekleme açık; İleri modda düzenlenir.')}</p>` : ''}
  </section>

  <section class="kart">
    <h2><span class="bolum-no">4</span>${ceviri('Ne zaman işlem yapmayayım?')}</h2>
    <div class="grup${f.saat ? '' : ' kapali'}">
      <div class="grup-bas"><input type="checkbox" data-eylem="filtre-ac" data-ad="saat"${f.saat ? ' checked' : ''} aria-label="${kacis(ceviri('Saat penceresi'))}"><span class="ad">${ceviri('Yalnız şu saatler arasında işlem aç')}</span></div>
      ${f.saat ? `<div class="alanlar" style="margin-top:10px">
        ${sayiAlani(s, 'filtre.saat.bas', 'Başlangıç saati', { min: 0, max: 23, adim: 1 })}
        ${sayiAlani(s, 'filtre.saat.bit', 'Bitiş saati', { min: 0, max: 24, adim: 1 })}</div>` : ''}
    </div>
    <div class="grup${f.haber ? '' : ' kapali'}">
      <div class="grup-bas"><input type="checkbox" data-eylem="filtre-ac" data-ad="haber"${f.haber ? ' checked' : ''} aria-label="${kacis(ceviri('Haber filtresi'))}"><span class="ad">${ceviri('Önemli haberlerin çevresinde işlem açma')}</span></div>
      ${f.haber ? `<div class="alanlar" style="margin-top:10px">
        ${sayiAlani(s, 'filtre.haber.once_dk', 'Önce (dk)', { min: 0, max: 1440, adim: 1, yer: '30' })}
        ${sayiAlani(s, 'filtre.haber.sonra_dk', 'Sonra (dk)', { min: 0, max: 1440, adim: 1, yer: '30' })}</div>` : ''}
    </div>
  </section>`;
}

// ---------------------------------------------------------------- olaylar
// sec: { al(): s, koy(s), ciz(): formu ve paneli yeniden çizer, panel(): yalnız paneli yeniler }
export function blokDinle(kok, sec) {
  const uygula = (yeni, ciz = true) => { sec.koy(yeni); ciz ? sec.ciz() : sec.panel(); };
  const kosulYolu = konum => konum.split('.').slice(0, -1).join('.');
  kok.addEventListener('click', e => {
    const el = e.target.closest('button[data-blok]');
    if (!el) return;
    const s = sec.al(), yol = el.dataset.byol, i = Number(el.dataset.i);
    switch (el.dataset.blok) {
      case 'mod': modYaz(el.dataset.mod); sec.ciz(); return;
      case 'ekle': uygula(blokEkle(s, yol, el.dataset.sablon)); return;
      case 'sil': uygula(blokSil(s, yol, i)); return;
      case 'yukari': uygula(blokTasi(s, yol, i, -1)); return;
      case 'asagi': uygula(blokTasi(s, yol, i, 1)); return;
    }
  });
  kok.addEventListener('change', e => {
    const el = e.target.closest('[data-blok]');
    if (!el || el.tagName === 'BUTTON') return;
    const s = sec.al(), yol = el.dataset.byol, konum = el.dataset.konum, v = el.value;
    const sayi = Number(v);
    switch (el.dataset.blok) {
      case 'operand': {
        if (v.startsWith('#yeni:')) {
          const [, tip, p] = v.split(':');
          uygula(tarafaGosterge(s, konum, { tip, periyot: Number(p) }));
        } else uygula(kosulAyarla(s, kosulYolu(konum), konum.split('.').at(-1), v));
        return;
      }
      case 'op': uygula(kosulAyarla(s, yol, 'op', v)); return;
      case 'tur': uygula(grupTuru(s, yol, v)); return;
      case 'bant': {
        const bb = oku(s, `${yol}.sag`).split('.')[0];
        let y = kosulAyarla(s, yol, 'sag', `${bb}.${v}`);
        y = kosulAyarla(y, yol, 'op', v === 'alt' ? '<' : '>');
        uygula(y);
        return;
      }
      case 'periyot': if (Number.isInteger(sayi) && sayi > 0) uygula(gostergeAyarla(s, konum, { periyot: sayi })); return;
      case 'sapma': if (sayi > 0) uygula(gostergeAyarla(s, konum, { sapma: sayi })); return;
      case 'mesafe-tip': uygula(mesafeAyarla(s, yol, v)); return;
      case 'mesafe-periyot': if (Number.isInteger(sayi) && sayi > 0) uygula(mesafeAyarla(s, yol, 'atr', { periyot: sayi })); return;
    }
  });
  // Sayı girdileri yazarken paneli yeniler; form yeniden çizilmez, imleç yerinde kalır.
  kok.addEventListener('input', e => {
    const el = e.target.closest('input[data-blok]');
    if (!el) return;
    const s = sec.al(), yol = el.dataset.byol;
    if (!Number.isFinite(el.valueAsNumber)) return;
    if (el.dataset.blok === 'sayi') uygula(kosulAyarla(s, yol, 'sag', el.valueAsNumber), false);
    else if (el.dataset.blok === 'mesafe-alan') uygula(kosulAyarla(s, yol, el.dataset.alan, el.valueAsNumber), false);
  });
}
