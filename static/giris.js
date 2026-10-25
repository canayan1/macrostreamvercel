/* Giriş sayfası (/sign-in, /tr/sign-in): Google ya da e-postayla bağlantı + 6 haneli kod.
 * Giriş ilk kez yapılıyorsa hesap o anda oluşturulur (Supabase). Dönüşte ?sonra= yoluna gidilir. */
(function () {
  'use strict';
  var SARTLAR_SURUMU = '2026-10-25';
  var A = window.KalibreAuth;
  var $ = function (id) { return document.getElementById(id); };
  if (!A) return;
  var EN = A.lang === 'en';
  var M = EN ? {
    off: 'Sign-in is not available yet. Please try again later.',
    sending: 'Sending', send: 'Email me a sign-in link',
    sent: function (e) { return 'Check your inbox. We sent a sign-in link and a 6-digit code to ' + e + '. The link works in this browser. On another device, enter the code below.'; },
    badEmail: 'Enter a valid email address.',
    badCode: 'Enter the 6-digit code from the email.',
    verifying: 'Checking', verify: 'Sign in with code',
    codeWrong: 'That code did not work. It may have expired; request a new one.',
    google: 'Redirecting to Google',
    failed: 'Sign-in failed: ', done: 'Signed in. Redirecting',
    rate: 'Too many requests. Wait a minute and try again.',
    net: 'Could not reach the sign-in service. Check your connection and try again.'
  } : {
    off: 'Giriş henüz açık değil. Lütfen daha sonra yeniden dene.',
    sending: 'Gönderiliyor', send: 'Giriş bağlantısı gönder',
    sent: function (e) { return 'Gelen kutunu kontrol et. ' + e + ' adresine bir giriş bağlantısı ve 6 haneli bir kod gönderdik. Bağlantı bu tarayıcıda çalışır. Başka bir cihazdaysan kodu aşağıya gir.'; },
    badEmail: 'Geçerli bir e-posta adresi gir.',
    badCode: 'E-postadaki 6 haneli kodu gir.',
    verifying: 'Kontrol ediliyor', verify: 'Kodla giriş yap',
    codeWrong: 'Kod kabul edilmedi. Süresi dolmuş olabilir; yeni bir kod iste.',
    google: 'Google\'a yönlendiriliyor',
    failed: 'Giriş yapılamadı: ', done: 'Giriş yapıldı. Yönlendiriliyor',
    rate: 'Çok sık istek gönderildi. Bir dakika bekleyip yeniden dene.',
    net: 'Giriş hizmetine ulaşılamadı. Bağlantını kontrol edip yeniden dene.'
  };
  var q = new URLSearchParams(location.search);
  var sonra = A.safePath(q.get('sonra'));
  var durum = $('giris-durum');
  function yaz(t, tur) { durum.textContent = t || ''; durum.className = 'giris-durum' + (tur ? ' ' + tur : ''); }
  function hataMetni(e) {
    var m = (e && (e.message || e.msg)) || '';
    if (/rate|too many|security purposes/i.test(m)) return M.rate;
    if (/fetch|network|load failed/i.test(m)) return M.net;
    return M.failed + m;
  }

  // Hesap açılışı: şartların kabul anı ve arayüz dili ilk girişte profile yazılır.
  // Ürün güncellemesi e-postaları hesaplarda varsayılan açıktır; kayıtta kutu işaretlendiyse kapatılır.
  var ret = $('giris-pazarlama-ret');
  function retOku() { try { return localStorage.getItem('kalibre-pazarlama-ret') === '1'; } catch (e) { return false; } }
  if (ret) {
    ret.checked = retOku();
    ret.addEventListener('change', function () { try { localStorage.setItem('kalibre-pazarlama-ret', ret.checked ? '1' : '0'); } catch (e) {} });
  }
  function ilkGiris() {
    return A.profile().then(function (p) {
      if (p && !p.terms_accepted_at) {
        var g = { terms_accepted_at: new Date().toISOString(), terms_version: SARTLAR_SURUMU, locale: A.lang };
        if (retOku()) g.marketing_consent = false;
        return A.updateProfile(g);
      }
    }).catch(function () {});
  }
  var bitti = false;
  function bitir() {
    if (bitti) return;
    bitti = true;
    yaz(M.done, 'iyi');
    ilkGiris().then(function () { location.replace(sonra); });
  }

  var hata = q.get('error_description') || new URLSearchParams(location.hash.slice(1)).get('error_description');

  A.ready().then(function () {
    if (!A.enabled) { $('giris-form').hidden = true; $('giris-google').hidden = true; $('giris-ayrac').hidden = true; yaz(M.off, 'kotu'); return; }
    if (A.user()) return bitir();
    if (hata) yaz(M.failed + hata, 'kotu');
    A.onChange(function (u) { if (u) bitir(); });
  });

  $('giris-google').addEventListener('click', function () {
    yaz(M.google);
    A.signInWithGoogle({ next: sonra }).then(function (r) { if (r && r.error) yaz(hataMetni(r.error), 'kotu'); });
  });

  var eposta = '';
  $('giris-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var d = $('giris-gonder');
    eposta = $('giris-eposta').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) { yaz(M.badEmail, 'kotu'); return; }
    d.disabled = true; d.textContent = M.sending; yaz('');
    A.signInWithEmail(eposta, { next: sonra }).then(function (r) {
      d.disabled = false; d.textContent = M.send;
      if (r && r.error) { yaz(hataMetni(r.error), 'kotu'); return; }
      yaz(M.sent(eposta), 'iyi');
      $('giris-kod-alan').hidden = false;
      $('giris-kod').focus();
    });
  });

  $('giris-kod-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var kod = $('giris-kod').value.replace(/\s/g, '');
    if (!/^\d{6,8}$/.test(kod)) { yaz(M.badCode, 'kotu'); return; }
    var d = $('giris-kod-dugme');
    d.disabled = true; d.textContent = M.verifying;
    A.verifyCode(eposta, kod).then(function (r) {
      d.disabled = false; d.textContent = M.verify;
      if (r && r.error) { yaz(M.codeWrong, 'kotu'); return; }
      bitir();
    });
  });
})();
