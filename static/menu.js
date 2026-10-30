// Üst menü davranışı (static/site.css "üst bar"). Menü JS olmadan da çalışır: paneller <details>.
// Bu betik: aynı anda tek panel açık kalır; dışarı tıklama ve Esc paneli kapatır; dar ekranda
// "Menü" düğmesi menüyü çekmece olarak açar (html.js sınıfı bu kipi etkinleştirir).
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var ust = document.querySelector('header.ust');
  if (!ust) return;
  var gruplar = [].slice.call(ust.querySelectorAll('details.mgrup'));
  var dugme = ust.querySelector('.menu-ac');
  var dar = window.matchMedia('(max-width: 1080px)');

  function hepsiniKapat(haric) {
    gruplar.forEach(function (d) { if (d !== haric) d.removeAttribute('open'); });
  }
  gruplar.forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open && !dar.matches) hepsiniKapat(d); });
    // Masaüstünde fare panelden çıkınca kapanmaz; tıklama ile açılıp kapanır (dokunmatikle tutarlı).
  });
  document.addEventListener('click', function (e) {
    if (!ust.contains(e.target)) { hepsiniKapat(null); cekmece(false); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var acik = gruplar.filter(function (d) { return d.open; })[0];
    if (acik) { acik.removeAttribute('open'); acik.querySelector('summary').focus(); return; }
    if (ust.classList.contains('acik')) { cekmece(false); if (dugme) dugme.focus(); }
  });

  function cekmece(ac) {
    if (!dugme) return;
    ust.classList.toggle('acik', ac);
    dugme.setAttribute('aria-expanded', ac ? 'true' : 'false');
    if (!ac) hepsiniKapat(null);
  }
  if (dugme) {
    dugme.addEventListener('click', function () { cekmece(!ust.classList.contains('acik')); });
    var guncelle = function () { if (!dar.matches) cekmece(false); };
    if (dar.addEventListener) dar.addEventListener('change', guncelle); else if (dar.addListener) dar.addListener(guncelle);
  }
})();
