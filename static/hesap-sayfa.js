/* Hesap sayfası (/hesap, /en/license): profil, lisanslar, bu cihazdaki bağlantılar,
 * kayıtlı stratejiler ve hesabı silme. Veriler: Supabase (profil, stratejiler) ve
 * /api/hesap (lisanslar; tam anahtar yalnız sahibine). */
(function () {
  'use strict';
  var A = window.KalibreAuth;
  if (!A) return;
  var EN = A.lang === 'en';
  var $ = function (id) { return document.getElementById(id); };
  var LISANS_ANAHTARI = 'kalibre-lisans-anahtari'; // laboratuvarın kurulum ekranı bu anahtarı okur
  var URUN_ADI = { lab: 'Kalibre Lab' }; // yeni ürünler buraya eklenir
  var LAB = A.paths.lab, PRO = A.paths.pricing, BAGLAN = A.paths.connect;
  var M = EN ? {
    durum: { active: 'Active', trialing: 'Trial', past_due: 'Payment due', canceled: 'Cancelled', unpaid: 'Unpaid', incomplete: 'Incomplete', incomplete_expired: 'Expired' },
    tarih: 'en-GB', validUntil: 'Valid until', endedOn: 'Ended on', mt5: 'MT5 accounts', products: 'Includes',
    urun: { motor: 'Kalibre Engine', kopru: 'Kalibre Bridge' }, beta: 'Beta license',
    copy: 'Copy key', copied: 'Copied', selected: 'Selected, press Ctrl+C', manage: 'Manage subscription',
    dl: 'Download', downloaded: function (f, v) { return f + ' downloaded' + (v ? ' (version ' + v + ')' : '') + '. Copy it into MQL5\\Experts in your MT5 data folder.'; },
    noLic: 'You have no license yet.', seePricing: 'See pricing',
    netErr: 'Could not connect. Check your connection and try again.',
    loadErr: 'We could not load your licenses. Reload the page to try again.',
    linkBad: 'License keys start with KLM and have four groups of five characters.',
    linked: 'The key is now linked to your account.',
    saved: 'Saved.', saveErr: 'Could not save. Try again.',
    paired: 'Pairing code saved', notPaired: 'Not set up', lastSeen: 'last data', connected: 'Connected', notConnected: 'Not connected',
    paper: 'paper', live: 'live',
    noStrat: 'No saved strategies yet. Strategies you build in the lab while signed in appear here.',
    open: 'Open in lab', del: 'Delete', delAsk: 'Delete this strategy from your account?', updated: 'Updated',
    delConfirm: 'Type DELETE to confirm', delWord: 'DELETE',
    delAskFinal: 'This permanently deletes your Kalibre account. Continue?',
    delDone: 'Your account has been deleted.', delSubs: function (n) { return n ? ' ' + n + ' subscription(s) will end at the close of the current period; you will not be charged again.' : ''; },
    paying: 'Receiving your payment and preparing your license.', paid: 'Thank you. Your subscription is active and the license is below.',
    payWait: 'Your payment is still processing. Reload this page in a minute.',
    signedOut: 'Sign in to see your account, licenses and saved strategies.', signIn: 'Sign in',
    off: 'Accounts are not available yet.'
  } : {
    durum: { active: 'Etkin', trialing: 'Deneme', past_due: 'Ödeme bekleniyor', canceled: 'İptal edildi', unpaid: 'Ödenmedi', incomplete: 'Tamamlanmadı', incomplete_expired: 'Süresi doldu' },
    tarih: 'tr-TR', validUntil: 'Geçerlilik', endedOn: 'Bitiş', mt5: 'MT5 hesapları', products: 'Kapsam',
    urun: { motor: 'Kalibre Motor', kopru: 'Kalibre Köprü' }, beta: 'Beta lisansı',
    copy: 'Anahtarı kopyala', copied: 'Kopyalandı', selected: 'Seçildi, Ctrl+C', manage: 'Aboneliği yönet',
    dl: 'İndir:', downloaded: function (f, v) { return f + ' indirildi' + (v ? ' (sürüm ' + v + ')' : '') + '. MT5 veri klasöründe MQL5\\Experts altına kopyala.'; },
    noLic: 'Henüz bir lisansın yok.', seePricing: 'Aboneliği incele',
    netErr: 'Bağlantı kurulamadı. İnternet bağlantını kontrol edip yeniden dene.',
    loadErr: 'Lisansların yüklenemedi. Sayfayı yenileyip yeniden dene.',
    linkBad: 'Lisans anahtarı KLM ile başlar ve beşer karakterlik dört gruptan oluşur.',
    linked: 'Anahtar hesabına bağlandı.',
    saved: 'Kaydedildi.', saveErr: 'Kaydedilemedi. Yeniden dene.',
    paired: 'Eşleştirme kodu kayıtlı', notPaired: 'Kurulmadı', lastSeen: 'son veri', connected: 'Bağlı', notConnected: 'Bağlı değil',
    paper: 'paper', live: 'canlı',
    noStrat: 'Henüz kayıtlı stratejin yok. Giriş yapmışken laboratuvarda kurduğun stratejiler burada görünür.',
    open: 'Laboratuvarda aç', del: 'Sil', delAsk: 'Bu strateji hesabından silinsin mi?', updated: 'Güncelleme',
    delConfirm: 'Onaylamak için SİL yaz', delWord: 'SİL',
    delAskFinal: 'Kalibre hesabın kalıcı olarak silinecek. Devam edilsin mi?',
    delDone: 'Hesabın silindi.', delSubs: function (n) { return n ? ' ' + n + ' aboneliğin dönem sonunda bitecek; yeniden ücret alınmayacak.' : ''; },
    paying: 'Ödemen alınıyor, lisansın hazırlanıyor.', paid: 'Teşekkürler. Aboneliğin başladı, lisansın aşağıda.',
    payWait: 'Ödemen hâlâ işleniyor. Bir dakika sonra sayfayı yenile.',
    signedOut: 'Hesabını, lisanslarını ve kayıtlı stratejilerini görmek için giriş yap.', signIn: 'Giriş yap',
    off: 'Hesaplar henüz açılmadı.'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tarih(v) { return new Date(typeof v === 'number' ? v * 1000 : v).toLocaleDateString(M.tarih, { day: 'numeric', month: 'long', year: 'numeric' }); }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsYaz(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function yaz(id, t, tur) { var e = $(id); if (!e) return; e.textContent = t || ''; e.className = 'not durum' + (tur ? ' ' + tur : ''); }

  // ── profil ──────────────────────────────────────────────────────────────
  function profilCiz() {
    var u = A.user();
    $('profil-eposta').textContent = u.email;
    A.profile().then(function (p) {
      p = p || {};
      $('profil-ad').value = p.display_name || u.name || '';
      $('profil-dil').value = p.locale || A.lang;
      $('profil-izin').checked = !!p.marketing_consent;
      $('profil-tarih').textContent = p.created_at ? tarih(p.created_at) : '';
    });
  }
  $('profil-form').addEventListener('submit', function (e) {
    e.preventDefault();
    A.updateProfile({
      display_name: $('profil-ad').value.trim().slice(0, 80) || null,
      locale: $('profil-dil').value === 'tr' ? 'tr' : 'en',
      marketing_consent: $('profil-izin').checked
    }).then(function (r) { yaz('profil-durum', r && r.error ? M.saveErr : M.saved, r && r.error ? 'kotu' : 'iyi'); });
  });

  // ── lisanslar ───────────────────────────────────────────────────────────
  function lisansKart(l) {
    var iyi = l.gecerli && (l.durum === 'active' || l.durum === 'trialing');
    var urunler = l.urunler.map(function (u) { return M.urun[u] || u; }).join(', ');
    var indir = l.gecerli ? l.urunler.map(function (u) {
      return '<button type="button" class="dugme ikincil kucuk" data-indir="' + esc(u) + '">' + esc(M.dl + ' ' + (M.urun[u] || u)) + '</button>';
    }).join('') : '';
    return '<div class="lisans-kart" data-anahtar="' + esc(l.anahtar) + '">' +
      '<div class="lisans-bas"><span class="rozet ' + (iyi ? 'iyi' : 'kotu') + '">' + esc(M.durum[l.durum] || l.durum) + '</span>' +
      (l.beta ? '<span class="rozet">' + esc(M.beta) + '</span>' : '') + '</div>' +
      '<div class="satir"><input class="sayi" readonly spellcheck="false" value="' + esc(l.anahtar) + '" aria-label="' + esc(M.copy) + '">' +
      '<button type="button" class="dugme kucuk" data-kopyala>' + esc(M.copy) + '</button></div>' +
      '<dl class="lisans-bilgi"><dt>' + esc(l.gecerli ? M.validUntil : M.endedOn) + '</dt><dd>' + esc(tarih(l.bitis)) + '</dd>' +
      '<dt>' + esc(M.products) + '</dt><dd>' + esc(urunler) + '</dd>' +
      '<dt>' + esc(M.mt5) + '</dt><dd class="sayi">' + esc(l.hesaplar.length + ' / ' + l.hesapSiniri) + '</dd></dl>' +
      '<div class="eylem-satir">' + indir + (l.yonetilebilir ? '<button type="button" class="dugme ikincil kucuk" data-portal>' + esc(M.manage) + '</button>' : '') + '</div>' +
      '<p class="not durum" role="status"></p></div>';
  }
  function lisanslariYukle() {
    var kutu = $('lisans-liste');
    return A.api('/api/hesap?islem=lisanslar').then(function (r) {
      if (!r.ok) { kutu.innerHTML = '<p class="not kotu">' + esc((r.data && r.data.hata) || M.loadErr) + '</p>'; return; }
      var l = r.data.lisanslar || [];
      var gecerli = l.filter(function (x) { return x.gecerli; })[0];
      if (gecerli) lsYaz(LISANS_ANAHTARI, gecerli.anahtar);
      if (!l.length) { kutu.innerHTML = '<p>' + esc(M.noLic) + ' <a href="' + PRO + '">' + esc(M.seePricing) + '</a></p>'; return; }
      // Bir Kalibre Markets hesabı birden çok ürünü kapsayabilir: lisanslar ürüne göre gruplanır.
      var gruplar = {};
      l.forEach(function (x) { (gruplar[x.urun || 'lab'] = gruplar[x.urun || 'lab'] || []).push(x); });
      kutu.innerHTML = Object.keys(gruplar).map(function (u) {
        return '<h3 class="urun-baslik">' + esc(URUN_ADI[u] || u) + '</h3>' + gruplar[u].map(lisansKart).join('');
      }).join('');
    });
  }
  $('lisans-liste').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var kart = b.closest('.lisans-kart'), anahtar = kart.getAttribute('data-anahtar'), d = kart.querySelector('.durum');
    if (b.hasAttribute('data-kopyala')) {
      var alan = kart.querySelector('input');
      (navigator.clipboard ? navigator.clipboard.writeText(anahtar) : Promise.reject()).then(function () { b.textContent = M.copied; }, function () { alan.select(); b.textContent = M.selected; });
      setTimeout(function () { b.textContent = M.copy; }, 1600);
    } else if (b.hasAttribute('data-indir')) {
      b.disabled = true; d.textContent = '';
      A.api('/api/indir', { body: { anahtar: anahtar, eklenti: b.getAttribute('data-indir') } }).then(function (r) {
        b.disabled = false;
        if (!r.ok) { d.textContent = (r.data && r.data.hata) || M.netErr; return; }
        var ad = ((r.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/) || [])[1] || 'Kalibre.ex5';
        var a = document.createElement('a');
        a.href = URL.createObjectURL(r.data); a.download = ad; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        d.textContent = M.downloaded(ad, r.headers.get('X-Kalibre-Surum'));
      });
    } else if (b.hasAttribute('data-portal')) {
      b.disabled = true; d.textContent = '';
      A.api('/api/odeme/portal', { body: { anahtar: anahtar } }).then(function (r) {
        if (r.ok && r.data && r.data.url) { location.href = r.data.url; return; }
        b.disabled = false; d.textContent = (r.data && r.data.hata) || M.netErr;
      });
    }
  });
  $('bagla-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('bagla-anahtar').value.trim().toUpperCase();
    if (!/^KLM(-[0-9A-HJKMNP-TV-Z]{5}){4}$/.test(v)) { yaz('bagla-durum', M.linkBad, 'kotu'); return; }
    A.api('/api/hesap?islem=lisans-bagla', { body: { anahtar: v } }).then(function (r) {
      if (!r.ok) { yaz('bagla-durum', (r.data && r.data.hata) || M.netErr, 'kotu'); return; }
      $('bagla-anahtar').value = ''; yaz('bagla-durum', M.linked, 'iyi'); lisanslariYukle();
    });
  });

  // Ödeme sonrası dönüş: ?oturum=cs_... lisans hazır olana kadar sorulur, sonra liste yenilenir.
  function odemeDonusu() {
    var oturum = new URLSearchParams(location.search).get('oturum');
    if (!oturum) return;
    yaz('odeme-durum', M.paying);
    var deneme = 0;
    (function sor() {
      A.api('/api/odeme/oturum?oturum=' + encodeURIComponent(oturum)).then(function (r) {
        if (r.ok && r.data && r.data.anahtar) {
          yaz('odeme-durum', M.paid, 'iyi');
          history.replaceState(null, '', location.pathname);
          return lisanslariYukle();
        }
        if (r.status === 404 && ++deneme < 10) return setTimeout(sor, 2000);
        yaz('odeme-durum', (r.data && r.data.hata) || M.payWait, 'kotu');
      });
    })();
  }

  // ── bu cihazdaki bağlantılar (hesaba yazılmaz) ──────────────────────────
  function cihazCiz() {
    var kod = /^KLB1[0-9a-f]{64}$/i.test(ls('kalibre-kopru-kod') || '');
    var son = Number(ls('kalibre-kopru-son') || 0);
    var alp = null, tra = null;
    try { alp = JSON.parse(ls('kalibre-alpaca') || 'null'); } catch (e) {}
    try { tra = JSON.parse(ls('kalibre-tradier') || 'null'); } catch (e) {}
    var satir = function (ad, iyi, ek) { return '<tr><th>' + esc(ad) + '</th><td><span class="rozet ' + (iyi ? 'iyi' : '') + '">' + esc(ek) + '</span></td></tr>'; };
    var alpBagli = !!(alp && alp.anahtar && alp.sir), traBagli = !!(tra && tra.token);
    $('cihaz-tablo').innerHTML =
      satir('MetaTrader 5 (Kalibre ' + (EN ? 'Bridge' : 'Köprü') + ')', kod, kod ? M.paired + (son ? ', ' + M.lastSeen + ' ' + new Date(son).toLocaleString(M.tarih) : '') : M.notPaired) +
      satir('Alpaca', alpBagli, alpBagli ? M.connected + (' (' + (alp.ortam === 'canli' ? M.live : M.paper) + ')') : M.notConnected) +
      satir('Tradier', traBagli, traBagli ? M.connected : M.notConnected);
    $('cihaz-baglan').href = BAGLAN;
  }

  // ── kayıtlı stratejiler ─────────────────────────────────────────────────
  function stratejileriYukle() {
    var kutu = $('strateji-liste');
    return window.KalibreStore.list('strateji').then(function (l) {
      if (!l.length) { kutu.innerHTML = '<p class="not">' + esc(M.noStrat) + '</p>'; return; }
      kutu.innerHTML = '<table class="tablo"><tbody>' + l.map(function (x) {
        return '<tr data-id="' + esc(x.id) + '"><td><b>' + esc(x.name || '?') + '</b><br><span class="not">' + esc(M.updated + ': ' + tarih(x.updated_at)) + '</span></td>' +
          '<td class="sag"><button type="button" class="dugme ikincil kucuk" data-ac>' + esc(M.open) + '</button> ' +
          '<button type="button" class="dugme ikincil kucuk" data-sil>' + esc(M.del) + '</button></td></tr>';
      }).join('') + '</tbody></table>';
      kutu._liste = l;
    });
  }
  $('strateji-liste').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var id = b.closest('tr').getAttribute('data-id');
    var x = ($('strateji-liste')._liste || []).filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    if (b.hasAttribute('data-ac')) {
      var s = x.payload && x.payload.strateji;
      if (!s) return;
      lsYaz('kalibre-lab-taslak', JSON.stringify(s));
      lsYaz('kalibre-lab-taslak-id', x.id);
      lsYaz('kalibre-lab-taslak-zaman', String(Date.parse(x.updated_at) || Date.now()));
      location.href = LAB;
    } else if (b.hasAttribute('data-sil')) {
      if (!confirm(M.delAsk)) return;
      window.KalibreStore.remove('strateji', id).then(stratejileriYukle);
    }
  });

  // ── hesabı sil ──────────────────────────────────────────────────────────
  $('sil-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('sil-onay').value.trim().toLocaleUpperCase(EN ? 'en' : 'tr') !== M.delWord) { yaz('sil-durum', M.delConfirm, 'kotu'); return; }
    if (!confirm(M.delAskFinal)) return;
    var d = $('sil-dugme'); d.disabled = true;
    A.api('/api/hesap?islem=sil', { body: { onay: true } }).then(function (r) {
      if (!r.ok) { d.disabled = false; yaz('sil-durum', (r.data && r.data.hata) || M.netErr, 'kotu'); return; }
      lsYaz(LISANS_ANAHTARI, null); lsYaz('kalibre-lab-taslak-id', null);
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('kalibre-store-') === 0) localStorage.removeItem(k); }); } catch (e2) {}
      alert(M.delDone + M.delSubs(r.data.iptalEdilen));
      A.signOut().then(function () { location.href = A.paths.home; });
    });
  });

  // ── başlatma ────────────────────────────────────────────────────────────
  var sonKimlik;
  function ciz() {
    var u = A.user();
    var kimlik = u ? u.id : null;
    if (kimlik === sonKimlik) return; // belirteç yenilemesi vb.: yeniden çizme
    sonKimlik = kimlik;
    $('hesap-cikis').hidden = !!u;
    $('hesap-icerik').hidden = !u;
    if (!A.enabled) { $('hesap-cikis-metin').textContent = M.off; $('hesap-giris-dugme').hidden = true; return; }
    if (!u) {
      $('hesap-cikis-metin').textContent = M.signedOut;
      $('hesap-giris-dugme').href = A.paths.signIn + '?sonra=' + encodeURIComponent(location.pathname + location.search);
      return;
    }
    profilCiz();
    lisanslariYukle().then(odemeDonusu, odemeDonusu);
    cihazCiz();
    stratejileriYukle();
  }
  A.ready().then(function () { ciz(); A.onChange(ciz); });
})();
