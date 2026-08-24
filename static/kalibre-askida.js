/* Kalibre — BIST verisine dayanan araçlar için askı bildirimi.
 *
 * Borsa İstanbul'un 24 Ağustos 2026 tarihli bildirimi üzerine BIST verisi
 * yayından kaldırıldı. Bu araçlar veri olmadan çalışamıyor; sayfayı boş ya da
 * kırık bırakmak yerine ne olduğunu açıkça anlatıyoruz.
 *
 * Kullanım: sayfanın içerik kabına <script src="/static/kalibre-askida.js"></script>
 * eklenir; betik ana içeriği bildirimle değiştirir.
 */
(function () {
  'use strict';

  var css =
    '.kaskida{max-width:640px;margin:34px auto;background:#14110e;border:1px solid #2a241d;' +
    'border-left:3px solid #ffa630;border-radius:0 14px 14px 0;padding:26px 28px;' +
    "font-family:'Inter Tight',Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#e8e2d8}" +
    '.kaskida h2{margin:0 0 12px;font-size:20px;font-weight:600;letter-spacing:-.01em}' +
    '.kaskida p{margin:0 0 13px;font-size:14.5px;line-height:1.65;color:#b8ae9e}' +
    '.kaskida a{color:#ffa630;text-decoration:none}' +
    '.kaskida a:hover{text-decoration:underline}' +
    '.kaskida .tar{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;' +
    'letter-spacing:.16em;text-transform:uppercase;color:#6f6553;margin-bottom:10px}' +
    '.kaskida ul{margin:0 0 13px;padding-left:20px;color:#b8ae9e;font-size:14px;line-height:1.6}' +
    '.kaskida li{margin-bottom:5px}';

  function bildirim() {
    var d = document.createElement('div');
    d.className = 'kaskida';
    d.innerHTML =
      '<div class="tar">▸ Askıya alındı · 24 Ağustos 2026</div>' +
      '<h2>Bu araç şu an kullanılamıyor</h2>' +
      '<p>Borsa İstanbul, BIST verilerinin yayınlanmasının veri dağıtım sözleşmesine ' +
      'tabi olduğunu bildirdi. Gerekli yetkiye sahip olmadığımız için BIST verisini ' +
      'yayından kaldırdık. Bu araç o veriyle çalıştığından şimdilik kapalı.</p>' +
      '<p>Kendi tarayıcına kaydettiğin portföy, not ve listeler <b style="color:#e8e2d8">silinmedi</b>; ' +
      'cihazında duruyor. Araç geri açıldığında yerlerinde olacaklar.</p>' +
      '<p>Bu arada BIST verisi gerektirmeyen bölümler çalışmaya devam ediyor:</p>' +
      '<ul>' +
        '<li><a href="/reports/tcmb/">TCMB analitik bilanço</a> ve <a href="/reports/fx/">döviz bültenleri</a></li>' +
        '<li><a href="/reports/metals/">altın ve gümüş</a>, <a href="/reports/makro/">TR makro</a></li>' +
        '<li><a href="/egitim/">eğitim kütüphanesi</a> ve <a href="/trading/onyargi-testi/">yatırımcı önyargı testi</a></li>' +
      '</ul>' +
      '<p style="font-size:13px;color:#6f6553">Soru ve öneri: ' +
      '<a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a></p>';
    return d;
  }

  function calis() {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);

    var kap = document.querySelector('.wrap') || document.body;
    // Başlık bloğu dışındaki her şeyi kaldır, yerine bildirimi koy
    [].slice.call(kap.children).forEach(function (el) {
      if (el.tagName === 'H1' || el.classList.contains('eyebrow')) return;
      el.parentNode.removeChild(el);
    });
    kap.appendChild(bildirim());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', calis);
  else calis();
})();
