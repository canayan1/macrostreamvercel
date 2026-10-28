// İşlem Analizi sayfası (lab/analiz.html). Dosya ve işlemler tarayıcıda kalır; sunucuya hiçbir
// şey gönderilmez. Hesaplar saf modüllerde: analiz/{model,mt5-rapor,csv-ice,hesap,prop,ornek}.js.

import './dil-analiz.js';
import { t as ceviri, yerel, sayfayiCevir } from './dil.js';
import { kacis } from './guvenlik.js';
import { raporuOku, baytlariMetneCevir } from './analiz/mt5-rapor.js';
import { csvdenHesap, CSV_ALANLARI } from './analiz/csv-ice.js';
import { koprudenHesap } from './analiz/model.js';
import { analizMotoru, BOYUTLAR, OLCULER } from './analiz/hesap.js';
import { propDegerlendir, ON_AYARLAR } from './analiz/prop.js';
import { ornekHesap } from './analiz/ornek.js';
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
const tarih = sn => { if (!sn) return '–'; const d = new Date(sn * 1000); return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`; };
const gunMetni = g => { const [y, a, gg] = g.split('-'); return `${gg}.${a}.${y}`; };
const olcuMetni = (tur, x) => (tur === 'para' ? para(x) : tur === 'yuzde' ? yuzde(x) : tur === 'sayi' ? sayi(x, 0) : oran(x));
const etiket = s => ceviri(s);

// ---------------------------------------------------------------- yükleme
function durum(metin, hata = false) { const e = $('#yukle-durum'); e.textContent = metin; e.classList.toggle('negatif', hata); }

async function dosyaOku(dosya) {
  if (!dosya) return;
  if (dosya.size > EN_BUYUK_DOSYA) { durum(ceviri('Dosya çok büyük (en çok 50 MB).'), true); return; }
  durum(ceviri('Okunuyor…'));
  try {
    const bayt = new Uint8Array(await dosya.arrayBuffer());
    let h = await raporuOku(dosya.name, bayt);
    if (!h) {
      const r = csvdenHesap(baytlariMetneCevir(bayt));
      if (!r.hesap) { csvEslesmeGoster(baytlariMetneCevir(bayt), r); durum(ceviri('CSV sütunları tanınamadı. Aşağıdan eşleştir.'), true); return; }
      h = r.hesap;
    }
    yukle(h);
  } catch {
    durum(ceviri('Dosya okunamadı. MT5 raporunu HTML olarak kaydedip yeniden dene.'), true);
  }
}

function csvEslesmeGoster(metin, r) {
  const kutu = $('#csv-eslesme');
  const ADLAR = { acilisZamani: 'Açılış zamanı', kapanisZamani: 'Kapanış zamanı', sembol: 'Sembol', yon: 'Yön', lot: 'Lot', acilisFiyati: 'Açılış fiyatı', kapanisFiyati: 'Kapanış fiyatı', sl: 'S/L', tp: 'T/P', komisyon: 'Komisyon', swap: 'Swap', kar: 'Kâr (brüt)', net: 'Net kâr' };
  const secenek = (sec) => `<option value="-1">${kacis(ceviri('Yok'))}</option>` + r.basliklar.map((b, i) => `<option value="${kacis(i)}"${sec === i ? ' selected' : ''}>${kacis(b || `#${i + 1}`)}</option>`).join('');
  kutu.innerHTML = `<div class="csv-izgara">${CSV_ALANLARI.map(a => `<label class="secici"><span>${kacis(ceviri(ADLAR[a]))}</span><select data-alan="${kacis(a)}">${secenek(r.eslesme[a])}</select></label>`).join('')}</div>
    <button type="button" class="kucuk" id="csv-uygula">${kacis(ceviri('Eşleşmeyi uygula'))}</button>`;
  kutu.hidden = false;
  $('#csv-uygula').onclick = () => {
    const e = {};
    for (const s of kutu.querySelectorAll('select[data-alan]')) e[s.dataset.alan] = Number(s.value);
    const r2 = csvdenHesap(metin, e);
    if (!r2.hesap) { durum(ceviri('Eksik zorunlu sütun: {liste}.', { liste: r2.eksik.map(k => ceviri(ADLAR[k] ?? k)).join(', ') }), true); return; }
    kutu.hidden = true;
    yukle(r2.hesap);
  };
}

const KAYNAK_ADI = { 'mt5-html': 'MT5 raporu (HTML)', 'mt5-xlsx': 'MT5 raporu (XLSX)', kopru: 'Kalibre Bridge', csv: 'CSV', ornek: 'SENTETİK örnek' };

function yukle(h) {
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
  durum(ceviri('{n} kapanmış işlem okundu.', { n: h.islemler.length.toLocaleString(yerel) }) + (h.atlanan ? ' ' + ceviri('{n} satır okunamadı ve atlandı.', { n: h.atlanan }) : ''));
  hesapla();
}

function hesapla() {
  if (!hesap) return;
  motor = analizMotoru(hesap, { sunucuUtcFarki: utcFark });
  for (const id of ['#ozet-kart', '#icgoru-kart', '#kirilim-kart', '#prop-kart', '#gorunum-kart']) $(id).hidden = false;
  ozetCiz(); icgoruCiz(); kirilimCiz(); propHazirla(); propCiz(); gorunumCiz();
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
    x.fillStyle = '#8d9cb0'; x.textAlign = 'right'; x.fillText(sayi(v, 0), solPay - 8, py);
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
  x.strokeStyle = '#5fb89a'; x.lineWidth = 1.8; x.lineJoin = 'round'; x.stroke();
  // tarih etiketleri
  x.fillStyle = '#8d9cb0'; x.textBaseline = 'alphabetic';
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
  $('#icgoru-not').textContent = ic.yeterliVeri
    ? ceviri('Yalnız en az {n} işlemli dilimler listelenir. Dilimler örtüşür: bir işlem birden çok satırda yer alabilir. Bu bir betimlemedir, öneri değildir.', { n: ic.enAz })
    : ceviri('Dilimleri göstermek için en az {n} işlem gerekir.', { n: ic.enAz });
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
  if (!s) { $('#prop-karolar').innerHTML = ''; $('#prop-tablo').innerHTML = ''; return; }
  const karo = (ad, deger, c = '') => `<div><span>${kacis(ceviri(ad))}</span><b class="${kacis(c)}">${kacis(deger)}</b></div>`;
  $('#prop-karolar').innerHTML = [
    karo('Sınırı aşan gün', sayi(s.ihlalSayisi, 0), s.ihlalSayisi ? 'negatif' : 'pozitif'),
    karo('İlk aşım', s.ilkIhlal ? gunMetni(s.ilkIhlal.gun) : '–', s.ilkIhlal ? 'negatif' : ''),
    karo('Tabana en yakın gün', s.enYakin ? gunMetni(s.enYakin.gun) : '–'),
    karo('O gün tabana mesafe', s.enYakin ? `${duzPara(s.enYakin.mesafe)} (${yuzde(s.enYakin.mesafeYuzde)})` : '–', s.enYakin && s.enYakin.mesafe < 0 ? 'negatif' : s.enYakin && s.enYakin.mesafeYuzde < 0.01 ? 'uyari' : ''),
  ].join('');
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

// ---------------------------------------------------------------- kendi görünümün
const BOYUT_IDLERI = new Set(BOYUTLAR.map(b => b.id));
const OLCU_IDLERI = new Set(OLCULER.map(o => o.id));
const TUR_IDLERI = new Set(['cubuk', 'cizgi', 'tablo']);
function gorunumler() {
  try { const d = JSON.parse(depoOku(DEPO.gorunum) ?? '[]'); return Array.isArray(d) ? d.filter(g => g && typeof g.ad === 'string' && BOYUT_IDLERI.has(g.boyut) && OLCU_IDLERI.has(g.olcu) && TUR_IDLERI.has(g.tur)).slice(0, 30) : []; } catch { return []; }
}
function gorunumCiz() {
  const boyut = $('#g-boyut').value, olcuId = $('#g-olcu').value, tur = $('#g-tur').value;
  const olcu = OLCULER.find(o => o.id === olcuId);
  const satirlar = motor.grupla(boyut).map(s => ({ etiket: etiket(s.etiket), deger: s[olcuId] === Infinity ? null : s[olcuId], adet: s.adet }));
  const kutu = $('#g-cizim');
  if (tur === 'tablo' || !satirlar.length) {
    kutu.innerHTML = `<div class="tablo-kutu"><table class="pozisyon"><thead><tr><th>${kacis(ceviri(BOYUT_AD[boyut]))}</th><th>${kacis(ceviri(olcu.ad))}</th><th>${kacis(ceviri('İşlem'))}</th></tr></thead><tbody>${satirlar.map(s => `<tr><td>${kacis(s.etiket)}</td><td class="${kacis(olcu.tur === 'para' ? sinif(s.deger) : '')}">${kacis(olcuMetni(olcu.tur, s.deger))}</td><td>${sayi(s.adet, 0)}</td></tr>`).join('')}</tbody></table></div>`;
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
    kutu.innerHTML = `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(ceviri(olcu.ad))}">${satirlar.map((s, i) => {
      const v = s.deger ?? 0, y = 4 + i * yuk, x1 = Math.min(X(v), sifir), x2 = Math.max(X(v), sifir);
      return `<text x="${kacis(solEtiket - 6)}" y="${kacis(y + 14)}" text-anchor="end" class="g-etiket">${kacis(s.etiket.length > (dar ? 16 : 26) ? s.etiket.slice(0, dar ? 15 : 25) + '…' : s.etiket)}</text>
        <rect x="${kacis(x1)}" y="${kacis(y + 3)}" width="${kacis(Math.max(1, x2 - x1))}" height="${kacis(yuk - 8)}" class="${kacis(olcu.tur === 'para' ? (v < 0 ? 'g-neg' : 'g-poz') : 'g-not')}"></rect>
        <text x="${kacis(x2 + 4)}" y="${kacis(y + 14)}" class="g-deger">${kacis(olcuMetni(olcu.tur, s.deger))}</text>`;
    }).join('')}<line x1="${kacis(sifir)}" x2="${kacis(sifir)}" y1="0" y2="${kacis(H)}" class="g-eksen"></line></svg>`;
  } else {
    const H = 240, pad = 34;
    const Xi = i => pad + (i / Math.max(1, satirlar.length - 1)) * (W - 2 * pad);
    const Y = v => H - pad - ((v - enAz) / (enCok - enAz || 1)) * (H - 2 * pad);
    const nokta = satirlar.map((s, i) => `${Xi(i)},${Y(s.deger ?? 0)}`).join(' ');
    const etiketAdim = Math.max(1, Math.ceil(satirlar.length / (dar ? 4 : 8)));
    kutu.innerHTML = `<svg viewBox="0 0 ${kacis(W)} ${kacis(H)}" width="${kacis(W)}" height="${kacis(H)}" class="g-svg" role="img" aria-label="${kacis(ceviri(olcu.ad))}">
      <line x1="${kacis(pad)}" x2="${kacis(W - pad)}" y1="${kacis(Y(0))}" y2="${kacis(Y(0))}" class="g-eksen"></line>
      <polyline points="${kacis(nokta)}" class="g-cizgi"></polyline>
      ${satirlar.map((s, i) => `<circle cx="${kacis(Xi(i))}" cy="${kacis(Y(s.deger ?? 0))}" r="3" class="${kacis(olcu.tur === 'para' && (s.deger ?? 0) < 0 ? 'g-neg' : 'g-poz')}"><title>${kacis(`${s.etiket}: ${olcuMetni(olcu.tur, s.deger)}`)}</title></circle>`).join('')}
      ${satirlar.map((s, i) => (i % etiketAdim ? '' : `<text x="${kacis(Xi(i))}" y="${kacis(H - 8)}" text-anchor="middle" class="g-etiket">${kacis(s.etiket.slice(0, 12))}</text>`)).join('')}
      <text x="${kacis(pad)}" y="14" class="g-deger">${kacis(olcuMetni(olcu.tur, enCok))}</text>
    </svg>`;
  }
}
function kayitliCiz() {
  const d = gorunumler();
  $('#g-kayitli').innerHTML = d.map((g, i) => `<li><button type="button" class="kucuk" data-ac="${kacis(i)}">${kacis(g.ad)}</button> <span class="dipnot">${kacis(ceviri(BOYUT_AD[g.boyut]))} · ${kacis(ceviri(OLCULER.find(o => o.id === g.olcu).ad))}</span> <button type="button" class="kucuk sil" data-sil="${kacis(i)}" aria-label="${kacis(ceviri('Sil'))}">×</button></li>`).join('');
}

// ---------------------------------------------------------------- başlangıç
function baslat() {
  sayfayiCevir();
  const fark = $('#utc-fark');
  for (let h = -12; h <= 14; h++) fark.insertAdjacentHTML('beforeend', `<option value="${kacis(h)}"${h === utcFark ? ' selected' : ''}>UTC${h >= 0 ? '+' : '−'}${Math.abs(h)}</option>`);
  fark.onchange = () => { utcFark = Number(fark.value); depoYaz(DEPO.utc, String(utcFark)); hesapla(); };
  secenekler($('#kirilim-boyut'), BOYUTLAR, 'sembol');
  secenekler($('#g-boyut'), BOYUTLAR, 'saat');
  secenekler($('#g-olcu'), OLCULER, 'net');
  $('#kirilim-boyut').onchange = kirilimCiz;
  for (const id of ['#g-boyut', '#g-olcu', '#g-tur']) $(id).onchange = gorunumCiz;

  const girdi = $('#dosya');
  girdi.onchange = () => { dosyaOku(girdi.files[0]); girdi.value = ''; };
  const birak = $('#birak');
  birak.addEventListener('dragover', e => { e.preventDefault(); birak.classList.add('uzerinde'); });
  birak.addEventListener('dragleave', () => birak.classList.remove('uzerinde'));
  birak.addEventListener('drop', e => { e.preventDefault(); birak.classList.remove('uzerinde'); dosyaOku(e.dataTransfer.files[0]); });

  $('#ornek-yukle').onclick = () => yukle(ornekHesap());
  $('#ornek-kapat').onclick = () => { $('#yukle-kart').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#dosya').click(); };
  if (new URLSearchParams(location.search).get('ornek') === '1') yukle(ornekHesap());
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

  $('#g-kaydet').onsubmit = e => {
    e.preventDefault();
    const ad = $('#g-ad').value.trim().slice(0, 60);
    if (!ad) { $('#g-durum').textContent = ceviri('Bir ad yaz.'); return; }
    const d = gorunumler().filter(g => g.ad !== ad);
    d.unshift({ ad, boyut: $('#g-boyut').value, olcu: $('#g-olcu').value, tur: $('#g-tur').value });
    depoYaz(DEPO.gorunum, JSON.stringify(d.slice(0, 30)));
    $('#g-ad').value = ''; $('#g-durum').textContent = ceviri('Kaydedildi.');
    kayitliCiz();
  };
  $('#g-kayitli').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = gorunumler();
    if (b.dataset.ac !== undefined) { const g = d[Number(b.dataset.ac)]; if (!g) return; $('#g-boyut').value = g.boyut; $('#g-olcu').value = g.olcu; $('#g-tur').value = g.tur; if (motor) gorunumCiz(); }
    if (b.dataset.sil !== undefined) { d.splice(Number(b.dataset.sil), 1); depoYaz(DEPO.gorunum, JSON.stringify(d)); kayitliCiz(); }
  };
  kayitliCiz();
  window.addEventListener('resize', () => { if (motor) { egriCiz($('#bakiye-egri'), motor.ozet().egri); gorunumCiz(); } });
}

baslat();
