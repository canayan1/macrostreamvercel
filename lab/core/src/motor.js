// Hızlı prova motoru: KalibreMotor.mq5'in mantığını mum verisi üzerinde taklit eder.
// Lab'da yalnız SENTETİK mumlarla çalışır. Gerçek backtest MT5 Strategy Tester'da yapılır.
//
// MQL5 Motor ile aynı olanlar: kurallar yeni mumun açılışında, son kapanmış mumla
// (kesişmelerde son iki mumla) değerlendirilir; önce çıkış kuralları, sonra giriş;
// ters sinyal karşı pozisyonu kapatır; aynı anda iki yön sinyali varsa işlem yok;
// lot = bakiye × risk% × volatilite ölçeği / stop mesafesi.
// Yaklaşık olanlar: mum içi sıra bilinmediği için aynı mumda hem stop hem hedef
// görülürse stop sayılır (ihtiyatlı); iz süren stop mum kapanışında güncellenir;
// haber filtresi uygulanmaz. Kurallar ayrıntılı olarak docs/motor-kurallari.md'de.
//
// Maliyet (isteğe bağlı, varsayılan sıfır = brüt sonuç). Mumlar bid fiyatıdır (MT5 gibi); ask = bid + spread:
//   spread : fiyat biriminde. Long ask'tan (alış + spread) açılır, bid'den kapanır; short bid'den
//            açılır, ask'tan kapanır. Short'un stop ve hedefi ask'a (fiyat + spread) göre tetiklenir.
//   kayma  : fiyat biriminde; piyasa emirlerine (giriş, kural ve süre çıkışı, stop, boşluk, prova
//            sonu) aleyhte uygulanır. Hedef (limit) emirleri kaymaz.
//   komisyonYuzde: işlem hacminin yüzdesi, giriş ve çıkışta ayrı ayrı (tur başına iki kez);
//            işlem kapanırken kârdan düşülür.

import { hesapla } from './gostergeler.js';
import { fark } from './esitlik.js';
import { enstrumanHazirla, kurFonksiyonu, lotYuvarla, teminat, tickDenetimi } from './enstruman.js';
import { DOLUM_MODELLERI, altMumAraliklari, ilkVurus } from './dolum.js';
import { t } from './ceviri.js';

const FIYAT = { acilis: 'a', yuksek: 'y', dusuk: 'd', kapanis: 'k' };
export const NOKTA = 0.001; // sentetik enstrümanın "puan" büyüklüğü

export { ESIT_PAY, fark } from './esitlik.js';

export const MALIYETSIZ = Object.freeze({ spread: 0, kayma: 0, komisyonYuzde: 0 });

export function maliyetVar(m) {
  return !!m && (m.spread > 0 || m.kayma > 0 || m.komisyonYuzde > 0);
}

// girisBaslangic (isteğe bağlı, Unix saniye): bu zamandan önce açılan mumlarda yeni giriş yapılmaz;
// göstergeler yine ilk mumdan hesaplanır. MT5 Strategy Tester'ın ısınma geçmişini taklit etmek için
// (aşama C, docs/dogrulama/C-raporu.md). Verilmezse davranış değişmez.
// basamak (isteğe bağlı, tamsayı): fiyat basamağı. Verilirse stop, hedef ve iz süren stop seviyeleri
// MQL5 Motor'daki NormalizeDouble gibi bu basamağa yuvarlanır (MT5 verisinde fark #9 kalkar). Sentetik
// veride ve verilmezse yuvarlama yoktur.
// miktarAdimi (isteğe bağlı, birim): miktar bu adımın katına aşağı yuvarlanır (aracı kurumun lot adımı ×
// sözleşme büyüklüğü; ör. EURUSD 0,01 × 100.000 = 1.000). 0'a inerse giriş yapılmaz. Verilmezse miktar
// sürekli (fark #7). Kote para birimi hesap para birimiyse MQL5 Motor'un lot hesabıyla aynı sonucu verir.
// enstruman (isteğe bağlı): enstrüman ve maliyet modeli v2 (lot, kur çevrimi, lot başı komisyon, swap,
// teminat ve stop out); ayrıntı enstruman.js. Verilirse miktarAdimi yok sayılır (lot adımı kullanılır).
// dolum (isteğe bağlı): aynı mumda hem stop hem hedef görülürse hangisinin önce dolduğu
// ('stop-once' varsayılan, 'acilisa-yakin', 'ohlc', 'm1'); ayrıntı dolum.js. 'm1' için altMumlar gerekir.
export function prova(s, mumlar, { baslangic = 10000, maliyet = MALIYETSIZ, girisBaslangic = -Infinity, basamak, miktarAdimi, enstruman, dolum = 'stop-once', altMumlar } = {}) {
  if (!DOLUM_MODELLERI.includes(dolum)) throw new Error(`bilinmeyen dolum modeli: ${dolum}`);
  const E = enstrumanHazirla(enstruman);
  const kurF = E ? kurFonksiyonu(E) : null;
  const altAralik = dolum === 'm1' ? altMumAraliklari(mumlar, altMumlar ?? []) : null;
  let belirsizMum = 0, altMumYok = 0, minLotAtlanan = 0, teminatAtlanan = 0, stopOutSay = 0;
  let swapToplam = 0, komisyonToplam = 0, tickUyarisi = null, simdiT = 0;
  const adimMiktar = Number(miktarAdimi) > 0 ? Number(miktarAdimi) : 0;
  const carpan = Number.isInteger(basamak) && basamak >= 0 ? 10 ** basamak : 0;
  // Yarım basamakta MQL5 NormalizeDouble gibi yukarı (sıfırdan uzağa) yuvarlar: 1,166845 → 1,16685.
  // İkili kayan noktada 116684,4999… görünen yarımlar için küçük bir pay eklenir.
  const yuv = x => carpan ? Math.sign(x) * Math.round(Math.abs(x) * carpan + 1e-6) / carpan : x;
  const g = hesapla(s.gostergeler, mumlar);
  const sp = Math.max(0, Number(maliyet?.spread) || 0);
  const ky = Math.max(0, Number(maliyet?.kayma) || 0);
  const kom = Math.max(0, Number(maliyet?.komisyonYuzde) || 0) / 100;
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
    const d1 = fark(a1, b1);
    switch (k.op) {
      case '>': return d1 > 0;
      case '<': return d1 < 0;
      case '>=': return d1 >= 0;
      case '<=': return d1 <= 0;
    }
    const a2 = deger(k.sol, t - 2), b2 = deger(k.sag, t - 2);
    if (Number.isNaN(a2) || Number.isNaN(b2)) return false;
    const d2 = fark(a2, b2);
    return k.op === 'yukari_keser' ? d2 <= 0 && d1 > 0 : d2 >= 0 && d1 < 0;
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
      case 'puan': return m.deger * (E ? E.nokta : NOKTA);
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
  if (s.risk?.max_spread_puan) {
    if (sp > 0) uyarilar.push('En yüksek spread filtresi provada uygulanmaz: spread sabit kabul edilir.');
    else uyarilar.push('Spread provada sıfır kabul edilir.');
  }

  const yon = s.yon ?? 'iki_yon';
  const maxAcik = s.risk.max_acik_pozisyon ?? 1;
  let bakiye = baslangic, gun = '', gunBasi = baslangic;
  const acik = [], islemler = [], ozkaynak = [];

  // Bir pozisyonun kapanış fiyatı: long bid'den (fiyat), short ask'tan (fiyat + spread);
  // piyasa emirlerinde kayma aleyhte eklenir. Hedef (limit) için piyasa = false.
  const cikisFiyati = (p, fiyat, piyasa) => p.yon > 0 ? fiyat - (piyasa ? ky : 0) : fiyat + sp + (piyasa ? ky : 0);
  // Stop ve hedef fiyatları doğrudan seviyedir (short için ask seviyesi); seviyeden çıkışta spread
  // tekrar eklenmez, yalnız stoplarda kayma eklenir.
  const seviyedenCikis = (p, seviye, kaymali) => seviye - p.yon * (kaymali ? ky : 0);
  const kapat = (p, t, fiyat, neden) => {
    if (E) {
      // v2: fiyat farkı kote para biriminde, kapanış anındaki kurla hesap para birimine çevrilir.
      const kurC = kurF(mumlar[t].t, fiyat);
      const komisyon = (p.giris + fiyat) * p.miktar * kom * kurC + p.lot * E.komisyonLot * 2;
      const kar = (fiyat - p.giris) * p.miktar * p.yon * kurC - komisyon + p.swap;
      bakiye += kar;
      komisyonToplam += komisyon;
      islemler.push({
        yon: p.yon > 0 ? 'long' : 'short', girisI: p.girisI, giris: p.giris, cikisI: t, cikis: fiyat,
        neden, kar, r: kar / (p.stopM * p.miktar * p.kurG), komisyon, miktar: p.miktar, lot: p.lot, swap: p.swap,
      });
      acik.splice(acik.indexOf(p), 1);
      return;
    }
    const komisyon = (p.giris + fiyat) * p.miktar * kom;
    const kar = (fiyat - p.giris) * p.miktar * p.yon - komisyon;
    bakiye += kar;
    islemler.push({
      yon: p.yon > 0 ? 'long' : 'short', girisI: p.girisI, giris: p.giris, cikisI: t, cikis: fiyat,
      neden, kar, r: kar / (p.stopM * p.miktar), komisyon, miktar: p.miktar,
    });
    acik.splice(acik.indexOf(p), 1);
  };
  const kapatHepsi = (yonu, t, fiyat, neden) => {
    for (const p of [...acik]) if (p.yon === yonu) kapat(p, t, cikisFiyati(p, fiyat, true), neden);
  };
  // Açık pozisyonun anlık değeri: long bid'den, short ask'tan.
  const deger_ = E
    ? (p, fiyat) => { const f = p.yon > 0 ? fiyat : fiyat + sp; return (f - p.giris) * p.miktar * p.yon * kurF(simdiT, f) + p.swap; }
    : (p, fiyat) => ((p.yon > 0 ? fiyat : fiyat + sp) - p.giris) * p.miktar * p.yon;
  const kullanilanTeminat = () => acik.reduce((a, p) => a + p.teminat, 0);

  for (let t = 0; t < mumlar.length; t++) {
    const m = mumlar[t];
    simdiT = m.t;
    const gunAnahtari = new Date(m.t * 1000).toISOString().slice(0, 10);
    if (gunAnahtari !== gun) {
      // v2 swap: gün değişiminde açık her pozisyona bir gecelik swap; biten gün ucluSwapGunu ise üç gece.
      if (E && gun && (E.swapLong || E.swapShort) && acik.length) {
        const gece = new Date(`${gun}T00:00:00Z`).getUTCDay() === E.ucluSwapGunu ? 3 : 1;
        for (const p of acik) { const w = p.lot * (p.yon > 0 ? E.swapLong : E.swapShort) * gece; p.swap += w; swapToplam += w; }
      }
      gun = gunAnahtari; gunBasi = bakiye;
    }

    if (t >= 2) {
      // 1) açılışta boşlukla stop/hedef (short seviyeleri ask = açılış + spread ile karşılaştırılır)
      for (const p of [...acik]) {
        const acilis = p.yon > 0 ? m.a : m.a + sp;
        if (p.yon > 0 ? fark(acilis, p.sl) <= 0 : fark(acilis, p.sl) >= 0) kapat(p, t, seviyedenCikis(p, acilis, true), 'stop (boşluk)');
        // Hedef boşlukta hedef seviyesinden dolar (lehe fiyat iyileşmesi sayılmaz). MT5 Strategy Tester
        // da böyle doldurur (aşama C); böylece prova hiçbir boşlukta MT5'ten iyimser olmaz.
        else if (p.tp && (p.yon > 0 ? fark(acilis, p.tp) >= 0 : fark(acilis, p.tp) <= 0)) kapat(p, t, p.tp, 'hedef (boşluk)');
      }
      // 2) çıkış kuralları ve süre
      if (acik.some(p => p.yon > 0) && grupDogru(s.cikis.kosul?.long, t)) kapatHepsi(1, t, m.a, 'çıkış kuralı');
      if (acik.some(p => p.yon < 0) && grupDogru(s.cikis.kosul?.short, t)) kapatHepsi(-1, t, m.a, 'çıkış kuralı');
      if (s.cikis.max_bar)
        for (const p of [...acik]) if (t - p.girisI >= s.cikis.max_bar) kapat(p, t, cikisFiyati(p, m.a, true), 'süre doldu');

      // 3) giriş
      const L = yon !== 'sadece_short' && grupDogru(s.giris.long, t);
      const S = yon !== 'sadece_long' && grupDogru(s.giris.short, t);
      if (L !== S) {
        const y = L ? 1 : -1;
        kapatHepsi(-y, t, m.a, 'ters sinyal');
        const ozk = bakiye + acik.reduce((a, p) => a + deger_(p, m.a), 0);
        const kayipYuzde = (gunBasi - ozk) / gunBasi * 100;
        const izin = m.t >= girisBaslangic && acik.length < maxAcik && saatUygun(t) &&
          !(s.risk.gunluk_max_kayip_yuzde && kayipYuzde >= s.risk.gunluk_max_kayip_yuzde);
        // Giriş fiyatı: long ask'tan (açılış + spread), short bid'den (açılış); kayma aleyhte.
        const giris = y > 0 ? m.a + sp + ky : m.a - ky;
        const stopM = mesafe(s.cikis.stop, giris, 0, t);
        // Miktar: sürekli; miktarAdimi verilirse aşağı yuvarlanır ve 0'a inerse işlem atlanır (MQL5 Motor'da
        // "asgari lot riski aşıyor").
        if (E) {
          // v2: lot = risk tutarı / (stop mesafesi × sözleşme × kote→hesap kuru), lot adımına aşağı yuvarlanır.
          const kurG = kurF(m.t, giris);
          if (!tickUyarisi) tickUyarisi = tickDenetimi(E, giris, kurG) ?? false;
          const risk = bakiye * s.risk.islem_basi_yuzde * olcek(t) / 100;
          const hamLot = stopM > 0 ? risk / (stopM * E.sozlesme * kurG) : 0;
          const lot = lotYuvarla(hamLot, E);
          if (izin && stopM > 0 && olcek(t) > 0) {
            if (!(lot > 0)) { if (hamLot > 0) minLotAtlanan++; }
            else {
              const tem = teminat(E, lot, giris, kurG);
              const serbest = bakiye + acik.reduce((a, p) => a + deger_(p, m.a), 0) - kullanilanTeminat();
              if (E.teminatVar && tem > serbest) teminatAtlanan++;
              else {
                const hedefM = mesafe(s.cikis.hedef, giris, stopM, t);
                acik.push({
                  yon: y, girisI: t, giris, stopM, miktar: lot * E.sozlesme, lot, kurG, swap: 0, teminat: tem,
                  sl: yuv(giris - y * stopM), tp: hedefM > 0 ? yuv(giris + y * hedefM) : 0,
                });
              }
            }
          }
        } else {
        const ham = stopM > 0 ? bakiye * s.risk.islem_basi_yuzde * olcek(t) / 100 / stopM : 0;
        const miktar = adimMiktar > 0 ? Math.floor(ham / adimMiktar + 1e-9) * adimMiktar : ham;
        if (izin && stopM > 0 && olcek(t) > 0 && miktar > 0) {
          const hedefM = mesafe(s.cikis.hedef, giris, stopM, t);
          acik.push({
            yon: y, girisI: t, giris, stopM, miktar,
            sl: yuv(giris - y * stopM), tp: hedefM > 0 ? yuv(giris + y * hedefM) : 0,
          });
        }
        }
      }

      // 4) mum içinde stop/hedef (ikisi birden görülürse stop); short ask (fiyat + spread) ile
      for (const p of [...acik]) {
        // Seviyeye tam değme de tetikler; ask = bid + spread toplamındaki kayan nokta artığı eşitlik payıyla yok sayılır.
        const stopVurdu = p.yon > 0 ? fark(m.d, p.sl) <= 0 : fark(m.y + sp, p.sl) >= 0;
        const hedefVurdu = p.tp && (p.yon > 0 ? fark(m.y, p.tp) >= 0 : fark(m.d + sp, p.tp) <= 0);
        let stopOnce = true;
        if (stopVurdu && hedefVurdu) {
          belirsizMum++;
          if (dolum !== 'stop-once') {
            const v = ilkVurus(dolum, p, m, sp, altAralik ? altMumlar.slice(...altAralik[t]) : null);
            if (v === null) altMumYok++;
            else stopOnce = v === 'stop';
          }
        }
        if (stopVurdu && stopOnce) kapat(p, t, seviyedenCikis(p, p.sl, true), p.izTasindi ? 'iz süren stop' : 'stop');
        else if (hedefVurdu) kapat(p, t, p.tp, 'hedef');
      }

      // 4b) v2 stop out: mumun en aleyhte fiyatıyla teminat seviyesi stopOut yüzdesinin altına inerse
      // tüm pozisyonlar o fiyattan kapanır (yaklaşık: aracı kurum en zararlıdan başlayarak kapatır).
      if (E && E.teminatVar && acik.length) {
        const kt = kullanilanTeminat();
        const kotu = p => (p.yon > 0 ? m.d : m.y);
        const ozkKotu = bakiye + acik.reduce((a, p) => a + deger_(p, kotu(p)), 0);
        if (kt > 0 && ozkKotu / kt * 100 < E.stopOut) {
          stopOutSay++;
          for (const p of [...acik]) kapat(p, t, cikisFiyati(p, kotu(p), true), 'stop out');
        }
      }

      // 5) iz süren stop, kapanışta
      if (s.cikis.iz_suren_stop)
        for (const p of acik) {
          const d = mesafe(s.cikis.iz_suren_stop, p.giris, 0, t);
          if (d <= 0) continue;
          const yeni = yuv((p.yon > 0 ? m.k : m.k + sp) - p.yon * d);
          if (p.yon > 0 ? yeni > p.sl + d * 0.1 : yeni < p.sl - d * 0.1) { p.sl = yeni; p.izTasindi = true; }
        }
    }
    ozkaynak.push(bakiye + acik.reduce((a, p) => a + deger_(p, m.k), 0));
  }
  const son = mumlar.length - 1;
  for (const p of [...acik]) kapat(p, son, cikisFiyati(p, mumlar[son].k, true), 'prova sonu');
  // Prova sonu kapanışı maliyetliyse (kayma, komisyon) son özkaynak gerçek bakiyeye eşitlenir;
  // böylece son özkaynak = başlangıç + işlem sonuçları toplamı.
  if (ozkaynak.length) ozkaynak[ozkaynak.length - 1] = bakiye;

  // Dolum raporu: belirsizMum = hem stop hem hedefin aynı mumda görüldüğü durum sayısı;
  // belirsizOran = belirsizMum / işlem sayısı (sonuçların mum içi sıra varsayımına ne kadar bağlı olduğu).
  const dolumRaporu = { model: dolum, belirsizMum, belirsizOran: islemler.length ? belirsizMum / islemler.length : 0 };
  if (dolum === 'm1') dolumRaporu.altMumYok = altMumYok;
  const sonuc = {
    islemler, ozkaynak, uyarilar,
    maliyet: { spread: sp, kayma: ky, komisyonYuzde: kom * 100 }, maliyetli: sp > 0 || ky > 0 || kom > 0,
    istatistik: istatistik(islemler, ozkaynak, baslangic),
    dolum: dolumRaporu,
  };
  if (E) {
    if (tickUyarisi) uyarilar.push(t('Verilen tick değeri ({v}) hesaplanandan ({h}) farklı; kâr sözleşme büyüklüğü ve kurla hesaplandı.', { v: tickUyarisi.verilen, h: tickUyarisi.hesaplanan.toPrecision(6) }));
    if (minLotAtlanan) uyarilar.push(t('{n} girişte hesaplanan lot en küçük lotun altında kaldı; işlem açılmadı.', { n: minLotAtlanan }));
    if (teminatAtlanan) uyarilar.push(t('{n} girişte serbest teminat yetmedi; işlem açılmadı.', { n: teminatAtlanan }));
    if (stopOutSay) uyarilar.push(t('Teminat seviyesi {n} kez stop out sınırının altına indi.', { n: stopOutSay }));
    sonuc.enstruman = { swapToplam, komisyonToplam, minLotAtlanan, teminatAtlanan, stopOut: stopOutSay };
  }
  return sonuc;
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
