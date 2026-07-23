// Hisse sayfası "Son Haberler" bloğu.
// Kullanım: <div id="hisse-haberler" data-sym="ASELS"></div> + bu script (defer).
// Sembol verilmezse URL'den çıkarır: /karne/ASELS/ veya /algo/hisse/ASELS/.
(function () {
  var el = document.getElementById('hisse-haberler');
  if (!el) return;
  var sym = el.getAttribute('data-sym') || '';
  if (!sym) {
    var m = location.pathname.match(/\/(?:karne|algo\/hisse)\/([A-Z]+)\/?/);
    if (m) sym = m[1];
  }
  if (!sym) return;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rel(ts) {
    var d = Math.round((Date.now() - ts) / 60000); // dk
    if (d < 60) return d + ' dk önce';
    if (d < 1440) return Math.round(d / 60) + ' sa önce';
    return Math.round(d / 1440) + ' gün önce';
  }
  var DOT = { pozitif: '#4ade80', negatif: '#ef4444', 'nötr': '#a89c83' };

  fetch('/api/watchlist-news?sym=' + encodeURIComponent(sym))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var items = (d && d.items) || [];
      if (!items.length) return; // haber yoksa blok hiç görünmesin
      var rows = items.slice(0, 5).map(function (it) {
        var dot = it.sentiment
          ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' +
            (DOT[it.sentiment] || DOT['nötr']) + ';margin-right:7px;vertical-align:1px" title="' + esc(it.sentiment) + '"></span>'
          : '';
        var meta = [esc(it.source || ''), rel(it.ts)].filter(Boolean).join(' · ');
        var sum = it.summary
          ? '<div style="font-size:12px;color:var(--text-dim);margin-top:3px;line-height:1.55">' + esc(it.summary) + '</div>'
          : '';
        return (
          '<li style="padding:10px 0;border-bottom:1px dashed var(--border)">' +
          '<a href="' + esc(it.link) + '" target="_blank" rel="noopener nofollow" ' +
          'style="color:var(--text);font-weight:500;font-size:13px;line-height:1.5;text-decoration:none">' +
          dot + esc(it.title) + '</a>' +
          '<div style="font-size:10.5px;color:var(--muted);margin-top:3px">' + meta + '</div>' + sum + '</li>'
        );
      }).join('');
      el.innerHTML =
        '<div class="card" style="margin-top:16px">' +
        '<h3 style="margin-top:0">Son Haberler</h3>' +
        '<ul style="list-style:none;padding:0;margin:0">' + rows + '</ul>' +
        '<div style="font-size:10px;color:var(--muted);margin-top:10px">' +
        'Kaynak: yayıncı siteleri (Google News üzerinden, başlık + bağlantı). Özetler yapay zeka ile üretilir; yatırım tavsiyesi değildir.' +
        '</div></div>';
    })
    .catch(function () { /* sessiz — blok görünmez */ });
})();
