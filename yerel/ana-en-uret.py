# English homepage (/en/): same styles as the Turkish homepage, English content.
import os
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])
tr = open(os.path.join(KOK, "index.html")).read()
stil = tr[tr.index("<style>"):tr.index("</style>") + 8]
GOVDE = '''<main>
<section class="acilis">
  <div class="kap">
    <div>
      <h1>Test your strategy on your own data before you put money behind it.</h1>
      <p class="giris">Kalibre Lab is a strategy lab for MetaTrader 5. Your price history is encrypted on your own computer and your strategy is tested in your browser. You write the assumption, test it on data, measure the risk. The decision stays yours.</p>
      <div class="eylem">
        <a class="dugme" href="/en/lab/">Open the lab</a>
        <a class="dugme ikincil" href="/en/setup/">Read the setup guide</a>
      </div>
      <p class="not">For MetaTrader 5. No signals, no custody of funds. Not investment advice.</p>
    </div>

    <article class="notu" id="karar-notu" aria-label="Sample decision memo">
      <div class="notu-bas">
        <h2>Decision memo</h2>
        <span>Calculated on this page</span>
      </div>
      <dl>
        <dt>Assumption</dt>
        <dd>Buy while the fast average is above the slow one, sell while it is below.</dd>
        <dt>Data</dt>
        <dd><span class="sentetik">SYNTHETIC</span>3,000 hourly sample candles, series no. <span data-s="serino" class="sayi">1</span>. Not a real market.<br><button type="button" class="seri-dugme" data-eylem="yeni-seri">Generate another sample series</button></dd>
      </dl>
      <div class="ayar">
        <label>Fast average <output data-deger="hizli">20</output>
          <input type="range" name="hizli" min="5" max="60" step="1" value="20"></label>
        <label>Slow average <output data-deger="yavas">100</output>
          <input type="range" name="yavas" min="30" max="250" step="5" value="100"></label>
      </div>
      <svg viewBox="0 0 560 180" role="img" aria-label="Equity curves before and after costs">
        <line data-cizgi="taban" x1="0" x2="560" y1="90" y2="90" stroke="#c4ccd6" stroke-dasharray="3 4"/>
        <path data-cizgi="maliyetsiz" fill="none" stroke="#7d8a99" stroke-width="1.6"/>
        <path data-cizgi="maliyetli" fill="none" stroke="#1f7a5c" stroke-width="2"/>
      </svg>
      <div class="lejant">
        <span><i style="background:#7d8a99"></i>Before costs</span>
        <span><i style="background:#1f7a5c"></i>With 1 pip cost per trade</span>
        <span><i style="background:#c4ccd6"></i>Starting capital</span>
      </div>
      <table>
        <thead><tr><th></th><th>Before costs</th><th>With 1 pip cost</th></tr></thead>
        <tbody>
          <tr><td>Total return</td><td data-s="getiri0" class="sayi"></td><td data-s="getiri1" class="sayi"></td></tr>
          <tr><td>Largest drawdown</td><td data-s="dusus0" class="sayi"></td><td data-s="dusus1" class="sayi"></td></tr>
          <tr><td>Number of trades</td><td data-s="islem" class="sayi" colspan="2"></td></tr>
        </tbody>
      </table>
      <p class="cumle" data-s="cumle"></p>
      <p class="dipnot">Unleveraged, full position. The lab's quick test is also cost-free; the final test is in MT5 Strategy Tester with your own broker's spread and commission.</p>
    </article>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="kimin">
      <a href="/en/prop/">
        <h3>If you are taking a prop firm challenge</h3>
        <p>Most accounts are lost to one bad day. The shield watches daily and total loss limits on every tick, sizes lots to the limit and stops near the floor. FTMO and The5ers presets are ready.</p>
        <span>See the prop shield</span>
      </a>
      <a href="/en/forex/">
        <h3>If you trade your own account</h3>
        <p>The strongest driver of losses is leverage and position size. Fix risk first with a risk budget, volatility-scaled lots and a daily loss limit, then test the strategy.</p>
        <span>For retail forex</span>
      </a>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>Risk is asked about before return.</h2>
      <p>On a bank's treasury desk, a position is judged not by what it could earn but by what it could lose on its worst day. An economist, likewise, looks less at one period's result and more at whether the conditions behind it will repeat. Kalibre Lab puts those two questions at the start of every test.</p>
    </div>
    <div class="ilkeler">
      <div>
        <h3>Worst period first</h3>
        <p>The largest drawdown sits on the same line as the return. You size a strategy by what you could carry through its worst stretch.</p>
      </div>
      <div>
        <h3>Size from a risk budget</h3>
        <p>Position size comes not from a feeling but from the share of balance you risk, the stop distance and how volatile the market is right now.</p>
      </div>
      <div>
        <h3>Regimes change</h3>
        <p>A rule that works in a calm market may fail when volatility jumps. Volatility models show which conditions a strategy was tested in.</p>
      </div>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>Setup takes three steps.</h2>
      <p>Your data leaves MetaTrader 5 and reaches the lab encrypted. The details, screen by screen, are on the <a href="/en/setup/">setup page</a>.</p>
    </div>
    <ol class="adimlar">
      <li>
        <h3>Install the add-on</h3>
        <p>Add the Kalibre Bridge add-on to MetaTrader 5. It places no trades; it only reads price history and your open positions.</p>
      </li>
      <li>
        <h3>Paste the code, allow the address</h3>
        <p>Paste the pairing code the lab creates into the add-on. In MT5's options, allow the Kalibre address once.</p>
      </li>
      <li>
        <h3>Test your strategy</h3>
        <p>Your own broker's candles arrive in the lab. Build your rule, run the quick test, then test the one you like in MT5.</p>
      </li>
    </ol>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>What is in the lab?</h2>
      <p>A strategy is a rule file. It is built in the lab, rehearsed in the browser and run in MetaTrader 5 with the same file. Nothing is rewritten in between.</p>
    </div>
    <div class="araclar">
      <div>
        <h3>Rule file</h3>
        <p>Entry, exit, stop and target rules with SMA, EMA, RSI, ATR, ADX, Bollinger, MACD and volatility indicators. The rule you build is also written out as a plain sentence.</p>
      </div>
      <div>
        <h3>Quick test</h3>
        <p>Tries the rule on your own candles in seconds. It runs in the browser and leaves out costs; it is for ruling ideas out, not for confirming them.</p>
      </div>
      <div>
        <h3>Volatility lab</h3>
        <p>EWMA, Yang-Zhang and GARCH models. Shows when volatility clusters and which regime a strategy was tested in.</p>
      </div>
      <div>
        <h3>The final test in MetaTrader 5</h3>
        <p>The same rule file is tested in MT5 Strategy Tester with your broker's spread, commission and trading hours settings.</p>
      </div>
      <div>
        <h3>Live bridge</h3>
        <p>While the add-on runs, each newly closed candle and your open positions reach the lab encrypted. You can always see how fresh the connection is.</p>
      </div>
      <div>
        <h3>Your own file</h3>
        <p>You can also work without the add-on: just drag and drop a CSV or JSON file exported from MT5.</p>
      </div>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>Your data. Your key.</h2>
      <p>Your prices leave your computer encrypted and are opened only in your browser. The key is the pairing code; we have no copy. Details are on the <a href="/en/security/">security page</a>.</p>
    </div>
    <div class="gorur">
      <div class="evet">
        <h3>What our server sees</h3>
        <ul>
          <li>Unreadable, encrypted packets</li>
          <li>Packet size and arrival time</li>
          <li>A random-looking channel number</li>
        </ul>
      </div>
      <div class="hayir">
        <h3>What our server cannot see</h3>
        <ul>
          <li>Which symbols you follow, and the prices</li>
          <li>Your positions, balance, profit and loss</li>
          <li>Your account number and password</li>
          <li>Your pairing code, the key itself</li>
        </ul>
      </div>
    </div>
    <p class="not" style="margin-top:20px">Packets are deleted on their own after two hours at most.</p>
  </div>
</section>

<section class="bolum">
  <div class="kap degil">
    <h2>What Kalibre Lab is not</h2>
    <ul>
      <li><b>Not investment advice.</b> You decide which rule to build and when to trade which symbol.</li>
      <li><b>It does not decide for you.</b> The bridge add-on only reads. Kalibre Engine trades only with the rule file you built, on your account, when you start it.</li>
      <li><b>It does not sell market data.</b> Prices come from your broker, through your account. We publish no prices.</li>
      <li><b>It does not promise returns.</b> A rule that worked in the past may not work in the future. The lab exists to make that easier to see.</li>
    </ul>
  </div>
</section>

<section class="bolum son">
  <div class="kap">
    <h2>$19 a month. Cancel any time.</h2>
    <div class="eylem" style="margin:0">
      <a class="dugme" href="/en/pricing/">See pricing</a>
      <a class="dugme ikincil" href="/en/lab/">Try it on sample data</a>
    </div>
  </div>
</section>
</main>'''
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>Kalibre Lab: test your strategy on your own MetaTrader 5 data</title>
<meta name="description" content="Kalibre Lab is a strategy lab for MetaTrader 5. Your price history is encrypted on your computer, your strategy is tested in your browser, and the final test runs in MT5 Strategy Tester. Not investment advice.">
<link rel="canonical" href="https://kalibremarkets.com/en/">
<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com/">
<link rel="alternate" hreflang="en" href="https://kalibremarkets.com/en/">
<meta property="og:title" content="Kalibre Lab: test your strategy on your own MetaTrader 5 data">
<meta property="og:description" content="Write the assumption, test it on your own data, measure the risk. Your data is encrypted on your computer; only you hold the key.">
<meta property="og:url" content="https://kalibremarkets.com/en/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kalibre Markets">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="https://kalibremarkets.com/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/site.css">
<script src="/static/kalibre-cerez.js"></script>
<script src="/static/beta.js" defer></script>
{stil}
</head>
<body>

{ust("/en/", "en", "/")}

{GOVDE}

{ALT_EN}

<script src="/static/karar-notu.js" defer></script>
</body>
</html>
'''
assert "—" not in html
os.makedirs(os.path.join(KOK, "en"), exist_ok=True)
open(os.path.join(KOK, "en/index.html"), "w").write(html)
print("yazıldı en/index.html")
