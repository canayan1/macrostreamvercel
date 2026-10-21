// Oynaklık Laboratuvarı: varlıktan bağımsız. Sentetik ya da kullanıcının kendi CSV'si.
// Hesaplar tarayıcıda yapılır; veri hiçbir yere gönderilmez.

import { uret, REJIMLER } from './sentetik.js';
import { dosyaCoz } from './veri/dosya.js';
import { yillikDonem, takvimTahmin, TAKVIMLER } from './veri/kaynak.js';
import { getiriler, kapanisKapanis, parkinson, garmanKlass, rogersSatchell, yangZhang, ewma } from './modeller/oynaklik.js';
import { garchKestir } from './modeller/garch.js';
import { sarimaKestir } from './modeller/sarima.js';

const $ = s => document.querySelector(s);
const renk = ad => getComputedStyle(document.documentElement).getPropertyValue(ad).trim();
const sayi = (v, b = 2) => (Number.isFinite(v) ? v.toFixed(b).replace('.', ',') : '—');
const PALET = ['--accent', '--blue', '--green', '--violet', '--red', '--text-dim'];

let veri = null;
let analizNo = 0; // { mumlar, ad, zamanDilimi, takvim }

// ------------------------------------------------------------------ çizim
function cizgi(c, seriler, { yuzde = false, dikey = null } = {}) {
  c.dataset.h ??= c.getAttribute('height'); // bkz. uygulama.js tuval(): yükseklik bir kez okunur
  const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = Number(c.dataset.h);
  c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  const tum = seriler.flatMap(s => s.deger.filter(Number.isFinite));
  if (!tum.length) return;
  let lo = Math.min(...tum), hi = Math.max(...tum);
  if (lo === hi) { lo -= 1; hi += 1; }
  const n = Math.max(...seriler.map(s => s.deger.length)), sol = 46, pad = 8;
  const X = i => sol + (i / (n - 1)) * (w - sol - pad), Y = v => h - 18 - ((v - lo) / (hi - lo)) * (h - 30);
  x.strokeStyle = renk('--border'); x.fillStyle = renk('--muted'); x.font = '10px ui-monospace, monospace'; x.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const v = lo + (hi - lo) * i / 4, yy = Y(v);
    x.beginPath(); x.moveTo(sol, yy); x.lineTo(w - pad, yy); x.stroke();
    x.fillText(yuzde ? `%${(v * 100).toFixed(0)}` : v.toPrecision(3), 2, yy + 3);
  }
  if (dikey !== null) { x.strokeStyle = renk('--border-2'); x.setLineDash([3, 3]); x.beginPath(); x.moveTo(X(dikey), 4); x.lineTo(X(dikey), h - 18); x.stroke(); x.setLineDash([]); }
  seriler.forEach((s, k) => {
    x.strokeStyle = renk(s.renk ?? PALET[k % PALET.length]); x.lineWidth = s.kalin ? 1.8 : 1.1; x.beginPath();
    let basla = true;
    s.deger.forEach((v, i) => { if (!Number.isFinite(v)) { basla = true; return; } basla ? x.moveTo(X(i), Y(v)) : x.lineTo(X(i), Y(v)); basla = false; });
    x.stroke();
  });
}
const lejant = (el, seriler) => { el.innerHTML = seriler.map((s, k) => `<span><i style="background:var(${s.renk ?? PALET[k % PALET.length]})"></i>${s.ad}</span>`).join(''); };
const tablo = (el, baslik, satirlar, secili = -1) => {
  el.innerHTML = `<thead><tr>${baslik.map(b => `<th>${b}</th>`).join('')}</tr></thead><tbody>${satirlar.map((s, i) => `<tr${i === secili ? ' class="secili"' : ''}>${s.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>`;
};

// ------------------------------------------------------------------ veri
function veriYukle() {
  if ($('#kaynak').value === 'sentetik') {
    const tohum = Number($('#tohum').value) || 1;
    const mumlar = uret({ tohum, rejim: $('#rejim').value, adet: 3000, zamanDilimi: 'H1' });
    veri = { mumlar, ad: `SENTETİK · tohum ${tohum}`, zamanDilimi: 'H1' };
    $('#takvim').value = takvimTahmin(mumlar);
  }
  if (!veri) return;
  $('#rozet').textContent = veri.ad;
  analizEt();
}

$('#csv').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const d = dosyaCoz(await f.text(), f.name);
    veri = { mumlar: d.mumlar, ad: d.ad, zamanDilimi: d.zamanDilimi, atlanan: d.atlanan };
    $('#takvim').value = d.takvim;
    veriYukle();
  } catch (err) {
    $('#meta').innerHTML = `<span style="color:var(--red)">Dosya okunamadı: ${String(err.message).replace(/</g, '&lt;')}</span>`;
  }
});

// ------------------------------------------------------------------ analiz
function analizEt() {
  const { mumlar } = veri, n = Number($('#pencere').value), takvim = $('#takvim').value;
  const yd = yillikDonem(veri.zamanDilimi, takvim), olcek = Math.sqrt(yd);
  const ilk = new Date(mumlar[0].t * 1000).toISOString().slice(0, 10), son = new Date(mumlar.at(-1).t * 1000).toISOString().slice(0, 10);
  $('#meta').innerHTML = `<span>${mumlar.length} mum</span><span>${veri.zamanDilimi}</span><span>${ilk} → ${son}</span><span>${TAKVIMLER[takvim].ad}: yılda ${yd} dönem</span>${veri.atlanan ? `<span>${veri.atlanan} satır atlandı</span>` : ''}`;

  // 1) gerçekleşen oynaklık
  const tahminciler = [
    ['Kapanış-kapanış', kapanisKapanis], ['Parkinson', parkinson], ['Garman-Klass', garmanKlass],
    ['Rogers-Satchell', rogersSatchell], ['Yang-Zhang', yangZhang],
  ].map(([ad, f]) => ({ ad, deger: f(mumlar, n).map(v => v * olcek) }));
  cizgi($('#g-gercek'), tahminciler, { yuzde: true });
  lejant($('#l-gercek'), tahminciler);
  tablo($('#t-gercek'), ['Tahminci', 'Son', 'Ortalama', 'En yüksek'], tahminciler.map(t => {
    const v = t.deger.filter(Number.isFinite);
    return [t.ad, `%${sayi(v.at(-1) * 100, 1)}`, `%${sayi(v.reduce((a, b) => a + b, 0) / v.length * 100, 1)}`, `%${sayi(Math.max(...v) * 100, 1)}`];
  }));

  // 2) GARCH ailesi: modeller tek tek kestirilir, arada arayüz güncellenir
  const r = getiriler(mumlar.map(m => m.k), { yuzde: true });
  const ort = r.reduce((a, b) => a + b, 0) / r.length;
  const rd = r.map(v => v - ort);
  const sd = Math.sqrt(rd.reduce((a, b) => a + b * b, 0) / rd.length);
  const basiklik = rd.reduce((a, b) => a + (b / sd) ** 4, 0) / rd.length - 3;
  $('#meta').insertAdjacentHTML('beforeend', `<span>Fazla basıklık ${sayi(basiklik, 1)} (normal dağılımda 0)</span>`);
  const LISTE = [['arch', 'normal'], ['garch', 'normal'], ['gjr', 'normal'], ['egarch', 'normal'], ['garch', 't'], ['gjr', 't'], ['egarch', 't']];
  const modeller = [];
  const kimlik = ++analizNo;
  const ad = m => `${m.tip.toUpperCase()}${m.dagilim === 't' ? '-t' : ''}`;
  const sonraki = () => {
    if (kimlik !== analizNo) return; // yeni veri geldi, eski kestirimi bırak
    if (modeller.length < LISTE.length) {
      const [tip, dagilim] = LISTE[modeller.length];
      $('#garch-durum').textContent = `kestiriliyor ${modeller.length + 1}/${LISTE.length}…`;
      setTimeout(() => {
        try { modeller.push(garchKestir(rd, { tip, dagilim })); } catch { modeller.push(null); }
        sonraki();
      }, 10);
      return;
    }
    const gecerli = modeller.filter(Boolean);
    const enIyi = gecerli.reduce((a, m, i) => (m.bic < gecerli[a].bic ? i : a), 0);
    const sirali = [...gecerli].sort((a, b) => a.bic - b.bic);
    const ew = ewma(rd);
    const seriler = [
      ...sirali.slice(0, 3).map((m, i) => ({ ad: ad(m), deger: [NaN, ...m.kosulluOynaklik.map(v => v / 100 * olcek)], kalin: i === 0 })),
      { ad: 'EWMA (λ=0,94)', deger: [NaN, ...ew.map(v => v / 100 * olcek)], renk: '--text-dim' },
    ];
    cizgi($('#g-garch'), seriler, { yuzde: true });
    lejant($('#l-garch'), seriler);
    const kalici = m => m.kalicilik > 0.999;
    tablo($('#t-garch'), ['Model', 'ω', 'α', 'γ', 'β', 'ν', 'Kalıcılık', 'Yarı ömür', 'Uzun dön. yıllık', 'BIC'], gecerli.map(m => [
      ad(m), sayi(m.parametreler.omega, 4), sayi(m.parametreler.alpha, 3), sayi(m.parametreler.gamma ?? NaN, 3), sayi(m.parametreler.beta ?? NaN, 3),
      sayi(m.parametreler.nu ?? NaN, 1), sayi(m.kalicilik, 3), kalici(m) ? '∞' : sayi(m.yariOmur, 1),
      kalici(m) ? 'tanımsız' : `%${sayi(m.uzunDonemOynaklik / 100 * olcek * 100, 1)}`, sayi(m.bic, 0),
    ]), enIyi);
    const en = gecerli[enIyi], o = en.ongoru(10);
    tablo($('#t-ongoru'), [`Öngörü (${ad(en)})`, ...[1, 2, 5, 10].map(h => `+${h} mum`)],
      [['Yıllık oynaklık', ...[1, 2, 5, 10].map(h => `%${sayi(o[h - 1] / 100 * olcek * 100, 1)}`)]]);
    $('#garch-durum').textContent = '';
  };
  sonraki();

  sarimaKestirCiz();
}

function sarimaKestirCiz() {
  if (!veri) return;
  const { mumlar } = veri;
  const tur = $('#s-seri').value;
  const r = getiriler(mumlar.map(m => m.k), { yuzde: true });
  let y;
  if (tur === 'getiri') y = r;
  else if (tur === 'mutlak') y = r.map(Math.abs);
  else if (tur === 'aralik') y = mumlar.map(m => Math.log(m.y / m.d) * 100);
  else {
    if (!mumlar.every(m => Number.isFinite(m.h))) { $('#sarima-durum').textContent = 'Bu veride hacim yok'; return; }
    y = mumlar.map(m => Math.log(1 + m.h));
  }
  const ayar = Object.fromEntries(['p', 'd', 'q', 'P', 'D', 'Q', 's'].map(k => [k, Math.max(0, Math.floor(Number($('#s-' + k).value) || 0))]));
  if (!(ayar.P || ayar.D || ayar.Q)) ayar.s = 0;
  $('#sarima-durum').textContent = 'kestiriliyor…';
  setTimeout(() => {
    try {
      const son = y.slice(-2000);
      const m = sarimaKestir(son, { ...ayar, sabit: ayar.d === 0 && ayar.D === 0 });
      const h = Math.max(24, ayar.s || 24);
      const ong = m.ongoru(h);
      const gosterilen = son.slice(-4 * h);
      cizgi($('#g-sarima'), [
        { ad: 'Seri (son)', deger: [...gosterilen, ...new Array(h).fill(NaN)], renk: '--text-dim' },
        { ad: `Öngörü (+${h})`, deger: [...new Array(gosterilen.length - 1).fill(NaN), gosterilen.at(-1), ...ong], renk: '--accent', kalin: true },
      ], { dikey: gosterilen.length - 1 });
      lejant($('#l-sarima'), [{ ad: 'Seri (son)', renk: '--text-dim' }, { ad: `Öngörü (+${h})`, renk: '--accent' }]);
      const p = m.parametreler, satir = [];
      p.phi.forEach((v, i) => satir.push([`φ${i + 1} (AR)`, sayi(v, 3)]));
      p.theta.forEach((v, i) => satir.push([`θ${i + 1} (MA)`, sayi(v, 3)]));
      p.Phi.forEach((v, i) => satir.push([`Φ${i + 1} (mevsimsel AR)`, sayi(v, 3)]));
      p.Theta.forEach((v, i) => satir.push([`Θ${i + 1} (mevsimsel MA)`, sayi(v, 3)]));
      if (p.sabit !== undefined) satir.push(['Sabit', sayi(p.sabit, 4)]);
      satir.push(['σ² (artık)', sayi(m.sigma2, 4)], ['AIC', sayi(m.aic, 0)], ['Gözlem', String(son.length)]);
      tablo($('#t-sarima'), [`SARIMA(${ayar.p},${ayar.d},${ayar.q})(${ayar.P},${ayar.D},${ayar.Q})${ayar.s || ''}`, 'Değer'], satir);
      $('#sarima-durum').textContent = '';
    } catch (err) { $('#sarima-durum').textContent = err.message; }
  }, 20);
}

// ------------------------------------------------------------------ olaylar
$('#rejim').innerHTML = Object.entries(REJIMLER).map(([k, r]) => `<option value="${k}">${r.ad}</option>`).join('');
$('#kaynak').addEventListener('change', () => {
  const csv = $('#kaynak').value === 'csv';
  $('#csv-alan').hidden = !csv; $('#tohum-alan').hidden = csv; $('#rejim-alan').hidden = csv;
  if (!csv) { veri = null; veriYukle(); }
});
for (const id of ['#tohum', '#rejim']) $(id).addEventListener('change', veriYukle);
for (const id of ['#takvim', '#pencere']) $(id).addEventListener('change', () => veri && analizEt());
$('#s-kestir').addEventListener('click', sarimaKestirCiz);
$('#s-seri').addEventListener('change', sarimaKestirCiz);
let bekle = 0;
window.addEventListener('resize', () => { clearTimeout(bekle); bekle = setTimeout(() => veri && analizEt(), 200); });
veriYukle();
