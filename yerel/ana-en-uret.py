# EMEKLİ (30.10.2026): ana sayfa artık yerel/pitch-uret.py ile üretiliyor (eski İngilizce ana sayfa).
import sys; sys.exit("Bu üretici emekli; ana sayfa için: python3 yerel/pitch-uret.py")
# English homepage (/): same styles as the Turkish homepage, English content.
import os, re
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])
tr = open(os.path.join(KOK, "tr/index.html")).read()
stil = tr[tr.index("<style>"):tr.index("</style>") + 8]
GOVDE = '''<main>
<section class="acilis">
  <div class="kap">
    <div>
      <h1>Backtest your MetaTrader 5 strategies on your broker's data.</h1>
      <p class="giris">Build entry and exit rules, backtest them with spread and commission, and run the same rule file in MT5. Data from MT5 is end-to-end encrypted.</p>
      <div class="eylem">
        <a class="dugme" href="/lab">Open the lab</a>
        <a class="dugme ikincil" href="/setup">View setup guide</a>
      </div>
      <p class="not">Software only. No signals. No client funds held. Not investment advice.</p>
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
      <p class="dipnot">Simulated results on SYNTHETIC data. Unleveraged, full position. Hypothetical performance has inherent limitations and does not represent actual trading.</p>
    </article>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="kimin">
      <a href="/prop">
        <h3>Prop firm challenges</h3>
        <p>Prop Shield checks daily and total loss limits on every tick and sizes lots to the remaining room. Presets for FTMO and The5ers.</p>
        <span>See Prop Shield</span>
      </a>
      <a href="/forex">
        <h3>Your own trading account</h3>
        <p>Set a risk per trade, volatility-scaled lot size and a daily loss limit, then backtest the rule with them.</p>
        <span>Risk tools for retail forex</span>
      </a>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>Risk metrics in every backtest</h2>
      <p>Max drawdown, position size and volatility regime are shown next to return in every test.</p>
    </div>
    <div class="ilkeler">
      <div>
        <h3>Max drawdown</h3>
        <p>The largest peak-to-trough fall is reported on the same line as total return.</p>
      </div>
      <div>
        <h3>Risk-based position sizing</h3>
        <p>Lot size is calculated from the share of balance you risk, the stop distance and current volatility.</p>
      </div>
      <div>
        <h3>Volatility regimes</h3>
        <p>EWMA, Yang-Zhang and GARCH models show the volatility conditions in each test period.</p>
      </div>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>Set up in 3 steps</h2>
      <p>Kalibre Bridge encrypts your data in MT5 before sending it. The <a href="/setup">setup guide</a> shows each screen.</p>
    </div>
    <ol class="adimlar">
      <li>
        <h3>Install Kalibre Bridge</h3>
        <p>Add Kalibre Bridge to MetaTrader 5. The add-on is read-only. It cannot place, modify or close orders.</p>
      </li>
      <li>
        <h3>Paste the pairing code</h3>
        <p>Copy the pairing code from the lab into the add-on. In MT5 options, allow WebRequest for the Kalibre address.</p>
      </li>
      <li>
        <h3>Backtest a rule</h3>
        <p>Your broker's candles load into the lab. Build a rule, run Quick Backtest, then confirm it in MT5 Strategy Tester.</p>
      </li>
    </ol>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>Features</h2>
      <p>One rule file runs in the lab, in your browser and in MetaTrader 5.</p>
    </div>
    <div class="araclar">
      <div>
        <h3>Strategy Builder</h3>
        <p>Entry, exit, stop and target rules with SMA, EMA, RSI, ATR, ADX, Bollinger Bands, MACD and volatility indicators. Each rule is shown as a plain-language summary.</p>
      </div>
      <div>
        <h3>Quick Backtest</h3>
        <p>Runs a rule on your candles in seconds, in your browser. Add spread, commission and slippage to see net results.</p>
      </div>
      <div>
        <h3>Volatility Lab</h3>
        <p>EWMA, Yang-Zhang and GARCH models for the series you test.</p>
      </div>
      <div>
        <h3>MT5 Strategy Tester</h3>
        <p>Kalibre Engine runs the same rule file in Strategy Tester with your broker's spread, commission and trading hours.</p>
      </div>
      <div>
        <h3>Dashboard</h3>
        <p>Balance, open positions, Market Watch quotes and the last 90 days of closed trades from your MT5, Alpaca or Tradier account.</p>
      </div>
      <div>
        <h3>CSV import</h3>
        <p>Drag a CSV or JSON candle file into the lab. Your browser reads it locally.</p>
      </div>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="kap">
    <div class="bolum-bas">
      <h2>End-to-end encryption</h2>
      <p>Data is encrypted with AES-256 in MT5 and decrypted only in your browser. The keys are derived from your pairing code, and we do not have a copy. Read the <a href="/security">security details</a>.</p>
    </div>
    <div class="gorur">
      <div class="evet">
        <h3>What our relay server sees</h3>
        <ul>
          <li>Encrypted packets</li>
          <li>Packet size and arrival time</li>
          <li>A channel ID derived from your code</li>
        </ul>
      </div>
      <div class="hayir">
        <h3>What it cannot see</h3>
        <ul>
          <li>Symbols and prices</li>
          <li>Positions, balance and trade history</li>
          <li>Your pairing code</li>
          <li>Your MT5 password, which is never requested</li>
        </ul>
      </div>
    </div>
    <p class="not" style="margin-top:20px">The relay server deletes each packet within 2 hours. The encrypted data does not include your account number. The license check sends your license key and MT5 account number to our license server.</p>
  </div>
</section>


<section class="bolum son">
  <div class="kap">
    <h2>Kalibre Lab is in beta. Planned price at launch: $19 per month.</h2>
    <div class="eylem" style="margin:0">
      <a class="dugme" href="/pricing#waitlist">Join the waitlist</a>
      <a class="dugme ikincil" href="mailto:markets@kalibrefin.com?subject=Kalibre%20Lab%20beta%20access">Request beta access</a>
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
<title>Kalibre Lab: backtesting and risk tools for MetaTrader 5</title>
<meta name="description" content="Build trading rules, backtest them on your broker's MetaTrader 5 data with spread and commission, and run the same rule file in MT5. End-to-end encrypted. Not investment advice.">
<link rel="canonical" href="https://kalibremarkets.com/">
<link rel="alternate" hreflang="en" href="https://kalibremarkets.com/">
<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com/tr">
<link rel="alternate" hreflang="x-default" href="https://kalibremarkets.com/">
<meta property="og:title" content="Kalibre Lab: backtesting and risk tools for MetaTrader 5">
<meta property="og:description" content="Build trading rules, backtest them on your broker's data and run the same rule file in MT5. End-to-end encrypted.">
<meta property="og:url" content="https://kalibremarkets.com/">
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
<script src="/static/kalibre-auth.js" defer></script>
{stil}
</head>
<body>

{ust("/", "en", "/tr")}

{GOVDE}

{ALT_EN}

<script src="/static/karar-notu.js" defer></script>
</body>
</html>
'''
assert "—" not in html
open(os.path.join(KOK, "index.html"), "w").write(re.sub(r'(href|content)="((?:https://kalibremarkets\.com)?/[^"?#]*?[^/"])/"', r'\1="\2"', html))
print("yazıldı index.html")
