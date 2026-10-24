// Bağlantı sayfasında "Tradier (ABD)" sekmesi: token ile bağlanır, hesap seçtirir, ayarı bu tarayıcıda
// saklar ve Tradier'i etkin kaynak yapar. Token yalnız Tradier'e gider (veri/tradier.js).

import { t as ceviri, dil } from './dil.js';
import {
  tradierIstemci, tradierAdresi, tradierOku, tradierYaz, kaynakYaz, etkinKaynak, maskeliHesap, TRADIER_ADRES,
} from './veri/tradier.js';

const $ = s => document.querySelector(s);
const kacis = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const main = document.querySelector('main.baglan');
const ek = dil === 'en' ? '?dil=en' : '';
let profil = null, bekleyen = null;

function sekme(k) {
  main.dataset.kaynak = k;
  for (const b of document.querySelectorAll('[data-kaynak]')) b.setAttribute('aria-selected', String(b.dataset.kaynak === k));
}

function ortamAdi(o) { return o === 'canli' ? ceviri('Canlı') : 'Sandbox'; }

function bagliGoster(a) {
  $('#t-bagli').hidden = !a;
  $('#t-hesaplar').hidden = true;
  if (!a) return;
  $('#t-bagli-metin').textContent = ceviri('Bağlandı: {yer}', { yer: ['Tradier', ortamAdi(a.ortam), maskeliHesap(a.hesap)].join(' · ') });
  $('#t-ortam').value = a.ortam;
  $('#t-token').value = '';
  $('#t-token').placeholder = ceviri('Kayıtlı (değiştirmek için yenisini yapıştır)');
}

async function baglan() {
  const token = $('#t-token').value.trim();
  const ortam = $('#t-ortam').value;
  if (!token) { $('#t-durum').textContent = ceviri('Önce Tradier token\'ını yapıştır.'); return; }
  const adres = tradierAdresi(ortam, location.search);
  $('#t-durum').textContent = ceviri('Tradier\'e bağlanılıyor…');
  $('#t-baglan').disabled = true;
  try {
    const ist = tradierIstemci({ token, ortam, adres });
    profil = await ist.profil();
    if (!profil.hesaplar.length) { $('#t-durum').textContent = ceviri('Bu token\'a bağlı hesap bulunamadı.'); return; }
    bekleyen = { token, ortam, adres: adres !== TRADIER_ADRES[ortam] ? adres : undefined };
    $('#t-hesap').innerHTML = profil.hesaplar.map(h => `<option value="${kacis(h.numara)}">${kacis(maskeliHesap(h.numara))} · ${kacis(h.tur)}${h.durum && h.durum !== 'active' ? ` (${kacis(h.durum)})` : ''}</option>`).join('');
    $('#t-hesaplar').hidden = false;
    $('#t-durum').textContent = profil.hesaplar.length === 1 ? ceviri('1 hesap bulundu.') : ceviri('{n} hesap bulundu; birini seç.', { n: profil.hesaplar.length });
    if (profil.hesaplar.length === 1) kaydet();
  } catch (e) {
    $('#t-durum').textContent = e.message;
  } finally {
    $('#t-baglan').disabled = false;
  }
}

function kaydet() {
  if (!bekleyen) return;
  const a = { ...bekleyen, hesap: $('#t-hesap').value };
  tradierYaz(a);
  kaynakYaz('tradier');
  bekleyen = null;
  $('#t-durum').textContent = '';
  bagliGoster(a);
  document.dispatchEvent(new Event('kalibre-kaynak'));
}

function kes() {
  if (!confirm(ceviri('Tradier token\'ı bu tarayıcıdan silinecek. Tradier hesabın etkilenmez. Devam edilsin mi?'))) return;
  tradierYaz(null);
  kaynakYaz('mt5');
  bagliGoster(null);
  $('#t-token').placeholder = '';
  $('#t-durum').textContent = ceviri('Bağlantı kesildi; token bu tarayıcıdan silindi.');
  document.dispatchEvent(new Event('kalibre-kaynak'));
}

// ---------------------------------------------------------------- başlat
for (const b of document.querySelectorAll('[data-kaynak]')) b.addEventListener('click', () => sekme(b.dataset.kaynak));
$('#t-goster').addEventListener('click', () => {
  const g = $('#t-token').type === 'password';
  $('#t-token').type = g ? 'text' : 'password';
  $('#t-goster').textContent = g ? ceviri('Gizle') : ceviri('Göster');
});
$('#t-baglan').addEventListener('click', baglan);
$('#t-token').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); baglan(); } });
$('#t-kaydet').addEventListener('click', kaydet);
$('#t-kes').addEventListener('click', kes);
$('#t-panom').href = `panom.html${ek}`;

const istenen = new URLSearchParams(location.search).get('kaynak');
sekme(istenen === 'tradier' || (!istenen && etkinKaynak() === 'tradier') ? 'tradier' : 'mt5');
bagliGoster(tradierOku());
