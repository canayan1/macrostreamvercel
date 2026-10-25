// Ana sayfadaki canlı gösterim: laboratuvarın gerçek modülleriyle, SENTETİK veriyle.
//   - Mini Panom: lab/src/panom/ornek.js örnek hesabı, lab/src/panom/ozet.js özeti.
//   - Mini optimizasyon: lab/src/sentetik.js serisinde EMA trend örneği, lab/src/optimizasyon.js taraması.
// Hiçbir şey ağdan gelmez; hiçbir şey sunucuya gitmez.

// Modüller dinamik yüklenir: biri yüklenemezse sayfa çökmez, yedek kutu görünür.
let panomOrnek, hesapOzeti, parametreler, tara, uret;

const kok = document.getElementById('gosterim');
if (kok) baslat().catch(() => { kok.querySelector('[data-hata]').hidden = false; });

async function baslat() {
  [{ panomOrnek }, { hesapOzeti }, { parametreler, tara }, { uret }] = await Promise.all([
    import('/lab/src/panom/ornek.js'), import('/lab/src/panom/ozet.js'),
    import('/lab/src/optimizasyon.js'), import('/lab/src/sentetik.js'),
  ]);
  const EN = document.documentElement.lang === 'en';
  const yerel = EN ? 'en-US' : 'tr-TR';
  const para = (v, c = 'USD') => new Intl.NumberFormat(yerel, { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(v);
  const yuzde = (v, isaret = false) => new Intl.NumberFormat(yerel, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: isaret ? 'exceptZero' : 'auto' }).format(v);
  const sayi = (v, b) => new Intl.NumberFormat(yerel, { minimumFractionDigits: b, maximumFractionDigits: b }).format(v);
  const $ = s => kok.querySelector(s);

  // ------------------------------------------------------------ mini Panom
  const o = panomOrnek();   // köprü belge biçiminde: kotalar.kotalar, islemler.islemler, pozisyonlar
  const oz = hesapOzeti(o.islemler);
  const p = o.pozisyonlar;
  $('[data-p=bakiye]').textContent = para(p.bakiye, p.para);
  $('[data-p=varlik]').textContent = para(p.varlik, p.para);
  $('[data-p=net]').textContent = para(oz.net, p.para);
  const liste = $('[data-p=kurlar]');
  for (const q of o.kotalar.kotalar.slice(0, 5)) {
    const d = (q.alis - q.oncekiKapanis) / q.oncekiKapanis;
    const li = document.createElement('li');
    const a = document.createElement('span'); a.textContent = q.sembol;
    const f = document.createElement('span'); f.className = 'sayi'; f.textContent = sayi(q.alis, q.basamak);
    const g = document.createElement('span'); g.className = 'sayi ' + (d < 0 ? 'eksi' : 'arti'); g.textContent = yuzde(d, true);
    li.append(a, f, g);
    liste.append(li);
  }
  $('[data-p=ozet]').textContent = EN
    ? `${oz.adet} closed trades, win rate ${yuzde(oz.kazanmaOrani)}, profit factor ${sayi(oz.karFaktoru, 2)}, largest realised drawdown ${para(oz.azamiDusus, p.para)}.`
    : `${oz.adet} kapanmış işlem, kazanma oranı ${yuzde(oz.kazanmaOrani)}, kâr faktörü ${sayi(oz.karFaktoru, 2)}, gerçekleşmiş en büyük düşüş ${para(oz.azamiDusus, p.para)}.`;
  egriCiz($('[data-p=egri]'), oz.egri.map(n => n.bakiye));

  // ------------------------------------------------------------ mini optimizasyon
  const ornek = await (await fetch('/ornekler/ema-trend.json')).json();
  ornek.risk = { islem_basi_yuzde: 1 };   // gösterim için; laboratuvarda risk kullanıcıdadır
  delete ornek.filtre;
  const secilen = parametreler(ornek)
    .filter(x => x.yol === 'gostergeler.hizli.periyot' || x.yol === 'gostergeler.yavas.periyot')
    .map(x => x.yol.endsWith('hizli.periyot') ? { ...x, min: 10, max: 35, adim: 5 } : { ...x, min: 40, max: 140, adim: 20 });
  const SPREADLER = [0, 0.02, 0.05, 0.1];
  const seriEl = $('[name=seri]'), spreadEl = $('[name=spread]');
  let sira = 0;

  async function calistir() {
    const no = ++sira;
    const tohum = Number(seriEl.value), spread = SPREADLER[Number(spreadEl.value)];
    $('[data-deger=seri]').textContent = tohum;
    $('[data-deger=spread]').textContent = spread === 0 ? (EN ? 'none' : 'yok') : sayi(spread, 2);
    const mumlar = uret({ tohum, adet: 1500 });
    const r = await tara(ornek, mumlar, secilen, { enAzIslem: 5, maliyet: { spread, kayma: 0, komisyonYuzde: 0 } });
    if (no !== sira) return;   // kullanıcı bu arada ayarı değiştirdi
    isiCiz($('[data-p=isi]'), r, secilen);
    const en = r.enIyiler[0];
    $('[data-p=ayar]').textContent = en ? `${en.degerler[0]} / ${en.degerler[1]}` : '-';
    $('[data-p=egitim]').textContent = en ? yuzde(en.egitim.getiriYuzde / 100, true) : '-';
    $('[data-p=sinama]').textContent = en?.sinama ? yuzde(en.sinama.getiriYuzde / 100, true) : '-';
    const ul = $('[data-p=uyarilar]');
    ul.replaceChildren(...r.uyarilar.filter(u => METIN[u.kod]).map(u => {
      const li = document.createElement('li');
      li.textContent = (EN ? METIN[u.kod].en : METIN[u.kod].tr).replace('{dsr}', u.dsr !== undefined ? yuzde(u.dsr) : '');
      return li;
    }));
    $('[data-p=etiket]').textContent = spread === 0
      ? (EN ? 'Gross (no costs)' : 'Brüt (maliyetsiz)')
      : (EN ? `Net (spread ${sayi(spread, 2)} per trade)` : `Net (işlem başına ${sayi(spread, 2)} spread)`);
  }
  seriEl.addEventListener('input', calistir);
  spreadEl.addEventListener('input', calistir);
  await calistir();
}

const METIN = {
  sinama_dusuk: { tr: 'Eğitimde en yüksek puanı alan ayar, sınama döneminde yarıdan fazla geriledi.', en: 'The top setting in training lost more than half its score in the test period.' },
  sinama_zarar: { tr: 'Aynı ayar sınama döneminde zarar etti.', en: 'The same setting lost money in the test period.' },
  sivri_tepe: { tr: 'Komşu ayarlar çok daha zayıf: sonuç tek bir sivri tepeye dayanıyor olabilir.', en: 'Neighbouring settings are much weaker: the result may rest on a single sharp peak.' },
  sans_olabilir: { tr: 'Bu kadar denemede şans eseri olmama olasılığı {dsr}: sonuç şans olabilir.', en: 'Probability this is not luck, given the number of trials: {dsr}. The result may be luck.' },
};

function hazirla(canvas, oran) {
  const dpr = window.devicePixelRatio || 1;
  const g = canvas.clientWidth || 480;
  const y = Math.round(g * oran);
  canvas.width = Math.round(g * dpr); canvas.height = Math.round(y * dpr);
  canvas.style.height = y + 'px';
  const x = canvas.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { x, g, y };
}

function egriCiz(canvas, degerler) {
  const { x, g, y } = hazirla(canvas, 0.32);
  const min = Math.min(...degerler), max = Math.max(...degerler);
  x.strokeStyle = '#5fb89a'; x.lineWidth = 1.8; x.beginPath();
  degerler.forEach((v, i) => {
    const px = (i / Math.max(1, degerler.length - 1)) * (g - 8) + 4;
    const py = y - 6 - ((v - min) / (max - min || 1)) * (y - 12);
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  });
  x.stroke();
}

// Isı haritası: satırlar yavaş, sütunlar hızlı ortalama; renk eğitim puanı. En iyi hücre çerçeveli,
// az işlemli hücreler gri.
function isiCiz(canvas, r, secilen) {
  const { x, g, y } = hazirla(canvas, 0.62);
  const hizli = [...new Set(r.sonuclar.map(s => s.degerler[0]))].sort((a, b) => a - b);
  const yavas = [...new Set(r.sonuclar.map(s => s.degerler[1]))].sort((a, b) => a - b);
  const sol = 34, alt = 22;
  const hg = (g - sol) / hizli.length, hy = (y - alt) / yavas.length;
  const puanlar = r.sonuclar.filter(s => !s.yetersiz).map(s => s.puan);
  const pmin = Math.min(...puanlar, 0), pmax = Math.max(...puanlar, 0.0001);
  x.font = '11px "IBM Plex Sans", sans-serif'; x.fillStyle = '#a3b0c2'; x.textBaseline = 'middle';
  for (const s of r.sonuclar) {
    const i = hizli.indexOf(s.degerler[0]), j = yavas.indexOf(s.degerler[1]);
    const px = sol + i * hg, py = (yavas.length - 1 - j) * hy;
    if (s.yetersiz) x.fillStyle = '#24344c';
    else if (s.puan >= 0) { const t = s.puan / pmax; x.fillStyle = `rgba(95,184,154,${0.15 + 0.8 * t})`; }
    else { const t = s.puan / pmin; x.fillStyle = `rgba(224,122,110,${0.15 + 0.7 * t})`; }
    x.fillRect(px + 1, py + 1, hg - 2, hy - 2);
  }
  const en = r.enIyiler[0];
  if (en) {
    const i = hizli.indexOf(en.degerler[0]), j = yavas.indexOf(en.degerler[1]);
    x.strokeStyle = '#e7ecf2'; x.lineWidth = 2;
    x.strokeRect(sol + i * hg + 1, (yavas.length - 1 - j) * hy + 1, hg - 2, hy - 2);
  }
  x.fillStyle = '#a3b0c2'; x.textAlign = 'right';
  yavas.forEach((v, j) => x.fillText(String(v), sol - 6, (yavas.length - 1 - j) * hy + hy / 2));
  x.textAlign = 'center';
  hizli.forEach((v, i) => x.fillText(String(v), sol + i * hg + hg / 2, y - alt / 2));
}
