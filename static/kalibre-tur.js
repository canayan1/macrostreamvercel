/* Kalibre — sayfa içi tanıtım turu.
 *
 * Bağımsız, kütüphanesiz. Sayfadaki gerçek öğeleri işaret eden baloncuklarla
 * "ne nerede" anlatır. Tasarım ilkeleri:
 *   - Asla engellemez: Esc, dışa tıklama ve "Atla" her adımda çalışır.
 *   - Bir kez gösterilir; kullanıcı isterse yeniden başlatabilir.
 *   - Hedef öğe sayfada yoksa o adım sessizce atlanır (kırık tur olmaz).
 *   - Klavye ile gezilir; odak baloncuğa taşınır, kapanınca geri verilir.
 *   - prefers-reduced-motion'a saygı duyar.
 *
 * Kullanım:
 *   <script src="/static/kalibre-tur.js" defer></script>
 *   KalibreTur.kur('panom-v1', [
 *     {sec:'#guide', baslik:'Başlangıç rehberi', metin:'…'},
 *     {sec:'#portfoylar', baslik:'…', metin:'…', konum:'ust'}
 *   ]);                       // ilk ziyarette kendiliğinden başlar
 *   KalibreTur.baslat();      // düğmeden yeniden başlatmak için
 */
(function () {
  'use strict';
  if (window.KalibreTur) return;

  var LS = 'kalibre-tur-';
  var adimlar = [], turId = null, i = 0, acik = false, oncekiOdak = null;
  var kat, kutu, halka;
  var azHareket = false;
  try {
    azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var css =
    '.ktur-kat{position:fixed;inset:0;z-index:100000;pointer-events:auto}' +
    '.ktur-perde{position:fixed;background:rgba(6,5,4,.72);pointer-events:auto}' +
    '.ktur-halka{position:fixed;border:2px solid #ffa630;border-radius:12px;' +
    'box-shadow:0 0 0 4px rgba(255,166,48,.18);pointer-events:none;z-index:100001;' +
    (azHareket ? '' : 'transition:all .25s cubic-bezier(.4,0,.2,1)') + '}' +
    '.ktur-kutu{position:fixed;z-index:100002;width:320px;max-width:calc(100vw - 28px);' +
    'background:#14110e;border:1px solid #2a241d;border-radius:14px;padding:17px 18px 15px;' +
    'box-shadow:0 20px 50px rgba(0,0,0,.6);color:#e8e2d8;' +
    "font-family:'Inter Tight',Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;" +
    (azHareket ? '' : 'transition:top .25s cubic-bezier(.4,0,.2,1),left .25s cubic-bezier(.4,0,.2,1)') + '}' +
    '.ktur-kutu h4{margin:0 0 6px;font-size:15.5px;font-weight:600;letter-spacing:-.01em;color:#e8e2d8}' +
    '.ktur-kutu p{margin:0 0 14px;font-size:13.5px;line-height:1.58;color:#b8ae9e}' +
    '.ktur-alt{display:flex;align-items:center;gap:10px}' +
    ".ktur-say{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;color:#6f6553}" +
    '.ktur-alt .bosluk{flex:1}' +
    '.ktur-kutu button{border:0;border-radius:9px;padding:8px 15px;font-size:12.5px;font-weight:700;' +
    'cursor:pointer;font-family:inherit;background:#ffa630;color:#1a1a1a}' +
    '.ktur-kutu button:hover{background:#ff7a00}' +
    '.ktur-kutu button.ikincil{background:transparent;color:#b8ae9e;border:1px solid #2a241d;font-weight:600}' +
    '.ktur-kutu button.ikincil:hover{border-color:#ffa630;color:#ffa630}' +
    '.ktur-kutu button:focus-visible,.ktur-kutu button.ikincil:focus-visible{outline:2px solid #ffa630;outline-offset:2px}' +
    '.ktur-atla{position:absolute;top:12px;right:13px;background:none!important;border:0!important;' +
    'color:#6f6553!important;font-size:12px!important;font-weight:500!important;padding:3px!important;cursor:pointer}' +
    '.ktur-atla:hover{color:#e8e2d8!important}';

  function stilEkle() {
    if (document.getElementById('ktur-css')) return;
    var s = document.createElement('style');
    s.id = 'ktur-css'; s.textContent = css;
    document.head.appendChild(s);
  }
  function gorulduMu(id) { try { return localStorage.getItem(LS + id) === '1'; } catch (e) { return false; } }
  function gorulduYaz(id) { try { localStorage.setItem(LS + id, '1'); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hedef(a) { try { return a.sec ? document.querySelector(a.sec) : null; } catch (e) { return null; } }

  // Hedefi olan ilk adımı bul (yoksa -1)
  function sonrakiGecerli(bas, yon) {
    for (var k = bas; k >= 0 && k < adimlar.length; k += yon) {
      if (!adimlar[k].sec || hedef(adimlar[k])) return k;
    }
    return -1;
  }

  function perdeleriCiz(r) {
    var W = window.innerWidth, H = window.innerHeight, p = 6;
    var kutular = r
      ? [[0, 0, W, Math.max(0, r.top - p)],
         [0, Math.min(H, r.bottom + p), W, Math.max(0, H - r.bottom - p)],
         [0, Math.max(0, r.top - p), Math.max(0, r.left - p), Math.min(H, r.height + 2 * p)],
         [Math.min(W, r.right + p), Math.max(0, r.top - p), Math.max(0, W - r.right - p), Math.min(H, r.height + 2 * p)]]
      : [[0, 0, W, H]];
    kat.innerHTML = '';
    kutular.forEach(function (b) {
      var d = document.createElement('div');
      d.className = 'ktur-perde';
      d.style.cssText = 'left:' + b[0] + 'px;top:' + b[1] + 'px;width:' + b[2] + 'px;height:' + b[3] + 'px';
      d.addEventListener('click', kapat);
      kat.appendChild(d);
    });
  }

  function yerlestir(r, konum) {
    var kw = kutu.offsetWidth, kh = kutu.offsetHeight;
    var W = window.innerWidth, H = window.innerHeight, bosluk = 14, sol, ust;
    if (!r) {                                   // hedefsiz adım: ortala
      sol = (W - kw) / 2; ust = (H - kh) / 2;
    } else if (r.height > H * 0.55) {            // hedef ekrandan uzunsa yanına koy
      ust = Math.max(bosluk, r.top + 10);
      sol = (r.left > kw + 2 * bosluk) ? r.left - kw - bosluk : r.right + bosluk;
      if (sol + kw + bosluk > W) { sol = r.left + 10; ust = Math.max(bosluk, r.top + 10); }
    } else if (konum === 'ust' || (konum !== 'alt' && r.bottom + kh + bosluk > H)) {
      ust = r.top - kh - bosluk;
      sol = r.left + r.width / 2 - kw / 2;
      if (ust < bosluk) ust = Math.min(H - kh - bosluk, r.bottom + bosluk);
    } else {
      ust = r.bottom + bosluk;
      sol = r.left + r.width / 2 - kw / 2;
    }
    kutu.style.left = Math.max(bosluk, Math.min(W - kw - bosluk, sol)) + 'px';
    kutu.style.top = Math.max(bosluk, Math.min(H - kh - bosluk, ust)) + 'px';
  }

  function ciz() {
    var a = adimlar[i];
    var el = hedef(a);
    var r = el ? el.getBoundingClientRect() : null;

    kutu.innerHTML =
      '<button class="ktur-atla" type="button" data-atla>Atla</button>' +
      '<h4>' + esc(a.baslik) + '</h4>' +
      '<p>' + esc(a.metin) + '</p>' +
      '<div class="ktur-alt">' +
        '<span class="ktur-say">' + (i + 1) + ' / ' + adimlar.length + '</span>' +
        '<span class="bosluk"></span>' +
        (sonrakiGecerli(i - 1, -1) >= 0 ? '<button class="ikincil" type="button" data-geri>Geri</button>' : '') +
        '<button type="button" data-ileri>' + (sonrakiGecerli(i + 1, 1) >= 0 ? 'İleri' : 'Bitti') + '</button>' +
      '</div>';

    if (r) {
      halka.style.display = 'block';
      halka.style.cssText += ';left:' + (r.left - 5) + 'px;top:' + (r.top - 5) + 'px;' +
                             'width:' + (r.width + 10) + 'px;height:' + (r.height + 10) + 'px';
    } else {
      halka.style.display = 'none';
    }
    perdeleriCiz(r);
    yerlestir(r, a.konum);

    kutu.querySelector('[data-atla]').onclick = kapat;
    var ileri = kutu.querySelector('[data-ileri]');
    ileri.onclick = function () {
      var s = sonrakiGecerli(i + 1, 1);
      if (s < 0) { bitir(); return; }
      git(s);
    };
    var geri = kutu.querySelector('[data-geri]');
    if (geri) geri.onclick = function () {
      var s = sonrakiGecerli(i - 1, -1);
      if (s >= 0) git(s);
    };
    ileri.focus();
  }

  /** Adıma geçer: hedefi görünür alana kaydırır, sonra çizer. */
  function git(k) {
    i = k;
    gorunureKaydir(adimlar[i], ciz);
  }

  function gorunureKaydir(a, tamam) {
    var el = hedef(a);
    if (!el) return tamam();
    var r = el.getBoundingClientRect();
    if (r.top >= 60 && r.bottom <= window.innerHeight - 60) return tamam();
    kaydirmaKilit = true;
    try {
      el.scrollIntoView({ block: 'center', behavior: azHareket ? 'auto' : 'smooth' });
    } catch (e) { el.scrollIntoView(); }
    setTimeout(function () { kaydirmaKilit = false; tamam(); }, azHareket ? 0 : 340);
  }

  function tusla(e) {
    if (!acik) return;
    if (e.key === 'Escape') { e.preventDefault(); kapat(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); var s = sonrakiGecerli(i + 1, 1); if (s < 0) bitir(); else git(s); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); var g = sonrakiGecerli(i - 1, -1); if (g >= 0) git(g); }
    else if (e.key === 'Tab') {                       // odağı kutuda tut
      var od = kutu.querySelectorAll('button');
      if (!od.length) return;
      var ilk = od[0], son = od[od.length - 1];
      if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
    }
  }

  var kaydirmaKilit = false;
  var yenidenCiz = function () { if (acik && !kaydirmaKilit) ciz(); };

  function ac() {
    stilEkle();
    oncekiOdak = document.activeElement;
    kat = document.createElement('div'); kat.className = 'ktur-kat';
    halka = document.createElement('div'); halka.className = 'ktur-halka';
    kutu = document.createElement('div'); kutu.className = 'ktur-kutu';
    kutu.setAttribute('role', 'dialog');
    kutu.setAttribute('aria-modal', 'true');
    kutu.setAttribute('aria-label', 'Sayfa tanıtım turu');
    document.body.appendChild(kat);
    document.body.appendChild(halka);
    document.body.appendChild(kutu);
    acik = true;
    document.addEventListener('keydown', tusla, true);
    window.addEventListener('resize', yenidenCiz);
    window.addEventListener('scroll', yenidenCiz, true);
    gorunureKaydir(adimlar[i], ciz);
    olay('tour_start');
  }

  function temizle() {
    acik = false;
    document.removeEventListener('keydown', tusla, true);
    window.removeEventListener('resize', yenidenCiz);
    window.removeEventListener('scroll', yenidenCiz, true);
    [kat, halka, kutu].forEach(function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); });
    kat = halka = kutu = null;
    if (oncekiOdak && oncekiOdak.focus) { try { oncekiOdak.focus(); } catch (e) {} }
  }
  function kapat() { if (!acik) return; olay('tour_skip', { step: i + 1 }); gorulduYaz(turId); temizle(); }
  function bitir() { if (!acik) return; olay('tour_complete'); gorulduYaz(turId); temizle(); }

  function olay(ad, ek) {
    try { if (window.gtag) window.gtag('event', ad, Object.assign({ tour: turId }, ek || {})); } catch (e) {}
  }

  function baslat() {
    if (acik || !adimlar.length) return;
    var s = sonrakiGecerli(0, 1);
    if (s < 0) return;                    // hiçbir hedef yok: turu hiç açma
    i = s; ac();
  }

  window.KalibreTur = {
    /** Turu tanımlar; daha önce görülmediyse (ve otomatik kapalı değilse) başlatır. */
    kur: function (id, liste, secenek) {
      turId = id; adimlar = liste || [];
      var o = secenek || {};
      if (o.otomatik === false || gorulduMu(id)) return;
      var gecikme = o.gecikme == null ? 700 : o.gecikme;
      setTimeout(baslat, gecikme);
    },
    baslat: baslat,
    gorulduMu: function () { return gorulduMu(turId); },
    sifirla: function () { try { localStorage.removeItem(LS + turId); } catch (e) {} }
  };
})();
