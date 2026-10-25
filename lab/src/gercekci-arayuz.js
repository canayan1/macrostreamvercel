// Gerçekçi maliyetler (enstrüman ve maliyet modeli v2) ve mum içi dolum modeli seçimi.
// Realistic costs (instrument and cost model v2) and intrabar fill model.
//
// İkisi de isteğe bağlıdır. Kapalıyken provaSecenekleri() boş nesne döner: sonuçlar ve resultId
// eskisiyle birebir aynı kalır. Ayar bu tarayıcıda durur ('kalibre-lab-gercekci') ve giriş
// yapılmışsa strateji taslağıyla birlikte hesaba yazılır (hesap-senkron.js, payload.prova).
//
// Hazır değerler tipik örneklerdir; kullanıcının aracı kurumuyla aynı olduğu iddia edilmez. Kesin
// değerler MT5'te sembolün "Specification" penceresindedir. Kalibre Bridge yalnız nokta büyüklüğünü
// gönderir (docs/kopru.md); sözleşme büyüklüğü, lot sınırları ve swap gönderilmez.

import { t as ceviri } from './dil.js';
import { kacis } from './guvenlik.js';
import { DOLUM_MODELLERI } from '../core/src/dolum.js';

export const ANAHTAR = 'kalibre-lab-gercekci';

// Tipik örnek değerler (çoğu MT5 aracı kurumunda standart hesap).
export const ON_AYARLAR = Object.freeze({
  EURUSD: { baz: 'EUR', kote: 'USD', sozlesme: 100000, tickBuyuklugu: 0.00001, lotAdimi: 0.01, minLot: 0.01, maxLot: 100 },
  GBPUSD: { baz: 'GBP', kote: 'USD', sozlesme: 100000, tickBuyuklugu: 0.00001, lotAdimi: 0.01, minLot: 0.01, maxLot: 100 },
  USDJPY: { baz: 'USD', kote: 'JPY', sozlesme: 100000, tickBuyuklugu: 0.001, lotAdimi: 0.01, minLot: 0.01, maxLot: 100 },
  XAUUSD: { baz: 'XAU', kote: 'USD', sozlesme: 100, tickBuyuklugu: 0.01, lotAdimi: 0.01, minLot: 0.01, maxLot: 100 },
});

export const VARSAYILAN = Object.freeze({
  acik: false, sembol: 'EURUSD', ...ON_AYARLAR.EURUSD, hesap: 'USD',
  komisyonLot: 0, swapLong: 0, swapShort: 0, ucluSwapGunu: 3, kaldirac: 0, stopOut: 50,
  dolum: 'stop-once',
});

const SAYILAR = ['sozlesme', 'tickBuyuklugu', 'lotAdimi', 'minLot', 'maxLot', 'komisyonLot', 'swapLong', 'swapShort', 'kaldirac', 'stopOut'];
const POZITIF = ['sozlesme', 'tickBuyuklugu', 'lotAdimi', 'minLot', 'maxLot'];
const PARA = ['baz', 'kote', 'hesap'];

// Boş, eksik ya da sayı olmayan değer NaN döner (varsayılan korunur); Number('') = 0 tuzağına düşülmez.
const sayi = v => { if (v === undefined || v === null || String(v).trim() === '') return NaN; const x = Number(String(v).replace(',', '.')); return Number.isFinite(x) ? x : NaN; };
const para = v => (typeof v === 'string' && /^[A-Za-z]{3,6}$/.test(v.trim()) ? v.trim().toUpperCase() : '');

// Depodan ya da hesaptan gelen nesneyi güvenli duruma çevirir; bilinmeyen alanlar atılır.
export function durumTemizle(v) {
  const d = { ...VARSAYILAN };
  if (!v || typeof v !== 'object') return d;
  d.acik = v.acik === true;
  if (typeof v.sembol === 'string') d.sembol = v.sembol.trim().toUpperCase().slice(0, 20);
  for (const k of SAYILAR) {
    const x = sayi(v[k]);
    if (!Number.isFinite(x)) continue;
    if (POZITIF.includes(k) ? x > 0 : (k.startsWith('swap') || x >= 0)) d[k] = x;
  }
  for (const k of PARA) if (v[k] !== undefined) d[k] = para(v[k]);
  const g = Math.round(sayi(v.ucluSwapGunu));
  if (g >= 0 && g <= 6) d.ucluSwapGunu = g;
  if (DOLUM_MODELLERI.includes(v.dolum)) d.dolum = v.dolum;
  return d;
}

export function durumOku(depo = globalThis.localStorage) {
  try { return durumTemizle(JSON.parse(depo?.getItem(ANAHTAR) ?? 'null')); } catch { return { ...VARSAYILAN }; }
}
export function durumYaz(d, depo = globalThis.localStorage) {
  try { depo?.setItem(ANAHTAR, JSON.stringify(durumTemizle(d))); } catch { /* özel pencere vb. */ }
}

// Durum → motor seçenekleri. { secenek, uyarilar }. secenek prova()/tara()/yuruyenIleri()'ye geçer.
// Kapalı ve varsayılan dolumda secenek boştur (sonuç ve resultId değişmez).
// nokta: 'puan' mesafelerinin fiyat karşılığı; verilmezse tick büyüklüğü kullanılır.
export function provaSecenekleri(d, { altMumlar = null, nokta = null } = {}) {
  const x = durumTemizle(d);
  const secenek = {}, uyarilar = [];
  if (x.acik) {
    const e = {
      sozlesme: x.sozlesme, tickBuyuklugu: x.tickBuyuklugu, nokta: nokta > 0 ? nokta : x.tickBuyuklugu,
      lotAdimi: x.lotAdimi, minLot: x.minLot, maxLot: Math.max(x.maxLot, x.minLot),
      baz: x.baz, kote: x.kote, hesap: x.hesap,
      komisyonLot: x.komisyonLot, swapLong: x.swapLong, swapShort: x.swapShort, ucluSwapGunu: x.ucluSwapGunu, stopOut: x.stopOut,
    };
    if (x.kaldirac > 0) e.kaldirac = x.kaldirac;
    if (x.kote && x.hesap && x.kote !== x.hesap && x.baz !== x.hesap) {
      uyarilar.push(ceviri('Gerçekçi maliyetler uygulanmadı: {k} kotasyonlu bir sembolde {h} hesabı için kur serisi gerekir. Hesap para birimini {k} ya da {b} yap.', { k: x.kote, h: x.hesap, b: x.baz || '?' }));
    } else {
      secenek.enstruman = e;
    }
  }
  if (x.dolum !== 'stop-once') {
    if (x.dolum === 'm1') {
      if (Array.isArray(altMumlar) && altMumlar.length) { secenek.dolum = 'm1'; secenek.altMumlar = altMumlar; }
      else uyarilar.push(ceviri('M1 büyüteç için alt zaman dilimi dosyası yüklenmedi; stop önce kabul edildi.'));
    } else secenek.dolum = x.dolum;
  }
  return { secenek, uyarilar };
}

export const dolumAdi = m => DOLUM_ADLARI()[m] ?? m;

// Sonuç satırı: dolum modeli ve belirsiz mumlar.
export function dolumMetni(rapor) {
  if (!rapor) return '';
  const ad = DOLUM_ADLARI()[rapor.model] ?? rapor.model;
  const oran = rapor.belirsizOran ? (rapor.belirsizOran * 100).toFixed(1) : '0';
  return ceviri('Dolum modeli: {m}. Belirsiz mum: {n} (işlemlerin %{o}).', { m: ad, n: rapor.belirsizMum ?? 0, o: oran });
}

// Enstrüman özeti: swap, komisyon, atlanan girişler, stop out.
export function enstrumanMetni(r) {
  if (!r) return '';
  const p = v => (Math.round(v * 100) / 100).toString();
  return ceviri('Gerçekçi maliyetler: komisyon {k}, swap {s}, en az lot altında kalan giriş {m}, teminat yetmeyen giriş {t}, stop out {o}.',
    { k: p(r.komisyonToplam ?? 0), s: p(r.swapToplam ?? 0), m: r.minLotAtlanan ?? 0, t: r.teminatAtlanan ?? 0, o: r.stopOut ?? 0 });
}

const DOLUM_ADLARI = () => ({
  'stop-once': ceviri('Stop önce'),
  'acilisa-yakin': ceviri('Açılışa yakın uç önce'),
  ohlc: ceviri('OHLC yolu'),
  m1: ceviri('M1 büyüteç'),
});

const ALANLAR = () => [
  ['sozlesme', ceviri('Sözleşme büyüklüğü'), ceviri('lot başına birim')],
  ['tickBuyuklugu', ceviri('Tick büyüklüğü'), ceviri('en küçük fiyat adımı')],
  ['lotAdimi', ceviri('Lot adımı'), ''],
  ['minLot', ceviri('En az lot'), ''],
  ['maxLot', ceviri('En çok lot'), ''],
  ['komisyonLot', ceviri('Komisyon (lot başına, taraf başına)'), ceviri('hesap para biriminde')],
  ['swapLong', ceviri('Swap long'), ceviri('lot başına gecelik, hesap para biriminde; eksi ödenir')],
  ['swapShort', ceviri('Swap short'), ceviri('lot başına gecelik, hesap para biriminde; eksi ödenir')],
  ['kaldirac', ceviri('Kaldıraç'), ceviri('0 ise teminat denetimi yok')],
  ['stopOut', ceviri('Stop out (%)'), ceviri('teminat seviyesi')],
];
const GUNLER = () => [ceviri('Pazar'), ceviri('Pazartesi'), ceviri('Salı'), ceviri('Çarşamba'), ceviri('Perşembe'), ceviri('Cuma'), ceviri('Cumartesi')];

export function gercekciHtml(d = durumOku(), { m1Var = false, kaynakNot = '' } = {}) {
  const x = durumTemizle(d);
  const secenek = [...Object.keys(ON_AYARLAR), 'OZEL'].map(k =>
    `<option value="${kacis(k)}"${x.sembol === k || (k === 'OZEL' && !ON_AYARLAR[x.sembol]) ? ' selected' : ''}>${kacis(k === 'OZEL' ? ceviri('Diğer (elle gir)') : k)}</option>`).join('');
  const girdiler = ALANLAR().map(([k, etiket, ipucu]) =>
    `<label><span>${kacis(etiket)}</span><input type="number" step="any" inputmode="decimal" data-gercekci="${kacis(k)}" value="${kacis(x[k])}"${ipucu ? ` title="${kacis(ipucu)}"` : ''}></label>`).join('');
  const paraGirdi = (k, etiket) => `<label><span>${kacis(etiket)}</span><input type="text" maxlength="6" autocapitalize="characters" data-gercekci="${kacis(k)}" value="${kacis(x[k])}"></label>`;
  const gun = `<label><span>${kacis(ceviri('Üç gecelik swap günü'))}</span><select data-gercekci="ucluSwapGunu">${GUNLER().map((g, i) => `<option value="${kacis(i)}"${i === x.ucluSwapGunu ? ' selected' : ''}>${kacis(g)}</option>`).join('')}</select></label>`;
  const dolum = DOLUM_MODELLERI.map(m =>
    `<option value="${kacis(m)}"${m === x.dolum ? ' selected' : ''}${m === 'm1' && !m1Var ? ' disabled' : ''}>${kacis(DOLUM_ADLARI()[m])}${m === 'stop-once' ? ` (${kacis(ceviri('varsayılan'))})` : ''}</option>`).join('');
  return `<details class="maliyet gercekci"${x.acik || x.dolum !== 'stop-once' ? ' open' : ''}>
    <summary>${kacis(ceviri('Gerçekçi maliyetler ve dolum'))} <span class="rozet ikincil" data-gercekci-etiket>${kacis(x.acik ? ceviri('açık') : ceviri('kapalı'))}</span></summary>
    <label class="gercekci-ac"><input type="checkbox" data-gercekci="acik"${x.acik ? ' checked' : ''}> ${kacis(ceviri('Lot, kur çevrimi, lot başı komisyon, swap ve teminatı hesaba kat'))}</label>
    <div class="prova-ayar" data-gercekci-alanlar${x.acik ? '' : ' hidden'}>
      <label><span>${kacis(ceviri('Sembol örneği'))}</span><select data-gercekci="sembol">${secenek}</select></label>
      ${paraGirdi('baz', ceviri('Baz para'))}${paraGirdi('kote', ceviri('Kote para'))}${paraGirdi('hesap', ceviri('Hesap para birimi'))}
      ${girdiler}${gun}
    </div>
    <p class="dipnot" data-gercekci-alanlar${x.acik ? '' : ' hidden'}>${kacis(ceviri('Örnek değerler tipik bir standart hesaptandır, senin aracı kurumunla aynı olmayabilir. Kendi değerlerini MT5\'te sembole sağ tıklayıp Specification penceresinden al ve burada düzelt. Yukarıdaki spread ve kayma da uygulanır; lot başı komisyon kullanıyorsan yüzde komisyonu 0 yap.'))}${kaynakNot ? ` ${kacis(kaynakNot)}` : ''}</p>
    <div class="prova-ayar">
      <label><span>${kacis(ceviri('Mum içi dolum modeli'))}</span><select data-gercekci="dolum">${dolum}</select></label>
      <label><span>${kacis(ceviri('Alt zaman dilimi dosyası (M1 büyüteç için)'))}</span><input type="file" accept=".csv,.json,text/csv,application/json" data-gercekci-m1></label>
    </div>
    <p class="dipnot">${kacis(ceviri('Aynı mumda hem stop hem hedef görüldüğünde hangisinin önce dolduğunu mum verisinden bilmek mümkün değildir. Model bu durumda ne varsayılacağını seçer. Sonuçta bu tür mumların sayısı gösterilir.'))} <span data-gercekci-m1-durum></span></p>
  </details>`;
}

// kok: bölümün çizileceği öğe. degisince(durum): her geçerli değişiklikte.
// m1Yukle(dosya) => Promise<{ adet } | hata fırlatır>: alt zaman dilimi dosyasını sayfa yükler.
export function gercekciAlani(kok, { degisince = () => {}, m1Yukle = null, m1Var = () => false, kaynakNot = () => '' } = {}) {
  if (!kok) return { yenile() {} };
  const ciz = () => { kok.innerHTML = gercekciHtml(durumOku(), { m1Var: m1Var(), kaynakNot: kaynakNot() }); };
  ciz();
  const guncelle = (k, deger) => {
    const d = durumOku();
    if (k === 'acik') d.acik = deger;
    else if (k === 'sembol') {
      d.sembol = deger;
      if (ON_AYARLAR[deger]) Object.assign(d, ON_AYARLAR[deger]);
    } else d[k] = deger;
    durumYaz(d);
    degisince(durumOku());
  };
  kok.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset?.gercekciM1 !== undefined && m1Yukle) {
      const f = el.files?.[0];
      const durum = kok.querySelector('[data-gercekci-m1-durum]');
      if (!f) return;
      try {
        const r = await m1Yukle(f);
        if (durum) durum.textContent = ceviri('Alt zaman dilimi: {n} mum yüklendi.', { n: r.adet });
        const sec = kok.querySelector('select[data-gercekci="dolum"] option[value="m1"]');
        if (sec) sec.disabled = false;
        degisince(durumOku());
      } catch (err) {
        if (durum) durum.textContent = ceviri('Alt zaman dilimi dosyası okunamadı: {m}', { m: ceviri(err.message) });
      }
      return;
    }
    const k = el.dataset?.gercekci;
    if (!k) return;
    if (k === 'acik') {
      for (const a of kok.querySelectorAll('[data-gercekci-alanlar]')) a.hidden = !el.checked;
      const et = kok.querySelector('[data-gercekci-etiket]');
      if (et) et.textContent = el.checked ? ceviri('açık') : ceviri('kapalı');
      return guncelle('acik', el.checked);
    }
    if (k === 'sembol') { guncelle('sembol', el.value); ciz(); return; }
    if (k === 'dolum' || k === 'ucluSwapGunu') return guncelle(k, k === 'dolum' ? el.value : Number(el.value));
    guncelle(k, PARA.includes(k) ? para(el.value) : sayi(el.value));
  });
  return { yenile: ciz };
}
