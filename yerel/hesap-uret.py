# Hesap sayfaları (TR + EN): giriş (/giris, /en/sign-in) ve hesap (/hesap, /en/license).
# Ortak üst bar ve alt bilgi sayfa-uret.py'den gelir. Davranış static/giris.js ve static/hesap-sayfa.js'te.
import os
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

STIL = """
.giris-kart { max-width: 440px; background: var(--zemin-2); border: 1px solid var(--cizgi-2); border-radius: 8px; padding: 28px 28px 24px; margin: 8px 0 28px; }
.giris-kart h1 { font-size: 30px; margin: 0 0 6px; }
.giris-kart .alt-baslik { color: var(--soluk); margin: 0 0 22px; font-size: 16px; }
.google { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 46px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: #fff; color: #1f1f1f; font: 500 15px var(--sans); cursor: pointer; }
.google:hover { background: #f2f2f2; }
.ayrac { display: flex; align-items: center; gap: 12px; color: var(--silik); font-size: 13px; margin: 18px 0; }
.ayrac::before, .ayrac::after { content: ""; flex: 1; height: 1px; background: var(--cizgi); }
.alan-etiket { display: block; font-size: 14px; color: var(--soluk); margin: 0 0 6px; }
.metin-alan { width: 100%; min-height: 46px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin); color: var(--metin); font: 400 16px var(--sans); }
.metin-alan:focus { outline: none; border-color: var(--yesil); }
.genis { width: 100%; margin-top: 12px; }
.kod { font: 500 22px var(--mono); letter-spacing: .3em; text-align: center; }
.giris-durum { font-size: 14px; margin: 14px 0 0; line-height: 1.5; }
.giris-durum:empty { display: none; }
.iyi { color: var(--yesil); } .kotu { color: var(--kehribar); }
.ince { font-size: 13px; color: var(--silik); margin: 18px 0 0; }
.bolum { background: var(--zemin-2); border: 1px solid var(--cizgi-2); border-radius: 6px; padding: 22px 24px; margin: 8px 0 28px; }
.bolum h2 { font-size: 22px; margin: 0 0 6px; }
.bolum .ust-not { margin: 0 0 16px; }
.izgara-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px 18px; }
.izgara-2 label { display: grid; gap: 6px; font-size: 14px; color: var(--soluk); }
.izgara-2 select { min-height: 46px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin); color: var(--metin); font: 400 16px var(--sans); }
.onay { display: flex; gap: 10px; align-items: flex-start; font-size: 15px; color: var(--soluk); margin: 16px 0; cursor: pointer; }
.onay input { margin-top: 4px; width: 18px; height: 18px; accent-color: var(--yesil); }
.urun-baslik { font: 600 17px var(--sans); margin: 18px 0 10px; color: var(--metin); }
.lisans-kart { border: 1px solid var(--cizgi); border-radius: 6px; padding: 16px 18px; margin: 0 0 14px; background: var(--zemin); }
.lisans-bas { display: flex; gap: 8px; margin-bottom: 10px; }
.rozet { font: 600 12px var(--sans); border-radius: 4px; padding: 2px 8px; border: 1px solid var(--cizgi-2); color: var(--soluk); }
.rozet.iyi { color: #08130f; background: var(--yesil); border-color: var(--yesil); }
.rozet.kotu { color: #08130f; background: var(--kehribar); border-color: var(--kehribar); }
.satir { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.satir input { flex: 1 1 300px; min-height: 42px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin-2); color: var(--metin); font: 500 16px var(--mono); letter-spacing: .04em; }
.lisans-bilgi { display: grid; grid-template-columns: max-content 1fr; gap: 4px 16px; font-size: 15px; margin: 6px 0 10px; }
.lisans-bilgi dt { color: var(--silik); } .lisans-bilgi dd { margin: 0; }
.eylem-satir { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.durum:empty { display: none; }
td.sag { text-align: right; white-space: nowrap; }
.tehlike { border-color: color-mix(in srgb, var(--kirmizi) 50%, var(--cizgi-2)); }
.tehlike h2 { color: var(--kirmizi); }
.dugme.kirmizi { background: var(--kirmizi); border-color: var(--kirmizi); color: #1a0806; }
"""

GOOGLE_SVG = ('<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">'
  '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.5 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z"/>'
  '<path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.8-9.7 6.8-16.6z"/>'
  '<path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.9-6.2z"/>'
  '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2.1 1.4-4.8 2.2-8.6 2.2-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"/>'
  '</svg>')

T = {
  "tr": dict(
    giris_yol="giris/index.html", giris_baslik="Giriş yap: Kalibre Markets", giris_aciklama="Kalibre Markets hesabına Google ya da e-postayla giriş yap.",
    h1="Kalibre Markets hesabına giriş yap", alt="Tek hesap, tüm Kalibre Markets ürünleri. İlk kez giriş yapıyorsan hesabın bu adımda oluşturulur.",
    google="Google ile devam et", veya="veya", eposta="E-posta", gonder="Giriş bağlantısı gönder",
    kod="E-postadaki 6 haneli kod", kod_dugme="Kodla giriş yap",
    ince='Devam ederek <a href="/kullanim-sartlari">Kullanım Şartları</a>\'nı kabul etmiş ve <a href="/gizlilik">Gizlilik Politikası</a>\'nı okumuş olursun.',
    hesap_yol="hesap/index.html", hesap_baslik="Hesabım: Kalibre Markets", hesap_aciklama="Kalibre Markets hesabın: profil, lisanslar, eklenti indirme, abonelik ve kayıtlı stratejiler.",
    hesap_h1="Hesabım", cikis_dugme="Giriş yap",
    odeme="",
    profil="Profil", profil_not="Hesabın giriş yaptığın e-posta adresine bağlıdır.", eposta_et="E-posta", katilim="Kayıt tarihi",
    ad="Ad (isteğe bağlı)", dil="Arayüz dili", izin="Ürün haberleri ve yeni özellikler için e-posta almak istiyorum. İstediğin zaman kapatabilirsin.", kaydet="Kaydet",
    lisanslar="Ürünler ve lisanslar", lisans_not='Lisans anahtarını Kalibre Köprü ve Kalibre Motor\'un ayarlarına bir kez girersin. Bir anahtar en çok 2 MT5 hesabında kullanılır. Kurulum adımları <a href="/kurulum">kurulum sayfasında</a>.',
    bagla="Anahtarın mı var?", bagla_not="Davetle ya da hesap açılmadan önce aldığın bir anahtarı hesabına bağla.", bagla_dugme="Hesabıma bağla",
    cihaz="Bu cihazdaki bağlantılar", cihaz_not="MT5 eşleştirme kodu ve aracı kurum anahtarları yalnız bu tarayıcıda saklanır; hesabına yazılmaz ve başka cihaza taşınmaz. Yeni bir cihazda bağlantıyı yeniden kurman gerekir.", cihaz_dugme="Bağlantıları yönet",
    stratejiler="Kayıtlı stratejiler", strateji_not="Giriş yapmışken laboratuvardaki taslağın hesabına kaydedilir ve diğer cihazlarında açılabilir.",
    sil="Hesabı sil", sil_not="Hesabın, profilin ve kayıtlı stratejilerin kalıcı olarak silinir. Etkin bir aboneliğin varsa dönem sonunda biter ve yeniden ücret alınmaz; lisans anahtarın o tarihe kadar MT5'te çalışır. Anahtarı saklamak istiyorsan önce kopyala. Faturalar yasal saklama süresi boyunca Stripe'ta kalır.",
    sil_etiket="Onaylamak için SİL yaz", sil_dugme="Hesabımı sil",
  ),
  "en": dict(
    giris_yol="en/sign-in/index.html", giris_baslik="Sign in: Kalibre Markets", giris_aciklama="Sign in to your Kalibre Markets account with Google or email.",
    h1="Sign in to your Kalibre Markets account", alt="One account for all Kalibre Markets products. New here? Signing in for the first time creates your account.",
    google="Continue with Google", veya="or", eposta="Email", gonder="Email me a sign-in link",
    kod="6-digit code from the email", kod_dugme="Sign in with code",
    ince='By continuing, you agree to the <a href="/en/terms">Terms of Use</a> and acknowledge the <a href="/en/privacy">Privacy Policy</a>.',
    hesap_yol="en/license/index.html", hesap_baslik="Account: Kalibre Markets", hesap_aciklama="Your Kalibre Markets account: profile, licenses, add-on downloads, subscription and saved strategies.",
    hesap_h1="Account", cikis_dugme="Sign in",
    odeme="",
    profil="Profile", profil_not="Your account is tied to the email address you sign in with.", eposta_et="Email", katilim="Member since",
    ad="Name (optional)", dil="Language", izin="Email me about product updates and new features. You can turn this off at any time.", kaydet="Save",
    lisanslar="Products and licenses", lisans_not='Enter your license key once in the Kalibre Bridge and Kalibre Engine settings. Each key works on up to 2 MT5 accounts. Setup steps are on the <a href="/en/setup">setup page</a>.',
    bagla="Have a key?", bagla_not="Link a key you received by invitation or before accounts existed.", bagla_dugme="Link to my account",
    cihaz="Connections on this device", cihaz_not="Your MT5 pairing code and broker keys are stored only in this browser. They are not saved to your account and do not move to other devices. On a new device, set the connection up again.", cihaz_dugme="Manage connections",
    stratejiler="Saved strategies", strateji_not="While you are signed in, your lab draft is saved to your account so you can open it on your other devices.",
    sil="Delete account", sil_not="This permanently deletes your account, profile and saved strategies. If you have an active subscription, it ends at the close of the current period and you will not be charged again; your license key keeps working in MT5 until then. Copy the key first if you want to keep it. Invoices stay with Stripe for the legally required retention period.",
    sil_etiket="Type DELETE to confirm", sil_dugme="Delete my account",
  ),
}

for dil, t in T.items():
    giris = f"""
<div class="giris-kart">
  <h1>{t['h1']}</h1>
  <p class="alt-baslik">{t['alt']}</p>
  <button type="button" class="google" id="giris-google">{GOOGLE_SVG}{t['google']}</button>
  <div class="ayrac" id="giris-ayrac">{t['veya']}</div>
  <form id="giris-form" novalidate>
    <label class="alan-etiket" for="giris-eposta">{t['eposta']}</label>
    <input class="metin-alan" type="email" id="giris-eposta" autocomplete="email" required>
    <button type="submit" class="dugme genis" id="giris-gonder">{t['gonder']}</button>
  </form>
  <form id="giris-kod-form" novalidate>
    <div id="giris-kod-alan" hidden>
      <label class="alan-etiket" for="giris-kod" style="margin-top:18px">{t['kod']}</label>
      <input class="metin-alan kod" id="giris-kod" inputmode="numeric" autocomplete="one-time-code" maxlength="8">
      <button type="submit" class="dugme ikincil genis" id="giris-kod-dugme">{t['kod_dugme']}</button>
    </div>
  </form>
  <p class="giris-durum" id="giris-durum" role="status" aria-live="polite"></p>
  <p class="ince">{t['ince']}</p>
</div>
"""
    sayfa(t["giris_yol"], t["giris_baslik"], t["giris_aciklama"], "", giris, ek_stil=STIL,
          ek_betik='<script src="/static/giris.js" defer></script>', gizli=True, dil=dil)

    hesap = f"""
<h1>{t['hesap_h1']}</h1>
<div id="hesap-cikis">
  <p class="giris" id="hesap-cikis-metin"></p>
  <p><a class="dugme" id="hesap-giris-dugme" href="{'/en/sign-in' if dil == 'en' else '/giris'}">{t['cikis_dugme']}</a></p>
</div>
<div id="hesap-icerik" hidden>
  <p class="not durum" id="odeme-durum" role="status"></p>

  <section class="bolum" id="lisanslar">
    <h2>{t['lisanslar']}</h2>
    <p class="not ust-not">{t['lisans_not']}</p>
    <div id="lisans-liste"></div>
    <form id="bagla-form" novalidate>
      <label class="alan-etiket" for="bagla-anahtar"><b>{t['bagla']}</b> {t['bagla_not']}</label>
      <div class="satir">
        <input id="bagla-anahtar" placeholder="KLM-XXXXX-XXXXX-XXXXX-XXXXX" spellcheck="false" autocomplete="off">
        <button type="submit" class="dugme ikincil">{t['bagla_dugme']}</button>
      </div>
      <p class="not durum" id="bagla-durum" role="status"></p>
    </form>
  </section>

  <section class="bolum" id="profil">
    <h2>{t['profil']}</h2>
    <p class="not ust-not">{t['profil_not']}</p>
    <form id="profil-form">
      <dl class="lisans-bilgi"><dt>{t['eposta_et']}</dt><dd id="profil-eposta"></dd><dt>{t['katilim']}</dt><dd id="profil-tarih"></dd></dl>
      <div class="izgara-2">
        <label>{t['ad']}<input class="metin-alan" id="profil-ad" maxlength="80" autocomplete="name"></label>
        <label>{t['dil']}<select id="profil-dil"><option value="en">English</option><option value="tr">Türkçe</option></select></label>
      </div>
      <label class="onay"><input type="checkbox" id="profil-izin"> <span>{t['izin']}</span></label>
      <button type="submit" class="dugme ikincil">{t['kaydet']}</button>
      <p class="not durum" id="profil-durum" role="status"></p>
    </form>
  </section>

  <section class="bolum" id="cihaz">
    <h2>{t['cihaz']}</h2>
    <p class="not ust-not">{t['cihaz_not']}</p>
    <table class="tablo"><tbody id="cihaz-tablo"></tbody></table>
    <a class="dugme ikincil kucuk" id="cihaz-baglan" href="{'/en/connect' if dil == 'en' else '/baglan'}">{t['cihaz_dugme']}</a>
  </section>

  <section class="bolum" id="stratejiler">
    <h2>{t['stratejiler']}</h2>
    <p class="not ust-not">{t['strateji_not']}</p>
    <div id="strateji-liste"></div>
  </section>

  <section class="bolum tehlike" id="sil">
    <h2>{t['sil']}</h2>
    <p class="not ust-not">{t['sil_not']}</p>
    <form id="sil-form" novalidate>
      <label class="alan-etiket" for="sil-onay">{t['sil_etiket']}</label>
      <div class="satir">
        <input id="sil-onay" autocomplete="off" spellcheck="false" style="font-family:var(--sans)">
        <button type="submit" class="dugme kirmizi" id="sil-dugme">{t['sil_dugme']}</button>
      </div>
      <p class="not durum" id="sil-durum" role="status"></p>
    </form>
  </section>
</div>
"""
    sayfa(t["hesap_yol"], t["hesap_baslik"], t["hesap_aciklama"], "", hesap, ek_stil=STIL,
          ek_betik='<script src="/static/hesap-sayfa.js" defer></script>', gizli=True, dil=dil)
