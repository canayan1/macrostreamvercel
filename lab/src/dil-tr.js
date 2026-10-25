// Türkçe görünen adlar (metin rehberi, site-wt docs/METIN-REHBERI.md): kaynak metinler (sözlük
// anahtarları) değişmeden kalır, Türkçe arayüzde yalnız gösterim düzeltilir.
//   "hızlı prova" / "prova"  → "Hızlı Backtest" / "backtest"
//   "Kalibre Motor", "Motor" → "Kalibre Engine" (ürün adı çevrilmez)
//   "Panom"                  → "Pano" (sitedeki menü adı)
// Ekler ünlü uyumuna göre yeniden yazılır (prova-da → backtest'te, Motor'u → Engine'i, Panom'a → Pano'ya).
// Kimlikler, adresler ve öznitelik değerleri (ör. id="prova-kaynak", /lab/panom) etkilenmez: eşleşme
// harf, rakam, tire, alt çizgi, eğik çizgi ya da nokta ile bitişik değilse yapılır.

const HARF = 'A-Za-zÇĞİÖŞÜçğıöşâîû0-9_\\-/.#=';
const sinir = govde => new RegExp(`(?<![${HARF}])${govde}(?![${HARF.replace("'", '')}])`, 'g');

// backtest (son hece "test", ince ünlü, sert ünsüz): prova + ek → backtest + ek
const BACKTEST_EK = {
  '': '', da: "'te", dan: "'ten", ya: "'e", yı: "'i", yi: "'i", nın: "'in", yla: ' ile',
  sı: 'i', sını: 'ini', sında: 'inde', sından: 'inden', sının: 'inin', lar: 'ler', ları: 'leri', ların: 'lerin', larda: 'lerde',
};
// Engine (son ünlü i, "encin" okunur): Motor + ek → Engine + ek
const ENGINE_EK = { '': '', "'u": "'i", "'a": "'e", "'da": "'de", "'dan": "'den", "'un": "'in", "'la": ' ile', "'yla": ' ile', "'dur": "'dir" };
// Pano (son ünlü o): Panom + ek → Pano + ek
const PANO_EK = { '': '', "'a": "'ya", a: "'ya", "'da": "'da", "'dan": "'dan", "'u": "'yu", "'un": "'nun", da: "'da", dan: "'dan", u: "'yu" };

const EKLER = s => Object.keys(s).filter(Boolean).sort((a, b) => b.length - a.length).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

const KURALLAR = [
  [sinir(`([Hh])ızlı prova(${EKLER(BACKTEST_EK)})?`), (m, h, ek = '') => `Hızlı Backtest${BACKTEST_EK[ek] ?? ''}`],
  [sinir(`Prova(${EKLER(BACKTEST_EK)})?`), (m, ek = '') => `Backtest${BACKTEST_EK[ek] ?? ''}`],
  [sinir(`prova(${EKLER(BACKTEST_EK)})?`), (m, ek = '') => `backtest${BACKTEST_EK[ek] ?? ''}`],
  [sinir(`Kalibre Motor(${EKLER(ENGINE_EK)})?`), (m, ek = '') => `Kalibre Engine${ENGINE_EK[ek] ?? ''}`],
  [sinir(`Panom(${EKLER(PANO_EK)})?`), (m, ek = '') => `Pano${PANO_EK[ek] ?? ''}`],
  // Tek başına "Motor" (ürün adı olarak, büyük harfle): Kalibre Engine. "Kalibre Motor" kuralı önce çalışır.
  [sinir(`(?<!Kalibre )Motor(${EKLER(ENGINE_EK)})?`), (m, ek = '') => `Kalibre Engine${ENGINE_EK[ek] ?? ''}`],
];

export function trGoster(metin) {
  if (typeof metin !== 'string' || !metin) return metin;
  let s = metin;
  for (const [re, f] of KURALLAR) s = s.replace(re, f);
  return s;
}
