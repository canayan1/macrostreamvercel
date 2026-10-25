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
import { maliyetVar } from './motor.js';
import { denemeSayaci } from './asiri-uyum.js';
import { yuruyenIleri, pencereler } from './yuruyen-ileri.js';
import './dil-dogrulama.js';
import { plan, isiHaritasi, hucreRengi, dosyaAdi, komsulukSinifi, dsrSinifi, PROP_ON_AYAR, EN_COK_PARAMETRE, VARSAYILAN_ORNEK } from './optimizasyon-yardim.js';

const TASLAK_ANAHTARI = 'kalibre-lab-taslak'; // strateji kurucunun taslağı (uygulama.js ile aynı)
const $ = s => document.querySelector(s);
import { kacis, stratejiyiTemizle } from './guvenlik.js';
import { maliyetAlani, maliyetOku, maliyetEtiketi } from './maliyet-arayuz.js';
import { kimlikSatiri } from './calistirma-arayuz.js';
import { gercekciAlani, durumOku as gercekciOku, provaSecenekleri, dolumAdi } from './gercekci-arayuz.js';
import './dil-gercekci.js';
const sayiOku = v => Number(String(v).trim().replace(',', '.'));
const dilEki = dil === 'tr' ? '?dil=tr' : '';

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
let altMumlar = null; // M1 büyüteç için alt zaman dilimi mumları (yalnız bellekte)

// Gerçekçi maliyetler ve dolum: kapalıyken boş nesne (sonuç ve resultId değişmez).
function gercekciSecenek() {
  const g = provaSecenekleri(gercekciOku(), { altMumlar, nokta: veri?.nokta ?? null });
  return { provaSecenek: Object.keys(g.secenek).length ? g.secenek : undefined, uyarilar: g.uyarilar };
}

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
  // Dışarıdan gelen her strateji önce temizlenir (guvenlik.js), sonra doğrulanır.
  const temiz = yeni ? stratejiyiTemizle(yeni) : null;
  s = temiz?.strateji ?? null;
  if (temiz?.atilanlar.length) kaynakMetni += ' ' + ceviri('Geçersiz {n} alan atıldı.', { n: temiz.atilanlar.length });
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
    // Yapısı bozuk bir dosyanın parametreleri çizilmez; yalnız hata gösterilir.
    if (hatalar.length && !hatalar.every(h => h.yol.startsWith('risk'))) { params = []; paramCiz(); return; }
    params = parametreler(s).map(p => ({ ...p, etiket: etiket(p), secili: false }));
    // İlk iki gösterge periyodu varsayılan seçim: kullanıcı değiştirebilir.
    params.filter(p => /^gostergeler\..+\.(periyot|hizli|yavas)$/.test(p.yol)).slice(0, 2).forEach(p => { p.secili = true; });
  }
  paramCiz();
}

function taslakOku() {
  try { const v = localStorage.getItem(TASLAK_ANAHTARI); return v ? stratejiyiTemizle(JSON.parse(v)).strateji : null; } catch { return null; }
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
      <td><input type="checkbox" data-i="${kacis(i)}" data-alan="secili" ${p.secili ? 'checked' : ''} ${!p.secili && secSayisi >= EN_COK_PARAMETRE ? 'disabled' : ''} aria-label="${kacis(p.etiket)}"></td>
      <td>${kacis(p.etiket)}<br><code>${kacis(p.yol)}</code></td>
      <td>${kacis(String(p.deger))}</td>
      <td><input type="text" inputmode="decimal" data-i="${kacis(i)}" data-alan="min" value="${kacis(p.min)}" ${p.secili ? '' : 'disabled'}></td>
      <td><input type="text" inputmode="decimal" data-i="${kacis(i)}" data-alan="max" value="${kacis(p.max)}" ${p.secili ? '' : 'disabled'}></td>
      <td><input type="text" inputmode="decimal" data-i="${kacis(i)}" data-alan="adim" value="${kacis(p.adim)}" ${p.secili ? '' : 'disabled'}></td>
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
    $('#veri-durum').innerHTML = kacis(ceviri('MetaTrader bağlı değil.')) + ` <a href="baglan.html${dilEki}">${kacis(ceviri("MetaTrader 5'i bağla"))}</a>`;
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
    veri = { mumlar: r.mumlar, ad: r.ornek ? `${ceviri('ÖRNEK (SENTETİK)')} · ${sembol} ${td}` : `MT5 · ${sunucu} · ${sembol} ${td}`, uyarilar: r.uyarilar, nokta: r.meta?.nokta ?? null };
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
  const sayac = denemeSayaci();
  const gs = gercekciSecenek();
  try {
    sonuc = await tara(s, veri.mumlar, sec, {
      ...(gs.provaSecenek ? { provaSecenek: gs.provaSecenek } : {}),
      oncekiDeneme: sayac.oku(s),
      olcut: $('#olcut').value,
      egitimOrani: egitim,
      enAzIslem: Math.max(1, Math.round(sayiOku($('#en-az').value) || 20)),
      sinir: p.sinir,
      prop: propSec ? PROP_ON_AYAR[propSec] : null,
      maliyet: maliyetOku(),
      iptal: () => iptalIstendi,
    }, (i, n) => {
      ilerleme.max = n; ilerleme.value = i;
      $('#calisma-durum').textContent = ceviri('Tarama sürüyor: {i}/{n}', { i: i.toLocaleString(yerel), n: n.toLocaleString(yerel) });
    });
    secilenSon = sec;
    sayac.ekle(s, sonuc.denenen);
    const sn = ((performance.now() - t0) / 1000).toFixed(1);
    $('#calisma-durum').textContent = sonuc.iptal
      ? ceviri('Tarama iptal edildi; o ana kadar denenen {n} ayar gösteriliyor.', { n: sonuc.denenen })
      : ceviri('Tarama bitti: {n} ayar, {s} saniye.', { n: sonuc.denenen, s: dil === 'en' ? sn : sn.replace('.', ',') });
    if (gs.uyarilar.length) $('#calisma-durum').textContent += ` ${gs.uyarilar.join(' ')}`;
    sonuc.gercekci = gs.provaSecenek ?? null;
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
const puanMetni = v => (Number.isFinite(v) ? sayiMetni(v, 2) : '-');
const yuzdeYaz = v => (Number.isFinite(v) ? isaretliYuzde(v, 1) : '-');

function uyariMetni(u) {
  switch (u.kod) {
    case 'sonuc_yok': return ceviri('Sıralanabilecek ayar çıkmadı: hepsi elendi (yetersiz işlem, prop ihlali ya da geçersiz ayar). Aralıkları genişlet ya da en az işlem sayısını düşür.');
    case 'sinama_dusuk': return ceviri('Sıralamadaki ilk ayar, sınama döneminde eğitimdeki puanının yarısından azını aldı. Ayar geçmişe uymuş olabilir.');
    case 'sinama_zarar': return ceviri('Sıralamadaki ilk ayar sınama döneminde zarar etti.');
    case 'sivri_tepe': return ceviri('İlk ayarın tek adım komşuları belirgin biçimde daha kötü: sonuç tek bir noktaya bağlı ve küçük bir değişiklikte bozulabilir.');
    case 'sans_olabilir': return ceviri('Bu kadar ayar denendiğinde, ilk sıradaki sonucun şans eseri olmama olasılığı {p}. Yüzde 95\'in altı, sonucun şansla da açıklanabileceği anlamına gelir.', { p: yuzdeMetni(sayiMetni(u.dsr * 100, 0)) });
    case 'pbo_yuksek': return ceviri('Eğitimde en iyi görünen ayarlar, görülmemiş dönemlerde çoğunlukla ortanın altında kaldı (PBO {p}). Sıralama büyük olasılıkla geçmişe uyumu yansıtıyor.', { p: yuzdeMetni(sayiMetni(u.pbo * 100, 0)) });
    case 'cok_deneme': return ceviri('{n} ayar denendi. Ne kadar çok ayar denenirse, en iyi görünen sonucun şansa dayanma olasılığı o kadar artar.', { n: u.denenen });
  }
  return '';
}

function ozetCiz() {
  const r = sonuc;
  const satir = (b, m) => `<div><b>${b}</b><span>${m}</span></div>`;
  const parca = [
    ...(r.gercekci?.enstruman && !maliyetVar(r.maliyet) ? [] : [satir(kacis(maliyetEtiketi(r.maliyet)), kacis(ceviri('tüm puanlar bu maliyetle hesaplandı')))]),
    ...(r.gercekci ? [satir(kacis(r.gercekci.enstruman ? ceviri('Gerçekçi maliyetler açık') : ceviri('Gerçekçi maliyetler kapalı')),
      kacis([r.gercekci.enstruman ? ceviri('lot, kur çevrimi, lot başı komisyon, swap ve teminat dahil') : '', ceviri('dolum modeli: {m}', { m: dolumAdi(r.gercekci.dolum ?? 'stop-once') })].filter(Boolean).join('; ')))] : []),
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
  parca.push(satir(r.N.toLocaleString(yerel), `${kacis(ceviri('bu taslakta toplam deneme (önceki taramalar dahil); şans düzeltmesi bu sayıyla yapılır'))} <button type="button" class="dugme ikincil kucuk" id="sayac-sifirla">${kacis(ceviri('Sayacı sıfırla'))}</button>`));
  if (r.pbo?.pbo != null) {
    const p = r.pbo.pbo;
    const acik = p < 0.2 ? ceviri('düşük: seçim görülmemiş dönemlerde de büyük ölçüde tutuyor') : p < 0.5 ? ceviri('orta: seçim görülmemiş dönemlerde kısmen tutuyor') : ceviri('yüksek: seçim büyük olasılıkla geçmişe uyumun ürünü');
    parca.push(satir(yuzdeMetni(sayiMetni(p * 100, 0)), kacis(ceviri('aşırı uyum olasılığı (PBO, {k} bölme): eğitimde en iyi görünen ayarın sınamada ortanın altında kalma oranı; {a}', { k: r.pbo.kombinasyon.toLocaleString(yerel), a: acik }))));
  } else if (r.pbo?.neden) {
    const neden = { ozdes: ceviri('ayarların sonuçları özdeş'), az_gozlem: ceviri('veri bölmeler için kısa'), az_ayar: ceviri('en az iki ayar gerekir') }[r.pbo.neden] ?? r.pbo.neden;
    parca.push(satir('-', kacis(ceviri('PBO hesaplanamadı: {n}', { n: neden }))));
  }
  if (r.kirpma) {
    parca.push(satir(sayiMetni(r.kirpma.hsr, 3), kacis(ceviri('düzeltilmiş Sharpe (Harvey-Liu, BHY): {n} deneme hesaba katılınca ilk ayarın mum başı Sharpe\'ı {a}, kırpma {k}', { n: r.kirpma.M, a: sayiMetni(r.kirpma.hsr, 3), k: yuzdeMetni(sayiMetni(Math.max(0, Math.min(1, r.kirpma.kirpma)) * 100, 0)) }))));
  }
  $('#sonuc-ozet').innerHTML = parca.join('');
  $('#sayac-sifirla')?.addEventListener('click', () => {
    if (!confirm(ceviri('Bu taslağın deneme sayacı sıfırlansın mı? Sıfırlamak, daha önce denenen ayarları silmez; yalnız şans düzeltmesini zayıflatır.'))) return;
    denemeSayaci().sifirla(s);
  });
  $('#sonuc-uyari').innerHTML = r.uyarilar.map(u => `<li>${kacis(uyariMetni(u))}</li>`).join('');
  // Sonuç kimliği: aynı strateji, veri, aralıklar, seçenekler ve önceki deneme sayısı aynı kimliği verir.
  const strateji = JSON.parse(JSON.stringify(s)), parametre = secilenSon;
  $('#kimlik-not').hidden = false;
  kimlikSatiri($('#calistirma'), {
    resultId: r.resultId, dosyaAdi: 'kalibre-optimizasyon',
    paket: () => ({
      format: 'kalibre-optimization', formatVersion: 1, manifest: r.manifest, strategy: strateji, parameters: parametre,
      summary: { N: r.N, tried: r.denenen, total: r.toplam, sampled: r.ornek, deflatedSharpe: r.deflatedSharpe, pbo: r.pbo, haircut: r.kirpma, neighbourhood: r.komsuluk, cost: r.maliyet },
      best: r.enIyiler, results: r.sonuclar, warnings: r.uyarilar,
    }),
  });
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
    <td>${x.egitim.islem} / ${x.sinama?.islem ?? '-'}</td><td>${yuzdeMetni(sayiMetni(x.egitim.maxDususYuzde, 1))}</td>
    ${propVar ? `<td>${kacis(x.sinamaPropIhlal ? ceviri('sınamada ihlal') : ceviri('uygun'))}</td>` : ''}
    <td class="opt-eylem"><button type="button" class="kucuk" data-ac="${kacis(i)}">${kacis(ceviri('Bu ayarla kurucuda aç'))}</button>
      <button type="button" class="kucuk" data-indir="${kacis(i)}">${kacis(ceviri('Kural dosyasını indir'))}</button></td>
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

// ---------------------------------------------------------------- yürüyen ileri
function yuruyenKutusu() {
  let k = $('#yuruyen');
  if (k) return k;
  k = document.createElement('div');
  k.id = 'yuruyen';
  k.className = 'opt-yuruyen';
  k.innerHTML = `<h3>${kacis(ceviri('Yürüyen ileri analiz'))}</h3>
    <p class="not">${kacis(ceviri('Ayar her pencerede yalnız o güne kadarki veriyle yeniden seçilir ve hemen sonraki dönemde sınanır. Sınama dönemleri uç uca eklenir.'))}</p>
    <label>${kacis(ceviri('Pencere'))} <select id="yuruyen-tur"><option value="kayan">${kacis(ceviri('Kayan'))}</option><option value="capali">${kacis(ceviri('Çapalı (büyüyen)'))}</option></select></label>
    <button type="button" class="dugme ikincil" id="yuruyen-baslat">${kacis(ceviri('Çalıştır'))}</button>
    <span class="durum" id="yuruyen-durum" role="status"></span>
    <div class="opt-ozet" id="yuruyen-ozet"></div>
    <p class="calistirma" id="yuruyen-kimlik" hidden></p>
    <div class="opt-tablo-kap"><table class="pozisyon" id="yuruyen-tablo"></table></div>`;
  $('#sonuc-uyari').after(k);
  $('#yuruyen-baslat').addEventListener('click', yuruyenCalistir);
  return k;
}

async function yuruyenCalistir() {
  if (!s || !veri || !secilenSon || calisiyor) return;
  const T = veri.mumlar.length, egitim = Math.floor(T * 0.4), sinama = Math.floor(T * 0.15);
  const tur = $('#yuruyen-tur').value;
  if (pencereler(T, { egitim, sinama, embargo: 5, tur }).length < 2) { $('#yuruyen-durum').textContent = ceviri('Yürüyen ileri için veri kısa: en az iki pencere gerekir.'); return; }
  calisiyor = true; baslatDurumu();
  $('#yuruyen-baslat').disabled = true;
  kimlikSatiri($('#yuruyen-kimlik'), {});
  const gs = gercekciSecenek();
  try {
    const k = await yuruyenIleri(s, veri.mumlar, secilenSon, {
      ...(gs.provaSecenek ? { provaSecenek: gs.provaSecenek } : {}),
      egitim, sinama, embargo: 5, tur, olcut: $('#olcut').value,
      enAzIslem: Math.max(1, Math.round((sayiOku($('#en-az').value) || 20) * 0.4)),
      sinir: Math.min(200, sonuc?.planlanan ?? 200), maliyet: maliyetOku(), iptal: () => iptalIstendi,
    }, (i, n) => { $('#yuruyen-durum').textContent = ceviri('Yürüyen ileri analiz sürüyor: {i}/{n}', { i, n }); });
    $('#yuruyen-durum').textContent = gs.uyarilar.join(' ');
    const strateji = JSON.parse(JSON.stringify(s)), parametre = secilenSon;
    kimlikSatiri($('#yuruyen-kimlik'), {
      resultId: k.resultId, dosyaAdi: 'kalibre-walk-forward',
      paket: () => ({
        format: 'kalibre-walk-forward', formatVersion: 1, manifest: k.manifest, strategy: strateji, parameters: parametre,
        summary: { type: k.tur, train: k.egitim, test: k.sinama, embargo: k.embargo, wfe: k.wfe, oosReturnPct: k.oosGetiriYuzde, settingChangeRate: k.ayarDegisimOrani },
        folds: k.katlar, oosEquity: k.oosOzkaynak,
      }),
    });
    const satir = (b, m) => `<div><b>${b}</b><span>${m}</span></div>`;
    $('#yuruyen-ozet').innerHTML = [
      satir(k.wfe === null ? '-' : sayiMetni(k.wfe, 2), kacis(ceviri('yürüyen ileri verimliliği (WFE): sınamadaki ortalama getirinin eğitimdekine oranı; 1\'e yakınsa seçim tutmuş, 0 ya da altıysa tutmamış'))),
      satir(isaretliYuzde(k.oosGetiriYuzde, 1), kacis(ceviri('birleştirilmiş sınama getirisi, {n} pencere', { n: k.katlar.length }))),
      satir(yuzdeMetni(sayiMetni(k.ayarDegisimOrani * 100, 0)), kacis(ceviri('ardışık pencerelerde seçilen ayarın değişme oranı'))),
    ].join('');
    const bas = `<tr><th>${kacis(ceviri('Eğitim'))}</th><th>${kacis(ceviri('Sınama'))}</th><th>${kacis(ceviri('Seçilen ayar'))}</th><th>${kacis(ceviri('Sınama getirisi'))}</th></tr>`;
    $('#yuruyen-tablo').innerHTML = bas + k.katlar.map(p => `<tr><td>${kacis(ceviri('mum {a}-{b}', { a: p.isBas, b: p.isSon }))}</td><td>${kacis(ceviri('mum {a}-{b}', { a: p.oosBas, b: p.oosSon }))}</td><td>${p.secim ? kacis(p.secim.map(v => ondalikYaz(v)).join(' · ')) : kacis(ceviri('uygun ayar yok'))}</td><td>${p.oos ? kacis(isaretliYuzde(p.oos.getiriYuzde, 1)) : '-'}</td></tr>`).join('');
  } catch (err) {
    $('#yuruyen-durum').textContent = ceviri('Yürüyen ileri analiz tamamlanamadı: {m}', { m: err.message });
  } finally {
    calisiyor = false; baslatDurumu();
    $('#yuruyen-baslat').disabled = false;
  }
}
const ondalikYaz = v => (Number.isInteger(v) ? String(v) : sayiMetni(v, 2));

function sonucCiz() {
  $('#sonuc-kart').hidden = false;
  ozetCiz();
  yuruyenKutusu();
  $('#yuruyen-ozet').innerHTML = ''; $('#yuruyen-tablo').innerHTML = ''; $('#yuruyen-durum').textContent = '';
  kimlikSatiri($('#yuruyen-kimlik'), {});
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

$('#rejim').innerHTML = Object.entries(REJIMLER).map(([k, r]) => `<option value="${kacis(k)}">${kacis(ceviri(r.ad))}</option>`).join('');
maliyetAlani($('#maliyet-alan'));
gercekciAlani($('#gercekci-alan'), {
  m1Var: () => !!altMumlar?.length,
  m1Yukle: async f => { altMumlar = dosyaCoz(await f.text(), f.name, { enAz: 1 }).mumlar; return { adet: altMumlar.length }; },
});
for (const o of $('#olcut').options) o.textContent = OLCUT_ADI()[o.value] ?? o.textContent;
sayfayiCevir();
baglanDugmesi(document.querySelector('.ust-eylem'));
dilAnahtari(document.querySelector('.ust-eylem'));
stratejiYukle(taslakOku(), ceviri('Kaynak: strateji kurucudaki taslak.'));
kaynakGoster();
