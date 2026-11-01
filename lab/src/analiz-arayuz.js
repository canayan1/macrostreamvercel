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
import { gorunumKur } from './gorunum.js';
import { istemci, roleAdresi } from './veri/baglanti.js';

const $ = s => document.querySelector(s);
const EN_BUYUK_DOSYA = 50 * 1024 * 1024;
const DEPO = { utc: 'kalibre-analiz-utc', gorunum: 'kalibre-analiz-gorunumler', kod: 'kalibre-kopru-kod', role: 'kalibre-kopru-role' };
const depoOku = k => { try { return localStorage.getItem(k); } catch { return null; } };
const depoYaz = (k, v) => { try { localStorage.setItem(k, v); } catch { /* depo yok */ } };

let hesap = null, motor = null;
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
  for (const id of ['#ozet-kart', '#icgoru-kart', '#kirilim-kart', '#prop-kart', '#gorunum-kart']) $(id).hidden = true;
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

function hesapla() {
  if (!hesap) return;
  motor = analizMotoru(hesap, { sunucuUtcFarki: utcFark });
  for (const id of ['#ozet-kart', '#icgoru-kart', '#kirilim-kart', '#prop-kart', '#gorunum-kart']) $(id).hidden = false;
  ozetCiz(); icgoruCiz(); kirilimCiz(); propHazirla(); propCiz(); gorunumCiz();
}

// The report page: the model is handed over through localStorage and opened in a new tab (#local).
let sonProp = null; // { ad, s } from the last propCiz
function openReportPage() {
  if (!motor) return;
  const model = accountReportModel({ hesap, motor, lang: dil === 'tr' ? 'tr' : 'en', source: $('#kaynak-rozet').textContent, utcFark, prop: sonProp });
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
  const s = propDegerlendir(motor.islemler, { baslangic, gunluk: kural.gunluk, azami: kural.azami, tur: kural.tur, gunSaati: $('#prop-gun-saati').value, sunucuUtcFarki: utcFark });
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

// Rule Guard on the visitor's own days: the add-on's default safety margin is 0.5% of the start
// (mql5/Include/Kalibre/Kalkan.mqh): room <= 2 margins pauses new trades, room <= 1 margin closes its own
// positions and locks the day. Measured here on closed balances, as in the table.
function ruleGuardNote(s) {
  const box = $('#prop-rg');
  const margin = s.baslangic * 0.005;
  const pause = s.gunler.filter(g => g.mesafe <= 2 * margin).length;
  const lock = s.gunler.filter(g => g.mesafe <= margin).length;
  const href = dil === 'tr' ? '/tr/rule-guard#pricing' : '/rule-guard#pricing';
  const text = pause
    ? ceviri('{p} gün tabana mesafe {m2} altına indi: Rule Guard burada yeni işlemi bekletir. {k} gün {m1} altına indi: Rule Guard açtığı pozisyonları kapatır ve günü kilitler.', { p: sayi(pause, 0), k: sayi(lock, 0), m2: duzPara(2 * margin, 0), m1: duzPara(margin, 0) })
    : ceviri('En yakın günün bile tabandan {d} uzakta kaldı. Rule Guard aynı tabanları MT5\'te her tick\'te izler.', { d: s.enYakin ? duzPara(s.enYakin.mesafe, 0) : '–' });
  box.innerHTML = `<p><b>Rule Guard</b> ${kacis(text)}</p><a class="dugme" href="${kacis(href)}">${kacis(ceviri('Rule Guard erken erişim'))}</a>`;
  box.hidden = false;
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
  gorunum = gorunumKur({ kok: $('#gorunum-kart'), boyutlar: BOYUTLAR, olculer: OLCULER, depoAnahtari: DEPO.gorunum, t: ceviri, bicim: olcuMetni, sinif, adetAd: 'İşlem', varsayilan: { boyut: 'saat', olcu: 'net' },
    grupla: boyut => (motor ? motor.grupla(boyut).map(s => ({ etiket: etiket(s.etiket), degerler: s, adet: s.adet })) : []) });

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

  window.addEventListener('resize', () => { if (motor) { egriCiz($('#bakiye-egri'), motor.ozet().egri); gorunumCiz(); } });
}

baslat();
