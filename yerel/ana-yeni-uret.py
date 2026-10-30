# EMEKLİ (30.10.2026): ana sayfa artık yerel/pitch-uret.py ile üretiliyor (eski hazırlık ana sayfası).
import sys; sys.exit("Bu üretici emekli; ana sayfa için: python3 yerel/pitch-uret.py")
# Yeni ana sayfa (TR + EN). Ortak üst bar ve alt bilgi sayfa-uret.py'den gelir.
#
# Kullanım:
#   python3 ana-yeni-uret.py            → site-wt/yeni-ana/ (EN) ve yeni-ana/tr/ (TR), hazırlık önizlemesi, noindex
#   python3 ana-yeni-uret.py --canli    → site-wt/index.html (EN, kök) ve site-wt/tr/index.html (TR): asıl ana sayfa
import os, re, sys
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

CANLI = "--canli" in sys.argv
TR_YOL, EN_YOL = ("/tr", "/") if CANLI else ("/yeni-ana/tr", "/yeni-ana")

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
 "en": dict(
  title="Kalibre Lab (beta): strategy backtesting for MetaTrader 5, Alpaca and Tradier",
  desc="Connect your MetaTrader 5, Alpaca or Tradier account, build trading rules, backtest them with costs and optimize them with separate training and test periods. Not investment advice.",
  h1="Strategy backtesting for MetaTrader 5, Alpaca and Tradier accounts",
  giris="Connect your account, build a rule and see gross and net results on separate training and test periods. Kalibre does not sell signals.",
  b1="Connect MetaTrader 5", b1u="/connect", b2="Request beta access", b2u="mailto:markets@kalibrefin.com?subject=Kalibre%20Lab%20beta%20access",
  not_="Kalibre Lab is in beta. Software only. Not investment advice.",
  mt5_alt="Kalibre Bridge add-on", alpaca_alt="US stocks and crypto", tradier_alt="US stocks, personal use", csv_alt="candle file",
  tarayici="Your browser", tarayici_satir=["Dashboard", "Strategy Builder", "Backtest and optimization", "API keys stored here"],
  sunucu="Kalibre relay server", sunucu_alt="encrypted packets only", role_etiket="MT5: AES-256 end-to-end",
  akis_baslik="Data flow", akis_aciklama="MetaTrader 5 data passes through the Kalibre relay server encrypted and is decrypted only in your browser. Your browser requests Alpaca and Tradier data directly. CSV files are read locally.",
  akis_not="The relay server cannot decrypt MT5 packets and deletes them within 2 hours. Alpaca and Tradier requests do not pass through Kalibre servers.",
  ent_baslik="Integrations", ent_giris="Kalibre Lab connects to 4 sources. Data comes from your account or your files. Kalibre does not publish market data.",
  th=["Platform", "Data", "Connection", "Credentials", "Status"],
  satirlar=[
   ("MetaTrader 5", "Account, open positions, closed trades from the last 90 days, Market Watch quotes, candles. Kalibre Engine runs your rule file in your terminal.", "Kalibre Bridge add-on and a pairing code", "Pairing code in your browser and the add-on. Data is end-to-end encrypted.", "beta", "Beta"),
   ("Alpaca", "Account, positions, closed trades, watchlist, US stock and crypto candles (IEX data on the free plan). Paper or live account.", "Your API key", "Stored in your browser. Requests go directly to Alpaca.", "beta", "Beta"),
   ("Tradier", "Account, positions, closed trades, watchlist, US stock candles. Personal use under Tradier's terms.", "Your access token", "Stored in your browser. Requests go directly to Tradier.", "beta", "Beta"),
   ("CSV", "Candle files exported from MT5 or another source.", "Drag and drop", "Read locally in your browser", "beta", "Beta"),
  ],
  marka_not="MetaTrader, Alpaca and Tradier are trademarks of their respective owners. Kalibre Markets is not affiliated with MetaQuotes, Alpaca or Tradier.",
  gos_baslik="Live demo", gos_giris="These two panels run the lab's modules in your browser. The data is SYNTHETIC, not a real account or market.",
  panom_baslik="Dashboard", panom_alt="Summary of a connected account: balance, quotes and closed trades.",
  bakiye="Balance", varlik="Equity", net="Closed trades, net", egri="Balance curve",
  panom_dugme="Open Dashboard with sample data", panom_url="/lab/panom",
  opt_baslik="Optimization", opt_alt="EMA trend example: 36 combinations of fast and slow averages on 1,500 candles. Cell color shows the training-period score.",
  seri="Sample series", spread="Spread per trade",
  eksen_x="Fast average", eksen_y="rows: slow average",
  en_ayar="Highest training score", egitim="Training return", sinama="Test return",
  opt_dugme="Open Optimization in the lab", opt_url="/lab/optimizasyon",
  dipnot="Simulated results. Hypothetical performance has inherent limitations, is selected with the benefit of hindsight and does not represent actual trading. No representation is made that any account will achieve similar results. You choose the setting. Kalibre does not recommend settings.",
  hata="The demo could not load. Open the lab directly.",
  adim_baslik="How it works", adimlar=[
   ("Connect", "Connect a MetaTrader 5, Alpaca or Tradier account. No password needed.", "/connect", "Connect"),
   ("Review your account", "Balance, quotes, open positions and closed trades on the Dashboard.", "/lab/panom", "Dashboard"),
   ("Build a rule", "Use blocks in Simple mode or the form in Advanced mode.", "/lab", "Strategy Builder"),
   ("Backtest with costs", "Quick Backtest shows gross and net results.", "/lab", "Quick Backtest"),
   ("Optimize", "Separate training and test periods, neighborhood check and a deflated Sharpe ratio.", "/lab/optimizasyon", "Optimization"),
   ("Run on demo", "Run Kalibre Engine with Prop Shield on a demo account first.", "/prop", "Prop Shield"),
  ],
  mod_baslik="Features", moduller=[
   ("Dashboard", "Account, quotes, open positions and closed trades, with profit factor, win rate and realized drawdown.", "/lab/panom"),
   ("Strategy Builder", "Blocks in Simple mode and a full form in Advanced mode. Both edit the same rule.", "/lab"),
   ("Quick Backtest", "Runs a rule on your candles in seconds. Add spread, commission and slippage.", "/lab"),
   ("Optimization", "Training and test periods, neighboring settings, deflated Sharpe ratio and a prop rule filter.", "/lab/optimizasyon"),
   ("Prop Shield", "Checks daily and total loss limits on every tick and sizes lots to the remaining room.", "/prop"),
   ("Volatility Lab", "EWMA, Yang-Zhang and GARCH volatility models.", "/lab/oynaklik"),
  ],
  guv_baslik="Security", guv_giris="Kalibre Bridge encrypts MT5 data with AES-256 before sending it. Only your browser can decrypt it.", guv_url="/security", guv_link="Read the security details",
  gorur_baslik="What our relay server sees", gorur=["Encrypted packets", "Packet size and arrival time", "A channel ID derived from your pairing code"],
  gormez_baslik="What it cannot see", gormez=["Symbols and prices", "Positions, balance and trade history", "Your pairing code and your Alpaca or Tradier keys", "Your MT5 password, which is never requested"],
  fiyat_baslik="Pricing", fiyat="$19", fiyat_alt="/ month at launch, also available as €17", fiyat_not="Subscriptions are not open during the beta. Invited testers get a free beta license.", fiyat_dugme="Join the waitlist", fiyat_url="/pricing#waitlist",
  beta_baslik="Beta and risk", beta="Kalibre Lab is in beta. Features may change and may contain errors. Backtests are simulations. Trading on margin carries a high level of risk, and you can lose all of the money you deposit. Test Kalibre Engine on a demo account before using it on a live account.",
  risk_link="Read the risk disclosure", risk_url="/risk-disclosure", beta_link="About the beta", beta_url="/beta",
 ),
 "tr": dict(
  title="Kalibre Lab (beta): MetaTrader 5, Alpaca ve Tradier için strateji testi",
  desc="MetaTrader 5, Alpaca ya da Tradier hesabını bağla, kural kur, maliyetlerle backtest yap ve ayrı eğitim ve test dönemleriyle optimize et. Yatırım tavsiyesi değildir.",
  h1="MetaTrader 5, Alpaca ve Tradier hesapları için strateji testi",
  giris="Hesabını bağla, kuralını kur, brüt ve net sonucu ayrı eğitim ve test dönemlerinde gör. Kalibre sinyal satmaz.",
  b1="MetaTrader 5'i bağla", b1u="/tr/connect", b2="Beta erişimi iste", b2u="mailto:markets@kalibrefin.com?subject=Kalibre%20Lab%20beta%20erisimi",
  not_="Kalibre Lab beta sürümündedir. Yalnızca yazılım. Yatırım tavsiyesi değildir.",
  mt5_alt="Kalibre Bridge eklentisi", alpaca_alt="ABD hisse ve kripto", tradier_alt="ABD hisse, kişisel kullanım", csv_alt="mum dosyası",
  tarayici="Tarayıcın", tarayici_satir=["Pano", "Strateji Kurucu", "Backtest ve optimizasyon", "API anahtarları burada saklanır"],
  sunucu="Kalibre röle sunucusu", sunucu_alt="sadece şifreli paket", role_etiket="MT5: uçtan uca AES-256",
  akis_baslik="Veri akışı", akis_aciklama="MetaTrader 5 verisi Kalibre röle sunucusundan şifreli geçer ve şifresi sadece tarayıcında çözülür. Alpaca ve Tradier verisini tarayıcın doğrudan ister. CSV dosyaları yerelde okunur.",
  akis_not="Röle sunucusu MT5 paketlerini çözemez ve en geç 2 saat içinde siler. Alpaca ve Tradier istekleri Kalibre sunucularından geçmez.",
  ent_baslik="Entegrasyonlar", ent_giris="Kalibre Lab 4 kaynağa bağlanır. Veri hesabından ya da dosyalarından gelir. Kalibre piyasa verisi yayınlamaz.",
  th=["Platform", "Veri", "Bağlantı", "Kimlik bilgisi", "Durum"],
  satirlar=[
   ("MetaTrader 5", "Hesap, açık pozisyonlar, son 90 günün kapanmış işlemleri, Market Watch fiyatları, mumlar. Kalibre Engine kural dosyanı terminalinde çalıştırır.", "Kalibre Bridge eklentisi ve eşleştirme kodu", "Eşleştirme kodu tarayıcında ve eklentide. Veri uçtan uca şifreli.", "beta", "Beta"),
   ("Alpaca", "Hesap, pozisyonlar, kapanmış işlemler, izleme listesi, ABD hisse ve kripto mumları (ücretsiz planda IEX verisi). Paper ya da canlı hesap.", "API anahtarın", "Tarayıcında saklanır. İstekler doğrudan Alpaca'ya gider.", "beta", "Beta"),
   ("Tradier", "Hesap, pozisyonlar, kapanmış işlemler, izleme listesi, ABD hisse mumları. Tradier'in koşullarına göre kişisel kullanım.", "Erişim token'ın", "Tarayıcında saklanır. İstekler doğrudan Tradier'e gider.", "beta", "Beta"),
   ("CSV", "MT5'ten ya da başka bir kaynaktan dışa aktarılan mum dosyaları.", "Sürükle bırak", "Tarayıcında yerel olarak okunur", "beta", "Beta"),
  ],
  marka_not="MetaTrader, Alpaca ve Tradier sahiplerinin markalarıdır. Kalibre Markets; MetaQuotes, Alpaca ya da Tradier ile bağlantılı değildir.",
  gos_baslik="Canlı gösterim", gos_giris="Bu iki pano laboratuvarın modüllerini tarayıcında çalıştırır. Veri SENTETİK, gerçek bir hesap ya da piyasa değildir.",
  panom_baslik="Pano", panom_alt="Bağlı bir hesabın özeti: bakiye, fiyatlar ve kapanmış işlemler.",
  bakiye="Bakiye", varlik="Varlık", net="Kapanan işlemler, net", egri="Bakiye eğrisi",
  panom_dugme="Pano'yu örnek veriyle aç", panom_url="/lab/panom?dil=tr",
  opt_baslik="Optimizasyon", opt_alt="EMA trend örneği: 1.500 mumda hızlı ve yavaş ortalamanın 36 bileşimi. Hücre rengi eğitim döneminin puanını gösterir.",
  seri="Örnek seri", spread="İşlem başına spread",
  eksen_x="Hızlı ortalama", eksen_y="satırlar: yavaş ortalama",
  en_ayar="En yüksek eğitim puanı", egitim="Eğitim getirisi", sinama="Test getirisi",
  opt_dugme="Optimizasyonu laboratuvarda aç", opt_url="/lab/optimizasyon?dil=tr",
  dipnot="Simülasyon sonucu. Varsayımsal performansın doğal sınırları vardır, geçmişe bakılarak seçilir ve gerçek işlemleri temsil etmez. Hiçbir hesabın benzer sonuç elde edeceği iddia edilmez. Ayarı sen seçersin. Kalibre ayar önermez.",
  hata="Gösterim yüklenemedi. Laboratuvarı doğrudan aç.",
  adim_baslik="Nasıl çalışır", adimlar=[
   ("Bağlan", "MetaTrader 5, Alpaca ya da Tradier hesabını bağla. Şifre gerekmez.", "/tr/connect", "Bağlan"),
   ("Hesabını incele", "Pano'da bakiye, fiyatlar, açık pozisyonlar ve kapanmış işlemler.", "/lab/panom?dil=tr", "Pano"),
   ("Kural kur", "Basit modda blokları, İleri modda formu kullan.", "/lab?dil=tr", "Strateji Kurucu"),
   ("Maliyetle backtest", "Hızlı Backtest brüt ve net sonucu gösterir.", "/lab?dil=tr", "Hızlı Backtest"),
   ("Optimize et", "Ayrı eğitim ve test dönemleri, komşuluk kontrolü ve düzeltilmiş (deflated) Sharpe oranı.", "/lab/optimizasyon?dil=tr", "Optimizasyon"),
   ("Demoda çalıştır", "Kalibre Engine'i Prop Kalkanı ile önce demo hesapta çalıştır.", "/tr/prop", "Prop Kalkanı"),
  ],
  mod_baslik="Özellikler", moduller=[
   ("Pano", "Hesap, fiyatlar, açık pozisyonlar ve kapanmış işlemler; kâr faktörü, kazanma oranı ve gerçekleşmiş düşüşle.", "/lab/panom?dil=tr"),
   ("Strateji Kurucu", "Basit modda bloklar, İleri modda tam form. İkisi aynı kuralı düzenler.", "/lab?dil=tr"),
   ("Hızlı Backtest", "Kuralı mumlarında saniyeler içinde çalıştırır. Spread, komisyon ve kayma ekleyebilirsin.", "/lab?dil=tr"),
   ("Optimizasyon", "Eğitim ve test dönemleri, komşu ayarlar, düzeltilmiş Sharpe oranı ve prop kural filtresi.", "/lab/optimizasyon?dil=tr"),
   ("Prop Kalkanı", "Günlük ve toplam kayıp sınırlarını her tikte kontrol eder, lotu kalan paya göre ayarlar.", "/tr/prop"),
   ("Oynaklık Laboratuvarı", "EWMA, Yang-Zhang ve GARCH oynaklık modelleri.", "/lab/oynaklik?dil=tr"),
  ],
  guv_baslik="Güvenlik", guv_giris="Kalibre Bridge MT5 verisini göndermeden önce AES-256 ile şifreler. Şifreyi sadece tarayıcın çözebilir.", guv_url="/tr/security", guv_link="Güvenlik ayrıntıları",
  gorur_baslik="Röle sunucumuzun gördüğü", gorur=["Şifreli paketler", "Paket boyutu ve geliş zamanı", "Eşleştirme kodundan türetilen bir kanal kimliği"],
  gormez_baslik="Göremediği", gormez=["Semboller ve fiyatlar", "Pozisyonlar, bakiye ve işlem geçmişi", "Eşleştirme kodun, Alpaca ve Tradier anahtarların", "MT5 şifren (hiç istenmez)"],
  fiyat_baslik="Fiyat", fiyat="19 USD", fiyat_alt="/ ay lansmanda, euro ile 17 EUR", fiyat_not="Beta süresince abonelikler açık değildir. Davetli testçiler ücretsiz beta lisansı alır.", fiyat_dugme="Listeye katıl", fiyat_url="/tr/pricing#bekleme",
  beta_baslik="Beta ve risk", beta="Kalibre Lab beta sürümündedir. Özellikler değişebilir ve hata içerebilir. Backtestler simülasyondur. Kaldıraçlı işlemler yüksek risk içerir ve yatırılan paranın tamamı kaybedilebilir. Kalibre Engine'i gerçek hesapta kullanmadan önce demo hesapta dene.",
  risk_link="Risk bildirimini oku", risk_url="/tr/risk-disclosure", beta_link="Beta hakkında", beta_url="/tr/beta",
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
<link rel="alternate" hreflang="en" href="https://kalibremarkets.com{EN_YOL}">
<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com{TR_YOL}">
<link rel="alternate" hreflang="x-default" href="https://kalibremarkets.com{EN_YOL}">
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
