/* Kalibre — çerez rızası.
 *
 * Google Analytics yalnızca ziyaretçi "Kabul et" derse yüklenir. Önceki bant
 * yalnızca bilgilendiriyordu ("Anladım") ve GA rıza beklemeden yükleniyordu;
 * KVKK çerez rehberine göre analitik çerezler açık rıza gerektirir ve
 * bilgilendirme düğmesi rıza sayılmaz. Reddetmek, kabul etmek kadar kolay
 * olmalıdır: iki düğme aynı görünürlüktedir.
 *
 * Tercih tarayıcıda saklanır. window.kmCerezTercihi() bandı yeniden açar
 * ([data-cerez-ayar] taşıyan bağlantı ve düğmeler de bandı açar: alt bilgi, /cookies, /privacy).
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
    'background:#132033;border:1px solid #24344c;border-radius:12px;padding:14px 16px;' +
    'box-shadow:0 8px 28px rgba(0,0,0,.45);color:#a3b0c2;font-size:12.5px;line-height:1.55;' +
    "font-family:'IBM Plex Sans',ui-sans-serif,system-ui,-apple-system,sans-serif}" +
    '#km-cerez p{margin:0 0 12px}' +
    '#km-cerez a{color:#5fb89a;text-decoration:none;border-bottom:1px solid rgba(95,184,154,.4)}' +
    '#km-cerez .km-btns{display:flex;gap:8px}' +
    '#km-cerez button{flex:1;padding:9px 12px;font-weight:700;font-size:11px;line-height:1;' +
    'cursor:pointer;border-radius:6px;font-family:inherit}' +
    '#km-cerez .km-kabul{background:#5fb89a;color:#08130f;border:1px solid #5fb89a}' +
    '#km-cerez .km-red{background:transparent;color:#e7ecf2;border:1px solid #8d9cb0}' +
    '#km-cerez button:focus-visible{outline:2px solid #5fb89a;outline-offset:2px}' +
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
    var en = document.documentElement.lang === 'en';
    d.setAttribute('aria-label', en ? 'Cookie preference' : 'Çerez tercihi');
    d.innerHTML = en
      ? '<p>We use Google Analytics cookies for visit statistics only if you allow them. If you do, ' +
        'your usage data is sent to Google, including to servers in the United States. Details in the ' +
        '<a href="/cookies">Cookie Notice</a>.</p>' +
        '<div class="km-btns">' +
        '<button type="button" class="km-red">Decline</button>' +
        '<button type="button" class="km-kabul">Accept</button>' +
        '</div>'
      : '<p>Ziyaret istatistikleri için Google Analytics çerezlerini yalnızca izin verirseniz ' +
        'kullanırız. İzin verirseniz kullanım verileriniz Google\'ın yurt dışındaki sunucularına ' +
        'aktarılır. Ayrıntılar <a href="/tr/cookies">Çerez Bildirimi</a>\'nde.</p>' +
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

  // Alt bilgideki "Cookie settings / Çerez ayarları" bağlantısı ve yasal sayfalardaki düğme
  // (data-cerez-ayar) bandı yeniden açar. Betik yüklenmezse bağlantı çerez bildirimine gider.
  document.addEventListener('click', function (e) {
    var h = e.target && e.target.closest && e.target.closest('[data-cerez-ayar]');
    if (!h) return;
    e.preventDefault();
    var eski = document.getElementById('km-cerez');
    if (eski) eski.remove();
    bant();
  });

  var r = oku();
  if (r === 'kabul') gaYukle();
  else if (r !== 'red') bantAc();
})();
