// Panom: kullanıcının kendi MT5 hesabının web paneli. Giriş, laboratuvardaki eşleştirme kodudur
// (aynı tarayıcı deposu anahtarları: baglanti-arayuz.js). Veri röleden şifreli gelir, burada açılır.
// Sunucuya hiçbir şey gönderilmez; özetler tarayıcıda hesaplanır (panom/ozet.js).

import { t as ceviri, yerel, dil, sayfayiCevir, dilAnahtari } from './dil.js';
import { istemci, sinifla, roleAdresi, utcEtiket, sureMetni, YOKLAMA_SN } from './veri/baglanti.js';
import { kotaCoz, islemCoz, pozisyonCoz, durumCoz } from './veri/kopru.js';
import { hesapOzeti, sonGunler, gunAnahtari } from './panom/ozet.js';
import { panomOrnek } from './panom/ornek.js';

const KOD_ANAHTARI = 'kalibre-kopru-kod';
const ROLE_ANAHTARI = 'kalibre-kopru-role';
const HESAP = { demo: ['DEMO', ''], gercek: ['GERÇEK HESAP', 'gercek'], yarisma: ['YARIŞMA', ''] };
const ISLEM_YENILE_SN = 60;

const $ = s => document.querySelector(s);
const kacis = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const para = (x, b = 2) => (typeof x === 'number' && Number.isFinite(x) ? x.toLocaleString(yerel, { minimumFractionDigits: b, maximumFractionDigits: b }) : '');
const yuzde = (x, b = 1) => (typeof x === 'number' && Number.isFinite(x) ? (x * 100).toLocaleString(yerel, { minimumFractionDigits: b, maximumFractionDigits: b }) + '%' : '');
const isaretli = (x, b = 2) => (x > 0 ? '+' : '') + para(x, b);
const fiyat = (x, basamak) => (typeof x === 'number' ? x.toLocaleString(yerel, { minimumFractionDigits: basamak ?? 2, maximumFractionDigits: basamak ?? 5 }) : '');
const sinif = x => (x > 0 ? 'pozitif' : x < 0 ? 'negatif' : '');
// Sunucu saatindeki unix saniye: alanları olduğu gibi gösterilir (saat dilimine çevrilmez).
const tarih = sn => { const d = new Date(sn * 1000); return `${d.getUTCDate().toString().padStart(2, '0')}.${(d.getUTCMonth() + 1).toString().padStart(2, '0')}.${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`; };
const gunMetni = g => { const [y, a, gg] = g.split('-'); return `${gg}.${a}.${y}`; };

const depo = {
  oku(k) { try { return localStorage.getItem(k); } catch { return null; } },
};

const dilEki = dil === 'en' ? '&dil=en' : '';
const backtestBaglantisi = sembol => `./?sembol=${encodeURIComponent(sembol)}${dilEki}`;

// ---------------------------------------------------------------- çizim
function tuval(c) {
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth || 600, h = Number(c.getAttribute('height')) || 150;
  c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  return { x, w, h };
}

function bakiyeCiz(c, egri, yatirilan) {
  const { x, w, h } = tuval(c);
  if (egri.length < 2) { x.fillStyle = '#8d9cb0'; x.font = '12px ui-monospace, monospace'; x.fillText(ceviri('Henüz çizilecek işlem yok.'), 8, 20); return; }
  const pad = 8;
  const degerler = egri.map(e => e.bakiye);
  const lo = Math.min(...degerler, yatirilan), hi = Math.max(...degerler, yatirilan);
  const t0 = egri[0].zaman, t1 = egri[egri.length - 1].zaman;
  const X = tz => pad + ((tz - t0) / (t1 - t0 || 1)) * (w - 2 * pad);
  const Y = v => h - pad - ((v - lo) / (hi - lo || 1)) * (h - 2 * pad);
  x.strokeStyle = '#24344c'; x.lineWidth = 1;
  for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(0, h * i / 4); x.lineTo(w, h * i / 4); x.stroke(); }
  // Yatırılan toplam: işlem sonucu sıfır çizgisi.
  x.strokeStyle = '#33465f'; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(0, Y(yatirilan)); x.lineTo(w, Y(yatirilan)); x.stroke(); x.setLineDash([]);
  const son = degerler[degerler.length - 1];
  x.strokeStyle = son >= yatirilan ? '#5fb89a' : '#e07a6e'; x.lineWidth = 1.6; x.beginPath();
  egri.forEach((e, i) => (i ? x.lineTo(X(e.zaman), Y(e.bakiye)) : x.moveTo(X(e.zaman), Y(e.bakiye))));
  x.stroke();
  x.fillStyle = '#8d9cb0'; x.font = '11px ui-monospace, monospace';
  x.fillText(ceviri('bakiye'), 8, 14);
  x.textAlign = 'right'; x.fillText(para(son, 0), w - 8, 14); x.textAlign = 'left';
}

// ---------------------------------------------------------------- bölümler
function hesapYaz(durum, poz) {
  const kutu = $('#hesap-karolar');
  if (!poz) { kutu.hidden = true; return; }
  const fark = (poz.varlik ?? 0) - (poz.bakiye ?? 0);
  const karolar = [
    [ceviri('Bakiye'), para(poz.bakiye), ''],
    [ceviri('Varlık'), para(poz.varlik), ''],
    [ceviri('Açık kâr/zarar'), isaretli(fark), sinif(fark)],
    [ceviri('Para birimi'), kacis(poz.para ?? ''), ''],
  ];
  kutu.innerHTML = karolar.map(([e, v, s]) => `<div><b class="${s}">${v}</b><span>${e}</span></div>`).join('');
  kutu.hidden = false;
}

function durumYaz(d, durum) {
  const kutu = $('#mt5-durum');
  kutu.dataset.sinif = d.sinif;
  $('#mt5-baslik').textContent = d.baslik;
  let ayrinti = d.ayrinti;
  if (durum && durum.sunucuUtcFarkiSn !== null) ayrinti += ' ' + ceviri('Zamanlar sunucu saatidir, {utc}.', { utc: utcEtiket(durum.sunucuUtcFarkiSn) });
  $('#mt5-ayrinti').textContent = ayrinti;
  const h = durum && HESAP[durum.terminal.hesapTuru];
  $('#mt5-hesap').hidden = !h;
  if (h) { $('#mt5-hesap').textContent = ceviri(h[0]); $('#mt5-hesap').className = `rozet ikincil ${h[1]}`; }
}

function kotalarYaz(k) {
  const kart = $('#kota-kart');
  if (!k || !k.kotalar.length) { kart.hidden = true; return; }
  $('#kota-not').textContent = ceviri('{n} sembol, MT5 Market Watch listesinden', { n: k.kotalar.length });
  $('#kota-izgara').innerHTML = k.kotalar.map(q => {
    const d = q.gunlukDegisim;
    const dMetin = d === null ? '' : `<span class="${sinif(d)}">${d > 0 ? '+' : ''}${yuzde(d, 2)}</span>`;
    let aralik = '';
    if (q.gunDusuk && q.gunYuksek && q.gunYuksek > q.gunDusuk) {
      const oran = Math.max(0, Math.min(1, (q.alis - q.gunDusuk) / (q.gunYuksek - q.gunDusuk)));
      aralik = `<div class="aralik" title="${ceviri('Gün aralığı')}: ${fiyat(q.gunDusuk, q.basamak)} - ${fiyat(q.gunYuksek, q.basamak)}"><i style="left:${(oran * 100).toFixed(1)}%"></i></div>`;
    }
    return `<div class="kota">
      <div class="kota-bas"><b>${kacis(q.sembol)}</b>${dMetin}</div>
      <div class="kota-tanim">${kacis(q.tanim)}</div>
      <div class="kota-fiyat"><span>${fiyat(q.alis, q.basamak)}</span><span class="kota-satis">${fiyat(q.satis, q.basamak)}</span></div>
      ${aralik}
      <div class="kota-alt"><span>${q.makas !== null ? ceviri('makas {n} puan', { n: q.makas }) : ''}</span>
        <a class="kucuk" href="${backtestBaglantisi(q.sembol)}">${ceviri('Backtest')}</a></div>
    </div>`;
  }).join('');
  kart.hidden = false;
}

function pozisyonYaz(p) {
  const kart = $('#pozisyon-kart');
  if (!p) { kart.hidden = true; return; }
  $('#pozisyon-not').textContent = p.pozisyonlar.length ? ceviri('{n} pozisyon', { n: p.pozisyonlar.length }) : '';
  $('#pozisyon-kutu').innerHTML = p.pozisyonlar.length
    ? `<div class="tablo-kutu"><table class="pozisyon"><thead><tr>${['Sembol', 'Yön', 'Lot', 'Açılış', 'Güncel', 'Stop', 'Hedef', 'Kâr'].map(b => `<th>${ceviri(b)}</th>`).join('')}</tr></thead><tbody>${
      p.pozisyonlar.map(x => `<tr><td>${kacis(x.sembol)}${x.sihirli === 20261020 ? ` <span class="rozet mini">${ceviri('Motor')}</span>` : ''}</td><td>${ceviri(x.yon === 'al' ? 'Al' : 'Sat')}</td><td>${x.lot}</td><td>${x.acilisFiyati}</td><td>${x.guncelFiyat}</td><td>${x.stop ?? ''}</td><td>${x.hedef ?? ''}</td><td class="${sinif(x.kar)}">${isaretli(x.kar)}</td></tr>`).join('')
    }</tbody></table></div>`
    : `<p class="dipnot">${ceviri('Açık pozisyon yok.')}</p>`;
  kart.hidden = false;
}

let sonIslemler = null;
let secilenSembol = '';

function islemlerYaz(h, simdi) {
  const kart = $('#islem-kart');
  if (!h) { kart.hidden = true; return; }
  sonIslemler = h;
  const o = hesapOzeti(h);
  const p = h.para ? ` ${kacis(h.para)}` : '';
  $('#islem-not').textContent = h.gunSayisi ? ceviri('son {n} gün', { n: h.gunSayisi }) : '';
  const kf = o.karFaktoru === null ? '' : o.karFaktoru === Infinity ? '∞' : para(o.karFaktoru);
  const karolar = [
    [ceviri('Net kâr'), isaretli(o.net) + p, sinif(o.net)],
    [ceviri('İşlem'), String(o.adet), ''],
    [ceviri('Kazanma oranı'), yuzde(o.kazanmaOrani), ''],
    [ceviri('Kâr faktörü'), kf, ''],
    [ceviri('Ortalama kazanç'), para(o.ortKazanc) + (o.ortKazanc !== null ? p : ''), 'pozitif'],
    [ceviri('Ortalama kayıp'), para(o.ortKayip) + (o.ortKayip !== null ? p : ''), 'negatif'],
    [ceviri('En büyük kayıp'), para(o.enBuyukKayip) + (o.enBuyukKayip !== null ? p : ''), 'negatif'],
    [ceviri('Gerçekleşmiş azami düşüş'), o.adet ? `${para(o.azamiDusus)}${p} (${yuzde(o.azamiDususYuzde)})` : '', 'negatif'],
    [ceviri('Ortalama süre'), o.ortSureSn !== null ? sureMetni(Math.round(o.ortSureSn)) : '', ''],
  ];
  $('#islem-istatistik').innerHTML = karolar.map(([e, v, s]) => `<div><b class="${v ? s : ''}">${v || '·'}</b><span>${e}</span></div>`).join('');
  bakiyeCiz($('#bakiye-egri'), o.egri, o.yatirilan - o.cekilen);

  // Takvim şeridi: son 42 gün, günlük net.
  const gunler = new Map(o.gunBazinda.map(g => [g.gun, g]));
  const enBuyuk = Math.max(1, ...o.gunBazinda.map(g => Math.abs(g.net)));
  $('#takvim').innerHTML = sonGunler(simdi, 42).map(g => {
    const v = gunler.get(g);
    const yogunluk = v ? (0.25 + 0.75 * Math.abs(v.net) / enBuyuk).toFixed(2) : '';
    const s = v ? (v.net > 0 ? 'pozitif' : v.net < 0 ? 'negatif' : 'notr') : 'bos';
    return `<i class="${s}" style="${v ? `opacity:${yogunluk}` : ''}" title="${gunMetni(g)}${v ? `: ${isaretli(v.net)}${p}, ${ceviri('{n} işlem', { n: v.adet })}` : ''}"></i>`;
  }).join('');
  $('#takvim-not').textContent = o.enIyiGun ? ceviri('en iyi gün {i}, en kötü gün {k}', { i: isaretli(o.enIyiGun.net) + p, k: isaretli(o.enKotuGun.net) + p }) : '';

  // Sembol seçici (işlem tablosu süzgeci).
  const sec = $('#islem-sembol');
  const semboller = o.sembolBazinda.map(s => s.sembol);
  const mevcut = [...sec.options].map(x => x.value).slice(1);
  if (mevcut.join() !== semboller.join()) {
    sec.innerHTML = `<option value="">${ceviri('Hepsi')}</option>` + semboller.map(s => `<option value="${kacis(s)}">${kacis(s)}</option>`).join('');
    if (semboller.includes(secilenSembol)) sec.value = secilenSembol; else secilenSembol = '';
  }
  islemTablosuYaz(h, p);

  $('#sembol-tablo').innerHTML = `<thead><tr>${['Sembol', 'İşlem', 'Kazanan', 'Lot', 'Net', ''].map(b => `<th>${ceviri(b)}</th>`).join('')}</tr></thead><tbody>${
    o.sembolBazinda.map(s => `<tr><td>${kacis(s.sembol)}</td><td>${s.adet}</td><td>${yuzde(s.kazanan / s.adet, 0)}</td><td>${para(s.lot)}</td><td class="${sinif(s.net)}">${isaretli(s.net)}${p}</td><td><a class="kucuk" href="${backtestBaglantisi(s.sembol)}">${ceviri('Backtest')}</a></td></tr>`).join('')
  }</tbody>`;
  kart.hidden = false;
}

function islemTablosuYaz(h, p) {
  const liste = [...h.islemler].reverse().filter(i => !secilenSembol || i.sembol === secilenSembol).slice(0, 300);
  $('#islem-tablo').innerHTML = liste.length
    ? `<thead><tr>${['Kapanış', 'Sembol', 'Yön', 'Lot', 'Giriş', 'Çıkış', 'Süre', 'Kâr'].map(b => `<th>${ceviri(b)}</th>`).join('')}</tr></thead><tbody>${
      liste.map(i => `<tr><td>${tarih(i.kapanisZamani)}</td><td>${kacis(i.sembol)}${i.sihirli === 20261020 ? ` <span class="rozet mini">${ceviri('Motor')}</span>` : ''}</td><td>${ceviri(i.yon === 'al' ? 'Al' : 'Sat')}</td><td>${i.lot}</td><td>${i.acilisFiyati}</td><td>${i.kapanisFiyati}</td><td>${sureMetni(i.kapanisZamani - i.acilisZamani)}</td><td class="${sinif(i.kar)}">${isaretli(i.kar)}${p}</td></tr>`).join('')
    }</tbody>`
    : `<tbody><tr><td>${ceviri('Bu aralıkta kapanmış işlem yok.')}</td></tr></tbody>`;
}

// ---------------------------------------------------------------- örnek kip
function ornekGoster() {
  const b = panomOrnek({ simdi: Math.floor(Date.now() / 1000) });
  const simdi = Date.now() / 1000;
  const durum = durumCoz(b.durum, simdi);
  $('#kaynak-rozet').textContent = ceviri('SENTETİK ÖRNEK');
  $('#kaynak-rozet').hidden = false;
  durumYaz({ sinif: 'bagli', baslik: ceviri('Örnek veri (SENTETİK)'), ayrinti: ceviri('Gerçek bir hesap değil; Panom\'u tanıtmak için üretilmiş rastgele bir geçmiş.') }, durum);
  const poz = pozisyonCoz(b.pozisyonlar);
  hesapYaz(durum, poz);
  kotalarYaz(kotaCoz(b.kotalar));
  pozisyonYaz(poz);
  islemlerYaz(islemCoz(b.islemler), simdi);
  $('#baglan-kutu').hidden = false;
}

// ---------------------------------------------------------------- canlı kip
function canli(kod) {
  const adres = roleAdresi(location.search, depo.oku(ROLE_ANAHTARI));
  const ist = istemci(kod, adres);
  let zamanlayici = 0;
  let sonIslemZamani = 0;
  let sonIslemUretildi = null;

  async function yokla() {
    zamanlayici = 0;
    let durum = null, h = null;
    try { durum = await ist.durum(); } catch (e) { h = e; }
    durumYaz(sinifla({ durum, hata: h }), durum);
    $('#baglan-kutu').hidden = !!durum;
    if (durum) {
      $('#kaynak-rozet').hidden = !durum.ornek;
      if (durum.ornek) $('#kaynak-rozet').textContent = ceviri('SENTETİK ÖRNEK');
      const [poz, kot] = await Promise.all([
        durum.pozisyonlarVar ? ist.pozisyonlar().catch(() => null) : null,
        durum.kotalarVar ? ist.kotalar().catch(() => null) : null,
      ]);
      hesapYaz(durum, poz);
      pozisyonYaz(poz);
      kotalarYaz(kot);
      if (!durum.kotalarVar) $('#kota-not').textContent = ceviri('Eklenti sürümün kotaları göndermiyor; yeni sürümü indir.');
      const simdi = Date.now() / 1000;
      if (durum.islemlerVar && simdi - sonIslemZamani >= ISLEM_YENILE_SN) {
        sonIslemZamani = simdi;
        const h2 = await ist.islemler().catch(() => null);
        if (h2 && h2.uretildi !== sonIslemUretildi) { sonIslemUretildi = h2.uretildi; islemlerYaz(h2, simdi); }
        else if (!h2 && !sonIslemler) islemlerYaz(null);
      }
    }
    planla();
  }
  function planla() {
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(yokla, 1000 * (document.hidden ? YOKLAMA_SN.gizli : YOKLAMA_SN.gorunur));
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { clearTimeout(zamanlayici); yokla(); } });
  window.addEventListener('pagehide', () => clearTimeout(zamanlayici));
  yokla();
}

// ---------------------------------------------------------------- başlat
sayfayiCevir();
dilAnahtari(document.querySelector('.ust-eylem'));
$('#islem-sembol').addEventListener('change', e => {
  secilenSembol = e.target.value;
  if (sonIslemler) islemTablosuYaz(sonIslemler, sonIslemler.para ? ` ${kacis(sonIslemler.para)}` : '');
});
$('#ornek-yukle').addEventListener('click', ornekGoster);
if (dilEki) $('#baglan-git').href = `./?dil=en#prova-kart`;
window.addEventListener('resize', () => { if (sonIslemler) islemlerYaz(sonIslemler, Date.now() / 1000); });

const kod = depo.oku(KOD_ANAHTARI);
if (/^KLB1[0-9a-f]{64}$/i.test(kod ?? '')) canli(kod);
else {
  durumYaz({ sinif: 'bekleniyor', baslik: ceviri('Bağlı MetaTrader yok'), ayrinti: ceviri('Önce laboratuvarda eşleştirme kodu üret ve eklentiye yapıştır; Panom aynı tarayıcıda kendiliğinden açılır.') }, null);
  $('#baglan-kutu').hidden = false;
}
