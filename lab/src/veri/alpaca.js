// Alpaca (ABD aracı kurumu) istemcisi. Ayrıntılar ve doğrulanan bilgiler: docs/alpaca.md
//
// Tarayıcıdan doğrudan Alpaca'ya gider (Alpaca'nın üç adresi de CORS'a izin verir); anahtar kimliği ve
// gizli anahtar yalnız bu tarayıcıda durur ve yalnız Alpaca'ya gönderilir. Yalnız okur: hiçbir emir uç
// noktası çağrılmaz.
//
// Röle ve Tradier istemcileriyle AYNI arayüzü sunar: durum(), kotalar(), pozisyonlar(), islemler(),
// seri(sembol, zamanDilimi), izlenenSemboller(). Yanıtlar köprü sözleşmesi belgelerine (docs/kopru.md)
// çevrilir ve aynı çözücülerden geçer; Panom, kurucu ve optimizasyon paneli özel durum bilmez.

import { t as ceviri } from '../dil.js';
import { BaglantiHatasi } from './baglanti.js';
import { durumCoz, kotaCoz, pozisyonCoz, islemCoz, seriCoz } from './kopru.js';
import { nyFarkiSn, maskeliHesap, KAYNAK_ANAHTARI } from './tradier.js';

export const ALPACA_ADRES = {
  paper: { islem: 'https://paper-api.alpaca.markets', veri: 'https://data.alpaca.markets' },
  canli: { islem: 'https://api.alpaca.markets', veri: 'https://data.alpaca.markets' },
};
export const ALPACA_ANAHTARI = 'kalibre-alpaca';
export const SEMBOL_ANAHTARI = 'kalibre-alpaca-semboller'; // izleme listesi boşsa kullanıcının eklediği semboller

// tur: 'anahtar' (401/403), 'sinir' (429), 'gecersiz' (422), 'yok' (404), 'role' (ağ), 'bozuk' (beklenmeyen yanıt)
export class AlpacaHatasi extends BaglantiHatasi {
  constructor(tur, mesaj, bekleMs = 0) { super(tur, mesaj); this.bekleMs = bekleMs; }
}

// Alpaca sayıları metin olarak döner ("100000.5").
const sayi = v => (typeof v === 'number' && Number.isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null));
const isoSn = v => { const t = Date.parse(v); return Number.isFinite(t) ? Math.floor(t / 1000) : null; };
const gunUtc = v => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v)); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 1000 : null; };
const yuvarla = (x, n = 4) => Math.round(x * 10 ** n) / 10 ** n;
export const kriptoMu = s => typeof s === 'string' && s.includes('/');

// Geliştirmede sahte sunucu: ?alpaca=http://127.0.0.1:8796 yalnız yerel sayfada kabul edilir (Tradier ve
// röledeki kural: başkasının gönderdiği bir bağlantı anahtarları başka yere yollatamasın).
// Sahte sunucu işlem ve veri uçlarını aynı adreste sunar.
export function alpacaAdresi(ortam = 'paper', arama = '', sayfaHost = globalThis.location?.hostname ?? '') {
  const p = new URLSearchParams(arama).get('alpaca');
  const yerelSayfa = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(sayfaHost);
  if (p && yerelSayfa && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(p)) {
    const k = p.replace(/\/$/, '');
    return { islem: k, veri: k };
  }
  return ALPACA_ADRES[ortam] ?? ALPACA_ADRES.paper;
}

// Günlük ve haftalık mumların zamanı New York gece yarısıdır (ör. 04:00Z); takvim günü korunur, o günün
// 00:00 UTC'sine yazılır (Tradier'deki günlük mumlarla aynı kural, gün kaymasın).
export function gunlukZaman(rfc) {
  const t = isoSn(rfc);
  if (t === null) return null;
  const yerel = new Date((t + nyFarkiSn(t)) * 1000);
  return Date.UTC(yerel.getUTCFullYear(), yerel.getUTCMonth(), yerel.getUTCDate()) / 1000;
}

// ------------------------------------------------------------------ belge üreticileri (saf)
// snapshots: hisse için sembol anahtarlı nesne, kripto için { snapshots: {...} } (ikisi de kabul edilir).
export function kotaBelgesi(snapshotlar, simdi = Math.floor(Date.now() / 1000)) {
  const kotalar = [];
  for (const kume of snapshotlar) {
    const harita = kume?.snapshots ?? kume ?? {};
    for (const [sembol, s] of Object.entries(harita)) {
      if (!s || typeof s !== 'object') continue;
      const son = sayi(s.latestTrade?.p), bid = sayi(s.latestQuote?.bp), ask = sayi(s.latestQuote?.ap);
      // Seans dışında alış/satış 0 gelebilir: o zaman son işlem fiyatı kullanılır.
      const alis = bid > 0 ? bid : son, satis = ask > 0 ? ask : son;
      if (!(alis > 0) || !(satis > 0)) continue;
      const kripto = kriptoMu(sembol);
      const ref = son ?? alis;
      kotalar.push({
        sembol, tanim: '', sinif: kripto ? 'kripto' : 'hisse',
        basamak: ref < 1 ? 6 : 2, nokta: ref < 1 ? 0.000001 : 0.01,
        alis, satis, zaman: isoSn(s.latestTrade?.t ?? s.latestQuote?.t) ?? undefined,
        gunAcilis: sayi(s.dailyBar?.o) ?? undefined, gunYuksek: sayi(s.dailyBar?.h) ?? undefined, gunDusuk: sayi(s.dailyBar?.l) ?? undefined,
        oncekiKapanis: sayi(s.prevDailyBar?.c) ?? undefined,
      });
    }
  }
  return { kalibre_kopru: 1, tur: 'kotalar', uretildi: simdi, kotalar };
}

export function pozisyonBelgesi(positions, account, simdi = Math.floor(Date.now() / 1000)) {
  const pozisyonlar = [];
  let acikKar = 0;
  for (const p of Array.isArray(positions) ? positions : []) {
    const miktar = sayi(p?.qty), giris = sayi(p?.avg_entry_price), guncel = sayi(p?.current_price), kar = sayi(p?.unrealized_pl);
    if (!p || typeof p.symbol !== 'string' || !miktar || giris === null) continue;
    const yon = p.side === 'short' || miktar < 0 ? 'sat' : 'al';
    acikKar += kar ?? 0;
    pozisyonlar.push({
      sembol: p.symbol, yon, lot: Math.abs(miktar),
      // Alpaca pozisyonun açılış zamanını vermez; bu satır belgede "bilinmiyor" anlamında şimdiki zamandır.
      acilisZamani: simdi, acilisFiyati: giris, guncelFiyat: guncel ?? giris,
      kar: Math.round((kar ?? 0) * 100) / 100,
    });
  }
  const varlik = sayi(account?.equity);
  return {
    kalibre_kopru: 1, tur: 'pozisyonlar', uretildi: simdi, para: typeof account?.currency === 'string' ? account.currency : 'USD',
    // MT5'teki "bakiye" gerçekleşmiş tutardır: varlık - açık kâr/zarar.
    bakiye: varlik !== null ? Math.round((varlik - acikKar) * 100) / 100 : undefined, varlik: varlik ?? undefined,
    pozisyonlar,
  };
}

// Alpaca kapanmış işlem listesi vermez; FILL hareketleri sembol başına FIFO ile eşleştirilir:
// - Her dolum işaretli miktardır (buy +, sell/sell_short -). Açık kuyruğun yönüne ters dolum, en eski açık
//   lottan başlayarak kapatır; artan miktar yeni lot açar (long'dan short'a geçiş dahil).
// - Kısmi dolumlar ayrı dolum olarak gelir; aynı emrin aynı açık lottan kapattığı parçalar tek satırda
//   birleştirilir (fiyat miktara göre ağırlıklı).
// - Kâr = (kapanış - açılış) × miktar × yön. Alpaca hisse komisyonu yoktur; kripto ücretleri ayrı hareket
//   olarak gelebilir ve burada sayılmaz (docs/alpaca.md).
export function fifoEslestir(dolumlar) {
  const kuyruk = new Map(); // sembol → [{ kalan, fiyat, zaman, yon, ref }]
  const kapananlar = [];
  let refNo = 0;
  const sirali = [...dolumlar].filter(d => d && d.activity_type === 'FILL' && typeof d.symbol === 'string')
    .map(d => ({ ...d, _t: isoSn(d.transaction_time), _q: sayi(d.qty), _p: sayi(d.price) }))
    .filter(d => d._t !== null && d._q > 0 && d._p > 0)
    .sort((a, b) => a._t - b._t || String(a.id).localeCompare(String(b.id)));
  for (const d of sirali) {
    const isaret = d.side === 'buy' ? 1 : -1;
    let kalan = d._q;
    const lotlar = kuyruk.get(d.symbol) ?? [];
    while (kalan > 1e-12 && lotlar.length && lotlar[0].yon !== isaret) {
      const lot = lotlar[0];
      const m = Math.min(kalan, lot.kalan);
      const kar = (d._p - lot.fiyat) * m * lot.yon;
      const onceki = kapananlar.at(-1);
      if (onceki && onceki._emir === d.order_id && onceki._ref === lot.ref) {
        const yeniLot = onceki.lot + m;
        onceki.kapanisFiyati = (onceki.kapanisFiyati * onceki.lot + d._p * m) / yeniLot;
        onceki.lot = yeniLot;
        onceki.kar += kar;
        onceki.kapanisZamani = Math.max(onceki.kapanisZamani, d._t);
      } else {
        kapananlar.push({
          sembol: d.symbol, yon: lot.yon > 0 ? 'al' : 'sat', lot: m,
          acilisZamani: lot.zaman, acilisFiyati: lot.fiyat, kapanisZamani: Math.max(d._t, lot.zaman), kapanisFiyati: d._p,
          kar, komisyon: 0, swap: 0, _emir: d.order_id, _ref: lot.ref,
        });
      }
      lot.kalan -= m;
      kalan -= m;
      if (lot.kalan <= 1e-12) lotlar.shift();
    }
    if (kalan > 1e-12) {
      // Aynı emrin ardışık kısmi dolumları tek lot olur (fiyat ağırlıklı).
      const son = lotlar.at(-1);
      if (son && son._emir === d.order_id && son.yon === isaret) {
        son.fiyat = (son.fiyat * son.kalan + d._p * kalan) / (son.kalan + kalan);
        son.kalan += kalan;
      } else {
        lotlar.push({ kalan, fiyat: d._p, zaman: d._t, yon: isaret, ref: ++refNo, _emir: d.order_id });
      }
    }
    kuyruk.set(d.symbol, lotlar);
  }
  return kapananlar.map(({ _emir, _ref, ...k }) => ({
    ...k, lot: yuvarla(k.lot, 8), acilisFiyati: yuvarla(k.acilisFiyati), kapanisFiyati: yuvarla(k.kapanisFiyati),
    kar: Math.round(k.kar * 100) / 100,
  }));
}

// Nakit hareketleri: CSD yatırma, CSW çekme, JNLC (nakit yevmiye) tutarın işaretine göre. İptal edilenler atlanır.
// Temettü (DIV) ve faiz gibi gelirler bakiye hareketi sayılmaz (kâr tarafındadır); burada yok sayılır.
export function hareketler(aktiviteler) {
  const out = [];
  for (const a of Array.isArray(aktiviteler) ? aktiviteler : []) {
    if (!a || !['CSD', 'CSW', 'JNLC'].includes(a.activity_type) || a.status === 'canceled') continue;
    const tutar = sayi(a.net_amount);
    const zaman = isoSn(a.created_at) ?? gunUtc(a.date);
    if (!tutar || zaman === null) continue;
    out.push({ zaman, tutar, tur: tutar > 0 ? 'yatirma' : 'cekme' });
  }
  return out.sort((a, b) => a.zaman - b.zaman);
}

export function islemBelgesi({ dolumlar = [], nakit = [], account = null, gun = 90, simdi = Math.floor(Date.now() / 1000) } = {}) {
  const sinir = simdi - gun * 86400;
  const tumu = fifoEslestir(dolumlar);
  const islemler = tumu.filter(i => i.kapanisZamani >= sinir).sort((a, b) => a.kapanisZamani - b.kapanisZamani);
  const bakiyeHareketleri = hareketler(nakit);
  // Paper hesaplar başlangıç bakiyesini bir yatırma hareketi olmadan alır. Gerçekleşmiş bakiye
  // (nakit + açık pozisyonların maliyeti yerine: varlık - açık kâr) bilinirse, hareketler ve kârla
  // açıklanamayan kısım hesabın açılış anına "diğer" hareket olarak yazılır; bakiye eğrisi doğru başlar.
  const gerceklesen = sayi(account?.gerceklesen);
  if (gerceklesen !== null) {
    const aciklanan = bakiyeHareketleri.reduce((t, h) => t + h.tutar, 0) + tumu.reduce((t, i) => t + i.kar, 0);
    const fark = Math.round((gerceklesen - aciklanan) * 100) / 100;
    if (Math.abs(fark) >= 0.01) {
      const ilk = Math.min(isoSn(account?.created_at) ?? Infinity, ...bakiyeHareketleri.map(h => h.zaman), ...tumu.map(i => i.acilisZamani));
      bakiyeHareketleri.unshift({ zaman: Number.isFinite(ilk) ? ilk - 1 : sinir, tutar: fark, tur: 'diger' });
    }
  }
  return { kalibre_kopru: 1, tur: 'islemler', uretildi: simdi, para: typeof account?.currency === 'string' ? account.currency : 'USD', gunSayisi: gun, islemler, bakiyeHareketleri };
}

const ARALIK = { D1: '1Day', W1: '1Week', H1: '1Hour', M15: '15Min', M5: '5Min', M1: '1Min' };
export const ALPACA_ZAMAN_DILIMLERI = Object.keys(ARALIK);
// Geriye gidilecek süre (gün): ücretsiz IEX akışında büyük sayfalar gerekmesin.
export const GERI_GUN = { D1: 5 * 365, W1: 5 * 365, H1: 2 * 365, M15: 120, M5: 60, M1: 15 };

export function seriBelgesi(sembol, barlar, zamanDilimi, simdi = Math.floor(Date.now() / 1000)) {
  const gunluk = zamanDilimi === 'D1' || zamanDilimi === 'W1';
  const kripto = kriptoMu(sembol);
  const mumlar = (barlar ?? []).map(b => [gunluk && !kripto ? gunlukZaman(b?.t) : isoSn(b?.t), sayi(b?.o), sayi(b?.h), sayi(b?.l), sayi(b?.c), sayi(b?.v) ?? 0]);
  const ref = sayi(barlar?.at(-1)?.c) ?? 1;
  return {
    kalibre_kopru: 1, tur: 'seri', kaynak: 'alpaca', sembol, zamanDilimi, uretildi: simdi,
    meta: { sinif: kripto ? 'kripto' : 'hisse', takvim: kripto ? 'yedi24' : 'borsa', nokta: ref < 1 ? 0.000001 : 0.01, basamak: ref < 1 ? 6 : 2, hacimTuru: 'gercek' },
    alanlar: ['t', 'a', 'y', 'd', 'k', 'h'], mumlar,
  };
}

// Piyasa saati metni: Panom hesap kartında "sunucu" satırına eklenir.
export function saatMetni(clock) {
  if (!clock || typeof clock.is_open !== 'boolean') return '';
  const fmt = v => { const t = isoSn(v); return t ? new Date(t * 1000).toISOString().slice(5, 16).replace('T', ' ') + ' UTC' : ''; };
  return clock.is_open
    ? ceviri('ABD piyasası açık (kapanış {z})', { z: fmt(clock.next_close) })
    : ceviri('ABD piyasası kapalı (açılış {z}); kripto 7/24', { z: fmt(clock.next_open) });
}

export function durumBelgesi({ ortam = 'paper', hesap = null, seriler = [], saat = '', simdi = Math.floor(Date.now() / 1000) } = {}) {
  return {
    kalibre_kopru: 1, tur: 'durum', kaynak: 'alpaca', uretildi: simdi, yazmaAraligiSn: 15,
    terminal: { sirket: 'Alpaca', sunucu: [ortam === 'canli' ? 'Live' : 'Paper', maskeliHesap(hesap), saat].filter(Boolean).join(' · '), hesapTuru: ortam === 'canli' ? 'gercek' : 'demo' },
    sunucuUtcFarkiSn: 0, seriler, pozisyonlarVar: true, kotalarVar: true, islemlerVar: true,
  };
}

// ------------------------------------------------------------------ istemci
// getir: fetch ile aynı imza (testte sahte sunucuya bağlanır). Anahtarlar hiçbir yerde günlüğe yazılmaz.
export function alpacaIstemci({ anahtar, sir, ortam = 'paper', adres, getir = (...a) => fetch(...a), saat = () => Math.floor(Date.now() / 1000), depo = globalThis.localStorage } = {}) {
  if (!anahtar || !sir) throw new AlpacaHatasi('anahtar', ceviri('Alpaca anahtar kimliği ve gizli anahtar girilmedi.'));
  const kok = adres ?? ALPACA_ADRES[ortam] ?? ALPACA_ADRES.paper;
  let bekleSonu = 0;

  async function al(taban, yol, q = {}) {
    if (Date.now() < bekleSonu) throw new AlpacaHatasi('sinir', ceviri('Alpaca hız sınırına ulaşıldı; {n} sn sonra yeniden denenecek.', { n: Math.ceil((bekleSonu - Date.now()) / 1000) }), bekleSonu - Date.now());
    const s = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    const url = `${taban}${yol}${s.toString() ? '?' + s : ''}`;
    let r;
    try {
      r = await getir(url, { headers: { 'APCA-API-KEY-ID': anahtar, 'APCA-API-SECRET-KEY': sir, Accept: 'application/json' }, cache: 'no-store' });
    } catch {
      throw new AlpacaHatasi('role', ceviri("Alpaca'ya ulaşılamadı. İnternet bağlantını kontrol et."));
    }
    const metin = await r.text();
    if (r.status === 429) {
      const sifirla = Number(r.headers?.get?.('X-RateLimit-Reset'));
      // X-RateLimit-Reset unix saniyedir; geçmişte ya da yoksa bir dakika beklenir, en çok iki dakika.
      bekleSonu = Number.isFinite(sifirla) && sifirla * 1000 > Date.now() ? Math.min(sifirla * 1000, Date.now() + 120_000) : Date.now() + 60_000;
      throw new AlpacaHatasi('sinir', ceviri('Alpaca hız sınırına ulaşıldı; {n} sn sonra yeniden denenecek.', { n: Math.ceil((bekleSonu - Date.now()) / 1000) }), bekleSonu - Date.now());
    }
    if (r.status === 401 || r.status === 403) throw new AlpacaHatasi('anahtar', ceviri('Alpaca anahtarları geçersiz ya da bu ortama ait değil (paper anahtarı canlı adreste, canlı anahtar paper adresinde çalışmaz).'));
    if (r.status === 404) throw new AlpacaHatasi('yok', ceviri('Alpaca bu kaydı bulamadı.'));
    if (r.status === 422) throw new AlpacaHatasi('gecersiz', ceviri('Alpaca isteği kabul etmedi (geçersiz sembol ya da tarih aralığı).'));
    if (r.status < 200 || r.status >= 300) throw new AlpacaHatasi('bozuk', ceviri('Alpaca yanıtı {k}', { k: r.status }));
    try { return JSON.parse(metin); } catch { throw new AlpacaHatasi('bozuk', ceviri('Alpaca yanıtı JSON değil')); }
  }
  const islem = (yol, q) => al(kok.islem, yol, q);
  const veri = (yol, q) => al(kok.veri, yol, q);

  // Basit önbellek: aynı veri kısa sürede tekrar istenmesin.
  const onbellek = new Map();
  async function bellek(k, sureSn, uret) {
    const v = onbellek.get(k);
    if (v && saat() - v.zaman < sureSn) return v.deger;
    const deger = await uret();
    onbellek.set(k, { zaman: saat(), deger });
    return deger;
  }

  // Hareketler sayfalı gelir (en çok 100); sayfa anahtarı son öğenin kimliğidir.
  async function aktiviteler(q, enCokSayfa = 20) {
    const out = [];
    let token;
    for (let i = 0; i < enCokSayfa; i++) {
      const sayfa = await islem('/v2/account/activities', { ...q, direction: 'asc', page_size: 100, page_token: token });
      if (!Array.isArray(sayfa) || !sayfa.length) break;
      out.push(...sayfa);
      if (sayfa.length < 100) break;
      token = sayfa.at(-1)?.id;
      if (!token) break;
    }
    return out;
  }

  // Mumlar sayfalı gelir (next_page_token); sınır tüm sembollerin toplamıdır, burada tek sembol istenir.
  async function barlar(sembol, aralik, bas, enCokSayfa = 10) {
    const kripto = kriptoMu(sembol);
    const yol = kripto ? '/v1beta3/crypto/us/bars' : '/v2/stocks/bars';
    const q = { symbols: sembol, timeframe: aralik, start: bas, limit: 10000, sort: 'asc', ...(kripto ? {} : { feed: 'iex', adjustment: 'split' }) };
    const out = [];
    let token;
    for (let i = 0; i < enCokSayfa; i++) {
      const j = await veri(yol, { ...q, page_token: token });
      out.push(...(j?.bars?.[sembol] ?? []));
      token = j?.next_page_token;
      if (!token) break;
    }
    return out;
  }

  const hesapBilgisi = () => bellek('hesap', 15, () => islem('/v2/account'));

  function kayitliSemboller() {
    try { const v = JSON.parse(depo?.getItem(SEMBOL_ANAHTARI) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch { return []; }
  }

  // İzlenen semboller: ilk dolu izleme listesi; yoksa açık pozisyonların sembolleri; yoksa kullanıcının eklediği semboller.
  async function izlenenSemboller() {
    return bellek('semboller', 300, async () => {
      const listeler = await islem('/v2/watchlists').catch(() => []);
      for (const w of Array.isArray(listeler) ? listeler : []) {
        if (!w?.id) continue;
        const ayrinti = await islem(`/v2/watchlists/${encodeURIComponent(w.id)}`).catch(() => null);
        const s = (ayrinti?.assets ?? []).map(a => a?.symbol).filter(x => typeof x === 'string');
        if (s.length) return [...new Set(s)].slice(0, 40);
      }
      const poz = await islem('/v2/positions').catch(() => []);
      const p = (Array.isArray(poz) ? poz : []).map(x => x?.symbol).filter(Boolean);
      if (p.length) return [...new Set(p)].slice(0, 40);
      return kayitliSemboller().slice(0, 40);
    });
  }

  return {
    ortam, kaynak: 'alpaca',
    // Bağlantı sayfası: hesap özeti (numara yalnız maskeli gösterilir).
    async hesap() {
      const a = await islem('/v2/account');
      return {
        numara: typeof a?.account_number === 'string' ? a.account_number : '', durum: a?.status ?? '',
        varlik: sayi(a?.equity), para: a?.currency ?? 'USD', kripto: a?.crypto_status ?? '',
      };
    },
    izlenenSemboller,
    semboluUnut() { onbellek.delete('semboller'); },
    async durum() {
      const [a, semboller, clock] = await Promise.all([hesapBilgisi(), izlenenSemboller(), bellek('saat', 60, () => islem('/v2/clock')).catch(() => null)]);
      const seriler = semboller.map(s => ({ sembol: s, zamanDilimi: 'D1', adet: null, son: null }));
      return durumCoz(durumBelgesi({ ortam, hesap: a?.account_number, seriler, saat: saatMetni(clock), simdi: saat() }), saat());
    },
    async kotalar() {
      const semboller = await izlenenSemboller();
      const hisse = semboller.filter(s => !kriptoMu(s)), kripto = semboller.filter(kriptoMu);
      const kumeler = await bellek(`kota:${semboller.join(',')}`, 15, async () => [
        hisse.length ? await veri('/v2/stocks/snapshots', { symbols: hisse.join(','), feed: 'iex' }) : {},
        kripto.length ? await veri('/v1beta3/crypto/us/snapshots', { symbols: kripto.join(',') }) : {},
      ]);
      return kotaCoz(kotaBelgesi(kumeler, saat()));
    },
    async pozisyonlar() {
      const [p, a] = await bellek('poz', 15, async () => [await islem('/v2/positions'), await hesapBilgisi()]);
      return pozisyonCoz(pozisyonBelgesi(p, a, saat()));
    },
    // Kapanmış işlemler: FILL hareketleri son bir yıldan alınır (pencere öncesinde açılmış pozisyonların
    // açılışı için), sonra son `gun` günde kapananlar gösterilir.
    async islemler({ gun = 90 } = {}) {
      const simdi = saat();
      const [dolumlar, nakit, a, p] = await bellek('islemler', 300, async () => [
        await aktiviteler({ activity_types: 'FILL', after: new Date((simdi - 365 * 86400) * 1000).toISOString() }),
        await aktiviteler({ activity_types: 'CSD,CSW,JNLC' }),
        await hesapBilgisi(),
        await islem('/v2/positions'),
      ]);
      const acikKar = (Array.isArray(p) ? p : []).reduce((t, x) => t + (sayi(x?.unrealized_pl) ?? 0), 0);
      const varlik = sayi(a?.equity);
      const account = { ...a, gerceklesen: varlik !== null ? varlik - acikKar : null };
      return islemCoz(islemBelgesi({ dolumlar, nakit, account, gun, simdi }));
    },
    async seri(sembol, zamanDilimi = 'D1', { gun, ...secenek } = {}) {
      const aralik = ARALIK[zamanDilimi];
      if (!aralik) throw new AlpacaHatasi('gecersiz', ceviri('Alpaca bu zaman dilimini vermiyor: {z}', { z: zamanDilimi }));
      const g = Math.min(gun ?? GERI_GUN[zamanDilimi], GERI_GUN[zamanDilimi]);
      const bas = new Date((saat() - g * 86400) * 1000).toISOString().slice(0, 10);
      const b = await bellek(`seri:${sembol}:${zamanDilimi}:${g}`, zamanDilimi === 'D1' || zamanDilimi === 'W1' ? 600 : 300, () => barlar(sembol, aralik, bas));
      return seriCoz(seriBelgesi(sembol, b, zamanDilimi, saat()), secenek);
    },
  };
}

// ------------------------------------------------------------------ saklama (tarayıcı)
export function alpacaOku(depo = globalThis.localStorage) {
  try { const v = JSON.parse(depo?.getItem(ALPACA_ANAHTARI) ?? 'null'); return v && v.anahtar && v.sir ? v : null; } catch { return null; }
}
export function alpacaYaz(ayar, depo = globalThis.localStorage) {
  try { ayar ? depo.setItem(ALPACA_ANAHTARI, JSON.stringify(ayar)) : depo.removeItem(ALPACA_ANAHTARI); } catch { /* tarayıcı deposu kapalı */ }
}
export function sembolleriOku(depo = globalThis.localStorage) {
  try { const v = JSON.parse(depo?.getItem(SEMBOL_ANAHTARI) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function sembolleriYaz(liste, depo = globalThis.localStorage) {
  try { depo.setItem(SEMBOL_ANAHTARI, JSON.stringify([...new Set(liste)].slice(0, 40))); } catch { /* yok */ }
}
export function alpacaEtkin(depo = globalThis.localStorage) {
  try { return depo?.getItem(KAYNAK_ANAHTARI) === 'alpaca' && !!alpacaOku(depo); } catch { return false; }
}

// Kayıtlı ayardan istemci (sayfalar bunu kullanır). Geliştirme adresi yalnız yerel sayfada geçerlidir.
export function kayitliAlpacaIstemci({ arama = globalThis.location?.search ?? '', depo = globalThis.localStorage, getir } = {}) {
  const a = alpacaOku(depo);
  if (!a) return null;
  const adres = alpacaAdresi(a.ortam, a.adres ? `?alpaca=${encodeURIComponent(a.adres)}` : arama);
  return alpacaIstemci({ anahtar: a.anahtar, sir: a.sir, ortam: a.ortam, adres, depo, ...(getir ? { getir } : {}) });
}
