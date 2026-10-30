// FX blotter analizi: K/Z motoru + değerleme + çevrim + görünümler + mutabakat (§4-5, kurucu yanıtları §9).
// Her sonuç kalemi ("katkı") USD karşılığı ve yerel para ile taşınır; her toplam bacaklara iner.

import { kzHesapla, marjHesapla } from './kz.js';
import { mtmHesapla, tasimaHesapla } from './degerleme.js';
import { cevirici } from './kur.js';
import { gunSayisi } from './model.js';

// Fırsat maliyeti: tanım kurucu onayı bekliyor (§9 açık soru). Onaylanana kadar sayı gösterilmez.
export const FIRSAT_MALIYETI_ONAYLI = false;

export const OLCULER = ['fiyat', 'puan', 'ayrimYok', 'tasima', 'mtm', 'toplam'];
export const BOYUTLAR = [
  { id: 'parite', ad: 'Parite', f: k => k.parite },
  { id: 'portfoy', ad: 'Portföy', f: k => k.portfoy },
  { id: 'trader', ad: 'Trader', f: k => k.trader },
  { id: 'tur', ad: 'Kalem türü', f: k => k.tur },
  { id: 'urun', ad: 'Ürün', f: k => k.kapanis?.urun ?? '–' },
  { id: 'karsiTaraf', ad: 'Karşı taraf tipi', f: k => k.kapanis?.karsiTarafTipi ?? '–' },
  { id: 'buyukluk', ad: 'İşlem büyüklüğü (USD)', f: k => k.buyukluk ?? '–' },
  { id: 'saat', ad: 'Saat', f: k => k.saat ?? '–' },
  { id: 'gun', ad: 'Haftanın günü', f: k => k.gun ?? '–' },
];
const BUYUKLUK = [[1e6, '< 1 mn'], [5e6, '1-5 mn'], [10e6, '5-10 mn'], [25e6, '10-25 mn'], [Infinity, '≥ 25 mn']];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const KOVALAR = ['Geçmiş/bugün', 'TOM', 'SPOT', '≤ 1 hafta', '≤ 1 ay', '≤ 3 ay', '≤ 6 ay', '≤ 1 yıl', '> 1 yıl'];
export function kovaBul(valor, tarih) {
  const g = gunSayisi(tarih, valor);
  if (g <= 0) return KOVALAR[0];
  if (g === 1) return KOVALAR[1];
  if (g <= 3) return KOVALAR[2];
  if (g <= 7) return KOVALAR[3];
  if (g <= 31) return KOVALAR[4];
  if (g <= 92) return KOVALAR[5];
  if (g <= 183) return KOVALAR[6];
  if (g <= 366) return KOVALAR[7];
  return KOVALAR[8];
}

// ayar: { yontem, traderBazli, tarih, kurTablosu {pair: rate}, yerelDoviz, tnPuan, faiz, marjYuzde, gosterimSaatDilimi, limitler: [] }
export function blotterAnaliz(bacaklar, ayar = {}) {
  const kz = kzHesapla(bacaklar, ayar);
  const tarih = kz.tarih;
  const cevir = cevirici(ayar.kurTablosu ?? {}, ayar.yerelDoviz ?? null);
  const mtm = mtmHesapla(kz.acik, cevir);
  const tasima = tasimaHesapla(kz.acik, cevir, tarih, { tnPuan: ayar.tnPuan, faiz: ayar.faiz });
  const marj = marjHesapla(bacaklar, ayar);
  const tz = Number(ayar.gosterimSaatDilimi ?? 0) || 0;

  // ---- katkılar (tek tip kayıt): her biri kote dövizindeki tutarlar + USD karşılığı
  const katkilar = [];
  const ekle = (k, kote) => {
    const u = x => (x === null || x === undefined ? null : cevir.usd(x, k.kote));
    const c = {
      ...k, kote_fiyat: kote.fiyat ?? 0, kote_puan: kote.puan ?? 0, kote_ayrimYok: kote.ayrimYok ?? 0, kote_tasima: kote.tasima ?? 0, kote_mtm: kote.mtm ?? 0,
      eksik: kote.eksik ?? false,
    };
    c.kote_toplam = c.kote_fiyat + c.kote_puan + c.kote_ayrimYok + c.kote_tasima + c.kote_mtm;
    c.usd = { fiyat: u(c.kote_fiyat), puan: u(c.kote_puan), ayrimYok: u(c.kote_ayrimYok), tasima: u(c.kote_tasima), mtm: u(c.kote_mtm), toplam: u(c.kote_toplam) };
    c.usdEksik = c.usd.toplam === null && c.kote_toplam !== 0;
    const b = k.kapanis;
    if (b) {
      const not = cevir.usd(Math.abs(b.baseTutar), b.base);
      c.buyukluk = not === null ? null : BUYUKLUK.find(([s]) => not < s)[1];
      if (b.islemZamani !== null && b.islemZamani !== undefined) {
        const d = new Date((b.islemZamani + tz * 3600) * 1000);
        c.saat = String(d.getUTCHours()).padStart(2, '0') + ':00';
        c.gun = GUNLER[d.getUTCDay()];
      } else c.gun = GUNLER[new Date(b.islemTarihi + 'T00:00:00Z').getUTCDay()];
    }
    katkilar.push(c);
  };
  for (const g of kz.gerceklesen) ekle({ ...g, taninmis: g.taninma <= tarih }, g.ayrimYok ? { ayrimYok: g.kote_toplam } : { fiyat: g.kote_fiyat, puan: g.kote_puan });
  for (const s of kz.swaplar) ekle({ ...s, taninmis: s.taninma <= tarih }, { puan: s.kote_puan });
  for (const n of kz.ndfUzlasan) ekle({ ...n, taninmis: n.taninma <= tarih }, { fiyat: n.kote_toplam });
  for (const m of mtm) ekle({ ...m, taninmis: true }, m.kote_mtm === null ? { eksik: true } : { mtm: m.kote_mtm });
  for (const t of tasima) ekle({ ...t, taninmis: true }, t.kote_tasima === null ? { eksik: true } : { tasima: t.kote_tasima });

  const toplam = toplamla(katkilar);
  const pozisyon = pozisyonHesapla(bacaklar, kz, cevir);
  const merdiven = merdivenHesapla(bacaklar, tarih, cevir);
  const marjOzet = marjOzetle(marj, cevir);
  const limitler = limitDegerlendir(ayar.limitler ?? [], { bacaklar, kz, pozisyon, merdiven, katkilar, cevir, tarih });
  return { tarih, kz, mtm, tasima, marj, marjOzet, katkilar, toplam, pozisyon, merdiven, limitler, cevir, eksikKur: eksikKurlar(katkilar, pozisyon) };
}

export function toplamla(katkilar) {
  const t = { fiyat: 0, puan: 0, ayrimYok: 0, tasima: 0, mtm: 0, toplam: 0, adet: 0, usdEksik: 0, bacakIdler: new Set() };
  for (const k of katkilar) {
    t.adet++;
    if (k.usdEksik) { t.usdEksik++; }
    for (const o of OLCULER) if (k.usd[o] !== null) t[o] += k.usd[o];
    for (const id of k.bacakIdler) t.bacakIdler.add(id);
  }
  return t;
}

// Gruplama ("grupla X, ölç Y"): her grup bacaklara iner. Alt toplamların genel toplama eşitliği mutabakatta.
export function grupla(katkilar, boyutId) {
  const boyut = BOYUTLAR.find(b => b.id === boyutId) ?? BOYUTLAR[0];
  const m = new Map();
  for (const k of katkilar) {
    const a = String(boyut.f(k));
    if (!m.has(a)) m.set(a, []);
    m.get(a).push(k);
  }
  return [...m.entries()].map(([ad, l]) => ({ ad, ...toplamla(l), katkilar: l })).sort((x, y) => x.toplam - y.toplam);
}

// ---- döviz bazında pozisyon (NOP): roll swaplar ve uzlaşmış NDF hariç (kurucu yanıtı 3).
function pozisyonHesapla(bacaklar, kz, cevir) {
  const uzlasan = new Set(kz.ndfUzlasan.map(n => n.kapanis.id));
  const d = new Map();
  const ekle = (doviz, tutar, id) => {
    if (!d.has(doviz)) d.set(doviz, { doviz, tutar: 0, bacakIdler: [] });
    const x = d.get(doviz); x.tutar += tutar; x.bacakIdler.push(id);
  };
  for (const b of bacaklar) {
    if (b.roll || uzlasan.has(b.id)) continue;
    ekle(b.base, b.baseTutar, b.id);
    ekle(b.kote, b.koteTutar, b.id);
  }
  const satirlar = [...d.values()].map(x => ({ ...x, usd: cevir.usd(x.tutar, x.doviz) }));
  let uzun = 0, kisa = 0, eksik = 0;
  for (const s of satirlar) {
    if (s.usd === null) { eksik++; continue; }
    if (s.usd > 0) uzun += s.usd; else kisa += -s.usd;
  }
  return { satirlar: satirlar.sort((a, b) => Math.abs(b.usd ?? 0) - Math.abs(a.usd ?? 0)), uzun, kisa, kisaYol: Math.max(uzun, kisa), eksik };
}

// ---- valör merdiveni: tüm bacakların nakit akışları (swaplar dahil); NDF ayrı işaretli (teslimsiz).
function merdivenHesapla(bacaklar, tarih, cevir) {
  const h = new Map();
  for (const b of bacaklar) {
    const kova = kovaBul(b.valor, tarih);
    for (const [doviz, tutar] of [[b.base, b.baseTutar], [b.kote, b.koteTutar]]) {
      const anahtar = `${b.ndf ? 'NDF ' : ''}${doviz}`;
      if (!h.has(anahtar)) h.set(anahtar, { doviz, ndf: !!b.ndf, kovalar: Object.fromEntries(KOVALAR.map(k => [k, { tutar: 0, bacakIdler: [] }])) });
      const c = h.get(anahtar).kovalar[kova];
      c.tutar += tutar; c.bacakIdler.push(b.id);
    }
  }
  return [...h.values()].map(s => ({ ...s, usdKur: cevir.usd(1, s.doviz) }));
}

function marjOzetle(marj, cevir) {
  const kalem = [...marj.kalemler, ...marj.b2b];
  let usd = 0, eksik = 0;
  for (const k of kalem) { const u = cevir.usd(k.kote_marj, k.bacak.kote); k.usd_marj = u; if (u === null) eksik++; else usd += u; }
  return { kalem, usd, eksik };
}

// ---- kullanıcı tanımlı limitler (hepsi isteğe bağlı; kurucu yanıtı 10 için örnek türler).
// { tur: 'nop-doviz', doviz, usd } | { tur: 'gece', usd } | { tur: 'gunici', kapsam: 'trader'|'portfoy', ad, usd }
// | { tur: 'stop-loss', kapsam: 'trader'|'portfoy'|'masa', ad, usd } | { tur: 'valor-araligi', doviz, kova, usd }
export function limitDegerlendir(limitler, b) {
  return limitler.map(L => {
    let kullanim = null, detay = '';
    if (L.tur === 'nop-doviz') kullanim = Math.abs(b.pozisyon.satirlar.find(s => s.doviz === L.doviz)?.usd ?? 0);
    else if (L.tur === 'gece') kullanim = b.pozisyon.kisaYol;
    else if (L.tur === 'gunici') kullanim = gunIciTepe(b.bacaklar.filter(x => !x.roll && (L.kapsam === 'portfoy' ? x.portfoy === L.ad : x.trader === L.ad)), b.tarih, b.cevir);
    else if (L.tur === 'stop-loss') {
      const ilgili = b.katkilar.filter(k => (L.kapsam === 'masa' || (L.kapsam === 'portfoy' ? k.portfoy === L.ad : k.trader === L.ad))
        && (k.tur === 'mtm' || k.tur === 'tasima' || k.kapanis?.islemTarihi === b.tarih));
      const kz = ilgili.reduce((s, k) => s + (k.usd.toplam ?? 0), 0);
      kullanim = kz < 0 ? -kz : 0; detay = String(kz);
    } else if (L.tur === 'valor-araligi') {
      const s = b.merdiven.find(m => m.doviz === L.doviz && !m.ndf);
      const t = s?.kovalar[L.kova]?.tutar ?? 0;
      kullanim = Math.abs(t * (s?.usdKur ?? NaN));
      if (!Number.isFinite(kullanim)) kullanim = null;
    }
    const oran = kullanim === null || !(L.usd > 0) ? null : kullanim / L.usd;
    return { ...L, kullanim, oran, durum: oran === null ? 'hesaplanamadi' : oran > 1 ? 'asildi' : oran > 0.8 ? 'yakin' : 'icinde', detay };
  });
}

// Gün içi tepe NOP (kısa yol, USD): analiz gününden önceki bacaklarla başlayan pozisyon, gün içindeki
// bacaklar zaman sırasıyla eklenir; her adımda max(Σuzun, Σ|kısa|).
function gunIciTepe(bacaklar, tarih, cevir) {
  const once = bacaklar.filter(b => b.islemTarihi < tarih);
  const gun = bacaklar.filter(b => b.islemTarihi === tarih).sort((a, b) => (a.islemZamani ?? 0) - (b.islemZamani ?? 0) || a.satirNo - b.satirNo);
  const poz = new Map();
  const ekle = (d, t) => poz.set(d, (poz.get(d) ?? 0) + t);
  for (const b of once) { ekle(b.base, b.baseTutar); ekle(b.kote, b.koteTutar); }
  const olc = () => {
    let u = 0, k = 0;
    for (const [d, t] of poz) { const x = cevir.usd(t, d); if (x === null) return null; if (x > 0) u += x; else k -= x; }
    return Math.max(u, k);
  };
  let tepe = olc() ?? 0;
  for (const b of gun) { ekle(b.base, b.baseTutar); ekle(b.kote, b.koteTutar); const v = olc(); if (v === null) return null; tepe = Math.max(tepe, v); }
  return tepe;
}

// Eksik girdiler, okunur kodlarla: 'mtm:EUR/USD:spot-kur-yok', 'mtm:EUR/USD:kur-yok', 'tasima:EUR/USD', 'kur:INR'.
function eksikKurlar(katkilar, pozisyon) {
  const s = new Set();
  for (const k of katkilar) {
    if (k.tur === 'mtm' && k.eksik) s.add(`mtm:${k.parite}:${k.eksikNeden ?? 'kur-yok'}`);
    else if (k.tur === 'tasima' && k.eksik) s.add(`tasima:${k.parite}`);
    else if (k.usdEksik) s.add(`kur:${k.kote}`);
  }
  for (const p of pozisyon.satirlar) if (p.usd === null) s.add(`kur:${p.doviz}`);
  return [...s];
}

// Limit satırları (kullanıcı tanımlı, hepsi isteğe bağlı). Satır başına bir limit, tutarlar USD:
//   NOP <DÖVİZ> <tutar>                    döviz bazında net açık pozisyon
//   GECE <tutar>                           gece taşınan toplam (kısa yol) NOP
//   GUNICI trader|portfoy <ad...> <tutar>  gün içi tepe NOP
//   STOP masa|trader|portfoy [<ad...>] <tutar>  günlük zarar (gerçekleşen o gün + MTM + taşıma)
//   VALOR <DÖVİZ> <kova> <tutar>           valör aralığı (gap): kova ör. "≤ 1 ay"
export function limitleriCoz(metin) {
  const limitler = [], hatalar = [];
  String(metin ?? '').split(/\r?\n/).forEach((satir, i) => {
    const s = satir.trim();
    if (!s || s.startsWith('#')) return;
    const p = s.split(/\s+/);
    const tutar = Number(String(p[p.length - 1]).replace(/[_,.](?=\d{3}(\D|$))/g, ''));
    const tur = (p[0] || '').toUpperCase();
    const ad = p.slice(2, -1).join(' ');
    if (!(tutar > 0)) { hatalar.push(i + 1); return; }
    if (tur === 'NOP' && p.length === 3) limitler.push({ tur: 'nop-doviz', doviz: p[1].toUpperCase(), usd: tutar, satir: s });
    else if (tur === 'GECE' && p.length === 2) limitler.push({ tur: 'gece', usd: tutar, satir: s });
    else if (tur === 'GUNICI' && /^(trader|portfoy|portföy)$/i.test(p[1]) && ad) limitler.push({ tur: 'gunici', kapsam: /^trader$/i.test(p[1]) ? 'trader' : 'portfoy', ad, usd: tutar, satir: s });
    else if (tur === 'STOP' && /^(masa|trader|portfoy|portföy)$/i.test(p[1])) limitler.push({ tur: 'stop-loss', kapsam: /^masa$/i.test(p[1]) ? 'masa' : /^trader$/i.test(p[1]) ? 'trader' : 'portfoy', ad, usd: tutar, satir: s });
    else if (tur === 'VALOR' && p.length >= 4 && KOVALAR.includes(p.slice(2, -1).join(' '))) limitler.push({ tur: 'valor-araligi', doviz: p[1].toUpperCase(), kova: p.slice(2, -1).join(' '), usd: tutar, satir: s });
    else hatalar.push(i + 1);
  });
  return { limitler, hatalar };
}
