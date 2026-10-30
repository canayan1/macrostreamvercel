// "MetaTrader 5'i bağla" sayfası: ürünün girişi. Şifre yoktur; giriş, bu tarayıcının ürettiği
// eşleştirme kodudur (aynı depo anahtarları: baglanti-arayuz.js, panom.js). Dört adım tek
// sayfadadır; bağlantı yoklaması baştan çalışır, kalp atışı gelince hangi adımda olunursa
// olunsun "Bağlandı" denir ve Panom'a geçilir.

import { kodUret } from './veri/role.js';
import { t as ceviri, dil, sayfayiCevir, dilAnahtari } from './dil.js';
import { istemci, sinifla, roleAdresi, izinAdresi, VARSAYILAN_ROLE } from './veri/baglanti.js';
import { KOD_ANAHTARI, ROLE_ANAHTARI, LISANS_ANAHTARI, SON_ANAHTARI, KOD_RE, depo, aktifAdim, cozumMetni, baglanDugmesi, tazeGoruldu } from './baglan-ortak.js';

const YOKLAMA_SN = { gorunur: 3, gizli: 30 };
const YONLENDIRME_SN = 3;
const HESAP = { demo: 'DEMO', gercek: 'GERÇEK HESAP', yarisma: 'YARIŞMA' };
const LISANS_RE = /^KLM(-[0-9A-HJKMNP-TV-Z]{5}){4}$/;

const $ = s => document.querySelector(s);
const en = dil === 'en';
const ek = en ? '' : '?lang=tr';

// ---------------------------------------------------------------- durum
const parametre = new URLSearchParams(location.search).get('role');
if (parametre && roleAdresi(location.search) !== VARSAYILAN_ROLE) depo.yaz(ROLE_ANAHTARI, roleAdresi(location.search));
let kod = depo.oku(KOD_ANAHTARI);
if (!KOD_RE.test(kod ?? '')) { kod = kodUret(); depo.yaz(KOD_ANAHTARI, kod); }
let adres = roleAdresi('', depo.oku(ROLE_ANAHTARI));
let ist = istemci(kod, adres);
let nesil = 0;
const ilerleme = { kuruldu: false, kopyalandi: false, izin: false, sinif: 'bekleniyor' };
let ilkYoklama = true;
let zamanlayici = 0;
let yonlendirme = 0;
let iptal = false;
const lisans = depo.oku(LISANS_ANAHTARI);
const dugme = baglanDugmesi(document.querySelector('.ust-eylem'));
// Tradier sekmesi kaynak değiştirince başlıktaki hap yenilenir (tradier-baglan.js).
document.addEventListener('kalibre-kaynak', () => dugme.guncelle());

// ---------------------------------------------------------------- çizim
function adimlariYaz() {
  const aktif = aktifAdim(ilerleme);
  for (const li of document.querySelectorAll('.adim')) {
    const n = Number(li.dataset.adim);
    const bitti = aktif === 'tamam' || n < aktif;
    li.classList.toggle('tamam', bitti);
    if (n === aktif || (aktif === 'tamam' && n === 4)) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  }
}

function kurulumYaz() {
  $('#kod').value = kod;
  $('#izin').value = izinAdresi(adres, location.href);
  $('#role').value = adres === VARSAYILAN_ROLE ? '' : adres;
}

function durumYaz(d, durum) {
  $('#durum').dataset.sinif = d.sinif;
  $('#durum-baslik').textContent = d.baslik;
  $('#durum-ayrinti').textContent = d.ayrinti;
  $('#durum-cozum').textContent = d.sinif === 'bagli' ? '' : cozumMetni(d.sinif);
  const h = durum && HESAP[durum.terminal.hesapTuru];
  $('#durum-hesap').hidden = !h;
  if (h) {
    $('#durum-hesap').textContent = ceviri(h);
    $('#durum-hesap').className = `rozet ikincil ${durum.terminal.hesapTuru === 'gercek' ? 'gercek' : ''}`;
  }
}

function bagliMetni(durum) {
  const t = durum.terminal;
  const parcalar = [t.sirket, t.sunucu, t.hesapTuru ? ceviri(HESAP[t.hesapTuru]) : null].filter(Boolean);
  return ceviri('Bağlandı: {yer}', { yer: parcalar.join(' · ') });
}

function yonlendir() {
  if (iptal) return;
  let kalan = YONLENDIRME_SN;
  const yaz = () => { $('#yonlendirme-not').textContent = ceviri('{n} saniye sonra Panom açılıyor.', { n: kalan }); };
  yaz();
  clearInterval(yonlendirme);
  yonlendirme = setInterval(() => {
    kalan--;
    if (iptal) { clearInterval(yonlendirme); return; }
    if (kalan <= 0) { clearInterval(yonlendirme); location.href = `dashboard.html${ek}`; return; }
    yaz();
  }, 1000);
}

// ---------------------------------------------------------------- yoklama
async function yokla() {
  zamanlayici = 0;
  const n = nesil;
  let durum = null, h = null;
  try { durum = await ist.durum(); } catch (e) { h = e; }
  if (n !== nesil) return;
  const d = sinifla({ durum, hata: h });
  durumYaz(d, durum);
  const onceki = ilerleme.sinif;
  ilerleme.sinif = d.sinif;
  if (d.sinif === 'bagli') {
    tazeGoruldu();
    dugme.guncelle();
    if (ilkYoklama) {
      // Sayfa açıldığında zaten bağlıysa sihirbaz yerine kısa bir özet gösterilir.
      $('#zaten').hidden = false;
      $('#zaten-ayrinti').textContent = bagliMetni(durum);
      $('#adimlar').hidden = true;
    } else if (onceki !== 'bagli') {
      $('#bagli-metin').textContent = bagliMetni(durum);
      $('#bagli-kutu').hidden = false;
      $('#bagli-kutu').scrollIntoView({ behavior: 'smooth', block: 'center' });
      yonlendir();
    }
  } else {
    $('#bagli-kutu').hidden = true;
    clearInterval(yonlendirme);
  }
  ilkYoklama = false;
  adimlariYaz();
  planla();
}

function planla() {
  clearTimeout(zamanlayici);
  zamanlayici = setTimeout(yokla, 1000 * (document.hidden ? YOKLAMA_SN.gizli : YOKLAMA_SN.gorunur));
}

function yenidenKur() {
  nesil++;
  ist = istemci(kod, adres);
  ilerleme.sinif = 'bekleniyor';
  $('#bagli-kutu').hidden = true;
  durumYaz(sinifla({ durum: null }), null);
  kurulumYaz();
  adimlariYaz();
  clearTimeout(zamanlayici);
  yokla();
}

// ---------------------------------------------------------------- olaylar
async function kopyala(metin, dugme, alan) {
  try { await navigator.clipboard.writeText(metin); dugme.textContent = ceviri('Kopyalandı'); }
  catch { alan.type = 'text'; alan.select(); dugme.textContent = ceviri('Seçildi, Ctrl+C'); }
  setTimeout(() => { dugme.textContent = ceviri('Kopyala'); }, 1500);
}

$('#kod-kopyala').addEventListener('click', async () => {
  await kopyala(kod, $('#kod-kopyala'), $('#kod'));
  ilerleme.kuruldu = true;
  ilerleme.kopyalandi = true;
  adimlariYaz();
});
$('#kod-goster').addEventListener('click', () => {
  const gizli = $('#kod').type === 'password';
  $('#kod').type = gizli ? 'text' : 'password';
  $('#kod-goster').textContent = ceviri(gizli ? 'Gizle' : 'Göster');
});
$('#kod-yeni').addEventListener('click', () => {
  if (!confirm(ceviri("Yeni kod üretilirse eski kodla çalışan eklentinin bağlantısı kesilir. Yeni kodu MT5'teki eklentiye yeniden yapıştırman gerekir. Devam edilsin mi?"))) return;
  kod = kodUret();
  depo.yaz(KOD_ANAHTARI, kod);
  depo.yaz(SON_ANAHTARI, null);
  ilerleme.kopyalandi = false;
  dugme.guncelle();
  yenidenKur();
});
$('#izin-kopyala').addEventListener('click', () => kopyala($('#izin').value, $('#izin-kopyala'), $('#izin')));
$('#role').addEventListener('change', e => {
  adres = roleAdresi('', e.target.value.trim());
  depo.yaz(ROLE_ANAHTARI, adres === VARSAYILAN_ROLE ? null : adres);
  yenidenKur();
});
for (const b of document.querySelectorAll('[data-ilerle]')) {
  b.addEventListener('click', () => {
    const n = Number(b.dataset.ilerle);
    if (n >= 1) ilerleme.kuruldu = true;
    if (n >= 3) { ilerleme.kopyalandi = true; ilerleme.izin = true; }
    adimlariYaz();
    document.querySelector(`.adim[data-adim="${n + 1}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
$('#yonlendirme-iptal').addEventListener('click', () => {
  iptal = true;
  clearInterval(yonlendirme);
  $('#yonlendirme-not').textContent = ceviri('Yönlendirme iptal edildi.');
});
$('#kes').addEventListener('click', () => {
  if (!confirm(ceviri("Kod bu tarayıcıdan silinir. MT5'teki eklenti çalışmaya devam eder ama verisi, yeni bir kod üretip eklentiye yapıştırana kadar burada açılamaz. Devam edilsin mi?"))) return;
  depo.yaz(KOD_ANAHTARI, null);
  depo.yaz(SON_ANAHTARI, null);
  kod = kodUret();
  depo.yaz(KOD_ANAHTARI, kod);
  Object.assign(ilerleme, { kuruldu: false, kopyalandi: false, izin: false });
  $('#zaten').hidden = true;
  $('#adimlar').hidden = false;
  dugme.guncelle();
  yenidenKur();
});
$('#yeniden-kur').addEventListener('click', () => {
  $('#adimlar').hidden = false;
  $('#yeniden-kur').hidden = true;
});

// Lisans: varsa eklenti buradan indirilir ve anahtar 2. adımda kopyalanabilir.
if (LISANS_RE.test(lisans ?? '')) {
  $('#lisans-var').hidden = false;
  $('#lisans-yok').hidden = true;
  $('#lisans-alan').hidden = false;
  $('#lisans').value = lisans;
  $('#lisans-kopyala').addEventListener('click', () => kopyala(lisans, $('#lisans-kopyala'), $('#lisans')));
  $('#eklenti-indir').addEventListener('click', async () => {
    const b = $('#eklenti-indir'), d = $('#indir-durum');
    b.disabled = true; d.textContent = '';
    try {
      const r = await fetch('/api/indir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anahtar: lisans, eklenti: 'kopru', dil }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); d.textContent = j.hata || ceviri('İndirilemedi.'); }
      else {
        const ad = (r.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(await r.blob());
        a.download = ad ? ad[1] : 'KalibreKopru.ex5';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        d.textContent = ceviri('{d} indirildi. Dosyayı MT5 veri klasöründe {yol} altına kopyala.', { d: a.download, yol: 'MQL5\\Experts' });
      }
    } catch { d.textContent = ceviri('Bağlantı kurulamadı.'); }
    b.disabled = false;
  });
}

// Bağlantılar dile göre (site kökü İngilizce, Türkçe /tr altında).
$('#abone-baglanti').href = en ? '/pricing' : '/tr/pricing';
$('#lisans-baglanti').href = en ? '/account' : '/tr/account';
for (const id of ['#zaten-panom', '#panoma-git', '#git-panom']) $(id).href = `dashboard.html${ek}`;
$('#git-kurucu').href = `./${ek}`;

// ---------------------------------------------------------------- başlat
sayfayiCevir();
dilAnahtari(document.querySelector('.ust-eylem'));
kurulumYaz();
adimlariYaz();
document.addEventListener('visibilitychange', () => { if (!document.hidden) { clearTimeout(zamanlayici); yokla(); } });
window.addEventListener('pagehide', () => { clearTimeout(zamanlayici); clearInterval(yonlendirme); });
yokla();
