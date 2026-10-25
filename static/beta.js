/* Kalibre: kapalı beta bandı. Ürün sayfalarının üst barının hemen altında ince bir uyarı.
 * Oturum boyunca kapatılabilir (sessionStorage; erişilemezse her sayfada görünür).
 * Dil: <html lang>. Kullanım: <script src="/static/beta.js" defer></script>
 */
(function () {
  'use strict';
  if (document.getElementById('km-beta')) return;
  var ANAHTAR = 'kalibre-beta-bandi-kapali';
  try { if (sessionStorage.getItem(ANAHTAR) === '1') return; } catch (e) {}

  var en = document.documentElement.lang === 'en';
  var metin = en
    ? 'Closed beta: use demo accounts only. All results are simulations and may not include costs; do not make real-money decisions with them.'
    : 'Kapalı beta: yalnız demo hesaplarla kullanın. Tüm sonuçlar simülasyondur ve maliyetleri içermeyebilir; gerçek parayla karar vermeyin.';
  var baglanti = en ? 'Send feedback' : 'Geri bildirim gönder';
  var adres = en ? '/en/beta/' : '/beta/';
  var kapat = en ? 'Close' : 'Kapat';

  var st = document.createElement('style');
  st.textContent =
    '#km-beta{background:#2a2414;border-bottom:1px solid #5c4a1c;color:#f1e3bf;font:400 14px/1.45 "IBM Plex Sans",system-ui,sans-serif}' +
    '#km-beta .k{max-width:1180px;margin:0 auto;padding:8px clamp(16px,4vw,40px);display:flex;gap:12px;align-items:center;flex-wrap:wrap}' +
    '#km-beta p{margin:0;flex:1 1 320px}' +
    '#km-beta a{color:#ffd88a;font-weight:600;text-underline-offset:3px}' +
    '#km-beta button{background:none;border:1px solid #7a6428;color:#f1e3bf;border-radius:4px;padding:3px 10px;font:500 13px inherit;cursor:pointer}' +
    '#km-beta button:hover{border-color:#ffd88a}' +
    '#km-beta a:focus-visible,#km-beta button:focus-visible{outline:2px solid #8fc7ff;outline-offset:2px}';
  document.head.appendChild(st);

  var d = document.createElement('div');
  d.id = 'km-beta';
  d.setAttribute('role', 'note');
  var k = document.createElement('div');
  k.className = 'k';
  var p = document.createElement('p');
  p.textContent = metin + ' ';
  var a = document.createElement('a');
  a.href = adres;
  a.textContent = baglanti;
  p.appendChild(a);
  var b = document.createElement('button');
  b.type = 'button';
  b.textContent = kapat;
  b.addEventListener('click', function () {
    try { sessionStorage.setItem(ANAHTAR, '1'); } catch (e) {}
    d.remove();
  });
  k.appendChild(p);
  k.appendChild(b);
  d.appendChild(k);

  var ust = document.getElementById('km-ust') || document.querySelector('header.ust');
  if (ust && ust.parentNode) ust.parentNode.insertBefore(d, ust.nextSibling);
  else document.body.insertBefore(d, document.body.firstChild);
})();
