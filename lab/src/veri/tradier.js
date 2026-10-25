// Tradier (ABD aracı kurumu) istemcisi. Ayrıntılar ve doğrulanan bilgiler: docs/tradier.md
//
// Tarayıcıdan doğrudan Tradier'e gider (Tradier CORS'u destekler); token yalnız bu tarayıcıda durur ve
// yalnız Tradier'e gönderilir. Yalnız okur: hiçbir emir uç noktası çağrılmaz.
//
// Röle istemcisiyle (baglanti.js istemci) AYNI arayüzü sunar: durum(), kotalar(), pozisyonlar(),
// islemler(), seri(sembol, zamanDilimi). Tradier yanıtları köprü sözleşmesi belgelerine (docs/kopru.md)
// çevrilir ve aynı çözücülerden geçer; Panom, kurucu ve optimizasyon paneli özel durum bilmez.

import { t as ceviri } from '../dil.js';
import { BaglantiHatasi } from './baglanti.js';
import { durumCoz, kotaCoz, pozisyonCoz, islemCoz, seriCoz } from './kopru.js';

export const TRADIER_ADRES = { sandbox: 'https://sandbox.tradier.com/v1', canli: 'https://api.tradier.com/v1' };
export const TRADIER_ANAHTARI = 'kalibre-tradier';
export const KAYNAK_ANAHTARI = 'kalibre-kaynak';

// tur: 'token' (401), 'sinir' (hız sınırı), 'erisim' (403), 'yok' (404), 'role' (ağ), 'bozuk' (beklenmeyen yanıt)
export class TradierHatasi extends BaglantiHatasi {
  constructor(tur, mesaj, bekleMs = 0) { super(tur, mesaj); this.bekleMs = bekleMs; }
}

// Tradier JSON'u XML'den çevrildiği için tek öğeli liste çıplak nesne, boş liste null ya da "null" gelebilir.
export function dizi(v) {
  if (v === undefined || v === null || v === 'null' || v === '') return [];
  return Array.isArray(v) ? v : [v];
}
const sayi = v => (typeof v === 'number' && Number.isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null));

// Geliştirmede sahte sunucu: ?tradier=http://127.0.0.1:8797/v1 yalnız yerel sayfada kabul edilir
// (röle adresindeki ?role= kuralıyla aynı: başkasının gönderdiği bir bağlantı token'ı başka yere yollatamasın).
export function tradierAdresi(ortam = 'sandbox', arama = '', sayfaHost = globalThis.location?.hostname ?? '') {
  const p = new URLSearchParams(arama).get('tradier');
  const yerelSayfa = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(sayfaHost);
  if (p && yerelSayfa && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/[^\s]*$/.test(p)) return p.replace(/\/$/, '');
  return TRADIER_ADRES[ortam] ?? TRADIER_ADRES.sandbox;
}

// ------------------------------------------------------------------ zaman
// ABD Doğu saati (New York): yaz saati Mart'ın 2. pazarı 02:00 yerel (07:00 UTC) ile Kasım'ın 1. pazarı
// 02:00 yerel (06:00 UTC) arası UTC-4, diğer zamanlar UTC-5.
function nPazar(yil, ay, n) {
  const ilk = new Date(Date.UTC(yil, ay - 1, 1)).getUTCDay();
  return 1 + ((7 - ilk) % 7) + (n - 1) * 7;
}
export function nyFarkiSn(utcSn) {
  const y = new Date(utcSn * 1000).getUTCFullYear();
  const bas = Date.UTC(y, 2, nPazar(y, 3, 2), 7) / 1000;
  const bit = Date.UTC(y, 10, nPazar(y, 11, 1), 6) / 1000;
  return utcSn >= bas && utcSn < bit ? -4 * 3600 : -5 * 3600;
}
// "YYYY-MM-DD HH:MM[:SS]" (New York yerel) → UTC saniye
export function nyYereldenUtc(metin) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(metin));
  if (!m) return null;
  const yalin = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)) / 1000;
  const tahmin = yalin + 5 * 3600;                // önce kış saati varsay
  return yalin - nyFarkiSn(tahmin);               // fark yaz saatini gösteriyorsa düzelt
}
// "YYYY-MM-DD" → o takvim gününün 00:00 UTC'si (günlük mumda gün kaymasın)
export function gunUtc(metin) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(metin));
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 1000 : null;
}
// Maliyet/miktar bölümünden gelen fiyatlar 4 ondalığa yuvarlanır (Tradier fiyatı kuruş, kesirli hisse dört ondalık).
const yuvarla4 = x => Math.round(x * 1e4) / 1e4;
const isoSn = v => { const t = Date.parse(v); return Number.isFinite(t) ? Math.floor(t / 1000) : null; };
const ymd = sn => new Date(sn * 1000).toISOString().slice(0, 10);

// ------------------------------------------------------------------ belge üreticileri (saf)
const SINIF = { stock: 'hisse', etf: 'hisse', index: 'endeks', option: 'diger', mutual_fund: 'diger' };

export function kotaBelgesi(quotesJson, simdi = Math.floor(Date.now() / 1000)) {
  const kotalar = [];
  for (const q of dizi(quotesJson?.quotes?.quote)) {
    if (!q || typeof q.symbol !== 'string') continue;
    const son = sayi(q.last), bid = sayi(q.bid), ask = sayi(q.ask);
    // Seans dışında alış/satış 0 gelebilir: o zaman son fiyat kullanılır.
    const alis = bid > 0 ? bid : son, satis = ask > 0 ? ask : son;
    kotalar.push({
      sembol: q.symbol, tanim: typeof q.description === 'string' ? q.description : '', sinif: SINIF[q.type] ?? 'diger',
      basamak: (son ?? alis ?? 0) < 1 ? 4 : 2, nokta: (son ?? alis ?? 0) < 1 ? 0.0001 : 0.01,
      alis, satis,
      zaman: sayi(q.trade_date) ? Math.floor(sayi(q.trade_date) / 1000) : undefined,
      gunAcilis: sayi(q.open) ?? undefined, gunYuksek: sayi(q.high) ?? undefined, gunDusuk: sayi(q.low) ?? undefined,
      oncekiKapanis: sayi(q.prevclose) ?? undefined,
    });
  }
  return { kalibre_kopru: 1, tur: 'kotalar', uretildi: simdi, kotalar };
}

export function pozisyonBelgesi(positionsJson, kotaHaritasi = new Map(), balancesJson = null, simdi = Math.floor(Date.now() / 1000)) {
  const pozisyonlar = [];
  for (const p of dizi(positionsJson?.positions?.position)) {
    const miktar = sayi(p?.quantity), maliyet = sayi(p?.cost_basis);
    if (!p || typeof p.symbol !== 'string' || !miktar || maliyet === null) continue;
    const lot = Math.abs(miktar), acilis = Math.abs(maliyet) / lot;
    const son = kotaHaritasi.get(p.symbol) ?? acilis;
    const kar = miktar > 0 ? son * lot - Math.abs(maliyet) : Math.abs(maliyet) - son * lot;
    pozisyonlar.push({
      bilet: Number.isInteger(p.id) ? p.id : undefined, sembol: p.symbol, yon: miktar > 0 ? 'al' : 'sat', lot,
      acilisZamani: isoSn(p.date_acquired) ?? simdi, acilisFiyati: yuvarla4(acilis), guncelFiyat: son,
      kar: Math.round(kar * 100) / 100,
    });
  }
  const b = balancesJson?.balances ?? {};
  const varlik = sayi(b.total_equity), acikKar = sayi(b.open_pl);
  return {
    kalibre_kopru: 1, tur: 'pozisyonlar', uretildi: simdi, para: 'USD',
    // MT5'teki "bakiye" gerçekleşmiş tutardır: varlık - açık kâr/zarar.
    bakiye: varlik !== null ? varlik - (acikKar ?? 0) : undefined, varlik: varlik ?? undefined,
    pozisyonlar,
  };
}

// gainloss satırı yön vermez: quantity > 0 → al, < 0 → sat (docs/tradier.md).
export function islemBelgesi(gainlossJsonlar, { gun = 90, simdi = Math.floor(Date.now() / 1000) } = {}) {
  const sinir = simdi - gun * 86400;
  const islemler = [];
  for (const j of dizi(gainlossJsonlar)) {
    for (const g of dizi(j?.gainloss?.closed_position)) {
      const miktar = sayi(g?.quantity), maliyet = sayi(g?.cost), gelir = sayi(g?.proceeds), kar = sayi(g?.gain_loss);
      const acilis = isoSn(g?.open_date), kapanis = isoSn(g?.close_date);
      if (!g || typeof g.symbol !== 'string' || !miktar || maliyet === null || gelir === null || kar === null || !acilis || !kapanis) continue;
      if (kapanis < sinir) continue;
      const lot = Math.abs(miktar);
      islemler.push({
        sembol: g.symbol, yon: miktar > 0 ? 'al' : 'sat', lot,
        acilisZamani: acilis, acilisFiyati: yuvarla4(Math.abs(maliyet) / lot), kapanisZamani: Math.max(kapanis, acilis),
        kapanisFiyati: yuvarla4(Math.abs(gelir) / lot), kar, komisyon: 0, swap: 0,
      });
    }
  }
  return { kalibre_kopru: 1, tur: 'islemler', uretildi: simdi, para: 'USD', gunSayisi: gun, islemler, bakiyeHareketleri: [] };
}

const ARALIK = { D1: 'daily', W1: 'weekly', M1: '1min', M5: '5min', M15: '15min' };
export const TRADIER_ZAMAN_DILIMLERI = Object.keys(ARALIK);

export function seriBelgesi(sembol, json, zamanDilimi, simdi = Math.floor(Date.now() / 1000)) {
  let mumlar;
  if (zamanDilimi === 'D1' || zamanDilimi === 'W1') {
    mumlar = dizi(json?.history?.day).map(d => [gunUtc(d?.date), sayi(d?.open), sayi(d?.high), sayi(d?.low), sayi(d?.close), sayi(d?.volume) ?? 0]);
  } else {
    mumlar = dizi(json?.series?.data).map(d => [nyYereldenUtc(d?.time), sayi(d?.open), sayi(d?.high), sayi(d?.low), sayi(d?.close), sayi(d?.volume) ?? 0]);
  }
  return {
    kalibre_kopru: 1, tur: 'seri', kaynak: 'tradier', sembol, zamanDilimi, uretildi: simdi,
    meta: { sinif: 'hisse', takvim: 'borsa', nokta: 0.01, basamak: 2, hacimTuru: 'gercek' },
    alanlar: ['t', 'a', 'y', 'd', 'k', 'h'], mumlar,
  };
}

export function durumBelgesi({ ortam = 'sandbox', hesap = null, seriler = [], simdi = Math.floor(Date.now() / 1000) } = {}) {
  return {
    kalibre_kopru: 1, tur: 'durum', kaynak: 'tradier', uretildi: simdi, yazmaAraligiSn: 15,
    terminal: { sirket: 'Tradier', sunucu: [ortam === 'canli' ? 'Live' : 'Sandbox', maskeliHesap(hesap)].filter(Boolean).join(' · '), hesapTuru: ortam === 'canli' ? 'gercek' : 'demo' },
    sunucuUtcFarkiSn: 0, seriler, pozisyonlarVar: true, kotalarVar: true, islemlerVar: true,
  };
}

// ------------------------------------------------------------------ istemci
// getir: fetch ile aynı imza (testte sahte sunucuya bağlanır). Token hiçbir yerde günlüğe yazılmaz.
export function tradierIstemci({ token, ortam = 'sandbox', hesap = null, adres, getir = (...a) => fetch(...a), saat = () => Math.floor(Date.now() / 1000) } = {}) {
  if (!token) throw new TradierHatasi('token', ceviri('Tradier token girilmedi.'));
  const kok = adres ?? TRADIER_ADRES[ortam] ?? TRADIER_ADRES.sandbox;
  let bekleSonu = 0;

  async function al(yol, q = {}) {
    if (Date.now() < bekleSonu) throw new TradierHatasi('sinir', ceviri('Tradier hız sınırına ulaşıldı; {n} sn sonra yeniden denenecek.', { n: Math.ceil((bekleSonu - Date.now()) / 1000) }), bekleSonu - Date.now());
    const s = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    const url = `${kok}${yol}${s.toString() ? '?' + s : ''}`;
    let r;
    try {
      r = await getir(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' });
    } catch {
      throw new TradierHatasi('role', ceviri("Tradier'e ulaşılamadı. İnternet bağlantını kontrol et."));
    }
    const metin = await r.text();
    if (r.status === 429 || (r.status === 400 && /Quota Violation/i.test(metin))) {
      const m = /Expires\s+(\d{10,})/i.exec(metin);
      const bitis = m ? Number(m[1]) : Date.now() + 60_000;
      bekleSonu = Math.min(bitis, Date.now() + 120_000);
      throw new TradierHatasi('sinir', ceviri('Tradier hız sınırına ulaşıldı; {n} sn sonra yeniden denenecek.', { n: Math.ceil((bekleSonu - Date.now()) / 1000) }), bekleSonu - Date.now());
    }
    if (r.status === 401) throw new TradierHatasi('token', ceviri('Tradier token geçersiz ya da bu ortama ait değil (sandbox token canlı adreste, canlı token sandbox adresinde çalışmaz).'));
    if (r.status === 403) throw new TradierHatasi('erisim', ceviri('Tradier bu bilgiye erişim izni vermedi.'));
    if (r.status === 404) throw new TradierHatasi('yok', ceviri('Tradier bu kaydı bulamadı (hesap numarasını kontrol et).'));
    if (r.status < 200 || r.status >= 300) throw new TradierHatasi('bozuk', ceviri('Tradier yanıtı {k}', { k: r.status }));
    try { return JSON.parse(metin); } catch { throw new TradierHatasi('bozuk', ceviri('Tradier yanıtı JSON değil')); }
  }
  const hesapGerek = () => { if (!hesap) throw new TradierHatasi('yok', ceviri('Tradier hesabı seçilmedi.')); return encodeURIComponent(hesap); };

  // Basit önbellek: aynı veri kısa sürede tekrar istenmesin (hız sınırı dakikada 60/120).
  const onbellek = new Map();
  async function bellek(anahtar, sureSn, uret) {
    const v = onbellek.get(anahtar);
    if (v && saat() - v.zaman < sureSn) return v.deger;
    const deger = await uret();
    onbellek.set(anahtar, { zaman: saat(), deger });
    return deger;
  }

  const ham = {
    profil: () => al('/user/profile'),
    bakiye: () => al(`/accounts/${hesapGerek()}/balances`),
    pozisyonlar: () => al(`/accounts/${hesapGerek()}/positions`),
    gerceklesen: (sayfa = 1) => al(`/accounts/${hesapGerek()}/gainloss`, { page: sayfa, limit: 1000, sortBy: 'closedate', sort: 'desc' }),
    izlemeListeleri: () => al('/watchlists'),
    izlemeListesi: id => al(`/watchlists/${encodeURIComponent(id)}`),
    kotalar: semboller => al('/markets/quotes', { symbols: semboller.join(','), greeks: 'false' }),
    gecmis: (sembol, aralik, bas, bit) => al('/markets/history', { symbol: sembol, interval: aralik, start: bas, end: bit }),
    zamanSatis: (sembol, aralik, bas, bit) => al('/markets/timesales', { symbol: sembol, interval: aralik, start: bas, end: bit, session_filter: 'open' }),
    saat: () => al('/markets/clock'),
  };

  async function profil() {
    const j = await ham.profil();
    const p = j?.profile ?? {};
    return {
      ad: typeof p.name === 'string' ? p.name : '',
      hesaplar: dizi(p.account).filter(a => a && a.account_number).map(a => ({
        numara: String(a.account_number), tur: a.type ?? '', sinif: a.classification ?? '', durum: a.status ?? '',
      })),
    };
  }

  // İzlenen semboller: ilk izleme listesi; yoksa açık pozisyonların sembolleri.
  async function izlenenSemboller() {
    return bellek('semboller', 300, async () => {
      const listeler = dizi((await ham.izlemeListeleri())?.watchlists?.watchlist).filter(w => w && w.id);
      for (const w of listeler) {
        const ayrinti = await ham.izlemeListesi(w.id);
        const s = dizi(ayrinti?.watchlist?.items?.item).map(i => i?.symbol).filter(x => typeof x === 'string');
        if (s.length) return [...new Set(s)].slice(0, 40);
      }
      if (!hesap) return [];
      return [...new Set(dizi((await ham.pozisyonlar())?.positions?.position).map(p => p?.symbol).filter(Boolean))].slice(0, 40);
    });
  }

  async function kotaJson(semboller) {
    if (!semboller.length) return { quotes: null };
    return bellek(`kota:${semboller.join(',')}`, 15, () => ham.kotalar(semboller));
  }

  return {
    ortam, hesap, kaynak: 'tradier',
    profil, izlenenSemboller,
    async durum() {
      const semboller = await izlenenSemboller();
      const seriler = semboller.slice(0, 40).map(s => ({ sembol: s, zamanDilimi: 'D1', adet: null, son: null }));
      return durumCoz(durumBelgesi({ ortam, hesap, seriler, simdi: saat() }), saat());
    },
    async kotalar() {
      return kotaCoz(kotaBelgesi(await kotaJson(await izlenenSemboller()), saat()));
    },
    async pozisyonlar() {
      const [pj, bj] = await bellek('poz', 15, async () => [await ham.pozisyonlar(), await ham.bakiye()]);
      const semboller = [...new Set(dizi(pj?.positions?.position).map(p => p?.symbol).filter(Boolean))];
      const harita = new Map();
      for (const q of dizi((await kotaJson(semboller))?.quotes?.quote)) {
        const son = sayi(q?.last);
        if (q?.symbol && son) harita.set(q.symbol, son);
      }
      return pozisyonCoz(pozisyonBelgesi(pj, harita, bj, saat()));
    },
    async islemler({ gun = 90 } = {}) {
      const sayfalar = await bellek('gainloss', 300, async () => {
        const ilk = await ham.gerceklesen(1);
        const out = [ilk];
        const toplam = Math.min(sayi(ilk?.gainloss?.total_pages) ?? 1, 10);
        for (let p = 2; p <= toplam; p++) out.push(await ham.gerceklesen(p));
        return out;
      });
      return islemCoz(islemBelgesi(sayfalar, { gun, simdi: saat() }));
    },
    // Günlük/haftalık: son `yil` yıl. Gün içi: 1 dk için en çok 20, 5/15 dk için 40 gün (docs/tradier.md).
    async seri(sembol, zamanDilimi = 'D1', { yil = 5, gun, ...secenek } = {}) {
      const aralik = ARALIK[zamanDilimi];
      if (!aralik) throw new TradierHatasi('bozuk', ceviri('Tradier bu zaman dilimini vermiyor: {z}', { z: zamanDilimi }));
      const simdi = saat();
      let json;
      if (zamanDilimi === 'D1' || zamanDilimi === 'W1') {
        json = await bellek(`seri:${sembol}:${zamanDilimi}:${yil}`, 600, () => ham.gecmis(sembol, aralik, ymd(simdi - yil * 365 * 86400), ymd(simdi)));
      } else {
        const enCok = zamanDilimi === 'M1' ? 20 : 40;
        const g = Math.min(gun ?? enCok, enCok);
        const bas = `${ymd(simdi - g * 86400)} 09:30`, bit = `${ymd(simdi)} 16:00`;
        json = await bellek(`seri:${sembol}:${zamanDilimi}:${g}`, 300, () => ham.zamanSatis(sembol, aralik, bas, bit));
      }
      return seriCoz(seriBelgesi(sembol, json, zamanDilimi, simdi), secenek);
    },
  };
}

// ------------------------------------------------------------------ saklama (tarayıcı)
export function tradierOku(depo = globalThis.localStorage) {
  try { const v = JSON.parse(depo?.getItem(TRADIER_ANAHTARI) ?? 'null'); return v && v.token ? v : null; } catch { return null; }
}
export function tradierYaz(ayar, depo = globalThis.localStorage) {
  try { ayar ? depo.setItem(TRADIER_ANAHTARI, JSON.stringify(ayar)) : depo.removeItem(TRADIER_ANAHTARI); } catch { /* tarayıcı deposu kapalı */ }
}
// Etkin veri kaynağı: 'tradier', 'alpaca' ya da 'mt5'. Seçilen kaynağın ayarı kayıtlı değilse MT5'e düşülür.
// (Alpaca ayarı burada doğrudan okunur; veri/alpaca.js bu dosyayı içe aktardığı için döngü kurulmaz.)
export function etkinKaynak(depo = globalThis.localStorage) {
  try {
    const k = depo?.getItem(KAYNAK_ANAHTARI);
    if (k === 'tradier' && tradierOku(depo)) return 'tradier';
    if (k === 'alpaca') { const a = JSON.parse(depo?.getItem('kalibre-alpaca') ?? 'null'); if (a && a.anahtar && a.sir) return 'alpaca'; }
    return 'mt5';
  } catch { return 'mt5'; }
}
export function kaynakYaz(k, depo = globalThis.localStorage) {
  try { depo.setItem(KAYNAK_ANAHTARI, k); } catch { /* yok */ }
}
// Hesap numarasının yalnız son 4 hanesi gösterilir.
export const maskeliHesap = n => (n ? `•••${String(n).slice(-4)}` : '');

// Kayıtlı ayardan istemci (sayfalar bunu kullanır). Geliştirme adresi yalnız yerel sayfada geçerlidir.
export function kayitliTradierIstemci({ arama = globalThis.location?.search ?? '', depo = globalThis.localStorage, getir } = {}) {
  const a = tradierOku(depo);
  if (!a) return null;
  const adres = tradierAdresi(a.ortam, a.adres ? `?tradier=${encodeURIComponent(a.adres)}` : arama);
  return tradierIstemci({ token: a.token, ortam: a.ortam, hesap: a.hesap, adres, ...(getir ? { getir } : {}) });
}
