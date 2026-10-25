/* Kalibre: iç sayfaların ortak kabuğu.
 *
 * Eğitim yazıları, hesaplayıcılar, testler ve yasal sayfalar kendi biçimleriyle yazılmış eski
 * sayfalardır. Bu betik onlara ürün sitesinin üst menüsünü ve alt bilgisini koyar, eski komut
 * çubuğunu ve alt bilgiyi gizler. Renkler ve yazı tipleri sayfaların kendi :root tanımlarında
 * yeni palete çevrilmiştir (static/site.css ile aynı değerler).
 *
 * Kullanım: </body>'den önce <script src="/static/kabuk.js" defer></script>
 */
(function () {
  'use strict';
  if (document.getElementById('km-ust')) return;

  var yol = location.pathname.replace(/index\.html$/, '');
  var MENU = [['/lab/', 'Laboratuvar'], ['/lab/panom.html', 'Panom'], ['/prop/', 'Prop kalkanı'], ['/kurulum/', 'Kurulum'], ['/guvenlik/', 'Güvenlik'], ['/egitim/', 'Eğitim'], ['/pro/', 'Abonelik']];

  var css = ''
    + '#km-ust{position:sticky;top:0;z-index:60;border-bottom:1px solid #24344c;background:rgba(14,23,36,.94);'
    + '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font:400 15px/1.5 "IBM Plex Sans",system-ui,sans-serif}'
    + '#km-ust .k{max-width:1180px;margin:0 auto;padding:0 clamp(16px,4vw,40px);display:flex;align-items:center;gap:28px;min-height:64px}'
    + '#km-ust .m{display:flex;align-items:baseline;gap:10px;text-decoration:none;color:#e7ecf2}'
    + '#km-ust .m b{font:600 22px/1 "Source Serif 4",Georgia,serif;letter-spacing:-.01em}'
    + '#km-ust .m span{font-size:13px;color:#73839a}'
    + '#km-ust nav{display:flex;gap:22px;margin-left:auto}'
    + '#km-ust nav a{text-decoration:none;color:#a3b0c2;padding:6px 0}'
    + '#km-ust nav a:hover,#km-ust nav a[aria-current]{color:#e7ecf2}'
    + '#km-ust nav a[aria-current]{box-shadow:inset 0 -2px 0 #5fb89a}'
    + '#km-ust .d{display:inline-flex;align-items:center;min-height:36px;padding:0 14px;border-radius:6px;background:#5fb89a;'
    + 'color:#08130f;font-weight:600;font-size:14px;text-decoration:none}'
    + '#km-ust .d:hover{background:#74c8ab}'
    + '#km-ust .d.ikincil{background:transparent;color:#e7ecf2;border:1px solid #33465f;margin-left:4px}'
    + '#km-ust .d.ikincil:hover{border-color:#a3b0c2;background:transparent}'
    + '#km-ust .d.ikincil + .d{margin-left:-16px}'
    + '#km-ust a:focus-visible,#km-alt a:focus-visible{outline:2px solid #8fc7ff;outline-offset:3px}'
    + '@media(max-width:860px){#km-ust .k{flex-wrap:wrap;gap:6px 18px;padding-top:10px;padding-bottom:10px}'
    + '#km-ust nav{order:3;width:100%;margin:0;overflow-x:auto;gap:18px;font-size:14px;scrollbar-width:none}#km-ust .d{margin-left:auto}#km-ust .d.ikincil{margin-left:auto}#km-ust .d.ikincil + .d{margin-left:0}}'
    + '@media(max-width:560px){#km-ust .d:not(.ikincil){display:none}}'
    + '#km-alt{border-top:1px solid #24344c;padding:48px 0 56px;margin-top:64px;color:#73839a;font:400 14px/1.6 "IBM Plex Sans",system-ui,sans-serif;background:#0e1724}'
    + '#km-alt .k{max-width:1180px;margin:0 auto;padding:0 clamp(16px,4vw,40px);display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px}'
    + '#km-alt h4{font:600 14px/1.4 "IBM Plex Sans",sans-serif;color:#a3b0c2;margin:0 0 10px}'
    + '#km-alt a{display:block;text-decoration:none;padding:3px 0;color:#73839a}#km-alt a:hover{color:#e7ecf2}'
    + '#km-alt p{margin:0 0 8px}#km-alt .y{grid-column:1/-1;border-top:1px solid #24344c;padding-top:20px;max-width:90ch}'
    + '@media(max-width:760px){#km-alt .k{grid-template-columns:1fr 1fr}#km-alt .k>:first-child{grid-column:1/-1}}'
    // Eski kabuk parçaları: komut çubuğu ve sayfaların kendi alt bilgileri.
    + '.cmdbar,footer.pf,.pf-foot,body>footer:not(#km-alt){display:none!important}';

  var stil = document.createElement('style');
  stil.id = 'km-kabuk-stil';
  stil.textContent = css;
  document.head.appendChild(stil);

  if (!document.querySelector('link[href*="IBM+Plex+Sans"]')) {
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap';
    document.head.appendChild(f);
  }

  var ust = document.createElement('header');
  ust.id = 'km-ust';
  ust.innerHTML = '<div class="k"><a class="m" href="/"><b>Kalibre</b><span>Lab</span></a><nav aria-label="Ana menü">'
    + MENU.map(function (m) {
      return '<a href="' + m[0] + '"' + (yol.indexOf(m[0]) === 0 ? ' aria-current="page"' : '') + '>' + m[1] + '</a>';
    }).join('')
    + '</nav><a class="d ikincil" href="/baglan">MetaTrader\'ı bağla</a><a class="d" href="/lab/">Laboratuvarı aç</a></div>';
  document.body.insertBefore(ust, document.body.firstChild);

  var alt = document.createElement('footer');
  alt.id = 'km-alt';
  alt.innerHTML = '<div class="k">'
    + '<div><p><b style="font:600 18px \'Source Serif 4\',Georgia,serif;color:#e7ecf2">Kalibre</b></p><p>MetaTrader 5 için strateji laboratuvarı.</p></div>'
    + '<div><h4>Ürün</h4><a href="/lab/">Laboratuvar</a><a href="/lab/panom.html">Panom</a><a href="/prop/">Prop kalkanı</a><a href="/forex/">Bireysel forex</a><a href="/kurulum/">Kurulum</a><a href="/guvenlik/">Güvenlik</a><a href="/pro/">Abonelik</a></div>'
    + '<div><h4>Öğren</h4><a href="/egitim/">Eğitim</a><a href="/metodoloji/">Metodoloji</a><a href="/grafik-oku/">Grafik okuma testi</a><a href="/trading/onyargi-testi/">Önyargı testi</a></div>'
    + '<div><h4>Kalibre</h4><a href="/hakkinda">Hakkında</a><a href="/iletisim/">İletişim</a><a href="/kullanim-sartlari/">Kullanım şartları</a><a href="/gizlilik/">Gizlilik</a></div>'
    + '<p class="y">Kalibre Lab bir yazılım aracıdır; yatırım danışmanlığı ya da aracılık hizmeti sunmaz. Bu sayfadaki içerik eğitim amaçlıdır ve yatırım tavsiyesi değildir.</p>'
    + '</div>';
  document.body.appendChild(alt);

  // Kapalı beta bandı (static/beta.js); sayfa kendi eklemediyse.
  if (!document.querySelector('script[src="/static/beta.js"]')) {
    var bt = document.createElement('script');
    bt.src = '/static/beta.js';
    bt.defer = true;
    document.body.appendChild(bt);
  }
})();
