# Talep testi sayfaları (docs/TALEP-TESTI.md): /rule-guard, /mt5-analytics ve /tr eşleri.
# Ödeme yok; "Get early access" ücretsiz listeye yazar. Ölçüm: static/talep.js -> /api/talep.
# Kullanım (site kökünden ya da herhangi bir yerden): python3 yerel/talep-uret.py
import os
_d = os.path.dirname(os.path.abspath(__file__))
_tr = open(os.path.join(_d, "sayfa-uret.py")).read()
exec(_tr.split("# ------------------------------------------------------------------ kurulum")[0])
PRO_STIL = _tr.split('PRO_STIL = """')[1].split('"""')[0]

STIL = PRO_STIL + """
.eylem-satir { display: flex; gap: 12px; flex-wrap: wrap; margin: 8px 0 8px; }
.ozellik { list-style: none; padding: 0; margin: 0 0 24px; display: grid; gap: 12px; }
.ozellik li { background: var(--zemin-2); border: 1px solid var(--cizgi); border-radius: 6px; padding: 14px 18px; }
.ozellik b { color: var(--metin); }
.durum-et { display: inline-block; font: 600 12px var(--sans); border-radius: 4px; padding: 2px 8px; margin-left: 8px; vertical-align: 2px; }
.durum-et.var { color: #08130f; background: var(--yesil); }
.durum-et.test { color: #08130f; background: var(--kehribar); }
.durum-et.plan { color: var(--soluk); border: 1px solid var(--cizgi-2); }
.plan .yillik { display: block; font-size: 15px; color: var(--soluk); margin-top: 4px; }
.plan .not-erken { color: var(--soluk); font-size: 15px; margin: 10px 0 0; }
dialog#erken-erisim { max-width: 560px; width: calc(100% - 32px); background: var(--zemin-2); color: var(--metin); border: 1px solid var(--cizgi-2); border-radius: 8px; padding: 24px; }
dialog#erken-erisim::backdrop { background: rgba(5, 10, 18, .7); }
dialog#erken-erisim h2 { margin: 0 0 6px; font-size: 24px; }
dialog#erken-erisim .alanlar { display: grid; gap: 12px; margin: 14px 0; }
dialog#erken-erisim label { display: grid; gap: 6px; font-size: 14px; color: var(--soluk); }
dialog#erken-erisim input[type=email], dialog#erken-erisim input[type=text], dialog#erken-erisim select { min-height: 42px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin); color: var(--metin); font: 400 15px var(--sans); width: 100%; box-sizing: border-box; }
dialog#erken-erisim label.onay { display: flex; font-size: 14px; }
dialog#erken-erisim .kapat-satir { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.talep-mesaj { margin: 10px 0; font-weight: 600; }
.talep-mesaj.tamam { color: var(--yesil); } .talep-mesaj.hata { color: var(--kehribar); }
.gizli-alan { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
"""

def et(tur, dil):
    m = {"var": ("Beta'da", "In beta"), "test": ("Demo hesapta testte", "In testing on demo"), "plan": ("Planlanıyor", "Planned")}[tur]
    return f'<span class="durum-et {tur}">{m[0] if dil == "tr" else m[1]}</span>'

def secim(ad, etiket, secenekler, bos):
    s = "".join(f'<option value="{v}">{t}</option>' for v, t in secenekler)
    return f'<label for="ee-{ad}">{etiket}<select id="ee-{ad}" name="{ad}" data-soru><option value="">{bos}</option>{s}</select></label>'

def metin(ad, etiket):
    return f'<label for="ee-{ad}">{etiket}<input type="text" id="ee-{ad}" name="{ad}" maxlength="300" data-soru></label>'

def pencere(dil, sorular):
    tr = dil == "tr"
    gizlilik = "/tr/privacy#collect-why" if tr else "/privacy#collect-why"
    return f'''
<dialog id="erken-erisim" aria-labelledby="ee-baslik">
  <h2 id="ee-baslik">{"Erken erişim" if tr else "Get early access"}</h2>
  <p>{"Erken erişim ücretsiz. Kart gerekmez. Ücretli bir plan açılmadan önce haber vereceğiz." if tr else "Early access is free. No card required. We'll tell you before any paid plan."}</p>
  <form novalidate>
    <div class="alanlar">
      <label for="ee-eposta">{"E-posta" if tr else "Email"}<input type="email" id="ee-eposta" name="eposta" required autocomplete="email" maxlength="254"></label>
      {sorular}
    </div>
    <div class="gizli-alan" aria-hidden="true"><label>Web<input type="text" name="web" tabindex="-1" autocomplete="off"></label></div>
    <label class="onay" for="ee-onay"><input type="checkbox" id="ee-onay" name="onay" value="evet" required> <span>{"Kalibre Markets'in erken erişim ve ürün güncellemeleri hakkında bana e-posta göndermesini kabul ediyorum. İstediğim zaman listeden çıkabilirim." if tr else "I agree to receive emails from Kalibre Markets about early access and product updates. I can unsubscribe at any time."}</span></label>
    <p class="not">{f'E-postanızı, cevaplarınızı ve katılma zamanını saklarız. Ayrıntılar <a href="{gizlilik}">gizlilik politikasında</a>.' if tr else f'We store your email, your answers and the time you joined. Details are in the <a href="{gizlilik}">privacy policy</a>.'}</p>
    <div class="kapat-satir">
      <button type="button" class="dugme ikincil" data-kapat>{"Kapat" if tr else "Close"}</button>
      <button type="submit" class="dugme">{"Listeye katıl" if tr else "Join early access"}</button>
    </div>
  </form>
  <p class="talep-mesaj" data-mesaj hidden aria-live="polite"></p>
  <div class="kapat-satir" data-sonra hidden><button type="button" class="dugme ikincil" data-kapat>{"Kapat" if tr else "Close"}</button></div>
</dialog>'''

def fiyat_kutusu(dil, urun, maddeler, yillik):
    tr = dil == "tr"
    madde = "\n".join(f"    <li>{m}</li>" for m in maddeler)
    yil = (f'<span class="yillik">{"ya da yıllık 99 $" if tr else "or $99 / year"}</span>' if yillik else "")
    ay = '<span class="sayi" data-fiyat-ay>19 $</span> / ay' if tr else '<span class="sayi" data-fiyat-ay>$19</span> / month'
    return f'''
<h2 id="pricing">{"Planlanan fiyat" if tr else "Planned pricing"}</h2>
<div class="plan">
  <div class="plan-bas">
    <h2>{urun} <span class="rozet-beta">{"erken erişim" if tr else "early access"}</span></h2>
    <p class="fiyat">{ay}{yil}</p>
  </div>
  <ul>
{madde}
  </ul>
  <a class="dugme" href="#pricing" data-erken-erisim data-fiyat-tik>{"Erken erişim al" if tr else "Get early access"}</a>
  <p class="not-erken">{"Erken erişim ücretsiz. Kart gerekmez. Ücretli bir plan açılmadan önce haber vereceğiz." if tr else "Early access is free. No card required. We'll tell you before any paid plan."}</p>
</div>'''

# ------------------------------------------------------------------ Rule Guard
def rule_guard(dil):
    tr = dil == "tr"
    p = "/tr" if tr else ""
    if tr:
        bas = f'''
<div data-talep-sayfa="rule-guard">
<h1>Kalibre Rule Guard: MT5'te prop firması sınavları için kural koruması</h1>
<p class="giris">Rule Guard, firmanın günlük ve toplam kayıp sınırlarını MT5 hesabında izler, tabana yaklaşınca yeni işlemi durdurur ve her hafta kural ihlallerini ve pahalıya mal olan hataları raporlar. Şu an erken erişimde.</p>
<div class="eylem-satir"><a class="dugme" href="#pricing" data-erken-erisim>Erken erişim al</a><a class="dugme ikincil" href="/tr/prop#hesapla">Hesabını kontrol et</a></div>

<h2 id="ne-yapar">Ne yapar</h2>
<ul class="ozellik">
  <li><b>Firma ön ayarları</b> {et("test", dil)}<br>FTMO 2-Step, FTMO 1-Step, FTMO Instant ve The5ers High Stakes. FundedNext ve FundingPips {et("plan", dil)}</li>
  <li><b>Firmanın hesapladığı gibi tabanlar</b> {et("test", dil)}<br>Günlük taban gün başı bakiyeden, toplam taban başlangıç bakiyesinden ya da tepeden hesaplanır. Gün, firmanın saatinde sıfırlanır.</li>
  <li><b>Tabana yakın yeni işlem yok</b> {et("test", dil)}<br>Güvenlik payının iki katında Kalibre Engine yeni işlem açmaz. Bir güvenlik payında kendi pozisyonlarını kapatır.</li>
  <li><b>Sınav paneli</b> {et("plan", dil)}<br>Günlük ve toplam tabana kalan mesafe, kâr hedefine ilerleme ve işlem günleri, tarayıcıda.</li>
  <li><b>Haftalık kural ve hata raporu</b> {et("plan", dil)}<br>Hangi işlem bir kuralı çiğnedi ya da yaklaştı, tabana yakın günlerden sonraki kayıplar, fazla büyük lotlar.</li>
</ul>

<h2 id="baglanti">Nasıl bağlanır</h2>
<p>Rule Guard, MT5 terminalinde Expert Advisor olarak çalışır. Panel ve rapor için Kalibre Bridge eklentisi hesap verisini şifreli olarak tarayıcına taşır. MT5 şifreni bize vermezsin. Ayrıntılar <a href="/tr/security">güvenlik sayfasında</a>.</p>
<p>Geçmiş günlerini firmanın sınırlarıyla şimdi karşılaştırmak için MT5 raporunu <a href="/tr/mt5-analytics">Trade Analytics</a> sayfasına bırakabilirsin.</p>
'''
        maddeler = ["4 firma ön ayarı ve özel sınırlar", "Günlük ve toplam taban, firmanın saatinde sıfırlama", "Sınav paneli ve haftalık rapor (planlanıyor)", "Lisans başına 2 MT5 hesabı"]
        sss = f'''
<h2 id="sss">Sık sorulanlar</h2>
<ul>
  <li><b>Firmam EA kullanımına izin veriyor mu?</b> Firmanın EA kurallarını kontrol et; bazı firmalar EA kullanımını kısıtlıyor. Rule Guard MT5'te Expert Advisor olarak çalışır.</li>
  <li><b>Elle açtığım işlemleri durdurabilir mi?</b> Hayır. Elle ya da başka bir EA ile açılan pozisyonları kalan payı hesaplarken sayar, ama o emirleri engelleyemez.</li>
  <li><b>Sınavı geçmemi garanti eder mi?</b> Hayır. Yalnız kayıp sınırlarını izler. Kayma ve fiyat boşlukları stopun ötesinde kayba yol açabilir.</li>
  <li><b>Kalibre bir prop firması mı?</b> Hayır. Hiçbir prop firmasıyla bağlantısı yok. Firma adları yalnız kurallarını anlatmak için kullanılır.</li>
</ul>
<div class="kutu">Kalibre bir yazılımdır ve yatırım tavsiyesi vermez. Kaldıraçlı forex ve CFD işlemleri yüksek risk taşır. Yatırdığın paranın tamamını kaybedebilirsin. <a href="/tr/risk-disclosure">Risk bildirimi</a></div>
</div>'''
        sorular = (secim("firma", "Hangi firmada sınava giriyorsun?", [("ftmo", "FTMO"), ("fundednext", "FundedNext"), ("fundingpips", "FundingPips"), ("the5ers", "The5ers"), ("topstep", "Topstep"), ("diger", "Başka"), ("yok", "Henüz girmedim")], "Seç")
                   + secim("sinav", "Son 12 ayda kaç sınav aldın?", [("0", "0"), ("1", "1"), ("2-3", "2-3"), ("4-10", "4-10"), ("10+", "10'dan fazla")], "Seç")
                   + metin("simdi", "Günlük kayıp sınırını şu an nasıl takip ediyorsun?"))
        govde = bas + fiyat_kutusu(dil, "Rule Guard", maddeler, True) + sss + pencere(dil, sorular)
        sayfa("tr/rule-guard/index.html", "Kalibre Rule Guard: prop firması sınavları için kural koruması", "MT5'te firmanın günlük ve toplam kayıp sınırlarını izleyen, tabana yakın yeni işlemi durduran ve haftalık kural raporu veren araç. Erken erişim.", "", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=STIL, ek_betik='<script src="/static/talep.js" defer></script>', dil="tr")
    else:
        bas = f'''
<div data-talep-sayfa="rule-guard">
<h1>Kalibre Rule Guard: stay inside your prop firm's loss limits on MT5</h1>
<p class="giris">Rule Guard tracks your firm's daily and total loss limits on your MT5 account, stops new trades near the floor and sends you a weekly report of rule breaks and costly mistakes. It is in early access.</p>
<div class="eylem-satir"><a class="dugme" href="#pricing" data-erken-erisim>Get early access</a><a class="dugme ikincil" href="/prop#calculate">Check your account</a></div>

<h2 id="what-it-does">What it does</h2>
<ul class="ozellik">
  <li><b>Firm presets</b> {et("test", dil)}<br>FTMO 2-Step, FTMO 1-Step, FTMO Instant and The5ers High Stakes. FundedNext and FundingPips {et("plan", dil)}</li>
  <li><b>Floors calculated the way your firm does</b> {et("test", dil)}<br>The daily floor uses the start-of-day balance. The total floor uses the starting balance or the peak. The day resets at the firm's time.</li>
  <li><b>No new trades near the floor</b> {et("test", dil)}<br>At twice the safety margin, Kalibre Engine opens no new trades. At one safety margin, it closes its own positions.</li>
  <li><b>Challenge dashboard</b> {et("plan", dil)}<br>Distance to the daily and total floor, progress to the profit target and trading days, in your browser.</li>
  <li><b>Weekly rule and mistake report</b> {et("plan", dil)}<br>Which trades broke a rule or came close, losses after days near the floor, oversized positions.</li>
</ul>

<h2 id="how-it-connects">How it connects</h2>
<p>Rule Guard runs as an Expert Advisor in your MT5 terminal. For the dashboard and report, the Kalibre Bridge add-on sends your account data to your browser, encrypted. You don't give us your MT5 password. Details are on the <a href="/security">security page</a>.</p>
<p>To check past days against your firm's limits now, drop your MT5 report into <a href="/mt5-analytics">Trade Analytics</a>.</p>
'''
        maddeler = ["4 firm presets plus custom limits", "Daily and total floors, reset at the firm's time", "Challenge dashboard and weekly report (planned)", "2 MT5 accounts per license"]
        sss = f'''
<h2 id="faq">Questions</h2>
<ul>
  <li><b>Does my firm allow EAs?</b> Check your firm's rules on EAs; some firms restrict them. Rule Guard runs as an Expert Advisor in MT5.</li>
  <li><b>Can it stop trades I open by hand?</b> No. It counts positions opened by hand or by another EA when it calculates the room left, but it cannot block those orders.</li>
  <li><b>Does it guarantee I pass?</b> No. It only tracks loss limits. Slippage and gaps can cause losses beyond the stop.</li>
  <li><b>Is Kalibre a prop firm?</b> No. Kalibre is not affiliated with any prop firm. Firm names are used only to describe their rules.</li>
</ul>
<div class="kutu">Kalibre is software and does not provide investment advice. Trading forex and CFDs on margin carries a high level of risk. You can lose all of the money you deposit. <a href="/risk-disclosure">Risk disclosure</a></div>
</div>'''
        sorular = (secim("firma", "Which firm are you taking a challenge with?", [("ftmo", "FTMO"), ("fundednext", "FundedNext"), ("fundingpips", "FundingPips"), ("the5ers", "The5ers"), ("topstep", "Topstep"), ("diger", "Other"), ("yok", "None yet")], "Choose")
                   + secim("sinav", "How many challenges did you buy in the last 12 months?", [("0", "0"), ("1", "1"), ("2-3", "2-3"), ("4-10", "4-10"), ("10+", "More than 10")], "Choose")
                   + metin("simdi", "How do you track your daily loss limit today?"))
        govde = bas + fiyat_kutusu(dil, "Rule Guard", maddeler, True) + sss + pencere(dil, sorular)
        sayfa("rule-guard/index.html", "Kalibre Rule Guard: prop firm loss limits on MT5", "Tracks your prop firm's daily and total loss limits on MT5, stops new trades near the floor and reports rule breaks weekly. Early access.", "", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=STIL, ek_betik='<script src="/static/talep.js" defer></script>', dil="en")

# ------------------------------------------------------------------ Trade Analytics (eski adı MT5 Analytics; adres /mt5-analytics, talep ölçümü aynı)
URUN_STIL = """
.urun-hero { display: grid; gap: 28px; margin: 8px 0 12px; }
.urun-gorsel { margin: 0; border: 1px solid var(--cizgi-2); border-radius: 10px; overflow: hidden; background: #0e1724; box-shadow: 0 18px 48px rgba(0,0,0,.35); }
.urun-gorsel img { display: block; width: 100%; height: auto; }
.urun-gorsel figcaption { font-size: 14px; color: var(--soluk); padding: 10px 14px; border-top: 1px solid var(--cizgi); }
.adimlar { list-style: none; counter-reset: adim; padding: 0; margin: 0 0 24px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
.adimlar li { counter-increment: adim; background: var(--zemin-2); border: 1px solid var(--cizgi); border-radius: 6px; padding: 16px 18px; }
.adimlar li::before { content: counter(adim, decimal-leading-zero); display: block; font: 600 13px var(--mono, monospace); color: var(--yesil); margin-bottom: 6px; }
.adimlar b { display: block; color: var(--metin); margin-bottom: 4px; }
.galeri { display: grid; gap: 28px; margin: 0 0 24px; }
.gizlilik-gercek { list-style: none; padding: 0; margin: 0 0 24px; display: grid; gap: 10px; }
.gizlilik-gercek li { padding-left: 22px; position: relative; }
.gizlilik-gercek li::before { content: ""; position: absolute; left: 0; top: .6em; width: 8px; height: 8px; border-radius: 2px; background: var(--yesil); }
.sentetik-not { font-size: 14px; color: var(--kehribar); }
@media (max-width: 760px) { .adimlar { grid-template-columns: 1fr; } }
"""

def gorsel(ad, alt, alt_yazi, dil, ilk=False):
    ek = "-tr" if dil == "tr" else ""
    yukle = 'fetchpriority="high"' if ilk else 'loading="lazy"'
    return f'''<figure class="urun-gorsel"><img src="/static/urun/analytics/{ad}{ek}.png" width="1440" height="900" alt="{alt}" {yukle} decoding="async"><figcaption>{alt_yazi}</figcaption></figure>'''

def mt5_analytics(dil):
    tr = dil == "tr"
    ornek = "/lab/analiz?ornek=1&dil=tr" if tr else "/lab/analiz?ornek=1"
    if tr:
        bas = f'''
<div data-talep-sayfa="mt5-analytics">
<h1>Kalibre Trade Analytics: nerede kazanıp nerede kaybettiğini gör</h1>
<p class="giris">MT5 geçmiş raporunu bırak. Sonuçlarını sembol, saat, gün, seans, işlem boyutu ve kayıptan sonraki işlemlere göre gör. Prop hesabında her günün kayıp sınırına ne kadar yaklaştığını kontrol et. Dosya tarayıcında okunur. Şu an beta.</p>
<div class="eylem-satir"><a class="dugme" href="{ornek}">Örnek veriyle dene</a><a class="dugme ikincil" href="#pricing" data-erken-erisim>Erken erişim al</a></div>
<div class="urun-hero">{gorsel("hero", "İşlem Analizi sayfası: yükleme alanı ve hesap özeti, sentetik örnek veriyle", "Sentetik örnek veri. Gerçek bir hesap değildir.", dil, True)}</div>

<h2 id="nasil-calisir">Nasıl çalışır</h2>
<ol class="adimlar">
  <li><b>Raporu al</b>MT5'te Geçmiş sekmesinde sağ tıkla, Rapor menüsünden HTML'i seç.</li>
  <li><b>Sayfaya bırak</b>Dosya tarayıcında okunur. Kurulum ya da hesap gerekmez.</li>
  <li><b>Kırılımları oku</b>Özet, dilimler, prop sınırları ve kendi kaydettiğin görünümler.</li>
</ol>

<h2 id="ne-gorursun">Ne görürsün</h2>
<div class="galeri">
{gorsel("overview", "Hesap özeti: net sonuç, kazanma oranı, kâr faktörü, azami düşüş ve bakiye eğrisi", "Hesap özeti: net sonuç, kazanma oranı, kâr faktörü, azami düşüş ve kapanan işlemlerle bakiye.", dil)}
{gorsel("insights", "En çok kazandıran ve kaybettiren dilimler", "Kazandıran ve kaybettiren dilimler: en az 20 işlemli gruplar, sonuca katkısına göre. Küçük farklar &quot;rastlantı olabilir&quot; diye işaretlenir.", dil)}
{gorsel("prop-limits", "Prop firması sınırları: tabana en yakın günler", "Prop sınırları: her gün günlük ve azami tabana ne kadar yaklaşıldığı. FTMO ve The5ers kural setleri ya da kendi yüzdelerin.", dil)}
{gorsel("custom-view", "Kendi görünümün: seansa göre net sonuç", "Kendi görünümün: istediğin alana göre grupla, ölçüyü seç, çubuk, çizgi ya da tablo olarak kaydet.", dil)}
</div>
<p class="sentetik-not">Görüntülerdeki tüm sayılar sentetik örnek veridir.</p>

<h2 id="ozellikler">Özellikler</h2>
<ul class="ozellik">
  <li><b>MT5 raporu, kendi tablon ve Kalibre Bridge</b> {et("var", dil)}<br>MT5 HTML ve Open XML raporları, şablonlu ya da sütun eşleştirmeli Excel ve CSV, Bridge'in 90 günlük işlem geçmişi.</li>
  <li><b>Dilimler ve kırılımlar</b> {et("var", dil)}<br>Sembol, açılış saati, gün, seans, yön, pozisyon süresi, işlem boyutu, önceki işlemin sonucu ve kayıp serisi.</li>
  <li><b>Prop sınırları</b> {et("var", dil)}<br>Kapanan işlemlerle bakiyeye göre günlük ve azami taban. Geçmiş raporu gün içi varlığı içermez.</li>
  <li><b>Kaydedilen görünümler</b> {et("var", dil)}<br>Görünümler bu tarayıcıda saklanır.</li>
  <li><b>Replay</b> {et("plan", dil)}<br>Kendi MT5 geçmişinde mum mum ilerle.</li>
  <li><b>Haftalık rapor</b> {et("plan", dil)}<br>Her hafta en çok kaybettiren dilimler ve kural yakınlığı.</li>
</ul>

<h2 id="gizlilik">Verine ne olur</h2>
<ul class="gizlilik-gercek">
  <li>Rapor ya da tablo dosyası tarayıcında okunur ve Kalibre sunucularına gönderilmez.</li>
  <li>Rapor başlığından yalnız hesap para birimi okunur. Hesap numaran ve adın okunmaz, saklanmaz.</li>
  <li>Kaydettiğin görünümler bu tarayıcıda saklanır ve işlemlerini içermez.</li>
  <li>Kalibre Bridge kullanırsan veri MT5'ten tarayıcına şifreli gelir. Ayrıntılar <a href="/tr/security">güvenlik sayfasında</a>.</li>
</ul>

<h2 id="kendi-kaydin">Kendi işlem kaydını içe aktar</h2>
<p>İşlemlerini Excel'de ya da başka bir tabloda tutuyorsan şablonu indir, her kapanmış işlemi bir satıra yaz ve dosyayı İşlem Analizi sayfasına bırak. Aynı analizler çalışır.</p>
<ul>
  <li><b>Zorunlu sütunlar:</b> open_time, close_time, symbol, side (buy ya da sell), volume, open_price, close_price, profit (komisyon ve swap hariç).</li>
  <li><b>İsteğe bağlı:</b> commission, swap, stop_loss, take_profit, utc_offset, account_currency, ticket, row_type (deposit, withdrawal), strategy, tag, note.</li>
  <li>Okunamayan her satır, satır numarası ve nedeniyle listelenir. Formüller çalıştırılmaz.</li>
</ul>
<div class="eylem-satir"><a class="dugme ikincil" href="/lab/sablon/kalibre-trade-log-template.xlsx" download>Şablonu indir (Excel)</a><a class="dugme ikincil" href="/lab/sablon/kalibre-trade-log-template.csv" download>Şablonu indir (CSV)</a></div>
'''
        maddeler = ["MT5 raporu, Excel/CSV ve Kalibre Bridge", "Dilimler, kırılımlar ve prop sınırları", "Kaydedilen görünümler", "Replay ve haftalık rapor (planlanıyor)"]
        sss = '''
<h2 id="sss">Sık sorulanlar</h2>
<ul>
  <li><b>Hangi aracı kurumlarla çalışır?</b> MetaTrader 5 raporu veren her aracı kurumla. MT4 raporları henüz desteklenmiyor.</li>
  <li><b>Prop sınırları gerçek ihlali gösterir mi?</b> Tam değil. Geçmiş raporunda açık pozisyonun gün içi zararı yoktur. Sayfa yalnız kapanan işlemlerle bakiyeyi ölçer. Gerçek ihlal daha erken olmuş olabilir.</li>
  <li><b>Bu bir tavsiye mi?</b> Hayır. Sayfa geçmiş işlemlerini betimler. Ne yapman gerektiğini söylemez.</li>
</ul>
<div class="kutu">Sonuçlar geçmiş işlemlerin betimlemesidir ve gelecekteki sonuçların göstergesi değildir. Kalibre bir yazılımdır ve yatırım tavsiyesi vermez. <a href="/tr/risk-disclosure">Risk bildirimi</a></div>
</div>'''
        sorular = (secim("platform", "Hangi platformda işlem yapıyorsun?", [("mt5", "MetaTrader 5"), ("mt4", "MetaTrader 4"), ("ctrader", "cTrader"), ("tradingview", "TradingView"), ("diger", "Başka")], "Seç")
                   + secim("simdi", "Hesabını şu an neyle analiz ediyorsun?", [("myfxbook", "Myfxbook"), ("fxblue", "FX Blue"), ("gunluk", "Bir işlem günlüğü uygulaması"), ("tablo", "Tablo"), ("hicbiri", "Hiçbiri"), ("diger", "Başka")], "Seç")
                   + metin("odeme", "Para ödeyerek çözmek istediğin tek şey ne?"))
        govde = bas + fiyat_kutusu(dil, "Trade Analytics", maddeler, False) + sss + pencere(dil, sorular)
        sayfa("tr/mt5-analytics/index.html", "Kalibre Trade Analytics: MT5 işlemlerinde nerede kazanıp kaybettiğini gör", "MT5 geçmiş raporunu bırak; sembol, saat, seans, işlem boyutu ve kayıptan sonraki işlemlere göre sonuçlarını ve prop sınırlarını gör. Dosya tarayıcında okunur.", "", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=STIL + URUN_STIL, ek_betik='<script src="/static/talep.js" defer></script>', dil="tr")
    else:
        bas = f'''
<div data-talep-sayfa="mt5-analytics">
<h1>Kalibre Trade Analytics: see where you make and lose money</h1>
<p class="giris">Drop in your MT5 history report. See your results by symbol, hour, weekday, session, trade size and the trade after a loss. On a prop account, check how close each day came to the loss limits. The file is read in your browser. In beta.</p>
<div class="eylem-satir"><a class="dugme" href="{ornek}">Try it with sample data</a><a class="dugme ikincil" href="#pricing" data-erken-erisim>Get early access</a></div>
<div class="urun-hero">{gorsel("hero", "Trade Analytics page: upload area and account overview with synthetic sample data", "Synthetic sample data. Not a real account.", dil, True)}</div>

<h2 id="how-it-works">How it works</h2>
<ol class="adimlar">
  <li><b>Export your report</b>In MT5, right-click the History tab and choose Report, then HTML.</li>
  <li><b>Drop it in</b>The file is read in your browser. No install, no account.</li>
  <li><b>Read the breakdowns</b>Overview, segments, prop limits and views you save.</li>
</ol>

<h2 id="what-you-see">What you see</h2>
<div class="galeri">
{gorsel("overview", "Account overview: net result, win rate, profit factor, max drawdown and balance curve", "Account overview: net result, win rate, profit factor, max drawdown and balance from closed trades.", dil)}
{gorsel("insights", "Biggest winning and losing segments", "Winning and losing segments: groups with at least 20 trades, ranked by their effect on the result. Small differences are marked &quot;may be noise&quot;.", dil)}
{gorsel("prop-limits", "Prop firm limits: the days closest to a floor", "Prop limits: how close each day came to the daily and max floors. FTMO and The5ers rule sets, or your own percentages.", dil)}
{gorsel("custom-view", "Your own view: net result by session", "Your own view: group by any field, pick a measure, save it as a bar chart, line chart or table.", dil)}
</div>
<p class="sentetik-not">All numbers in these screenshots are synthetic sample data.</p>

<h2 id="features">Features</h2>
<ul class="ozellik">
  <li><b>MT5 report, your own spreadsheet and Kalibre Bridge</b> {et("var", dil)}<br>MT5 HTML and Open XML reports, Excel and CSV with the template or column mapping, and 90 days of trade history from the Bridge.</li>
  <li><b>Segments and breakdowns</b> {et("var", dil)}<br>Symbol, open hour, weekday, session, direction, holding time, trade size, previous trade result and losing streak.</li>
  <li><b>Prop limits</b> {et("var", dil)}<br>Daily and max floors from closed-trade balance. A history report has no intraday equity.</li>
  <li><b>Saved views</b> {et("var", dil)}<br>Views are stored in this browser.</li>
  <li><b>Replay</b> {et("plan", dil)}<br>Step through your own MT5 history candle by candle.</li>
  <li><b>Weekly report</b> {et("plan", dil)}<br>Your biggest losing segments and limit proximity, every week.</li>
</ul>

<h2 id="your-data">What happens to your data</h2>
<ul class="gizlilik-gercek">
  <li>The report or spreadsheet file is read in your browser and is not sent to Kalibre servers.</li>
  <li>Only the account currency is read from the report header. Your account number and name are not read or stored.</li>
  <li>Saved views stay in this browser and do not contain your trades.</li>
  <li>If you use Kalibre Bridge, data travels from MT5 to your browser encrypted. Details are on the <a href="/security">security page</a>.</li>
</ul>

<h2 id="import-your-log">Import your own trade log</h2>
<p>If you keep your trades in Excel or another spreadsheet, download the template, write one closed trade per row and drop the file into Trade Analytics. The same analysis runs on it.</p>
<ul>
  <li><b>Required columns:</b> open_time, close_time, symbol, side (buy or sell), volume, open_price, close_price, profit (before commission and swap).</li>
  <li><b>Optional:</b> commission, swap, stop_loss, take_profit, utc_offset, account_currency, ticket, row_type (deposit, withdrawal), strategy, tag, note.</li>
  <li>Every row that cannot be read is listed with its row number and the reason. Formulas are not run.</li>
</ul>
<div class="eylem-satir"><a class="dugme ikincil" href="/lab/sablon/kalibre-trade-log-template.xlsx" download>Download template (Excel)</a><a class="dugme ikincil" href="/lab/sablon/kalibre-trade-log-template.csv" download>Download template (CSV)</a></div>
'''
        maddeler = ["MT5 report, Excel/CSV and Kalibre Bridge", "Segments, breakdowns and prop limits", "Saved views", "Replay and weekly report (planned)"]
        sss = '''
<h2 id="faq">Questions</h2>
<ul>
  <li><b>Which brokers does it work with?</b> Any broker whose MetaTrader 5 terminal exports reports. MT4 reports are not supported yet.</li>
  <li><b>Do the prop limits show a real breach?</b> Not exactly. A history report has no intraday loss on open positions, so the page measures closed-trade balance only. A real breach may have happened earlier.</li>
  <li><b>Is this advice?</b> No. The page describes your past trades. It does not tell you what to do.</li>
</ul>
<div class="kutu">Results describe past trades and do not indicate future results. Kalibre is software and does not provide investment advice. <a href="/risk-disclosure">Risk disclosure</a></div>
</div>'''
        sorular = (secim("platform", "Which platform do you trade on?", [("mt5", "MetaTrader 5"), ("mt4", "MetaTrader 4"), ("ctrader", "cTrader"), ("tradingview", "TradingView"), ("diger", "Other")], "Choose")
                   + secim("simdi", "What do you use to analyse your account today?", [("myfxbook", "Myfxbook"), ("fxblue", "FX Blue"), ("gunluk", "A trading journal app"), ("tablo", "A spreadsheet"), ("hicbiri", "Nothing"), ("diger", "Other")], "Choose")
                   + metin("odeme", "What is the one thing you would pay to solve?"))
        govde = bas + fiyat_kutusu(dil, "Trade Analytics", maddeler, False) + sss + pencere(dil, sorular)
        sayfa("mt5-analytics/index.html", "Kalibre Trade Analytics: see where you make and lose money on MT5", "Drop in your MT5 history report and see results by symbol, hour, session, trade size and the trade after a loss, plus prop firm limits. The file is read in your browser.", "", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=STIL + URUN_STIL, ek_betik='<script src="/static/talep.js" defer></script>', dil="en")

for d in ("en", "tr"):
    rule_guard(d)
    mt5_analytics(d)
