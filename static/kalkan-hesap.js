/* Prop kalkanı hesaplayıcısı: Kalibre Motor'daki kalkanın (mql5/Include/Kalibre/Kalkan.mqh)
 * tek bir an için aynısı. Değerleri kullanıcı girer; hiçbir yere gönderilmez.
 */
(function () {
  'use strict';
  var kok = document.getElementById('kalkan-hesap');
  if (!kok) return;

  // Kaynak: firmaların kendi sayfaları, 23.10.2026. The5ers'ta günlük hesap yöntemi yazmadığı için ihtiyatlı.
  var KURAL = {
    ftmo2: { ad: 'FTMO 2-Step', gunluk: 5, azami: 10, tur: 'sabit' },
    ftmo1: { ad: 'FTMO 1-Step', gunluk: 3, azami: 10, tur: 'iz' },
    ftmoi: { ad: 'FTMO Instant', gunluk: 3, azami: 10, tur: 'iz' },
    the5ers: { ad: 'The5ers High Stakes', gunluk: 5, azami: 10, tur: 'sabit' },
  };
  var para = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var yuzde = new Intl.NumberFormat('tr-TR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var $ = function (s) { return kok.querySelector(s); };
  var sayi = function (ad) { var v = parseFloat(String($('[name=' + ad + ']').value).replace(',', '.')); return isFinite(v) ? v : NaN; };

  function hesapla() {
    var k = KURAL[$('[name=program]').value];
    var bas = sayi('baslangic'), gunBasi = sayi('gunbasi'), varlik = sayi('varlik'), tepe = sayi('tepe'), acik = sayi('acik') || 0, pay = sayi('pay');
    $('[data-tepe]').hidden = k.tur !== 'iz';
    if (!(bas > 0) || !(gunBasi > 0) || !(varlik > 0) || !(pay >= 0)) {
      $('[data-sonuc]').hidden = true; return;
    }
    if (k.tur !== 'iz' || !(tepe > 0)) tepe = bas;
    var gunlukTaban = gunBasi - bas * k.gunluk / 100;
    var azamiTaban = Math.max(tepe, bas) - bas * k.azami / 100;
    var taban = Math.max(gunlukTaban, azamiTaban);
    var oda = varlik - taban, tampon = bas * pay / 100;
    var riskSiniri = oda - 2 * tampon - acik;
    var durum, sinif;
    if (oda <= tampon) { durum = 'Kilit: pozisyonlar kapatılır, gün sıfırlanana kadar yeni işlem yok.'; sinif = 'kotu'; }
    else if (oda <= 2 * tampon) { durum = 'Dur: tabana yakınsın, yeni işlem açılmaz.'; sinif = 'uyari'; }
    else { durum = 'Açık: yeni işleme izin var.'; sinif = 'iyi'; }

    $('[data-sonuc]').hidden = false;
    $('[data-s=gunluk]').textContent = para.format(gunlukTaban);
    $('[data-s=azami]').textContent = para.format(azamiTaban);
    $('[data-s=taban]').textContent = para.format(taban) + (gunlukTaban >= azamiTaban ? ' (günlük sınır)' : ' (azami sınır)');
    $('[data-s=oda]').textContent = para.format(oda) + ' (' + yuzde.format(oda / bas) + ')';
    $('[data-s=risk]').textContent = riskSiniri > 0 ? para.format(riskSiniri) : 'yeni işlem için yer yok';
    var d = $('[data-s=durum]');
    d.textContent = durum; d.className = 'durum ' + sinif;
  }

  kok.addEventListener('input', hesapla);
  hesapla();
})();
