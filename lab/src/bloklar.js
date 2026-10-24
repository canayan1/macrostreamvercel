// Basit mod: strateji JSON'unun blok görünümü. DOM yoktur; arayüz (blok-arayuz.js) bu işlevleri çağırır.
//
// Kaynak her zaman strateji nesnesinin kendisidir (form ile aynı `s`). Bloklar, koşulların ve çıkışların
// tanıdık kalıplara göre etiketlenmiş halidir: bir blok ham koşulu ({ sol, op, sag }) aynen taşır, kalıp
// yalnız nasıl gösterileceğini söyler. Böylece Basit ile İleri mod arasında geçiş hiçbir şey kaybettirmez:
// stratejidenBloklar → bloklardanStrateji her zaman aynı JSON'u verir. Kalıba uymayan koşul
// "gelişmiş koşul" bloğu olur; ham hâliyle gösterilir ve korunur.
//
// Göstergeler: Basit modda kullanıcı gösterge listesi yönetmez. Bir kalıp gösterge gerektirince
// (ör. iki ortalama kesişimi) gösterge kendiliğinden eklenir ve adı tipinden ve periyodundan türetilir
// (ema20, ema50). Bir göstergenin periyodu bir kartta değiştirilince, gösterge başka yerlerde de
// kullanılıyorsa yalnız o kart için yeni bir gösterge oluşturulur; diğer kurallar etkilenmez.
//
// Risk parametreleri bloklarda ön değerle gelmez: kullanıcı doldurur (eğitim örneklerindeki kuralla aynı).

export const GRUP_YOLLARI = ['giris.long', 'giris.short', 'cikis.kosul.long', 'cikis.kosul.short'];
export const KARSILASTIRMA = ['>', '<', '>=', '<='];
export const KESISIM = ['yukari_keser', 'asagi_keser'];
export const SABLONLAR = ['kesisim', 'esik', 'bant', 'rsi', 'trend', 'karsilastir'];
const AD_DESENI = /^[a-z][a-z0-9_]{0,23}$/;
const OTO_AD = /^(sma|ema|rsi|atr|adx|bb|macd)\d*(_\d+)?$/;
const PERIYOTLU = ['SMA', 'EMA', 'RSI', 'ATR', 'ADX', 'BB', 'YZ_VOL'];

const kopya = o => structuredClone(o);
const nesneMi = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const sayiMi = v => typeof v === 'number' && Number.isFinite(v);

// ---------------------------------------------------------------- yol yardımcıları
const parca = yol => yol.split('.').map(p => (/^\d+$/.test(p) ? Number(p) : p));
export function oku(s, yol) {
  return parca(yol).reduce((o, k) => (o == null ? undefined : o[k]), s);
}
function yaz(s, yol, deger) {
  const p = parca(yol);
  let o = s;
  for (let i = 0; i < p.length - 1; i++) {
    if (o[p[i]] == null) o[p[i]] = typeof p[i + 1] === 'number' ? [] : {};
    o = o[p[i]];
  }
  if (deger === undefined) delete o[p.at(-1)]; else o[p.at(-1)] = deger;
}

// Operand: 'ema20', 'bb.ust', 'adx.ana', 'fiyat.kapanis' ya da sayı.
export function operandCoz(o, g = {}) {
  if (typeof o !== 'string') return null;
  const [ad, hat = ''] = o.split('.');
  if (ad === 'fiyat') return { ad, hat, tip: 'fiyat' };
  return { ad, hat, tip: g[ad]?.tip ?? null };
}
const anaHat = h => h === '' || h === 'ana';

// ---------------------------------------------------------------- kalıp tanıma
// Ham koşulu en uygun kalıpla etiketler. Dönen blok ham koşulu aynen taşır.
export function kosulSablonu(k, g = {}) {
  const ham = { sol: k?.sol, op: k?.op, sag: k?.sag };
  const sol = operandCoz(k?.sol, g), sag = operandCoz(k?.sag, g);
  const blok = sablon => ({ sablon, ...ham });
  if (!nesneMi(k) || Object.keys(k).some(a => !['sol', 'op', 'sag'].includes(a))) return { sablon: 'gelismis', ham: k };
  if (KESISIM.includes(k.op) && sol?.tip && sag?.tip) return blok('kesisim');
  if (KARSILASTIRMA.includes(k.op) && ['>', '<'].includes(k.op) && sol?.tip === 'fiyat' && sag?.tip === 'BB' && ['ust', 'alt'].includes(sag.hat)) return blok('bant');
  if (['>', '<'].includes(k.op) && sol?.tip === 'RSI' && anaHat(sol.hat) && sayiMi(k.sag)) return blok('rsi');
  if (k.op === '>' && sol?.tip === 'ADX' && anaHat(sol.hat) && sayiMi(k.sag)) return blok('trend');
  if (KARSILASTIRMA.includes(k.op) && sol?.tip && sayiMi(k.sag)) return blok('esik');
  if (KARSILASTIRMA.includes(k.op) && sol?.tip && sag?.tip) return blok('karsilastir');
  return { sablon: 'gelismis', ...ham };
}

export function kosulDerle(b) {
  if (b.ham !== undefined) return kopya(b.ham);
  return { sol: b.sol, op: b.op, sag: b.sag };
}

// ---------------------------------------------------------------- strateji <-> bloklar
export function grupBloklari(s, yol) {
  const gr = oku(s, yol);
  if (!nesneMi(gr)) return null;
  const tur = gr.hepsi ? 'hepsi' : gr.herhangi ? 'herhangi' : null;
  if (!tur || !Array.isArray(gr[tur])) return { tur: 'hepsi', bloklar: [], bozuk: kopya(gr) };
  return { tur, bloklar: gr[tur].map((k, i) => ({ ...kosulSablonu(k, s.gostergeler ?? {}), yol: `${yol}.${tur}.${i}` })) };
}

// Strateji → blok modeli. Model stratejinin tam kopyasını ve dört koşul grubunun bloklarını taşır.
export function stratejidenBloklar(s) {
  const strateji = kopya(s);
  const gruplar = {};
  for (const y of GRUP_YOLLARI) gruplar[y] = grupBloklari(strateji, y);
  return { strateji, gruplar, kullanilmayan: kullanilmayanlar(strateji) };
}

// Blok modeli → strateji. Boş grup yazılmaz; iki çıkış grubu da boşsa cikis.kosul düşer.
export function bloklardanStrateji(m) {
  const s = kopya(m.strateji);
  for (const y of GRUP_YOLLARI) {
    const gr = m.gruplar[y];
    if (gr === undefined) continue;
    if (gr === null) { yaz(s, y, undefined); continue; }
    if (gr.bozuk !== undefined) { yaz(s, y, kopya(gr.bozuk)); continue; }
    if (!gr.bloklar.length) yaz(s, y, undefined);
    else yaz(s, y, { [gr.tur]: gr.bloklar.map(kosulDerle) });
  }
  if (nesneMi(s.cikis?.kosul) && !s.cikis.kosul.long && !s.cikis.kosul.short) delete s.cikis.kosul;
  return s;
}

// ---------------------------------------------------------------- göstergeler
export function referanslar(s) {
  const sayac = {};
  const ekle = o => {
    if (typeof o !== 'string') return;
    const ad = o.split('.')[0];
    if (ad !== 'fiyat') sayac[ad] = (sayac[ad] ?? 0) + 1;
  };
  for (const y of GRUP_YOLLARI) {
    const gr = oku(s, y);
    for (const k of gr?.hepsi ?? gr?.herhangi ?? []) { ekle(k?.sol); ekle(k?.sag); }
  }
  for (const m of [s.cikis?.stop, s.cikis?.hedef, s.cikis?.iz_suren_stop]) if (m?.gosterge) ekle(m.gosterge);
  if (s.risk?.volatilite_hedefi?.gosterge) ekle(s.risk.volatilite_hedefi.gosterge);
  return sayac;
}

export function kullanilmayanlar(s) {
  const r = referanslar(s);
  return Object.keys(s.gostergeler ?? {}).filter(ad => !r[ad]);
}

const ayniTanim = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

// Tanımdan ad: ema20, bb20, macd; alınmışsa ema20_2, ema20_3...
export function otoAd(tanim, g = {}, haric = null) {
  const kok = tanim.tip === 'MACD' ? 'macd' : `${tanim.tip.toLowerCase().replace(/_vol$/, '')}${tanim.periyot ?? ''}`;
  const temel = AD_DESENI.test(kok) ? kok : 'g';
  if (!g[temel] || temel === haric) return temel;
  for (let i = 2; i < 100; i++) { const a = `${temel}_${i}`; if (!g[a] || a === haric) return a; }
  return `${temel}_${Date.now() % 1000}`;
}

// Aynı tanımlı gösterge varsa onun adını döner; yoksa ekler. s yerinde değişir.
export function gostergeEdin(s, tanim) {
  s.gostergeler ??= {};
  const var_ = Object.entries(s.gostergeler).find(([, t]) => ayniTanim(t, tanim));
  if (var_) return var_[0];
  const ad = otoAd(tanim, s.gostergeler);
  s.gostergeler[ad] = { ...tanim };
  return ad;
}

function referansDegistir(s, eski, yeni) {
  const ref = o => {
    if (typeof o !== 'string') return o;
    const [ad, hat] = o.split('.');
    return ad === eski ? (hat !== undefined ? `${yeni}.${hat}` : yeni) : o;
  };
  for (const y of GRUP_YOLLARI) {
    const gr = oku(s, y);
    for (const k of gr?.hepsi ?? gr?.herhangi ?? []) { k.sol = ref(k.sol); k.sag = ref(k.sag); }
  }
  for (const m of [s.cikis?.stop, s.cikis?.hedef, s.cikis?.iz_suren_stop]) if (m?.gosterge === eski) m.gosterge = yeni;
  if (s.risk?.volatilite_hedefi?.gosterge === eski) s.risk.volatilite_hedefi.gosterge = yeni;
}

// Kendiliğinden eklenmiş ve artık kullanılmayan göstergeleri siler (kullanıcının adlandırdıklarına dokunmaz).
function buda(s) {
  for (const ad of kullanilmayanlar(s)) if (OTO_AD.test(ad)) delete s.gostergeler[ad];
}

// Bir konumdaki (koşul tarafı ya da mesafe göstergesi) göstergenin parametresini değiştirir.
// konum: 'giris.long.hepsi.0.sol' ya da 'cikis.stop.gosterge'. alanlar: { periyot?, sapma?, tip? }.
// Gösterge başka yerde de kullanılıyorsa yalnız bu konum için yeni gösterge oluşturulur.
export function gostergeAyarla(s0, konum, alanlar) {
  const s = kopya(s0);
  const o = oku(s, konum);
  const op = operandCoz(o, s.gostergeler);
  if (!op || op.tip === 'fiyat' || !s.gostergeler?.[op.ad]) return s;
  const eskiAd = op.ad;
  const yeniTanim = { ...s.gostergeler[eskiAd], ...alanlar };
  if (alanlar.tip && alanlar.tip !== s.gostergeler[eskiAd].tip && !('periyot' in alanlar)) yeniTanim.periyot ??= s.gostergeler[eskiAd].periyot;
  const paylasilan = (referanslar(s)[eskiAd] ?? 0) > 1;
  let hedef;
  if (paylasilan) hedef = gostergeEdin(s, yeniTanim);
  else {
    const ayni = Object.entries(s.gostergeler).find(([a, t]) => a !== eskiAd && ayniTanim(t, yeniTanim));
    if (ayni) hedef = ayni[0];
    else {
      s.gostergeler[eskiAd] = yeniTanim;
      hedef = eskiAd;
      if (OTO_AD.test(eskiAd)) {
        const ad = otoAd(yeniTanim, s.gostergeler, eskiAd);
        if (ad !== eskiAd) {
          s.gostergeler = Object.fromEntries(Object.entries(s.gostergeler).map(([k, v]) => [k === eskiAd ? ad : k, v]));
          referansDegistir(s, eskiAd, ad);
          hedef = ad;
          return s;
        }
      }
    }
  }
  yaz(s, konum, op.hat ? `${hedef}.${op.hat}` : hedef);
  buda(s);
  return s;
}

// ---------------------------------------------------------------- blok işlemleri
// Kalıbın varsayılan koşulu; gereken göstergeler s'e eklenir. yon: grubun yönü ('long'/'short').
export function yeniKosul(s, sablon, yon = 'long') {
  const long = yon !== 'short';
  switch (sablon) {
    case 'kesisim': {
      const a = gostergeEdin(s, { tip: 'EMA', periyot: 20 }), b = gostergeEdin(s, { tip: 'EMA', periyot: 50 });
      return { sol: a, op: long ? 'yukari_keser' : 'asagi_keser', sag: b };
    }
    case 'esik': return { sol: gostergeEdin(s, { tip: 'RSI', periyot: 14 }), op: long ? '>' : '<', sag: 50 };
    case 'bant': {
      const bb = gostergeEdin(s, { tip: 'BB', periyot: 20, sapma: 2 });
      return long ? { sol: 'fiyat.kapanis', op: '<', sag: `${bb}.alt` } : { sol: 'fiyat.kapanis', op: '>', sag: `${bb}.ust` };
    }
    case 'rsi': return { sol: gostergeEdin(s, { tip: 'RSI', periyot: 14 }), op: long ? '<' : '>', sag: long ? 30 : 70 };
    case 'trend': return { sol: gostergeEdin(s, { tip: 'ADX', periyot: 14 }), op: '>', sag: 20 };
    case 'karsilastir': return { sol: 'fiyat.kapanis', op: long ? '>' : '<', sag: gostergeEdin(s, { tip: 'SMA', periyot: 50 }) };
  }
  throw new Error(`bilinmeyen kalıp: ${sablon}`);
}

const grupYonu = yol => (yol.endsWith('short') ? 'short' : 'long');

export function blokEkle(s0, yol, sablon) {
  const s = kopya(s0);
  const k = yeniKosul(s, sablon, grupYonu(yol));
  const gr = oku(s, yol);
  if (nesneMi(gr) && Array.isArray(gr.hepsi ?? gr.herhangi)) (gr.hepsi ?? gr.herhangi).push(k);
  else yaz(s, yol, { hepsi: [k] });
  return s;
}

export function blokSil(s0, yol, i) {
  const m = stratejidenBloklar(s0);
  m.gruplar[yol].bloklar.splice(i, 1);
  const s = bloklardanStrateji(m);
  buda(s);
  return s;
}

export function blokTasi(s0, yol, i, yon) {
  const m = stratejidenBloklar(s0);
  const b = m.gruplar[yol].bloklar, j = i + yon;
  if (j < 0 || j >= b.length) return kopya(s0);
  [b[i], b[j]] = [b[j], b[i]];
  return bloklardanStrateji(m);
}

export function grupTuru(s0, yol, tur) {
  const m = stratejidenBloklar(s0);
  if (m.gruplar[yol]) m.gruplar[yol].tur = tur;
  return bloklardanStrateji(m);
}

// Bir koşulun bir alanını değiştirir (sol/op/sag ham olarak); kalıp ondan yeniden tanınır.
export function kosulAyarla(s0, kosulYolu, alan, deger) {
  const s = kopya(s0);
  yaz(s, `${kosulYolu}.${alan}`, deger);
  buda(s);
  return s;
}

// Koşulun bir tarafına yeni bir gösterge bağlar (ör. 'EMA' 20). Dönen s'te gösterge eklenmiştir.
export function tarafaGosterge(s0, konum, tanim, hat = '') {
  const s = kopya(s0);
  const ad = gostergeEdin(s, tanim);
  yaz(s, konum, hat ? `${ad}.${hat}` : ad);
  buda(s);
  return s;
}

// ---------------------------------------------------------------- çıkış mesafeleri
// tip: 'atr' (gösterge periyodu + çarpan), 'yuzde', 'puan', 'r' (yalnız hedef), 'oynaklik' (mevcut gösterge), '' (yok)
export function mesafeAyarla(s0, yol, tip, { carpan, deger, periyot } = {}) {
  const s = kopya(s0);
  if (!tip) { yaz(s, yol, undefined); buda(s); return s; }
  const eski = oku(s, yol);
  if (tip === 'atr') {
    const p = periyot ?? (eski?.tip === 'atr' ? s.gostergeler?.[eski.gosterge]?.periyot : undefined) ?? 14;
    const ad = eski?.tip === 'atr' && s.gostergeler?.[eski.gosterge]?.periyot === p ? eski.gosterge : gostergeEdin(s, { tip: 'ATR', periyot: p });
    yaz(s, yol, { tip: 'atr', gosterge: ad, carpan: carpan ?? (eski?.tip === 'atr' ? eski.carpan : 2) });
  } else if (tip === 'oynaklik') {
    yaz(s, yol, { tip, gosterge: eski?.gosterge, carpan: carpan ?? eski?.carpan ?? 3 });
  } else {
    const vars = { puan: 300, yuzde: 1, r: 2 }[tip];
    yaz(s, yol, { tip, deger: deger ?? (eski?.tip === tip ? eski.deger : vars) });
  }
  buda(s);
  return s;
}
