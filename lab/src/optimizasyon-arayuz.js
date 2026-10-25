// Optimizasyon paneli: kullanıcının kural dosyasındaki parametreleri bir ızgara üzerinde tarar.
// Hesap optimizasyon.js'tedir; bu dosya yalnız arayüzdür. Sonuçlar sıralanır ama bir ayar önerilmez:
// kullanıcı bir satırı kendisi seçip kurucuda açar ya da kural dosyası olarak indirir.

import { t as ceviri, dil, yerel, sayfayiCevir, dilAnahtari, sayiMetni, isaretliYuzde, yuzdeMetni } from './dil.js';
import { dogrula } from './dogrula.js';
import { ozet } from './ozet.js';
import { uret, REJIMLER } from './sentetik.js';
import { dosyaCoz } from './veri/dosya.js';
import { istemci, sinifla, roleAdresi } from './veri/baglanti.js';
import { tradierSecici, alpacaSecici } from './tradier-kaynak.js';
import { baglanDugmesi, depo, KOD_ANAHTARI, ROLE_ANAHTARI, KOD_RE } from './baglan-ortak.js';
import { parametreler, ayarla, tara } from './optimizasyon.js';
import { plan, isiHaritasi, hucreRengi, dosyaAdi, komsulukSinifi, dsrSinifi, PROP_ON_AYAR, EN_COK_PARAMETRE, VARSAYILAN_ORNEK } from './optimizasyon-yardim.js';

const TASLAK_ANAHTARI = 'kalibre-lab-taslak'; // strateji kurucunun taslağı (uygulama.js ile aynı)
const $ = s => document.querySelector(s);
const kacis = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sayiOku = v => Number(String(v).trim().replace(',', '.'));
const dilEki = dil === 'en' ? '?dil=en' : '';

let s = null;            // strateji
let params = [];         // parametreler(s) + seçim ve aralıklar
let veri = null;         // { mumlar, ad, uyarilar }
let mt5 = null;          // istemci
let mt5Seriler = [];
let tradier = null;       // tradierSecici
let tradierSon = null;    // son yüklenen Tradier serisi
let alpaca = null;        // alpacaSecici
let alpacaSon = null;     // son yüklenen Alpaca serisi
let calisiyor = false, iptalIstendi = false;
let sonuc = null, secilenSon = [];

// ---------------------------------------------------------------- etiketler
// Motorun etiketleri Türkçedir; arayüzde parametre yolundan dile göre yeniden kurulur.
const ALAN_ADI = () => ({ periyot: ceviri('periyot'), hizli: ceviri('hızlı'), yavas: ceviri('yavaş'), sinyal: ceviri('sinyal'), sapma: ceviri('sapma'), lambda: 'λ' });
function etiket(p) {
  const y = p.yol.split('.');
  if (y[0] === 'gostergeler') return `${y[1]} ${ALAN_ADI()[y[2]] ?? y[2]}`;
  if (p.yol.startsWith('cikis.stop.')) return ceviri('stop');
  if (p.yol.startsWith('cikis.hedef.')) return ceviri('hedef');
  if (p.yol.startsWith('cikis.iz_suren_stop.')) return ceviri('iz süren stop');
  const k = s ? y.slice(0, -1).reduce((o, a) => o?.[/^\d+$/.test(a) ? Number(a) : a], s) : null;
  if (k && typeof k.sol === 'string') return ceviri('{sol} {op} eşiği', { sol: k.sol, op: k.op });
  return p.yol;
}

// ---------------------------------------------------------------- strateji
function stratejiYukle(yeni, kaynakMetni) {
  s = yeni;
  $('#strateji-kaynak').textContent = kaynakMetni;
  const hatalar = s ? dogrula(s) : [];
  const hataKutu = $('#strateji-hata');
  if (!s) {
    $('#ozet').innerHTML = '';
    hataKutu.hidden = false;
    hataKutu.innerHTML = kacis(ceviri('Strateji kurucuda kayıtlı bir taslak yok. Önce kurucuda bir strateji kur ya da bir kural dosyasını içe aktar.')) +
      ` <a href="./${dilEki}">${kacis(ceviri('Strateji kurucuya git'))}</a>`;
    params = [];
  } else {
    $('#ozet').innerHTML = ozet(s).map(o => `<dt>${kacis(o.baslik)}</dt><dd>${kacis(o.metin)}</dd>`).join('');
    hataKutu.hidden = !hatalar.length;
    if (hatalar.length) {
      const riskMi = hatalar.every(h => h.yol.startsWith('risk'));
      hataKutu.innerHTML = kacis(riskMi
        ? ceviri('Kural dosyasında risk bölümü eksik. Tarama için kurucuda işlem başına riski kendin belirle.')
        : ceviri('Kural dosyasında {n} sorun var; tarama başlamaz.', { n: hatalar.length })) +
        ` <a href="./${dilEki}">${kacis(ceviri('Strateji kurucuda düzelt'))}</a>`;
    }
    params = parametreler(s).map(p => ({ ...p, etiket: etiket(p), secili: false }));
    // İlk iki gösterge periyodu varsayılan seçim: kullanıcı değiştirebilir.
    params.filter(p => /^gostergeler\..+\.(periyot|hizli|yavas)$/.test(p.yol)).slice(0, 2).forEach(p => { p.secili = true; });
  }
  paramCiz();
}

function taslakOku() {
  try { const v = localStorage.getItem(TASLAK_ANAHTARI); return v ? JSON.parse(v) : null; } catch { return null; }
}

// ---------------------------------------------------------------- parametre tablosu
function paramCiz() {
  const tablo = $('#param-tablo');
  if (!params.length) {
    tablo.innerHTML = `<tbody><tr><td>${kacis(ceviri('Bu kural dosyasında taranabilir bir sayısal parametre yok.'))}</td></tr></tbody>`;
    planCiz();
    return;
  }
  const secSayisi = params.filter(p => p.secili).length;
  tablo.innerHTML = `<thead><tr><th></th><th>${kacis(ceviri('Parametre'))}</th><th>${kacis(ceviri('Şu anki'))}</th><th>${kacis(ceviri('En küçük'))}</th><th>${kacis(ceviri('En büyük'))}</th><th>${kacis(ceviri('Adım'))}</th></tr></thead><tbody>` +
    params.map((p, i) => `<tr>
      <td><input type="checkbox" data-i="${i}" data-alan="secili" ${p.secili ? 'checked' : ''} ${!p.secili && secSayisi >= EN_COK_PARAMETRE ? 'disabled' : ''} aria-label="${kacis(p.etiket)}"></td>
      <td>${kacis(p.etiket)}<br><code>${kacis(p.yol)}</code></td>
      <td>${kacis(String(p.deger))}</td>
      <td><input type="text" inputmode="decimal" data-i="${i}" data-alan="min" value="${p.min}" ${p.secili ? '' : 'disabled'}></td>
      <td><input type="text" inputmode="decimal" data-i="${i}" data-alan="max" value="${p.max}" ${p.secili ? '' : 'disabled'}></td>
      <td><input type="text" inputmode="decimal" data-i="${i}" data-alan="adim" value="${p.adim}" ${p.secili ? '' : 'disabled'}></td>
    </tr>`).join('') + '</tbody>';
  planCiz();
}

function secilenler() { return params.filter(p => p.secili); }

function planCiz() {
  const sec = secilenler();
  const p = plan(sec, sayiOku($('#ornek-sinir').value) || VARSAYILAN_ORNEK);
  const sayi = n => n.toLocaleString(yerel);
  let metin = '', rozet = '';
  switch (p.durum) {
    case 'secim_yok': metin = ceviri('Taramak için en az bir parametre seç.'); break;
    case 'aralik_hatali': metin = ceviri('Aralıklardan biri hatalı: en büyük, en küçükten küçük olamaz ve adım sıfırdan büyük olmalı.'); break;
    case 'cok_buyuk': metin = ceviri('{n} kombinasyon, 2.000 sınırını aşıyor. Aralıkları daralt ya da adımı büyüt.', { n: sayi(p.toplam) }); break;
    case 'orneklenecek':
      metin = ceviri('{n} kombinasyon var; bunlardan {k} tanesi rastgele (tohumlu) örneklenecek.', { n: sayi(p.toplam), k: sayi(p.denenecek) });
      rozet = ceviri('{n} ayar', { n: sayi(p.denenecek) }); break;
    case 'tam': metin = ceviri('{n} kombinasyonun hepsi denenecek.', { n: sayi(p.toplam) }); rozet = ceviri('{n} ayar', { n: sayi(p.toplam) }); break;
  }
  $('#plan-metin').textContent = metin;
  $('#plan-rozet').textContent = rozet;
  $('#plan-rozet').hidden = !rozet;
  baslatDurumu();
}

function baslatDurumu() {
  const p = plan(secilenler(), sayiOku($('#ornek-sinir').value) || VARSAYILAN_ORNEK);
  const hazir = s && !dogrula(s).length && veri && (p.durum === 'tam' || p.durum === 'orneklenecek');
  $('#baslat').disabled = calisiyor || !hazir;
}

$('#param-tablo').addEventListener('input', e => {
  const el = e.target, i = Number(el.dataset.i), alan = el.dataset.alan;
  if (!params[i] || !alan) return;
  if (alan === 'secili') { params[i].secili = el.checked; paramCiz(); return; }
  const v = sayiOku(el.value);
  if (Number.isFinite(v)) params[i][alan] = v;
  el.classList.toggle('hatali', !Number.isFinite(v));
  planCiz();
});
$('#ornek-sinir').addEventListener('input', planCiz);

// ---------------------------------------------------------------- veri
function kaynakGoster() {
  const k = $('#kaynak').value;
  for (const id of ['#rejim-alan', '#tohum-alan', '#adet-alan']) $(id).hidden = k !== 'sentetik';
  $('#dosya-alan').hidden = k !== 'dosya';
  $('#mt5-alan').hidden = k !== 'mt5';
  $('#tradier-alan').hidden = k !== 'tradier';
  $('#alpaca-alan').hidden = k !== 'alpaca';
  veriHazirla();
}

async function veriHazirla() {
  const k = $('#kaynak').value;
  veri = null;
  $('#veri-durum').textContent = '';
  if (k === 'sentetik') {
    const tohum = Number($('#tohum').value) || 1;
    const mumlar = uret({ rejim: $('#rejim').value, tohum, adet: Number($('#adet').value), zamanDilimi: s?.zaman_dilimi ?? 'H1' });
    veri = { mumlar, ad: ceviri('SENTETİK · tohum {n}', { n: tohum }), uyarilar: [] };
  } else if (k === 'dosya') {
    const f = $('#dosya').files[0];
    if (!f) { $('#veri-rozet').textContent = ceviri('DOSYA BEKLENİYOR'); baslatDurumu(); return; }
    try { const d = dosyaCoz(await f.text(), f.name); veri = { mumlar: d.mumlar, ad: d.ad, uyarilar: d.uyarilar }; }
    catch (err) { $('#veri-rozet').textContent = ceviri('DOSYA OKUNAMADI'); $('#veri-durum').textContent = ceviri('Dosya okunamadı: {m}', { m: ceviri(err.message) }); baslatDurumu(); return; }
  } else if (k === 'mt5') {
    await mt5Hazirla();
  } else if (k === 'tradier') {
    tradier ??= tradierSecici($('#tradier-alan'), {
      zamanDilimi: s?.zaman_dilimi,
      yukle: v => { tradierSon = v; if ($('#kaynak').value === 'tradier') veriHazirla(); },
      hata: m => { if ($('#kaynak').value === 'tradier' && !tradierSon) { $('#veri-rozet').textContent = ceviri('TRADIER VERİSİ YOK'); $('#veri-durum').textContent = m; } },
    });
    tradier.baslat();
    if (tradierSon) veri = { mumlar: tradierSon.mumlar, ad: tradierSon.ad, uyarilar: tradierSon.uyarilar };
    else $('#veri-rozet').textContent = ceviri('TRADIER BEKLENİYOR');
  } else if (k === 'alpaca') {
    alpaca ??= alpacaSecici($('#alpaca-alan'), {
      zamanDilimi: s?.zaman_dilimi,
      yukle: v => { alpacaSon = v; if ($('#kaynak').value === 'alpaca') veriHazirla(); },
      hata: m => { if ($('#kaynak').value === 'alpaca' && !alpacaSon) { $('#veri-rozet').textContent = ceviri('ALPACA VERİSİ YOK'); $('#veri-durum').textContent = m; } },
    });
    alpaca.baslat();
    if (alpacaSon) veri = { mumlar: alpacaSon.mumlar, ad: alpacaSon.ad, uyarilar: alpacaSon.uyarilar };
    else $('#veri-rozet').textContent = ceviri('ALPACA BEKLENİYOR');
  }
  if (veri) {
    $('#veri-rozet').textContent = veri.ad;
    $('#veri-durum').textContent = [ceviri('{n} mum', { n: veri.mumlar.length.toLocaleString(yerel) }), ...veri.uyarilar].join(' · ');
  }
  baslatDurumu();
}

async function mt5Hazirla() {
  const kod = depo.oku(KOD_ANAHTARI) ?? '';
  if (!KOD_RE.test(kod)) {
    $('#veri-rozet').textContent = ceviri('MT5 BAĞLI DEĞİL');
    $('#veri-durum').innerHTML = kacis(ceviri('MetaTrader bağlı değil.')) + ` <a href="baglan.html${dilEki}">${kacis(ceviri("MetaTrader'ı bağla"))}</a>`;
    return;
  }
  mt5 ??= istemci(kod, roleAdresi('', depo.oku(ROLE_ANAHTARI)));
  try {
    const durum = await mt5.durum();
    const d = sinifla({ durum });
    if (!durum) { $('#veri-rozet').textContent = ceviri('MT5 BEKLENİYOR'); $('#veri-durum').textContent = d.ayrinti; return; }
    mt5Seriler = durum.seriler;
    const sec = $('#mt5-seri');
    const onceki = sec.value;
    sec.innerHTML = mt5Seriler.map(x => `<option value="${kacis(x.sembol)}|${kacis(x.zamanDilimi)}">${kacis(x.sembol)} ${kacis(x.zamanDilimi)}</option>`).join('');
    if (onceki && [...sec.options].some(o => o.value === onceki)) sec.value = onceki;
    if (!mt5Seriler.length) { $('#veri-durum').textContent = ceviri('Eklenti henüz mum serisi göndermedi.'); return; }
    const [sembol, td] = sec.value.split('|');
    const r = await mt5.seri(sembol, td, { enAz: 200 });
    if (!r) { $('#veri-durum').textContent = ceviri('Bu seri henüz gelmedi; birkaç saniye sonra yeniden dene.'); return; }
    const sunucu = durum.terminal.sunucu ?? 'MT5';
    veri = { mumlar: r.mumlar, ad: r.ornek ? `${ceviri('ÖRNEK (SENTETİK)')} · ${sembol} ${td}` : `MT5 · ${sunucu} · ${sembol} ${td}`, uyarilar: r.uyarilar };
  } catch (err) {
    const d = sinifla({ hata: err });
    $('#veri-rozet').textContent = ceviri('MT5 VERİSİ YOK');
    $('#veri-durum').textContent = `${d.baslik}: ${d.ayrinti}`;
  }
}

$('#kaynak').addEventListener('change', kaynakGoster);
for (const id of ['#rejim', '#tohum', '#adet', '#dosya', '#mt5-seri']) $(id).addEventListener('change', veriHazirla);

// ---------------------------------------------------------------- tarama
const OLCUT_ADI = () => ({
  getiri_dusus: ceviri('Getiri / en büyük düşüş'),
  sharpe: ceviri('Sharpe (mum başına)'),
  kar_faktoru: ceviri('Kâr faktörü'),
  beklenti: ceviri('Beklenti (R)'),
});

async function baslat() {
  const sec = secilenler().map(p => ({ ...p }));
  const p = plan(sec, sayiOku($('#ornek-sinir').value) || VARSAYILAN_ORNEK);
  if (!s || !veri || !(p.durum === 'tam' || p.durum === 'orneklenecek')) return;
  calisiyor = true; iptalIstendi = false;
  $('#baslat').disabled = true; $('#iptal').hidden = false;
  const ilerleme = $('#ilerleme');
  ilerleme.hidden = false; ilerleme.value = 0;
  $('#calisma-durum').textContent = ceviri('Tarama sürüyor…');
  const propSec = $('#prop').value;
  const egitim = Math.min(90, Math.max(50, sayiOku($('#egitim').value) || 70)) / 100;
  const t0 = performance.now();
  try {
    sonuc = await tara(s, veri.mumlar, sec, {
      olcut: $('#olcut').value,
      egitimOrani: egitim,
      enAzIslem: Math.max(1, Math.round(sayiOku($('#en-az').value) || 20)),
      sinir: p.sinir,
      prop: propSec ? PROP_ON_AYAR[propSec] : null,
      iptal: () => iptalIstendi,
    }, (i, n) => {
      ilerleme.max = n; ilerleme.value = i;
      $('#calisma-durum').textContent = ceviri('Tarama sürüyor: {i}/{n}', { i: i.toLocaleString(yerel), n: n.toLocaleString(yerel) });
    });
    secilenSon = sec;
    const sn = ((performance.now() - t0) / 1000).toFixed(1);
    $('#calisma-durum').textContent = sonuc.iptal
      ? ceviri('Tarama iptal edildi; o ana kadar denenen {n} ayar gösteriliyor.', { n: sonuc.denenen })
      : ceviri('Tarama bitti: {n} ayar, {s} saniye.', { n: sonuc.denenen, s: dil === 'en' ? sn : sn.replace('.', ',') });
    sonucCiz();
  } catch (err) {
    $('#calisma-durum').textContent = ceviri('Tarama tamamlanamadı: {m}', { m: err.message });
  } finally {
    calisiyor = false;
    $('#iptal').hidden = true; ilerleme.hidden = true;
    baslatDurumu();
  }
}
$('#baslat').addEventListener('click', baslat);
$('#iptal').addEventListener('click', () => { iptalIstendi = true; });

// ---------------------------------------------------------------- sonuçlar
const puanMetni = v => (Number.isFinite(v) ? sayiMetni(v, 2) : '–');
const yuzdeYaz = v => (Number.isFinite(v) ? isaretliYuzde(v, 1) : '–');

function uyariMetni(u) {
  switch (u.kod) {
    case 'sonuc_yok': return ceviri('Sıralanabilecek ayar çıkmadı: hepsi elendi (yetersiz işlem, prop ihlali ya da geçersiz ayar). Aralıkları genişlet ya da en az işlem sayısını düşür.');
    case 'sinama_dusuk': return ceviri('Sıralamadaki ilk ayar, sınama döneminde eğitimdeki puanının yarısından azını aldı. Ayar geçmişe uymuş olabilir.');
    case 'sinama_zarar': return ceviri('Sıralamadaki ilk ayar sınama döneminde zarar etti.');
    case 'sivri_tepe': return ceviri('İlk ayarın tek adım komşuları belirgin biçimde daha kötü: sonuç tek bir noktaya bağlı ve küçük bir değişiklikte bozulabilir.');
    case 'sans_olabilir': return ceviri('Bu kadar ayar denendiğinde, ilk sıradaki sonucun şans eseri olmama olasılığı {p}. Yüzde 95\'in altı, sonucun şansla da açıklanabileceği anlamına gelir.', { p: yuzdeMetni(sayiMetni(u.dsr * 100, 0)) });
    case 'cok_deneme': return ceviri('{n} ayar denendi. Ne kadar çok ayar denenirse, en iyi görünen sonucun şansa dayanma olasılığı o kadar artar.', { n: u.denenen });
  }
  return '';
}

function ozetCiz() {
  const r = sonuc;
  const satir = (b, m) => `<div><b>${b}</b><span>${m}</span></div>`;
  const parca = [
    satir(`${r.denenen.toLocaleString(yerel)} / ${r.toplam.toLocaleString(yerel)}`, kacis(r.ornek ? ceviri('denenen / toplam (örneklem)') : ceviri('denenen / toplam'))),
    satir(String(r.yetersiz + r.propElenen + r.gecersiz), kacis(ceviri('elenen: {a} yetersiz işlem, {b} prop ihlali, {c} geçersiz', { a: r.yetersiz, b: r.propElenen, c: r.gecersiz }))),
  ];
  const k = r.komsuluk, ks = komsulukSinifi(k?.oran);
  if (ks) {
    const acik = { saglam: ceviri('komşu ayarlar da benzer sonuç veriyor; küçük değişikliklere dayanıklı'), orta: ceviri('komşu ayarlar biraz daha zayıf'), kirilgan: ceviri('komşu ayarlar belirgin biçimde zayıf; sonuç kırılgan') }[ks];
    parca.push(satir(yuzdeMetni(sayiMetni(k.oran * 100, 0)), kacis(ceviri('komşuluk: {n} komşunun ortalama puanı, ilk ayarın puanına oranla; {a}', { n: k.adet, a: acik }))));
  }
  const ds = dsrSinifi(r.deflatedSharpe);
  if (ds) {
    const acik = { guclu: ceviri('yüksek: sonuç yalnız şansla zor açıklanır'), belirsiz: ceviri('belirsiz: sonuç şansla da açıklanabilir'), zayif: ceviri('düşük: büyük olasılıkla denenen ayar sayısının yan ürünü') }[ds];
    parca.push(satir(yuzdeMetni(sayiMetni(r.deflatedSharpe * 100, 0)), kacis(ceviri('şans eseri olmama olasılığı (çoklu deneme düzeltmesi); {a}', { a: acik }))));
  }
  $('#sonuc-ozet').innerHTML = parca.join('');
  $('#sonuc-uyari').innerHTML = r.uyarilar.map(u => `<li>${kacis(uyariMetni(u))}</li>`).join('');
}

function tabloCiz() {
  const r = sonuc, sec = secilenSon;
  const propVar = !!$('#prop').value;
  const bas = `<thead><tr><th>#</th>${sec.map(p => `<th>${kacis(p.etiket)}</th>`).join('')}
    <th>${kacis(ceviri('Eğitim puanı'))}</th><th>${kacis(ceviri('Sınama puanı'))}</th>
    <th>${kacis(ceviri('Eğitim getirisi'))}</th><th>${kacis(ceviri('Sınama getirisi'))}</th>
    <th>${kacis(ceviri('İşlem (eğitim / sınama)'))}</th><th>${kacis(ceviri('En büyük düşüş (eğitim)'))}</th>
    ${propVar ? `<th>${kacis(ceviri('Prop'))}</th>` : ''}<th></th></tr></thead>`;
  if (!r.enIyiler.length) { $('#sonuc-tablo').innerHTML = ''; return; }
  const govde = r.enIyiler.map((x, i) => `<tr>
    <td>${i + 1}</td>${x.degerler.map(v => `<td>${kacis(dil === 'en' ? String(v) : String(v).replace('.', ','))}</td>`).join('')}
    <td>${puanMetni(x.puan)}</td><td>${puanMetni(x.sinamaPuan)}</td>
    <td>${yuzdeYaz(x.egitim.getiriYuzde)}</td><td>${yuzdeYaz(x.sinama?.getiriYuzde)}</td>
    <td>${x.egitim.islem} / ${x.sinama?.islem ?? '–'}</td><td>${yuzdeMetni(sayiMetni(x.egitim.maxDususYuzde, 1))}</td>
    ${propVar ? `<td>${kacis(x.sinamaPropIhlal ? ceviri('sınamada ihlal') : ceviri('uygun'))}</td>` : ''}
    <td class="opt-eylem"><button type="button" class="kucuk" data-ac="${i}">${kacis(ceviri('Bu ayarla kurucuda aç'))}</button>
      <button type="button" class="kucuk" data-indir="${i}">${kacis(ceviri('Kural dosyasını indir'))}</button></td>
  </tr>`).join('');
  $('#sonuc-tablo').innerHTML = bas + `<tbody>${govde}</tbody>`;
}

function tuval(c) {
  const dpr = window.devicePixelRatio || 1;
  c.dataset.h ??= c.getAttribute('height');
  const w = c.clientWidth, h = Number(c.dataset.h);
  c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  return { x, w, h };
}

function isiCiz() {
  const h = isiHaritasi(sonuc, secilenSon);
  $('#isi-kap').hidden = !h;
  if (!h) return;
  const c = $('#isi');
  const { x, w, h: yuk } = tuval(c);
  const sol = 56, alt = 34, ust = 8, sag = 8;
  const gw = (w - sol - sag) / h.xs.length, gh = (yuk - ust - alt) / h.ys.length;
  const renk = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  x.font = '11px "IBM Plex Mono", ui-monospace, monospace';
  for (let j = 0; j < h.ys.length; j++) {
    for (let i = 0; i < h.xs.length; i++) {
      const hc = h.hucre[j][i];
      const px = sol + i * gw, py = ust + (h.ys.length - 1 - j) * gh;
      if (!hc) continue;
      if (hc.yetersiz || hc.propIhlal) {
        x.fillStyle = 'rgba(141,156,176,.18)'; x.fillRect(px + 1, py + 1, gw - 2, gh - 2);
        x.strokeStyle = 'rgba(141,156,176,.45)'; x.lineWidth = 1;
        x.save(); x.beginPath(); x.rect(px + 1, py + 1, gw - 2, gh - 2); x.clip();
        x.beginPath(); for (let d = -gh; d < gw; d += 6) { x.moveTo(px + d, py + gh); x.lineTo(px + d + gh, py); } x.stroke(); x.restore();
        continue;
      }
      x.fillStyle = hucreRengi(hc.puan, h.min, h.max) ?? 'transparent';
      x.fillRect(px + 1, py + 1, gw - 2, gh - 2);
    }
  }
  if (h.enIyi && h.enIyi.i !== undefined) {
    x.strokeStyle = renk('--text') || '#e7ecf2'; x.lineWidth = 2;
    x.strokeRect(sol + h.enIyi.i * gw + 1, ust + (h.ys.length - 1 - h.enIyi.j) * gh + 1, gw - 2, gh - 2);
  }
  x.fillStyle = renk('--muted') || '#8d9cb0';
  x.textAlign = 'center'; x.textBaseline = 'top';
  const xAdim = Math.ceil(h.xs.length / Math.max(1, Math.floor((w - sol) / 44)));
  h.xs.forEach((v, i) => { if (i % xAdim === 0) x.fillText(String(v), sol + (i + 0.5) * gw, yuk - alt + 6); });
  x.textAlign = 'right'; x.textBaseline = 'middle';
  const yAdim = Math.ceil(h.ys.length / Math.max(1, Math.floor((yuk - alt) / 18)));
  h.ys.forEach((v, j) => { if (j % yAdim === 0) x.fillText(String(v), sol - 6, ust + (h.ys.length - 1 - j + 0.5) * gh); });
  x.textAlign = 'left'; x.textBaseline = 'bottom';
  x.fillText(secilenSon[0].etiket + ' →', sol, yuk - 2);
  x.save(); x.translate(12, ust + 4); x.rotate(Math.PI / 2); x.textBaseline = 'bottom'; x.fillText(secilenSon[1].etiket + ' →', 0, 0); x.restore();
}

function sonucCiz() {
  $('#sonuc-kart').hidden = false;
  ozetCiz();
  tabloCiz();
  isiCiz();
}
window.addEventListener('resize', () => { if (sonuc) isiCiz(); });

function satirStratejisi(i) {
  const x = sonuc.enIyiler[i];
  let k = s;
  x.degerler.forEach((v, j) => { k = ayarla(k, secilenSon[j].yol, v); });
  return { k, x };
}

$('#sonuc-tablo').addEventListener('click', e => {
  const ac = e.target.closest('[data-ac]'), indir = e.target.closest('[data-indir]');
  if (ac) {
    const { k } = satirStratejisi(Number(ac.dataset.ac));
    if (!confirm(ceviri('Strateji kurucudaki mevcut taslağın bu ayarla değiştirilecek. Seçimi sen yapıyorsun; Kalibre bir ayar önermez. Devam edilsin mi?'))) return;
    try { localStorage.setItem(TASLAK_ANAHTARI, JSON.stringify(k)); } catch { alert(ceviri('Taslak kaydedilemedi: tarayıcı deposu kapalı.')); return; }
    location.href = `./${dilEki}`;
  } else if (indir) {
    const { k, x } = satirStratejisi(Number(indir.dataset.indir));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(k, null, 2) + '\n'], { type: 'application/json' }));
    a.download = dosyaAdi(k.ad, secilenSon, x.degerler);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
});

// ---------------------------------------------------------------- başlangıç
$('#taslak-yukle').addEventListener('click', () => { stratejiYukle(taslakOku(), ceviri('Kaynak: strateji kurucudaki taslak.')); veriHazirla(); });
$('#ice-aktar').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const v = JSON.parse(await f.text());
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error();
    stratejiYukle(v, ceviri('Kaynak: içe aktarılan dosya ({ad}).', { ad: f.name }));
    veriHazirla();
  } catch { alert(ceviri('Dosya geçerli bir JSON değil.')); }
});

$('#rejim').innerHTML = Object.entries(REJIMLER).map(([k, r]) => `<option value="${k}">${kacis(ceviri(r.ad))}</option>`).join('');
for (const o of $('#olcut').options) o.textContent = OLCUT_ADI()[o.value] ?? o.textContent;
sayfayiCevir();
baglanDugmesi(document.querySelector('.ust-eylem'));
dilAnahtari(document.querySelector('.ust-eylem'));
stratejiYukle(taslakOku(), ceviri('Kaynak: strateji kurucudaki taslak.'));
kaynakGoster();
