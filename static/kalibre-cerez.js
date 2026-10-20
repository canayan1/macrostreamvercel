/* Kalibre — çerez rızası.
 *
 * Google Analytics yalnızca ziyaretçi "Kabul et" derse yüklenir. Önceki bant
 * yalnızca bilgilendiriyordu ("Anladım") ve GA rıza beklemeden yükleniyordu;
 * KVKK çerez rehberine göre analitik çerezler açık rıza gerektirir ve
 * bilgilendirme düğmesi rıza sayılmaz. Reddetmek, kabul etmek kadar kolay
 * olmalıdır: iki düğme aynı görünürlüktedir.
 *
 * Tercih tarayıcıda saklanır. window.kmCerezTercihi() bandı yeniden açar
 * (Gizlilik Politikası'ndaki "Çerez tercihlerini değiştir" düğmesi bunu çağırır).
 *
 * Kullanım: <head> içine <script src="/static/kalibre-cerez.js"></script>
 */
(function () {
  'use strict';

  var KEY = 'kalibre-cerez-rizasi'; // 'kabul' | 'red'
  var GA_ID = 'G-P6FEDBJG6N';

  // Eski bilgilendirme bandı rıza mekanizması değildi; artık gösterilmesin.
  try { localStorage.setItem('kalibre-cookie-notice-ack', '1'); } catch (e) {}

  function oku() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function yaz(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function gaYukle() {
    if (window.__kmGA) return;
    window.__kmGA = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  // Rıza geri çekildiğinde GA çerezlerini sil (_ga, _ga_<ID>).
  function gaCerezleriniSil() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var ad = c.split('=')[0].trim();
      if (ad === '_ga' || ad.indexOf('_ga_') === 0) {
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = ad + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      }
    });
  }

  var CSS =
    // Asistan balonu (.kchat-fab, sağ altta 44px, z-index 99998) düğmeleri örtmesin:
    // bant balonun üstünde durur ve katmanı ondan yüksektir.
    '#km-cerez{position:fixed;bottom:76px;right:14px;max-width:380px;z-index:100000;' +
    'background:#14110e;border:1px solid #2a241d;border-radius:12px;padding:14px 16px;' +
    'box-shadow:0 8px 28px rgba(0,0,0,.45);color:#a8a098;font-size:12.5px;line-height:1.55;' +
    "font-family:'Inter Tight',Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}" +
    '#km-cerez p{margin:0 0 12px}' +
    '#km-cerez a{color:#ffa630;text-decoration:none;border-bottom:1px solid rgba(255,166,48,.4)}' +
    '#km-cerez .km-btns{display:flex;gap:8px}' +
    '#km-cerez button{flex:1;padding:9px 12px;font-weight:700;font-size:11px;line-height:1;' +
    'letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:6px;font-family:inherit}' +
    '#km-cerez .km-kabul{background:#ffa630;color:#0a0a0a;border:1px solid #ffa630}' +
    '#km-cerez .km-red{background:transparent;color:#e8e2d8;border:1px solid #6f6553}' +
    '#km-cerez button:focus-visible{outline:2px solid #ffa630;outline-offset:2px}' +
    '@media (max-width:480px){#km-cerez{left:12px;right:12px;max-width:none}}';

  function bant() {
    if (document.getElementById('km-cerez')) return;
    if (!document.getElementById('km-cerez-css')) {
      var st = document.createElement('style');
      st.id = 'km-cerez-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var d = document.createElement('div');
    d.id = 'km-cerez';
    d.setAttribute('role', 'region');
    d.setAttribute('aria-label', 'Çerez tercihi');
    d.innerHTML =
      '<p>Ziyaret istatistikleri için Google Analytics çerezlerini yalnızca izin verirseniz ' +
      'kullanırız. İzin verirseniz kullanım verileriniz Google\'ın yurt dışındaki sunucularına ' +
      'aktarılır. Ayrıntılar <a href="/gizlilik/">Gizlilik Politikası</a>\'nda.</p>' +
      '<div class="km-btns">' +
      '<button type="button" class="km-red">Reddet</button>' +
      '<button type="button" class="km-kabul">Kabul et</button>' +
      '</div>';
    document.body.appendChild(d);
    d.querySelector('.km-kabul').onclick = function () { yaz('kabul'); d.remove(); gaYukle(); };
    d.querySelector('.km-red').onclick = function () { yaz('red'); d.remove(); gaCerezleriniSil(); };
  }

  function bantAc() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bant);
    else bant();
  }

  window.kmCerezTercihi = bantAc;

  var r = oku();
  if (r === 'kabul') gaYukle();
  else if (r !== 'red') bantAc();
})();
