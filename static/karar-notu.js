/* Ana sayfadaki karar notu: tohumlu SENTETİK bir seride iki ortalamalı bir kuralı
 * maliyetsiz ve maliyetli olarak sınar. Rakamlar sayfada hesaplanır; hiçbir piyasa
 * verisi kullanılmaz ve hiçbir yere bir şey gönderilmez.
 *
 * Kural: hızlı ortalama yavaşın üstündeyse alış, altındaysa satış pozisyonu.
 * Sinyal mum kapanışında üretilir ve bir sonraki mumun getirisine uygulanır (ileriye bakma yok).
 */
(function () {
  'use strict';
  var kok = document.getElementById('karar-notu');
  if (!kok) return;

  var ADET = 3000, BASLANGIC = 1.1, PIP = 0.0001;

  // mulberry32 + Box-Muller: her ziyaretçi aynı seriyi görür.
  function rastgele(tohum) {
    return function () {
      tohum |= 0; tohum = (tohum + 0x6d2b79f5) | 0;
      var t = Math.imul(tohum ^ (tohum >>> 15), 1 | tohum);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seriUret(no) {
    var r = rastgele(20261020 + no), k = [BASLANGIC], egilim = 0, oyn = 0.0011;
    for (var i = 1; i < ADET; i++) {
      if (i % 350 === 1) egilim = (r() - 0.5) * 0.00006;   // rejim: yön (zayıf; kural kâğıt üstünde kolay kazanmasın)
      if (i % 500 === 1) oyn = 0.0007 + r() * 0.0010;       // rejim: oynaklık
      var z = Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());
      k.push(k[i - 1] * Math.exp(egilim + oyn * z));
    }
    return k;
  }
  var seriNo = 1, KAPANIS = seriUret(seriNo);

  function ortalama(k, n) {
    var o = new Array(k.length).fill(NaN), t = 0;
    for (var i = 0; i < k.length; i++) {
      t += k[i];
      if (i >= n) t -= k[i - n];
      if (i >= n - 1) o[i] = t / n;
    }
    return o;
  }

  function sina(hizli, yavas, maliyetPip) {
    var h = ortalama(KAPANIS, hizli), y = ortalama(KAPANIS, yavas);
    var poz = 0, deger = 1, tepe = 1, dusus = 0, islem = 0, egri = [1];
    for (var i = 0; i < KAPANIS.length - 1; i++) {
      var yeni = isNaN(y[i]) ? 0 : (h[i] > y[i] ? 1 : -1);
      if (yeni !== poz) {
        // Pozisyon değişimi başına yarım spread değil tam maliyet: ihtiyatlı.
        deger *= 1 - Math.abs(yeni - poz) * maliyetPip * PIP / KAPANIS[i];
        if (yeni !== 0) islem++;
        poz = yeni;
      }
      deger *= 1 + poz * (KAPANIS[i + 1] / KAPANIS[i] - 1);
      if (deger > tepe) tepe = deger;
      dusus = Math.max(dusus, 1 - deger / tepe);
      egri.push(deger);
    }
    return { getiri: deger - 1, dusus: dusus, islem: islem, egri: egri };
  }

  var yuzde = new Intl.NumberFormat('tr-TR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' });
  var yuzdeSade = new Intl.NumberFormat('tr-TR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var tam = new Intl.NumberFormat('tr-TR');

  var el = function (s) { return kok.querySelector(s); };
  var hizliEl = el('[name=hizli]'), yavasEl = el('[name=yavas]');
  var SVG_G = 560, SVG_Y = 180;

  function yol(dizi, min, max) {
    var adim = Math.max(1, Math.floor(dizi.length / 280)), p = '';
    for (var i = 0; i < dizi.length; i += adim) {
      var x = (i / (dizi.length - 1)) * SVG_G;
      var yy = SVG_Y - 8 - ((dizi[i] - min) / (max - min || 1)) * (SVG_Y - 16);
      p += (p ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1);
    }
    return p;
  }

  function ciz() {
    var hizli = +hizliEl.value, yavas = +yavasEl.value;
    if (hizli >= yavas) { yavas = hizli + 10; yavasEl.value = yavas; }
    el('[data-deger=hizli]').textContent = hizli;
    el('[data-deger=yavas]').textContent = yavas;

    var a = sina(hizli, yavas, 0), b = sina(hizli, yavas, 1);
    var tumu = a.egri.concat(b.egri);
    var min = Math.min.apply(null, tumu), max = Math.max.apply(null, tumu);
    el('[data-cizgi=maliyetsiz]').setAttribute('d', yol(a.egri, min, max));
    el('[data-cizgi=maliyetli]').setAttribute('d', yol(b.egri, min, max));
    var bir = SVG_Y - 8 - ((1 - min) / (max - min || 1)) * (SVG_Y - 16);
    var taban = el('[data-cizgi=taban]');
    taban.setAttribute('y1', bir.toFixed(1)); taban.setAttribute('y2', bir.toFixed(1));

    el('[data-s=getiri0]').textContent = yuzde.format(a.getiri);
    el('[data-s=getiri1]').textContent = yuzde.format(b.getiri);
    el('[data-s=dusus0]').textContent = yuzdeSade.format(a.dusus);
    el('[data-s=dusus1]').textContent = yuzdeSade.format(b.dusus);
    el('[data-s=islem]').textContent = tam.format(a.islem);
    el('[data-s=getiri1]').className = 'sayi ' + (b.getiri < 0 ? 'eksi' : 'arti');
    el('[data-s=getiri0]').className = 'sayi ' + (a.getiri < 0 ? 'eksi' : 'arti');

    var c;
    if (a.getiri > 0 && b.getiri <= 0) c = 'Maliyetsiz kazandıran kural, işlem başına 1 pip maliyetle kaybettiriyor.';
    else if (a.getiri > 0) c = 'İşlem başına 1 pip maliyet, getirinin ' + yuzdeSade.format((a.getiri - b.getiri) / a.getiri) + ' kadarını götürüyor.';
    else c = 'Bu ayarla kural maliyetten önce de kazandırmıyor.';
    el('[data-s=cumle]').textContent = c + ' Tek bir seride görülen sonuç, kuralın işe yaradığını kanıtlamaz; aynı kuralı başka bir seride dene.';
    el('[data-s=serino]').textContent = tam.format(seriNo);
  }

  hizliEl.addEventListener('input', ciz);
  yavasEl.addEventListener('input', ciz);
  el('[data-eylem=yeni-seri]').addEventListener('click', function () {
    seriNo++;
    KAPANIS = seriUret(seriNo);
    ciz();
  });
  ciz();
})();
