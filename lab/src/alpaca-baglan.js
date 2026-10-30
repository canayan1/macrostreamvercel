// Bağlantı sayfasında "Alpaca (ABD)" sekmesi: anahtar kimliği ve gizli anahtarla bağlanır, hesabı
// doğrular, ayarı bu tarayıcıda saklar ve Alpaca'yı etkin kaynak yapar. Anahtarlar yalnız Alpaca'ya
// gider (veri/alpaca.js). Sekme geçişi tradier-baglan.js'tedir.

import { t as ceviri, dil } from './dil.js';
import { alpacaIstemci, alpacaAdresi, alpacaOku, alpacaYaz, ALPACA_ADRES } from './veri/alpaca.js';
import { kaynakYaz, maskeliHesap } from './veri/tradier.js';

const $ = s => document.querySelector(s);
const ek = dil === 'tr' ? '?lang=tr' : '';
const ortamAdi = o => (o === 'canli' ? ceviri('Canlı') : 'Paper');
const para = (v, p) => (v === null ? '' : `${v.toLocaleString(dil === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${p}`);

function bagliGoster(a, bilgi = null) {
  $('#a-bagli').hidden = !a;
  if (!a) return;
  const ayrinti = bilgi ? [maskeliHesap(bilgi.numara), bilgi.durum, para(bilgi.varlik, bilgi.para)].filter(Boolean).join(' · ') : '';
  $('#a-bagli-metin').textContent = ceviri('Bağlandı: {yer}', { yer: ['Alpaca', ortamAdi(a.ortam), ayrinti].filter(Boolean).join(' · ') });
  $('#a-ortam').value = a.ortam;
  $('#a-anahtar').value = ''; $('#a-sir').value = '';
  $('#a-anahtar').placeholder = ceviri('Kayıtlı (değiştirmek için yenisini yapıştır)');
  $('#a-sir').placeholder = ceviri('Kayıtlı (değiştirmek için yenisini yapıştır)');
  canliUyari();
}

function canliUyari() { $('#a-canli-uyari').hidden = $('#a-ortam').value !== 'canli'; }

async function baglan() {
  const anahtar = $('#a-anahtar').value.trim(), sir = $('#a-sir').value.trim();
  const ortam = $('#a-ortam').value;
  if (!anahtar || !sir) { $('#a-durum').textContent = ceviri('Önce anahtar kimliğini ve gizli anahtarı yapıştır.'); return; }
  const adres = alpacaAdresi(ortam, location.search);
  const gelistirme = adres.islem !== ALPACA_ADRES[ortam].islem ? adres.islem : undefined;
  $('#a-durum').textContent = ceviri("Alpaca'ya bağlanılıyor…");
  $('#a-baglan').disabled = true;
  try {
    const bilgi = await alpacaIstemci({ anahtar, sir, ortam, adres }).hesap();
    const a = { anahtar, sir, ortam, ...(gelistirme ? { adres: gelistirme } : {}) };
    alpacaYaz(a);
    kaynakYaz('alpaca');
    $('#a-durum').textContent = '';
    bagliGoster(a, bilgi);
    document.dispatchEvent(new Event('kalibre-kaynak'));
  } catch (e) {
    $('#a-durum').textContent = e.message;
  } finally {
    $('#a-baglan').disabled = false;
  }
}

function kes() {
  if (!confirm(ceviri('Alpaca anahtarları bu tarayıcıdan silinecek. Alpaca hesabın etkilenmez. Devam edilsin mi?'))) return;
  alpacaYaz(null);
  kaynakYaz('mt5');
  bagliGoster(null);
  $('#a-anahtar').placeholder = ''; $('#a-sir').placeholder = '';
  $('#a-durum').textContent = ceviri('Bağlantı kesildi; anahtarlar bu tarayıcıdan silindi.');
  document.dispatchEvent(new Event('kalibre-kaynak'));
}

// ---------------------------------------------------------------- başlat
$('#a-goster').addEventListener('click', () => {
  const g = $('#a-anahtar').type === 'password';
  for (const id of ['#a-anahtar', '#a-sir']) $(id).type = g ? 'text' : 'password';
  $('#a-goster').textContent = g ? ceviri('Gizle') : ceviri('Göster');
});
$('#a-ortam').addEventListener('change', canliUyari);
$('#a-baglan').addEventListener('click', baglan);
for (const id of ['#a-anahtar', '#a-sir']) $(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); baglan(); } });
$('#a-kes').addEventListener('click', kes);
$('#a-panom').href = `dashboard.html${ek}`;
bagliGoster(alpacaOku());
