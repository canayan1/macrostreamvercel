// "MetaTrader'ı bağla": röleden belge okuyan istemci ve bağlantı durumunun sınıflanması.
// DOM'a dokunmaz; arayüz lab/src/baglanti-arayuz.js'tedir. Ağ erişimi verilen fetch ile yapılır,
// böylece Node testlerinde sahte bir röle kullanılabilir.
//
// Akış: Lab bir eşleştirme kodu üretir (role.js kodUret), kullanıcı onu MT5'teki KalibreKopru
// eklentisine yapıştırır. Eklenti belgeleri şifreleyip röleye yazar; Lab burada okuyup çözer.
// Kod hiçbir zaman ağa çıkmaz; röleye yalnız koddan türetilmiş kanal ve yuva kimlikleri gider.

import { anahtarlar, yuva, ac } from './role.js';
import { seriCoz, durumCoz, pozisyonCoz } from './kopru.js';

export const VARSAYILAN_ROLE = '/api/kopru';
export const YOKLAMA_SN = { gorunur: 5, gizli: 30 };

// Seri yuvasının adı; eklenti (KalibreKopru.mq5) aynı biçimi kullanır.
export const seriAdi = (sembol, zamanDilimi) => `${sembol}-${zamanDilimi}`;

// Röle adresi: ?role= parametresi > kayıtlı ayar > aynı kökendeki /api/kopru.
// Yalnız http(s) kabul edilir; başka bir şey gelirse varsayılana dönülür.
// Bağlantıyla gelen ?role= yalnız yerel adres olabilir (geliştirme): başkasının gönderdiği
// bir bağlantı tarayıcıyı yabancı bir röleye yönlendirip kanal numarasını öğrenemesin.
// Başka bir röle yalnız gelişmiş ayardaki alana elle yazılarak seçilir.
const YEREL = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?\//i;
const gecerli = t => /^https?:\/\/[^\s]+$/i.test(t) || /^\/[^\s/][^\s]*$/.test(t);
export function roleAdresi(arama = '', kayitli = '') {
  const p = String(new URLSearchParams(arama).get('role') ?? '').trim();
  if (p && gecerli(p) && YEREL.test(p)) return p;
  const k = String(kayitli ?? '').trim();
  if (k && gecerli(k)) return k;
  return VARSAYILAN_ROLE;
}

// MT5'teki izin listesine eklenecek adres: rölenin kökeni (şema + alan adı + port).
export function izinAdresi(adres, sayfa = 'https://kalibremarkets.com/') {
  try { return new URL(adres, sayfa).origin; } catch { return adres; }
}

// Sunucu saati farkı: 10800 → "UTC+3", -16200 → "UTC-4:30".
export function utcEtiket(farkSn) {
  if (typeof farkSn !== 'number' || !Number.isFinite(farkSn)) return 'UTC farkı bilinmiyor';
  const d = Math.round(farkSn / 60);
  const isaret = d < 0 ? '-' : '+';
  const s = Math.floor(Math.abs(d) / 60), dk = Math.abs(d) % 60;
  return `UTC${isaret}${s}${dk ? ':' + String(dk).padStart(2, '0') : ''}`;
}

export class BaglantiHatasi extends Error {
  // tur: 'role' (röleye ulaşılamadı ya da yapılandırılmamış), 'kod' (mühür tutmadı), 'bozuk' (sözleşme dışı)
  constructor(tur, mesaj) { super(mesaj); this.tur = tur; }
}

// Röleden tek bir belge okur. Dönüş: null (henüz yazılmamış) ya da çözülmüş JSON nesnesi.
export function istemci(kod, adres = VARSAYILAN_ROLE, getir = (...a) => fetch(...a)) {
  const hazir = anahtarlar(kod);
  async function oku(tur, ad = '') {
    const a = await hazir;
    const y = await yuva(a, tur, ad);
    const ayrac = adres.includes('?') ? '&' : '?';
    let r;
    try {
      r = await getir(`${adres}${ayrac}k=${a.kanal}&y=${y}`, { cache: 'no-store' });
    } catch {
      throw new BaglantiHatasi('role', 'röleye ulaşılamadı');
    }
    if (r.status === 404) return null;
    if (r.status === 503) throw new BaglantiHatasi('role', 'röle henüz yapılandırılmamış');
    if (r.status !== 200) throw new BaglantiHatasi('role', `röle yanıtı ${r.status}`);
    let z;
    try { z = await r.json(); } catch { throw new BaglantiHatasi('bozuk', 'röle yanıtı JSON değil'); }
    let metin;
    try { metin = await ac(a, y, z); } catch (e) {
      throw new BaglantiHatasi(/mühür/.test(e.message) ? 'kod' : 'bozuk', e.message);
    }
    try { return JSON.parse(metin); } catch { throw new BaglantiHatasi('bozuk', 'belge JSON değil'); }
  }
  return {
    kanal: hazir.then(a => a.kanal),
    async durum(simdi) { const n = await oku('durum'); return n && durumCoz(n, simdi); },
    async pozisyonlar() { const n = await oku('pozisyonlar'); return n && pozisyonCoz(n); },
    async seri(sembol, zamanDilimi, secenek) {
      const n = await oku('seri', seriAdi(sembol, zamanDilimi));
      return n && seriCoz(n, secenek);
    },
  };
}

// Bağlantı durumu, arayüzde tek bir satırla anlatılabilecek biçimde.
// Girdi: { durum } (durumCoz sonucu), { durum: null } (henüz kalp atışı yok) ya da { hata } (BaglantiHatasi).
// Dönüş: { sinif: 'bekleniyor'|'bagli'|'gecikmeli'|'koptu'|'kod'|'role'|'bozuk', baslik, ayrinti }
export function sinifla({ durum, hata } = {}) {
  if (hata) {
    if (hata.tur === 'kod') {
      return { sinif: 'kod', baslik: 'Kod eşleşmiyor', ayrinti: 'Röledeki veri bu kodla açılmadı. MT5\'teki eklentiye bu sayfadaki kodu yapıştırdığından emin ol.' };
    }
    if (hata.tur === 'role') {
      return { sinif: 'role', baslik: 'Röleye ulaşılamıyor', ayrinti: `${hata.message}. Biraz sonra yeniden denenir.` };
    }
    return { sinif: 'bozuk', baslik: 'Okunamayan veri', ayrinti: hata.message };
  }
  if (!durum) {
    return { sinif: 'bekleniyor', baslik: 'Eklenti bekleniyor', ayrinti: 'Henüz MT5\'ten kalp atışı gelmedi.' };
  }
  const yer = [durum.terminal.sirket, durum.terminal.sunucu].filter(Boolean).join(' · ');
  const yas = sureMetni(durum.yas);
  if (durum.tazelik === 'canli') return { sinif: 'bagli', baslik: 'Bağlı', ayrinti: `${yer}. Son kalp atışı ${yas} önce.` };
  if (durum.tazelik === 'gecikmeli') return { sinif: 'gecikmeli', baslik: 'Gecikmeli', ayrinti: `${yer}. Son kalp atışı ${yas} önce; MT5 açık mı?` };
  return { sinif: 'koptu', baslik: 'Bağlantı koptu', ayrinti: `Son kalp atışı ${yas} önce. MT5 kapalı ya da eklenti grafikten kaldırılmış olabilir.` };
}

export function sureMetni(sn) {
  const s = Math.max(0, Math.round(sn));
  if (s < 60) return `${s} sn`;
  if (s < 3600) return `${Math.floor(s / 60)} dk`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa`;
  return `${Math.floor(s / 86400)} gün`;
}

// Yüklü seri tazelenmeli mi? Eklenti yeni bir mum kapandığında seriyi yeniden yazar ve
// durum.seriler[].son ilerler. yuklu: { sembol, zamanDilimi, son } (son: yüklü serinin son mum zamanı).
export function tazelenmeli(yuklu, durum) {
  if (!yuklu || !durum) return false;
  const k = durum.seriler.find(s => s.sembol === yuklu.sembol && s.zamanDilimi === yuklu.zamanDilimi);
  return !!k && typeof k.son === 'number' && k.son > (yuklu.son ?? 0);
}
