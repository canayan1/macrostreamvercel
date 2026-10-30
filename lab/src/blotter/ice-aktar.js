// FX blotter içe aktarma (docs/fx-blotter-spec.md §3, kurucu yanıtları §9).
// Orijinal blotter düzenlenmeden okunur: rapor başlığı ve toplam satırları atlanır, sütunlar
// tespit edilir (tespit.js), her satır kanonik bacağa çevrilir ya da gerekçeyle listelenir.
// Saf modül: DOM yok, ağ yok. Karşı taraf adları varsayılan olarak modele alınmaz.

import { baytlariMetneCevir, xlsxSayfalari } from '../analiz/mt5-rapor.js';
import { csvSatirlari } from '../analiz/csv-ice.js';
import {
  norm, pariteCoz, dovizMi, konvansiyon, sayiAyristir, tarihAyristir, saatAyristir, spotTarihi,
  isGunuEkle, gunEkle, hashle, rastgeleTuz, yakin, KUR_TOLERANS,
} from './model.js';
import { alanTespit, baslikSatiriBul, toplamSatiriMi, zorunluEksik, bicimleriTahmin } from './tespit.js';

// Gerekçe kodları ve sınıfları: 'dislanan' bilerek dışarıda bırakılan (opsiyon, iptal...),
// 'hata' okunamayan satır. Mutabakatta ayrı sayılır.
export const GEREKCE_SINIF = {
  'opsiyon': 'dislanan', 'iptal': 'dislanan', 'reddedildi': 'dislanan', 'eski-surum': 'dislanan', 'onaysiz': 'dislanan',
  'toplam-satiri': 'toplam', 'baslik-oncesi': 'baslik',
  'tutar-kur-tutarsiz': 'hata', 'valor-islem-tarihinden-once': 'hata', 'bilinmeyen-doviz': 'hata', 'tek-bacakli-swap': 'hata',
  'ndf-fixing-eksik': 'hata', 'bos-zorunlu-alan': 'hata', 'tarih-okunamadi': 'hata', 'tutar-okunamadi': 'hata', 'yon-okunamadi': 'hata',
};

// ---------------------------------------------------------------- dosya → satırlar
// Kodlama: BOM (UTF-8/16), yoksa UTF-8 (katı) denenir, geçmezse Windows-1254 (Türkçe Windows/Excel).
export function metneCevir(bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  if ((b[0] === 0xff && b[1] === 0xfe) || (b[0] === 0xfe && b[1] === 0xff) || (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf)) return { metin: baytlariMetneCevir(b), kodlama: 'bom' };
  try { return { metin: new TextDecoder('utf-8', { fatal: true }).decode(b), kodlama: 'utf-8' }; } catch { /* UTF-8 değil */ }
  try { return { metin: new TextDecoder('windows-1254').decode(b), kodlama: 'windows-1254' }; } catch { /* çözücü yok */ }
  return { metin: new TextDecoder('latin1').decode(b), kodlama: 'latin1' };
}

// Ayırıcı: ilk 30 satırda en çok tekrar eden aday (başlık üstündeki rapor satırları yanıltmasın diye).
export function ayiriciSec(metin) {
  const satirlar = String(metin).replace(/^﻿/, '').split(/\r?\n/).slice(0, 30);
  let en = ',', enN = -1;
  for (const c of ['\t', ';', ',', '|']) {
    const n = Math.max(0, ...satirlar.map(s => s.split(c).length - 1));
    if (n > enN) { en = c; enN = n; }
  }
  return en;
}

// Dosyadan satırlar: { satirlar, sayfa, kodlama }. XLSX'te en çok işlem benzeri satır içeren sayfa seçilir.
export async function dosyadanSatirlar(ad, bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  if (b[0] === 0x50 && b[1] === 0x4b) {
    const sayfalar = await xlsxSayfalari(b);
    let en = sayfalar[0], enPuan = -1;
    for (const s of sayfalar) {
      const bi = baslikSatiriBul(s.satirlar);
      const puan = bi < 0 ? 0 : s.satirlar.length - bi;
      if (puan > enPuan) { en = s; enPuan = puan; }
    }
    return { satirlar: en.satirlar, sayfa: en.ad, kodlama: 'xlsx' };
  }
  if (b[0] === 0xd0 && b[1] === 0xcf) throw new Error('xls'); // eski ikili Excel: XLSX ya da CSV olarak kaydedilmeli
  const { metin, kodlama } = metneCevir(b);
  return { satirlar: csvSatirlari(metin, ayiriciSec(metin)), sayfa: null, kodlama };
}

// ---------------------------------------------------------------- değer çözücüleri
const YON_AL = /^(buy|b|1|al|alis|a|kauf|achat|long|bought|purchase)$/;
const YON_SAT = /^(sell|s|2|sat|satis|verkauf|vente|short|sold|sale)$/;
// "Client Buys EUR", "Müşteri Alış", "Bank Sells" → { yon, bakis }.
export function yonCoz(v) {
  let n = norm(v);
  if (!n) return null;
  let bakis = null;
  const on = n.match(/^(client|customer|musteri|cpty|counterparty|bank|banka|requester|we)/);
  if (on) { bakis = /^(bank|banka|requester|we)/.test(on[1]) ? 'biz' : 'karsi'; n = n.slice(on[1].length); }
  n = n.replace(/(eur|usd|gbp|try|jpy|chf)$/, '').replace(/s$/, '');
  if (YON_AL.test(n) || /^(buy|al|alis|kauf|achat)/.test(n)) return { yon: 'al', bakis };
  if (YON_SAT.test(n) || /^(sell|sat|satis|verkauf|vente)/.test(n)) return { yon: 'sat', bakis };
  return null;
}

export function urunCoz(v) {
  const n = norm(v);
  if (!n) return null;
  if (/(option|opsiyon|opt$|^opt|call|put|vanilla|barrier)/.test(n)) return { urun: 'opsiyon' };
  if (/nds/.test(n)) return { urun: 'swap', ndf: true, rol: rolCoz(n) };
  if (/ndf/.test(n)) return { urun: 'ndf' };
  if (/swap/.test(n)) return { urun: 'swap', rol: rolCoz(n) };
  if (/(forward|fwd|outright|vadeli|termin|terme)/.test(n)) return { urun: 'forward' };
  if (/(spot|pesin|kassa|^sp$|comptant)/.test(n)) return { urun: 'spot' };
  return null;
}
function rolCoz(v) {
  const n = norm(v);
  if (/(near|yakin|nah|proche|leg1|bacak1)$|near|yakin/.test(n)) return 'yakin';
  if (/(far|uzak|fern|lointain|leg2|bacak2)$|far|uzak/.test(n)) return 'uzak';
  return null;
}

export function durumCoz(v) {
  const n = norm(v);
  if (!n) return 'gecerli';
  if (/^(cancel|cancelled|canceled|canc|h|iptal|storniert|annule)/.test(n)) return 'iptal';
  if (/^(reject|rejected|reddedildi|red|abgelehnt|rejete)/.test(n)) return 'reddedildi';
  if (/^(pending|pretrade|beklemede|onaysiz|draft|taslak|indicative)/.test(n)) return 'onaysiz';
  return 'gecerli'; // done, confirmed, aktif, active, new, newt, amend (g), f, filled, düzeltildi
}

function karsiTarafTipiCoz(...ipuclari) {
  for (const v of ipuclari) {
    const n = norm(v);
    if (!n) continue;
    if (/^(musteri|client|customer|kurumsal|corporate|retail|bireysel|kunde)/.test(n)) return 'musteri';
    if (/^(interbank|banka|bank|street|market|piyasa|broker|lp)/.test(n)) return 'interbank';
    if (/^(grupici|intercompany|internal|ic|intragroup)/.test(n)) return 'grup-ici';
  }
  return 'bilinmiyor';
}

// Vade kodundan yaklaşık valör (valör tarihi yoksa; tatil takvimi yok [DY]).
function tenordenValor(tenor, islemTarihi, base, kote) {
  const t = String(tenor ?? '').trim().toUpperCase();
  const spot = spotTarihi(islemTarihi, base, kote);
  if (/^(TOD|ON|1)$/.test(t)) return islemTarihi;
  if (/^(TOM|TN|2)$/.test(t)) return isGunuEkle(islemTarihi, 1);
  if (/^(SPOT|SP|0|C)$/.test(t)) return t === 'C' ? isGunuEkle(spot, 1) : spot;
  if (/^SN$/.test(t)) return isGunuEkle(spot, 1);
  const m = t.match(/^([DWMY])?(\d+)([DWMY])?$/);
  if (m) {
    const birim = m[1] || m[3], n = +m[2];
    if (birim === 'D') return gunEkle(spot, n);
    if (birim === 'W') return gunEkle(spot, 7 * n);
    if (birim === 'M' || birim === 'Y') {
      const d = new Date(spot + 'T00:00:00Z');
      d.setUTCMonth(d.getUTCMonth() + (birim === 'Y' ? 12 * n : n));
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

// ---------------------------------------------------------------- ana içe aktarma
// satirlar: hücre dizileri (`no` özelliği satır numarası). ayar:
//   eslesme: tespiti geçersiz kılan {alan: sutunNo}; bakis: 'biz' (varsayılan, kurucu yanıtı 2) | 'karsi';
//   saatDilimi: kaynak saat farkı (saat, UTC'ye çevirmek için); tuz: hash tuzu; adlariGoster: false;
//   ndfFixing: { [kaynakId ham]: fixingKur } (elle girilen fixing kurları).
export function iceAktar(satirlar, ayar = {}) {
  const tespit = alanTespit(satirlar);
  const e = { ...tespit.eslesme, ...(ayar.eslesme ?? {}) };
  for (const [k, v] of Object.entries(ayar.eslesme ?? {})) if (v === null || v === -1) delete e[k];
  const bicim = ayar.eslesme ? { ...tespit.bicim, ...bicimYenile(satirlar, tespit, e) } : tespit.bicim;
  const bakisVarsayilan = ayar.bakis ?? 'biz';
  const saatDilimi = Number(ayar.saatDilimi ?? 0) || 0;
  const tuz = ayar.tuz ?? rastgeleTuz();
  const atlanan = [], uyarilar = [];
  const sayac = { okunan: 0, baslikOncesi: 0, toplamSatiri: 0, bos: 0 };
  const eksik = zorunluEksik(e);
  const bi = tespit.baslikIndex;
  if (bi < 0 || eksik.length) {
    return { bacaklar: [], atlanan, uyarilar: [{ kod: bi < 0 ? 'baslik-yok' : 'zorunlu-alan-eksik', detay: eksik.join(',') }], sayac, tespit, eslesme: e, eksik };
  }
  for (let i = 0; i < bi; i++) { sayac.baslikOncesi++; atlanan.push({ satirNo: satirlar[i].no ?? i + 1, gerekce: 'baslik-oncesi' }); }

  const al = (s, alan) => (alan in e ? s[e[alan]] : undefined);
  const sayiAl = (s, alan) => (alan in e ? sayiAyristir(s[e[alan]], bicim.sayi[e[alan]]) : null);
  const tarihAl = (s, alan) => (alan in e ? tarihAyristir(s[e[alan]], bicim.tarih[e[alan]]?.bicim) : null);

  // Trader takma adları: ilk görülme sırasıyla "Trader 1..n" (§3.8).
  const traderAd = new Map();
  const traderKod = v => {
    const h = String(v ?? '').trim();
    if (!h) return null;
    if (ayar.adlariGoster) return h;
    if (!traderAd.has(h)) traderAd.set(h, `Trader ${traderAd.size + 1}`);
    return traderAd.get(h);
  };

  // Puan ölçeği (§3.4): sütun bazında tek çarpan, spot + k·puan ≈ all-in.
  let puanOlcek = 1;
  if ('puan' in e && 'spotKur' in e && 'kur' in e) {
    const oy = new Map();
    for (const s of satirlar.slice(bi + 1, bi + 400)) {
      const p = sayiAl(s, 'puan'), sp = sayiAl(s, 'spotKur'), k = sayiAl(s, 'kur');
      if (!p || !sp || !k) continue;
      let enK = 1, enF = Infinity;
      for (const c of [1, 1e-2, 1e-4, 1e-5]) { const f = Math.abs(sp + c * p - k); if (f < enF) { enF = f; enK = c; } }
      oy.set(enK, (oy.get(enK) ?? 0) + 1);
    }
    if (oy.size) puanOlcek = [...oy.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  const ham = []; // satır → ara kayıt (sürüm ve swap işlemleri için)
  for (let i = bi + 1; i < satirlar.length; i++) {
    const s = satirlar[i];
    const satirNo = s.no ?? i + 1;
    sayac.okunan++;
    if (!s.some(h => String(h ?? '').trim() !== '')) { sayac.bos++; continue; }
    if (toplamSatiriMi(s)) { sayac.toplamSatiri++; atlanan.push({ satirNo, gerekce: 'toplam-satiri' }); continue; }
    const r = satirCevir(s, satirNo);
    if (r.gerekce) atlanan.push({ satirNo, gerekce: r.gerekce, alan: r.alan });
    else ham.push(r.bacak);
  }

  function satirCevir(s, satirNo) {
    // Ürün ve opsiyon tespiti.
    const urunBilgi = urunCoz(al(s, 'urun'));
    if (urunBilgi?.urun === 'opsiyon' || ('opsiyonIz' in e && String(al(s, 'opsiyonIz') ?? '').trim() !== '' && !urunBilgi)) return { gerekce: 'opsiyon' };
    const durum = durumCoz(al(s, 'durum'));
    const kaynakHam = String(al(s, 'kaynakId') ?? '').trim();
    const refHam = String(al(s, 'refId') ?? '').trim();
    // Tarihler.
    const it = tarihAl(s, 'islemTarihi');
    if (!it) return { gerekce: String(al(s, 'islemTarihi') ?? '').trim() ? 'tarih-okunamadi' : 'bos-zorunlu-alan', alan: 'islemTarihi' };
    let saniye = it.saniye;
    if ('islemZamani' in e) {
      const z = al(s, 'islemZamani');
      const tz = tarihAyristir(z);
      saniye = saatAyristir(z) ?? tz?.saniye ?? saniye;
    }
    const islemZamani = saniye === null || saniye === undefined ? null : Date.parse(it.gun + 'T00:00:00Z') / 1000 + saniye - saatDilimi * 3600;

    // Döviz çifti ve tutarlar.
    const ikiTutar = 'alisDoviz' in e && 'alisTutar' in e && 'satisDoviz' in e && 'satisTutar' in e;
    let base, kote, baseTutar, koteTutar, kur, dealt;
    const kurKaynak = sayiAl(s, 'kur');
    if (ikiTutar) {
      const A = String(al(s, 'alisDoviz') ?? '').trim().toUpperCase(), B = String(al(s, 'satisDoviz') ?? '').trim().toUpperCase();
      if (!dovizMi(A) || !dovizMi(B) || A === B) return { gerekce: A && B ? 'bilinmeyen-doviz' : 'bos-zorunlu-alan', alan: 'doviz' };
      const a = Math.abs(sayiAl(s, 'alisTutar') ?? NaN), b = Math.abs(sayiAl(s, 'satisTutar') ?? NaN);
      if (!(a > 0) || !(b > 0)) return { gerekce: 'tutar-okunamadi', alan: 'tutar' };
      [base, kote] = konvansiyon(A, B);
      let isaret = bakisVarsayilan === 'karsi' ? -1 : 1;
      if (base === A) { baseTutar = isaret * a; koteTutar = -isaret * b; kur = b / a; }
      else { baseTutar = -isaret * b; koteTutar = isaret * a; kur = a / b; }
      dealt = base;
      if (kurKaynak) {
        if (!yakin(kur, kurKaynak) && !yakin(kur, 1 / kurKaynak)) return { gerekce: 'tutar-kur-tutarsiz', alan: 'kur' };
      }
    } else {
      let ciftKaynak = pariteCoz(al(s, 'parite'));
      const dealtHam = String(al(s, 'dealtDoviz') ?? '').trim().toUpperCase();
      const karsiHam = String(al(s, 'karsiDoviz') ?? '').trim().toUpperCase();
      if (!ciftKaynak && dovizMi(dealtHam) && dovizMi(karsiHam) && dealtHam !== karsiHam) ciftKaynak = [dealtHam, karsiHam];
      if (!ciftKaynak) {
        const p = String(al(s, 'parite') ?? '').trim();
        return { gerekce: p || dealtHam ? 'bilinmeyen-doviz' : 'bos-zorunlu-alan', alan: 'parite' };
      }
      [base, kote] = konvansiyon(ciftKaynak[0], ciftKaynak[1]);
      const tersCift = base !== ciftKaynak[0];
      dealt = dovizMi(dealtHam) && (dealtHam === base || dealtHam === kote) ? dealtHam : base;
      const y = yonCoz(al(s, 'yon'));
      if (!y) return { gerekce: String(al(s, 'yon') ?? '').trim() ? 'yon-okunamadi' : 'bos-zorunlu-alan', alan: 'yon' };
      const bakis = y.bakis ?? bakisVarsayilan;
      const yonDealt = bakis === 'karsi' ? (y.yon === 'al' ? 'sat' : 'al') : y.yon;
      const tutar = Math.abs(sayiAl(s, 'tutar') ?? NaN);
      if (!(tutar > 0)) return { gerekce: String(al(s, 'tutar') ?? '').trim() ? 'tutar-okunamadi' : 'bos-zorunlu-alan', alan: 'tutar' };
      const karsiTutar = Math.abs(sayiAl(s, 'karsiTutar') ?? NaN);
      // Kur: kaynakta kur varsa o; yoksa iki tutardan.
      let k = kurKaynak;
      if (!k && karsiTutar > 0) k = dealt === base ? karsiTutar / tutar : tutar / karsiTutar;
      if (!(k > 0)) return { gerekce: 'bos-zorunlu-alan', alan: 'kur' };
      if (tersCift && kurKaynak && !(karsiTutar > 0)) k = 1 / k; // kur kaynak çiftin yönünde yazılmış
      // Tutar kontrolü: karşı tutar varsa kur yönünü doğrula (gerekirse ters kotasyon).
      if (karsiTutar > 0) {
        const beklenen = kk => (dealt === base ? tutar * kk : tutar / kk);
        if (!yakin(beklenen(k), karsiTutar)) {
          if (yakin(beklenen(1 / k), karsiTutar)) k = 1 / k;
          else return { gerekce: 'tutar-kur-tutarsiz', alan: 'kur' };
        }
      }
      kur = k;
      const isaret = yonDealt === 'al' ? 1 : -1;
      if (dealt === base) baseTutar = isaret * tutar;
      else baseTutar = -isaret * (karsiTutar > 0 ? karsiTutar : tutar / kur);
      koteTutar = dealt === kote ? isaret * tutar : -baseTutar * kur;
      if (dealt === base && karsiTutar > 0) koteTutar = -Math.sign(baseTutar) * karsiTutar;
    }

    // Valör.
    let valor = tarihAl(s, 'valor')?.gun ?? null;
    let valorYaklasik = false;
    if (!valor && 'tenor' in e) { valor = tenordenValor(al(s, 'tenor'), it.gun, base, kote); valorYaklasik = !!valor; }
    if (!valor) return { gerekce: String(al(s, 'valor') ?? '').trim() ? 'tarih-okunamadi' : 'bos-zorunlu-alan', alan: 'valor' };
    if (valor < it.gun) return { gerekce: 'valor-islem-tarihinden-once', alan: 'valor' };

    // Spot ve puan.
    let spotKur = sayiAl(s, 'spotKur');
    let puan = sayiAl(s, 'puan');
    if (puan !== null) puan *= puanOlcek;
    const spotGun = spotTarihi(it.gun, base, kote);
    let urun = urunBilgi?.urun ?? null;
    const fixing = tarihAl(s, 'fixingTarihi')?.gun ?? null;
    const baglantiHam = String(al(s, 'baglantiId') ?? '').trim();
    if (!urun) urun = fixing ? 'ndf' : baglantiHam ? 'swap' : valor > spotGun ? 'forward' : 'spot';
    if (spotKur === null && puan !== null) spotKur = kur - puan;
    if (spotKur !== null && puan === null) puan = kur - spotKur;
    if (spotKur === null && valor <= spotGun && urun !== 'swap') { spotKur = kur; puan = 0; }
    if (urun === 'ndf' && !fixing) return { gerekce: 'ndf-fixing-eksik', alan: 'fixingTarihi' };

    let rol = urunBilgi?.rol ?? rolCoz(al(s, 'bacakRol'));
    const portfoy = String(al(s, 'portfoy') ?? '').trim() || '(portföy yok)';
    const karsiAd = String(al(s, 'karsiTaraf') ?? '').trim();
    const bacak = {
      satirNo, durum, kaynakHam, refHam, baglantiHam,
      kaynakId: hashle(kaynakHam, tuz), refId: hashle(refHam, tuz), baglantiId: hashle(baglantiHam, tuz),
      urun, ndf: urun === 'ndf' || !!urunBilgi?.ndf, bacakRol: urun === 'swap' ? rol : 'tek',
      islemTarihi: it.gun, islemZamani, valor, valorYaklasik, spotGun,
      base, kote, parite: `${base}/${kote}`, yon: baseTutar > 0 ? 'al' : 'sat',
      baseTutar, koteTutar, kur, spotKur, puan, dealtDoviz: dealt,
      fixingTarihi: fixing, fixingKur: sayiAl(s, 'fixingKur') ?? (ayar.ndfFixing?.[kaynakHam] ?? null),
      odemeDovizi: String(al(s, 'odemeDovizi') ?? '').trim().toUpperCase() || null,
      portfoy, trader: traderKod(al(s, 'trader')) ?? '(trader yok)',
      karsiTarafTipi: karsiTarafTipiCoz(al(s, 'karsiTarafTipi'), al(s, 'portfoy'), karsiAd),
      karsiTarafHash: hashle(karsiAd, tuz), karsiTarafAd: ayar.adlariGoster ? karsiAd || null : null,
      maliyetKur: sayiAl(s, 'maliyetKur'), tlKarsiligi: (v => (v === null ? null : Math.abs(v)))(sayiAl(s, 'tlKarsiligi')),
    };
    return { bacak };
  }

  // ---- durum ve sürüm (§3.6, kurucu yanıtı 6: aynı işlem no tekrar ederse son satır geçerli)
  const sonSurum = new Map();
  for (const b of ham) if (b.kaynakHam) sonSurum.set(`${b.kaynakHam}|${b.bacakRol ?? ''}`, b);
  const iptalRef = new Set(ham.filter(b => b.durum === 'iptal' && b.refHam).map(b => b.refHam));
  const gecerli = [];
  for (const b of ham) {
    if (b.kaynakHam && sonSurum.get(`${b.kaynakHam}|${b.bacakRol ?? ''}`) !== b) {
      atlanan.push({ satirNo: b.satirNo, gerekce: 'eski-surum' });
      uyarilar.push({ kod: 'tekrar-eden-islem-no', satirNo: b.satirNo });
      continue;
    }
    if (b.durum !== 'gecerli') { atlanan.push({ satirNo: b.satirNo, gerekce: b.durum }); continue; }
    if (b.kaynakHam && iptalRef.has(b.kaynakHam)) { atlanan.push({ satirNo: b.satirNo, gerekce: 'iptal' }); continue; }
    gecerli.push(b);
  }

  // ---- swap bağlantısı: açık bağlantı alanı, yoksa "-1/-2" sonekli işlem no (önerilir, uyarı).
  const gruplar = new Map();
  for (const b of gecerli) {
    if (b.urun !== 'swap') continue;
    let anahtar = b.baglantiHam;
    if (!anahtar) {
      const m = b.kaynakHam.match(/^(.+?)[-_/.](1|2|n|f|near|far)$/i);
      if (m) { anahtar = 'sonek:' + m[1]; b.baglantiId = hashle(anahtar, tuz); b.baglantiOnerildi = true; }
    }
    if (!anahtar) anahtar = `tek:${b.satirNo}`;
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
    gruplar.get(anahtar).push(b);
  }
  const reddedilenSwap = new Set();
  for (const [anahtar, liste] of gruplar) {
    if (liste.length !== 2 || liste[0].yon === liste[1].yon || liste[0].parite !== liste[1].parite) {
      for (const b of liste) { reddedilenSwap.add(b); atlanan.push({ satirNo: b.satirNo, gerekce: 'tek-bacakli-swap' }); }
      continue;
    }
    liste.sort((x, y) => (x.valor < y.valor ? -1 : x.valor > y.valor ? 1 : 0));
    const [yakinB, uzakB] = liste;
    yakinB.bacakRol = 'yakin'; uzakB.bacakRol = 'uzak';
    if (!yakinB.baglantiId) yakinB.baglantiId = uzakB.baglantiId = hashle(anahtar, tuz);
    if (yakinB.baglantiOnerildi) uyarilar.push({ kod: 'swap-baglanti-onerildi', satirNo: yakinB.satirNo, detay: `${yakinB.satirNo}+${uzakB.satirNo}` });
    // Dengesiz swap (base tutarları farklı): roll sayılmaz, iki bacak vadeli/spot gibi işlenir.
    const dengeli = yakin(Math.abs(yakinB.baseTutar), Math.abs(uzakB.baseTutar), 1e-9);
    for (const b of liste) b.roll = dengeli;
    if (!dengeli) uyarilar.push({ kod: 'dengesiz-swap', satirNo: yakinB.satirNo });
  }

  const bacaklar = gecerli.filter(b => !reddedilenSwap.has(b));
  bacaklar.forEach((b, i) => {
    b.id = i + 1;
    delete b.kaynakHam; delete b.refHam; delete b.baglantiHam; delete b.durum; // ham değerler modelde tutulmaz
    if (b.urun !== 'swap') b.roll = false;
  });
  for (const b of bacaklar) if (b.valorYaklasik) { uyarilar.push({ kod: 'valor-tenordan', satirNo: b.satirNo }); }

  const say = sinif => atlanan.filter(a => GEREKCE_SINIF[a.gerekce] === sinif).length;
  const ozet = {
    okunanSatir: satirlar.length,
    baslikOncesi: sayac.baslikOncesi, baslikSatiri: 1, bosSatir: sayac.bos, toplamSatiri: sayac.toplamSatiri,
    aktarilan: bacaklar.length, dislanan: say('dislanan'), hatali: say('hata'),
  };
  return { bacaklar, atlanan, uyarilar, ozet, tespit, eslesme: e, eksik: [], puanOlcek, bicim };
}

// Kullanıcı eşleşmeyi değiştirdiğinde sayı/tarih biçimleri yeni sütunlar için yeniden tahmin edilir.
function bicimYenile(satirlar, tespit, e) {
  return tespit.baslikIndex < 0 ? {} : (() => {
    const veri = satirlar.slice(tespit.baslikIndex + 1).filter(s => !toplamSatiriMi(s));
    return bicimleriTahmin(veri, e);
  })();
}
export { KUR_TOLERANS };
