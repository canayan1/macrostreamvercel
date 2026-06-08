/* Kalibre Markets — kalıcı terminal sol barı (paylaşılan kabuk).
 * İç sayfalara (rapor, strateji, eğitim vb.) terminalin sol navigasyon barını
 * runtime'da enjekte eder ki kullanıcı "terminalden çıktım" hissetmesin.
 * Terminalin kendisi (nav.panel zaten var) ve anasayfa atlanır.
 */
(function () {
  "use strict";

  // ── Atlama koşulları ───────────────────────────────────────────
  var path = location.pathname.replace(/\/index\.html$/, "/");
  if (path === "" ) path = "/";
  // Anasayfa: terminal kabuğu istemiyoruz (pazarlama landing)
  if (path === "/") return;
  // Zaten kendi sol barı olan sayfalar (terminal, makro-raporu)
  if (document.querySelector("nav.panel")) return;
  // Çift enjeksiyon koruması
  if (document.getElementById("km-rail")) return;

  // ── Modüller (terminale deep-link) ─────────────────────────────
  var MODULES = [
    { key: "piyasalar", ico: "📡", label: "Piyasalar" },
    { key: "panom",     ico: "📌", label: "Panom" },
    { key: "karar",     ico: "🧠", label: "Karar Destek", star: true },
    { key: "strateji",  ico: "🔬", label: "Strateji", star: true },
    { key: "veri",      ico: "📊", label: "Günlük Veri" },
    { key: "arastirma", ico: "🔍", label: "Araştırma" },
    { key: "egitim",    ico: "🎓", label: "Eğitim" }
  ];

  // ── Aktif modülü mevcut yola göre tahmin et ────────────────────
  function activeKey(p) {
    if (/^\/algo(\/|$)/.test(p)) return "strateji";
    if (/^\/reports\/(hisse|fx|pulse|tcmb|sektor)(\/|$)/.test(p)) return "veri";
    if (/^\/reports\/(makro|fred|wb)(\/|$)/.test(p)) return "arastirma";
    if (/^\/(banka-raporu|haftanin-grafikleri|haftanin-haberleri|makro-raporu|arastirma)(\/|$)/.test(p)) return "arastirma";
    if (/^\/(trading|islem-kontrolu|simulasyon)(\/|$)/.test(p)) return "karar";
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
    + ".km-rail-brand{display:flex;align-items:center;gap:10px;padding:4px 18px 14px;"
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
    + ".km-rail-item .star{margin-left:auto;color:var(--accent,#ffa630);font-size:10px;opacity:.8}"
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
    + "}"
    + ".km-pin-cta{margin:2px 14px 12px;padding:11px 13px;border-radius:8px;display:flex;align-items:center;gap:9px;cursor:pointer;font-size:13px;font-weight:700;letter-spacing:.01em;color:#1a1a1a;background:linear-gradient(135deg,var(--accent,#ffa630),var(--accent-hot,#ff7a00));transition:filter .12s}"
    + ".km-pin-cta .ico{font-size:15px}"
    + ".km-pin-cta:hover{filter:brightness(1.06)}"
    + ".km-pin-cta.on{background:transparent;color:var(--accent,#ffa630);border:1px solid var(--accent,#ffa630)}";
  var style = document.createElement("style");
  style.id = "km-rail-style";
  style.textContent = css;
  document.head.appendChild(style);

  // ── DOM ────────────────────────────────────────────────────────
  var rail = document.createElement("nav");
  rail.id = "km-rail";
  rail.setAttribute("aria-label", "Terminal navigasyonu");

  var html = ""
    + '<a class="km-rail-brand" href="/terminal/" title="Terminale dön">'
    + '<span class="km-rail-mark">K</span>'
    + '<span class="km-rail-name">KALIBRE<span class="sub">// TERMINAL</span></span></a>'
    + '<div class="km-rail-label">▸ Modüller</div>';
  MODULES.forEach(function (m) {
    html += '<a class="km-rail-item' + (m.key === active ? " active" : "") + '" '
      + 'href="/terminal/#' + m.key + '">'
      + '<span class="ico">' + m.ico + "</span> " + m.label
      + (m.star ? ' <span class="star">★</span>' : "") + "</a>";
  });
  html += '<div class="km-rail-foot">'
    + '<a href="/terminal/akis/">Tüm bültenler akışı →</a><br>'
    + '<a href="/arsiv.html">Arşiv →</a></div>';
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

  // ── "Launchpad'e ekle" — bu sayfayı kişisel panoya sabitle ──────
  (function () {
    if (!active) return; // yalnızca içerik (rapor/strateji/araştırma/eğitim) sayfaları
    var PKEY = "km-pins-v1", MAXP = 24, url = path;
    function read() { try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch (e) { return []; } }
    function write(a) { try { localStorage.setItem(PKEY, JSON.stringify(a.slice(0, MAXP))); } catch (e) {} }
    function pinned() { return read().some(function (x) { return x.u === url; }); }

    var h1 = document.querySelector("main h1, h1");
    var title = ((h1 && h1.textContent) || document.title || url)
      .replace(/\s*[·|]\s*Kalibre Markets.*$/i, "")
      .replace(/\s*—\s*Kalibre Markets.*$/i, "")
      .replace(/\s+/g, " ").trim().slice(0, 90);
    var meta = document.querySelector('meta[name="description"]');
    var summary = ((meta && meta.content) || "").trim();
    if (!summary) { var p = document.querySelector("main p, .card p, p"); summary = (p && p.textContent) || ""; }
    summary = summary.replace(/\s+/g, " ").trim().slice(0, 150);
    var CATL = { strateji: "Strateji", veri: "Günlük Veri", arastirma: "Araştırma", egitim: "Eğitim", karar: "Araç" };
    var cat = CATL[active] || "Rapor";

    var btn = document.createElement("div");
    btn.id = "km-pin-btn";
    function render() {
      var on = pinned();
      btn.className = "km-pin-cta" + (on ? " on" : "");
      btn.innerHTML = '<span class="ico">' + (on ? "✓" : "📌") + "</span> " +
        (on ? "Panonda · kaldır" : "Bu sayfayı panona ekle");
    }
    function toast(msg) {
      var el = document.getElementById("km-toast");
      if (!el) {
        el = document.createElement("div"); el.id = "km-toast";
        el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:200;" +
          "background:var(--surface-2,#221d18);color:var(--text,#ebe3d3);border:1px solid var(--accent,#ffa630);" +
          "padding:9px 16px;border-radius:8px;font-size:12.5px;box-shadow:0 8px 24px rgba(0,0,0,.4);" +
          "opacity:0;transition:opacity .2s;pointer-events:none";
        document.body.appendChild(el);
      }
      el.textContent = msg; el.style.opacity = "1";
      clearTimeout(el._t); el._t = setTimeout(function () { el.style.opacity = "0"; }, 1900);
    }
    btn.addEventListener("click", function () {
      var a = read();
      if (pinned()) { write(a.filter(function (x) { return x.u !== url; })); render(); toast("Panodan kaldırıldı"); }
      else { a.unshift({ t: title, u: url, s: summary, c: cat, ts: Date.now() }); write(a); render(); toast("Panonuza eklendi ✓"); }
    });

    var modLabel = rail.querySelector(".km-rail-label");
    if (modLabel) rail.insertBefore(btn, modLabel); else rail.appendChild(btn);
    render();
  })();
})();
