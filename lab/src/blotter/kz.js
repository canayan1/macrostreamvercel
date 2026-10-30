// FX blotter K/Z motoru (docs/fx-blotter-spec.md §4, kurucu yanıtları §9).
// - Gerçekleşen K/Z: FIFO (varsayılan) ya da ortalama maliyet, (portföy × parite [× trader]) bazında.
//   Tanınma tarihi: eşleşen bacakların geç olan valörü (kurucu yanıtı 7: gerçekleşen valörde tanınır).
// - Fiyat ve puan ayrımı: iki tarafın spot kuru biliniyorsa fiyat = q × spot farkı, puan = kalan.
// - Swap (dengeli): roll; pozisyona ve fiyat K/Z'sine girmez, yalnız puan etkisi (kurucu yanıtı 3, 8).
// - NDF: fixing kuru verildiyse ve fixing tarihi geçtiyse tek başına uzlaşır (§4.3); yoksa açık pozisyon.
// - Açık pozisyon (artık lotlar): MTM ve taşıma için.
// Saf modül; tutarlar kote dövizinde, çevirme gorunum.js'de.

const zaman = b => (b.islemZamani ?? Date.parse(b.islemTarihi + 'T00:00:00Z') / 1000);
const sirala = (a, b) => zaman(a) - zaman(b) || a.satirNo - b.satirNo;
const gec = (a, b) => (a > b ? a : b);

export function anahtarBul(b, traderBazli) {
  return traderBazli ? `${b.portfoy}|${b.trader}|${b.parite}` : `${b.portfoy}|${b.parite}`;
}

// ayar: { yontem: 'fifo'|'ortalama', traderBazli: false, tarih: 'YYYY-MM-DD' (analiz günü) }
export function kzHesapla(bacaklar, ayar = {}) {
  const yontem = ayar.yontem === 'ortalama' ? 'ortalama' : 'fifo';
  const traderBazli = !!ayar.traderBazli;
  const tarih = ayar.tarih ?? bacaklar.reduce((m, b) => gec(m, b.islemTarihi), '');
  const gerceklesen = [], swaplar = [], ndfUzlasan = [], uyarilar = [];
  const havuz = new Map(); // anahtar → { lotlar: [], bas: 0 } (FIFO) ya da { lot } (ortalama)
  const havuzBacak = [];

  // ---- swap roll: dengeli çiftler
  const swapGrup = new Map();
  for (const b of bacaklar) if (b.urun === 'swap' && b.roll) {
    if (!swapGrup.has(b.baglantiId)) swapGrup.set(b.baglantiId, []);
    swapGrup.get(b.baglantiId).push(b);
  }
  for (const [, l] of swapGrup) {
    if (l.length !== 2) continue;
    const [y, u] = l[0].bacakRol === 'yakin' ? l : [l[1], l[0]];
    // Toplam kote akışı = puan etkisi (nominal, iskontosuz): −(y.base×y.kur + u.base×u.kur).
    const puan = y.koteTutar + u.koteTutar;
    swaplar.push({
      tur: 'swap', parite: y.parite, kote: y.kote, base: y.base, portfoy: y.portfoy, trader: y.trader,
      miktar: y.baseTutar, yakinKur: y.kur, uzakKur: u.kur, puanFark: u.kur - y.kur,
      yakinValor: y.valor, uzakValor: u.valor, taninma: u.valor, kote_puan: puan,
      bacakIdler: [y.id, u.id], kapanis: u, acilis: y,
    });
  }

  // ---- NDF: fixing kuru ve tarihi geçmiş olanlar ayrı uzlaşır
  for (const b of bacaklar) {
    if (b.roll) continue;
    if (b.ndf && b.urun !== 'swap' && b.fixingKur > 0 && b.fixingTarihi && b.fixingTarihi <= tarih) {
      const kote = b.baseTutar * (b.fixingKur - b.kur);
      ndfUzlasan.push({
        tur: 'ndf', parite: b.parite, kote: b.kote, base: b.base, portfoy: b.portfoy, trader: b.trader,
        miktar: b.baseTutar, kur: b.kur, fixingKur: b.fixingKur, taninma: b.valor, kote_toplam: kote,
        odemeDovizi: b.odemeDovizi ?? b.base, odeme_tutar: b.base === (b.odemeDovizi ?? b.base) ? kote / b.fixingKur : kote,
        bacakIdler: [b.id], kapanis: b, acilis: b,
      });
      continue;
    }
    havuzBacak.push(b);
  }

  // ---- gerçekleşen K/Z
  havuzBacak.sort(sirala);
  for (const b of havuzBacak) {
    const k = anahtarBul(b, traderBazli);
    let h = havuz.get(k);
    if (!h) { h = { lotlar: [], bas: 0, lot: null }; havuz.set(k, h); }
    if (yontem === 'fifo') fifoIsle(h, b, k);
    else ortalamaIsle(h, b, k);
  }

  function kayit(k, b, acilisLot, q, kapanisKur, acilisKur, acilisSpot, kapanisSpot, acilisValor, acilisIdler, uzun) {
    // uzun: kapanan lot uzun (alım) mı. q > 0 base miktarı.
    const toplam = uzun ? q * (kapanisKur - acilisKur) : q * (acilisKur - kapanisKur);
    let fiyat = null, puan = null;
    if (acilisSpot !== null && acilisSpot !== undefined && kapanisSpot !== null && kapanisSpot !== undefined) {
      fiyat = uzun ? q * (kapanisSpot - acilisSpot) : q * (acilisSpot - kapanisSpot);
      puan = toplam - fiyat;
    }
    gerceklesen.push({
      tur: 'gerceklesen', anahtar: k, parite: b.parite, base: b.base, kote: b.kote, portfoy: b.portfoy, trader: b.trader,
      miktar: q, uzun, acilisKur, kapanisKur, kote_toplam: toplam, kote_fiyat: fiyat, kote_puan: puan,
      ayrimYok: fiyat === null, taninma: gec(acilisValor, b.valor), kapanisTarihi: b.islemTarihi,
      bacakIdler: [...new Set([...acilisIdler, b.id])], kapanis: b,
    });
  }

  function fifoIsle(h, b, k) {
    let kalan = b.baseTutar;
    while (Math.abs(kalan) > 1e-9 && h.bas < h.lotlar.length) {
      const lot = h.lotlar[h.bas];
      if (Math.sign(lot.miktar) === Math.sign(kalan)) break;
      const q = Math.min(Math.abs(lot.miktar), Math.abs(kalan));
      kayit(k, b, lot, q, b.kur, lot.kur, lot.spotKur, b.spotKur, lot.valor, [lot.bacakId], lot.miktar > 0);
      lot.miktar += lot.miktar > 0 ? -q : q;
      kalan += kalan > 0 ? -q : q;
      if (Math.abs(lot.miktar) <= 1e-9) h.bas++;
    }
    if (Math.abs(kalan) > 1e-9) {
      h.lotlar.push({ miktar: kalan, kur: b.kur, spotKur: b.spotKur, valor: b.valor, bacakId: b.id, bacak: b, anahtar: k });
    }
  }

  function ortalamaIsle(h, b, k) {
    let kalan = b.baseTutar;
    const lot = h.lot;
    if (lot && Math.abs(lot.miktar) > 1e-9 && Math.sign(lot.miktar) !== Math.sign(kalan)) {
      const q = Math.min(Math.abs(lot.miktar), Math.abs(kalan));
      kayit(k, b, lot, q, b.kur, lot.kur, lot.spotKur, b.spotKur, lot.valor, lot.bacakIdler, lot.miktar > 0);
      lot.miktar += lot.miktar > 0 ? -q : q;
      kalan += kalan > 0 ? -q : q;
      if (Math.abs(lot.miktar) <= 1e-9) h.lot = null;
    }
    if (Math.abs(kalan) > 1e-9) {
      if (!h.lot) h.lot = { miktar: 0, kur: 0, spotKur: null, spotTamam: true, valor: b.valor, bacakIdler: [], bacak: b, anahtar: k };
      const L = h.lot, yeni = L.miktar + kalan;
      L.kur = (L.kur * Math.abs(L.miktar) + b.kur * Math.abs(kalan)) / Math.abs(yeni);
      if (b.spotKur === null || b.spotKur === undefined) L.spotTamam = false;
      L.spotKur = L.spotTamam ? ((L.spotKur ?? 0) * Math.abs(L.miktar) + b.spotKur * Math.abs(kalan)) / Math.abs(yeni) : null;
      L.miktar = yeni;
      L.valor = gec(L.valor, b.valor);
      L.bacakIdler.push(b.id);
    }
  }

  // ---- açık pozisyon (artık lotlar)
  const acik = [];
  for (const [k, h] of havuz) {
    const lotlar = yontem === 'fifo' ? h.lotlar.slice(h.bas).filter(l => Math.abs(l.miktar) > 1e-9) : (h.lot ? [h.lot] : []);
    for (const l of lotlar) {
      const b = l.bacak;
      acik.push({
        anahtar: k, parite: b.parite, base: b.base, kote: b.kote, portfoy: b.portfoy, trader: b.trader,
        miktar: l.miktar, kur: l.kur, spotKur: l.spotKur, valor: l.valor, ndf: !!b.ndf, urun: b.urun,
        bacakIdler: l.bacakIdler ?? [l.bacakId], bacak: b,
      });
    }
  }
  return { yontem, traderBazli, tarih, gerceklesen, swaplar, ndfUzlasan, acik, havuzBacak, uyarilar };
}

// Müşteri marjı (kurucu yanıtı 9): maliyet kuru varsa marj = −baseTutar × (kur − maliyet) (kote dövizinde).
// Maliyet yoksa ve kullanıcı yüzde verdiyse müşteri bacağında |koteTutar| × yüzde (varsayım, işaretli).
// Back-to-back (§4.5): müşteri bacağı + ters yönlü interbank bacağı, aynı parite, tutar ±%10, ≤ N dakika.
export function marjHesapla(bacaklar, ayar = {}) {
  const yuzde = Number(ayar.marjYuzde);
  const pencere = (ayar.b2bDakika ?? 5) * 60;
  const kalemler = [];
  for (const b of bacaklar) {
    if (b.roll) continue;
    if (b.maliyetKur > 0) {
      kalemler.push({ tur: 'maliyet', bacak: b, kote_marj: -b.baseTutar * (b.kur - b.maliyetKur), bps: Math.sign(-b.baseTutar) * (b.kur - b.maliyetKur) / b.maliyetKur * 1e4, bacakIdler: [b.id] });
    } else if (b.karsiTarafTipi === 'musteri' && Number.isFinite(yuzde) && yuzde > 0) {
      kalemler.push({ tur: 'yuzde', bacak: b, kote_marj: Math.abs(b.koteTutar) * yuzde / 100, bps: yuzde * 100, varsayim: true, bacakIdler: [b.id] });
    }
  }
  // Back-to-back eşleşme: maliyet kuru olmayan müşteri bacakları için.
  const musteri = bacaklar.filter(b => !b.roll && b.karsiTarafTipi === 'musteri' && !(b.maliyetKur > 0));
  const ib = bacaklar.filter(b => !b.roll && b.karsiTarafTipi === 'interbank');
  const kullanildi = new Set();
  const b2b = [];
  // İndeks: parite → zamana göre sıralı interbank bacakları (zamansız olanlar gün bazında ayrı).
  const zamanli = new Map(), gunluk = new Map();
  for (const i of ib) {
    const m = i.islemZamani === null || i.islemZamani === undefined ? gunluk : zamanli;
    const a = i.islemZamani === null || i.islemZamani === undefined ? `${i.parite}|${i.islemTarihi}` : i.parite;
    if (!m.has(a)) m.set(a, []);
    m.get(a).push(i);
  }
  for (const l of zamanli.values()) l.sort((x, y) => x.islemZamani - y.islemZamani);
  const ilkIndeks = (l, t) => { let lo = 0, hi = l.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (l[mid].islemZamani < t) lo = mid + 1; else hi = mid; } return lo; };
  for (const m of musteri) {
    let en = null, enFark = Infinity;
    const zamansiz = m.islemZamani === null || m.islemZamani === undefined;
    const aday = zamansiz ? (gunluk.get(`${m.parite}|${m.islemTarihi}`) ?? []) : (zamanli.get(m.parite) ?? []);
    const bas = zamansiz ? 0 : ilkIndeks(aday, m.islemZamani - pencere);
    for (let j = bas; j < aday.length; j++) {
      const i = aday[j];
      if (!zamansiz && i.islemZamani > m.islemZamani + pencere) break;
      if (kullanildi.has(i) || Math.sign(i.baseTutar) === Math.sign(m.baseTutar)) continue;
      const oran = Math.abs(i.baseTutar) / Math.abs(m.baseTutar);
      if (oran < 0.9 || oran > 1.1) continue;
      const dt = zamansiz ? 0 : Math.abs(m.islemZamani - i.islemZamani);
      if (dt < enFark) { en = i; enFark = dt; }
    }
    if (!en) continue;
    kullanildi.add(en);
    const q = Math.min(Math.abs(m.baseTutar), Math.abs(en.baseTutar));
    const [satis, alis] = m.baseTutar < 0 ? [m, en] : [en, m];
    b2b.push({ tur: 'b2b', bacak: m, karsilik: en, miktar: q, kote_marj: q * (satis.kur - alis.kur), bps: (satis.kur - alis.kur) / alis.kur * 1e4, bacakIdler: [m.id, en.id] });
  }
  return { kalemler, b2b, musteriSayisi: musteri.length };
}
