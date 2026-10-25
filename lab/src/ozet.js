// Strateji dosyasını düz cümlelere çevirir (Türkçe ya da İngilizce). Kullanıcı ne kurduğunu JSON
// okumadan görsün diye. Öneri değil; yalnız kurulan kuralın tarifi. İki dilin cümle yapısı farklı
// olduğu için kelime kelime değil, her dil kendi kalıbıyla yazılır.

import { dil, ondalik } from './dil.js';

const TR = {
  OP: { '>': 'büyükse', '<': 'küçükse', '>=': 'büyük ya da eşitse', '<=': 'küçük ya da eşitse', yukari_keser: 'yukarı keserse', asagi_keser: 'aşağı keserse' },
  FIYAT: { acilis: 'açılış', yuksek: 'yüksek', dusuk: 'düşük', kapanis: 'kapanış' },
  HAT: { ust: 'üst bant', alt: 'alt bant', orta: 'orta bant', sinyal: 'sinyal hattı', arti: '+DI', eksi: '−DI', ana: '', oran: 'oranı (olağana göre)', uzun: 'uzun dönem düzeyi' },
};
const EN = {
  OP: { '>': 'is above', '<': 'is below', '>=': 'is at or above', '<=': 'is at or below', yukari_keser: 'crosses above', asagi_keser: 'crosses below' },
  FIYAT: { acilis: 'open', yuksek: 'high', dusuk: 'low', kapanis: 'close' },
  HAT: { ust: 'upper band', alt: 'lower band', orta: 'middle band', sinyal: 'signal line', arti: '+DI', eksi: '−DI', ana: '', oran: 'ratio (vs. normal)', uzun: 'long-run level' },
};
const sozluk = () => (dil === 'en' ? EN : TR);

export function gostergeTanimi(t) {
  if (!t) return '?';
  const en = dil === 'en';
  if (t.tip === 'MACD') return `MACD ${t.hizli}/${t.yavas}/${t.sinyal}`;
  if (t.tip === 'BB') return `Bollinger ${t.periyot}, ${t.sapma}σ`;
  if (t.tip === 'EWMA_VOL') return `EWMA ${en ? 'volatility' : 'oynaklık'} λ=${ondalik(t.lambda ?? 0.94)}`;
  if (t.tip === 'YZ_VOL') return `Yang-Zhang ${en ? 'volatility' : 'oynaklık'} ${t.periyot}`;
  if (t.tip === 'GARCH_VOL') {
    const m = `${(t.model ?? 'garch').toUpperCase()}${t.dagilim === 't' ? '-t' : ''}`;
    return en ? `${m} volatility, ${t.pencere ?? 1000} bars, refit every ${t.yenile ?? 24} bars`
              : `${m} oynaklık, ${t.pencere ?? 1000} mum, ${t.yenile ?? 24} mumda bir`;
  }
  return `${t.tip} ${t.periyot}`;
}

export function operandMetni(o, g = {}) {
  if (typeof o === 'number') return ondalik(o);
  if (typeof o !== 'string') return '?';
  const { FIYAT, HAT } = sozluk();
  const [ad, hat = ''] = o.split('.');
  if (ad === 'fiyat') return dil === 'en' ? `${FIYAT[hat] ?? hat} price` : `${FIYAT[hat] ?? hat} fiyatı`;
  const t = g[ad];
  const hatAdi = HAT[hat] ?? hat;
  return `${ad}${hatAdi ? ' ' + hatAdi : ''} (${gostergeTanimi(t)})`;
}

function grupMetni(gr, g) {
  if (!gr) return null;
  const { OP } = sozluk();
  const tur = gr.hepsi ? 'hepsi' : 'herhangi';
  const parca = (gr[tur] ?? []).map(k => (dil === 'en'
    ? `${operandMetni(k.sol, g)} ${OP[k.op] ?? k.op} ${operandMetni(k.sag, g)}`
    : `${operandMetni(k.sol, g)}, ${operandMetni(k.sag, g)} değerinden ${OP[k.op] ?? k.op}`));
  const baglac = dil === 'en' ? (tur === 'hepsi' ? ' AND ' : ' OR ') : (tur === 'hepsi' ? ' VE ' : ' VEYA ');
  return parca.join(baglac);
}

function mesafeMetni(m, g) {
  if (!m) return null;
  const sayi = ondalik;
  const en = dil === 'en';
  switch (m.tip) {
    case 'atr': return `${sayi(m.carpan)} × ${m.gosterge} (${gostergeTanimi(g[m.gosterge])})`;
    case 'oynaklik': return en ? `entry price × ${m.gosterge} forecast × ${sayi(m.carpan)} (${gostergeTanimi(g[m.gosterge])})`
                               : `giriş fiyatı × ${m.gosterge} öngörüsü × ${sayi(m.carpan)} (${gostergeTanimi(g[m.gosterge])})`;
    case 'puan': return en ? `${sayi(m.deger)} points` : `${sayi(m.deger)} puan`;
    case 'yuzde': return en ? `${sayi(m.deger)}% of the entry price` : `giriş fiyatının %${sayi(m.deger)}'i`;
    case 'r': return en ? `${sayi(m.deger)} times the stop distance (${sayi(m.deger)}R)` : `stop mesafesinin ${sayi(m.deger)} katı (${sayi(m.deger)}R)`;
  }
  return '?';
}

export function ozet(s) {
  return dil === 'en' ? ozetEn(s) : ozetTr(s);
}

function ozetTr(s) {
  const g = s.gostergeler ?? {};
  const satirlar = [];
  const yon = s.yon ?? 'iki_yon';
  const L = yon !== 'sadece_short' && grupMetni(s.giris?.long, g);
  const S = yon !== 'sadece_long' && grupMetni(s.giris?.short, g);
  satirlar.push({ baslik: 'Zaman dilimi', metin: `${s.zaman_dilimi ?? 'grafiğin zaman dilimi'}; kurallar her yeni mumun açılışında, kapanmış son mumla değerlendirilir.` });
  if (yon !== 'iki_yon') satirlar.push({ baslik: 'Yön kısıtı', metin: yon === 'sadece_long' ? 'Yalnız long işlem.' : 'Yalnız short işlem.' });
  if (L) satirlar.push({ baslik: 'Long giriş', metin: `${L} ise.` });
  if (S) satirlar.push({ baslik: 'Short giriş', metin: `${S} ise.` });
  const c = s.cikis ?? {};
  if (c.stop) satirlar.push({ baslik: 'Stop', metin: `Girişten ${mesafeMetni(c.stop, g)} uzakta.` });
  if (c.hedef) satirlar.push({ baslik: 'Hedef', metin: `Girişten ${mesafeMetni(c.hedef, g)} uzakta.` });
  if (c.iz_suren_stop) satirlar.push({ baslik: 'İz süren stop', metin: `Fiyatı ${mesafeMetni(c.iz_suren_stop, g)} geriden izler, yalnız kâr yönüne taşınır.` });
  const cl = grupMetni(c.kosul?.long, g), cs = grupMetni(c.kosul?.short, g);
  if (cl) satirlar.push({ baslik: 'Long çıkış', metin: `${cl} ise kapat.` });
  if (cs) satirlar.push({ baslik: 'Short çıkış', metin: `${cs} ise kapat.` });
  if (c.max_bar) satirlar.push({ baslik: 'Süre', metin: `${c.max_bar} mum sonra kapat.` });
  const r = s.risk ?? {};
  if (r.islem_basi_yuzde) {
    const ek = [];
    if ((r.max_acik_pozisyon ?? 1) > 1) ek.push(`aynı anda en çok ${r.max_acik_pozisyon} pozisyon`);
    else ek.push('aynı anda tek pozisyon');
    if (r.gunluk_max_kayip_yuzde) ek.push(`gün içinde %${ondalik(r.gunluk_max_kayip_yuzde)} kayıpta yeni işlem yok`);
    if (r.max_spread_puan) ek.push(`spread ${r.max_spread_puan} puanı aşarsa giriş yok`);
    const vh = r.volatilite_hedefi;
    if (vh) ek.push(`risk ${vh.gosterge} oranıyla ters orantılı ölçeklenir (en az ${ondalik(vh.alt_carpan ?? 0.25)}×, en çok ${ondalik(vh.ust_carpan ?? 1.5)}×); oynaklık olağanın iki katıysa risk yarıya iner`);
    satirlar.push({ baslik: 'Risk', metin: `Stop olursa bakiyenin %${ondalik(r.islem_basi_yuzde)}'i kaybedilecek şekilde lot; ${ek.join('; ')}.` });
  }
  const f = s.filtre ?? {};
  if (f.saat) satirlar.push({ baslik: 'Saat', metin: `Yeni giriş yalnız sunucu saatiyle ${f.saat.bas}:00-${f.saat.bit}:00 arası.` });
  if (f.haber) satirlar.push({ baslik: 'Haber', metin: `${f.haber.onem === 'orta' ? 'Orta ve yüksek' : 'Yüksek'} önemli verilerden ${f.haber.once_dk ?? 30} dk önce ile ${f.haber.sonra_dk ?? 30} dk sonra arasında yeni giriş yok.` });
  return satirlar;
}

function ozetEn(s) {
  const g = s.gostergeler ?? {};
  const satirlar = [];
  const yon = s.yon ?? 'iki_yon';
  const L = yon !== 'sadece_short' && grupMetni(s.giris?.long, g);
  const S = yon !== 'sadece_long' && grupMetni(s.giris?.short, g);
  satirlar.push({ baslik: 'Timeframe', metin: `${s.zaman_dilimi ?? 'the chart timeframe'}; rules are checked at the open of each new bar, using the last closed bar.` });
  if (yon !== 'iki_yon') satirlar.push({ baslik: 'Direction', metin: yon === 'sadece_long' ? 'Long trades only.' : 'Short trades only.' });
  if (L) satirlar.push({ baslik: 'Long entry', metin: `When ${L}.` });
  if (S) satirlar.push({ baslik: 'Short entry', metin: `When ${S}.` });
  const c = s.cikis ?? {};
  if (c.stop) satirlar.push({ baslik: 'Stop', metin: `${mesafeMetni(c.stop, g)} from entry.` });
  if (c.hedef) satirlar.push({ baslik: 'Target', metin: `${mesafeMetni(c.hedef, g)} from entry.` });
  if (c.iz_suren_stop) satirlar.push({ baslik: 'Trailing stop', metin: `Follows price at ${mesafeMetni(c.iz_suren_stop, g)}, and only moves in the direction of profit.` });
  const cl = grupMetni(c.kosul?.long, g), cs = grupMetni(c.kosul?.short, g);
  if (cl) satirlar.push({ baslik: 'Long exit', metin: `Close when ${cl}.` });
  if (cs) satirlar.push({ baslik: 'Short exit', metin: `Close when ${cs}.` });
  if (c.max_bar) satirlar.push({ baslik: 'Time limit', metin: `Close after ${c.max_bar} bars.` });
  const r = s.risk ?? {};
  if (r.islem_basi_yuzde) {
    const ek = [];
    if ((r.max_acik_pozisyon ?? 1) > 1) ek.push(`at most ${r.max_acik_pozisyon} positions at a time`);
    else ek.push('one position at a time');
    if (r.gunluk_max_kayip_yuzde) ek.push(`no new trades after a ${ondalik(r.gunluk_max_kayip_yuzde)}% loss in the day`);
    if (r.max_spread_puan) ek.push(`no entry if the spread exceeds ${r.max_spread_puan} points`);
    const vh = r.volatilite_hedefi;
    if (vh) ek.push(`risk is scaled inversely to the ${vh.gosterge} ratio (at least ${ondalik(vh.alt_carpan ?? 0.25)}×, at most ${ondalik(vh.ust_carpan ?? 1.5)}×); if volatility is twice its normal level, risk is halved`);
    satirlar.push({ baslik: 'Risk', metin: `Lot size is set so a stop-out loses ${ondalik(r.islem_basi_yuzde)}% of the balance; ${ek.join('; ')}.` });
  }
  const f = s.filtre ?? {};
  if (f.saat) satirlar.push({ baslik: 'Hours', metin: `New entries only between ${f.saat.bas}:00 and ${f.saat.bit}:00 server time.` });
  if (f.haber) satirlar.push({ baslik: 'News', metin: `No new entries from ${f.haber.once_dk ?? 30} min before to ${f.haber.sonra_dk ?? 30} min after ${f.haber.onem === 'orta' ? 'medium and high' : 'high'} impact releases.` });
  return satirlar;
}
