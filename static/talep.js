// Talep testi sayfaları (/rule-guard, /mt5-analytics ve /tr eşleri): fiyat varyantı, ölçüm, erken erişim formu.
// Ödeme yok. Olaylar /api/talep'e gider (api/_lib/talep.ts). Ziyaretçi kimliği tutulmaz:
// tarayıcıda yalnız atanan varyant (localStorage) ve oturum boyunca kaynak kodu (sessionStorage) saklanır.
(function () {
  var kok = document.querySelector('[data-talep-sayfa]');
  if (!kok) return;
  var sayfa = kok.getAttribute('data-talep-sayfa');
  var dil = document.documentElement.lang === 'tr' ? 'tr' : 'en';
  var FIYAT = { a: 19, b: 29 };

  function oku(depo, k) { try { return window[depo].getItem(k); } catch (e) { return null; } }
  function yaz(depo, k, v) { try { window[depo].setItem(k, v); } catch (e) {} }

  var vk = 'kalibre:talep:varyant:' + sayfa;
  var varyant = oku('localStorage', vk);
  if (varyant !== 'a' && varyant !== 'b') {
    varyant = Math.random() < 0.5 ? 'a' : 'b';
    yaz('localStorage', vk, varyant);
  }

  var q = new URLSearchParams(location.search);
  var kaynak = (q.get('ref') || q.get('utm_source') || '').toLowerCase();
  if (kaynak) yaz('sessionStorage', 'kalibre:talep:kaynak', kaynak);
  else kaynak = oku('sessionStorage', 'kalibre:talep:kaynak') || '';

  document.querySelectorAll('[data-fiyat-ay]').forEach(function (el) {
    el.textContent = dil === 'tr' ? FIYAT[varyant] + ' $' : '$' + FIYAT[varyant];
  });

  function gonder(olay, ek) {
    var g = { sayfa: sayfa, varyant: varyant, olay: olay, kaynak: kaynak, dil: dil };
    if (ek) for (var k in ek) g[k] = ek[k];
    return fetch('/api/talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g), keepalive: true });
  }

  // Görüntüleme oturum başına bir kez sayılır.
  var gk = 'kalibre:talep:goruldu:' + sayfa;
  if (!oku('sessionStorage', gk)) {
    yaz('sessionStorage', gk, '1');
    gonder('goruntuleme').catch(function () {});
  }

  var pencere = document.getElementById('erken-erisim');
  var formEl = pencere && pencere.querySelector('form');
  var mesaj = pencere && pencere.querySelector('[data-mesaj]');
  var METIN = dil === 'tr'
    ? { eposta: 'Geçerli bir e-posta adresi girin.', onay: 'Devam etmek için onay kutusunu işaretleyin.', hiz: 'Çok sık deneme. Biraz sonra yeniden deneyin.', genel: 'Gönderilemedi. Biraz sonra yeniden deneyin ya da markets@kalibrefin.com adresine yazın.', tamam: 'Listedesiniz. Erken erişim açıldığında e-posta göndereceğiz.' }
    : { eposta: 'Enter a valid email address.', onay: 'Tick the consent box to continue.', hiz: 'Too many attempts. Try again shortly.', genel: 'Could not send. Try again shortly or email markets@kalibrefin.com.', tamam: 'You are on the list. We will email you when early access opens.' };

  // Sayfa kendi başarı metnini verebilir (ör. /treasury: demo isteği).
  if (pencere && pencere.getAttribute('data-tamam')) METIN.tamam = pencere.getAttribute('data-tamam');

  document.querySelectorAll('[data-erken-erisim]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (b.hasAttribute('data-fiyat-tik')) gonder('fiyat-tik').catch(function () {});
      if (!pencere) return;
      if (typeof pencere.showModal === 'function') pencere.showModal(); else pencere.setAttribute('open', '');
      var ilk = pencere.querySelector('input[type=email]');
      if (ilk) ilk.focus();
    });
  });

  if (pencere) {
    pencere.querySelectorAll('[data-kapat]').forEach(function (b) {
      b.addEventListener('click', function () { if (pencere.close) pencere.close(); else pencere.removeAttribute('open'); });
    });
  }

  if (formEl) {
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = new FormData(formEl);
      var cevaplar = {};
      formEl.querySelectorAll('[data-soru]').forEach(function (el) { if (el.value) cevaplar[el.name] = el.value; });
      var dugme = formEl.querySelector('button[type=submit]');
      if (dugme) dugme.disabled = true;
      mesaj.hidden = true;
      gonder('form-gonder', { eposta: String(v.get('eposta') || ''), onay: v.get('onay') === 'evet', cevaplar: cevaplar, web: String(v.get('web') || '') })
        .then(function (r) {
          if (r.ok) {
            formEl.hidden = true;
            var sonra = pencere.querySelector('[data-sonra]');
            if (sonra) sonra.hidden = false;
            mesaj.textContent = METIN.tamam;
            mesaj.className = 'talep-mesaj tamam';
            mesaj.hidden = false;
            return;
          }
          return r.json().catch(function () { return {}; }).then(function (j) {
            mesaj.textContent = METIN[j && j.hata] || METIN.genel;
            mesaj.className = 'talep-mesaj hata';
            mesaj.hidden = false;
          });
        })
        .catch(function () {
          mesaj.textContent = METIN.genel;
          mesaj.className = 'talep-mesaj hata';
          mesaj.hidden = false;
        })
        .then(function () { if (dugme) dugme.disabled = false; });
    });
  }
})();
