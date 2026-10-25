// Bağlantı sayfası ve başlıklardaki "Bağlan / Bağlı" düğmesinin ortak parçaları.
// Tarayıcı deposu anahtarları baglanti-arayuz.js ve panom.js ile aynıdır: hepsi aynı
// eşleştirmeyi görür. Saf işlevler (bagliMi, aktifAdim) Node testlerinde de çalışır.

import { t as ceviri, dil } from './dil.js';
import { etkinKaynak } from './veri/tradier.js';

export const KOD_ANAHTARI = 'kalibre-kopru-kod';
export const ROLE_ANAHTARI = 'kalibre-kopru-role';
export const SON_ANAHTARI = 'kalibre-kopru-son';        // son taze kalp atışının görüldüğü an (ms)
export const LISANS_ANAHTARI = 'kalibre-lisans-anahtari'; // /hesap (Lisansım) sayfasının anahtarı
export const BAGLI_PENCERE_SN = 300;
export const KOD_RE = /^KLB1[0-9a-f]{64}$/i;

// Tarayıcı deposu yoksa (gizli pencere, engellenmiş site verisi) sayfalar yine çalışır.
export const depo = {
  oku(k) { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } },
  yaz(k, v) { try { if (v == null || v === '') globalThis.localStorage?.removeItem(k); else globalThis.localStorage?.setItem(k, v); } catch { /* depo yok */ } },
};

// Başlıktaki hap "Bağlı" der mi? Kod varsa ve son taze kalp atışı 5 dakikadan yeniyse.
export function bagliMi(kodVar, sonMs, simdiMs = Date.now(), pencereSn = BAGLI_PENCERE_SN) {
  const son = Number(sonMs);
  return !!kodVar && Number.isFinite(son) && son > 0 && simdiMs - son <= pencereSn * 1000 && simdiMs >= son - 60_000;
}

// Bağlantı sayfasında vurgulanacak adım: 1 eklenti, 2 kod, 3 izin, 4 bekleme, 'tamam' bağlı.
// Kullanıcının işaretledikleri sırayla ilerler; bağlantı geldiyse hangi adımda olursa olsun biter.
export function aktifAdim({ kuruldu = false, kopyalandi = false, izin = false, sinif = 'bekleniyor' } = {}) {
  if (sinif === 'bagli') return 'tamam';
  if (!kuruldu) return 1;
  if (!kopyalandi) return 2;
  if (!izin) return 3;
  return 4;
}

// Bağlantı durumu sınıfına göre ne yapılmalı (sinifla() sonucunun yanına yazılır).
export function cozumMetni(sinif) {
  switch (sinif) {
    case 'kod': return ceviri("Eklentideki kod bu sayfadakiyle aynı değil. 2. adımdaki kodu yeniden kopyala ve eklentinin Inputs sekmesindeki Eşleştirme kodu satırına yapıştır.");
    case 'role': return ceviri('Kalibre sunucusuna ulaşılamıyor. İnternet bağlantını kontrol et; sorun sürerse bize yaz.');
    case 'bozuk': return ceviri('Gelen veri okunamadı. Eklentinin son sürümünü indirip yeniden kur.');
    case 'koptu': return ceviri("MetaTrader 5 açık mı? Eklenti grafikte duruyor mu? Bilgisayar uykuya geçtiyse MT5 açılınca bağlantı kendiliğinden döner.");
    case 'gecikmeli': return ceviri('Veri geliyor ama gecikmeli. MT5 açıksa birkaç saniye içinde düzelir.');
    case 'bekleniyor': return ceviri("Eklenti henüz bir şey göndermedi. Grafiğin sol üstünde \"WebRequest izni yok\" yazıyorsa 3. adımı tekrarla; \"lisans geçersiz\" yazıyorsa lisans anahtarını kontrol et.");
    default: return '';
  }
}

// Başlıklara "Bağlan" ya da yeşil "Bağlı" düğmesi koyar. guncelle() ile yeniden çizilir.
export function baglanDugmesi(yer) {
  if (!yer || !globalThis.document) return { guncelle() {} };
  const a = globalThis.document.createElement('a');
  a.href = `baglan.html${dil === 'tr' ? '?dil=tr' : ''}`;
  function guncelle() {
    // Aracı kurum (Tradier, Alpaca) etkin kaynaksa ayarın kayıtlı olması yeter (yoklama doğrudan kuruma
    // gider, kalp atışı yoktur).
    const k = etkinKaynak();
    const araci = k === 'tradier' || k === 'alpaca';
    const bagli = araci || bagliMi(KOD_RE.test(depo.oku(KOD_ANAHTARI) ?? ''), depo.oku(SON_ANAHTARI));
    a.className = bagli ? 'baglan-hap' : 'dugme ikincil';
    a.textContent = bagli ? ceviri('Bağlı') : ceviri('Bağlan');
    a.title = k === 'tradier' ? ceviri('Tradier bağlı. Bağlantı ayarları için tıkla.')
      : k === 'alpaca' ? ceviri('Alpaca bağlı. Bağlantı ayarları için tıkla.')
      : bagli ? ceviri('MetaTrader bağlı. Bağlantı ayarları için tıkla.') : ceviri("MetaTrader 5'i bağla");
  }
  guncelle();
  yer.prepend(a);
  return { guncelle };
}

// Taze kalp atışı görüldüğünde çağrılır: başlık hapı diğer sayfalarda da "Bağlı" der.
export function tazeGoruldu() { depo.yaz(SON_ANAHTARI, String(Date.now())); }
