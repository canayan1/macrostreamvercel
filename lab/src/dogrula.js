// Strateji dosyası doğrulayıcı (tarayıcı, bağımlılıksız).
// schema/strateji.schema.json + Strateji.mqh'deki anlamsal kurallarla aynı kararı
// vermelidir; araclar/dogrula.test.mjs ikisini karşılaştırır.
// Her hata { yol, mesaj } döner; yol arayüzde alanın yanına hata yazmak için kullanılır.

export const ZAMAN_DILIMLERI = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
export const GOSTERGE_TIPLERI = ['SMA', 'EMA', 'RSI', 'ATR', 'ADX', 'BB', 'MACD', 'EWMA_VOL', 'YZ_VOL', 'GARCH_VOL'];
export const OYNAKLIK = ['EWMA_VOL', 'YZ_VOL', 'GARCH_VOL'];
export const OPERATORLER = ['>', '<', '>=', '<=', 'yukari_keser', 'asagi_keser'];
export const HATLAR = {
  SMA: ['', 'ana'], EMA: ['', 'ana'], RSI: ['', 'ana'], ATR: ['', 'ana'],
  ADX: ['', 'ana', 'arti', 'eksi'],
  BB: ['', 'orta', 'ust', 'alt'],
  MACD: ['', 'ana', 'sinyal'],
  EWMA_VOL: ['', 'ana', 'oran'], YZ_VOL: ['', 'ana', 'oran'], GARCH_VOL: ['', 'ana', 'oran', 'uzun'],
};
const AD_DESENI = /^[a-z][a-z0-9_]{0,23}$/;
const OPERAND_DESENI = /^(fiyat\.(acilis|yuksek|dusuk|kapanis)|[a-z][a-z0-9_]{0,23}(\.(ana|orta|ust|alt|sinyal|arti|eksi|oran|uzun))?)$/;

const nesneMi = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const sayiMi = v => typeof v === 'number' && Number.isFinite(v);
const tamMi = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;

export function dogrula(s) {
  const h = [];
  const hata = (yol, mesaj) => h.push({ yol, mesaj });
  const fazla = (o, izinli, yol) => {
    for (const k of Object.keys(o)) if (!izinli.includes(k)) hata(`${yol}.${k}`.replace(/^\./, ''), `bilinmeyen alan '${k}'`);
  };

  if (!nesneMi(s)) return [{ yol: '', mesaj: 'strateji bir nesne olmalı' }];
  fazla(s, ['kalibre', 'ad', 'aciklama', 'zaman_dilimi', 'yon', 'gostergeler', 'giris', 'cikis', 'risk', 'filtre'], '');
  if (s.kalibre !== 1 && s.kalibre !== 2) hata('kalibre', 'şema sürümü 1 ya da 2 olmalı');
  if (typeof s.ad !== 'string' || s.ad.length < 1 || s.ad.length > 60) hata('ad', 'ad 1-60 karakter olmalı');
  if (s.aciklama !== undefined && (typeof s.aciklama !== 'string' || s.aciklama.length > 500)) hata('aciklama', 'açıklama en çok 500 karakter');
  if (s.zaman_dilimi !== undefined && !ZAMAN_DILIMLERI.includes(s.zaman_dilimi)) hata('zaman_dilimi', 'geçersiz zaman dilimi');
  if (s.yon !== undefined && !['iki_yon', 'sadece_long', 'sadece_short'].includes(s.yon)) hata('yon', 'geçersiz yön');

  // --- göstergeler
  const g = nesneMi(s.gostergeler) ? s.gostergeler : null;
  if (!g) hata('gostergeler', 'gösterge listesi zorunlu');
  else {
    const adlar = Object.keys(g);
    if (adlar.length < 1 || adlar.length > 16) hata('gostergeler', '1-16 gösterge olmalı');
    for (const ad of adlar) {
      const yol = `gostergeler.${ad}`;
      if (!AD_DESENI.test(ad)) hata(yol, `'${ad}': küçük harf ile başlamalı; yalnız a-z, 0-9, _ (en çok 24)`);
      if (ad === 'fiyat') hata(yol, "'fiyat' gösterge adı olamaz");
      const t = g[ad];
      if (!nesneMi(t)) { hata(yol, 'gösterge nesne olmalı'); continue; }
      if (!GOSTERGE_TIPLERI.includes(t.tip)) { hata(`${yol}.tip`, 'bilinmeyen gösterge tipi'); continue; }
      if (t.tip === 'MACD') {
        fazla(t, ['tip', 'hizli', 'yavas', 'sinyal'], yol);
        if (!tamMi(t.hizli, 1, 1000)) hata(`${yol}.hizli`, 'hızlı periyot 1-1000 tam sayı');
        if (!tamMi(t.yavas, 2, 1000)) hata(`${yol}.yavas`, 'yavaş periyot 2-1000 tam sayı');
        if (!tamMi(t.sinyal, 1, 1000)) hata(`${yol}.sinyal`, 'sinyal periyodu 1-1000 tam sayı');
        if (tamMi(t.hizli, 1, 1000) && tamMi(t.yavas, 2, 1000) && t.hizli >= t.yavas) hata(`${yol}.hizli`, 'MACD hızlı < yavaş olmalı');
      } else if (t.tip === 'EWMA_VOL') {
        fazla(t, ['tip', 'lambda'], yol);
        if (t.lambda !== undefined && (!sayiMi(t.lambda) || t.lambda < 0.8 || t.lambda > 0.999)) hata(`${yol}.lambda`, 'λ 0,8-0,999 arası');
      } else if (t.tip === 'GARCH_VOL') {
        fazla(t, ['tip', 'model', 'dagilim', 'pencere', 'yenile'], yol);
        if (t.model !== undefined && !['garch', 'gjr', 'egarch'].includes(t.model)) hata(`${yol}.model`, 'garch, gjr ya da egarch');
        if (t.dagilim !== undefined && !['normal', 't'].includes(t.dagilim)) hata(`${yol}.dagilim`, 'normal ya da t');
        if (t.pencere !== undefined && !tamMi(t.pencere, 250, 5000)) hata(`${yol}.pencere`, 'pencere 250-5000 tam sayı');
        if (t.yenile !== undefined && !tamMi(t.yenile, 1, 500)) hata(`${yol}.yenile`, 'yenileme aralığı 1-500 tam sayı');
      } else if (t.tip === 'YZ_VOL') {
        fazla(t, ['tip', 'periyot'], yol);
        if (!tamMi(t.periyot, 2, 1000)) hata(`${yol}.periyot`, 'periyot 2-1000 tam sayı');
      } else if (t.tip === 'BB') {
        fazla(t, ['tip', 'periyot', 'sapma'], yol);
        if (!tamMi(t.periyot, 2, 1000)) hata(`${yol}.periyot`, 'periyot 2-1000 tam sayı');
        if (!sayiMi(t.sapma) || t.sapma <= 0 || t.sapma > 10) hata(`${yol}.sapma`, 'sapma 0-10 arası');
      } else {
        fazla(t, ['tip', 'periyot'], yol);
        if (!tamMi(t.periyot, 1, 1000)) hata(`${yol}.periyot`, 'periyot 1-1000 tam sayı');
      }
    }
  }

  const operand = (o, yol) => {
    if (sayiMi(o)) return;
    if (typeof o !== 'string' || !OPERAND_DESENI.test(o)) return hata(yol, 'geçersiz operand');
    const [ad, hat = ''] = o.split('.');
    if (ad === 'fiyat' || !g) return;
    if (!g[ad]) return hata(yol, `tanımsız gösterge '${ad}'`);
    if (GOSTERGE_TIPLERI.includes(g[ad].tip) && !HATLAR[g[ad].tip].includes(hat))
      hata(yol, `'${ad}' (${g[ad].tip}) göstergesinde '${hat}' hattı yok`);
  };
  const grup = (gr, yol) => {
    if (gr === undefined) return;
    if (!nesneMi(gr) || Object.keys(gr).length !== 1) return hata(yol, "grup tam olarak 'hepsi' ya da 'herhangi' içermeli");
    const tur = Object.keys(gr)[0];
    if (tur !== 'hepsi' && tur !== 'herhangi') return hata(yol, `bilinmeyen grup '${tur}'`);
    const liste = gr[tur];
    if (!Array.isArray(liste) || liste.length < 1 || liste.length > 12) return hata(`${yol}.${tur}`, '1-12 koşul olmalı');
    liste.forEach((k, i) => {
      const ky = `${yol}.${tur}.${i}`;
      if (!nesneMi(k)) return hata(ky, 'koşul nesne olmalı');
      fazla(k, ['sol', 'op', 'sag'], ky);
      if (k.sol === undefined) hata(`${ky}.sol`, 'sol taraf eksik'); else operand(k.sol, `${ky}.sol`);
      if (k.sag === undefined) hata(`${ky}.sag`, 'sağ taraf eksik'); else operand(k.sag, `${ky}.sag`);
      if (!OPERATORLER.includes(k.op)) hata(`${ky}.op`, 'geçersiz karşılaştırma');
      if (sayiMi(k.sol) && sayiMi(k.sag)) hata(ky, 'iki taraf da sabit sayı olamaz');
    });
  };
  const yonler = (o, yol, enAzBir) => {
    if (o === undefined) return;
    if (!nesneMi(o)) return hata(yol, 'nesne olmalı');
    fazla(o, ['long', 'short'], yol);
    if (enAzBir && o.long === undefined && o.short === undefined) hata(yol, 'en az bir giriş kuralı (long ya da short) gerekli');
    grup(o.long, `${yol}.long`);
    grup(o.short, `${yol}.short`);
  };
  const mesafe = (m, yol, rIzinli) => {
    if (m === undefined) return;
    if (!nesneMi(m)) return hata(yol, 'nesne olmalı');
    if (m.tip === 'atr' || m.tip === 'oynaklik') {
      fazla(m, ['tip', 'gosterge', 'carpan'], yol);
      if (m.tip === 'atr' && (!g || g[m.gosterge]?.tip !== 'ATR')) hata(`${yol}.gosterge`, 'tanımlı bir ATR göstergesi seçin');
      if (m.tip === 'oynaklik' && (!g || !OYNAKLIK.includes(g[m.gosterge]?.tip))) hata(`${yol}.gosterge`, 'tanımlı bir oynaklık göstergesi seçin');
      if (!sayiMi(m.carpan) || m.carpan <= 0) hata(`${yol}.carpan`, 'çarpan pozitif olmalı');
    } else if (['puan', 'yuzde', 'r'].includes(m.tip)) {
      fazla(m, ['tip', 'deger'], yol);
      if (m.tip === 'r' && !rIzinli) hata(`${yol}.tip`, "'R' yalnız hedefte kullanılabilir");
      if (!sayiMi(m.deger) || m.deger <= 0) hata(`${yol}.deger`, 'değer pozitif olmalı');
    } else hata(`${yol}.tip`, 'geçersiz mesafe tipi');
  };

  // --- giriş / çıkış
  if (!nesneMi(s.giris)) hata('giris', 'giriş kuralları zorunlu');
  else yonler(s.giris, 'giris', true);

  if (!nesneMi(s.cikis)) hata('cikis', 'çıkış bölümü zorunlu');
  else {
    fazla(s.cikis, ['stop', 'hedef', 'iz_suren_stop', 'max_bar', 'kosul'], 'cikis');
    if (s.cikis.stop === undefined) hata('cikis.stop', 'stop zorunlu: stopsuz strateji yürütülmez');
    mesafe(s.cikis.stop, 'cikis.stop', false);
    mesafe(s.cikis.hedef, 'cikis.hedef', true);
    mesafe(s.cikis.iz_suren_stop, 'cikis.iz_suren_stop', false);
    if (s.cikis.max_bar !== undefined && !tamMi(s.cikis.max_bar, 1, 10000)) hata('cikis.max_bar', '1-10000 tam sayı');
    yonler(s.cikis.kosul, 'cikis.kosul', false);
  }

  // --- risk
  if (!nesneMi(s.risk)) hata('risk', 'risk bölümü zorunlu');
  else {
    const r = s.risk;
    fazla(r, ['islem_basi_yuzde', 'max_acik_pozisyon', 'max_spread_puan', 'gunluk_max_kayip_yuzde', 'volatilite_hedefi'], 'risk');
    const vh = r.volatilite_hedefi;
    if (vh !== undefined) {
      if (!nesneMi(vh)) hata('risk.volatilite_hedefi', 'nesne olmalı');
      else {
        fazla(vh, ['gosterge', 'alt_carpan', 'ust_carpan'], 'risk.volatilite_hedefi');
        if (!g || !OYNAKLIK.includes(g[vh.gosterge]?.tip)) hata('risk.volatilite_hedefi.gosterge', 'tanımlı bir oynaklık göstergesi seçin');
        if (vh.alt_carpan !== undefined && (!sayiMi(vh.alt_carpan) || vh.alt_carpan < 0.1 || vh.alt_carpan > 1)) hata('risk.volatilite_hedefi.alt_carpan', '0,1-1 arası');
        if (vh.ust_carpan !== undefined && (!sayiMi(vh.ust_carpan) || vh.ust_carpan < 1 || vh.ust_carpan > 2)) hata('risk.volatilite_hedefi.ust_carpan', '1-2 arası');
      }
    }
    if (!sayiMi(r.islem_basi_yuzde) || r.islem_basi_yuzde <= 0 || r.islem_basi_yuzde > 5) hata('risk.islem_basi_yuzde', 'işlem başı risk %0-5 arası');
    if (r.max_acik_pozisyon !== undefined && !tamMi(r.max_acik_pozisyon, 1, 10)) hata('risk.max_acik_pozisyon', '1-10 tam sayı');
    if (r.max_spread_puan !== undefined && !tamMi(r.max_spread_puan, 0, Infinity)) hata('risk.max_spread_puan', '0 ya da pozitif tam sayı');
    if (r.gunluk_max_kayip_yuzde !== undefined && (!sayiMi(r.gunluk_max_kayip_yuzde) || r.gunluk_max_kayip_yuzde <= 0 || r.gunluk_max_kayip_yuzde > 20))
      hata('risk.gunluk_max_kayip_yuzde', 'günlük kayıp sınırı %0-20 arası');
  }

  // --- filtreler
  if (s.filtre !== undefined) {
    if (!nesneMi(s.filtre)) hata('filtre', 'nesne olmalı');
    else {
      fazla(s.filtre, ['saat', 'haber'], 'filtre');
      const sa = s.filtre.saat;
      if (sa !== undefined) {
        if (!nesneMi(sa)) hata('filtre.saat', 'nesne olmalı');
        else {
          fazla(sa, ['bas', 'bit'], 'filtre.saat');
          if (!tamMi(sa.bas, 0, 23)) hata('filtre.saat.bas', 'başlangıç saati 0-23');
          if (!tamMi(sa.bit, 0, 24)) hata('filtre.saat.bit', 'bitiş saati 0-24');
        }
      }
      const hb = s.filtre.haber;
      if (hb !== undefined) {
        if (!nesneMi(hb)) hata('filtre.haber', 'nesne olmalı');
        else {
          fazla(hb, ['once_dk', 'sonra_dk', 'onem'], 'filtre.haber');
          if (hb.once_dk !== undefined && !tamMi(hb.once_dk, 0, 1440)) hata('filtre.haber.once_dk', '0-1440 dakika');
          if (hb.sonra_dk !== undefined && !tamMi(hb.sonra_dk, 0, 1440)) hata('filtre.haber.sonra_dk', '0-1440 dakika');
          if (hb.onem !== undefined && !['orta', 'yuksek'].includes(hb.onem)) hata('filtre.haber.onem', 'orta ya da yüksek');
        }
      }
    }
  }
  if (s.kalibre === 1) {
    const v2 = v2Ozellikleri(s);
    if (v2.length) hata('kalibre', `${v2.join(', ')} şema sürümü 2 gerektirir`);
  }
  return h;
}

export function v2Ozellikleri(s) {
  const o = [];
  if (nesneMi(s.gostergeler) && Object.values(s.gostergeler).some(t => OYNAKLIK.includes(t?.tip))) o.push('oynaklık göstergesi');
  if (nesneMi(s.cikis) && ['stop', 'hedef', 'iz_suren_stop'].some(k => s.cikis[k]?.tip === 'oynaklik')) o.push("'oynaklik' mesafesi");
  if (nesneMi(s.risk) && s.risk.volatilite_hedefi !== undefined) o.push('volatilite hedefi');
  return o;
}
