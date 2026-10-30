// FX blotter alan tespiti (docs/fx-blotter-spec.md §3.3-3.5).
// Girdi: satır dizileri (her satır hücre metinleri; `no` özelliği dosyadaki satır numarası).
// Çıktı: başlık satırı, sütun → kanonik alan eşleşmesi, her alan için güven puanı, sütun biçimleri.

import { norm, pariteCoz, dovizMi, sayiBicimiTahmin, sayiAyristir, tarihBicimiTahmin, tarihAyristir, saatAyristir } from './model.js';

// Kanonik alan → eş anlamlılar (EN/TR/DE/FR + FIX tag). Normalize edilmiş biçimde karşılaştırılır.
export const SOZLUK = {
  kaynakId: ['Trade ID', 'Deal No', 'Deal Number', 'Deal ID', 'Ticket', 'ExecID', 'Ref', 'Reference', 'Trade Ref', '17', 'İşlem No', 'Dekont No', 'Referans', 'İşlem Numarası', 'Geschäftsnummer', 'Numéro d\'opération'],
  refId: ['ExecRefID', 'Orig Trade ID', 'Original ID', 'Cancels', '19', 'İlgili İşlem', 'Orijinal İşlem'],
  durum: ['Status', 'State', 'Trade Status', 'ExecType', '150', '22A', 'Durum', 'Statü', 'Statut'],
  urun: ['Product', 'Deal Type', 'Instrument Type', 'Trade Type', 'Product Type', 'İşlem Tipi', 'Ürün', 'İşlem Türü', 'Geschäftsart', 'Produkt', 'Type d\'opération'],
  islemTarihi: ['Trade Date', 'Deal Date', 'Execution Date', 'TradeDate', '75', 'İşlem Tarihi', 'İşlem Tar', 'Anlaşma Tarihi', 'Handelstag', 'Abschlussdatum', 'Geschäftsdatum', 'Date de transaction', 'Date de négociation'],
  islemZamani: ['Execution Time', 'Execution Time (UTC)', 'Trade Time', 'Time', 'Timestamp', 'TransactTime', '60', 'Saat', 'İşlem Saati', 'Zaman', 'Uhrzeit', 'Zeitstempel', 'Heure'],
  valor: ['Value Date', 'Settlement Date', 'Settle Date', 'Maturity', 'Maturity Date', 'SettlDate', '64', 'Valör', 'Valör Tarihi', 'Valor', 'Vade Tarihi', 'Valuta', 'Valutadatum', 'Fälligkeit', 'Date de valeur', 'Date de règlement'],
  tenor: ['Tenor', 'Period', 'SettlType', '63', 'Vade Kodu', 'Laufzeit', 'Échéance'],
  parite: ['Currency Pair', 'Ccy Pair', 'CcyPair', 'Symbol', 'Instrument', 'Pair', '55', 'Parite', 'Döviz Çifti', 'Währungspaar', 'Paire de devises'],
  yon: ['Side', 'Buy/Sell', 'B/S', 'Direction', 'Action', 'Buy Sell', '54', 'Alış/Satış', 'A/S', 'Yön', 'İşlem Yönü', 'Kauf/Verkauf', 'Richtung', 'Sens', 'Achat/Vente'],
  dealtDoviz: ['Dealt Currency', 'Dealt Ccy', 'Currency', 'Notional Ccy', 'Ccy', '15', 'Döviz Cinsi', 'Döviz', 'İşlem Dövizi', 'Währung', 'Handelswährung', 'Devise'],
  tutar: ['Notional', 'Amount', 'Dealt Amount', 'Quantity', 'Qty', 'Notional Amount', '32', '38', 'Tutar', 'Nominal', 'Miktar', 'Betrag', 'Montant'],
  karsiDoviz: ['Counter Currency', 'Contra Ccy', 'Counter Ccy', 'Contra Currency', 'Karşı Döviz', 'Gegenwährung', 'Contre-devise'],
  karsiTutar: ['Counter Amount', 'Contra Amount', 'Settlement Amount', 'Counter Notional', '1056', 'Karşı Tutar', 'Karşılık Tutar', 'Gegenbetrag', 'Contre-valeur'],
  alisDoviz: ['Buy Currency', 'Buy Ccy', 'Bought Ccy', 'Bought Currency', 'Alınan Döviz', 'Alış Dövizi', 'Kaufwährung', 'Devise achetée'],
  alisTutar: ['Buy Amount', 'Amount Bought', 'Bought Amount', 'Alınan Tutar', 'Alış Tutarı', 'Kaufbetrag', 'Montant acheté'],
  satisDoviz: ['Sell Currency', 'Sell Ccy', 'Sold Ccy', 'Sold Currency', 'Satılan Döviz', 'Satış Dövizi', 'Verkaufswährung', 'Devise vendue'],
  satisTutar: ['Sell Amount', 'Amount Sold', 'Sold Amount', 'Satılan Tutar', 'Satış Tutarı', 'Verkaufsbetrag', 'Montant vendu'],
  kur: ['Rate', 'All-in Rate', 'All in Rate', 'Deal Rate', 'Price', 'Exchange Rate', 'LastPx', 'Fx Rate', '31', 'Kur', 'İşlem Kuru', 'Anlaşma Kuru', 'Kurs', 'Abschlusskurs', 'Cours', 'Taux'],
  spotKur: ['Spot Rate', 'Spot', 'LastSpotRate', '194', 'Spot Kur', 'Spot Kuru', 'Kassakurs', 'Cours spot'],
  puan: ['Forward Points', 'Fwd Points', 'Fwd Pts', 'Swap Points', 'Points', 'LastForwardPoints', '195', 'Forward Puan', 'Forward Puanı', 'Swap Puanı', 'Puan', 'Swapsatz', 'Terminpunkte', 'Points de terme'],
  maliyetKur: ['Cost Rate', 'Cost', 'Cover Rate', 'Desk Cost', 'Transfer Rate', 'Maliyet', 'Maliyet Kuru', 'Maliyet Kur', 'Kosten', 'Coût'],
  tlKarsiligi: ['TL Karşılığı', 'TL Karsiligi', 'TRY Equivalent', 'TRY Eq', 'TL Tutar', 'TL Eşdeğeri'],
  baglantiId: ['Swap ID', 'Link ID', 'Parent ID', 'Package ID', 'Swap Ref', 'Swap No', 'Bağlı İşlem', 'Swap-Referenz', 'Réf. swap'],
  bacakRol: ['Leg', 'Near/Far', 'Leg Type', 'Bacak', 'Yakın/Uzak', 'Jambe'],
  karsiTaraf: ['Counterparty', 'Cpty', 'Bank', 'Client', 'Party B', 'Counterparty Name', 'Karşı Taraf', 'Müşteri', 'Banka', 'Kontrahent', 'Gegenpartei', 'Contrepartie'],
  lei: ['LEI', 'Cpty LEI', 'Counterparty LEI'],
  portfoy: ['Book', 'Portfolio', 'Desk', 'Account', '1', 'Portföy', 'Defter', 'Masa', 'Portfolio', 'Buch', 'Portefeuille'],
  trader: ['Trader', 'Dealer', 'User', 'Requester', 'Dealer Name', 'İşlemci', 'Händler', 'Opérateur'],
  fixingTarihi: ['Fixing Date', 'Valuation Date', 'Fixing Tarihi', 'Fixingtag', 'Date de fixing'],
  fixingKaynagi: ['Fixing Source', 'Settlement Rate Source', 'Fixing Kaynağı', 'Fixingquelle', 'Source de fixing'],
  fixingKur: ['Fixing Rate', 'Fixing', 'Fixing Kuru', 'Settlement Rate'],
  odemeDovizi: ['Settlement Currency', 'Settl Ccy', 'SettlCurrency', '120', 'Ödeme Dövizi', 'Abwicklungswährung', 'Devise de règlement'],
  karsiTarafTipi: ['Counterparty Type', 'Client Type', 'Cpty Type', 'Flow Type', 'Karşı Taraf Tipi', 'Müşteri Tipi'],
  opsiyonIz: ['Strike', 'Premium', 'Expiry', 'Expiry Date', 'Call/Put', 'Put/Call', 'Option Type', 'Kullanım Fiyatı', 'Prim'],
};

const NSOZ = Object.fromEntries(Object.entries(SOZLUK).map(([k, l]) => [k, [...new Set(l.map(norm))]]));
// Alan sırası (aynı başlık birden çok alana uyuyorsa ilk geçen kazanır; ör. "Spot" önce spotKur).
const ALANLAR = Object.keys(SOZLUK);

export function baslikPuani(baslik, alan) {
  const n = norm(baslik);
  if (!n) return 0;
  const liste = NSOZ[alan];
  if (liste.includes(n)) return 1;
  // Sayısal FIX tag'leri yalnız tam eşleşir.
  if (/^\d+$/.test(n)) return 0;
  let en = 0;
  for (const e of liste) {
    if (e.length < 3 || /^\d+$/.test(e)) continue;
    if (n.includes(e) || (e.includes(n) && n.length >= 4)) en = Math.max(en, 0.8 * Math.min(1, Math.min(e.length, n.length) / Math.max(e.length, n.length) + 0.4));
  }
  return Math.min(0.8, en);
}

// ---------------------------------------------------------------- başlık satırı ve toplam satırları
const TOPLAM_RE = /^(toplam|genel toplam|ara toplam|total|totals|grand total|sub ?total|summe|gesamt|zwischensumme|somme|total general)\b/i;
export const toplamSatiriMi = satir => {
  const ilk = satir.find(h => String(h ?? '').trim() !== '');
  return ilk !== undefined && TOPLAM_RE.test(String(ilk).trim());
};

// İlk 30 satırda en çok sözlük isabeti olan satır başlıktır (en az 3 isabet).
export function baslikSatiriBul(satirlar) {
  let en = -1, enPuan = 0;
  for (let i = 0; i < Math.min(30, satirlar.length); i++) {
    let puan = 0;
    for (const h of satirlar[i]) {
      let b = 0;
      for (const a of ALANLAR) b = Math.max(b, baslikPuani(h, a));
      if (b >= 0.8) puan += b;
    }
    if (puan > enPuan + 1e-9) { enPuan = puan; en = i; }
  }
  return enPuan >= 3 ? en : -1;
}

// ---------------------------------------------------------------- değer örüntüleri
const YON_RE = /^(buy|sell|b|s|1|2|al|sat|alis|satis|a|kauf|verkauf|achat|vente|long|short|clientbuys|clientsells|banksells|bankbuys|requesterbuy|requestersell|musterialis|musterisatis|bankaalis|bankasatis)/;
const TIP_KOSUL = {
  doviz: v => dovizMi(String(v).trim().toUpperCase()),
  parite: v => pariteCoz(v) !== null,
  tarih: v => tarihAyristir(v) !== null,
  saat: v => saatAyristir(v) !== null || /^\d{8}-\d{2}:\d{2}/.test(String(v)) || (tarihAyristir(v)?.saniye ?? null) !== null,
  sayi: v => sayiAyristir(v) !== null,
  yon: v => YON_RE.test(norm(v)),
  metin: v => String(v).trim() !== '',
};
// Alan → beklenen değer tipi.
const ALAN_TIP = {
  kaynakId: 'metin', refId: 'metin', durum: 'metin', urun: 'metin', islemTarihi: 'tarih', islemZamani: 'saat', valor: 'tarih',
  tenor: 'metin', parite: 'parite', yon: 'yon', dealtDoviz: 'doviz', tutar: 'sayi', karsiDoviz: 'doviz', karsiTutar: 'sayi',
  alisDoviz: 'doviz', alisTutar: 'sayi', satisDoviz: 'doviz', satisTutar: 'sayi', kur: 'sayi', spotKur: 'sayi', puan: 'sayi',
  maliyetKur: 'sayi', tlKarsiligi: 'sayi', baglantiId: 'metin', bacakRol: 'metin', karsiTaraf: 'metin', lei: 'metin',
  portfoy: 'metin', trader: 'metin', fixingTarihi: 'tarih', fixingKaynagi: 'metin', fixingKur: 'sayi', odemeDovizi: 'doviz',
  karsiTarafTipi: 'metin', opsiyonIz: 'metin',
};
export const ZORUNLU_ALANLAR = ['islemTarihi', 'valor', 'yon'];

function ornekDegerler(veri, j, n = 500) {
  const d = [];
  for (const s of veri) { const v = s[j]; if (v !== undefined && String(v).trim() !== '') d.push(v); if (d.length >= n) break; }
  return d;
}
function tipOrani(degerler, tip) {
  if (!degerler.length) return 0;
  const k = TIP_KOSUL[tip];
  let n = 0;
  for (const v of degerler) if (k(v)) n++;
  return n / degerler.length;
}

// Ana tespit. Döner: { baslikIndex, basliklar, eslesme: {alan: sutunNo}, guven: {alan: 0..1},
//   bicim: { sayi: {sutun: 'nokta'|'virgul'}, tarih: {sutun: {bicim}} }, bakis: 'biz'|'karsi'|null, uyarilar }
export function alanTespit(satirlar) {
  const bi = baslikSatiriBul(satirlar);
  if (bi < 0) return { baslikIndex: -1, basliklar: [], eslesme: {}, guven: {}, bicim: { sayi: {}, tarih: {} }, bakis: null, uyarilar: ['baslik-yok'] };
  const basliklar = satirlar[bi].map(h => String(h ?? '').trim());
  const veri = satirlar.slice(bi + 1).filter(s => !toplamSatiriMi(s));
  // Aday puanları.
  const adaylar = [];
  for (let j = 0; j < basliklar.length; j++) {
    const ornek = ornekDegerler(veri, j);
    for (const alan of ALANLAR) {
      const b = baslikPuani(basliklar[j], alan);
      if (b <= 0) continue;
      const v = tipOrani(ornek, ALAN_TIP[alan]);
      const komsu = b >= 0.8 && v >= 0.9 ? 1 : 0;
      adaylar.push({ alan, j, guven: 0.5 * b + 0.4 * v + 0.1 * komsu, b, v });
    }
  }
  // "Vade" gibi belirsiz başlık: tarih değerleri varsa valör sayılır, kod ise tenor.
  for (let j = 0; j < basliklar.length; j++) {
    if (norm(basliklar[j]) === 'vade') {
      const v = tipOrani(ornekDegerler(veri, j), 'tarih');
      adaylar.push({ alan: v >= 0.8 ? 'valor' : 'tenor', j, guven: 0.5 * 0.8 + 0.4 * (v >= 0.8 ? v : 1), b: 0.8, v });
    }
  }
  adaylar.sort((a, b) => b.guven - a.guven || ALANLAR.indexOf(a.alan) - ALANLAR.indexOf(b.alan));
  const eslesme = {}, guven = {}, kullanilan = new Set();
  for (const a of adaylar) {
    if (a.alan in eslesme || kullanilan.has(a.j) || a.guven < 0.45) continue;
    eslesme[a.alan] = a.j; guven[a.alan] = Math.round(a.guven * 100) / 100; kullanilan.add(a.j);
  }
  // Değer örüntüsüyle tamamlama: parite sütunu başlıksız kaldıysa.
  if (!('parite' in eslesme)) {
    for (let j = 0; j < basliklar.length; j++) {
      if (kullanilan.has(j)) continue;
      const v = tipOrani(ornekDegerler(veri, j), 'parite');
      if (v >= 0.9) { eslesme.parite = j; guven.parite = Math.round(0.4 * v * 100) / 100 + 0.2; kullanilan.add(j); break; }
    }
  }
  const bicim = bicimleriTahmin(veri, eslesme);
  const bakis = bakisTahmin(veri, eslesme.yon);
  const uyarilar = [];
  for (const a of zorunluEksik(eslesme)) uyarilar.push(`eksik:${a}`);
  return { baslikIndex: bi, basliklar, eslesme, guven, bicim, bakis, uyarilar };
}

// Zorunlu alanlar: işlem tarihi, valör, yön, tutar (tek tutar + kur ya da iki tutar), parite (ya da iki döviz).
export function zorunluEksik(e) {
  const eksik = [];
  if (!('islemTarihi' in e)) eksik.push('islemTarihi');
  if (!('valor' in e)) eksik.push('valor');
  const ikiTutar = 'alisDoviz' in e && 'alisTutar' in e && 'satisDoviz' in e && 'satisTutar' in e;
  if (!ikiTutar) {
    if (!('yon' in e)) eksik.push('yon');
    if (!('tutar' in e)) eksik.push('tutar');
    if (!('kur' in e) && !('karsiTutar' in e)) eksik.push('kur');
    if (!('parite' in e) && !('dealtDoviz' in e && 'karsiDoviz' in e)) eksik.push('parite');
  }
  return eksik;
}

export function bicimleriTahmin(veri, eslesme) {
  const sayi = {}, tarih = {};
  const sayiAlan = ['tutar', 'karsiTutar', 'alisTutar', 'satisTutar', 'kur', 'spotKur', 'puan', 'maliyetKur', 'tlKarsiligi', 'fixingKur'];
  // Dosya genel sayı biçimi: belirsiz sütunlar için.
  const tum = [];
  for (const a of sayiAlan) if (a in eslesme) tum.push(...ornekDegerler(veri, eslesme[a], 200));
  const genel = sayiBicimiTahmin(tum);
  for (const a of sayiAlan) if (a in eslesme) sayi[eslesme[a]] = sayiBicimiTahmin(ornekDegerler(veri, eslesme[a])) ?? genel ?? 'nokta';
  for (const a of ['islemTarihi', 'valor', 'fixingTarihi', 'islemZamani']) if (a in eslesme) tarih[eslesme[a]] = tarihBicimiTahmin(ornekDegerler(veri, eslesme[a]));
  // Tarih sütunları birbirini bilgilendirir: biri kesin DMY/MDY ise belirsiz olanlar ona uyar.
  const kesin = Object.values(tarih).find(t => t && (t.bicim === 'dmy' || t.bicim === 'mdy') && !t.belirsiz && !t.celiski);
  if (kesin) for (const k of Object.keys(tarih)) if (tarih[k]?.belirsiz) tarih[k] = { bicim: kesin.bicim };
  return { sayi, tarih, genel };
}

// Yön sütunundaki ifadelerden bakış açısı ipucu: "Client Buys" → karşı tarafın gözü.
function bakisTahmin(veri, j) {
  if (j === undefined) return null;
  let karsi = 0, biz = 0;
  for (const v of ornekDegerler(veri, j, 200)) {
    const n = norm(v);
    if (/^(client|customer|musteri)/.test(n)) karsi++;
    else if (/^(bank|banka|we|our|requester)/.test(n)) biz++;
  }
  return karsi > biz ? 'karsi' : biz > karsi ? 'biz' : null;
}
