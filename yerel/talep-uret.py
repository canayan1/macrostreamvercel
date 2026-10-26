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

# ------------------------------------------------------------------ MT5 Analytics
def mt5_analytics(dil):
    tr = dil == "tr"
    if tr:
        bas = f'''
<div data-talep-sayfa="mt5-analytics">
<h1>Tarayıcıda MT5 hesap analizi ve backtest</h1>
<p class="giris">MetaTrader 5 hesabını salt okuma olarak bağla, bakiyeni, pozisyonlarını ve kapanmış işlemlerini bir panelde gör, kendi kurallarını kendi MT5 fiyat geçmişinde test et. Şu an erken erişimde.</p>
<div class="eylem-satir"><a class="dugme" href="#pricing" data-erken-erisim>Erken erişim al</a><a class="dugme ikincil" href="/lab/panom?dil=tr">Örnek paneli aç</a></div>

<h2 id="ne-yapar">Ne yapar</h2>
<ul class="ozellik">
  <li><b>Hesap paneli</b> {et("var", dil)}<br>Bakiye, varlık, açık pozisyonlar, takip ettiğin semboller ve son 90 günün kapanmış işlemleri.</li>
  <li><b>MT5 verinde backtest</b> {et("var", dil)}<br>Kuralı bloklarla ya da formla kur, terminalinden gelen mumlarda Hızlı Backtest çalıştır.</li>
  <li><b>Aşırı uyum kontrolleri</b> {et("var", dil)}<br>Eğitim ve test dönemi, backtest aşırı uyum olasılığı (PBO), düzeltilmiş Sharpe oranı ve yürüyen ileri analiz.</li>
  <li><b>Replay</b> {et("plan", dil)}<br>Kendi MT5 geçmişinde mum mum ilerle ve girişleri dene.</li>
  <li><b>İşlem incelemesi</b> {et("plan", dil)}<br>Sembole, saate ve kuruluma göre nerede para kaybettiğin.</li>
</ul>

<h2 id="baglanti">Nasıl bağlanır</h2>
<p>Kalibre Bridge eklentisi MT5 terminalinde çalışır ve hesap verisini şifreli olarak tarayıcına taşır. Salt okumadır, emir göndermez. MT5 şifreni bize vermezsin. Ayrıntılar <a href="/tr/security">güvenlik sayfasında</a>.</p>
'''
        maddeler = ["Hesap paneli ve 90 günlük işlem geçmişi", "Kendi MT5 verinde backtest ve optimizasyon", "Replay ve işlem incelemesi (planlanıyor)", "Lisans başına 2 MT5 hesabı"]
        sss = '''
<h2 id="sss">Sık sorulanlar</h2>
<ul>
  <li><b>Hangi aracı kurumlarla çalışır?</b> MetaTrader 5 sunan her aracı kurumla. MT4 desteklenmiyor.</li>
  <li><b>Hesabımda işlem açar mı?</b> Hayır. Kalibre Bridge yalnız okur.</li>
  <li><b>Verim nerede işlenir?</b> Panel ve backtest tarayıcında çalışır. Sunucu yalnız şifreli paketleri en çok 2 saat tutar.</li>
</ul>
<div class="kutu">Backtest sonuçları varsayımsaldır ve gerçek işlemleri yansıtmaz. Kalibre bir yazılımdır ve yatırım tavsiyesi vermez. <a href="/tr/risk-disclosure">Risk bildirimi</a></div>
</div>'''
        sorular = (secim("platform", "Hangi platformda işlem yapıyorsun?", [("mt5", "MetaTrader 5"), ("mt4", "MetaTrader 4"), ("ctrader", "cTrader"), ("tradingview", "TradingView"), ("diger", "Başka")], "Seç")
                   + secim("simdi", "Hesabını şu an neyle analiz ediyorsun?", [("myfxbook", "Myfxbook"), ("fxblue", "FX Blue"), ("gunluk", "Bir işlem günlüğü uygulaması"), ("tablo", "Tablo"), ("hicbiri", "Hiçbiri"), ("diger", "Başka")], "Seç")
                   + metin("odeme", "Para ödeyerek çözmek istediğin tek şey ne?"))
        govde = bas + fiyat_kutusu(dil, "MT5 Analytics", maddeler, False) + sss + pencere(dil, sorular)
        sayfa("tr/mt5-analytics/index.html", "Tarayıcıda MT5 hesap analizi ve backtest: Kalibre", "MT5 hesabını salt okuma bağla, panelde gör ve kendi kurallarını kendi MT5 verinde test et. Erken erişim.", "", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=STIL, ek_betik='<script src="/static/talep.js" defer></script>', dil="tr")
    else:
        bas = f'''
<div data-talep-sayfa="mt5-analytics">
<h1>MT5 account analytics and backtesting in your browser</h1>
<p class="giris">Connect your MetaTrader 5 account read-only, see your balance, positions and closed trades in one dashboard, and test your own rules on your own MT5 price history. It is in early access.</p>
<div class="eylem-satir"><a class="dugme" href="#pricing" data-erken-erisim>Get early access</a><a class="dugme ikincil" href="/lab/panom">Open the sample dashboard</a></div>

<h2 id="what-it-does">What it does</h2>
<ul class="ozellik">
  <li><b>Account dashboard</b> {et("var", dil)}<br>Balance, equity, open positions, the symbols you follow and the last 90 days of closed trades.</li>
  <li><b>Backtest on your MT5 data</b> {et("var", dil)}<br>Build a rule with blocks or a form and run Quick Backtest on candles from your terminal.</li>
  <li><b>Overfitting checks</b> {et("var", dil)}<br>Training and test periods, probability of backtest overfitting (PBO), deflated Sharpe ratio and walk-forward analysis.</li>
  <li><b>Replay</b> {et("plan", dil)}<br>Step through your own MT5 history candle by candle and practise entries.</li>
  <li><b>Trade review</b> {et("plan", dil)}<br>Where you lose money, by symbol, hour and setup.</li>
</ul>

<h2 id="how-it-connects">How it connects</h2>
<p>The Kalibre Bridge add-on runs in your MT5 terminal and sends your account data to your browser, encrypted. It is read-only and places no orders. You don't give us your MT5 password. Details are on the <a href="/security">security page</a>.</p>
'''
        maddeler = ["Account dashboard and 90 days of trade history", "Backtest and optimization on your own MT5 data", "Replay and trade review (planned)", "2 MT5 accounts per license"]
        sss = '''
<h2 id="faq">Questions</h2>
<ul>
  <li><b>Which brokers does it work with?</b> Any broker that offers MetaTrader 5. MT4 is not supported.</li>
  <li><b>Does it place trades on my account?</b> No. Kalibre Bridge only reads.</li>
  <li><b>Where is my data processed?</b> The dashboard and backtests run in your browser. Our server holds only encrypted packets, for at most 2 hours.</li>
</ul>
<div class="kutu">Backtest results are hypothetical and do not reflect actual trading. Kalibre is software and does not provide investment advice. <a href="/risk-disclosure">Risk disclosure</a></div>
</div>'''
        sorular = (secim("platform", "Which platform do you trade on?", [("mt5", "MetaTrader 5"), ("mt4", "MetaTrader 4"), ("ctrader", "cTrader"), ("tradingview", "TradingView"), ("diger", "Other")], "Choose")
                   + secim("simdi", "What do you use to analyse your account today?", [("myfxbook", "Myfxbook"), ("fxblue", "FX Blue"), ("gunluk", "A trading journal app"), ("tablo", "A spreadsheet"), ("hicbiri", "Nothing"), ("diger", "Other")], "Choose")
                   + metin("odeme", "What is the one thing you would pay to solve?"))
        govde = bas + fiyat_kutusu(dil, "MT5 Analytics", maddeler, False) + sss + pencere(dil, sorular)
        sayfa("mt5-analytics/index.html", "MT5 account analytics and backtesting: Kalibre", "Connect your MT5 account read-only, see it in a dashboard and test your own rules on your own MT5 data. Early access.", "", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=STIL, ek_betik='<script src="/static/talep.js" defer></script>', dil="en")

for d in ("en", "tr"):
    rule_guard(d)
    mt5_analytics(d)
