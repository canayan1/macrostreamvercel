// FX Blotter Analizi sayfası (lab/blotter.html). Dosya ve hesaplar tarayıcıda kalır; ağ isteği yok.
// Hesaplar saf modüllerde: blotter/{model,tespit,ice-aktar,kz,degerleme,kur,analiz,mutabakat,ornek}.js.

import { urlParam, sampleFileParam } from '../url-params.js';
import '../dil-blotter.js';
import { t as ceviri, yerel, sayfayiCevir, dil } from '../dil.js';
import { kacis } from '../guvenlik.js';
import { dosyadanSatirlar, iceAktar, GEREKCE_SINIF } from './ice-aktar.js';
import { SOZLUK, ZORUNLU_ALANLAR } from './tespit.js';
import { blotterAnaliz, grupla, BOYUTLAR, KOVALAR, limitleriCoz, FIRSAT_MALIYETI_ONAYLI } from './analiz.js';
import { mutabakat } from './mutabakat.js';
import { kurTablosuCoz, tasimaGirdiCoz, lastTradedRates } from './kur.js';
import { ornekBlotter, ORNEK_KURLAR, ORNEK_FAIZ_METNI, ORNEK_LIMITLER, ORNEK_LIMITLER_EN, ORNEK_DOSYALAR } from './ornek.js';
import { rastgeleTuz } from './model.js';
import { TUR_AD, DEGER_AD, LIMIT_AD, LIMIT_DURUM, GEREKCE_AD, UYARI_AD } from './etiketler.js';
import { deskReport } from './desk-report.js';
import { startTour } from '../tour.js';

const $ = s => document.querySelector(s);
const EN_BUYUK_DOSYA = 50 * 1024 * 1024;
const DEPO = { kur: 'kalibre-blotter-kur', tasima: 'kalibre-blotter-tasima', limit: 'kalibre-blotter-limit', yerel: 'kalibre-blotter-yerel', saat: 'kalibre-blotter-saat' };
const depoOku = k => { try { return localStorage.getItem(k); } catch { return null; } };
const depoYaz = (k, v) => { try { localStorage.setItem(k, v); } catch { /* depo yok */ } };
const TUZ = rastgeleTuz();
// First line of a rate table filled from the dropped file; a later file replaces such a table, never one the desk typed.
const RATES_FROM_FILE = '# last traded rate per pair in the file';

let satirlar = null, aktarim = null, analiz = null, eslesmeElle = {}, sentetik = false, detayAnahtar = null, kaynakDosya = '', ratesFromFile = false;

// ---------------------------------------------------------------- biçim
const sayi = (x, b = 0) => (typeof x === 'number' && Number.isFinite(x) ? x.toLocaleString(yerel, { minimumFractionDigits: b, maximumFractionDigits: b }) : '–');
const isaretli = (x, b = 0) => (typeof x === 'number' && Number.isFinite(x) ? `${x > 0 ? '+' : x < 0 ? '−' : ''}${sayi(Math.abs(x), b)}` : '–');
const usd = (x, b = 0) => (x === null || x === undefined ? '–' : `${isaretli(x, b)} USD`);
const sinif = x => (x > 0.004 ? 'pozitif' : x < -0.004 ? 'negatif' : '');
const tarihMetni = g => { if (!g) return '–'; const [y, a, d] = g.split('-'); return dil === 'en' ? g : `${d}.${a}.${y}`; };
const kurMetni = x => (typeof x === 'number' && Number.isFinite(x) ? x.toLocaleString(yerel, { minimumFractionDigits: 4, maximumFractionDigits: 6 }) : '–');
const zamanMetni = (sn, tz) => { if (sn === null || sn === undefined) return '–'; const d = new Date((sn + tz * 3600) * 1000); return d.toISOString().slice(11, 19); };

// ---------------------------------------------------------------- yükleme
function durum(metin, hata = false) { const e = $('#yukle-durum'); e.textContent = metin; e.classList.toggle('negatif', hata); }
const saatDilimi = () => Number($('#saat-dilimi').value) || 0;

async function dosyaOku(dosya) {
  if (!dosya) return;
  if (dosya.size > EN_BUYUK_DOSYA) { durum(ceviri('Dosya çok büyük (en çok 50 MB).'), true); return; }
  durum(ceviri('Okunuyor…'));
  try {
    const r = await dosyadanSatirlar(dosya.name, new Uint8Array(await dosya.arrayBuffer()));
    sentetikAyarla(false);
    yeniSatirlar(r.satirlar, `${dosya.name}${r.sayfa ? ' · ' + r.sayfa : ''} · ${r.kodlama}`);
    // Results first: bring the summary into view, or the column matching when a required field is missing.
    const target = analiz && !aktarim.eksik.length ? '#ozet-kart' : '#eslesme-kart';
    setTimeout(() => $(target)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  } catch (h) {
    durum(ceviri(h?.message === 'xls' ? 'Eski Excel (.xls) okunamıyor. Dosyayı XLSX ya da CSV olarak kaydedip yeniden dene.' : 'Dosya okunamadı. XLSX ya da CSV olarak kaydedip yeniden dene.'), true);
  }
}

function sentetikAyarla(acik) {
  sentetik = acik;
  $('#sentetik-bant').hidden = !acik;
  $('#ust-sentetik').hidden = !acik;
}

// satirlarDis: yayımlanmış örnek dosyadan okunan satırlar (yoksa üretici, sayfa diline göre TR ya da EN başlıklı).
function ornekYukle(satirlarDis = null, kaynakAdi = null) {
  const o = ornekBlotter(undefined, { dil: dil === 'en' ? 'en' : 'tr' });
  sentetikAyarla(true);
  $('#saat-dilimi').value = String(o.saatDilimi);
  $('#kur-tablo').value = ORNEK_KURLAR;
  $('#tasima-tablo').value = ORNEK_FAIZ_METNI;
  $('#limit-tablo').value = dil === 'en' ? ORNEK_LIMITLER_EN : ORNEK_LIMITLER;
  $('#yerel-doviz').value = 'TRY';
  $('#analiz-gunu').value = o.tarih;
  yeniSatirlar(satirlarDis ?? o.satirlar, kaynakAdi ?? ceviri('Örnek blotter'), { tarih: o.tarih });
}

// ?file=samples/…: yayımlanmış örnek dosyayı sunucudan alır ve bir kullanıcının bırakacağı gibi okur.
async function ornekDosyaAc(yol) {
  if (!ORNEK_DOSYALAR.includes(yol)) return false;
  durum(ceviri('Okunuyor…'));
  try {
    const y = await fetch(yol);
    if (!y.ok) throw new Error(String(y.status));
    const r = await dosyadanSatirlar(yol, new Uint8Array(await y.arrayBuffer()));
    ornekYukle(r.satirlar, `${yol.split('/').pop()}${r.sayfa ? ' · ' + r.sayfa : ''} · ${r.kodlama}`);
  } catch {
    durum(ceviri('Dosya okunamadı. XLSX ya da CSV olarak kaydedip yeniden dene.'), true);
  }
  return true;
}

function yeniSatirlar(s, kaynakAdi, { tarih } = {}) {
  satirlar = s;
  kaynakDosya = String(kaynakAdi).split(' · ')[0];
  eslesmeElle = {};
  $('#kaynak-rozet').hidden = false;
  $('#kaynak-rozet').textContent = kaynakAdi;
  $('#bos-durum').hidden = true;
  aktar();
  ratesFromFile = false;
  const current = $('#kur-tablo').value.trim();
  if (aktarim && !aktarim.eksik.length && !sentetik && (!current || current.startsWith(RATES_FROM_FILE))) {
    const rates = lastTradedRates(aktarim.bacaklar);
    if (rates.length) {
      $('#kur-tablo').value = [RATES_FROM_FILE, ...rates.map(r => `${r.pair} ${r.rate}`)].join('\n');
      ratesFromFile = true;
    }
  }
  if (aktarim && !aktarim.eksik.length) {
    if (!$('#analiz-gunu').value || !tarih) $('#analiz-gunu').value = tarih ?? aktarim.bacaklar.reduce((m, b) => (b.islemTarihi > m ? b.islemTarihi : m), '');
    hesapla();
  }
}

function aktar() {
  aktarim = iceAktar(satirlar, { tuz: TUZ, bakis: $('#bakis').value, saatDilimi: saatDilimi(), eslesme: Object.keys(eslesmeElle).length ? eslesmeElle : undefined });
  eslesmeGoster();
  const o = aktarim.ozet ?? {};
  if (aktarim.tespit.baslikIndex < 0) { durum(ceviri('Başlık satırı bulunamadı. İlk 30 satırda sütun adları olmalı (ör. İşlem Tarihi, Valör, Parite, Tutar, Kur).'), true); return; }
  if (aktarim.eksik.length) { durum(ceviri('Zorunlu alanlar eşleşmedi. Aşağıdan seç.'), true); return; }
  durum(ceviri('{a} bacak aktarıldı, {d} satır dışlandı, {h} satır okunamadı.', { a: sayi(o.aktarilan), d: sayi(o.dislanan), h: sayi(o.hatali) }), o.hatali > 0);
}

// ---------------------------------------------------------------- eşleştirme ekranı
const ALAN_AD = {
  kaynakId: 'İşlem no', refId: 'İlgili işlem (iptal)', durum: 'Durum', urun: 'Ürün', islemTarihi: 'İşlem tarihi', islemZamani: 'İşlem saati', valor: 'Valör',
  tenor: 'Vade kodu', parite: 'Parite', yon: 'Yön', dealtDoviz: 'İşlem dövizi', tutar: 'Tutar', karsiDoviz: 'Karşı döviz', karsiTutar: 'Karşı tutar',
  alisDoviz: 'Alınan döviz', alisTutar: 'Alınan tutar', satisDoviz: 'Satılan döviz', satisTutar: 'Satılan tutar', kur: 'Kur (all-in)', spotKur: 'Spot kur', puan: 'Puan',
  maliyetKur: 'Maliyet kuru', tlKarsiligi: 'TL karşılığı', baglantiId: 'Swap bağlantısı', bacakRol: 'Bacak (yakın/uzak)', karsiTaraf: 'Karşı taraf (okunmaz)', lei: 'LEI',
  portfoy: 'Portföy', trader: 'Trader', fixingTarihi: 'Fixing tarihi', fixingKaynagi: 'Fixing kaynağı', fixingKur: 'Fixing kuru', odemeDovizi: 'Ödeme dövizi',
  karsiTarafTipi: 'Karşı taraf tipi', opsiyonIz: 'Opsiyon alanı (dışlama için)',
};
// Column matching and settings fold away once the file is read cleanly, so results come first.
function fold(card, folded) {
  const k = $(card), b = k.querySelector('.katla');
  k.classList.toggle('katli', folded);
  b.setAttribute('aria-expanded', String(!folded));
  b.textContent = ceviri(folded ? 'Göster' : 'Gizle');
}

function eslesmeGoster() {
  const k = $('#eslesme-kart');
  k.hidden = false;
  const clean = !aktarim.eksik.length && Object.values(aktarim.tespit.guven).every(g => g >= 0.6);
  if (!k.dataset.elle) fold('#eslesme-kart', clean);
  const t = aktarim.tespit, e = aktarim.eslesme;
  const basliklar = t.basliklar.length ? t.basliklar : (satirlar[0] ?? []).map((_, i) => `#${i + 1}`);
  const secenek = sec => `<option value="-1">${kacis(ceviri('(yok)'))}</option>` + basliklar.map((b, i) => `<option value="${kacis(i)}"${sec === i ? ' selected' : ''}>${kacis(`${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''} · ${b || '–'}`)}</option>`).join('');
  const zorunlu = new Set(aktarim.eksik.length ? aktarim.eksik : []);
  const satir = alan => {
    const j = e[alan];
    const g = t.guven[alan];
    const elle = alan in eslesmeElle;
    const durumSinif = zorunlu.has(alan) ? 'b-eksik' : j !== undefined && !elle && g < 0.6 ? 'b-dusuk' : '';
    const guven = elle ? ceviri('elle') : j === undefined ? '–' : `${Math.round(g * 100)}%`;
    return `<tr class="${kacis(durumSinif)}"><td>${kacis(ceviri(ALAN_AD[alan] ?? alan))}${ZORUNLU_ALANLAR.includes(alan) ? ' *' : ''}</td><td><select data-alan="${kacis(alan)}">${secenek(j)}</select></td><td class="sayi">${kacis(guven)}</td></tr>`;
  };
  const alanlar = Object.keys(SOZLUK).filter(a => a in e || zorunlu.has(a) || ['islemTarihi', 'valor', 'parite', 'yon', 'tutar', 'kur', 'portfoy', 'trader', 'maliyetKur', 'tlKarsiligi', 'spotKur'].includes(a));
  $('#eslesme-tablo').innerHTML = `<thead><tr><th>${kacis(ceviri('Alan'))}</th><th>${kacis(ceviri('Sütun'))}</th><th class="sayi">${kacis(ceviri('Güven'))}</th></tr></thead><tbody>${alanlar.map(satir).join('')}</tbody>`;
  const oz = aktarim.ozet;
  $('#eslesme-ozet').textContent = t.baslikIndex >= 0 ? ceviri('Başlık satırı: {n} · puan ölçeği {p}', { n: satirlar[t.baslikIndex]?.no ?? t.baslikIndex + 1, p: aktarim.puanOlcek ?? 1 }) : '';
  $('#eslesme-onay').disabled = aktarim.eksik.length > 0;
  $('#eslesme-durum').textContent = aktarim.eksik.length ? ceviri('Eksik zorunlu alan: {a}', { a: aktarim.eksik.map(a => ceviri(ALAN_AD[a] ?? a)).join(', ') }) : oz ? ceviri('{a} bacak', { a: sayi(oz.aktarilan) }) : '';
  for (const s of document.querySelectorAll('#eslesme-tablo select')) s.addEventListener('change', () => {
    const v = Number(s.value);
    eslesmeElle = { ...aktarim.eslesme, ...eslesmeElle, [s.dataset.alan]: v < 0 ? -1 : v };
    for (const [a, i] of Object.entries(eslesmeElle)) if (a !== s.dataset.alan && i === v && v >= 0) eslesmeElle[a] = -1; // bir sütun tek alana
    aktar();
  });
}

// ---------------------------------------------------------------- hesap
function girdiler() {
  const kur = kurTablosuCoz($('#kur-tablo').value);
  const tas = tasimaGirdiCoz($('#tasima-tablo').value);
  const lim = limitleriCoz($('#limit-tablo').value);
  depoYaz(DEPO.kur, $('#kur-tablo').value); depoYaz(DEPO.tasima, $('#tasima-tablo').value); depoYaz(DEPO.limit, $('#limit-tablo').value);
  depoYaz(DEPO.yerel, $('#yerel-doviz').value);
  const hata = [];
  if (kur.hatalar.length) hata.push(ceviri('Kur tablosunda okunamayan satır: {s}', { s: kur.hatalar.join(', ') }));
  if (tas.hatalar.length) hata.push(ceviri('Taşıma tablosunda okunamayan satır: {s}', { s: tas.hatalar.join(', ') }));
  if (lim.hatalar.length) hata.push(ceviri('Limit tablosunda okunamayan satır: {s}', { s: lim.hatalar.join(', ') }));
  $('#girdi-durum').textContent = hata.join(' ');
  $('#girdi-durum').classList.toggle('negatif', hata.length > 0);
  return {
    yontem: $('#yontem').value, traderBazli: $('#kapsam').value === 'trader', tarih: $('#analiz-gunu').value || undefined,
    kurTablosu: kur.tablo, faiz: tas.faiz, tnPuan: tas.tnPuan, limitler: lim.limitler, yerelDoviz: $('#yerel-doviz').value || null,
    marjYuzde: Number($('#marj-yuzde').value) || 0, gosterimSaatDilimi: saatDilimi(),
  };
}

function hesapla() {
  if (!aktarim || aktarim.eksik.length || !aktarim.bacaklar.length) return;
  const ayar = girdiler();
  analiz = blotterAnaliz(aktarim.bacaklar, ayar);
  analiz.mutabakat = mutabakat(aktarim, analiz, aktarim.bacaklar, ayar);
  analiz.ayar = ayar;
  for (const id of ['girdi-kart', 'ozet-kart', 'mutabakat-kart', 'kz-kart', 'pozisyon-kart', 'merdiven-kart', 'swap-kart', 'marj-kart', 'atlanan-kart']) $('#' + id).hidden = false;
  if (!$('#girdi-kart').dataset.elle) fold('#girdi-kart', true);
  const rateCount = Object.keys(ayar.kurTablosu ?? {}).length, limitCount = (ayar.limitler ?? []).length;
  $('#girdi-ozet').textContent = ceviri('{y} · {k} kur · {l} limit', { y: ceviri(ayar.yontem === 'fifo' ? 'FIFO' : 'Ortalama maliyet'), k: rateCount, l: limitCount });
  ozetGoster(); mutabakatGoster(); kzGoster(); pozisyonGoster(); merdivenGoster(); swapGoster(); marjGoster(); atlananGoster();
  if (detayAnahtar) detayKapat();
}

// ---------------------------------------------------------------- desk report download
// The same workbook as the published sample result (blotter/desk-report.js), built from what is on screen.
function downloadReport() {
  if (!analiz) return;
  const a = analiz.ayar;
  const rates = Object.entries(a.kurTablosu ?? {}).map(([k, v]) => `${k} ${v}`).join(', ') || '–';
  const overnight = Object.entries(a.faiz ?? {}).map(([k, v]) => `${k} ${v}`).join(', ') || '–';
  const { bytes } = deskReport({
    aktarim, an: analiz, mut: analiz.mutabakat, lang: dil === 'tr' ? 'tr' : 'en', source: kaynakDosya, example: sentetik,
    localCcy: a.yerelDoviz, method: a.yontem, inputs: ceviri('Anlık kurlar: {k}. Gecelik faiz (yıllık %): {f}. Limitler Limitler sayfasında.', { k: rates, f: overnight }),
  });
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `fx-desk-report-${analiz.tarih}.xlsx` });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------- guided tour (?tour=1 or the button on the example banner)
const TOUR = [
  ['#yukle-kart', 'Masanın kendi dökümü', 'Dosya olduğu gibi bırakıldı: rapor başlığı, toplam satırı, yerel biçimler. Tarayıcıda okunur, hiçbir yere yüklenmez.'],
  ['#eslesme-kart', 'Sütunlar kendiliğinden eşleşir', 'Her alan için bulunan sütun ve güven puanı. Yanlışsa listeden düzeltilir.', () => fold('#eslesme-kart', false)],
  ['#ozet-kart', "Haftanın K/Z'si, parçalarına ayrılmış", 'Toplam K/Z fiyat, vadeli puan, taşıma ve MTM olarak ayrılır; yerel para karşılığıyla.'],
  ['#mutabakat-kart', 'Her toplam dosyaya bağlanır', 'Yedi kontrol: satır sayıları, alt toplamlar, tutar çarpı kur, nominaller, TL karşılığı, açık lotlar ve iki maliyet yöntemi.'],
  ['#kz-kart', 'İstediğin gibi grupla', 'Parite, portföy, dealer, kalem türü, büyüklük, saat ya da güne göre.'],
  ['#detay-kart', "Bir rakama tıkla, deal'ler açılır", 'Her satır, arkasındaki işlem satırlarını dosyadaki satır numarasıyla gösterir.', () => { if ($('#detay-kart').hidden) $('#kz-tablo tbody tr')?.click(); }],
  ['#pozisyon-kart', 'Pozisyon ve limitler', 'Döviz bazında net pozisyon, masanın kendi limitlerinin yanında.'],
  ['#merdiven-kart', 'Valöre göre nakit akışı', 'Bugünden bir yılın ötesine, döviz bazında bir merdiven.'],
  ['#rapor-indir', 'Yanında götür', 'Bütün analiz grafikli bir Excel masa raporu olarak iner.'],
];
async function tour() {
  if (!analiz) { if (!(await ornekDosyaAc(dil === 'tr' ? 'samples/fx-blotter-ornek.xlsx' : 'samples/fx-blotter-sample.xlsx'))) ornekYukle(); }
  startTour(TOUR.map(([target, title, text, before]) => ({ target, title: ceviri(title), text: ceviri(text), before })),
    { labels: { next: ceviri('Sonraki adım'), back: ceviri('Önceki adım'), done: ceviri('Turu bitir'), close: ceviri('Turu kapat'), of: dil === 'tr' ? '/' : 'of' } });
}

// ---------------------------------------------------------------- özet
function karo(ad, deger, alt = '', s = '') { return `<div class="${kacis(s)}"><span>${kacis(ad)}</span><b>${kacis(deger)}</b>${alt ? `<small>${kacis(alt)}</small>` : ''}</div>`; }
function ozetGoster() {
  const t = analiz.toplam, c = analiz.cevir;
  const yerelT = c.yerel(t.toplam);
  $('#ozet-ana').innerHTML = [
    karo(ceviri('Toplam K/Z'), usd(t.toplam), yerelT === null ? '' : `${isaretli(yerelT)} ${c.yerelDoviz}`, sinif(t.toplam)),
    karo(ceviri('Fiyat K/Z'), usd(t.fiyat + t.ayrimYok), t.ayrimYok ? ceviri('{x} puandan ayrılamadı', { x: usd(t.ayrimYok) }) : ceviri('spot farkından'), sinif(t.fiyat + t.ayrimYok)),
    karo(ceviri('Puan ve swap'), usd(t.puan), ceviri('vadeli puanı ve roll'), sinif(t.puan)),
    karo(ceviri('Müşteri marjı'), usd(analiz.marjOzet.usd), ceviri('{n} kalem', { n: sayi(analiz.marjOzet.kalem.length) }), sinif(analiz.marjOzet.usd)),
  ].join('');
  $('#ozet-karolar').innerHTML = [
    karo(ceviri('Taşıma (gecelik)'), usd(t.tasima), '', sinif(t.tasima)),
    karo(ceviri('MTM (açık pozisyon)'), usd(t.mtm), ceviri('spot bazlı, iskontosuz'), sinif(t.mtm)),
    karo(ceviri('Gerçekleşen, valörü geçmiş'), usd(analiz.katkilar.filter(k => ['gerceklesen', 'swap', 'ndf'].includes(k.tur) && k.taninmis).reduce((s, k) => s + (k.usd.toplam ?? 0), 0))),
    karo(ceviri('Kilitli, valörü gelmemiş'), usd(analiz.katkilar.filter(k => ['gerceklesen', 'swap', 'ndf'].includes(k.tur) && !k.taninmis).reduce((s, k) => s + (k.usd.toplam ?? 0), 0))),
    karo(ceviri('Net açık pozisyon (kısa yol)'), `${sayi(analiz.pozisyon.kisaYol)} USD`),
    karo(ceviri('Bacak'), sayi(aktarim.bacaklar.length), ceviri('analiz günü {g}', { g: tarihMetni(analiz.tarih) })),
  ].join('');
  $('#ozet-not').textContent = ceviri('{y} · {k}', { y: ceviri(analiz.kz.yontem === 'fifo' ? 'FIFO' : 'Ortalama maliyet'), k: ceviri(analiz.kz.traderBazli ? 'Portföy × trader × parite' : 'Portföy × parite') });
  const eksik = analiz.eksikKur;
  $('#ozet-eksik').textContent = eksik.length ? ceviri('Eksik girdi (bu kalemler toplama katılmadı): {e}', { e: eksik.map(eksikMetni).join('; ') }) : '';
  $('#ozet-eksik').classList.toggle('negatif', eksik.length > 0);
  $('#ozet-kurlar').hidden = !ratesFromFile;
}

function eksikMetni(x) {
  const [tur, a, b] = x.split(':');
  if (tur === 'mtm') return ceviri(b === 'spot-kur-yok' ? 'MTM {p}: işlemin spot kuru yok (yalnız all-in kur)' : 'MTM {p}: kur tablosunda kur yok', { p: a });
  if (tur === 'tasima') return ceviri('taşıma {p}: faiz ya da T/N puanı yok', { p: a });
  return ceviri('{d} için USD kuru yok', { d: a });
}

// ---------------------------------------------------------------- mutabakat
const KONTROL_AD = {
  satir: 'Satır sayıları tutuyor', 'alt-toplam': 'Alt toplamlar genel toplama eşit (tüm gruplamalar)', aritmetik: 'Her bacakta karşı tutar = tutar × kur',
  nominal: 'Döviz bazında bacak nominalleri', tl: 'Blotter TL karşılığı ile hesaplanan', lot: 'Açık lotlar bacak pozisyonuna eşit', yontem: 'FIFO ve ortalama maliyet: gerçekleşen + MTM aynı',
};
function mutabakatGoster() {
  const k = analiz.mutabakat;
  const hatali = k.filter(x => x.tamam === false).length, bos = k.filter(x => x.tamam === null).length;
  $('#mutabakat-ozet').textContent = hatali ? ceviri('{n} kontrol başarısız', { n: hatali }) : ceviri('Tüm kontroller geçti') + (bos ? ' · ' + ceviri('{n} kontrol edilemedi', { n: bos }) : '');
  $('#mutabakat-ozet').classList.toggle('negatif', hatali > 0);
  $('#mutabakat-liste').innerHTML = k.map(x => {
    const sembol = x.tamam === true ? '✓' : x.tamam === false ? '✗' : '–';
    const s = x.tamam === true ? 'tamam' : x.tamam === false ? 'hata' : 'bos';
    return `<li class="${kacis(s)}"><span class="b-isaret">${sembol}</span><b>${kacis(ceviri(KONTROL_AD[x.id] ?? x.ad))}</b><span class="dipnot">${kacis(kontrolDetay(x))}</span></li>`;
  }).join('');
}
function kontrolDetay(x) {
  const d = x.detay;
  if (x.id === 'satir') return ceviri('okunan {o} = başlık öncesi {b} + başlık 1 + boş {bo} + toplam {t} + aktarılan {a} + dışlanan {d} + okunamayan {h}', { o: d.okunanSatir, b: d.baslikOncesi, bo: d.bosSatir, t: d.toplamSatiri, a: d.aktarilan, d: d.dislanan, h: d.hatali });
  if (x.id === 'alt-toplam') return d.fark.length ? ceviri('farklı gruplama: {g}', { g: d.fark.map(f => f.boyut).join(', ') }) : ceviri('{n} gruplama kontrol edildi', { n: d.boyut });
  if (x.id === 'aritmetik') return d.hatali.length ? ceviri('satır {s}', { s: d.hatali.join(', ') }) : '';
  if (x.id === 'nominal') return Object.entries(d).map(([c, v]) => `${c} ${ceviri('alış')} ${sayi(v.alis)} / ${ceviri('satış')} ${sayi(v.satis)}`).join(' · ');
  if (x.id === 'tl') return x.tamam === null ? ceviri('blotter\'da TL karşılığı sütunu yok') : ceviri('{u} uyan ({y} kurla yaklaşık), {f} farklı, {k} kontrol edilemedi', { u: d.uyan, y: d.yaklasik, f: d.farkli.length, k: d.kontrolEdilemedi }) + (d.farkli.length ? ' · ' + ceviri('satır {s}', { s: d.farkli.slice(0, 10).map(f => f.satirNo).join(', ') }) : '');
  if (x.id === 'lot') return d.fark.length ? ceviri('farklı anahtar: {n}', { n: d.fark.length }) : ceviri('{n} anahtar', { n: d.anahtar });
  if (x.id === 'yontem') return d.eksikKur ? ceviri('tüm açık pariteler için kur gerekli') : '';
  return '';
}

// ---------------------------------------------------------------- K/Z tablosu ve tek tık ayrıntı
const degerAd = v => ceviri(DEGER_AD[v] ?? v);
let sonGruplar = [];
function kzGoster() {
  const boyut = $('#kz-boyut').value || 'parite';
  sonGruplar = grupla(analiz.katkilar, boyut);
  const t = analiz.toplam;
  const hucre = x => `<td class="sayi ${kacis(sinif(x))}">${isaretli(x)}</td>`;
  const firsat = `<td class="sayi b-pasif" title="${kacis(ceviri('Tanım onay bekliyor'))}">${FIRSAT_MALIYETI_ONAYLI ? '' : '–'}</td>`;
  const bas = `<thead><tr><th>${kacis(ceviri(BOYUTLAR.find(b => b.id === boyut)?.ad ?? boyut))}</th><th class="sayi">${kacis(ceviri('Kalem'))}</th><th class="sayi">${kacis(ceviri('Fiyat'))}</th><th class="sayi">${kacis(ceviri('Puan/swap'))}</th><th class="sayi">${kacis(ceviri('Ayrılamayan'))}</th><th class="sayi">${kacis(ceviri('Taşıma'))}</th><th class="sayi">${kacis(ceviri('MTM'))}</th><th class="sayi">${kacis(ceviri('Toplam (USD)'))}</th><th class="sayi b-pasif">${kacis(ceviri('Fırsat maliyeti'))}</th></tr></thead>`;
  const govde = sonGruplar.map((g, i) => `<tr class="b-tik" data-grup="${kacis(i)}" tabindex="0"><td>${kacis(degerAd(g.ad))}</td><td class="sayi">${sayi(g.adet)}</td>${hucre(g.fiyat)}${hucre(g.puan)}${hucre(g.ayrimYok)}${hucre(g.tasima)}${hucre(g.mtm)}<td class="sayi ${kacis(sinif(g.toplam))}"><b>${isaretli(g.toplam)}</b></td>${firsat}</tr>`).join('');
  const ayak = `<tfoot><tr class="b-tik" data-grup="toplam" tabindex="0"><td><b>${kacis(ceviri('Toplam'))}</b></td><td class="sayi">${sayi(t.adet)}</td>${hucre(t.fiyat)}${hucre(t.puan)}${hucre(t.ayrimYok)}${hucre(t.tasima)}${hucre(t.mtm)}<td class="sayi ${kacis(sinif(t.toplam))}"><b>${isaretli(t.toplam)}</b></td>${firsat}</tr></tfoot>`;
  $('#kz-tablo').innerHTML = bas + `<tbody>${govde}</tbody>` + ayak;
}
function tiklaAc(e) {
  const tr = e.target.closest('.b-tik');
  if (!tr) return;
  const g = tr.dataset.grup;
  if (g === 'toplam') detayGoster(ceviri('Toplam'), analiz.toplam.bacakIdler);
  else if (g !== undefined) { const x = sonGruplar[Number(g)]; detayGoster(degerAd(x.ad), x.bacakIdler); }
  else if (tr.dataset.idler) detayGoster(tr.dataset.baslik ?? '', new Set(tr.dataset.idler.split(',').map(Number)));
}
function detayGoster(baslik, idler) {
  const set = idler instanceof Set ? idler : new Set(idler);
  const liste = aktarim.bacaklar.filter(b => set.has(b.id));
  detayAnahtar = baslik;
  $('#detay-kart').hidden = false;
  $('#detay-baslik').textContent = ceviri('İşlem satırları: {b} ({n})', { b: baslik, n: liste.length });
  const tz = saatDilimi();
  $('#detay-tablo').innerHTML = `<thead><tr>${['Satır', 'İşlem tarihi', 'Saat', 'Ürün', 'Parite', 'Yön', 'Tutar (base)', 'Kur', 'Spot', 'Valör', 'Portföy', 'Trader', 'Karşı taraf tipi'].map((h, i) => `<th${[0, 6, 7, 8].includes(i) ? ' class="sayi"' : ''}>${kacis(ceviri(h))}</th>`).join('')}</tr></thead><tbody>${liste.slice(0, 2000).map(b => `<tr><td class="sayi">${b.satirNo}</td><td>${tarihMetni(b.islemTarihi)}</td><td>${zamanMetni(b.islemZamani, tz)}</td><td>${kacis(degerAd(b.urun))}${b.roll ? ` <span class="rozet mini">${kacis(ceviri('roll'))}</span>` : ''}</td><td>${kacis(b.parite)}</td><td>${kacis(ceviri(b.yon === 'al' ? 'Alış' : 'Satış'))}</td><td class="sayi ${kacis(sinif(b.baseTutar))}">${isaretli(b.baseTutar, 2)}</td><td class="sayi">${kurMetni(b.kur)}</td><td class="sayi">${kurMetni(b.spotKur)}</td><td>${tarihMetni(b.valor)}</td><td>${kacis(b.portfoy)}</td><td>${kacis(b.trader)}</td><td>${kacis(degerAd(b.karsiTarafTipi))}</td></tr>`).join('')}</tbody>${liste.length > 2000 ? `<tfoot><tr><td colspan="13">${kacis(ceviri('İlk 2.000 satır gösteriliyor.'))}</td></tr></tfoot>` : ''}`;
  $('#detay-kart').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
function detayKapat() { $('#detay-kart').hidden = true; detayAnahtar = null; }

// ---------------------------------------------------------------- pozisyon ve limitler
function pozisyonGoster() {
  const p = analiz.pozisyon;
  $('#pozisyon-ozet').textContent = ceviri('Uzun {u} USD · kısa {k} USD · kısa yol {s} USD', { u: sayi(p.uzun), k: sayi(p.kisa), s: sayi(p.kisaYol) });
  $('#pozisyon-tablo').innerHTML = `<thead><tr><th>${kacis(ceviri('Döviz'))}</th><th class="sayi">${kacis(ceviri('Net pozisyon'))}</th><th class="sayi">${kacis(ceviri('USD karşılığı'))}</th><th class="sayi">${kacis(ceviri('Bacak'))}</th></tr></thead><tbody>${p.satirlar.filter(s => Math.abs(s.tutar) >= 0.005).map(s => `<tr class="b-tik" tabindex="0" data-idler="${kacis([...new Set(s.bacakIdler)].join(','))}" data-baslik="${kacis(s.doviz)}"><td>${kacis(s.doviz)}</td><td class="sayi ${kacis(sinif(s.tutar))}">${isaretli(s.tutar)}</td><td class="sayi ${kacis(sinif(s.usd ?? 0))}">${s.usd === null ? kacis(ceviri('kur yok')) : isaretli(s.usd)}</td><td class="sayi">${sayi(new Set(s.bacakIdler).size)}</td></tr>`).join('')}</tbody>`;
  const L = analiz.limitler;
  $('#limit-sonuc').innerHTML = L.length ? `<thead><tr><th>${kacis(ceviri('Limit (senin tanımın)'))}</th><th class="sayi">${kacis(ceviri('Limit USD'))}</th><th class="sayi">${kacis(ceviri('Kullanım USD'))}</th><th class="sayi">${kacis(ceviri('Oran'))}</th><th>${kacis(ceviri('Durum'))}</th></tr></thead><tbody>${L.map(l => `<tr><td>${kacis(ceviri(LIMIT_AD[l.tur], { d: l.doviz ?? '', a: l.ad || ceviri('masa'), k: l.kova ? ceviri(l.kova) : '' }))}</td><td class="sayi">${sayi(l.usd)}</td><td class="sayi">${l.kullanim === null ? '–' : sayi(l.kullanim)}</td><td class="sayi">${l.oran === null ? '–' : sayi(l.oran * 100, 1) + '%'}</td><td><span class="a-durum ${kacis(l.durum === 'asildi' ? 'asildi' : l.durum === 'yakin' ? 'yakin' : '')}">${kacis(ceviri(LIMIT_DURUM[l.durum]))}</span></td></tr>`).join('')}</tbody>` : `<tbody><tr><td class="dipnot">${kacis(ceviri('Limit girilmedi. Analiz ayarlarındaki limit tablosuna yazabilirsin.'))}</td></tr></tbody>`;
}

// ---------------------------------------------------------------- valör merdiveni
function merdivenGoster() {
  const m = analiz.merdiven.slice().sort((a, b) => (a.ndf - b.ndf) || a.doviz.localeCompare(b.doviz));
  const enBuyuk = Math.max(1, ...m.flatMap(s => KOVALAR.map(k => Math.abs(s.kovalar[k].tutar * (s.usdKur ?? 0)))));
  $('#merdiven-tablo').innerHTML = `<thead><tr><th>${kacis(ceviri('Döviz'))}</th>${KOVALAR.map(k => `<th class="sayi">${kacis(ceviri(k))}</th>`).join('')}</tr></thead><tbody>${m.map(s => `<tr><td>${kacis(s.ndf ? `${s.doviz} (NDF)` : s.doviz)}</td>${KOVALAR.map(k => {
    const c = s.kovalar[k];
    if (!c.bacakIdler.length) return '<td class="sayi b-bos">·</td>';
    const yog = s.usdKur ? Math.min(1, Math.abs(c.tutar * s.usdKur) / enBuyuk) : 0;
    return `<td class="sayi b-tik b-isi ${kacis(sinif(c.tutar))}" tabindex="0" style="--yog:${kacis(yog.toFixed(3))}" data-idler="${kacis([...new Set(c.bacakIdler)].join(','))}" data-baslik="${kacis(`${s.doviz} · ${ceviri(k)}`)}">${isaretli(c.tutar)}</td>`;
  }).join('')}</tr>`).join('')}</tbody>`;
}

// ---------------------------------------------------------------- swap, marj, atlanan
function swapGoster() {
  const l = analiz.kz.swaplar;
  $('#swap-tablo').innerHTML = l.length ? `<thead><tr>${['Parite', 'Base tutar (yakın)', 'Yakın valör', 'Uzak valör', 'Yakın kur', 'Uzak kur', 'Puan', 'Puan K/Z', 'USD karşılığı'].map((h, i) => `<th${[1, 4, 5, 6, 7, 8].includes(i) ? ' class="sayi"' : ''}>${kacis(ceviri(h))}</th>`).join('')}</tr></thead><tbody>${l.map(s => `<tr class="b-tik" tabindex="0" data-idler="${kacis(s.bacakIdler.join(','))}" data-baslik="${kacis(`${s.parite} swap`)}"><td>${kacis(s.parite)}</td><td class="sayi">${isaretli(s.miktar)}</td><td>${tarihMetni(s.yakinValor)}</td><td>${tarihMetni(s.uzakValor)}</td><td class="sayi">${kurMetni(s.yakinKur)}</td><td class="sayi">${kurMetni(s.uzakKur)}</td><td class="sayi">${kurMetni(s.puanFark)}</td><td class="sayi ${kacis(sinif(s.kote_puan))}">${isaretli(s.kote_puan)} ${kacis(s.kote)}</td><td class="sayi ${kacis(sinif(s.kote_puan))}">${usd(analiz.cevir.usd(s.kote_puan, s.kote))}</td></tr>`).join('')}</tbody>` : `<tbody><tr><td class="dipnot">${kacis(ceviri('Blotter\'da dengeli swap yok.'))}</td></tr></tbody>`;
}
function marjGoster() {
  const m = analiz.marjOzet;
  $('#marj-ozet').textContent = ceviri('Toplam {x}', { x: usd(m.usd) }) + (m.eksik ? ' · ' + ceviri('{n} kalem için kur yok', { n: m.eksik }) : '');
  const kaynak = k => ceviri(k.tur === 'maliyet' ? 'maliyet sütunu' : k.tur === 'yuzde' ? 'varsayılan yüzde' : 'back-to-back eşleşme');
  $('#marj-tablo').innerHTML = m.kalem.length ? `<thead><tr>${['Satır', 'Parite', 'Yön', 'Tutar (base)', 'Kur', 'Kaynak', 'bps', 'Marj', 'USD karşılığı'].map((h, i) => `<th${[0, 3, 4, 6, 7, 8].includes(i) ? ' class="sayi"' : ''}>${kacis(ceviri(h))}</th>`).join('')}</tr></thead><tbody>${m.kalem.slice(0, 500).map(k => `<tr class="b-tik" tabindex="0" data-idler="${kacis(k.bacakIdler.join(','))}" data-baslik="${kacis(ceviri('Marj · satır {s}', { s: k.bacak.satirNo }))}"><td class="sayi">${k.bacak.satirNo}</td><td>${kacis(k.bacak.parite)}</td><td>${kacis(ceviri(k.bacak.yon === 'al' ? 'Alış' : 'Satış'))}</td><td class="sayi">${isaretli(k.bacak.baseTutar)}</td><td class="sayi">${kurMetni(k.bacak.kur)}</td><td>${kacis(kaynak(k))}</td><td class="sayi">${sayi(k.bps, 2)}</td><td class="sayi ${kacis(sinif(k.kote_marj))}">${isaretli(k.kote_marj)} ${kacis(k.bacak.kote)}</td><td class="sayi">${usd(k.usd_marj)}</td></tr>`).join('')}</tbody>` : `<tbody><tr><td class="dipnot">${kacis(ceviri('Maliyet sütunu, müşteri işaretli satır ya da back-to-back eşleşme bulunamadı.'))}</td></tr></tbody>`;
}
function atlananGoster() {
  const a = aktarim.atlanan.filter(x => x.gerekce !== 'baslik-oncesi');
  const u = aktarim.uyarilar;
  $('#atlanan-ozet').textContent = ceviri('{d} dışlanan, {h} okunamayan, {u} uyarı', { d: aktarim.ozet.dislanan, h: aktarim.ozet.hatali, u: u.length });
  const satirlarHtml = [
    ...a.map(x => `<tr class="${kacis(GEREKCE_SINIF[x.gerekce] === 'hata' ? 'b-eksik' : '')}"><td class="sayi">${x.satirNo}</td><td>${kacis(ceviri(GEREKCE_SINIF[x.gerekce] === 'hata' ? 'Okunamadı' : GEREKCE_SINIF[x.gerekce] === 'toplam' ? 'Atlandı' : 'Dışlandı'))}</td><td>${kacis(ceviri(GEREKCE_AD[x.gerekce] ?? x.gerekce))}</td></tr>`),
    ...u.map(x => `<tr class="b-dusuk"><td class="sayi">${x.satirNo ?? '–'}</td><td>${kacis(ceviri('Uyarı'))}</td><td>${kacis(ceviri(UYARI_AD[x.kod] ?? x.kod))}</td></tr>`),
  ];
  $('#atlanan-tablo').innerHTML = satirlarHtml.length ? `<thead><tr><th class="sayi">${kacis(ceviri('Satır'))}</th><th>${kacis(ceviri('Sonuç'))}</th><th>${kacis(ceviri('Gerekçe'))}</th></tr></thead><tbody>${satirlarHtml.join('')}</tbody>` : `<tbody><tr><td class="dipnot">${kacis(ceviri('Atlanan satır yok.'))}</td></tr></tbody>`;
}

// ---------------------------------------------------------------- başlat
function baslat() {
  sayfayiCevir();
  const sd = $('#saat-dilimi');
  const kayitli = Number(depoOku(DEPO.saat) ?? 0);
  for (let h = -12; h <= 14; h++) sd.insertAdjacentHTML('beforeend', `<option value="${kacis(h)}"${h === kayitli ? ' selected' : ''}>UTC${h >= 0 ? '+' : '−'}${Math.abs(h)}</option>`);
  const yd = $('#yerel-doviz');
  for (const d of ['TRY', 'EUR', 'GBP', 'CHF', 'JPY', 'USD']) yd.insertAdjacentHTML('beforeend', `<option value="${kacis(d)}">${d}</option>`);
  yd.value = depoOku(DEPO.yerel) ?? 'TRY';
  $('#kur-tablo').value = depoOku(DEPO.kur) ?? '';
  $('#tasima-tablo').value = depoOku(DEPO.tasima) ?? '';
  $('#limit-tablo').value = depoOku(DEPO.limit) ?? '';
  const kb = $('#kz-boyut');
  for (const b of BOYUTLAR) kb.insertAdjacentHTML('beforeend', `<option value="${kacis(b.id)}">${kacis(ceviri(b.ad))}</option>`);
  $('#dosya').addEventListener('change', e => dosyaOku(e.target.files?.[0]));
  const birak = $('#birak');
  birak.addEventListener('dragover', e => { e.preventDefault(); birak.classList.add('uzerinde'); });
  birak.addEventListener('dragleave', () => birak.classList.remove('uzerinde'));
  birak.addEventListener('drop', e => { e.preventDefault(); birak.classList.remove('uzerinde'); dosyaOku(e.dataTransfer?.files?.[0]); });
  $('#ornek-yukle').addEventListener('click', () => ornekYukle());
  if (dil === 'en') $('#limit-tablo').placeholder = ORNEK_LIMITLER_EN;
  $('#ornek-kapat').addEventListener('click', () => { sentetikAyarla(false); $('#dosya').click(); });
  for (const id of ['#bakis', '#saat-dilimi']) $(id).addEventListener('change', () => { depoYaz(DEPO.saat, $('#saat-dilimi').value); if (satirlar) { aktar(); hesapla(); } });
  $('#eslesme-onay').addEventListener('click', hesapla);
  for (const id of ['#analiz-gunu', '#yontem', '#kapsam', '#yerel-doviz', '#marj-yuzde']) $(id).addEventListener('change', hesapla);
  $('#kur-tablo').addEventListener('change', () => { ratesFromFile = false; });
  for (const id of ['#kur-tablo', '#tasima-tablo', '#limit-tablo']) $(id).addEventListener('change', hesapla);
  $('#ozet-kurlar-ac').addEventListener('click', () => { fold('#girdi-kart', false); $('#girdi-kart').scrollIntoView({ block: 'start' }); $('#kur-tablo').focus({ preventScroll: true }); });
  $('#kz-boyut').addEventListener('change', kzGoster);
  $('#rapor-indir').addEventListener('click', downloadReport);
  for (const b of document.querySelectorAll('.katla')) b.addEventListener('click', () => { const k = $(b.dataset.katla); k.dataset.elle = '1'; fold(b.dataset.katla, !k.classList.contains('katli')); });
  $('#tur-baslat').addEventListener('click', tour);
  $('#detay-kapat').addEventListener('click', detayKapat);
  for (const id of ['#kz-tablo', '#pozisyon-tablo', '#merdiven-tablo', '#swap-tablo', '#marj-tablo']) {
    $(id).addEventListener('click', tiklaAc);
    $(id).addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tiklaAc(e); } });
  }
  const ready = sampleFileParam() ? ornekDosyaAc(sampleFileParam()) : urlParam('sample') === '1' ? ornekYukle() : null;
  if (urlParam('tour') === '1') Promise.resolve(ready).then(tour);
}
baslat();
