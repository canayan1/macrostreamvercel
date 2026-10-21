// Strateji dosyasını düz Türkçe cümlelere çevirir. Kullanıcı ne kurduğunu JSON
// okumadan görsün diye. Öneri değil; yalnız kurulan kuralın tarifi.

const OP = {
  '>': 'büyükse', '<': 'küçükse', '>=': 'büyük ya da eşitse', '<=': 'küçük ya da eşitse',
  yukari_keser: 'yukarı keserse', asagi_keser: 'aşağı keserse',
};
const FIYAT = { acilis: 'açılış', yuksek: 'yüksek', dusuk: 'düşük', kapanis: 'kapanış' };
const HAT = { ust: 'üst bant', alt: 'alt bant', orta: 'orta bant', sinyal: 'sinyal hattı', arti: '+DI', eksi: '−DI', ana: '', oran: 'oranı (olağana göre)', uzun: 'uzun dönem düzeyi' };

export function gostergeTanimi(t) {
  if (!t) return '?';
  if (t.tip === 'MACD') return `MACD ${t.hizli}/${t.yavas}/${t.sinyal}`;
  if (t.tip === 'BB') return `Bollinger ${t.periyot}, ${t.sapma}σ`;
  if (t.tip === 'EWMA_VOL') return `EWMA oynaklık λ=${String(t.lambda ?? 0.94).replace('.', ',')}`;
  if (t.tip === 'YZ_VOL') return `Yang-Zhang oynaklık ${t.periyot}`;
  if (t.tip === 'GARCH_VOL') return `${(t.model ?? 'garch').toUpperCase()}${t.dagilim === 't' ? '-t' : ''} oynaklık, ${t.pencere ?? 1000} mum, ${t.yenile ?? 24} mumda bir`;
  return `${t.tip} ${t.periyot}`;
}

export function operandMetni(o, g = {}) {
  if (typeof o === 'number') return String(o).replace('.', ',');
  if (typeof o !== 'string') return '?';
  const [ad, hat = ''] = o.split('.');
  if (ad === 'fiyat') return `${FIYAT[hat] ?? hat} fiyatı`;
  const t = g[ad];
  const hatAdi = HAT[hat] ?? hat;
  return `${ad}${hatAdi ? ' ' + hatAdi : ''} (${gostergeTanimi(t)})`;
}

function grupMetni(gr, g) {
  if (!gr) return null;
  const tur = gr.hepsi ? 'hepsi' : 'herhangi';
  const parca = (gr[tur] ?? []).map(k => `${operandMetni(k.sol, g)}, ${operandMetni(k.sag, g)} değerinden ${OP[k.op] ?? k.op}`);
  return parca.join(tur === 'hepsi' ? ' VE ' : ' VEYA ');
}

function mesafeMetni(m, g) {
  if (!m) return null;
  const sayi = v => String(v).replace('.', ',');
  switch (m.tip) {
    case 'atr': return `${sayi(m.carpan)} × ${m.gosterge} (${gostergeTanimi(g[m.gosterge])})`;
    case 'oynaklik': return `giriş fiyatı × ${m.gosterge} öngörüsü × ${sayi(m.carpan)} (${gostergeTanimi(g[m.gosterge])})`;
    case 'puan': return `${sayi(m.deger)} puan`;
    case 'yuzde': return `giriş fiyatının %${sayi(m.deger)}'i`;
    case 'r': return `stop mesafesinin ${sayi(m.deger)} katı (${sayi(m.deger)}R)`;
  }
  return '?';
}

export function ozet(s) {
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
    if (r.gunluk_max_kayip_yuzde) ek.push(`gün içinde %${String(r.gunluk_max_kayip_yuzde).replace('.', ',')} kayıpta yeni işlem yok`);
    if (r.max_spread_puan) ek.push(`spread ${r.max_spread_puan} puanı aşarsa giriş yok`);
    const vh = r.volatilite_hedefi;
    if (vh) ek.push(`risk ${vh.gosterge} oranıyla ters orantılı ölçeklenir (en az ${String(vh.alt_carpan ?? 0.25).replace('.', ',')}×, en çok ${String(vh.ust_carpan ?? 1.5).replace('.', ',')}×); oynaklık olağanın iki katıysa risk yarıya iner`);
    satirlar.push({ baslik: 'Risk', metin: `Stop olursa bakiyenin %${String(r.islem_basi_yuzde).replace('.', ',')}'i kaybedilecek şekilde lot; ${ek.join('; ')}.` });
  }
  const f = s.filtre ?? {};
  if (f.saat) satirlar.push({ baslik: 'Saat', metin: `Yeni giriş yalnız sunucu saatiyle ${f.saat.bas}:00–${f.saat.bit}:00 arası.` });
  if (f.haber) satirlar.push({ baslik: 'Haber', metin: `${f.haber.onem === 'orta' ? 'Orta ve yüksek' : 'Yüksek'} önemli verilerden ${f.haber.once_dk ?? 30} dk önce ile ${f.haber.sonra_dk ?? 30} dk sonra arasında yeni giriş yok.` });
  return satirlar;
}
