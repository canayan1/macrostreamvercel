# Yeni ana sayfa (TR + EN). Ortak üst bar ve alt bilgi sayfa-uret.py'den gelir.
#
# Kullanım:
#   python3 ana-yeni-uret.py            → site-wt/yeni-ana/ (hazırlık önizlemesi, noindex)
#   python3 ana-yeni-uret.py --canli    → site-wt/index.html ve site-wt/en/index.html (asıl ana sayfa)
import os, re, sys
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

CANLI = "--canli" in sys.argv
TR_YOL, EN_YOL = ("/", "/en/") if CANLI else ("/yeni-ana/", "/yeni-ana/en/")

def akis_svg(t):
    """Veri akışı şeması: kaynaklar tarayıcıya akar; Kalibre sunucusu akışın dışında."""
    kaynaklar = [("MetaTrader 5", t["mt5_alt"], 60), ("Alpaca", t["alpaca_alt"], 150), ("Tradier", t["tradier_alt"], 240), ("CSV", t["csv_alt"], 330)]
    k = ""
    for ad, alt, y in kaynaklar:
        k += f'<g class="kaynak"><rect x="10" y="{y-30}" width="170" height="60" rx="8"/><text x="26" y="{y-4}">{ad}</text><text class="alt" x="26" y="{y+15}">{alt}</text></g>'
    yollar = (
        '<path class="yol role" d="M180 60 C 230 60, 230 432, 300 432"/>'
        '<path class="yol role" d="M420 432 C 470 432, 470 205, 470 205"/>'
        '<path class="yol" d="M180 150 C 300 150, 360 175, 470 175"/>'
        '<path class="yol" d="M180 240 C 300 240, 360 230, 470 230"/>'
        '<path class="yol" d="M180 330 C 300 330, 380 280, 470 280"/>'
    )
    tarayici = (
        f'<g class="tarayici"><rect class="dis" x="470" y="110" width="250" height="230" rx="10"/>'
        f'<g transform="translate(492 136)"><rect x="0" y="6" width="16" height="12" rx="2" fill="#1f7a5c"/>'
        f'<path d="M3 6 V3 a5 5 0 0 1 10 0 V6" fill="none" stroke="#1f7a5c" stroke-width="2"/></g>'
        f'<text x="518" y="150">{t["tarayici"]}</text>'
        + "".join(f'<text class="satir" x="492" y="{186 + i*26}">{s}</text>' for i, s in enumerate(t["tarayici_satir"]))
        + '</g>'
    )
    sunucu = (
        f'<g class="sunucu"><rect x="300" y="400" width="120" height="64" rx="8"/>'
        f'<text class="baslik" x="312" y="424">{t["sunucu"]}</text>'
        f'<text x="312" y="444">{t["sunucu_alt"]}</text></g>'
    )
    etiket = f'<text class="etiket" x="196" y="390">{t["role_etiket"]}</text>'
    return (f'<svg class="akis" viewBox="0 0 730 480" role="img" aria-labelledby="akis-baslik akis-aciklama">'
            f'<title id="akis-baslik">{t["akis_baslik"]}</title><desc id="akis-aciklama">{t["akis_aciklama"]}</desc>'
            f'{yollar}{k}{tarayici}{sunucu}{etiket}</svg>')

def akis_liste(t):
    """Dar ekranda şemanın alt etiketleri okunmaz; aynı bilgiyi alt alta liste olarak verir."""
    m = [("MetaTrader 5", t["mt5_alt"] + "; " + t["role_etiket"]), ("Alpaca", t["alpaca_alt"]),
         ("Tradier", t["tradier_alt"]), ("CSV", t["csv_alt"]),
         (t["tarayici"], ", ".join(t["tarayici_satir"])), (t["sunucu"], t["sunucu_alt"])]
    return '<ul class="akis-liste">' + "".join(f"<li><b>{a}</b> {b}</li>" for a, b in m) + "</ul>"

METIN = {
 "tr": dict(
  title="Kalibre Lab (beta): stratejini kendi verinle sına, riski sen kontrol et",
  desc="Kalibre Lab (beta), MetaTrader 5, Alpaca ve Tradier hesabındaki kendi verinle stratejini kurup maliyetli test etmeni ve aşırı uyuma karşı optimize etmeni sağlar. Verin sende kalır. Yatırım tavsiyesi değildir.",
  h1="Kendi stratejini, kendi verinle sına. Risk önce.",
  giris="Kalibre Lab, aracı kurum hesabındaki veriyle kural kurmanı, maliyetleri hesaba katarak test etmeni ve sonucun şans mı yoksa sağlam mı olduğunu görmeni sağlar. Verin sende kalır: MetaTrader 5 verisi şifreli gelir, Alpaca ve Tradier anahtarların yalnız tarayıcında durur. Kararı sen verirsin; biz sinyal satmayız.",
  b1="MetaTrader'ı bağla", b1u="/baglan", b2="Örnek veriyle dene", b2u="/lab/",
  not_="Kalibre Lab beta sürümündedir. Yatırım tavsiyesi değildir.",
  mt5_alt="Köprü eklentisiyle", alpaca_alt="ABD hisse ve kripto", tradier_alt="ABD, kişisel kullanım", csv_alt="mum dosyası",
  tarayici="Senin tarayıcın", tarayici_satir=["Panom", "Strateji kurucu", "Test ve optimizasyon", "Anahtarlar burada kalır"],
  sunucu="Kalibre sunucusu", sunucu_alt="yalnız şifreli paket", role_etiket="MT5: AES-256, anahtar sende",
  akis_baslik="Verin nereden nereye gider", akis_aciklama="MetaTrader 5 verisi Kalibre sunucusundan şifreli olarak geçer ve yalnız tarayıcında açılır. Alpaca, Tradier ve CSV verisi sunucuya hiç uğramadan doğrudan tarayıcına gelir.",
  akis_not="Kalibre sunucusu MT5 paketlerini okuyamaz ve en geç iki saatte siler. Alpaca ve Tradier verisi sunucumuza hiç uğramaz.",
  ent_baslik="Bağlanabildiğin platformlar", ent_giris="Şu an dört kaynak var. Hepsinde veri senin hesabından gelir; Kalibre piyasa verisi yayınlamaz.",
  th=["Platform", "Ne gelir", "Nasıl bağlanır", "Anahtar nerede", "Durum"],
  satirlar=[
   ("MetaTrader 5", "Hesap, açık pozisyonlar, son 90 günün kapanmış işlemleri, Market Watch kurları, mumlar. Kalibre Motor kuralını kendi terminalinde çalıştırır.", "Kalibre Köprü eklentisi ve eşleştirme kodu", "Tarayıcında ve eklentinde; veri uçtan uca şifreli", "beta", "Beta"),
   ("Alpaca", "Hesap, pozisyonlar, işlemler, izleme listesi, ABD hisse ve kripto mumları (ücretsiz planda IEX verisi). Paper ya da canlı hesap.", "Kendi API anahtarın", "Yalnız tarayıcında; istekler doğrudan Alpaca'ya", "beta", "Beta"),
   ("Tradier", "Hesap, pozisyonlar, işlemler, izleme listesi, ABD hisse mumları. Tradier'in şartları gereği kişisel kullanım.", "Kendi erişim token'ın", "Yalnız tarayıcında; istekler doğrudan Tradier'e", "beta", "Beta"),
   ("CSV", "Mum dosyası: MT5'ten dışa aktarılan ya da başka bir kaynaktan. Aracı kurum işlem geçmişi (Robinhood, Schwab, IBKR dışa aktarımları) yakında.", "Dosyayı sürükle bırak", "Dosya bilgisayarından çıkmaz", "beta", "Beta"),
  ],
  marka_not="MetaTrader, MetaQuotes Ltd.'nin; Alpaca, Alpaca Markets'in; Tradier, Tradier Inc.'in markasıdır. Robinhood, Schwab ve IBKR adları yalnız dosya biçimini tanımlamak için geçer. Kalibre bu şirketlerle bağlantılı değildir.",
  gos_baslik="Çalışırken gör", gos_giris="Aşağıdaki iki pano laboratuvarın gerçek modülleriyle, senin tarayıcında hesaplanıyor. Veri SENTETİK: gerçek bir hesap ya da piyasa değil.",
  panom_baslik="Panom", panom_alt="Bağladığın hesabın özeti: bakiye, kurlar, kapanmış işlemler.",
  bakiye="Bakiye", varlik="Varlık", net="Kapanan işlemler, net", egri="Bakiye eğrisi",
  panom_dugme="Panom'u örnek veriyle aç", panom_url="/lab/panom.html",
  opt_baslik="Optimizasyon", opt_alt="EMA trend örneğinde hızlı ve yavaş ortalama taranır: 36 ayar, 1.500 mum. Hücre rengi eğitim döneminin puanı.",
  seri="Örnek seri", spread="İşlem başına spread",
  eksen_x="Hızlı ortalama", eksen_y="satırlar: yavaş ortalama",
  en_ayar="Eğitimde en yüksek puanlı ayar", egitim="Eğitim getirisi", sinama="Sınama getirisi",
  opt_dugme="Optimizasyonu laboratuvarda aç", opt_url="/lab/optimizasyon.html",
  dipnot="Simülasyon sonuçlarının doğasında sınırlar vardır: gerçek işlemleri temsil etmez, geçmiş veriye bakarak sonradan seçilmiştir ve hiçbir hesabın benzer sonuç elde edeceği iddia edilmez. Ayarı sen seçersin; Kalibre bir ayar önermez.",
  hata="Gösterim yüklenemedi. Laboratuvarı doğrudan açabilirsin.",
  adim_baslik="Nasıl çalışır", adimlar=[
   ("Bağlan", "MetaTrader 5, Alpaca ya da Tradier hesabını bağla. Şifre istemez.", "/baglan", "Bağlanma sayfası"),
   ("Hesabını gör", "Panom'da bakiye, kurlar, açık pozisyonlar ve kapanmış işlemler.", "/lab/panom.html", "Panom"),
   ("Kuralını kur", "Basit modda bloklarla ya da ileri modda formla.", "/lab/", "Strateji kurucu"),
   ("Maliyetle test et", "Hızlı prova brüt ve net sonucu ayrı gösterir.", "/lab/", "Hızlı prova"),
   ("Optimize et", "Eğitim ve sınama ayrı; komşuluk ve şans düzeltmesiyle.", "/lab/optimizasyon.html", "Optimizasyon"),
   ("Demoda çalıştır", "Kalibre Motor ve prop kalkanıyla, önce demo hesapta.", "/prop/", "Prop kalkanı"),
  ],
  mod_baslik="Modüller", moduller=[
   ("Panom", "Hesabın, kurların, açık pozisyonların ve kapanmış işlemlerin; kâr faktörü, kazanma oranı, gerçekleşmiş düşüş.", "/lab/panom.html"),
   ("Strateji kurucu", "Basit modda tarif gibi bloklar, ileri modda tam form; ikisi aynı kuralı düzenler.", "/lab/"),
   ("Hızlı prova", "Kuralı kendi mumlarında saniyeler içinde dener; spread, komisyon ve kayma ekleyebilirsin.", "/lab/"),
   ("Optimizasyon", "Eğitim ve sınama dönemi, komşu ayarlar, şans düzeltmesi ve prop kural filtresi.", "/lab/optimizasyon.html"),
   ("Prop kalkanı", "Günlük ve toplam kayıp sınırlarını her tikte izler, lotu sınıra göre küçültür.", "/prop/"),
   ("Oynaklık laboratuvarı", "EWMA, Yang-Zhang ve GARCH ile oynaklığın ne zaman kümelendiğini görürsün.", "/lab/oynaklik.html"),
  ],
  guv_baslik="Sunucumuz ne görür, ne göremez", guv_giris="MetaTrader 5 verisi bilgisayarından şifreli çıkar ve yalnız senin tarayıcında açılır. Ayrıntılar güvenlik sayfasında.", guv_url="/guvenlik/", guv_link="Güvenlik",
  gorur_baslik="Sunucumuzun gördüğü", gorur=["Okunamayan, şifreli paketler", "Paketlerin boyutu ve geliş zamanı", "Rastgele görünen bir kanal numarası"],
  gormez_baslik="Sunucumuzun göremediği", gormez=["Hangi sembolü izlediğin ve fiyatlar", "Pozisyonların, bakiyen, kâr ve zararın", "Hesap numaran ve şifren", "Eşleştirme kodun, Alpaca ve Tradier anahtarların"],
  fiyat_baslik="Fiyat", fiyat="399 TL", fiyat_alt="/ ay, ya da 19 USD, 17 EUR", fiyat_not="Beta süresince fiyat aynıdır. İndirim kodu olan ilk testçiler kodlarını ödeme sayfasında girer.", fiyat_dugme="Aboneliği incele", fiyat_url="/pro/",
  beta_baslik="Beta ve risk", beta="Kalibre Lab beta sürümündedir: özellikler değişebilir ve hata içerebilir. Testler simülasyondur. Kaldıraçlı işlemler yatırdığın paranın tamamını kaybetmene yol açabilir. Kalibre Motor'u gerçek hesapta kullanmadan önce demo hesapta dene.",
  risk_link="Risk bildirimini oku", risk_url="/risk-bildirimi/", beta_link="Beta hakkında", beta_url="/beta/",
 ),
 "en": dict(
  title="Kalibre Lab (beta): test your strategy on your own data, keep risk in your hands",
  desc="Kalibre Lab (beta) lets you build a strategy on your own MetaTrader 5, Alpaca or Tradier data, test it with costs and optimise it with overfitting checks. Your data stays with you. Not investment advice.",
  h1="Test your own strategy on your own data. Risk first.",
  giris="Kalibre Lab lets you build rules on your broker account's data, test them with costs included and see whether a result is robust or luck. Your data stays with you: MetaTrader 5 data arrives encrypted, and your Alpaca and Tradier keys stay in your browser. You make the decisions; we never sell signals.",
  b1="Connect MetaTrader", b1u="/en/connect", b2="Try it on sample data", b2u="/en/lab/",
  not_="Kalibre Lab is in beta. Not investment advice.",
  mt5_alt="via the Bridge add-on", alpaca_alt="US stocks and crypto", tradier_alt="US, personal use", csv_alt="candle file",
  tarayici="Your browser", tarayici_satir=["Dashboard", "Strategy builder", "Testing and optimisation", "Your keys stay here"],
  sunucu="Kalibre server", sunucu_alt="encrypted packets only", role_etiket="MT5: AES-256, you hold the key",
  akis_baslik="Where your data goes", akis_aciklama="MetaTrader 5 data passes through the Kalibre server encrypted and opens only in your browser. Alpaca, Tradier and CSV data come straight to your browser without touching the server.",
  akis_not="The Kalibre server cannot read MT5 packets and deletes them within two hours. Alpaca and Tradier data never touch our server.",
  ent_baslik="Platforms you can connect", ent_giris="There are four sources today. In every case the data comes from your own account; Kalibre does not publish market data.",
  th=["Platform", "What you get", "How it connects", "Where the key lives", "Status"],
  satirlar=[
   ("MetaTrader 5", "Account, open positions, closed trades from the last 90 days, Market Watch quotes, candles. Kalibre Engine runs your rule in your own terminal.", "Kalibre Bridge add-on and a pairing code", "In your browser and the add-on; data end-to-end encrypted", "beta", "Beta"),
   ("Alpaca", "Account, positions, trades, watchlist, US stock and crypto candles (IEX data on the free plan). Paper or live account.", "Your own API key", "Only in your browser; requests go straight to Alpaca", "beta", "Beta"),
   ("Tradier", "Account, positions, trades, watchlist, US stock candles. Personal use, per Tradier's terms.", "Your own access token", "Only in your browser; requests go straight to Tradier", "beta", "Beta"),
   ("CSV", "Candle files, exported from MT5 or another source. Broker trade history (Robinhood, Schwab, IBKR exports) coming soon.", "Drag and drop the file", "The file never leaves your computer", "beta", "Beta"),
  ],
  marka_not="MetaTrader is a trademark of MetaQuotes Ltd., Alpaca of Alpaca Markets and Tradier of Tradier Inc. Robinhood, Schwab and IBKR are named only to describe file formats. Kalibre is not affiliated with these companies.",
  gos_baslik="See it working", gos_giris="The two panels below run on the lab's real modules, computed in your browser. The data is SYNTHETIC: not a real account or market.",
  panom_baslik="Dashboard", panom_alt="A summary of a connected account: balance, quotes, closed trades.",
  bakiye="Balance", varlik="Equity", net="Closed trades, net", egri="Balance curve",
  panom_dugme="Open the dashboard with sample data", panom_url="/lab/panom.html?dil=en",
  opt_baslik="Optimisation", opt_alt="The EMA trend example scans the fast and slow averages: 36 settings, 1,500 candles. Cell colour is the training-period score.",
  seri="Sample series", spread="Spread per trade",
  eksen_x="Fast average", eksen_y="rows: slow average",
  en_ayar="Top-scoring setting in training", egitim="Training return", sinama="Test return",
  opt_dugme="Open optimisation in the lab", opt_url="/lab/optimizasyon.html?dil=en",
  dipnot="Simulated results have inherent limitations: they do not represent actual trading, they are selected with the benefit of hindsight, and no representation is made that any account will achieve similar results. You choose the setting; Kalibre does not recommend one.",
  hata="The demo could not load. You can open the lab directly.",
  adim_baslik="How it works", adimlar=[
   ("Connect", "Connect your MetaTrader 5, Alpaca or Tradier account. No password needed.", "/en/connect", "Connect page"),
   ("See your account", "Balance, quotes, open positions and closed trades in the dashboard.", "/lab/panom.html?dil=en", "Dashboard"),
   ("Build your rule", "With blocks in simple mode or the form in advanced mode.", "/en/lab/", "Strategy builder"),
   ("Test with costs", "The quick test shows gross and net results separately.", "/en/lab/", "Quick test"),
   ("Optimise", "Separate training and test periods, with neighbourhood and luck checks.", "/lab/optimizasyon.html?dil=en", "Optimisation"),
   ("Run on demo", "With Kalibre Engine and the prop shield, on a demo account first.", "/en/prop/", "Prop shield"),
  ],
  mod_baslik="Modules", moduller=[
   ("Dashboard", "Your account, quotes, open positions and closed trades; profit factor, win rate, realised drawdown.", "/lab/panom.html?dil=en"),
   ("Strategy builder", "Recipe-like blocks in simple mode, the full form in advanced mode; both edit the same rule.", "/en/lab/"),
   ("Quick test", "Runs the rule on your own candles in seconds; add spread, commission and slippage.", "/en/lab/"),
   ("Optimisation", "Training and test periods, neighbouring settings, a luck adjustment and a prop-rule filter.", "/lab/optimizasyon.html?dil=en"),
   ("Prop shield", "Watches daily and total loss limits on every tick and sizes lots to the limit.", "/en/prop/"),
   ("Volatility lab", "See when volatility clusters with EWMA, Yang-Zhang and GARCH.", "/lab/oynaklik.html?dil=en"),
  ],
  guv_baslik="What our server sees, and what it cannot", guv_giris="MetaTrader 5 data leaves your computer encrypted and opens only in your browser. Details are on the security page.", guv_url="/en/security/", guv_link="Security",
  gorur_baslik="What our server sees", gorur=["Unreadable, encrypted packets", "Packet size and arrival time", "A random-looking channel number"],
  gormez_baslik="What our server cannot see", gormez=["Which symbols you follow, and the prices", "Your positions, balance, profit and loss", "Your account number and password", "Your pairing code, Alpaca and Tradier keys"],
  fiyat_baslik="Price", fiyat="$19", fiyat_alt="/ month, or €17, 399 TL", fiyat_not="The price is the same during the beta. Early testers with a discount code enter it on the checkout page.", fiyat_dugme="See pricing", fiyat_url="/en/pricing/",
  beta_baslik="Beta and risk", beta="Kalibre Lab is in beta: features may change and may contain errors. Tests are simulations. Leveraged trading can lose you all of the money you deposit. Try Kalibre Engine on a demo account before using it on a real one.",
  risk_link="Read the risk disclosure", risk_url="/en/risk-disclosure/", beta_link="About the beta", beta_url="/en/beta/",
 ),
}

def govde(t):
    satirlar = "".join(
        f'<tr><th scope="row"><span class="marka-ad">{a}</span></th>'
        f'<td data-baslik="{t["th"][1]}">{b}</td><td data-baslik="{t["th"][2]}">{c}</td><td data-baslik="{t["th"][3]}">{d}</td>'
        f'<td data-baslik="{t["th"][4]}"><span class="durum-rozet {e}">{f}</span></td></tr>' for a, b, c, d, e, f in t["satirlar"])
    adimlar = "".join(f'<li><h3>{a}</h3><p>{b}</p><a href="{u}">{l}</a></li>' for a, b, u, l in t["adimlar"])
    moduller = "".join(f'<div><a href="{u}"><dt>{a}</dt><dd>{b}</dd></a></div>' for a, b, u in t["moduller"])
    li = lambda xs: "".join(f"<li>{x}</li>" for x in xs)
    sentetik = "SYNTHETIC" if t is METIN["en"] else "SENTETİK"
    return f'''<main>
<section class="giris-bolum">
  <div class="kap">
    <div>
      <h1>{t["h1"]}</h1>
      <p class="giris">{t["giris"]}</p>
      <div class="eylem"><a class="dugme" href="{t["b1u"]}">{t["b1"]}</a><a class="dugme ikincil" href="{t["b2u"]}">{t["b2"]}</a></div>
      <p class="not">{t["not_"]}</p>
    </div>
    <figure style="margin:0">
      {akis_svg(t)}
      {akis_liste(t)}
      <figcaption class="akis-not">{t["akis_not"]}</figcaption>
    </figure>
  </div>
</section>

<section class="bolum" id="entegrasyonlar">
  <div class="kap">
    <div class="bolum-bas"><h2>{t["ent_baslik"]}</h2><p>{t["ent_giris"]}</p></div>
    <table class="entegrasyon">
      <thead><tr>{"".join(f'<th scope="col">{h}</th>' for h in t["th"])}</tr></thead>
      <tbody>{satirlar}</tbody>
    </table>
    <p class="marka-not">{t["marka_not"]}</p>
  </div>
</section>

<section class="bolum" id="gosterim">
  <div class="kap">
    <div class="bolum-bas"><h2>{t["gos_baslik"]}</h2><p>{t["gos_giris"]}</p></div>
    <p data-hata hidden class="kutu">{t["hata"]}</p>
    <div class="gosterim">
      <section aria-labelledby="g-panom">
        <h3 id="g-panom">{t["panom_baslik"]}<span class="sentetik-rozet">{sentetik}</span></h3>
        <p class="alt-baslik">{t["panom_alt"]}</p>
        <div class="hesap-ozet">
          <div><b data-p="bakiye">-</b><span>{t["bakiye"]}</span></div>
          <div><b data-p="varlik">-</b><span>{t["varlik"]}</span></div>
          <div><b data-p="net">-</b><span>{t["net"]}</span></div>
        </div>
        <ul class="kur-listesi" data-p="kurlar"></ul>
        <div class="egri-kutu"><p class="egri-baslik">{t["egri"]}</p><canvas data-p="egri" aria-label="{t["egri"]}"></canvas></div>
        <p class="gosterim-dipnot" data-p="ozet"></p>
        <a class="dugme ikincil kucuk" href="{t["panom_url"]}">{t["panom_dugme"]}</a>
      </section>
      <section aria-labelledby="g-opt">
        <h3 id="g-opt">{t["opt_baslik"]}<span class="sentetik-rozet">{sentetik}</span></h3>
        <p class="alt-baslik">{t["opt_alt"]}</p>
        <div class="ayarlar">
          <label>{t["seri"]} <output data-deger="seri">1</output><input type="range" name="seri" min="1" max="12" step="1" value="3"></label>
          <label>{t["spread"]} <output data-deger="spread">-</output><input type="range" name="spread" min="0" max="3" step="1" value="0"></label>
        </div>
        <div class="isi-kutu"><canvas data-p="isi" aria-label="{t["opt_baslik"]}"></canvas></div>
        <div class="isi-eksen"><span>{t["eksen_x"]}</span><span>{t["eksen_y"]}</span></div>
        <div class="sonuc-satiri">
          <div><b data-p="ayar">-</b><span>{t["en_ayar"]}</span></div>
          <div><b data-p="egitim">-</b><span>{t["egitim"]}</span></div>
          <div><b data-p="sinama">-</b><span>{t["sinama"]}</span></div>
        </div>
        <p class="alt-baslik" data-p="etiket"></p>
        <ul class="gosterim-uyari" data-p="uyarilar" aria-live="polite"></ul>
        <a class="dugme ikincil kucuk" href="{t["opt_url"]}">{t["opt_dugme"]}</a>
      </section>
    </div>
    <p class="gosterim-dipnot">{t["dipnot"]}</p>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas"><h2>{t["adim_baslik"]}</h2></div>
    <ol class="adim-cizgisi">{adimlar}</ol>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas"><h2>{t["mod_baslik"]}</h2></div>
    <dl class="moduller">{moduller}</dl>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas"><h2>{t["guv_baslik"]}</h2><p>{t["guv_giris"]} <a href="{t["guv_url"]}">{t["guv_link"]}</a></p></div>
    <div class="gorur">
      <div class="evet"><h3>{t["gorur_baslik"]}</h3><ul>{li(t["gorur"])}</ul></div>
      <div class="hayir"><h3>{t["gormez_baslik"]}</h3><ul>{li(t["gormez"])}</ul></div>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="kap fiyat-bant">
    <div>
      <h2>{t["fiyat_baslik"]}</h2>
      <p class="fiyat-sayi">{t["fiyat"]} <span>{t["fiyat_alt"]}</span></p>
      <p class="not">{t["fiyat_not"]}</p>
      <a class="dugme" href="{t["fiyat_url"]}">{t["fiyat_dugme"]}</a>
    </div>
    <div class="beta-kutu">
      <h3>{t["beta_baslik"]}</h3>
      <p>{t["beta"]}</p>
      <p><a href="{t["risk_url"]}">{t["risk_link"]}</a>. <a href="{t["beta_url"]}">{t["beta_link"]}</a>.</p>
    </div>
  </div>
</section>
</main>'''

def sayfa_yaz(dil):
    t = METIN[dil]
    yol, diger = (EN_YOL, TR_YOL) if dil == "en" else (TR_YOL, EN_YOL)
    kanon = "https://kalibremarkets.com" + yol
    robots = '<meta name="robots" content="index, follow, max-image-preview:large">' if CANLI else '<meta name="robots" content="noindex">'
    html = f'''<!doctype html>
<html lang="{dil}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>{t["title"]}</title>
<meta name="description" content="{t["desc"]}">
<link rel="canonical" href="{kanon}">
<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com{TR_YOL}">
<link rel="alternate" hreflang="en" href="https://kalibremarkets.com{EN_YOL}">
{robots}
<meta property="og:title" content="{t["title"]}">
<meta property="og:description" content="{t["desc"]}">
<meta property="og:url" content="{kanon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kalibre Markets">
<meta property="og:locale" content="{"en_US" if dil == "en" else "tr_TR"}">
<meta property="og:image" content="https://kalibremarkets.com/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Kalibre Lab","applicationCategory":"FinanceApplication","operatingSystem":"Web, MetaTrader 5","url":"https://kalibremarkets.com","offers":{{"@type":"Offer","price":"19","priceCurrency":"USD"}}}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/site.css">
<link rel="stylesheet" href="/static/ana/ana.css">
<script src="/static/kalibre-cerez.js"></script>
<script src="/static/beta.js" defer></script>
<script src="/static/kalibre-auth.js" defer></script>
</head>
<body>

{ust(yol, dil, diger)}

{govde(t)}

{ALT_EN if dil == "en" else ALT}

<script type="module" src="/static/ana/gosterim.js"></script>
</body>
</html>
'''
    assert "—" not in html and "–" not in html, dil + ": uzun tire"
    hedef = os.path.join(KOK, yol.lstrip("/"), "index.html")
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    open(hedef, "w").write(re.sub(r'(href|content)="((?:https://kalibremarkets\.com)?/[^"?#]*?[^/"])/"', r'\1="\2"', html))
    print("yazıldı", os.path.relpath(hedef, KOK))

for d in ("tr", "en"):
    sayfa_yaz(d)
