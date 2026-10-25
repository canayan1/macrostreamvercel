// Tohumlu sentetik piyasa üreticisi. Gerçek bir enstrümanı temsil etmez.
// Rejim değiştiren geometrik rastgele yürüyüş + volatilite kümelenmesi + sıçramalar.
// Mumlar: { t (unix sn), a (açılış), y (yüksek), d (düşük), k (kapanış) }

export const REJIMLER = {
  karisik: { ad: 'Karışık (rejimler arası geçiş)' },
  boga: { ad: 'Boğa', mu: 0.0004, vol: 0.006, sicrama: 0.004 },
  ayi: { ad: 'Ayı', mu: -0.0004, vol: 0.008, sicrama: 0.008 },
  yatay: { ad: 'Yatay', mu: 0, vol: 0.005, sicrama: 0.003, geriCekme: 0.02 },
  kriz: { ad: 'Kriz şoku', mu: -0.0002, vol: 0.014, sicrama: 0.02 },
};
const GECIS = ['boga', 'yatay', 'ayi', 'yatay', 'kriz'];

export function rastgele(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(r) {
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const DAKIKA = { M1: 1, M5: 5, M15: 15, M30: 30, H1: 60, H4: 240, D1: 1440, W1: 10080 };

export function uret({ tohum = 1, rejim = 'karisik', adet = 1500, zamanDilimi = 'H1' } = {}) {
  const r = rastgele(tohum);
  const adim = (DAKIKA[zamanDilimi] ?? 60) * 60;
  const olcek = Math.sqrt((DAKIKA[zamanDilimi] ?? 60) / 60); // getiri ölçeği zaman dilimine göre
  let t = Date.UTC(2030, 0, 7) / 1000; // açıkça kurgusal bir tarih
  let fiyat = 100, varyans = 1, aktif = rejim === 'karisik' ? 'yatay' : rejim, kalan = 0, denge = fiyat;
  const mumlar = [];
  for (let i = 0; i < adet; i++) {
    if (rejim === 'karisik' && --kalan <= 0) {
      aktif = GECIS[Math.floor(r() * GECIS.length)];
      kalan = 150 + Math.floor(r() * 350);
      denge = fiyat;
    }
    const p = REJIMLER[aktif];
    const a = fiyat;
    let y = a, d = a, k = a;
    // her mum dört alt adımda yürür, yüksek/düşük buradan çıkar
    for (let j = 0; j < 4; j++) {
      const sok = normal(r);
      varyans = 0.05 + 0.9 * varyans + 0.05 * sok * sok; // GARCH(1,1) benzeri kümelenme
      let getiri = (p.mu * olcek) / 4 + p.vol * olcek * Math.sqrt(varyans) * sok / 2;
      if (p.geriCekme) getiri += p.geriCekme * Math.log(denge / k) / 4;
      if (r() < p.sicrama / 4) getiri += (r() < 0.55 ? -1 : 1) * p.vol * olcek * (3 + 4 * r());
      k = k * Math.exp(getiri);
      y = Math.max(y, k);
      d = Math.min(d, k);
    }
    mumlar.push({ t, a, y, d, k });
    fiyat = k;
    t += adim;
    if (adim < 86400 && new Date(t * 1000).getUTCDay() === 6) t += 2 * 86400; // hafta sonu boşluğu
  }
  return mumlar;
}
