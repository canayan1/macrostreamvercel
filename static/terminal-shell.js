/* Kalibre Markets — kalıcı sol bar (paylaşılan kabuk).
 * İç sayfalara (eğitim, araçlar vb.) sol navigasyon barını runtime'da enjekte eder.
 * Kendi sol barı olan sayfalar (nav.panel) ve anasayfa atlanır.
 */
(function () {
  "use strict";

  // ── Atlama koşulları ───────────────────────────────────────────
  var path = location.pathname.replace(/\/index\.html$/, "/");
  if (path === "" ) path = "/";
  // Anasayfa: sol bar istemiyoruz (pazarlama landing)
  if (path === "/") return;
  // Zaten kendi sol barı olan sayfalar
  if (document.querySelector("nav.panel")) return;
  // Çift enjeksiyon koruması
  if (document.getElementById("km-rail")) return;

  // ── Modüller ───────────────────────────────────────────────────
  var MODULES = [
    { key: "egitim", ico: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 64 64\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-2px\"><path d=\"M32 12 L58 24 L32 36 L6 24 Z\"/><path d=\"M16 30 v14 c0 4 7 8 16 8 s16 -4 16 -8 V30\"/></svg>", label: "Eğitim", href: "/egitim/" },
    { key: "karar", ico: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 64 64\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-2px\"><circle cx=\"32\" cy=\"32\" r=\"20\"/><circle cx=\"32\" cy=\"32\" r=\"8\"/></svg>", label: "Pratik ve testler", href: "/trading/" },
    { key: "simulasyon", ico: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 64 64\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-2px\"><path d=\"M10 52h44\"/><rect x=\"14\" y=\"32\" width=\"9\" height=\"20\" rx=\"2\"/><rect x=\"28\" y=\"20\" width=\"9\" height=\"32\" rx=\"2\"/><rect x=\"42\" y=\"10\" width=\"9\" height=\"42\" rx=\"2\"/></svg>", label: "Simülasyon", href: "/simulasyon/" },
    { key: "hesap", ico: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 64 64\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-2px\"><rect x=\"12\" y=\"8\" width=\"40\" height=\"48\" rx=\"4\"/><line x1=\"20\" y1=\"22\" x2=\"44\" y2=\"22\"/><line x1=\"20\" y1=\"32\" x2=\"44\" y2=\"32\"/></svg>", label: "Hesaplayıcılar", href: "/carry-hesaplayici/" },
    { key: "kripto", ico: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 64 64\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-2px\"><path d=\"M20 6 c0 14 24 14 24 26 s-24 12 -24 26\"/><path d=\"M44 6 c0 14 -24 14 -24 26 s24 12 24 26\"/></svg>", label: "Kripto koçu", href: "/kripto/" },
    { key: "arastirma", ico: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 64 64\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-2px\"><circle cx=\"28\" cy=\"28\" r=\"16\"/><line x1=\"40\" y1=\"40\" x2=\"54\" y2=\"54\"/></svg>", label: "Araştırma", href: "/arastirma/" }
  ];

  // ── Aktif modülü mevcut yola göre tahmin et ────────────────────
  function activeKey(p) {
    if (/^\/(trading|islem-kontrolu|oyun|grafik-oku)(\/|$)/.test(p)) return "karar";
    if (/^\/simulasyon(\/|$)/.test(p)) return "simulasyon";
    if (/^\/(carry-hesaplayici|kur-riski-hesaplayici)(\/|$)/.test(p)) return "hesap";
    if (/^\/kripto(\/|$)/.test(p)) return "kripto";
    if (/^\/(arastirma|editor|metodoloji)(\/|$)/.test(p)) return "arastirma";
    if (/^\/egitim(\/|$)/.test(p)) return "egitim";
    return null;
  }
  var active = activeKey(path);

  // ── CSS ────────────────────────────────────────────────────────
  var css = ""
    + "#km-rail{position:fixed;left:0;top:0;bottom:0;width:232px;z-index:90;"
    + "background:var(--bg-1,#14110e);border-right:1px solid var(--border,#26221d);"
    + "padding:14px 0 8px;overflow-y:auto;display:flex;flex-direction:column;"
    + "font-family:inherit;-webkit-font-smoothing:antialiased;transition:transform .22s ease}"
    + "#km-rail a{text-decoration:none;color:inherit}"
    + ".cmdbar{display:none!important}.km-rail-brand{display:flex;align-items:center;gap:10px;padding:4px 18px 14px;"
    + "margin-bottom:6px;border-bottom:1px solid var(--border,#26221d)}"
    + ".km-rail-mark{width:30px;height:30px;border-radius:7px;flex:0 0 auto;display:flex;"
    + "align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#100e0c;"
    + "background:linear-gradient(135deg,var(--accent,#ffa630),var(--accent-hot,#ff7a00))}"
    + ".km-rail-name{font-size:13px;font-weight:700;letter-spacing:.02em;color:var(--text,#ebe3d3)}"
    + ".km-rail-name .sub{display:block;font-size:9px;font-weight:600;letter-spacing:.16em;"
    + "color:var(--muted,#6f6553)}"
    + ".km-rail-label{font-size:9.5px;letter-spacing:.16em;color:var(--muted,#6f6553);"
    + "text-transform:uppercase;font-weight:700;padding:6px 18px 8px}"
    + ".km-rail-item{display:flex;align-items:center;gap:10px;padding:11px 18px;cursor:pointer;"
    + "border-left:2px solid transparent;color:var(--text-dim,#a89c83);font-size:14px;font-weight:500;"
    + "transition:background .12s,border-color .12s,color .12s}"
    + ".km-rail-item:hover{background:var(--surface,#1a1612);color:var(--text,#ebe3d3)}"
    + ".km-rail-item.active{color:var(--text,#ebe3d3);background:var(--surface,#1a1612);"
    + "border-left-color:var(--accent,#ffa630)}"
    + ".km-rail-item .ico{font-size:16px;width:20px;text-align:center}"
    + ".km-rail-foot{margin-top:auto;padding:14px 18px 4px;border-top:1px solid var(--border,#26221d);"
    + "font-size:11px;color:var(--muted,#6f6553);line-height:1.8}"
    + ".km-rail-foot a{color:var(--text-dim,#a89c83)}.km-rail-foot a:hover{color:var(--accent,#ffa630)}"
    + "html.km-has-rail body{padding-left:232px}"
    + "#km-rail-toggle{display:none}"
    + "#km-rail-ov{display:none;position:fixed;inset:0;z-index:89;background:rgba(8,7,6,.55)}"
    // ── Mobil ──
    + "@media(max-width:880px){"
    + "html.km-has-rail body{padding-left:0}"
    + "#km-rail{transform:translateX(-100%);box-shadow:2px 0 24px rgba(0,0,0,.5)}"
    + "#km-rail.open{transform:none}"
    + "#km-rail-ov.show{display:block}"
    + "#km-rail-toggle{display:flex;position:fixed;left:10px;top:8px;z-index:95;"
    + "width:34px;height:34px;align-items:center;justify-content:center;border-radius:7px;"
    + "background:var(--bg-1,#14110e);border:1px solid var(--border,#26221d);color:var(--accent,#ffa630);"
    + "font-size:17px;cursor:pointer}"
    + "}";
  var style = document.createElement("style");
  style.id = "km-rail-style";
  style.textContent = css;
  document.head.appendChild(style);

  // ── DOM ────────────────────────────────────────────────────────
  var rail = document.createElement("nav");
  rail.id = "km-rail";
  rail.setAttribute("aria-label", "Site navigasyonu");

  var html = ""
    + '<a class="km-rail-brand" href="/" title="Ana sayfa">'
    + '<span class="km-rail-mark">K</span>'
    + '<span class="km-rail-name">KALIBRE<span class="sub">// MARKETS</span></span></a>'
    + '<div class="km-rail-label">▸ Modüller</div>';
  MODULES.forEach(function (m) {
    html += '<a class="km-rail-item' + (m.key === active ? " active" : "") + '" '
      + 'href="' + m.href + '">'
      + '<span class="ico">' + m.ico + "</span> " + m.label + "</a>";
  });
  html += '<div class="km-rail-foot">'
    + 'Piyasa verisi yayınlamayız.<br><a href="/egitim/">Eğitim kütüphanesi →</a></div>';
  rail.innerHTML = html;

  var ov = document.createElement("div");
  ov.id = "km-rail-ov";

  var toggle = document.createElement("button");
  toggle.id = "km-rail-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Menüyü aç/kapat");
  toggle.textContent = "☰";

  function setOpen(open) {
    rail.classList.toggle("open", open);
    ov.classList.toggle("show", open);
  }
  toggle.addEventListener("click", function () { setOpen(!rail.classList.contains("open")); });
  ov.addEventListener("click", function () { setOpen(false); });

  document.documentElement.classList.add("km-has-rail");
  document.body.appendChild(rail);
  document.body.appendChild(ov);
  document.body.appendChild(toggle);
})();
