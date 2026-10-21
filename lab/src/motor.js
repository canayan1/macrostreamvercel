// Hızlı prova motoru: KalibreMotor.mq5'in mantığını mum verisi üzerinde taklit eder.
// Lab'da yalnız SENTETİK mumlarla çalışır. Gerçek backtest MT5 Strategy Tester'da yapılır.
//
// MQL5 Motor ile aynı olanlar: kurallar yeni mumun açılışında, son kapanmış mumla
// (kesişmelerde son iki mumla) değerlendirilir; önce çıkış kuralları, sonra giriş;
// ters sinyal karşı pozisyonu kapatır; aynı anda iki yön sinyali varsa işlem yok;
// lot = bakiye × risk% × volatilite ölçeği / stop mesafesi.
// Yaklaşık olanlar: mum içi sıra bilinmediği için aynı mumda hem stop hem hedef
// görülürse stop sayılır (ihtiyatlı); iz süren stop mum kapanışında güncellenir;
// spread, komisyon ve kayma yok; haber filtresi uygulanmaz.

import { hesapla } from './gostergeler.js';

const FIYAT = { acilis: 'a', yuksek: 'y', dusuk: 'd', kapanis: 'k' };
export const NOKTA = 0.001; // sentetik enstrümanın "puan" büyüklüğü

export function prova(s, mumlar, { baslangic = 10000 } = {}) {
  const g = hesapla(s.gostergeler, mumlar);
  const uyarilar = [];

  const deger = (o, i) => {
    if (typeof o === 'number') return o;
    if (i < 0) return NaN;
    const [ad, hat = ''] = o.split('.');
    if (ad === 'fiyat') return mumlar[i][FIYAT[hat]];
    return g[ad]?.[hat]?.[i] ?? NaN;
  };
  const kosul = (k, t) => {
    const a1 = deger(k.sol, t - 1), b1 = deger(k.sag, t - 1);
    if (Number.isNaN(a1) || Number.isNaN(b1)) return false;
    switch (k.op) {
      case '>': return a1 > b1;
      case '<': return a1 < b1;
      case '>=': return a1 >= b1;
      case '<=': return a1 <= b1;
    }
    const a2 = deger(k.sol, t - 2), b2 = deger(k.sag, t - 2);
    if (Number.isNaN(a2) || Number.isNaN(b2)) return false;
    return k.op === 'yukari_keser' ? a2 <= b2 && a1 > b1 : a2 >= b2 && a1 < b1;
  };
  const grupDogru = (gr, t) => {
    if (!gr) return false;
    if (gr.hepsi) return gr.hepsi.every(k => kosul(k, t));
    return (gr.herhangi ?? []).some(k => kosul(k, t));
  };
  const mesafe = (m, giris, stopM, t) => {
    if (!m) return 0;
    switch (m.tip) {
      case 'atr': { const v = g[m.gosterge]?.['']?.[t - 1]; return Number.isFinite(v) ? v * m.carpan : 0; }
      case 'oynaklik': { const v = g[m.gosterge]?.['']?.[t - 1]; return Number.isFinite(v) ? giris * v * m.carpan : 0; }
      case 'puan': return m.deger * NOKTA;
      case 'yuzde': return giris * m.deger / 100;
      case 'r': return stopM * m.deger;
    }
    return 0;
  };
  // Volatilite hedefi: risk × sınırla(1/oran, alt, ust). Oran yoksa (ısınma) giriş yok.
  const olcek = t => {
    const vh = s.risk.volatilite_hedefi;
    if (!vh) return 1;
    const o = g[vh.gosterge]?.oran?.[t - 1];
    if (!Number.isFinite(o) || o <= 0) return 0;
    return Math.min(vh.ust_carpan ?? 1.5, Math.max(vh.alt_carpan ?? 0.25, 1 / o));
  };
  const saatUygun = t => {
    const sa = s.filtre?.saat;
    if (!sa || sa.bas === sa.bit) return true;
    const h = new Date(mumlar[t].t * 1000).getUTCHours();
    return sa.bas < sa.bit ? h >= sa.bas && h < sa.bit : h >= sa.bas || h < sa.bit;
  };

  if (s.filtre?.haber) uyarilar.push('Haber filtresi provada uygulanmaz (MT5 takvimi gerekir).');
  if (s.risk?.max_spread_puan) uyarilar.push('Spread provada sıfır kabul edilir.');

  const yon = s.yon ?? 'iki_yon';
  const maxAcik = s.risk.max_acik_pozisyon ?? 1;
  let bakiye = baslangic, gun = '', gunBasi = baslangic;
  const acik = [], islemler = [], ozkaynak = [];

  const kapat = (p, t, fiyat, neden) => {
    const kar = (fiyat - p.giris) * p.miktar * p.yon;
    bakiye += kar;
    islemler.push({
      yon: p.yon > 0 ? 'long' : 'short', girisI: p.girisI, giris: p.giris, cikisI: t, cikis: fiyat,
      neden, kar, r: (fiyat - p.giris) * p.yon / p.stopM,
    });
    acik.splice(acik.indexOf(p), 1);
  };
  const kapatHepsi = (yonu, t, fiyat, neden) => {
    for (const p of [...acik]) if (p.yon === yonu) kapat(p, t, fiyat, neden);
  };

  for (let t = 0; t < mumlar.length; t++) {
    const m = mumlar[t];
    const gunAnahtari = new Date(m.t * 1000).toISOString().slice(0, 10);
    if (gunAnahtari !== gun) { gun = gunAnahtari; gunBasi = bakiye; }

    if (t >= 2) {
      // 1) açılışta boşlukla stop/hedef
      for (const p of [...acik]) {
        if (p.yon > 0 ? m.a <= p.sl : m.a >= p.sl) kapat(p, t, m.a, 'stop (boşluk)');
        else if (p.tp && (p.yon > 0 ? m.a >= p.tp : m.a <= p.tp)) kapat(p, t, m.a, 'hedef (boşluk)');
      }
      // 2) çıkış kuralları ve süre
      if (acik.some(p => p.yon > 0) && grupDogru(s.cikis.kosul?.long, t)) kapatHepsi(1, t, m.a, 'çıkış kuralı');
      if (acik.some(p => p.yon < 0) && grupDogru(s.cikis.kosul?.short, t)) kapatHepsi(-1, t, m.a, 'çıkış kuralı');
      if (s.cikis.max_bar)
        for (const p of [...acik]) if (t - p.girisI >= s.cikis.max_bar) kapat(p, t, m.a, 'süre doldu');

      // 3) giriş
      const L = yon !== 'sadece_short' && grupDogru(s.giris.long, t);
      const S = yon !== 'sadece_long' && grupDogru(s.giris.short, t);
      if (L !== S) {
        const y = L ? 1 : -1;
        kapatHepsi(-y, t, m.a, 'ters sinyal');
        const ozk = bakiye + acik.reduce((a, p) => a + (m.a - p.giris) * p.miktar * p.yon, 0);
        const kayipYuzde = (gunBasi - ozk) / gunBasi * 100;
        const izin = acik.length < maxAcik && saatUygun(t) &&
          !(s.risk.gunluk_max_kayip_yuzde && kayipYuzde >= s.risk.gunluk_max_kayip_yuzde);
        const stopM = mesafe(s.cikis.stop, m.a, 0, t);
        if (izin && stopM > 0 && olcek(t) > 0) {
          const hedefM = mesafe(s.cikis.hedef, m.a, stopM, t);
          acik.push({
            yon: y, girisI: t, giris: m.a, stopM,
            miktar: bakiye * s.risk.islem_basi_yuzde * olcek(t) / 100 / stopM,
            sl: m.a - y * stopM, tp: hedefM > 0 ? m.a + y * hedefM : 0,
          });
        }
      }

      // 4) mum içinde stop/hedef (ikisi birden görülürse stop)
      for (const p of [...acik]) {
        const stopVurdu = p.yon > 0 ? m.d <= p.sl : m.y >= p.sl;
        const hedefVurdu = p.tp && (p.yon > 0 ? m.y >= p.tp : m.d <= p.tp);
        if (stopVurdu) kapat(p, t, p.sl, p.izTasindi ? 'iz süren stop' : 'stop');
        else if (hedefVurdu) kapat(p, t, p.tp, 'hedef');
      }

      // 5) iz süren stop, kapanışta
      if (s.cikis.iz_suren_stop)
        for (const p of acik) {
          const d = mesafe(s.cikis.iz_suren_stop, p.giris, 0, t);
          if (d <= 0) continue;
          const yeni = m.k - p.yon * d;
          if (p.yon > 0 ? yeni > p.sl + d * 0.1 : yeni < p.sl - d * 0.1) { p.sl = yeni; p.izTasindi = true; }
        }
    }
    ozkaynak.push(bakiye + acik.reduce((a, p) => a + (m.k - p.giris) * p.miktar * p.yon, 0));
  }
  const son = mumlar.length - 1;
  for (const p of [...acik]) kapat(p, son, mumlar[son].k, 'prova sonu');

  return { islemler, ozkaynak, uyarilar, istatistik: istatistik(islemler, ozkaynak, baslangic) };
}

export function istatistik(islemler, ozkaynak, baslangic) {
  const n = islemler.length;
  const kazanan = islemler.filter(i => i.kar > 0), kaybeden = islemler.filter(i => i.kar <= 0);
  const topKazanc = kazanan.reduce((a, i) => a + i.kar, 0);
  const topKayip = -kaybeden.reduce((a, i) => a + i.kar, 0);
  let tepe = -Infinity, maxDd = 0;
  for (const e of ozkaynak) { tepe = Math.max(tepe, e); maxDd = Math.max(maxDd, (tepe - e) / tepe); }
  let seri = 0, enUzun = 0;
  for (const i of islemler) { seri = i.kar <= 0 ? seri + 1 : 0; enUzun = Math.max(enUzun, seri); }
  const ort = a => a.length ? a.reduce((x, i) => x + i.r, 0) / a.length : 0;
  return {
    islem: n,
    kazanmaOrani: n ? kazanan.length / n : 0,
    beklentiR: ort(islemler),
    ortKazancR: ort(kazanan),
    ortKayipR: ort(kaybeden),
    karFaktoru: topKayip > 0 ? topKazanc / topKayip : (topKazanc > 0 ? Infinity : 0),
    getiriYuzde: ((ozkaynak.at(-1) ?? baslangic) / baslangic - 1) * 100,
    maxDususYuzde: maxDd * 100,
    enUzunKayipSerisi: enUzun,
  };
}
