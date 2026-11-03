// İşlem Analizi sayfası (lab/analytics.html). Dosya ve işlemler tarayıcıda kalır; sunucuya hiçbir
// şey gönderilmez. Hesaplar saf modüllerde: analiz/{model,mt5-rapor,csv-ice,hesap,prop,ornek}.js.

import { urlParam, sampleFileParam } from './url-params.js';
import './dil-analiz.js';
import { t as ceviri, yerel, sayfayiCevir, dil } from './dil.js';
import { kacis } from './guvenlik.js';
import { CSV_ALANLARI } from './analiz/csv-ice.js';
import { dosyadanHesap, tablodan } from './analiz/ice-aktar.js';
import { koprudenHesap } from './analiz/model.js';
import { analizMotoru, BOYUTLAR, OLCULER } from './analiz/hesap.js';
import { propDegerlendir, ON_AYARLAR } from './analiz/prop.js';
import { ornekHesap } from './analiz/ornek.js';
import { accountReportModel } from './report/account-model.js';
import { LOCAL_KEY } from './report/blotter-model.js';
import { gorunumKur, cizimHtml, pastaSvg } from './gorunum.js';
import { PERIODS, periodRange, customRange, applyPeriod } from './analiz/donem.js';
import { parsePriceFile, ecbRequest, ecbPrices, holdAnalysis } from './analiz/hold.js';
import { RULES, suggestRules, adherence, ruleGuardSet, GUARD_PRESET } from './analiz/rules.js';
import { edge, sizingReplay, POLICIES } from './analiz/risk.js';
import { excursions, eRatio, exitSimulation } from './analiz/excursion.js';
import { istemci, roleAdresi } from './veri/baglanti.js';

const $ = s => document.querySelector(s);
const EN_BUYUK_DOSYA = 50 * 1024 * 1024;
const DEPO = { utc: 'kalibre-analiz-utc', gorunum: 'kalibre-analiz-gorunumler', kod: 'kalibre-kopru-kod', role: 'kalibre-kopru-role', donem: 'kalibre-analiz-donem', sabit: 'kalibre-analiz-sabit', kural: 'kalibre-analiz-kurallar' };
const depoOku = k => { try { return localStorage.getItem(k); } catch { return null; } };
const depoYaz = (k, v) => { try { localStorage.setItem(k, v); } catch { /* depo yok */ } };

// hesap: the whole file; gorunen: the selected period of it; motorTam: the whole history (prop limits).
let hesap = null, gorunen = null, motor = null, motorTam = null;
let utcFark = Number(depoOku(DEPO.utc) ?? 2);
if (!Number.isFinite(utcFark) || utcFark < -12 || utcFark > 14) utcFark = 2;

// ---------------------------------------------------------------- biçim
const sayi = (x, b = 2) => (typeof x === 'number' && Number.isFinite(x) ? x.toLocaleString(yerel, { minimumFractionDigits: b, maximumFractionDigits: b }) : '–');
const para = (x, b = 2) => (typeof x === 'number' && Number.isFinite(x) ? `${x > 0 ? '+' : x < 0 ? '−' : ''}${sayi(Math.abs(x), b)}${hesap?.para ? ' ' + hesap.para : ''}` : '–');
const duzPara = (x, b = 2) => (typeof x === 'number' && Number.isFinite(x) ? `${sayi(x, b)}${hesap?.para ? ' ' + hesap.para : ''}` : '–');
const yuzde = (x, b = 1) => (typeof x === 'number' && Number.isFinite(x) ? (yerel === 'tr-TR' ? `%${sayi(x * 100, b)}` : `${sayi(x * 100, b)}%`) : '–');
const oran = (x, b = 2) => (x === Infinity ? '∞' : sayi(x, b));
const sinif = x => (x > 0 ? 'pozitif' : x < 0 ? 'negatif' : '');
// Tarih: Türkçede 01.04.2026, İngilizcede ISO 2026-04-01 (blotter sayfasıyla aynı).
const tarih = sn => { if (!sn) return '–'; const d = new Date(sn * 1000); const g = String(d.getUTCDate()).padStart(2, '0'), a = String(d.getUTCMonth() + 1).padStart(2, '0'); return dil === 'en' ? `${d.getUTCFullYear()}-${a}-${g}` : `${g}.${a}.${d.getUTCFullYear()}`; };
const gunMetni = g => { const [y, a, gg] = g.split('-'); return dil === 'en' ? g : `${gg}.${a}.${y}`; };
const olcuMetni = (tur, x) => (tur === 'para' ? para(x) : tur === 'yuzde' ? yuzde(x) : tur === 'sayi' ? sayi(x, 0) : oran(x));
const etiket = s => ceviri(s);

// ---------------------------------------------------------------- yükleme
// "Sor" kutusu: yerel çözümleyici anlamazsa sunucudaki modele yalnız şema ve soru gider (veri gitmez).
async function sorUzak(soru, sema) {
  const r = await fetch('/api/asistan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mod: 'gorunum', soru, sema: { boyutlar: sema.boyutlar.map(b => ({ id: b.id, ad: b.ad })), olculer: sema.olculer.map(o => ({ id: o.id, ad: o.ad, tur: o.tur })) } }) });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j?.tarif ?? null;
}

function durum(metin, hata = false) { const e = $('#yukle-durum'); e.textContent = metin; e.classList.toggle('negatif', hata); }

async function dosyaOku(dosya) {
  if (!dosya) return;
  if (dosya.size > EN_BUYUK_DOSYA) { durum(ceviri('Dosya çok büyük (en çok 50 MB).'), true); return; }
  durum(ceviri('Okunuyor…'));
  satirRaporu(null);
  let s;
  try {
    s = await dosyadanHesap(dosya.name, new Uint8Array(await dosya.arrayBuffer()));
  } catch {
    durum(ceviri('Dosya okunamadı. MT5 raporunu HTML olarak kaydedip yeniden dene.'), true);
    return;
  }
  sonucuIsle(s);
}

// ?file=: yayımlanmış örnek dosyayı sunucudan alır ve bir kullanıcının bırakacağı gibi okur.
const ORNEK_DOSYALAR = ['templates/kalibre-trade-log-example.xlsx', 'templates/kalibre-trade-log-example.csv'];
async function ornekDosyaAc(yol) {
  try {
    const y = await fetch(yol);
    if (!y.ok) throw new Error(String(y.status));
    await dosyaOku(new File([await y.arrayBuffer()], yol.split('/').pop()));
  } catch {
    durum(ceviri('Dosya okunamadı. MT5 raporunu HTML olarak kaydedip yeniden dene.'), true);
  }
}

// Yeni dosya okunamazsa önceki hesabın sonuçları ekranda kalmasın.
function sonuclariGizle() {
  for (const el of document.querySelectorAll('#sonuclar > section, #donem-kart')) el.hidden = true;
  $('#kaynak-rozet').hidden = true;
  $('#bos-durum').hidden = false;
}

function sonucuIsle(s) {
  if (s.tur === 'eslesme') {
    sonuclariGizle();
    csvEslesmeGoster(s.satirlar, s.rapor);
    const taninan = Object.values(s.rapor.eslesme ?? {}).filter(i => i >= 0).length;
    durum(taninan
      ? ceviri('Sütunlar tanınamadı. Aşağıdan eşleştir ya da şablonu kullan.')
      : ceviri('Bu dosya bir işlem geçmişine benzemiyor. MT5 raporunu (HTML ya da XLSX) ya da şablondan yapılmış bir tabloyu bırak. Sütunların başka adlarla duruyorsa aşağıdan eşleştir.'), true);
    return;
  }
  if (s.tur === 'bos') {
    sonuclariGizle();
    satirRaporu(s.rapor);
    durum(s.rapor
      ? ceviri('Okunabilen işlem satırı yok. Aşağıdaki satır hatalarına bak.')
      : ceviri('Kapanmış pozisyon bulunamadı. MT5 Geçmiş sekmesinde Pozisyonlar görünümünü seçip raporu öyle kaydet.'), true);
    return;
  }
  if (s.rapor?.onerilenUtcFarki !== null && s.rapor?.onerilenUtcFarki !== undefined && Number.isInteger(s.rapor.onerilenUtcFarki)) {
    utcFark = s.rapor.onerilenUtcFarki;
    $('#utc-fark').value = String(utcFark);
    depoYaz(DEPO.utc, String(utcFark));
  }
  yukle(s.hesap, s.rapor);
}

// Tablo içe aktarımının satır raporu: "N satır alındı, M satır atlandı" + atlanan satırlar.
function satirRaporu(r) {
  const kutu = $('#satir-rapor');
  if (!r || (!r.hatalar.length && !r.sentetik)) { kutu.hidden = true; kutu.innerHTML = ''; return; }
  const ilk = r.hatalar.slice(0, 50);
  const uyari = r.sentetik ? `<p class="negatif">${kacis(ceviri('{n} satır EXAMPLE olarak etiketli. Şablondaki örnek satırları silmeyi unutma.', { n: r.sentetik }))}</p>` : '';
  const liste = ilk.length ? `<p>${kacis(ceviri('Atlanan satırlar:'))}</p><ul>${ilk.map(h => `<li>${kacis(ceviri('Satır {no}', { no: h.satir }))}: <code>${kacis(h.alan)}</code> ${kacis(ceviri(h.neden))}</li>`).join('')}</ul>${r.hatalar.length > ilk.length ? `<p>${kacis(ceviri('ve {n} satır daha.', { n: r.hatalar.length - ilk.length }))}</p>` : ''}` : '';
  kutu.innerHTML = uyari + liste;
  kutu.hidden = false;
}

function csvEslesmeGoster(satirlar, r) {
  const kutu = $('#csv-eslesme');
  const ADLAR = { acilisZamani: 'Açılış zamanı', kapanisZamani: 'Kapanış zamanı', sembol: 'Sembol', yon: 'Yön', lot: 'Lot', acilisFiyati: 'Açılış fiyatı', kapanisFiyati: 'Kapanış fiyatı', sl: 'S/L', tp: 'T/P', komisyon: 'Komisyon', swap: 'Swap', kar: 'Kâr (brüt)', net: 'Net kâr', ofset: 'UTC farkı', para: 'Hesap para birimi', bilet: 'İşlem no', satirTuru: 'Satır türü', strateji: 'Strateji', etiket: 'Etiket', not: 'Not' };
  const secenek = (sec) => `<option value="-1">${kacis(ceviri('Yok'))}</option>` + r.basliklar.map((b, i) => `<option value="${kacis(i)}"${sec === i ? ' selected' : ''}>${kacis(b || `#${i + 1}`)}</option>`).join('');
  kutu.innerHTML = `<div class="csv-izgara">${CSV_ALANLARI.map(a => `<label class="secici"><span>${kacis(ceviri(ADLAR[a]))}</span><select data-alan="${kacis(a)}">${secenek(r.eslesme[a])}</select></label>`).join('')}</div>
    <button type="button" class="kucuk" id="csv-uygula">${kacis(ceviri('Eşleşmeyi uygula'))}</button>`;
  kutu.hidden = false;
  $('#csv-uygula').onclick = () => {
    const e = {};
    for (const sec of kutu.querySelectorAll('select[data-alan]')) e[sec.dataset.alan] = Number(sec.value);
    const s2 = tablodan(satirlar, r.hesap?.kaynak ?? 'csv', e);
    if (s2.tur === 'eslesme') { durum(ceviri('Eksik zorunlu sütun: {liste}.', { liste: s2.rapor.eksik.map(k => ceviri(ADLAR[k] ?? k)).join(', ') }), true); return; }
    kutu.hidden = true;
    sonucuIsle(s2);
  };
}

const KAYNAK_ADI = { 'mt5-html': 'MT5 raporu (HTML)', 'mt5-xlsx': 'MT5 raporu (XLSX)', kopru: 'Kalibre Bridge', csv: 'Kendi tablon (CSV)', xlsx: 'Kendi tablon (XLSX)', ornek: 'Örnek hesap' };

function yukle(h, rapor = null) {
  if (!h.islemler.length) {
    durum(ceviri('Kapanmış pozisyon bulunamadı. MT5 Geçmiş sekmesinde Pozisyonlar görünümünü seçip raporu öyle kaydet.'), true);
    return;
  }
  hesap = h;
  $('#csv-eslesme').hidden = true;
  const r = $('#kaynak-rozet');
  r.textContent = ceviri(KAYNAK_ADI[h.kaynak] ?? h.kaynak); r.hidden = false;
  r.classList.toggle('gercek', h.kaynak === 'ornek');
  $('#sentetik-bant').hidden = h.kaynak !== 'ornek';
  $('#ust-sentetik').hidden = h.kaynak !== 'ornek';
  $('#bos-durum').hidden = true;
  satirRaporu(rapor);
  durum(rapor
    ? ceviri('{n} satır alındı, {m} satır atlandı.', { n: rapor.okunan.toLocaleString(yerel), m: rapor.atlanan.toLocaleString(yerel) })
    : ceviri('{n} kapanmış işlem okundu.', { n: h.islemler.length.toLocaleString(yerel) }) + (h.atlanan ? ' ' + ceviri('{n} satır okunamadı ve atlandı.', { n: h.atlanan }) : ''));
  hesapla();
}

function aralik() {
  const k = $('#donem').value || 'all';
  return k === 'custom' ? customRange($('#donem-bas').value, $('#donem-bit').value) : periodRange(k, hesap.islemler);
}

function hesapla() {
  if (!hesap) return;
  const r = aralik();
  gorunen = applyPeriod(hesap, r);
  motorTam = analizMotoru(hesap, { sunucuUtcFarki: utcFark });
  $('#donem-kart').hidden = false;
  $('#prop-donem-not').hidden = !r;
  if (!gorunen.islemler.length) {
    motor = null;
    for (const el of document.querySelectorAll('#sonuclar > section')) el.hidden = true;
    $('#donem-ozet').textContent = ceviri('Bu dönemde kapanmış işlem yok. Başka bir dönem seç.');
    return;
  }
  motor = analizMotoru(gorunen, { sunucuUtcFarki: utcFark });
  const o = motor.ozet();
  $('#donem-ozet').textContent = ceviri('{n} işlem, {a} - {b}', { n: sayi(o.adet, 0), a: tarih(o.ilk), b: tarih(o.son) });
  for (const id of ['#ozet-kart', '#risk-kart', '#grafik-kart', '#icgoru-kart', '#kural-kart', '#kirilim-kart', '#prop-kart', '#hold-kart', '#cikis-kart', '#maliyet-kart', '#gorunum-kart']) $(id).hidden = false;
  ozetCiz(); grafikCiz(); icgoruCiz(); kirilimCiz(); propHazirla(); propCiz(); riskCiz(); kuralCiz(); fiyatliCiz(); gorunumCiz();
  kartlariDuzenle();
}

// The report page: the model is handed over through localStorage and opened in a new tab (#local).
let sonProp = null; // { ad, s } from the last propCiz
function openReportPage() {
  if (!motor) return;
  const model = accountReportModel({ hesap: gorunen, motor, lang: dil === 'tr' ? 'tr' : 'en', source: $('#kaynak-rozet').textContent, utcFark, prop: sonProp });
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(model)); } catch { durum(ceviri('Rapor sayfası açılamadı: tarayıcı depolama alanı kapalı.'), true); return; }
  window.open('/lab/report#local', '_blank');
}

// ---------------------------------------------------------------- özet
function ozetCiz() {
  const o = motor.ozet();
  const karo = (ad, deger, s = '') => `<div><span>${kacis(ceviri(ad))}</span><b class="${kacis(s)}">${kacis(deger)}</b></div>`;
  const ana = (ad, deger, s = '', alt = '') => `<div class="${kacis(s)}"><span>${kacis(ceviri(ad))}</span><b>${kacis(deger)}</b>${alt ? `<small>${kacis(alt)}</small>` : ''}</div>`;
  $('#ozet-ana').innerHTML = [
    ana('Net kâr/zarar', para(o.net), sinif(o.net), hesap.baslangicBakiye ? ceviri('Başlangıca göre {y}', { y: yuzde(o.net / hesap.baslangicBakiye) }) : ''),
    ana('Kazanma oranı', yuzde(o.kazanmaOrani), '', ceviri('{n} işlem', { n: sayi(o.adet, 0) })),
    ana('Kâr faktörü', oran(o.karFaktoru), o.karFaktoru >= 1 ? 'pozitif' : 'negatif', ceviri('İşlem başı {x}', { x: para(o.beklenti) })),
    ana('Azami düşüş', duzPara(o.azamiDusus, 0), 'negatif', o.azamiDususYuzde !== null ? ceviri('Tepeden {y}', { y: yuzde(o.azamiDususYuzde) }) : ''),
  ].join('');
  $('#ozet-karolar').innerHTML = [
    karo('Ortalama kazanç', para(o.ortKazanc), 'pozitif'),
    karo('Ortalama kayıp', para(o.ortKayip), 'negatif'),
    karo('Komisyon ve swap', para(o.komisyon + o.swap), sinif(o.komisyon + o.swap)),
    karo('En iyi gün', o.enIyiGun ? `${gunMetni(o.enIyiGun.gun)} ${para(o.enIyiGun.net)}` : '–'),
    karo('En kötü gün', o.enKotuGun ? `${gunMetni(o.enKotuGun.gun)} ${para(o.enKotuGun.net)}` : '–'),
    karo('Dönem', `${tarih(o.ilk)} - ${tarih(o.son)}`),
  ].join('');
  $('#ozet-not').textContent = ceviri('{s} sembol, {g} işlem günü', { s: o.sembolSayisi, g: o.gunSayisi });
  $('#egri-aralik').textContent = `${tarih(o.ilk)} - ${tarih(o.son)}`;
  egriCiz($('#bakiye-egri'), o.egri);
}

function egriCiz(c, egri) {
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth || 600, h = 190;
  c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  if (egri.length < 2) return;
  const solPay = 64, ust = 12, alt = 22, sagPay = 10;
  let lo = Infinity, hi = -Infinity;
  for (const e of egri) { if (e.bakiye < lo) lo = e.bakiye; if (e.bakiye > hi) hi = e.bakiye; }
  const bosluk = (hi - lo) * 0.08 || 1; lo -= bosluk; hi += bosluk;
  const t0 = egri[0].zaman, t1 = egri[egri.length - 1].zaman;
  const X = t => solPay + ((t - t0) / (t1 - t0 || 1)) * (w - solPay - sagPay);
  const Y = v => ust + (1 - (v - lo) / (hi - lo || 1)) * (h - ust - alt);
  // yatay ızgara ve eksen etiketleri
  x.font = '11px "IBM Plex Mono", ui-monospace, monospace'; x.textBaseline = 'middle';
  for (let k = 0; k <= 3; k++) {
    const v = lo + ((hi - lo) * k) / 3, py = Y(v);
    x.strokeStyle = 'rgba(141,156,176,.14)'; x.lineWidth = 1; x.beginPath(); x.moveTo(solPay, py); x.lineTo(w - sagPay, py); x.stroke();
    x.fillStyle = '#8a7f6a'; x.textAlign = 'right'; x.fillText(sayi(v, 0), solPay - 8, py);
  }
  // başlangıç bakiyesi kesikli çizgi
  const b0 = egri[0].bakiye;
  x.setLineDash([4, 4]); x.strokeStyle = 'rgba(217,164,65,.55)'; x.beginPath(); x.moveTo(solPay, Y(b0)); x.lineTo(w - sagPay, Y(b0)); x.stroke(); x.setLineDash([]);
  // alan ve çizgi
  const adim = Math.max(1, Math.floor(egri.length / (w * 2)));
  const nokta = egri.filter((_, i) => !(i % adim) || i === egri.length - 1).map(e => [X(e.zaman), Y(e.bakiye)]);
  const grad = x.createLinearGradient(0, ust, 0, h - alt);
  grad.addColorStop(0, 'rgba(95,184,154,.28)'); grad.addColorStop(1, 'rgba(95,184,154,0)');
  x.beginPath(); nokta.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.lineTo(nokta[nokta.length - 1][0], h - alt); x.lineTo(nokta[0][0], h - alt); x.closePath(); x.fillStyle = grad; x.fill();
  x.beginPath(); nokta.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.strokeStyle = '#4ade80'; x.lineWidth = 1.8; x.lineJoin = 'round'; x.stroke();
  // tarih etiketleri
  x.fillStyle = '#8a7f6a'; x.textBaseline = 'alphabetic';
  x.textAlign = 'left'; x.fillText(tarih(t0), solPay, h - 6);
  x.textAlign = 'right'; x.fillText(tarih(t1), w - sagPay, h - 6);
}

// ---------------------------------------------------------------- içgörüler
const BOYUT_AD = Object.fromEntries(BOYUTLAR.map(b => [b.id, b.ad]));
function icgoruKart(a) {
  const detay = [ceviri('{n} işlem', { n: sayi(a.adet, 0) }), ceviri('Kazanma oranı {w} (tüm işlemler {g})', { w: yuzde(a.kazanmaOrani), g: yuzde(a.genelKazanmaOrani) })];
  if (a.lotKati && Math.abs(a.lotKati - 1) >= 0.15) detay.push(ceviri('Ortalama boyut {k} kat', { k: sayi(a.lotKati, 2) }));
  return `<li class="ic-kart ${kacis(a.belirsiz ? 'belirsiz' : '')}">
    <div class="ic-ust"><span class="ic-boyut">${kacis(etiket(BOYUT_AD[a.boyut]))}</span>${a.belirsiz ? `<span class="ic-uyari">${kacis(ceviri('Rastlantı olabilir'))}</span>` : ''}</div>
    <div class="ic-ana"><b>${kacis(etiket(a.etiket))}</b><span class="ic-net ${kacis(sinif(a.net))}">${kacis(para(a.net, 0))}</span></div>
    <p>${detay.map(d => kacis(d)).join(' · ')}</p></li>`;
}
function icgoruCiz() {
  const ic = motor.icgoruler({ enAz: 20 });
  const liste = (el, d) => { el.innerHTML = d.length ? d.map(icgoruKart).join('') : `<li class="bos">${kacis(ceviri('Bu ölçütü geçen dilim yok.'))}</li>`; };
  liste($('#icgoru-kayip'), ic.kaybettiren);
  liste($('#icgoru-kazanc'), ic.kazandiran);
  // Az işlemli hesapta iki boş liste yerine tek açıklama.
  $('#icgoru-kayip').closest('div').parentElement.hidden = !ic.yeterliVeri;
  $('#icgoru-not').textContent = ic.yeterliVeri
    ? ceviri('Yalnız en az {n} işlemli dilimler listelenir. Dilimler örtüşür: bir işlem birden çok satırda yer alabilir. Bu bir betimlemedir, öneri değildir.', { n: ic.enAz })
    : ceviri('{t} işlemle dilimler henüz oluşmadı: bir dilim en az {n} işlemle listelenir. Daha uzun bir dönemin raporunu bırakınca burası dolar; aşağıdaki kırılımlar her grubu şimdiden gösteriyor.', { t: sayi(hesap.islemler.length, 0), n: ic.enAz });
}

// ---------------------------------------------------------------- kırılımlar
function secenekler(el, liste, sec) { el.innerHTML = liste.map(x => `<option value="${kacis(x.id)}"${x.id === sec ? ' selected' : ''}>${kacis(ceviri(x.ad))}</option>`).join(''); }
function kirilimCiz() {
  const boyut = $('#kirilim-boyut').value || 'sembol';
  const satirlar = motor.grupla(boyut);
  const enBuyuk = Math.max(1, ...satirlar.map(s => Math.abs(s.net)));
  const cubuk = v => `<span class="a-cubuk ${kacis(v < 0 ? 'neg' : 'poz')}" style="width:${kacis(Math.round((Math.abs(v) / enBuyuk) * 100))}%"></span>`;
  const bas = ['Dilim', 'İşlem', 'Net', 'Kazanma oranı', 'İşlem başı', 'Kâr faktörü', 'Ortalama lot'];
  $('#kirilim-tablo').innerHTML = `<thead><tr>${bas.map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>${satirlar.map(s => `<tr>
    <td>${kacis(etiket(s.etiket))}</td><td>${sayi(s.adet, 0)}</td><td class="a-net ${kacis(sinif(s.net))}"><span class="a-net-deger">${kacis(para(s.net))}</span>${cubuk(s.net)}</td>
    <td>${kacis(yuzde(s.kazanmaOrani))}</td><td class="${kacis(sinif(s.beklenti))}">${kacis(para(s.beklenti))}</td><td>${kacis(oran(s.karFaktoru))}</td><td>${kacis(sayi(s.ortLot, 2))}</td></tr>`).join('')}</tbody>`;
}

// ---------------------------------------------------------------- prop
const TUR_AD = { sabit: 'sabit taban', 'gun-sonu': 'gün sonu bakiye tepesini izler', 'gun-ici': 'kapanan işlemle bakiye tepesini izler' };
function propHazirla() {
  const sec = $('#prop-on-ayar');
  if (!sec.options.length) {
    sec.innerHTML = ON_AYARLAR.map(a => `<option value="${kacis(a.id)}">${kacis(a.ad)}</option>`).join('') + `<option value="ozel">${kacis(ceviri('Özel'))}</option>`;
    sec.onchange = () => { const a = ON_AYARLAR.find(x => x.id === sec.value); if (a) $('#prop-gun-saati').value = a.gunSaati; propCiz(); };
    for (const id of ['#prop-baslangic', '#prop-gunluk', '#prop-azami', '#prop-gun-saati']) $(id).onchange = propCiz;
  }
  $('#prop-baslangic').value = String(Math.round(hesap.baslangicBakiye ?? 100000));
}
function propCiz() {
  const id = $('#prop-on-ayar').value;
  const a = ON_AYARLAR.find(x => x.id === id);
  const ozel = !a;
  $('#prop-ozel-g').hidden = !ozel; $('#prop-ozel-a').hidden = !ozel;
  const kural = a ?? { ad: ceviri('Özel'), gunluk: Number($('#prop-gunluk').value), azami: Number($('#prop-azami').value), tur: 'sabit' };
  const baslangic = Number($('#prop-baslangic').value);
  const tam = propDegerlendir(motorTam.islemler, { baslangic, gunluk: kural.gunluk, azami: kural.azami, tur: kural.tur, gunSaati: $('#prop-gun-saati').value, sunucuUtcFarki: utcFark });
  const s = tam && donemGunleri(tam);
  if (!s) { sonProp = null; $('#prop-karolar').innerHTML = ''; $('#prop-tablo').innerHTML = ''; return; }
  sonProp = { ad: kural.ad, s };
  const karo = (ad, deger, c = '') => `<div><span>${kacis(ceviri(ad))}</span><b class="${kacis(c)}">${kacis(deger)}</b></div>`;
  $('#prop-karolar').innerHTML = [
    karo('Sınırı aşan gün', sayi(s.ihlalSayisi, 0), s.ihlalSayisi ? 'negatif' : 'pozitif'),
    karo('İlk aşım', s.ilkIhlal ? gunMetni(s.ilkIhlal.gun) : '–', s.ilkIhlal ? 'negatif' : ''),
    karo('Tabana en yakın gün', s.enYakin ? gunMetni(s.enYakin.gun) : '–'),
    karo('O gün tabana mesafe', s.enYakin ? `${duzPara(s.enYakin.mesafe)} (${yuzde(s.enYakin.mesafeYuzde)})` : '–', s.enYakin && s.enYakin.mesafe < 0 ? 'negatif' : s.enYakin && s.enYakin.mesafeYuzde < 0.01 ? 'uyari' : ''),
  ].join('');
  ruleGuardNote(s);
  const DURUM = { gunluk: 'Günlük sınır aşıldı', azami: 'Azami sınır aşıldı', ikisi: 'İki sınır da aşıldı' };
  const gunler = [...s.gunler].sort((x, y) => x.mesafe - y.mesafe).slice(0, 10);
  const bas = ['Gün', 'Gün başı bakiye', 'Günlük taban', 'Azami taban', 'En düşük bakiye', 'Tabana en yakın', 'Durum'];
  const taban = v => (v === -Infinity || v === null ? '–' : sayi(v, 2));
  $('#prop-tablo').innerHTML = `<thead><tr>${bas.map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>${gunler.map(g => `<tr>
    <td>${kacis(gunMetni(g.gun))}</td><td>${sayi(g.gunBasi)}</td><td>${taban(g.gunlukTaban)}</td><td>${taban(g.azamiTaban)}</td>
    <td>${sayi(g.enDusuk)}</td><td class="${kacis(g.mesafe < 0 ? 'negatif' : g.mesafeYuzde < 0.01 ? 'uyari' : '')}">${kacis(`${sayi(g.mesafe)} (${yuzde(g.mesafeYuzde)})`)}</td>
    <td>${g.ihlal ? `<span class="a-durum asildi">${kacis(ceviri(DURUM[g.ihlal]))}</span>` : g.mesafeYuzde < 0.01 ? `<span class="a-durum yakin">${kacis(ceviri('Tabana yakın'))}</span>` : `<span class="a-durum">${kacis(ceviri('Sınır içinde'))}</span>`}</td></tr>`).join('')}</tbody>`;
  $('#prop-kaynak').textContent = a
    ? ceviri('{ad}: günlük {g}, azami {z}, {tur}. Kaynak: {kaynak}, {tarih}.', { ad: a.ad, g: yuzde(a.gunluk / 100, 0), z: yuzde(a.azami / 100, 0), tur: ceviri(TUR_AD[a.tur]), kaynak: a.kaynak, tarih: gunMetni(a.tarih) }) + (a.varsayim ? ' ' + ceviri('Firma sayfası günlük sınırın hesap yöntemini yazmıyor; burada sabit taban varsayılır.') : '')
    : ceviri('Özel kural: günlük ve azami yüzdeler başlangıç sermayesine göre, sabit taban.');
}

// Prop days inside the selected period; counts recomputed from those days.
function donemGunleri(s) {
  const r = aralik();
  if (!r) return s;
  const iso = x => (Number.isFinite(x) ? new Date(x * 1000).toISOString().slice(0, 10) : null);
  const a = iso(r.from), b = iso(r.to);
  const gunler = s.gunler.filter(g => (!a || g.gun >= a) && (!b || g.gun < b));
  const ihlaller = gunler.filter(g => g.ihlal);
  return { ...s, gunler, ihlalSayisi: ihlaller.length, ilkIhlal: ihlaller[0] ?? null, enYakin: gunler.reduce((e, g) => (!e || g.mesafe < e.mesafe ? g : e), null) };
}

// Rule Guard on the visitor's own days: the add-on's default safety margin is 0.5% of the start
// (mql5/Include/Kalibre/Kalkan.mqh): room <= 2 margins pauses new trades, room <= 1 margin closes its own
// positions and locks the day. Measured here on closed balances, as in the table.
function ruleGuardNote(s) {
  const box = $('#prop-rg');
  const margin = s.baslangic * 0.005;
  const pause = s.gunler.filter(g => g.mesafe <= 2 * margin).length;
  const lock = s.gunler.filter(g => g.mesafe <= margin).length;
  const href = dil === 'tr' ? '/tr/rule-guard' : '/rule-guard';
  const text = pause
    ? ceviri('{p} gün tabana mesafe {m2} altına indi: Rule Guard burada yeni işlem açmaman için uyarır. {k} gün {m1} altına indi: Rule Guard günü kilitler; Protect modunda açık pozisyonları da kapatır.', { p: sayi(pause, 0), k: sayi(lock, 0), m2: duzPara(2 * margin, 0), m1: duzPara(margin, 0) })
    : ceviri('En yakın günün bile tabandan {d} uzakta kaldı. Rule Guard aynı tabanları MT5\'te her saniye izler.', { d: s.enYakin ? duzPara(s.enYakin.mesafe, 0) : '–' });
  box.innerHTML = `<p><b>Rule Guard</b> ${kacis(text)}</p><a class="dugme" href="${kacis(href)}">${kacis(ceviri('Rule Guard\'ı MT5 için indir'))}</a>`;
  box.hidden = false;
}

// ---------------------------------------------------------------- grafikler
const OLCU = Object.fromEntries(OLCULER.map(o => [o.id, o]));
function grafikCiz() {
  const satir = (boyut, olcuId) => motor.grupla(boyut).map(s => ({ etiket: etiket(s.etiket), deger: s[olcuId] === Infinity ? null : s[olcuId], adet: s.adet }));
  const ortak = { t: ceviri, bicim: olcuMetni, sinif, adetAd: 'İşlem' };
  const kutu = id => $(id);
  kutu('#grafik-gunluk').innerHTML = cizimHtml({ ...ortak, satirlar: satir('tarih', 'net'), olcu: OLCU.net, tur: 'sutun', boyutAd: ceviri('Kapanış günü'), W: kutu('#grafik-gunluk').clientWidth || 680 });
  kutu('#grafik-sembol-adet').innerHTML = pastaSvg(satir('sembol', 'adet').map(s => ({ etiket: s.etiket, deger: s.deger ?? 0 })), { bicim: olcuMetni, tur: 'sayi', t: ceviri, W: kutu('#grafik-sembol-adet').clientWidth || 420 });
  const ad = { kazanan: 0, kaybeden: 0, basabas: 0 };
  for (const i of motor.islemler) ad[i.net > 0 ? 'kazanan' : i.net < 0 ? 'kaybeden' : 'basabas']++;
  kutu('#grafik-kazanc').innerHTML = pastaSvg([{ etiket: ceviri('Kazanan'), deger: ad.kazanan, renk: '#4ade80' }, { etiket: ceviri('Kaybeden'), deger: ad.kaybeden, renk: '#ef4444' }, { etiket: ceviri('Başabaş'), deger: ad.basabas, renk: '#94a3b8' }], { bicim: olcuMetni, tur: 'sayi', t: ceviri, W: kutu('#grafik-kazanc').clientWidth || 420 });
  kutu('#grafik-sembol-net').innerHTML = cizimHtml({ ...ortak, satirlar: satir('sembol', 'net').sort((a, b) => (b.deger ?? 0) - (a.deger ?? 0)), olcu: OLCU.net, tur: 'cubuk', boyutAd: ceviri('Sembol'), W: kutu('#grafik-sembol-net').clientWidth || 680 });
}

// ---------------------------------------------------------------- risk ve pozisyon büyüklüğü (analiz/risk.js)
const R = (x, b = 2) => (typeof x === 'number' && Number.isFinite(x) ? `${x > 0 ? '+' : x < 0 ? '−' : ''}${sayi(Math.abs(x), b)}R` : '–');
function riskCiz() {
  const k = propKurali();
  const e = edge(motor.islemler);
  const karo = (ad, deger, c = '', alt = '') => `<div><span>${kacis(ceviri(ad))}</span><b class="${kacis(c)}">${kacis(deger)}</b>${alt ? `<small>${kacis(alt)}</small>` : ''}</div>`;
  if (!e.n) { $('#risk-karolar').innerHTML = ''; $('#risk-hukum').textContent = ceviri('R hesaplanamadı: kayıp işlem ya da stop yok.'); }
  else {
    $('#risk-karolar').innerHTML = [
      karo('İşlem başı beklenti', R(e.meanR), sinif(e.meanR), ceviri('%95 aralık {a} ile {b}', { a: R(e.ciLow), b: R(e.ciHigh) })),
      karo('SQN', e.sqn === null ? '–' : sayi(e.sqn, 2), sinif(e.sqn ?? 0), ceviri('{n} işlem; 100 üstü sayılmaz', { n: sayi(e.n, 0) })),
      karo('Kazanma oranı', yuzde(e.winRate), '', ceviri('%95 aralık {a} ile {b}', { a: yuzde(e.winLow), b: yuzde(e.winHigh) })),
      karo('1R neye göre', e.stopShare >= 0.999 ? ceviri('Stop') : e.stopShare > 0 ? ceviri('Karışık') : ceviri('Ortalama kayıp'), '', ceviri('İşlemlerin {y} kadarında stop var', { y: yuzde(e.stopShare, 0) })),
    ].join('');
    $('#risk-hukum').textContent = e.distinguishable
      ? (e.meanR > 0 ? ceviri('{n} işlemde ortalama sonuç sıfırdan ayırt edilebilir biçimde artıda: kenarın var gibi görünüyor. Büyüklük onu korumalı.', { n: sayi(e.n, 0) }) : ceviri('{n} işlemde ortalama sonuç sıfırdan ayırt edilebilir biçimde ekside: bu işlem biçimi geçmişte para kaybettirmiş. Önce büyüklüğü küçültmek kaybı sınırlar.', { n: sayi(e.n, 0) }))
      : ceviri('{n} işlemle ortalama sonuç sıfırdan ayırt edilemiyor (%95 aralık {a} ile {b}). Kenar olup olmadığını söylemek için daha çok işlem gerek; o zamana kadar riski küçük tutmak hesabı korur.', { n: sayi(e.n, 0), a: R(e.ciLow), b: R(e.ciHigh) });
  }
  const opts = { capital: k.baslangic, daily: k.gunluk, max: k.azami };
  const sonuc = POLICIES.map(p => ({ p, r: sizingReplay(motor.islemler, p, opts) }));
  const ad = p => ceviri(p.ad, { p: sayi(p.pct ?? 0, p.pct % 1 ? 1 : 0) });
  $('#risk-tablo').innerHTML = `<thead><tr>${['Büyüklük', 'Sonuç', 'Azami düşüş', 'En kötü gün', ceviri('{ad} tabanı', { ad: k.ad })].map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>${sonuc.map(({ p, r }) => `<tr class="${kacis(p.id === 'asTraded' ? 'risk-sen' : '')}">
    <td>${kacis(ad(p))}</td><td class="${kacis(sinif(r.net))}">${kacis(para(r.net))}</td><td>${kacis(`${duzPara(r.maxDrawdown, 0)} (${yuzde(r.maxDrawdownPct)})`)}</td>
    <td class="${kacis(sinif(r.worstDay))}">${kacis(para(r.worstDay, 0))}</td><td>${r.floorDay ? `<span class="a-durum asildi">${kacis(ceviri('Aşıldı {t}', { t: tarih(r.floorDay) }))}</span>` : `<span class="a-durum">${kacis(ceviri('Sınır içinde'))}</span>`}</td></tr>`).join('')}</tbody>`;
  // Bakiye yolları: her büyüklük kuralı bir çizgi.
  const kutu = $('#risk-cizim'), W = Math.max(320, (kutu.clientWidth || 680) - 6), H = 220, pad = 40;
  const tum = sonuc.flatMap(x => x.r.path);
  if (tum.length > 1) {
    // x is the trade number, not the date: quiet days do not squeeze the busy ones.
    const n = Math.max(...sonuc.map(x => x.r.path.length));
    const lo = Math.min(k.baslangic, ...tum.map(p => p.balance)), hi = Math.max(k.baslangic, ...tum.map(p => p.balance));
    const X = i => pad + (i / Math.max(1, n)) * (W - pad - 8), Y = v => 12 + (1 - (v - lo) / (hi - lo || 1)) * (H - 36);
    const renk = ['#ffa630', '#94a3b8', '#4ade80', '#60a5fa', '#f472b6'];
    const cizgi = sonuc.map(({ r }, i) => `<polyline fill="none" stroke="${kacis(renk[i])}" stroke-width="${kacis(i ? 1.6 : 2.4)}" points="${kacis([k.baslangic, ...r.path.map(p => p.balance)].map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' '))}"></polyline>`).join('');
    const lejant = sonuc.map(({ p }, i) => `<span><i style="background:${kacis(renk[i])}"></i>${kacis(ad(p))}</span>`).join('');
    kutu.innerHTML = `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(ceviri('Bakiye yolları'))}"><line x1="${kacis(pad)}" x2="${kacis(W - 8)}" y1="${kacis(Y(k.baslangic).toFixed(1))}" y2="${kacis(Y(k.baslangic).toFixed(1))}" class="g-eksen"></line>${cizgi}<text x="4" y="${kacis(Y(hi) - 2)}" class="g-deger">${kacis(sayi(hi, 0))}</text><text x="4" y="${kacis(Y(lo) + 12)}" class="g-deger">${kacis(sayi(lo, 0))}</text><text x="${kacis(W - 8)}" y="${kacis(H - 4)}" text-anchor="end" class="g-etiket">${kacis(ceviri('{n}. işlem', { n }))}</text></svg><div class="risk-lejant">${lejant}</div>`;
  } else kutu.innerHTML = '';
  $('#risk-not').textContent = ceviri('Stopu olmayan işlemlerde 1R ortalama kaybındır (Van Tharp\'ın yedek tanımı). Başlangıç sermayesi ve prop tabanı Prop firması sınırları bölümündeki ayarlardan gelir. Bu geçmişin bir senaryosudur; bir öneri değildir.');
}

// ---------------------------------------------------------------- kişisel kurallar (analiz/rules.js)
let kuralOneri = [];
const kuralAdi = (rule, value) => ceviri(RULES.find(r => r.id === rule).ad, { v: sayi(value, Number.isInteger(value) ? 0 : 1) });
const kayitliKurallar = () => { try { const d = JSON.parse(depoOku(DEPO.kural) ?? 'null'); return d && Array.isArray(d.kurallar) ? d : null; } catch { return null; } };
const medyanLot = () => { const l = motor.islemler.map(i => i.lot).sort((a, b) => a - b); return l.length ? l[l.length >> 1] : 0; };
function kuralCiz() {
  const k = propKurali();
  kuralOneri = suggestRules(motor.islemler, { capital: k.baslangic, minAffected: 2 });
  const tablo = $('#kural-tablo'), bos = $('#kural-bos');
  const az = motor.islemler.length < 50;
  $('#kural-az').hidden = !az;
  if (az) $('#kural-az').textContent = ceviri('{n} işlemle bunlar kanıt değil, ipucu: bir kural birkaç işlemin sırasına denk gelmiş olabilir. 50 işlemin üstünde daha güvenilir olur.', { n: sayi(motor.islemler.length, 0) });
  if (!kuralOneri.length) {
    tablo.innerHTML = '';
    bos.hidden = false;
    bos.textContent = ceviri('Denenen kuralların hiçbiri bu dönemde en az iki işlemi değiştirip sonucu iyileştirmedi. Daha uzun bir dönem seç ya da daha çok işlemle yeniden bak.');
  } else {
    bos.hidden = true;
    const bas = ['', 'Kural', 'Engellenen', 'Küçültülen', 'Kuralla sonuç', 'Fark', 'Son üçte birde', 'Azami düşüş', 'En kötü gün'];
    const disari = h => (!h ? `<span class="dipnot">${kacis(ceviri('az işlem'))}</span>` : h.value === null ? `<span class="dipnot">${kacis(ceviri('ilk üçte ikide işe yaramadı'))}</span>` : `<span class="${kacis(h.held ? 'pozitif' : 'negatif')}">${kacis(para(h.diff, 0))}</span><br><small class="dipnot">${kacis(h.held ? ceviri('tuttu') : ceviri('tutmadı'))}${kacis(ceviri(', {n} işlem', { n: h.trades }))}</small>`);
    const ok = (a, b) => `${duzPara(a, 0)} → ${duzPara(b, 0)}`;
    tablo.innerHTML = `<thead><tr>${bas.map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>${kuralOneri.map((r, i) => `<tr>
      <td><input type="checkbox" data-kural="${kacis(i)}" ${i < 3 ? 'checked' : ''} aria-label="${kacis(ceviri('Seç'))}"></td>
      <td>${kacis(kuralAdi(r.rule, r.value))}<br><small class="dipnot">${kacis(ceviri('{n} seçenek denendi', { n: r.tried }))}</small></td>
      <td>${kacis(sayi(r.blocked, 0))}</td><td>${kacis(sayi(r.scaled, 0))}</td>
      <td class="${kacis(sinif(r.net))}">${kacis(para(r.net))}</td><td class="pozitif">${kacis(para(r.diff))}</td><td>${disari(r.holdout)}</td>
      <td>${kacis(ok(r.maxDrawdownBefore, r.maxDrawdown))}</td><td>${kacis(`${para(r.worstDayBefore, 0)} → ${para(r.worstDay, 0)}`)}</td></tr>`).join('')}</tbody>`;
  }
  // Uyum: daha önce kaydedilen kurallar, kayıttan sonra açılan işlemlerde.
  const kay = kayitliKurallar(), uyum = $('#kural-uyum');
  if (!kay || !kay.kurallar.length) { uyum.hidden = true; return; }
  uyum.hidden = false;
  const a = adherence(motor.islemler, kay.kurallar, kay.tarih, { capital: k.baslangic });
  const sonra = a[0]?.trades ?? 0;
  $('#kural-uyum-tablo').innerHTML = `<thead><tr>${['Kural', 'Çiğnenen işlem', 'Çiğnemenin maliyeti'].map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>${a.map(x => `<tr>
    <td>${kacis(kuralAdi(x.rule, x.value))}</td><td>${kacis(sayi(x.broken, 0))}</td><td class="${kacis(x.cost > 0 ? 'negatif' : '')}">${kacis(x.broken ? duzPara(x.cost) : '–')}</td></tr>`).join('')}</tbody>`;
  $('#kural-uyum-not').textContent = ceviri('{t} tarihinde kaydedildi; sonra açılan {n} işleme bakıldı. Maliyet: kuralı çiğneyen işlemler olmasaydı sonucun ne kadar daha iyi olacağı.', { t: tarih(kay.tarih), n: sayi(sonra, 0) });
}
function seciliKurallar() { return [...document.querySelectorAll('#kural-tablo [data-kural]:checked')].map(c => kuralOneri[Number(c.dataset.kural)]).filter(Boolean).map(r => ({ rule: r.rule, value: r.value })); }

// ---------------------------------------------------------------- fiyatlı bölümler: tutsaydın, çıkışlar, maliyetler
function fiyatliCiz() { holdCiz(); cikisCiz(); maliyetCiz(); }

function cikisCiz() {
  const bos = $('#cikis-bos'), sonuc = $('#cikis-sonuc');
  if (!holdFiyat || holdFiyat.source !== 'mt5') {
    sonuc.hidden = true; bos.hidden = false;
    bos.innerHTML = `${kacis(holdFiyat ? ceviri('ECB kurlarıyla işlemin içi görünmez: MT5 fiyat dosyasını seç.') : ceviri('MT5 fiyat dosyası yüklenmedi.'))} <button type="button" class="kucuk" data-fiyat-sec>${kacis(ceviri('MT5 fiyat dosyasını seç'))}</button>`;
    bos.querySelector('[data-fiyat-sec]').onclick = () => $('#hold-dosya').click();
    return;
  }
  const rows = excursions(motor.islemler, holdFiyat), ok = rows.filter(r => r.status === 'ok');
  if (!ok.length) { sonuc.hidden = true; bos.hidden = false; bos.textContent = ceviri('Bu işlemlerin içi için fiyat yok.'); return; }
  bos.hidden = true; sonuc.hidden = false;
  const ort = f => ok.reduce((t, r) => t + f(r), 0) / ok.length;
  const kazanan = ok.filter(r => r.giveBack !== null);
  const er = eRatio(rows);
  const karo = (ad, deger, c = '', alt = '') => `<div><span>${kacis(ceviri(ad))}</span><b class="${kacis(c)}">${kacis(deger)}</b>${alt ? `<small>${kacis(alt)}</small>` : ''}</div>`;
  $('#cikis-karolar').innerHTML = [
    karo('Kenar oranı (e-ratio)', er === null ? '–' : sayi(er, 2), er !== null && er >= 1 ? 'pozitif' : 'negatif', ceviri('Ortalama MFE / ortalama MAE; 1 üstü girişin lehine')),
    karo('Ortalama en kötü an', R(ort(r => r.maeR ?? 0)), 'negatif', ceviri('MAE, ortalama {x}', { x: para(ort(r => r.mae), 0) })),
    karo('Ortalama en iyi an', R(ort(r => r.mfeR ?? 0)), 'pozitif', ceviri('MFE, ortalama {x}', { x: para(ort(r => r.mfe), 0) })),
    karo('Kazananların geri verdiği', kazanan.length ? para(-kazanan.reduce((t, r) => t + r.giveBack, 0) / kazanan.length, 0) : '–', 'negatif', ceviri('En iyi andan çıkışa, işlem başı ortalama')),
  ].join('');
  const senin = motor.islemler.reduce((t, i) => t + i.net, 0);
  const tablo = (el, kind, ks) => {
    const sat = ks.map(k => ({ k, r: exitSimulation(motor.islemler, holdFiyat, { kind, k }) }));
    $(el).innerHTML = `<thead><tr>${[kind === 'stop' ? 'Stop' : 'Hedef', 'Sonuç', 'Değişen işlem', 'Kazanma oranı'].map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>
      <tr class="risk-sen"><td>${kacis(ceviri('Senin çıkışların'))}</td><td class="${kacis(sinif(senin))}">${kacis(para(senin, 0))}</td><td>–</td><td>${kacis(yuzde(motor.islemler.filter(i => i.net > 0).length / motor.islemler.length))}</td></tr>
      ${sat.map(({ k, r }) => `<tr><td>${kacis(`${sayi(k, k % 1 ? 1 : 0)}R`)}</td><td class="${kacis(sinif(r.net))}">${kacis(para(r.net, 0))}</td><td>${kacis(sayi(r.changed, 0))}</td><td>${kacis(yuzde(r.winRate))}</td></tr>`).join('')}</tbody>`;
  };
  tablo('#cikis-stop', 'stop', [0.5, 1, 1.5, 2, 3]);
  tablo('#cikis-hedef', 'target', [0.5, 1, 2, 3]);
  const en = [...ok].sort((a, b) => a.mae - b.mae).slice(0, 10);
  $('#cikis-tablo').innerHTML = `<thead><tr>${['Sembol', 'Yön', 'Lot', 'Açılış', 'Senin sonucun', 'En kötü an (MAE)', 'En iyi an (MFE)'].map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>${en.map(r => `<tr>
    <td>${kacis(r.trade.sembol)}</td><td>${kacis(ceviri(r.trade.yon === 'al' ? 'Alış' : 'Satış'))}</td><td>${kacis(sayi(r.trade.lot, 2))}</td><td>${kacis(anMetni(r.trade.acilisZamani))}</td>
    <td class="${kacis(sinif(r.trade.net))}">${kacis(para(r.trade.net, 0))}</td><td class="negatif">${kacis(`${para(r.mae, 0)} (${R(r.maeR)})`)}</td><td class="pozitif">${kacis(`${para(r.mfe, 0)} (${R(r.mfeR)})`)}</td></tr>`).join('')}</tbody>`;
  $('#cikis-not').textContent = ceviri('{m} dakikalık mumlarla; mum içinde önce aleyhine olan fiyat sayıldı, girişi içeren mum girişten önceki fiyatları da içerebilir. 1R, Risk ve pozisyon büyüklüğü bölümündekiyle aynı. Bu geçmişin bir senaryosudur; bir öneri değildir.', { m: holdFiyat.timeframeMinutes ?? '?' });
}

function maliyetCiz() {
  const t = motor.islemler;
  const brutKazanc = t.reduce((s, i) => s + Math.max(0, i.brut), 0), brutKayip = t.reduce((s, i) => s + Math.min(0, i.brut), 0);
  const komisyon = t.reduce((s, i) => s + (i.komisyon || 0), 0), swap = t.reduce((s, i) => s + (i.swap || 0), 0);
  // Spread: today's spread from the MT5 price file, times each trade's lots (an estimate, not the spread paid).
  let spread = null;
  if (holdFiyat?.source === 'mt5') {
    spread = 0;
    for (const i of t) { const s = holdFiyat.symbols[i.sembol]; if (s?.ask > 0 && s?.bid > 0 && s.valuePerUnit > 0) spread -= (s.ask - s.bid) * s.valuePerUnit * i.lot; }
  }
  // The spread estimate is shown on its own and kept out of the totals: it is today's spread, not the one paid.
  const toplam = komisyon + swap;
  const saat = Number(String(holdFiyat?.generated ?? '').slice(11, 13));
  const devir = spread !== null && Number.isFinite(saat) && (saat >= 23 || saat <= 1);
  const gunler = new Set(t.map(i => new Date(i.acilisZamani * 1000).toISOString().slice(0, 10))).size;
  const sure = t.length ? t.reduce((s, i) => s + (i.kapanisZamani - i.acilisZamani), 0) / t.length : 0;
  const sureMetni = s => (s >= 86400 ? ceviri('{n} gün', { n: sayi(s / 86400, 1) }) : s >= 3600 ? ceviri('{n} saat', { n: sayi(s / 3600, 1) }) : ceviri('{n} dk', { n: sayi(s / 60, 0) }));
  const karo = (ad, deger, c = '', alt = '') => `<div><span>${kacis(ceviri(ad))}</span><b class="${kacis(c)}">${kacis(deger)}</b>${alt ? `<small>${kacis(alt)}</small>` : ''}</div>`;
  $('#maliyet-karolar').innerHTML = [
    karo('Komisyon', para(komisyon), sinif(komisyon)),
    karo('Swap', para(swap), sinif(swap)),
    karo('Spread (tahmin)', spread === null ? '–' : para(spread, 0), spread ? 'negatif' : '', spread === null ? ceviri('MT5 fiyat dosyasıyla') : devir ? ceviri('dosya devir saatinde yazıldı: spread geniş, tahmin şişkin') : ceviri('dosyanın yazıldığı andaki spread ile; toplama katılmadı')),
    karo('Komisyon ve swapın brüt kazanca oranı', brutKazanc > 0 ? yuzde(-toplam / brutKazanc) : '–', '', ceviri('Brüt kazanç {a}, brüt kayıp {b}', { a: duzPara(brutKazanc, 0), b: para(brutKayip, 0) })),
    karo('İşlem başı komisyon ve swap', t.length ? para(toplam / t.length) : '–', sinif(toplam)),
    karo('İşlem sıklığı', ceviri('günde {n}', { n: sayi(gunler ? t.length / gunler : 0, 1) }), '', ceviri('{g} işlem gününde {n} işlem; ortalama süre {s}', { g: gunler, n: t.length, s: sureMetni(sure) })),
  ].join('');
  $('#maliyet-not').textContent = ceviri('Komisyon ve swap raporun kendisinden; spread, fiyat dosyasındaki bugünkü alış-satış farkıyla her işlemin lotu çarpılarak tahmin edilir (gerçekte ödenen spread farklı olabilir). Barber ve Odean\'ın bulgusu: sık işlemin bedeli çoğu zaman seçimden değil maliyetten gelir.');
}

// ---------------------------------------------------------------- tutsaydın ne olurdu (analiz/hold.js)
let holdFiyat = null;   // parsePriceFile ya da ecbPrices sonucu; yalnız bellekte
function propKurali() {
  const a = ON_AYARLAR.find(x => x.id === $('#prop-on-ayar').value);
  return { ad: a?.ad ?? ceviri('Özel'), gunluk: a ? a.gunluk : Number($('#prop-gunluk').value), azami: a ? a.azami : Number($('#prop-azami').value), baslangic: Number($('#prop-baslangic').value) };
}
const anMetni = sn => { const d = new Date(sn * 1000); return `${tarih(sn)} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
function holdCiz() {
  const kutu = $('#hold-sonuc');
  if (!holdFiyat || !motor) { kutu.hidden = true; return; }
  const k = propKurali();
  const r = holdAnalysis(motor.islemler, holdFiyat, { balance: hesap.baslangicBakiye ?? k.baslangic, capital: k.baslangic, daily: k.gunluk, max: k.azami });
  const s = r.summary, a = r.account;
  if (!s.trades) { kutu.hidden = true; $('#hold-durum').textContent = ceviri('Bu işlemlerin sembolleri için fiyat yok.'); return; }
  kutu.hidden = false;
  const karo = (ad, deger, c = '', alt = '') => `<div><span>${kacis(ceviri(ad))}</span><b class="${kacis(c)}">${kacis(deger)}</b>${alt ? `<small>${kacis(alt)}</small>` : ''}</div>`;
  const ecb = r.source === 'ecb';
  $('#hold-karolar').innerHTML = [
    karo('Kapattığın gibi', para(s.actual), sinif(s.actual), ceviri('{n} işlem', { n: sayi(s.trades, 0) })),
    karo('Bugüne kadar tutulsaydı', para(s.held), sinif(s.held), ceviri('Fark {x}', { x: para(s.held - s.actual) })),
    karo(ceviri('{ad} tabanına çarpardı', { ad: k.ad }), a.ruleHit ? anMetni(a.ruleHit.at) : ceviri('Çarpmazdı'), a.ruleHit ? 'negatif' : 'pozitif', a.ruleHit ? ceviri('{n} pozisyon açıkken, varlık {v}', { n: a.ruleHit.open, v: duzPara(a.ruleHit.equity, 0) }) : ''),
    karo('Stop-out', ecb ? ceviri('Bilinmiyor') : a.stopOut ? anMetni(a.stopOut.at) : ceviri('Olmazdı'), a.stopOut ? 'negatif' : '', ecb ? ceviri('ECB kurlarında marj bilgisi yok') : a.stopOut ? ceviri('Marj seviyesi {y}', { y: `${sayi(a.stopOut.level, 0)}%` }) : (holdFiyat.account?.stopOut ? ceviri('Seviye {y}', { y: `${sayi(holdFiyat.account.stopOut, 0)}%` }) : '')),
  ].join('');
  const madde = (metin, c = '') => `<li class="${kacis(c)}">${kacis(metin)}</li>`;
  $('#hold-kovalar').innerHTML = [
    s.losers ? madde(ceviri('Kaybeden {n} işlemin {b} tanesi kapattıktan sonra başabaşa döndü, {h} tanesi hiç dönmedi.', { n: s.losers, b: s.losersBack, h: s.losersNeverBack })) : '',
    s.winners ? madde(ceviri('Kazanan {n} işlemin {m} tanesi bugün daha değerli olurdu, {l} tanesi daha az.', { n: s.winners, m: s.winnersMoreNow, l: s.winnersLessNow })) : '',
    a.ruleHit ? madde(ceviri('Hepsi birlikte açık kalsaydı hesap {t} tarihinde {ad} tabanının altına inerdi ve kural hepsini kapatırdı.', { t: anMetni(a.ruleHit.at), ad: k.ad }), 'negatif') : '',
    s.skipped ? madde(ceviri('{n} işlem fiyat olmadığı için dışarıda kaldı.', { n: s.skipped }), 'dipnot') : '',
  ].join('');
  const bas = ['Sembol', 'Yön', 'Lot', 'Açılış', 'Kapanış', 'Senin sonucun', 'Bugüne kadar tutulsaydı', 'Kapanıştan sonra en iyi', 'Kapanıştan sonra en kötü', 'Başabaşa döndü'];
  const satirlar = r.trades.filter(x => x.status === 'ok').sort((x, y) => Math.abs(y.difference) - Math.abs(x.difference));
  $('#hold-tablo').innerHTML = `<thead><tr>${bas.map(b => `<th>${kacis(ceviri(b))}</th>`).join('')}</tr></thead><tbody>${satirlar.map(x => `<tr>
    <td>${kacis(x.trade.sembol)}</td><td>${kacis(ceviri(x.trade.yon === 'al' ? 'Alış' : 'Satış'))}</td><td>${kacis(sayi(x.trade.lot, 2))}</td>
    <td>${kacis(anMetni(x.trade.acilisZamani))}</td><td>${kacis(anMetni(x.trade.kapanisZamani))}</td>
    <td class="${kacis(sinif(x.actual))}">${kacis(para(x.actual))}</td><td class="${kacis(sinif(x.held))}">${kacis(para(x.held))}</td>
    <td class="${kacis(sinif(x.best))}">${kacis(para(x.best))}</td><td class="${kacis(sinif(x.worst))}">${kacis(para(x.worst))}</td>
    <td>${kacis(x.actual >= 0 ? '–' : x.backAt ? anMetni(x.backAt) : ceviri('Hiç'))}</td></tr>`).join('')}</tbody>`;
  $('#hold-not').textContent = (ecb
    ? ceviri('Fiyatlar: ECB günlük referans kurları (günde tek fiyat, saat 16:00 civarı), yalnız döviz çiftleri; swap ve marj yok. Lot başına değer işlemlerin kendisinden hesaplandı.')
    : ceviri('Fiyatlar: MT5 fiyat dosyası, {m} dakikalık mumlar, {g}. Swap MT5\'teki oranlarla gece gece eklendi; mum içinde önce aleyhine olan fiyat sayıldı.', { m: holdFiyat.timeframeMinutes ?? '?', g: holdFiyat.generated }))
    + ' ' + ceviri('Bu geçmişin bir senaryosudur; bir öneri değildir.');
  $('#hold-durum').textContent = '';
}

// ---------------------------------------------------------------- favoriler: üste sabitlenen bölümler ve görünümler
// Sıra bu tarayıcıda saklanır: ['ozet', 'g:Benim görünümüm', ...]. Sabitlenmeyenler varsayılan sırayla altta kalır.
const KARTLAR = ['ozet', 'risk', 'grafik', 'icgoru', 'kural', 'kirilim', 'prop', 'hold', 'cikis', 'maliyet', 'gorunum'];
const sabitOku = () => { try { const d = JSON.parse(depoOku(DEPO.sabit) ?? '[]'); return Array.isArray(d) ? d.filter(x => typeof x === 'string').slice(0, 20) : []; } catch { return []; } };
const sabitYaz = d => depoYaz(DEPO.sabit, JSON.stringify(d));
function sabitDegis(id) {
  const d = sabitOku();
  const i = d.indexOf(id);
  if (i >= 0) d.splice(i, 1); else d.push(id);
  sabitYaz(d); kartlariDuzenle(); gorunum?.yenile();
}
function sabitTasi(id, yon) {
  const d = sabitOku(), i = d.indexOf(id), j = i + yon;
  if (i < 0 || j < 0 || j >= d.length) return;
  [d[i], d[j]] = [d[j], d[i]]; sabitYaz(d); kartlariDuzenle();
}
function pinDugmeleri(kart, id, sabit, ilk, son) {
  let kutu = kart.querySelector('.pin-kutu');
  if (!kutu) { kutu = document.createElement('span'); kutu.className = 'pin-kutu'; kart.querySelector('.kart-bas').append(kutu); }
  kutu.innerHTML = (sabit
    ? `<button type="button" class="kucuk" data-pin-yukari ${ilk ? 'disabled' : ''} aria-label="${kacis(ceviri('Yukarı'))}">↑</button><button type="button" class="kucuk" data-pin-asagi ${son ? 'disabled' : ''} aria-label="${kacis(ceviri('Aşağı'))}">↓</button>`
    : '') + `<button type="button" class="${kacis(sabit ? 'kucuk pin sabit' : 'kucuk pin')}" data-pin aria-pressed="${kacis(String(sabit))}">${kacis(sabit ? ceviri('Sabitlendi') : ceviri('Üste sabitle'))}</button>`;
  kutu.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-pin')) sabitDegis(id);
    if (b.hasAttribute('data-pin-yukari')) sabitTasi(id, -1);
    if (b.hasAttribute('data-pin-asagi')) sabitTasi(id, 1);
  };
}
function kartlariDuzenle() {
  if (!motor) return;
  const kok = $('#sonuclar');
  const kayitli = gorunum ? gorunum.kayitlilar() : [];
  let sabit = sabitOku().filter(id => KARTLAR.includes(id) || (id.startsWith('g:') && kayitli.some(g => g.ad === id.slice(2))));
  sabitYaz(sabit);
  // Sabitlenen görünümler kendi kartlarıyla.
  for (const el of [...kok.querySelectorAll('.pin-gorunum')]) if (!sabit.includes(el.dataset.pin)) el.remove();
  for (const id of sabit.filter(x => x.startsWith('g:'))) {
    let el = kok.querySelector(`.pin-gorunum[data-pin="${CSS.escape(id)}"]`);
    const g = kayitli.find(x => x.ad === id.slice(2));
    if (!el) {
      el = document.createElement('section');
      el.className = 'kart pin-gorunum'; el.dataset.pin = id;
      el.innerHTML = `<div class="kart-bas"><h2><span class="bolum-no"></span><span></span></h2></div><p class="dipnot pin-alt"></p><div class="g-cizim"></div>`;
      kok.prepend(el);
    }
    el.querySelector('h2 span:last-child').textContent = g.ad;
    el.querySelector('.pin-alt').textContent = `${ceviri(BOYUTLAR.find(b => b.id === g.boyut)?.ad ?? g.boyut)} · ${ceviri(OLCU[g.olcu]?.ad ?? g.olcu)}`;
    gorunum.cizTarif(el.querySelector('.g-cizim'), g);
  }
  const kartOf = id => (id.startsWith('g:') ? kok.querySelector(`.pin-gorunum[data-pin="${CSS.escape(id)}"]`) : $(`#${id}-kart`));
  const sira = [...sabit, ...KARTLAR.filter(id => !sabit.includes(id))];
  const yalniz = $('#yalniz-sabit').checked && sabit.length > 0;
  sira.forEach((id, k) => {
    const el = kartOf(id); if (!el) return;
    kok.append(el);
    const sabitMi = sabit.includes(id);
    el.classList.toggle('sabit-kart', sabitMi);
    el.hidden = yalniz && !sabitMi;
    const no = el.querySelector('.bolum-no'); if (no) no.textContent = String(k + 2).padStart(2, '0');
    pinDugmeleri(el, id, sabitMi, sabit.indexOf(id) === 0, sabit.indexOf(id) === sabit.length - 1);
  });
}

// ---------------------------------------------------------------- kendi görünümün (ortak kurucu: src/gorunum.js)
let gorunum = null;
function gorunumCiz() { gorunum?.ciz(); }

// ---------------------------------------------------------------- başlangıç
function baslat() {
  sayfayiCevir();
  const fark = $('#utc-fark');
  for (let h = -12; h <= 14; h++) fark.insertAdjacentHTML('beforeend', `<option value="${kacis(h)}"${h === utcFark ? ' selected' : ''}>UTC${h >= 0 ? '+' : '−'}${Math.abs(h)}</option>`);
  fark.onchange = () => { utcFark = Number(fark.value); depoYaz(DEPO.utc, String(utcFark)); hesapla(); };
  secenekler($('#kirilim-boyut'), BOYUTLAR, 'sembol');
  $('#kirilim-boyut').onchange = kirilimCiz;
  gorunum = gorunumKur({ kok: $('#gorunum-kart'), boyutlar: BOYUTLAR, olculer: OLCULER, uzak: sorUzak, depoAnahtari: DEPO.gorunum, t: ceviri, bicim: olcuMetni, sinif, adetAd: 'İşlem', varsayilan: { boyut: 'saat', olcu: 'net' },
    sabitle: g => sabitDegis('g:' + g.ad), sabitMi: ad => sabitOku().includes('g:' + ad),
    grupla: boyut => (motor ? motor.grupla(boyut).map(s => ({ etiket: etiket(s.etiket), degerler: s, adet: s.adet })) : []) });

  // Dönem seçici: seçim bu tarayıcıda saklanır; özel aralıkta iki tarih alanı açılır.
  const donem = $('#donem');
  donem.innerHTML = PERIODS.map(p => `<option value="${kacis(p.id)}">${kacis(ceviri(p.ad))}</option>`).join('');
  const kayitliDonem = depoOku(DEPO.donem);
  donem.value = PERIODS.some(p => p.id === kayitliDonem) ? kayitliDonem : 'all';
  const ozelGoster = () => { const o = donem.value === 'custom'; $('#donem-ozel-bas').hidden = !o; $('#donem-ozel-bit').hidden = !o; };
  ozelGoster();
  donem.onchange = () => { depoYaz(DEPO.donem, donem.value); ozelGoster(); if (donem.value === 'custom' && hesap && !$('#donem-bas').value) { const o = analizMotoru(hesap, { sunucuUtcFarki: utcFark }).ozet(); $('#donem-bas').value = new Date(o.ilk * 1000).toISOString().slice(0, 10); $('#donem-bit').value = new Date(o.son * 1000).toISOString().slice(0, 10); } hesapla(); };
  // Özel aralığın tarihleri de saklanır.
  const ozel = (() => { try { return JSON.parse(depoOku(DEPO.donem + '-ozel') ?? '{}'); } catch { return {}; } })();
  if (ozel.bas) $('#donem-bas').value = ozel.bas;
  if (ozel.bit) $('#donem-bit').value = ozel.bit;
  const ozelYaz = () => { depoYaz(DEPO.donem + '-ozel', JSON.stringify({ bas: $('#donem-bas').value, bit: $('#donem-bit').value })); hesapla(); };
  $('#donem-bas').onchange = ozelYaz; $('#donem-bit').onchange = ozelYaz;
  $('#yalniz-sabit').onchange = kartlariDuzenle;

  // Tutsaydın: MT5 fiyat dosyası ya da ECB günlük kurları. ECB isteğinde yalnız para birimleri ve tarihler gider.
  $('#hold-dosya').onchange = async () => {
    const f = $('#hold-dosya').files[0]; $('#hold-dosya').value = '';
    if (!f) return;
    try { holdFiyat = parsePriceFile(await f.text()); $('#hold-durum').textContent = ceviri('{n} sembol okundu.', { n: Object.keys(holdFiyat.symbols).length }); fiyatliCiz(); }
    catch { $('#hold-durum').textContent = ceviri('Bu bir Kalibre fiyat dosyası değil. Betiğin yazdığı kalibre-prices dosyasını seç.'); }
  };
  $('#hold-ecb').onclick = async () => {
    if (!motor) return;
    const req = ecbRequest(hesap.islemler);
    if (!req) { $('#hold-durum').textContent = ceviri('Bu işlemlerde döviz çifti yok; ECB kurları kullanılamaz.'); return; }
    $('#hold-durum').textContent = ceviri('ECB kurları alınıyor…');
    try {
      const yanit = await fetch(req.url, { headers: { Accept: 'text/csv' } });
      if (!yanit.ok) throw new Error(String(yanit.status));
      holdFiyat = ecbPrices(await yanit.text(), hesap.islemler);
      fiyatliCiz();
    } catch { $('#hold-durum').textContent = ceviri('ECB kurları alınamadı. Biraz sonra yeniden dene.'); }
  };
  for (const id of ['#prop-on-ayar', '#prop-baslangic', '#prop-gunluk', '#prop-azami']) $(id).addEventListener('change', () => { holdCiz(); kuralCiz(); riskCiz(); });

  // Kişisel kurallar: Rule Guard .set dosyası (UTF-16LE, MT5'in yazdığı biçim) ve "kurallarım" kaydı.
  $('#kural-indir').onclick = () => {
    const secili = seciliKurallar();
    if (!secili.length) { $('#kural-durum').textContent = ceviri('Önce en az bir kural seç.'); return; }
    const k = propKurali(), on = $('#prop-on-ayar').value;
    const metin = ruleGuardSet(secili, { preset: GUARD_PRESET[on] ?? 5, capital: k.baslangic, medianLot: medyanLot(), customDaily: k.gunluk, customMax: k.azami });
    const bayt = new Uint8Array(2 + metin.length * 2); bayt[0] = 0xff; bayt[1] = 0xfe;
    for (let i = 0; i < metin.length; i++) { const c = metin.charCodeAt(i); bayt[2 + 2 * i] = c & 0xff; bayt[3 + 2 * i] = c >> 8; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bayt], { type: 'application/octet-stream' })); a.download = 'KalibreRuleGuard-rules.set';
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    $('#kural-durum').textContent = ceviri('İndirildi. Rule Guard ayar penceresinde Load ile yükle.');
  };
  $('#kural-kaydet').onclick = () => {
    const secili = seciliKurallar();
    if (!secili.length) { $('#kural-durum').textContent = ceviri('Önce en az bir kural seç.'); return; }
    // Uyum, son kapanan işlemden sonraki işlemlerle ölçülür: bugünden ileriye.
    const son = motor.islemler.reduce((m, i) => Math.max(m, i.kapanisZamani), 0);
    depoYaz(DEPO.kural, JSON.stringify({ kurallar: secili, tarih: son + 1 }));
    $('#kural-durum').textContent = ceviri('Kaydedildi. Bir sonraki dosyanda bu kurallara uyumu göreceksin.');
    kuralCiz();
  };

  const girdi = $('#dosya');
  girdi.onchange = () => { dosyaOku(girdi.files[0]); girdi.value = ''; };
  const birak = $('#birak');
  birak.addEventListener('dragover', e => { e.preventDefault(); birak.classList.add('uzerinde'); });
  birak.addEventListener('dragleave', () => birak.classList.remove('uzerinde'));
  birak.addEventListener('drop', e => { e.preventDefault(); birak.classList.remove('uzerinde'); dosyaOku(e.dataTransfer.files[0]); });

  $('#ornek-yukle').onclick = () => yukle(ornekHesap());
  $('#rapor-sayfa').onclick = openReportPage;
  $('#ornek-kapat').onclick = () => { $('#yukle-kart').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#dosya').click(); };
  if (ORNEK_DOSYALAR.includes(sampleFileParam())) ornekDosyaAc(sampleFileParam());
  else if (urlParam('sample') === '1') yukle(ornekHesap());
  const kod = depoOku(DEPO.kod);
  if (kod) {
    const d = $('#kopru-yukle'); d.hidden = false;
    d.onclick = async () => {
      durum(ceviri('Kalibre Bridge verisi alınıyor…'));
      try {
        const ist = istemci(kod, roleAdresi(location.search, depoOku(DEPO.role) ?? ''));
        const h = await ist.islemler();
        if (!h) { durum(ceviri('Bridge henüz işlem geçmişi göndermedi. Eklentinin MT5\'te çalıştığını kontrol et.'), true); return; }
        yukle(koprudenHesap(h));
      } catch { durum(ceviri('Bridge verisi alınamadı. Bağlantıyı Pano sayfasında kontrol et.'), true); }
    };
  }

  window.addEventListener('resize', () => { if (motor) { egriCiz($('#bakiye-egri'), motor.ozet().egri); gorunumCiz(); grafikCiz(); kartlariDuzenle(); } });
}

baslat();
