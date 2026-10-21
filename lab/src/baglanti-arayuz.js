// "MetaTrader'ı bağla" paneli: eşleştirme kodu, bağlantı durumu, seri seçimi, pozisyonlar.
// Mantık lab/src/veri/baglanti.js'tedir; burası yalnız DOM'u yönetir.
// Yoklama yalnız prova kaynağı "MetaTrader'ım" seçiliyken çalışır: kullanıcı istemeden ağa çıkılmaz.

import { kodUret } from './veri/role.js';
import { istemci, sinifla, tazelenmeli, seriAdi, roleAdresi, izinAdresi, utcEtiket, YOKLAMA_SN, VARSAYILAN_ROLE } from './veri/baglanti.js';

const KOD_ANAHTARI = 'kalibre-kopru-kod';
const ROLE_ANAHTARI = 'kalibre-kopru-role';
const HESAP = { demo: ['DEMO', ''], gercek: ['GERÇEK HESAP', 'gercek'], yarisma: ['YARIŞMA', ''] };

const $ = s => document.querySelector(s);
const kacis = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const para = x => (typeof x === 'number' ? x.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');

// Tarayıcı deposu yoksa (gizli pencere, engellenmiş site verisi) panel yine çalışır; kod yalnız bu oturumda kalır.
const depo = {
  oku(k) { try { return localStorage.getItem(k); } catch { return null; } },
  yaz(k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* depo yok */ } },
};

// yukle(veri): prova verisini değiştirir (dosyaCoz ile aynı biçim). hata(mesaj): provada hata gösterir.
export function mt5Panel({ yukle, hata }) {
  const parametre = new URLSearchParams(location.search).get('role');
  if (parametre && roleAdresi(location.search) !== VARSAYILAN_ROLE) depo.yaz(ROLE_ANAHTARI, roleAdresi(location.search));
  let kod = depo.oku(KOD_ANAHTARI);
  if (!/^KLB1[0-9a-f]{64}$/i.test(kod ?? '')) { kod = kodUret(); depo.yaz(KOD_ANAHTARI, kod); }
  let adres = roleAdresi('', depo.oku(ROLE_ANAHTARI));
  let ist = istemci(kod, adres);
  let nesil = 0;          // kod ya da adres değişince eski yanıtlar yok sayılır
  let calisiyor = false;
  let zamanlayici = 0;
  let yuklu = null;       // { sembol, zamanDilimi, son }
  let sonSinif = '';
  let seriIstek = 0;     // seçim hızlı değişirse yalnız son istenen seri yüklenir

  function kurulumYaz() {
    $('#mt5-kod').value = kod;
    $('#mt5-izin').textContent = izinAdresi(adres, location.href);
    $('#mt5-role').value = adres === VARSAYILAN_ROLE ? '' : adres;
  }

  function yenidenKur() {
    nesil++;
    ist = istemci(kod, adres);
    yuklu = null;
    $('#mt5-seri').innerHTML = '';
    $('#mt5-seri-alan').hidden = true;
    $('#mt5-pozisyon').hidden = true;
    durumYaz(sinifla({ durum: null }), null);
    kurulumYaz();
    if (calisiyor) { clearTimeout(zamanlayici); yokla(); }
  }

  function durumYaz(d, durum) {
    const kutu = $('#mt5-durum');
    kutu.dataset.sinif = d.sinif;
    $('#mt5-baslik').textContent = d.baslik;
    let ayrinti = d.ayrinti;
    if (durum && durum.sunucuUtcFarkiSn !== null) ayrinti += ` Mum zamanları sunucu saatidir, ${utcEtiket(durum.sunucuUtcFarkiSn)}.`;
    $('#mt5-ayrinti').textContent = ayrinti;
    const h = durum && HESAP[durum.terminal.hesapTuru];
    $('#mt5-hesap').hidden = !h;
    if (h) { $('#mt5-hesap').textContent = h[0]; $('#mt5-hesap').className = `rozet ikincil ${h[1]}`; }
    // Kurulum adımları bağlanınca katlanır, bağlantı yokken açılır.
    if (d.sinif !== sonSinif) $('#mt5-kurulum').open = d.sinif !== 'bagli';
    sonSinif = d.sinif;
  }

  function serileriYaz(durum) {
    const sec = $('#mt5-seri');
    const adlar = durum.seriler.map(s => seriAdi(s.sembol, s.zamanDilimi));
    const mevcut = [...sec.options].map(o => o.value);
    if (adlar.join() !== mevcut.join()) {
      const secili = sec.value;
      sec.innerHTML = durum.seriler.map(s => `<option value="${kacis(seriAdi(s.sembol, s.zamanDilimi))}">${kacis(s.sembol)} ${kacis(s.zamanDilimi)}${s.adet ? ` · ${s.adet} mum` : ''}</option>`).join('');
      if (adlar.includes(secili)) sec.value = secili;
    }
    $('#mt5-seri-alan').hidden = adlar.length === 0;
  }

  function pozisyonYaz(p) {
    const kutu = $('#mt5-pozisyon');
    if (!p) { kutu.hidden = true; return; }
    const bas = `<h3>Açık pozisyonlar</h3>`;
    const hesap = `<p class="dipnot">Bakiye ${para(p.bakiye)} ${kacis(p.para)} · varlık ${para(p.varlik)} ${kacis(p.para)}</p>`;
    kutu.innerHTML = p.pozisyonlar.length
      ? `${bas}<table class="pozisyon"><thead><tr><th>Sembol</th><th>Yön</th><th>Lot</th><th>Açılış</th><th>Güncel</th><th>Kâr</th></tr></thead><tbody>${
        p.pozisyonlar.map(x => `<tr><td>${kacis(x.sembol)}</td><td>${x.yon === 'al' ? 'Al' : 'Sat'}</td><td>${x.lot}</td><td>${x.acilisFiyati}</td><td>${x.guncelFiyat}</td><td class="${x.kar >= 0 ? 'pozitif' : 'negatif'}">${para(x.kar)}</td></tr>`).join('')
      }</tbody></table>${hesap}`
      : `${bas}<p class="dipnot">Açık pozisyon yok.</p>${hesap}`;
    kutu.hidden = false;
  }

  async function seriYukle(durum, n = nesil) {
    const ad = $('#mt5-seri').value;
    const k = durum.seriler.find(s => seriAdi(s.sembol, s.zamanDilimi) === ad);
    if (!k) return;
    const istek = ++seriIstek;
    try {
      const r = await ist.seri(k.sembol, k.zamanDilimi, { enAz: 200 });
      if (n !== nesil || istek !== seriIstek) return;
      if (!r) { hata(`${k.sembol} ${k.zamanDilimi} serisi henüz röleye ulaşmadı; eklenti ilk mum kapanışında gönderir.`); return; }
      const sunucu = durum.terminal.sunucu ?? 'MT5';
      yuklu = { sembol: k.sembol, zamanDilimi: k.zamanDilimi, son: r.mumlar[r.mumlar.length - 1].t };
      yukle({
        mumlar: r.mumlar, zamanDilimi: r.meta.zamanDilimi, takvim: r.meta.takvim, sembol: r.meta.sembol,
        ornek: r.ornek, atlanan: r.atlanan, uyarilar: r.uyarilar,
        ad: r.ornek ? `ÖRNEK (SENTETİK) · ${k.sembol} ${k.zamanDilimi}` : `MT5 · ${sunucu} · ${k.sembol} ${k.zamanDilimi}`,
      });
    } catch (e) {
      if (n === nesil && istek === seriIstek) hata(`${k.sembol} ${k.zamanDilimi} okunamadı: ${e.message}`);
    }
  }

  async function yokla() {
    zamanlayici = 0;
    if (!calisiyor) return;
    const n = nesil;
    let durum = null, h = null;
    try { durum = await ist.durum(); } catch (e) { h = e; }
    if (n !== nesil || !calisiyor) return;
    durumYaz(sinifla({ durum, hata: h }), durum);
    if (durum) {
      serileriYaz(durum);
      const secili = $('#mt5-seri').value;
      const degisti = !yuklu || seriAdi(yuklu.sembol, yuklu.zamanDilimi) !== secili;
      if (secili && (degisti || tazelenmeli(yuklu, durum))) await seriYukle(durum, n);
      if (durum.pozisyonlarVar) pozisyonYaz(await ist.pozisyonlar().catch(() => null));
      else pozisyonYaz(null);
    }
    if (n === nesil && calisiyor) planla();
  }

  function planla() {
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(yokla, 1000 * (document.hidden ? YOKLAMA_SN.gizli : YOKLAMA_SN.gorunur));
  }

  $('#mt5-kopyala').addEventListener('click', async () => {
    const d = $('#mt5-kopyala');
    try { await navigator.clipboard.writeText(kod); d.textContent = 'Kopyalandı'; }
    catch { $('#mt5-kod').select(); d.textContent = 'Seçildi, Ctrl+C'; }
    setTimeout(() => { d.textContent = 'Kopyala'; }, 1500);
  });
  $('#mt5-yeni').addEventListener('click', () => {
    if (!confirm('Yeni kod üretilirse eski kodla çalışan eklentinin bağlantısı kesilir. Yeni kodu MT5\'teki eklentiye yeniden yapıştırman gerekir. Devam edilsin mi?')) return;
    kod = kodUret();
    depo.yaz(KOD_ANAHTARI, kod);
    yenidenKur();
  });
  $('#mt5-role').addEventListener('change', e => {
    const t = e.target.value.trim();
    adres = roleAdresi('', t);
    depo.yaz(ROLE_ANAHTARI, adres === VARSAYILAN_ROLE ? null : adres);
    yenidenKur();
  });
  $('#mt5-seri').addEventListener('change', () => { clearTimeout(zamanlayici); yokla(); });
  document.addEventListener('visibilitychange', () => {
    if (calisiyor && !document.hidden) { clearTimeout(zamanlayici); yokla(); }
  });
  // Sayfadan çıkınca yoklama durur; geri tuşuyla dönülürse (bfcache) kaldığı yerden sürer.
  let istendi = false;
  window.addEventListener('pagehide', () => { calisiyor = false; clearTimeout(zamanlayici); });
  window.addEventListener('pageshow', e => { if (e.persisted && istendi) { calisiyor = true; yokla(); } });

  kurulumYaz();
  return {
    baslat() { istendi = true; if (calisiyor) return; calisiyor = true; yokla(); },
    durdur() { istendi = false; calisiyor = false; clearTimeout(zamanlayici); },
  };
}
