// Kalibre Lab · Kodsuz strateji kurucu.
// Durum = strateji JSON'unun kendisi. Form ondan çizilir, her değişiklikte
// doğrulama, özet, sentetik prova ve JSON önizlemesi yenilenir.

import { dogrula, v2Ozellikleri, ZAMAN_DILIMLERI, GOSTERGE_TIPLERI, OPERATORLER, HATLAR, OYNAKLIK } from './dogrula.js';
import { ozet, gostergeTanimi } from './ozet.js';
import { prova } from './motor.js';
import { uret, REJIMLER } from './sentetik.js';
import { dosyaCoz } from './veri/dosya.js';
import { mt5Panel } from './baglanti-arayuz.js';
import { dil, t as ceviri, sayiMetni, isaretliYuzde, yuzdeMetni, sayfayiCevir, dilAnahtari } from './dil.js';

const TASLAK_ANAHTARI = 'kalibre-lab-taslak';
const $ = s => document.querySelector(s);
const sayi = (v, b = 1) => sayiMetni(v, b);
const kacis = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const BOS = () => ({
  kalibre: 1,
  ad: ceviri('Yeni strateji'),
  zaman_dilimi: 'H1',
  gostergeler: { atr: { tip: 'ATR', periyot: 14 } },
  giris: { long: { hepsi: [{ sol: 'fiyat.kapanis', op: '>', sag: 'fiyat.acilis' }] } },
  cikis: { stop: { tip: 'atr', gosterge: 'atr', carpan: 2 } },
  risk: { islem_basi_yuzde: 1 },
});

let s = taslakOku() ?? BOS();
let hatalar = [];
let provaZamanlayici = 0;
const ISTENEN_SEMBOL = (new URLSearchParams(location.search).get('sembol') ?? '').trim().slice(0, 32);
let provaVeri = null; // kullanıcının bıraktığı dosya (dosyaCoz sonucu)
let mt5Veri = null;   // MetaTrader köprüsünden gelen seri (aynı biçim)
let mt5 = null;

// ---------------------------------------------------------------- yol yardımcıları
const parcala = yol => yol.split('.').map(p => (/^\d+$/.test(p) ? Number(p) : p));
function al(yol) {
  return parcala(yol).reduce((o, k) => (o == null ? undefined : o[k]), s);
}
function koy(yol, deger) {
  const p = parcala(yol);
  let o = s;
  for (let i = 0; i < p.length - 1; i++) {
    if (o[p[i]] == null) o[p[i]] = typeof p[i + 1] === 'number' ? [] : {};
    o = o[p[i]];
  }
  const son = p.at(-1);
  if (deger === undefined) {
    if (Array.isArray(o)) o.splice(son, 1); else delete o[son];
  } else o[son] = deger;
}

// ---------------------------------------------------------------- taslak
function taslakOku() {
  try { const v = localStorage.getItem(TASLAK_ANAHTARI); return v ? JSON.parse(v) : null; } catch { return null; }
}
function taslakYaz() {
  try { localStorage.setItem(TASLAK_ANAHTARI, JSON.stringify(s)); } catch { /* özel pencere vb. */ }
}

// ---------------------------------------------------------------- operand seçenekleri
const HAT_ETIKET = { '': '', ana: 'ana', orta: 'orta bant', ust: 'üst bant', alt: 'alt bant', sinyal: 'sinyal', arti: '+DI', eksi: '−DI', oran: 'oran (olağana göre)', uzun: 'uzun dönem' };
function operandSecenekleri() {
  const liste = [];
  for (const [ad, t] of Object.entries(s.gostergeler ?? {})) {
    const hatlar = (HATLAR[t.tip] ?? ['']).filter(h => h !== 'ana' || t.tip === 'MACD' || t.tip === 'ADX');
    for (const h of hatlar) {
      if (h === '' && (t.tip === 'BB')) continue; // BB'de hatlar açıkça seçilsin
      if (h === 'ana') continue;               // '' zaten ana hat
      liste.push({ deger: h ? `${ad}.${h}` : ad, etiket: `${ad}${h ? ' · ' + ceviri(HAT_ETIKET[h]) : ''}  (${gostergeTanimi(t)})` });
    }
  }
  liste.push(
    { deger: 'fiyat.kapanis', etiket: ceviri('Kapanış fiyatı') },
    { deger: 'fiyat.acilis', etiket: ceviri('Açılış fiyatı') },
    { deger: 'fiyat.yuksek', etiket: ceviri('Yüksek') },
    { deger: 'fiyat.dusuk', etiket: ceviri('Düşük') },
  );
  return liste;
}
const OP_ETIKET = { '>': 'büyükse', '<': 'küçükse', '>=': 'büyük/eşitse', '<=': 'küçük/eşitse', yukari_keser: 'yukarı keserse', asagi_keser: 'aşağı keserse' };

// 'adx.ana' ile 'adx', 'bb' ile 'bb.orta' aynı hattır; seçim listesinde eşleştirmek için.
function normalOperand(v) {
  if (typeof v !== 'string') return v;
  const [ad, hat = ''] = v.split('.');
  if (hat === 'ana') return ad;
  if (hat === '' && s.gostergeler?.[ad]?.tip === 'BB') return `${ad}.orta`;
  return v;
}

function operandSelect(yol, deger, sayiIzinli) {
  const sec = operandSecenekleri();
  const sayiMi = typeof deger === 'number';
  const n = normalOperand(deger);
  const bilinen = sayiMi || sec.some(o => o.deger === n);
  let html = `<select data-eylem="operand" data-yol="${yol}" aria-label="${ceviri(yol.endsWith('.sol') ? 'Sol taraf' : 'Sağ taraf')}">`;
  if (!bilinen) html += `<option value="${kacis(deger)}" selected>${kacis(deger)} (${ceviri('tanımsız')})</option>`;
  for (const o of sec) html += `<option value="${kacis(o.deger)}"${o.deger === n ? ' selected' : ''}>${kacis(o.etiket)}</option>`;
  if (sayiIzinli) html += `<option value="#sayi"${sayiMi ? ' selected' : ''}>${ceviri('Sayı…')}</option>`;
  html += '</select>';
  if (sayiMi) html += `<input type="number" step="any" data-yol="${yol}" data-tur="sayi" value="${deger}" aria-label="${ceviri('Karşılaştırılan sayı')}">`;
  return html;
}

// ---------------------------------------------------------------- form çizimi
function alan(etiket, ic, sinif = '') {
  return `<label class="alan ${sinif}">${ceviri(etiket)}${ic}</label>`;
}
function sayiAlani(yol, etiket, { min = '', max = '', adim = 'any', yer = '' } = {}) {
  const v = al(yol);
  return alan(etiket, `<input type="number" data-yol="${yol}" data-tur="sayi" min="${min}" max="${max}" step="${adim}" placeholder="${ceviri(yer)}" value="${v ?? ''}">`);
}

function gostergeHtml(ad, t) {
  const y = `gostergeler.${ad}`;
  let p = '';
  if (t.tip === 'MACD') {
    p = sayiAlani(`${y}.hizli`, 'Hızlı', { min: 1, max: 1000, adim: 1 }) +
        sayiAlani(`${y}.yavas`, 'Yavaş', { min: 2, max: 1000, adim: 1 }) +
        sayiAlani(`${y}.sinyal`, 'Sinyal', { min: 1, max: 1000, adim: 1 });
  } else if (t.tip === 'EWMA_VOL') {
    p = sayiAlani(`${y}.lambda`, 'λ (bozunma)', { min: 0.8, max: 0.999, adim: 0.01, yer: '0,94' });
  } else if (t.tip === 'GARCH_VOL') {
    const sec = (alanAd, etiket, secenekler, vars) => alan(etiket, `<select data-yol="${y}.${alanAd}" data-eylem="secim">${secenekler
      .map(([v, e]) => `<option value="${v}"${(t[alanAd] ?? vars) === v ? ' selected' : ''}>${ceviri(e)}</option>`).join('')}</select>`);
    p = sec('model', 'Model', [['garch', 'GARCH'], ['gjr', 'GJR (asimetrik)'], ['egarch', 'EGARCH']], 'garch') +
        sec('dagilim', 'Dağılım', [['normal', 'Normal'], ['t', 'Student-t (kalın kuyruk)']], 'normal') +
        sayiAlani(`${y}.pencere`, 'Pencere (mum)', { min: 250, max: 5000, adim: 1, yer: '1000' }) +
        sayiAlani(`${y}.yenile`, 'Kaç mumda bir kestir', { min: 1, max: 500, adim: 1, yer: '24' });
  } else {
    p = sayiAlani(`${y}.periyot`, 'Periyot', { min: t.tip === 'BB' || t.tip === 'YZ_VOL' ? 2 : 1, max: 1000, adim: 1 });
    if (t.tip === 'BB') p += sayiAlani(`${y}.sapma`, 'Sapma (σ)', { min: 0.1, max: 10, adim: 0.1 });
  }
  const tipler = GOSTERGE_TIPLERI.map(x => `<option${x === t.tip ? ' selected' : ''}>${x}</option>`).join('');
  return `<div class="gosterge" data-hata-yol="${y}">
    ${alan('Ad', `<input data-eylem="gosterge-ad" data-ad="${kacis(ad)}" value="${kacis(ad)}" spellcheck="false">`, 'ad')}
    ${alan('Tip', `<select data-eylem="gosterge-tip" data-ad="${kacis(ad)}">${tipler}</select>`)}
    ${p}
    <button type="button" class="kucuk sil" data-eylem="gosterge-sil" data-ad="${kacis(ad)}">${ceviri('Sil')}</button>
  </div>`;
}

function grupHtml(yol, baslik, ipucu) {
  const gr = al(yol);
  const acik = gr !== undefined;
  const tur = acik ? (gr.hepsi ? 'hepsi' : 'herhangi') : 'hepsi';
  const liste = acik ? gr[tur] ?? [] : [];
  const baglac = ceviri(tur === 'hepsi' ? 'VE' : 'VEYA');
  baslik = ceviri(baslik);
  ipucu = ceviri(ipucu);
  const satirlar = liste.map((k, i) => {
    const ky = `${yol}.${tur}.${i}`;
    const ops = OPERATORLER.map(o => `<option value="${o}"${o === k.op ? ' selected' : ''}>${ceviri(OP_ETIKET[o])}</option>`).join('');
    return (i ? `<div class="baglac">${baglac}</div>` : '') + `<div class="kosul" data-hata-yol="${ky}">
      ${operandSelect(`${ky}.sol`, k.sol, false)}
      <select data-yol="${ky}.op" data-eylem="secim" aria-label="${ceviri('Karşılaştırma')}">${ops}</select>
      <span class="sag">${operandSelect(`${ky}.sag`, k.sag, true)}</span>
      <button type="button" class="kucuk sil" data-eylem="kosul-sil" data-yol="${ky}" title="${ceviri('Koşulu sil')}">✕</button>
    </div>`;
  }).join('');
  return `<div class="grup${acik ? '' : ' kapali'}" data-hata-yol="${yol}">
    <div class="grup-bas">
      <input type="checkbox" data-eylem="grup-ac" data-yol="${yol}"${acik ? ' checked' : ''} aria-label="${ceviri('{b} kuralını aç', { b: baslik })}">
      <span class="ad">${baslik}</span>
      <select class="grup-tur" data-eylem="grup-tur" data-yol="${yol}" aria-label="${ceviri('{b}: koşulların nasıl birleşeceği', { b: baslik })}">
        <option value="hepsi"${tur === 'hepsi' ? ' selected' : ''}>${ceviri('koşulların hepsi (VE)')}</option>
        <option value="herhangi"${tur === 'herhangi' ? ' selected' : ''}>${ceviri('herhangi biri (VEYA)')}</option>
      </select>
    </div>
    ${acik ? '' : `<p class="ipucu">${ipucu}</p>`}
    <div class="kosullar">${satirlar}</div>
    <button type="button" class="kucuk ekle" data-eylem="kosul-ekle" data-yol="${yol}">${ceviri('+ Koşul ekle')}</button>
  </div>`;
}

function mesafeHtml(yol, baslik, { zorunlu = false, rIzinli = false } = {}) {
  const m = al(yol);
  const tipler = [
    ...(zorunlu ? [] : [['', 'Yok']]),
    ['atr', 'ATR katı'], ['oynaklik', 'Oynaklık katı (v2)'], ['puan', 'Puan'], ['yuzde', 'Fiyatın yüzdesi'],
    ...(rIzinli ? [['r', 'Stopun katı (R)']] : []),
  ];
  const sec = tipler.map(([v, e]) => `<option value="${v}"${(m?.tip ?? '') === v ? ' selected' : ''}>${ceviri(e)}</option>`).join('');
  let ic = '';
  if (m?.tip === 'atr' || m?.tip === 'oynaklik') {
    const uygun = m.tip === 'atr' ? t => t.tip === 'ATR' : t => OYNAKLIK.includes(t.tip);
    const atrlar = Object.entries(s.gostergeler ?? {}).filter(([, t]) => uygun(t));
    const op = atrlar.map(([ad]) => `<option${ad === m.gosterge ? ' selected' : ''}>${kacis(ad)}</option>`).join('');
    ic = alan(m.tip === 'atr' ? 'ATR göstergesi' : 'Oynaklık göstergesi', `<select data-yol="${yol}.gosterge" data-eylem="secim">${atrlar.some(([a]) => a === m.gosterge) ? '' : `<option value="" selected>${ceviri('Seçin')}</option>`}${op}</select>`) +
         sayiAlani(`${yol}.carpan`, 'Çarpan', { min: 0.1, adim: 0.1 });
  } else if (m) {
    const etiket = { puan: 'Puan', yuzde: 'Yüzde', r: 'Kat (R)' }[m.tip] ?? 'Değer';
    ic = sayiAlani(`${yol}.deger`, etiket, { min: 0, adim: 'any' });
  }
  return `<div class="mesafe" data-hata-yol="${yol}">
    <span class="etiket">${ceviri(baslik)}</span>
    ${alan('Tip', `<select data-eylem="mesafe-tip" data-yol="${yol}">${sec}</select>`)}
    ${ic}
  </div>`;
}

function formCiz() {
  const zd = ZAMAN_DILIMLERI.map(z => `<option${z === s.zaman_dilimi ? ' selected' : ''}>${z}</option>`).join('');
  const yon = [['iki_yon', 'İki yön'], ['sadece_long', 'Sadece long'], ['sadece_short', 'Sadece short']]
    .map(([v, e]) => `<option value="${v}"${(s.yon ?? 'iki_yon') === v ? ' selected' : ''}>${ceviri(e)}</option>`).join('');
  const f = s.filtre ?? {};
  const r = s.risk ?? {};

  $('#form').innerHTML = `
  <section class="kart">
    <h2><span class="bolum-no">01</span>${ceviri('Genel')}</h2>
    <div class="alanlar">
      ${alan('Strateji adı', `<input data-yol="ad" maxlength="60" value="${kacis(s.ad)}">`, 'genis')}
      ${alan('Açıklama (isteğe bağlı)', `<textarea data-yol="aciklama" maxlength="500">${kacis(s.aciklama)}</textarea>`, 'genis')}
      ${alan('Zaman dilimi', `<select data-yol="zaman_dilimi" data-eylem="secim">${zd}</select>`)}
      ${alan('Yön', `<select data-yol="yon" data-eylem="secim">${yon}</select>`)}
    </div>
    <p class="ipucu">${ceviri('Yön kısıtı, makro görüşüne göre stratejiyi tek yöne bağlamak içindir.')}</p>
  </section>

  <section class="kart">
    <h2><span class="bolum-no">02</span>${ceviri('Göstergeler')}</h2>
    ${Object.entries(s.gostergeler ?? {}).map(([ad, t]) => gostergeHtml(ad, t)).join('')}
    <button type="button" class="kucuk ekle" data-eylem="gosterge-ekle">${ceviri('+ Gösterge ekle')}</button>
    <p class="ipucu">${ceviri('Ad, kurallarda göstergeyi seçerken görünür. Küçük harf, rakam ve _ kullanın.')}</p>
  </section>

  <section class="kart">
    <h2><span class="bolum-no">03</span>${ceviri('Giriş kuralları')}</h2>
    ${grupHtml('giris.long', 'Long giriş', 'Long giriş kuralı yok. Açmak için kutuyu işaretleyin.')}
    ${grupHtml('giris.short', 'Short giriş', 'Short giriş kuralı yok. Açmak için kutuyu işaretleyin.')}
    <p class="ipucu">${ceviri('Kurallar her yeni mumun açılışında, kapanmış son mumla değerlendirilir. Kesişme için son iki mum karşılaştırılır.')}</p>
  </section>

  <section class="kart">
    <h2><span class="bolum-no">04</span>${ceviri('Çıkış')}</h2>
    ${mesafeHtml('cikis.stop', 'Stop (zorunlu)', { zorunlu: true })}
    ${mesafeHtml('cikis.hedef', 'Hedef', { rIzinli: true })}
    ${mesafeHtml('cikis.iz_suren_stop', 'İz süren stop')}
    <div class="alanlar" style="margin:4px 0 12px">${sayiAlani('cikis.max_bar', 'En çok kaç mum açık kalsın', { min: 1, max: 10000, adim: 1, yer: 'sınırsız' })}</div>
    ${grupHtml('cikis.kosul.long', 'Long çıkış kuralı', 'İsteğe bağlı: stop ve hedef dışında kuralla çıkış.')}
    ${grupHtml('cikis.kosul.short', 'Short çıkış kuralı', 'İsteğe bağlı: stop ve hedef dışında kuralla çıkış.')}
  </section>

  <section class="kart">
    <h2><span class="bolum-no">05</span>${ceviri('Risk')}</h2>
    <div class="alanlar">
      ${sayiAlani('risk.islem_basi_yuzde', 'İşlem başı risk (bakiyenin %)', { min: 0.01, max: 5, adim: 0.1 })}
      ${sayiAlani('risk.max_acik_pozisyon', 'Azami açık pozisyon', { min: 1, max: 10, adim: 1, yer: '1' })}
      ${sayiAlani('risk.gunluk_max_kayip_yuzde', 'Günlük kayıp sınırı (%)', { min: 0.1, max: 20, adim: 0.1, yer: 'yok' })}
      ${sayiAlani('risk.max_spread_puan', 'Azami spread (puan)', { min: 0, adim: 1, yer: 'yok' })}
    </div>
    <p class="ipucu">${ceviri('Lot, stop olursa bu yüzdeyi kaybedecek şekilde hesaplanır. Aracı kurumun asgari lotu bu riski aşıyorsa Motor işlemi atlar.')}</p>
    <div class="grup${r.volatilite_hedefi ? '' : ' kapali'}" data-hata-yol="risk.volatilite_hedefi" style="margin-top:12px">
      <div class="grup-bas"><input type="checkbox" data-eylem="vh-ac"${r.volatilite_hedefi ? ' checked' : ''} aria-label="${ceviri('Oynaklığa göre ölçekle')}"><span class="ad">${ceviri('Oynaklığa göre ölçekle (v2)')}</span></div>
      ${r.volatilite_hedefi ? `<div class="alanlar" style="margin-top:10px">
        ${alan('Oynaklık göstergesi', `<select data-yol="risk.volatilite_hedefi.gosterge" data-eylem="secim">${Object.entries(s.gostergeler ?? {}).filter(([, t]) => OYNAKLIK.includes(t.tip))
          .map(([ad]) => `<option${ad === r.volatilite_hedefi.gosterge ? ' selected' : ''}>${kacis(ad)}</option>`).join('')}</select>`)}
        ${sayiAlani('risk.volatilite_hedefi.alt_carpan', 'En az (×)', { min: 0.1, max: 1, adim: 0.05, yer: '0,25' })}
        ${sayiAlani('risk.volatilite_hedefi.ust_carpan', 'En çok (×)', { min: 1, max: 2, adim: 0.05, yer: '1,5' })}
      </div>` : ''}
      <p class="ipucu">${ceviri('İşlem başı risk, oynaklığın olağana oranıyla ters orantılı ölçeklenir: oynaklık iki katına çıkınca risk yarıya iner. Dayanak: Moreira ve Muir 2017.')}</p>
    </div>
  </section>

  <section class="kart">
    <h2><span class="bolum-no">06</span>${ceviri('Filtreler')}</h2>
    <div class="grup${f.saat ? '' : ' kapali'}">
      <div class="grup-bas"><input type="checkbox" data-eylem="filtre-ac" data-ad="saat"${f.saat ? ' checked' : ''} aria-label="${ceviri('Saat penceresi')}"><span class="ad">${ceviri('Saat penceresi')}</span></div>
      ${f.saat ? `<div class="alanlar" style="margin-top:10px">
        ${sayiAlani('filtre.saat.bas', 'Başlangıç saati', { min: 0, max: 23, adim: 1 })}
        ${sayiAlani('filtre.saat.bit', 'Bitiş saati', { min: 0, max: 24, adim: 1 })}
      </div><p class="ipucu">${ceviri('Aracı kurumun sunucu saatine göre. Bitiş başlangıçtan küçükse gece yarısını aşar.')}</p>` : ''}
    </div>
    <div class="grup${f.haber ? '' : ' kapali'}">
      <div class="grup-bas"><input type="checkbox" data-eylem="filtre-ac" data-ad="haber"${f.haber ? ' checked' : ''} aria-label="${ceviri('Haber filtresi')}"><span class="ad">${ceviri('Haber filtresi')}</span></div>
      ${f.haber ? `<div class="alanlar" style="margin-top:10px">
        ${sayiAlani('filtre.haber.once_dk', 'Önce (dk)', { min: 0, max: 1440, adim: 1, yer: '30' })}
        ${sayiAlani('filtre.haber.sonra_dk', 'Sonra (dk)', { min: 0, max: 1440, adim: 1, yer: '30' })}
        ${alan('Önem', `<select data-yol="filtre.haber.onem" data-eylem="secim">
          <option value="yuksek"${f.haber.onem !== 'orta' ? ' selected' : ''}>${ceviri('Yalnız yüksek')}</option>
          <option value="orta"${f.haber.onem === 'orta' ? ' selected' : ''}>${ceviri('Orta ve yüksek')}</option></select>`)}
      </div><p class="ipucu">${ceviri('MT5\'in kendi ekonomik takviminden, sembolün para birimleri için okunur. Strategy Tester\'da uygulanmaz.')}</p>` : ''}
    </div>
  </section>`;
  hatalariIsaretle();
}

// ---------------------------------------------------------------- panel
function hatalariIsaretle() {
  document.querySelectorAll('.hatali').forEach(e => { e.classList.remove('hatali'); e.removeAttribute('title'); });
  for (const h of hatalar) {
    const el = document.querySelector(`[data-yol="${CSS.escape(h.yol)}"]`) ??
      document.querySelector(`[data-hata-yol="${CSS.escape(h.yol)}"]`);
    if (el) { el.classList.add('hatali'); el.title = h.mesaj; }
  }
}

function panelCiz() {
  // Şema sürümü kendiliğinden: v2 özelliği kullanılıyorsa 2, yoksa 1 (eski Motor sürümleriyle uyum)
  if (s.kalibre === 1 || s.kalibre === 2) s.kalibre = v2Ozellikleri(s).length ? 2 : 1;
  hatalar = dogrula(s);
  hatalariIsaretle();
  $('#durum').innerHTML = hatalar.length
    ? `<span class="durum-hata">${ceviri('{n} sorun var, Motor bu dosyayı yürütmez', { n: hatalar.length })}</span>
       <ul class="hata-liste">${hatalar.map(h => `<li data-git="${kacis(h.yol)}">${kacis(h.mesaj)} <code>${kacis(h.yol)}</code></li>`).join('')}</ul>`
    : `<span class="durum-ok">${ceviri('✓ Geçerli. Kalibre Motor bu dosyayı yürütebilir.')}</span>`;
  $('#ozet').innerHTML = ozet(s).map(o => `<dt>${kacis(o.baslik)}</dt><dd>${kacis(o.metin)}</dd>`).join('');
  $('#json').textContent = JSON.stringify(s, null, 2);
  taslakYaz();
  clearTimeout(provaZamanlayici);
  provaZamanlayici = setTimeout(provaCalistir, 200);
}

// ---------------------------------------------------------------- prova
// Sentetik piyasa ya da kullanıcının kendi dosyası (MT5 köprüsü JSON'u veya CSV).
const DIPNOT = {
  sentetik: 'Gerçek bir piyasa değildir. Sentetik prova kuralların nasıl davrandığını görmek içindir; ' +
    'gerçek backtest, kendi aracı kurum verinle MT5 Strategy Tester\'da Kalibre Motor ile yapılır.',
  dosya: 'Kendi verinle hızlı ön izleme. Makas, komisyon ve kayma hesaba katılmaz, bu yüzden gerçek sonuç ' +
    'daha düşük olur. Kesin sonuç için aynı stratejiyi MT5 Strategy Tester\'da Kalibre Motor ile çalıştır.',
  mt5: 'Kendi MT5 verinle hızlı ön izleme; yeni mum kapandıkça kendiliğinden yenilenir. Makas, komisyon ve kayma ' +
    'hesaba katılmaz, bu yüzden gerçek sonuç daha düşük olur. Kesin sonuç için MT5 Strategy Tester\'da Kalibre Motor ile çalıştır.',
};
// Her kaynakta aynı uyarı: sonuç bir simülasyondur, öneri değildir.
for (const k of Object.keys(DIPNOT)) DIPNOT[k] = ceviri(DIPNOT[k]) + ' ' + ceviri('Bu bir geçmiş ya da sentetik veri simülasyonudur; gerçek performans ya da yatırım önerisi değildir.');

function provaBos(mesaj) {
  $('#istatistik').innerHTML = `<div style="grid-column:1/-1"><span>${mesaj}</span></div>`;
  $('#saglamlik').innerHTML = '';
  $('#uyarilar').innerHTML = '';
  for (const c of ['#grafik', '#egri']) temizle($(c));
}

function provaCalistir() {
  const kaynak = $('#prova-kaynak').value;
  const veri = kaynak === 'mt5' ? mt5Veri : kaynak === 'dosya' ? provaVeri : null;
  if (hatalar.length && hatalar.every(h => h.yol.startsWith('risk'))) return provaBos(ceviri('Provayı görmek için Risk bölümünde işlem başına riski kendin belirle.'));
  if (hatalar.length) return provaBos(ceviri('Prova için önce sorunları giderin.'));
  if (kaynak === 'dosya' && !veri) {
    $('#rozet').textContent = ceviri('DOSYA BEKLENİYOR');
    return provaBos(ceviri('Bir veri dosyası seç ya da bu karta sürükleyip bırak.'));
  }
  if (kaynak === 'mt5' && !veri) {
    $('#rozet').textContent = ceviri('MT5 BEKLENİYOR');
    return provaBos(ceviri('MetaTrader bağlandığında seri burada çalışır. Yukarıdaki adımları izle.'));
  }

  let mumlar, ayar = null;
  const veriUyarilari = [];
  if (veri) {
    mumlar = veri.mumlar;
    $('#rozet').textContent = veri.ad;
    veriUyarilari.push(...veri.uyarilar);
    const strTd = s.zaman_dilimi ?? 'H1';
    if (veri.zamanDilimi && veri.zamanDilimi !== strTd) {
      veriUyarilari.push(ceviri("Strateji {s} için yazılmış, veri {v}. Motor MT5'te {s} mumlarıyla çalışır; bu prova farklı sonuç verebilir.", { s: strTd, v: veri.zamanDilimi }));
    }
  } else {
    const tohum = Number($('#tohum').value) || 1;
    $('#rozet').textContent = ceviri('SENTETİK · tohum {n}', { n: tohum });
    ayar = { rejim: $('#rejim').value, adet: Number($('#adet').value), zamanDilimi: s.zaman_dilimi ?? 'H1' };
    mumlar = uret({ ...ayar, tohum });
  }

  const sonuc = prova(s, mumlar);
  fiyatCiz($('#grafik'), mumlar, sonuc.islemler);
  egriCiz($('#egri'), sonuc.ozkaynak);
  istatistikCiz(sonuc.istatistik);
  $('#uyarilar').innerHTML = [...veriUyarilari, ...sonuc.uyarilar].map(u => `<li>${kacis(ceviri(u))}</li>`).join('');
  // Sağlamlık testi sentetik piyasalarla çalışır; kendi verinle yapılan provada karışıklık yaratmasın.
  if (ayar) saglamlikCiz(ayar); else $('#saglamlik').innerHTML = '';
}

function provaKaynakGoster() {
  const kaynak = $('#prova-kaynak').value;
  $('#prova-dosya-alan').hidden = kaynak !== 'dosya';
  $('#prova-ipucu').hidden = kaynak !== 'dosya';
  $('#mt5-alan').hidden = kaynak !== 'mt5';
  for (const id of ['#rejim-alan', '#tohum-alan', '#adet-alan']) $(id).hidden = kaynak !== 'sentetik';
  $('#prova-dipnot').textContent = DIPNOT[kaynak];
  // Röle yalnız kullanıcı MetaTrader kaynağını seçtiğinde yoklanır.
  if (kaynak === 'mt5') (mt5 ??= mt5Panel({ yukle: mt5Yukle, hata: mt5Hata, istenenSembol: ISTENEN_SEMBOL })).baslat();
  else mt5?.durdur();
}

function mt5Yukle(veri) {
  mt5Veri = veri;
  if ($('#prova-kaynak').value === 'mt5') provaCalistir();
}

function mt5Hata(mesaj) {
  // Daha önce yüklenmiş bir seri varsa prova yerinde kalır; geçici hata bağlantı satırında görünür.
  if ($('#prova-kaynak').value !== 'mt5' || mt5Veri) return;
  $('#rozet').textContent = ceviri('MT5 VERİSİ YOK');
  provaBos(`<span style="color:var(--red)">${kacis(mesaj)}</span>`);
}

async function provaDosyaYukle(f) {
  if (!f) return;
  try {
    provaVeri = dosyaCoz(await f.text(), f.name);
    $('#prova-kaynak').value = 'dosya';
    provaKaynakGoster();
    provaCalistir();
  } catch (err) {
    provaVeri = null;
    $('#prova-kaynak').value = 'dosya';
    provaKaynakGoster();
    $('#rozet').textContent = ceviri('DOSYA OKUNAMADI');
    provaBos(`<span style="color:var(--red)">${kacis(ceviri('Dosya okunamadı: {m}', { m: ceviri(err.message) }))}</span>`);
  }
}

// Aynı kurallar çok sayıda sentetik piyasada: sonuç şanstan mı, kuraldan mı?
// Parça parça çalışır, arayüzü kilitlemez; yeni bir değişiklik eski hesabı iptal eder.
// GARCH_VOL her piyasada yeniden kestirildiği için o durumda 10 piyasa kullanılır.
let saglamlikNo = 0;
function saglamlikCiz(ayar) {
  const no = ++saglamlikNo;
  const N = Object.values(s.gostergeler ?? {}).some(t => t.tip === 'GARCH_VOL') ? 10 : 50;
  const getiriler = [], beklentiler = [];
  const adim = i => {
    if (no !== saglamlikNo) return;
    if (i <= N) {
      $('#saglamlik').innerHTML = ceviri('<b>Sağlamlık:</b> {N} sentetik piyasa çalıştırılıyor… {i}/{N}', { N, i: i - 1 });
      const st = prova(s, uret({ ...ayar, tohum: 100000 + i * 7919 })).istatistik;
      getiriler.push(st.getiriYuzde);
      if (st.islem) beklentiler.push(st.beklentiR);
      setTimeout(() => adim(i + 1), 0);
      return;
    }
    bitir();
  };
  const bitir = () => saglamlikYaz(N, getiriler, beklentiler);
  adim(1);
}

function saglamlikYaz(N, getiriler, beklentiler) {
  getiriler.sort((a, b) => a - b);
  const karli = getiriler.filter(g => g > 0).length;
  const yuzde = v => isaretliYuzde(v);
  const ortB = beklentiler.length ? beklentiler.reduce((a, b) => a + b, 0) / beklentiler.length : 0;
  $('#saglamlik').innerHTML = ceviri('<b>Sağlamlık:</b> aynı kurallar {N} farklı sentetik piyasada çalıştırıldı. Kârlı biten: <b>{k}/{N}</b>. Getiri dağılımı: en kötü <b>{kotu}</b>, ortanca <b>{orta}</b>, en iyi <b>{iyi}</b>. Ortalama beklenti <b>{b}R</b>.',
    { N, k: karli, kotu: yuzde(getiriler[0]), orta: yuzde(getiriler[Math.floor(N / 2)]), iyi: yuzde(getiriler[N - 1]), b: sayi(ortB, 2) });
}

function istatistikCiz(st) {
  const isaret = v => (v > 0 ? 'pozitif' : v < 0 ? 'negatif' : '');
  const kutu = (deger, etiket, sinif = '') => `<div><b class="${sinif}">${deger}</b><span>${ceviri(etiket)}</span></div>`;
  $('#istatistik').innerHTML =
    kutu(st.islem, 'işlem') +
    kutu(yuzdeMetni((st.kazanmaOrani * 100).toFixed(0)), 'kazanma oranı') +
    kutu(`${sayi(st.beklentiR, 2)}R`, 'işlem başı beklenti', isaret(st.beklentiR)) +
    kutu(isaretliYuzde(st.getiriYuzde), 'toplam getiri', isaret(st.getiriYuzde)) +
    kutu(`−${yuzdeMetni(sayi(st.maxDususYuzde))}`, 'en büyük düşüş', st.maxDususYuzde > 0 ? 'negatif' : '') +
    kutu(Number.isFinite(st.karFaktoru) ? sayi(st.karFaktoru, 2) : '∞', 'kâr faktörü') +
    kutu(`${sayi(st.ortKazancR, 2)}R`, 'ort. kazanç') +
    kutu(`${sayi(st.ortKayipR, 2)}R`, 'ort. kayıp') +
    kutu(st.enUzunKayipSerisi, 'en uzun kayıp serisi');
}

function tuval(c) {
  const dpr = window.devicePixelRatio || 1;
  // Çizim yüksekliği ilk height özniteliğinden bir kez okunur: c.height ataması özniteliği de değiştirir,
  // her çizimde yeniden okunsaydı yüksek DPI ekranlarda tuval her seferinde dpr katı uzardı.
  c.dataset.h ??= c.getAttribute('height');
  const w = c.clientWidth, h = Number(c.dataset.h);
  c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  return { x, w, h };
}
function temizle(c) { tuval(c); }

function fiyatCiz(c, mumlar, islemler) {
  const { x, w, h } = tuval(c);
  const pad = 8;
  let lo = Infinity, hi = -Infinity;
  for (const m of mumlar) { lo = Math.min(lo, m.d); hi = Math.max(hi, m.y); }
  const X = i => pad + (i / (mumlar.length - 1)) * (w - 2 * pad);
  const Y = v => h - pad - ((v - lo) / (hi - lo)) * (h - 2 * pad);
  x.strokeStyle = '#24344c'; x.lineWidth = 1;
  for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(0, h * i / 4); x.lineTo(w, h * i / 4); x.stroke(); }
  x.strokeStyle = '#a3b0c2'; x.lineWidth = 1.2; x.beginPath();
  mumlar.forEach((m, i) => (i ? x.lineTo(X(i), Y(m.k)) : x.moveTo(X(i), Y(m.k))));
  x.stroke();
  for (const t of islemler) {
    x.strokeStyle = t.kar > 0 ? 'rgba(74,222,128,.75)' : 'rgba(239,68,68,.75)';
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(X(t.girisI), Y(t.giris)); x.lineTo(X(t.cikisI), Y(t.cikis)); x.stroke();
    x.fillStyle = t.yon === 'long' ? '#8fc7ff' : '#d9a441';
    x.beginPath(); x.arc(X(t.girisI), Y(t.giris), 2.5, 0, Math.PI * 2); x.fill();
  }
}

function egriCiz(c, ozk) {
  const { x, w, h } = tuval(c);
  const pad = 6, lo = Math.min(...ozk), hi = Math.max(...ozk), bas = ozk[0];
  const X = i => pad + (i / (ozk.length - 1)) * (w - 2 * pad);
  const Y = v => h - pad - ((v - lo) / (hi - lo || 1)) * (h - 2 * pad);
  x.strokeStyle = '#33465f'; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(0, Y(bas)); x.lineTo(w, Y(bas)); x.stroke(); x.setLineDash([]);
  x.strokeStyle = ozk.at(-1) >= bas ? '#5fb89a' : '#e07a6e'; x.lineWidth = 1.5; x.beginPath();
  ozk.forEach((v, i) => (i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v))));
  x.stroke();
  x.fillStyle = '#8d9cb0'; x.font = '11px ui-monospace, monospace'; x.fillText(ceviri('özkaynak'), 8, 14);
}

// ---------------------------------------------------------------- olaylar
function benzersizAd(taban) {
  let ad = taban, i = 2;
  while (s.gostergeler[ad]) ad = `${taban}${i++}`;
  return ad;
}
const VARSAYILAN = {
  SMA: { periyot: 50 }, EMA: { periyot: 20 }, RSI: { periyot: 14 }, ATR: { periyot: 14 }, ADX: { periyot: 14 },
  BB: { periyot: 20, sapma: 2 }, MACD: { hizli: 12, yavas: 26, sinyal: 9 },
  EWMA_VOL: { lambda: 0.94 }, YZ_VOL: { periyot: 30 }, GARCH_VOL: { model: 'garch', dagilim: 'normal', pencere: 1000, yenile: 24 },
};

function referanslariDegistir(eski, yeni) {
  const ref = o => {
    if (typeof o !== 'string') return o;
    const [ad, hat] = o.split('.');
    return ad === eski ? (hat ? `${yeni}.${hat}` : yeni) : o;
  };
  const gez = gr => {
    for (const k of gr?.hepsi ?? gr?.herhangi ?? []) { k.sol = ref(k.sol); k.sag = ref(k.sag); }
  };
  gez(s.giris?.long); gez(s.giris?.short); gez(s.cikis?.kosul?.long); gez(s.cikis?.kosul?.short);
  for (const m of [s.cikis?.stop, s.cikis?.hedef, s.cikis?.iz_suren_stop]) if (m?.gosterge === eski) m.gosterge = yeni;
}

function ilkOynaklik() {
  const var_ = Object.entries(s.gostergeler).find(([, t]) => OYNAKLIK.includes(t.tip));
  if (var_) return var_[0];
  const ad = benzersizAd('ewma');
  s.gostergeler[ad] = { tip: 'EWMA_VOL', lambda: 0.94 };
  return ad;
}

function ilkAtr() {
  const var_ = Object.entries(s.gostergeler).find(([, t]) => t.tip === 'ATR');
  if (var_) return var_[0];
  const ad = benzersizAd('atr');
  s.gostergeler[ad] = { tip: 'ATR', periyot: 14 };
  return ad;
}

function varsayilanKosul() {
  const sec = operandSecenekleri();
  return { sol: sec[0]?.deger ?? 'fiyat.kapanis', op: '>', sag: sec[1]?.deger ?? 'fiyat.acilis' };
}

function eylem(e) {
  const el = e.target.closest('[data-eylem]');
  if (!el) return false;
  const yol = el.dataset.yol, ad = el.dataset.ad;
  switch (el.dataset.eylem) {
    case 'gosterge-ekle': {
      const yeni = benzersizAd('ema');
      s.gostergeler[yeni] = { tip: 'EMA', ...VARSAYILAN.EMA };
      break;
    }
    case 'gosterge-sil':
      delete s.gostergeler[ad];
      break;
    case 'gosterge-tip':
      s.gostergeler[ad] = { tip: el.value, ...VARSAYILAN[el.value] };
      break;
    case 'gosterge-ad': {
      const yeni = el.value.trim();
      if (!yeni || yeni === ad) { el.value = ad; return true; }
      if (s.gostergeler[yeni]) { el.value = ad; el.classList.add('hatali'); el.title = ceviri('Bu ad zaten kullanılıyor'); return true; }
      s.gostergeler = Object.fromEntries(Object.entries(s.gostergeler).map(([k, v]) => [k === ad ? yeni : k, v]));
      referanslariDegistir(ad, yeni);
      break;
    }
    case 'grup-ac':
      if (el.checked) koy(yol, { hepsi: [varsayilanKosul()] });
      else {
        koy(yol, undefined);
        if (s.cikis?.kosul && !s.cikis.kosul.long && !s.cikis.kosul.short) delete s.cikis.kosul;
      }
      break;
    case 'grup-tur': {
      const gr = al(yol);
      const liste = gr.hepsi ?? gr.herhangi;
      koy(yol, { [el.value]: liste });
      break;
    }
    case 'kosul-ekle': {
      const gr = al(yol);
      (gr.hepsi ?? gr.herhangi).push(varsayilanKosul());
      break;
    }
    case 'kosul-sil': {
      koy(yol, undefined);
      const grupYolu = yol.split('.').slice(0, -2).join('.');
      const gr = al(grupYolu);
      if (gr && !(gr.hepsi ?? gr.herhangi).length) {
        koy(grupYolu, undefined);
        if (s.cikis?.kosul && !s.cikis.kosul.long && !s.cikis.kosul.short) delete s.cikis.kosul;
      }
      break;
    }
    case 'operand':
      if (el.value === '#sayi') koy(yol, typeof al(yol) === 'number' ? al(yol) : 0);
      else koy(yol, el.value);
      break;
    case 'mesafe-tip':
      if (!el.value) koy(yol, undefined);
      else if (el.value === 'atr') koy(yol, { tip: 'atr', gosterge: ilkAtr(), carpan: 2 });
      else if (el.value === 'oynaklik') koy(yol, { tip: 'oynaklik', gosterge: ilkOynaklik(), carpan: 3 });
      else koy(yol, { tip: el.value, deger: { puan: 300, yuzde: 1, r: 2 }[el.value] });
      break;
    case 'vh-ac':
      s.risk ??= { islem_basi_yuzde: 1 };
      if (el.checked) s.risk.volatilite_hedefi = { gosterge: ilkOynaklik(), alt_carpan: 0.25, ust_carpan: 1.5 };
      else delete s.risk.volatilite_hedefi;
      break;
    case 'filtre-ac':
      s.filtre ??= {};
      if (el.checked) s.filtre[ad] = ad === 'saat' ? { bas: 8, bit: 20 } : { once_dk: 30, sonra_dk: 30, onem: 'yuksek' };
      else delete s.filtre[ad];
      if (!Object.keys(s.filtre).length) delete s.filtre;
      break;
    case 'secim':
      if (yol === 'yon' && el.value === 'iki_yon') koy(yol, undefined);
      else koy(yol, el.value);
      break;
    default:
      return false;
  }
  formCiz();
  panelCiz();
  return true;
}

$('#form').addEventListener('click', e => {
  if (e.target.matches('button[data-eylem]')) eylem(e);
});
$('#form').addEventListener('change', e => {
  if (e.target.matches('input[type=checkbox][data-eylem], select[data-eylem], input[data-eylem="gosterge-ad"]')) eylem(e);
});
$('#form').addEventListener('input', e => {
  const el = e.target;
  if (!el.dataset.yol || el.dataset.eylem) return;
  if (el.dataset.tur === 'sayi') {
    if (el.value === '') koy(el.dataset.yol, undefined);
    else if (Number.isFinite(el.valueAsNumber)) koy(el.dataset.yol, el.valueAsNumber);
    else return;
  } else if (el.dataset.yol === 'aciklama' && el.value === '') koy('aciklama', undefined);
  else koy(el.dataset.yol, el.value);
  if (el.dataset.yol.startsWith('risk.') && s.risk) {
    for (const k of Object.keys(s.risk)) if (s.risk[k] === undefined) delete s.risk[k];
  }
  panelCiz();
});

$('#durum').addEventListener('click', e => {
  const li = e.target.closest('[data-git]');
  if (!li) return;
  const yol = li.dataset.git;
  const el = document.querySelector(`[data-yol="${CSS.escape(yol)}"]`) ?? document.querySelector(`[data-hata-yol="${CSS.escape(yol)}"]`);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus?.(); }
});

// Eğitim örnekleri bir öneri değil, başlangıç noktasıdır. Örnek yüklenince kullanıcı onu kendi kopyası
// olarak düzenler ve risk bölümünü kendisi doldurur; doldurmadan Motor dosyası indirilmez. Örnek
// dosyalar sonradan değişse de kullanıcının indirdiği kural dosyası değişmez (bağlantı tutulmaz).
const RISK_KULLANICININ = ['islem_basi_yuzde', 'gunluk_max_kayip_yuzde', 'max_acik_pozisyon'];
let ornektenAd = null;

function ornekUyarisi() {
  const el = $('#ornek-uyari');
  el.hidden = !ornektenAd;
  if (ornektenAd) el.textContent = ceviri('"{ad}" bir eğitim örneğidir, yatırım önerisi değildir. Bu senin kopyan: kuralları kendi amacına göre değiştir ve risk bölümünü kendin doldur. Risk bölümü dolmadan Motor dosyası indirilmez.', { ad: ornektenAd });
}

$('#sablon').addEventListener('change', async e => {
  const v = e.target.value;
  e.target.value = '';
  if (!v) return;
  if (!confirm(ceviri('Mevcut taslak değiştirilecek. Devam edilsin mi?'))) return;
  if (v === 'bos') { s = BOS(); ornektenAd = null; }
  else {
    try {
      const yanit = await fetch(`../ornekler/${v}.json`);
      s = await yanit.json();
    } catch { alert(ceviri('Örnek yüklenemedi.')); return; }
    // Örnek dosyanın kendisi Türkçe adla durur; İngilizcede katalogdaki ad_en gösterilir.
    ornektenAd = (dil === 'en' && ornekAdlari[v]?.ad) || s.ad;
    if (dil === 'en' && ornekAdlari[v]?.kisa) s.aciklama = ornekAdlari[v].kisa;
    s.ad = ceviri('{ad} (benim kopyam)', { ad: ornektenAd }).slice(0, 60);
    s.risk ??= {};
    for (const k of RISK_KULLANICININ) delete s.risk[k];
  }
  ornekUyarisi(); formCiz(); panelCiz();
});

$('#ice-aktar').addEventListener('change', async e => {
  const dosya = e.target.files[0];
  e.target.value = '';
  if (!dosya) return;
  try {
    const v = JSON.parse(await dosya.text());
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error();
    s = v;
    s.gostergeler ??= {};
    ornektenAd = null; ornekUyarisi();
    formCiz(); panelCiz();
  } catch { alert(ceviri('Dosya geçerli bir JSON değil.')); }
});

$('#indir').addEventListener('click', () => {
  if (hatalar.some(h => h.yol.startsWith('risk'))) {
    alert(ceviri('Risk bölümünü kendin doldurmalısın: işlem başına bakiyenin yüzde kaçını riske attığını belirlemeden Motor dosyası indirilmez.'));
    document.querySelector('[data-yol="risk.islem_basi_yuzde"]')?.focus();
    return;
  }
  if (hatalar.length && !confirm(ceviri('{n} sorun var; Motor bu dosyayı reddeder. Yine de indirilsin mi?', { n: hatalar.length }))) return;
  const dosyaAdi = (s.ad || 'strateji').toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]))
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'strateji';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2) + '\n'], { type: 'application/json' }));
  a.download = `${dosyaAdi}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#kopyala').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(JSON.stringify(s, null, 2)); $('#kopyala').textContent = ceviri('Kopyalandı'); }
  catch { $('#kopyala').textContent = ceviri('Kopyalanamadı'); }
  setTimeout(() => { $('#kopyala').textContent = ceviri('Kopyala'); }, 1500);
});

// Şablon listesi kütüphane kataloğundan; yalnız Motor'un bugün yürüttüğü (v1) şablonlar.
const ornekAdlari = {};
fetch('../paketler/sablonlar.json').then(y => y.json()).then(k => {
  const sec = $('#sablon');
  for (const s of k.sablonlar.filter(s => s.durum === 'v1')) {
    const ad = dil === 'en' && s.ad_en ? s.ad_en : s.ad;
    if (s.ad_en) ornekAdlari[s.id] = { ad: s.ad_en, kisa: s.kisa_en };
    sec.add(new Option(ad, s.id));
  }
}).catch(() => { /* katalog yoksa yalnız boş şablon */ });

$('#rejim').innerHTML = Object.entries(REJIMLER).map(([k, r]) => `<option value="${k}">${ceviri(r.ad)}</option>`).join('');
$('#tohum').value = 4821;
$('#zar').addEventListener('click', () => { $('#tohum').value = 1 + Math.floor(Math.random() * 999999); provaCalistir(); });
for (const id of ['#rejim', '#adet', '#tohum']) $(id).addEventListener('change', provaCalistir);
$('#prova-kaynak').addEventListener('change', () => { provaKaynakGoster(); provaCalistir(); });
$('#prova-dosya').addEventListener('change', e => provaDosyaYukle(e.target.files[0]));
// Dosya prova kartına sürüklenip bırakılabilir.
$('#prova-kart').addEventListener('dragover', e => { e.preventDefault(); $('#prova-kart').classList.add('birak'); });
$('#prova-kart').addEventListener('dragleave', () => $('#prova-kart').classList.remove('birak'));
$('#prova-kart').addEventListener('drop', e => {
  e.preventDefault();
  $('#prova-kart').classList.remove('birak');
  // Bırakılan dosya seçim kutusunda da görünsün; yoksa kutu bir önceki dosyanın adını gösterir.
  try { $('#prova-dosya').files = e.dataTransfer.files; } catch { /* eski tarayıcı: yalnız ad gösterilmez */ }
  provaDosyaYukle(e.dataTransfer.files[0]);
});
sayfayiCevir();
dilAnahtari(document.querySelector('.ust-eylem'));
// Panom'dan "Backtest": ?sembol=EURUSD ile gelince MetaTrader kaynağı seçilir ve o seri yüklenir.
if (ISTENEN_SEMBOL) {
  $('#prova-kaynak').value = 'mt5';
  provaKaynakGoster();
  provaCalistir();
  $('#prova-kart').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
provaKaynakGoster();
window.addEventListener('resize', () => { clearTimeout(provaZamanlayici); provaZamanlayici = setTimeout(provaCalistir, 150); });

s.gostergeler ??= {};
formCiz();
panelCiz();
