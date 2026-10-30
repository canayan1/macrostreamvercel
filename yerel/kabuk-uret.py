# static/kabuk.js üretir: eski Türkçe sayfalara (eğitim, hesaplayıcılar, testler) ürün sitesinin
# üst menüsünü ve alt bilgisini koyan betik. Menü ve alt bilgi HTML'i sayfa-uret.py'deki ust() ve
# ALT ile aynı kaynaktan gelir; eski sayfalar static/site.css yüklemediği için stil #km-ust ve
# #km-alt altında kapsanmış olarak burada tutulur (değerler static/site.css ile aynı).
# Kullanım: python3 yerel/kabuk-uret.py
import json, os, re
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

ust_html = ust("", "tr", None)
ust_html = ust_html.split("</script>\n", 1)[1]  # satır içi js sınıfı betiği kabukta gerekmez; kabuk kendisi ekler
ust_html = ust_html.replace('<header class="ust">', '<header class="ust" id="km-ust">', 1)
alt_html = ALT.split('<script src="/static/menu.js"')[0].replace('<footer class="alt">', '<footer class="alt" id="km-alt">', 1)

CSS = r'''
#km-ust,#km-alt{--zemin:#0e1724;--zemin-2:#132033;--yuzey:#17263b;--cizgi:#24344c;--cizgi-2:#33465f;--metin:#e7ecf2;--soluk:#a3b0c2;--silik:#73839a;--yesil:#5fb89a;--kehribar:#d9a441;--odak:#8fc7ff;--panel:#111c2c;--kenar:clamp(16px,4vw,40px);--serif:"Source Serif 4",Georgia,serif;--sans:"IBM Plex Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;box-sizing:border-box}
#km-ust *,#km-alt *{box-sizing:border-box}
#km-ust{position:sticky;top:0;z-index:60;border-bottom:1px solid var(--cizgi);background:rgba(14,23,36,.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font:400 15px/1.5 var(--sans);color:var(--metin)}
#km-ust .kap{max-width:1180px;margin:0 auto;padding:0 var(--kenar);display:flex;align-items:center;gap:16px;min-height:64px;position:relative}
#km-ust a{color:inherit}
#km-ust .marka{display:flex;align-items:baseline;gap:8px;text-decoration:none;flex-shrink:0;color:var(--metin)}
#km-ust .marka b{font:600 22px/1 var(--serif);letter-spacing:-.01em}
#km-ust .marka span{font-size:13px;color:var(--silik)}
#km-ust .ana-menu{display:flex;align-items:center;gap:4px;margin-right:auto}
#km-ust summary,#km-ust .mduz{list-style:none;cursor:pointer;color:var(--soluk);text-decoration:none;white-space:nowrap;padding:8px 12px;border-radius:6px;display:inline-flex;align-items:center;gap:6px}
#km-ust summary::-webkit-details-marker{display:none}
#km-ust summary::after{content:"";width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg)}
#km-ust details[open]>summary::after{transform:translateY(1px) rotate(225deg)}
#km-ust summary:hover,#km-ust .mduz:hover,#km-ust details[open]>summary{color:var(--metin);background:var(--zemin-2)}
#km-ust .mega{position:absolute;top:calc(100% + 1px);left:var(--kenar);right:var(--kenar);background:var(--panel);border:1px solid var(--cizgi-2);border-radius:10px;box-shadow:0 24px 60px rgba(3,8,16,.55);padding:22px}
#km-ust .mgrup-dar{position:relative}
#km-ust .mgrup-dar .mega-dar{left:0;right:auto;top:calc(100% + 13px);width:400px}
#km-ust .mega-izgara{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 18px}
#km-ust .mbas{font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--silik);margin:4px 10px 10px}
#km-ust .mitem{display:block;text-decoration:none;padding:10px;border-radius:8px}
#km-ust .mitem:hover{background:var(--yuzey)}
#km-ust .mitem b{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;font-weight:600;font-size:15px;color:var(--metin)}
#km-ust .mitem small{display:block;color:var(--soluk);font-size:13.5px;line-height:1.45;margin-top:3px}
#km-ust .mega-liste{display:grid;gap:2px}
#km-ust .mega-alt{margin:16px 10px 0;padding-top:14px;border-top:1px solid var(--cizgi);font-size:13.5px;color:var(--silik)}
#km-ust .mega-alt a{color:var(--soluk)}
#km-ust .durum{font:500 10.5px/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;padding:4px 6px;border-radius:4px;white-space:nowrap}
#km-ust .durum-beta{color:var(--yesil);border:1px solid rgba(95,184,154,.55)}
#km-ust .durum-test{color:var(--kehribar);border:1px solid rgba(217,164,65,.55)}
#km-ust .durum-gelis{color:var(--odak);border:1px solid rgba(143,199,255,.5)}
#km-ust .durum-plan{color:var(--silik);border:1px solid var(--cizgi-2)}
#km-ust .dugme{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border-radius:6px;border:1px solid var(--yesil);background:var(--yesil);color:#08130f;font:600 14px/1 var(--sans);text-decoration:none;white-space:nowrap;flex-shrink:0}
#km-ust .dugme:hover{background:#74c8ab}
#km-ust .dugme.ikincil{background:transparent;color:var(--metin);border-color:var(--cizgi-2)}
#km-ust .dugme.ikincil:hover{border-color:var(--soluk)}
#km-ust .menu-ac{display:none;min-height:36px;padding:0 12px;border-radius:6px;border:1px solid var(--cizgi-2);background:transparent;color:var(--metin);font:600 14px var(--sans);cursor:pointer}
#km-ust :focus-visible,#km-alt :focus-visible{outline:2px solid var(--odak);outline-offset:3px}
@media(min-width:1081px) and (max-width:1200px){#km-ust .kap{gap:14px}#km-ust summary,#km-ust .mduz{padding:8px 9px;font-size:14px}}
@media(max-width:1080px){#km-ust .kap{gap:8px 14px;padding-top:10px;padding-bottom:10px}#km-ust .menu-ac{display:inline-flex;align-items:center;margin-left:auto}
#km-ust .ana-menu{display:none;position:absolute;top:100%;left:0;right:0;overflow-y:auto;max-height:calc(100vh - 64px);flex-direction:column;align-items:stretch;gap:0;padding:8px var(--kenar) 24px;background:var(--panel);border-bottom:1px solid var(--cizgi-2);margin:0}
#km-ust.acik .ana-menu{display:flex}
#km-ust summary,#km-ust .mduz{display:flex;padding:14px 4px;border-radius:0;border-bottom:1px solid var(--cizgi);justify-content:space-between;font-size:16px}
#km-ust summary:hover,#km-ust details[open]>summary{background:transparent}
#km-ust .mega,#km-ust .mgrup-dar .mega-dar{position:static;width:auto;border:0;box-shadow:none;padding:6px 0 12px;background:transparent}
#km-ust .mega-izgara{grid-template-columns:1fr 1fr}}
#km-ust .menu-eylem{display:none}
@media(max-width:1320px){#km-ust .kh-d.pasif{display:none}}
@media(max-width:1080px){#km-ust .dugme.baglan{display:none}}
@media(max-width:640px){#km-ust .mega-izgara{grid-template-columns:1fr}#km-ust .kap>.dugme:not(.ikincil){display:none}#km-ust .kh-d.pasif{display:none}#km-ust .menu-eylem{display:grid;gap:10px;padding-top:18px}}
@media(max-width:400px){#km-ust .marka span{display:none}}
#km-alt{border-top:1px solid var(--cizgi);padding:48px 0 56px;margin-top:64px;color:var(--silik);font:400 14px/1.6 var(--sans);background:var(--zemin)}
#km-alt .kap{max-width:1180px;margin:0 auto;padding:0 var(--kenar);display:grid;grid-template-columns:1.6fr repeat(4,1fr);gap:32px}
#km-alt h4{font:600 14px/1.4 var(--sans);color:var(--soluk);margin:0 0 10px}
#km-alt a{display:block;text-decoration:none;padding:3px 0;color:var(--silik)}
#km-alt a:hover{color:var(--metin)}
#km-alt p{margin:0 0 8px}
#km-alt .yasal{grid-column:1/-1;border-top:1px solid var(--cizgi);padding-top:20px;max-width:90ch}
@media(max-width:960px){#km-alt .kap{grid-template-columns:1fr 1fr}#km-alt .kap>:first-child{grid-column:1/-1}}
.cmdbar,footer.pf,.pf-foot,body>footer:not(#km-alt){display:none!important}
'''.strip()
assert "—" not in ust_html + alt_html + CSS

js = f'''/* Kalibre Markets: eski Türkçe sayfaların ortak kabuğu. ÜRETİLMİŞ DOSYA: yerel/kabuk-uret.py
 *
 * Eğitim yazıları, hesaplayıcılar, testler kendi biçimleriyle yazılmış eski sayfalardır. Bu betik
 * onlara ürün sitesinin üst menüsünü (Ürünler / Çözümler panelleri) ve alt bilgisini koyar, eski
 * komut çubuğunu ve alt bilgiyi gizler. Menü davranışı static/menu.js.
 *
 * Kullanım: </body>'den önce <script src="/static/kabuk.js" defer></script>
 */
(function () {{
  'use strict';
  if (document.getElementById('km-ust')) return;
  var yol = location.pathname.replace(/index\\.html$/, '').replace(/(.)\\/$/, '$1');

  var stil = document.createElement('style');
  stil.id = 'km-kabuk-stil';
  stil.textContent = {json.dumps(CSS, ensure_ascii=False)};
  document.head.appendChild(stil);

  if (!document.querySelector('link[href*="IBM+Plex+Sans"]')) {{
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap';
    document.head.appendChild(f);
  }}

  var kap = document.createElement('div');
  kap.innerHTML = {json.dumps(ust_html, ensure_ascii=False)};
  var ust = kap.firstElementChild;
  // Etkin bağlantı: yolla eşleşen bağlantılar işaretlenir (sorgu ve çapa karşılaştırmaya girmez).
  [].forEach.call(ust.querySelectorAll('a[href^="/"]'), function (a) {{
    var h = a.getAttribute('href').split(/[?#]/)[0];
    if (h === yol) a.setAttribute('aria-current', 'page');
  }});
  document.body.insertBefore(ust, document.body.firstChild);

  var kap2 = document.createElement('div');
  kap2.innerHTML = {json.dumps(alt_html.strip(), ensure_ascii=False)};
  document.body.appendChild(kap2.firstElementChild);

  // Menü davranışı (dar ekran çekmecesi, tek açık panel, Esc).
  if (!document.querySelector('script[src="/static/menu.js"]')) {{
    var mj = document.createElement('script');
    mj.src = '/static/menu.js';
    document.body.appendChild(mj);
  }}
  // Hesap menüsü (static/kalibre-auth.js) başlığa kendini yerleştirir; sayfa kendi eklemediyse.
  if (!document.querySelector('script[src="/static/kalibre-auth.js"]')) {{
    var ha = document.createElement('script');
    ha.src = '/static/kalibre-auth.js';
    document.body.appendChild(ha);
  }}
  // Kapalı beta bandı (static/beta.js); sayfa kendi eklemediyse.
  if (!document.querySelector('script[src="/static/beta.js"]')) {{
    var bt = document.createElement('script');
    bt.src = '/static/beta.js';
    bt.defer = true;
    document.body.appendChild(bt);
  }}
}})();
'''
open(os.path.join(KOK, "static/kabuk.js"), "w").write(js)
print("yazıldı static/kabuk.js", len(js))
