# English pages of the product site. Uses the shared header/footer from sayfa-uret.py.
import os
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

# ------------------------------------------------------------------ setup
SETUP = '''
<h1>Setup</h1>
<p class="giris">Connecting MetaTrader 5 to Kalibre Lab takes one add-on, one code and one permission. You do it once; after that, your data reaches the lab on its own whenever MT5 is open.</p>
<div class="kutu yesil">We recommend doing your first setup on a <b>demo account</b>. The bridge never places trades, but it is a good habit to get to know a new tool on an account with no money at risk.</div>

<h2 id="requirements">What you need</h2>
<ul>
  <li>MetaTrader 5. On Windows, your broker's installer is enough; on macOS, the official MetaQuotes app.</li>
  <li>A demo or live MT5 account with any broker.</li>
  <li>The Kalibre Bridge add-on (<code>KalibreKopru.ex5</code>) and your license key. Both are on the <a href="/en/license/">License</a> page once you subscribe.</li>
</ul>

<h2 id="add-on">1. Add the add-on to MetaTrader 5</h2>
<ol>
  <li>In MT5, open <b>File &gt; Open Data Folder</b>.</li>
  <li>Go to <code>MQL5\\Experts</code> and copy <code>KalibreKopru.ex5</code> there.</li>
  <li>Back in MT5, right-click <b>Expert Advisors</b> in the <b>Navigator</b> and choose <b>Refresh</b>. <b>KalibreKopru</b> appears in the list.</li>
</ol>

<h2 id="code">2. Create a pairing code in the lab</h2>
<ol>
  <li>Open the <a href="/en/connect">Connect MetaTrader</a> page; it walks you through the steps.</li>
  <li>Your browser creates a pairing code for you. Copy it with the <b>Copy</b> button.</li>
</ol>
<p>The code starts with <code>KLB1</code> and is the key that encrypts your data. It lives only in this browser and in the add-on's settings; we never have a copy. Do not share it.</p>

<h2 id="chart">3. Attach the add-on to a chart</h2>
<ol>
  <li>Drag <b>KalibreKopru</b> from the Navigator onto any chart.</li>
  <li>Open the <b>Inputs</b> tab.</li>
  <li>Paste the lab's code into <b>Pairing code</b>.</li>
  <li>Paste your license key (it starts with <code>KLM-</code>) from the <a href="/en/license/">License</a> page into <b>License key</b>.</li>
  <li>List the symbols you want under <b>Symbols</b>, separated by commas, e.g. <code>EURUSD,GBPUSD,XAUUSD</code>. Left empty, only the chart's own symbol is sent.</li>
  <li>Pick a <b>Timeframe</b> (M1, M5, M15, M30, H1, H4, D1 or W1) and click <b>OK</b>.</li>
</ol>
<p>The add-on sends no orders, so you do not need to turn on <b>Algo Trading</b> in MT5.</p>

<h2 id="permission">4. Allow the Kalibre address in MetaTrader 5</h2>
<p>MT5 only lets add-ons connect to the internet through addresses you allow. This step is there for your safety and is done once.</p>
<ol>
  <li>Open <b>Tools &gt; Options</b>.</li>
  <li>Go to the <b>Expert Advisors</b> tab.</li>
  <li>Tick <b>Allow WebRequest for listed URL</b>.</li>
  <li>Add <code>https://kalibremarkets.com</code> to the list.</li>
  <li>Click <b>OK</b>. If you close the window with the X, the permission is not saved.</li>
</ol>

<h2 id="check">5. Check the connection</h2>
<p>A <b>Kalibre Bridge</b> line appears in the top-left corner of the chart. The add-on first checks your license (a few seconds), then starts sending data. Once the status reads <b>connected</b>, the count of sent documents goes up. In the lab you will see the connection status, your broker's name and how many seconds ago the last heartbeat arrived.</p>
<p>Series refresh when a new candle closes: hourly on H1, daily on D1.</p>

<h2 id="troubleshooting">Common situations</h2>
<table class="tablo">
  <thead><tr><th>What you see on the chart</th><th>What to do</th></tr></thead>
  <tbody>
    <tr><td>No WebRequest permission</td><td>Repeat step 4. Make sure the address is exactly <code>https://kalibremarkets.com</code> and that you clicked <b>OK</b>.</td></tr>
    <tr><td>The add-on will not attach, a code error appears</td><td>Copy the code from the lab again. A character may be missing at the start or end.</td></tr>
    <tr><td>License invalid</td><td>Copy the key again from the <a href="/en/license/">License</a> page. You also see this if your subscription has ended or the key is already used on two MT5 accounts. The add-on retries every minute.</td></tr>
    <tr><td>Relay unreachable</td><td>Check your internet connection. The add-on retries every few seconds.</td></tr>
    <tr><td>The lab says "code does not match"</td><td>The code in the add-on differs from the lab's. If you created a new code in the lab, paste the new one into the add-on too.</td></tr>
    <tr><td>The connection drops after a while</td><td>The bridge works while MT5 is open and the computer is awake. When the computer sleeps, data stops; it resumes on its own when MT5 is back.</td></tr>
  </tbody>
</table>

<h2 id="tradier">Connecting with Tradier (US)</h2>
<p>If you have an account with the US broker Tradier, you can connect it instead of MetaTrader 5. No add-on is needed; the lab talks to Tradier directly from your browser.</p>
<ol>
  <li>Create an API access token in your Tradier account. We suggest a <b>Sandbox</b> token for your first try; Sandbox prices are delayed by 15 minutes.</li>
  <li>On the <a href="/lab/baglan.html?kaynak=tradier&amp;dil=en">connect page</a>, choose the <b>Tradier</b> tab, paste the token, pick the environment and press <b>Connect</b>.</li>
  <li>If you have several accounts, pick one. The Dashboard, the strategy builder and the optimizer now use Tradier data.</li>
</ol>
<div class="kutu">A Tradier token gives full access to your account. The lab only uses it to read and never sends orders. The token is stored only in this browser and sent only to Tradier; it never reaches Kalibre. Disconnecting deletes it from your browser. Under Tradier's terms this connection is for personal use.</div>

<h2 id="alpaca">Connecting with Alpaca (US)</h2>
<p>If you have an account with the US broker Alpaca, you can connect it too. No add-on is needed; the lab talks to Alpaca directly from your browser.</p>
<ol>
  <li>Create an API key pair in your Alpaca dashboard (Key ID and Secret). We suggest a <b>Paper</b> (simulated) account for your first try.</li>
  <li>On the <a href="/lab/baglan.html?kaynak=alpaca&amp;dil=en">connect page</a>, choose the <b>Alpaca</b> tab, paste both keys, pick the environment and press <b>Connect</b>.</li>
  <li>The Dashboard, the strategy builder and the optimizer now use Alpaca data. If your watchlist is empty, your open positions are shown; if there are none, the symbols you add on the Dashboard.</li>
</ol>
<div class="kutu">On the free Alpaca plan, live prices come from the IEX exchange only, which is a small share of total market volume. The lab only uses the keys to read and never sends orders. The keys are stored only in this browser and sent only to Alpaca; they never reach Kalibre. Disconnecting deletes them from your browser. This connection works with your own personal keys.</div>

<div class="kutu">Kalibre Lab is in beta. Before you set it up, read the <a href="/en/risk-disclosure/">risk disclosure</a>; do your first setup on a demo account.</div>

<h2 id="without">Working without the add-on</h2>
<p>If you prefer not to install the add-on, drag and drop a candle file exported from MT5 (CSV or JSON) into the lab. The file never leaves your computer; it is read in your browser.</p>
<p class="not">The add-ons show their messages in English, or in Turkish if your MetaTrader 5 is set to Turkish.</p>
'''
sayfa("en/setup/index.html", "Setup: connect MetaTrader 5 to Kalibre Lab", "How to install the Kalibre Bridge add-on in MetaTrader 5, enter the pairing code and license key, and allow WebRequest.", "/en/setup/", SETUP,
      icindekiler(SETUP) + '<p>Stuck on a step? <a href="/iletisim/" style="display:inline">Write to us</a>.</p>', dil="en")

# ------------------------------------------------------------------ security
SECURITY = '''
<h1>Security</h1>
<p class="giris">Your price history and positions are encrypted on your own computer and opened only in your own browser. The server in between, meaning us, cannot read the content. This page explains how that is achieved and where it ends.</p>

<h2 id="summary">In short</h2>
<ul>
  <li>The key is the pairing code your browser creates in the lab. We have no copy of it.</li>
  <li>The add-on encrypts and seals every packet before sending it. A packet whose seal does not match is not opened.</li>
  <li>The server only stores encrypted packets briefly and deletes them after two hours at most.</li>
  <li>The bridge add-on places no trades and does not read your account number or password.</li>
</ul>

<h2 id="code">The pairing code</h2>
<p>The code is a 32-byte secret created with your browser's secure random number generator and starts with <code>KLB1</code>. It lives in two places: this browser's local storage and the add-on's settings in MT5. It is never sent to the server.</p>
<p>Three separate keys are derived from the code (with HMAC-SHA256): a <b>channel number</b> used to find packets, an <b>encryption key</b> that encrypts the content and a <b>seal key</b> that signs each packet. The server only sees the channel number; neither the code nor the other keys can be worked out from it.</p>

<h2 id="encryption">Encryption and seal</h2>
<ul>
  <li>Content is encrypted with AES-256 (CTR mode). Every packet gets a starting value that is never reused.</li>
  <li>Every packet is sealed with HMAC-SHA256. The seal covers the channel number, the slot the packet belongs to and the encrypted content together.</li>
  <li>The browser checks the seal first, then opens the packet. A packet that was altered, moved to another slot or sealed with another code is rejected.</li>
  <li>Symbol names are encrypted too. The server cannot tell from a packet's name which symbol you follow.</li>
</ul>
<p>The protocol has been written three times: in the MetaTrader 5 add-on, in the lab and in an independent reference implementation. Given the same input, all three produce byte-for-byte the same encrypted packet; this comparison is repeated by automated tests in every version.</p>

<h2 id="server">What the server does</h2>
<table class="tablo">
  <thead><tr><th>What the server sees</th><th>What the server cannot see</th></tr></thead>
  <tbody>
    <tr><td>Encrypted packets</td><td>Symbols, prices, candles</td></tr>
    <tr><td>Packet size and arrival time</td><td>Positions, balance, profit and loss</td></tr>
    <tr><td>Channel number</td><td>Your broker and server name</td></tr>
    <tr><td>The connection's IP address (during transfer)</td><td>The pairing code</td></tr>
  </tbody>
</table>
<p>The server checks a packet's format and keeps it in short-lived storage. Each packet is deleted on its own after two hours at most; when a newer one arrives, the old one is replaced at once. Packet contents are never written to logs. The number of packets a channel can write per minute is limited.</p>

<h2 id="add-on">What the add-on reads</h2>
<p>Kalibre Bridge only reads; it sends no orders, closes no positions and changes no settings. What it reads, encrypts and sends:</p>
<ul>
  <li>Closed candles of the symbols you choose: time, open, high, low, close, tick volume.</li>
  <li>Open positions: symbol, side, lot, open time and price, current price, stop, target, profit and the position's magic number.</li>
  <li>Your account currency, balance and equity.</li>
  <li>Your broker's name, server name and whether the account is demo or live.</li>
</ul>
<p>It does not read your account number, password, personal details or trade history. For the license check, the add-on sends your license key and MT5 account number to our license server; that request is separate from the encrypted data.</p>

<h2 id="limits">Limits of the protection</h2>
<p>No system protects against everything. This one rests on these assumptions:</p>
<ul>
  <li><b>Whoever has your code can read your data.</b> Do not share it. If in doubt, create a new code in the lab and paste it into the add-on; the old code stops working from then on.</li>
  <li><b>Your device's security is yours.</b> Someone with access to your computer or browser can also see decrypted data.</li>
  <li><b>That traffic exists is not secret.</b> The server sees how often and how large a channel's packets are. That shows usage, not content.</li>
</ul>
<p>If you think you have found a security issue, please <a href="/iletisim/">write to us</a>.</p>
'''
sayfa("en/security/index.html", "Security: your data, your key", "How the Kalibre Lab MetaTrader 5 bridge encrypts your data, what the server can and cannot see, and where the protection ends.", "/en/security/", SECURITY, icindekiler(SECURITY), dil="en")

# ------------------------------------------------------------------ methodology
METHOD = '''
<h1>Methodology</h1>
<p class="giris">You should know where every number in the lab comes from and how it is calculated. This page covers the data, the rules of the quick test and its known limits.</p>

<h2 id="data">Where the data comes from</h2>
<p>Kalibre does not publish market data. Every series in the lab comes from one of three sources, named on the series:</p>
<table class="tablo">
  <thead><tr><th>Source</th><th>Label</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Sample series</td><td>SYNTHETIC</td><td>Generated by a seeded random process. It does not show a real market; it is for getting to know the lab.</td></tr>
    <tr><td>Your file</td><td>YOUR DATA</td><td>A file you exported from MT5 or elsewhere. It is read in your browser and never leaves your computer.</td></tr>
    <tr><td>Live bridge</td><td>MT5 and broker name</td><td>Your own MT5 account's price history, end-to-end encrypted (<a href="/en/security/">security</a>).</td></tr>
  </tbody>
</table>
<p>Figures in the (Turkish) education articles are taken once from public sources, with source and date in the article, and are not updated.</p>

<h2 id="time">Candle times</h2>
<p>Candle times from MT5 are your broker's server time, the time you see on the MT5 chart. We do not convert them to UTC: converting past candles with today's offset would shift them by an hour around daylight-saving changes. The lab shows the server time's offset from UTC separately.</p>

<h2 id="test">How the quick test works</h2>
<p>The quick test mimics the rules of the Kalibre engine in MetaTrader 5, in your browser. Same as the engine:</p>
<ul>
  <li>Rules are evaluated at the open of a new candle, using the last closed candle. Crossover rules use the last two candles. A future candle is never used.</li>
  <li>Exit rules are evaluated before entry rules. A signal in the opposite direction closes the open position.</li>
  <li>If both directions signal on the same candle, no trade is opened.</li>
  <li>Lot size comes from balance, risk per trade, the volatility scale and the stop distance.</li>
</ul>
<p>Approximations:</p>
<ul>
  <li>The order of prices inside a candle is unknown. If both stop and target are touched in the same candle, the stop counts; this is a cautious assumption.</li>
  <li>The trailing stop is updated at candle close.</li>
  <li>No spread, commission, swap or slippage. No news filter.</li>
</ul>
<div class="kutu">So the quick test is for ruling an idea out, not for confirming it. The final test is the same rule file in MT5 Strategy Tester, with your broker's cost settings.</div>

<h2 id="volatility">Volatility models</h2>
<p>The volatility lab offers three measures. EWMA weights recent returns exponentially (the RiskMetrics approach). Yang-Zhang uses open, close and intraday range together. GARCH models volatility clustering and its return to a long-run level; its parameters are estimated on your data by maximum likelihood.</p>

<h2 id="reading">How to read results</h2>
<ul>
  <li>Always read return together with the largest drawdown. A rule that earns the same with half the drawdown is the sturdier one.</li>
  <li>With few trades, the result may be luck. A rule that won with a handful of trades is not evidence.</li>
  <li>Trying a rule with many settings and keeping the best one is curve fitting. Re-test the setting you like on a period you did not test.</li>
  <li>A rule that worked in the past may not work in the future.</li>
</ul>
'''
sayfa("en/methodology/index.html", "Methodology: data, quick test and limits", "Where Kalibre Lab's data comes from, the rules of the quick test, the volatility models and what to watch when reading results.", "", METHOD, icindekiler(METHOD), dil="en")

# ------------------------------------------------------------------ about
ABOUT = '''
<h1>About</h1>
<p class="giris">Kalibre builds software for people who want to test a strategy honestly before putting money behind it.</p>

<h2 id="why">Why?</h2>
<p>The tools retail traders have usually show return and hide risk. On a bank's treasury desk the first question is not what a position could earn, but what it could lose on its worst day. An economist, likewise, looks less at one period's result and more at whether the conditions that produced it will repeat.</p>
<p>Kalibre Lab brings that way of looking at things to your own data: write the assumption down, test it on your broker's prices, see risk on the same line as return.</p>

<h2 id="principles">How we work</h2>
<ul>
  <li><b>The data is yours.</b> We publish no prices. The lab runs on your MT5 account's data or on clearly labelled SYNTHETIC samples.</li>
  <li><b>The key is yours.</b> We cannot read data passing through the bridge. That is guaranteed by the protocol itself, not by a promise (<a href="/en/security/">security</a>).</li>
  <li><b>The method is open.</b> We write down how a number is calculated and what it leaves out (<a href="/en/methodology/">methodology</a>).</li>
  <li><b>We give no advice.</b> You decide which rule to build and when to trade.</li>
</ul>

<h2 id="legal">Legal framework</h2>
<p>Kalibre Markets is a software provider. It holds no investment advice or brokerage license and does not offer those services. Results shown in the lab are based on past data and are not an indication of future results.</p>

<h2 id="contact">Contact</h2>
<p>For questions, suggestions or bug reports, see the <a href="/iletisim/">contact page</a>.</p>
'''
sayfa("en/about/index.html", "About: Kalibre", "Why Kalibre exists, how it works and what it does not do.", "", ABOUT, dil="en")

# ------------------------------------------------------------------ pricing
EN_MOTOR = '<li>Kalibre Engine: the add-on that runs your rule file in MT5. Use on a real account is <b>beta</b>; it requires explicit acceptance and a loss limit, read the <a href="/en/risk-disclosure/">risk disclosure</a>.</li>'
EN_ACIK = """  <label class="onay"><input type="checkbox" id="sartlar" required> <span>I have read and accept the <a href="/en/terms/">terms of use</a> and the <a href="/en/privacy/">privacy policy</a>.</span></label>
  <label class="onay"><input type="checkbox" id="cayma" required> <span>I agree that performance of the service begins as soon as my licence key is delivered and activated on a MetaTrader 5 account, and that I lose my 14-day right of withdrawal once it is activated (<a href="/en/terms#withdrawal">terms, section 12a</a>).</span></label>
  <button type="button" class="dugme" id="abone-ol">Subscribe</button>
  <p class="not" id="odeme-durum" role="status"></p>
  <p class="not">Payment is handled by Stripe; your card details never reach us. Your currency is shown on the checkout page. You can cancel at any time from the <a href="/en/license/">License</a> page and keep using the service until the end of the period.</p>"""
EN_KAPALI = """  <div class="yakinda">
    <h3>Payments open soon</h3>
    <p>Kalibre Lab is in beta. Join the list below to hear when subscriptions open.</p>
    <p><b>Invited?</b> Save the beta licence you received on the <a href="/en/license/">License</a> page.</p>
  </div>"""
EN_BEKLEME = f"""
<h2 id="waitlist">{"Not ready yet?" if ODEME_ACIK else "Hear when payments open"}</h2>
<p>{"Leave your email to hear when new features ship." if ODEME_ACIK else "We will email you when subscriptions open and when new features ship."}</p>
<div class="bekleme">
  <p id="ok-msg" hidden><b>You are on the list.</b> We will email you {"when new features ship" if ODEME_ACIK else "when subscriptions open"}.</p>
  <form action="https://formsubmit.co/markets@kalibrefin.com" method="POST" id="wl-form">
    <input type="hidden" name="_subject" value="Kalibre Lab waitlist: new sign-up (EN)">
    <input type="hidden" name="_next" value="https://kalibremarkets.com/en/pricing/?ok=1">
    <input type="hidden" name="_captcha" value="false">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
    <label for="eposta">Your email</label>
    <div class="satir">
      <input type="email" id="eposta" name="email" required autocomplete="email">
      <button type="submit" class="dugme">Join the list</button>
    </div>
  </form>
  <p class="not">Your email is used only for this and is delivered to us through the FormSubmit service. To leave the list, write to <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a>. Details are in the <a href="/en/privacy/">privacy policy</a>.</p>
</div>
"""
PLAN_SECIM = ('<div id="odeme-acik">\n' + EN_ACIK + '\n</div>\n' + EN_KAPALI.replace('<div class="yakinda">', '<div class="yakinda" id="odeme-yakinda" hidden>')) if ODEME_ACIK else EN_KAPALI
PRICING = f"""
<h1>Pricing</h1>
<p class="giris">The free part of the lab lets you rule ideas out. The subscription is for running a rule you trust on your own MetaTrader 5 account and streaming your data live.</p>

<div class="plan" id="plan">
  <div class="plan-bas">
    <h2>Kalibre Lab <span class="rozet-beta">beta</span></h2>
    <p class="fiyat"><span class="sayi">$19</span> / month <span class="not">(€17 in the euro area, 399 TL in Turkey)</span></p>
  </div>
  <ul>
    {EN_MOTOR}
    <li>Prop shield: daily and total loss limits, FTMO and The5ers presets</li>
    <li>Live, encrypted data bridge from MetaTrader 5 (Kalibre Bridge)</li>
    <li>Up to 2 MT5 accounts</li>
    <li>Everything in the free part</li>
  </ul>
{PLAN_SECIM}
</div>

<h2 id="free">What stays free</h2>
<ul>
  <li>The lab, with SYNTHETIC sample series and files you upload yourself.</li>
  <li>Building rule files, the quick test and the volatility lab.</li>
  <li>Kalibre Engine in MT5 Strategy Tester: historical tests need no license.</li>
</ul>
{EN_BEKLEME}
<div class="kutu">Kalibre Markets is not a licensed investment firm and does not give investment advice. The subscription is a software tool for rules and tests you set up yourself; it is not investment advice. Kalibre Engine places trades with your approval, according to rules you built; you are responsible for the results. Details are in the <a href="/en/risk-disclosure/">risk disclosure</a>.</div>
"""
EN_PRO_BETIK_KAPALI = """<script>
if (new URLSearchParams(location.search).get('ok') === '1') { document.getElementById('ok-msg').hidden = false; document.getElementById('wl-form').hidden = true; }
</script>"""
EN_PRO_BETIK_ACIK = """<script>
(function () {
  var q = new URLSearchParams(location.search);
  var durum = document.getElementById('odeme-durum');
  if (q.get('iptal') === '1') durum.textContent = 'Checkout was not completed; your card was not charged. You can try again at any time.';
  var d = document.getElementById('abone-ol');
  d.addEventListener('click', async function () {
    if (!document.getElementById('sartlar').checked) { durum.textContent = 'To continue, please accept the terms of use and the privacy policy.'; return; }
    if (!document.getElementById('cayma').checked) { durum.textContent = 'To continue, please tick the box about the right of withdrawal.'; return; }
    d.disabled = true; d.textContent = 'Opening checkout';
    durum.textContent = '';
    try {
      var r = await fetch('/api/odeme/baslat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sartlar: true, cayma_onay: true, dil: 'en' }) });
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.url) { location.href = j.url; return; }
      durum.textContent = j.hata || 'Checkout could not be opened. Please try again shortly.';
    } catch (e) {
      durum.textContent = 'Could not connect. Check your internet connection and try again.';
    }
    d.disabled = false; d.textContent = 'Subscribe';
  });
})();
</script>"""
_tr = open(os.path.join(_d, "sayfa-uret.py")).read()
PRO_STIL = _tr.split('PRO_STIL = """')[1].split('"""')[0]
HESAP_STIL = _tr.split('HESAP_STIL = """')[1].split('"""')[0]
PROP_STIL = _tr.split('PROP_STIL = """')[1].split('"""')[0]
PRO_ODEME_YEDEK = _tr.split('PRO_ODEME_YEDEK = """')[1].split('"""')[0]
EN_PRO_BETIK = (EN_PRO_BETIK_ACIK + EN_PRO_BETIK_KAPALI + PRO_ODEME_YEDEK) if ODEME_ACIK else EN_PRO_BETIK_KAPALI
sayfa("en/pricing/index.html", "Pricing: Kalibre Lab", ("Kalibre Lab subscription: run Kalibre Engine and the prop shield on your MT5 account and stream your data through the encrypted bridge. $19/month, cancel any time." if ODEME_ACIK else "Kalibre Lab (beta) subscription: $19 a month. Payments open soon; join the waitlist."), "/en/pricing/", PRICING, ek_stil=PRO_STIL, ek_betik=EN_PRO_BETIK, dil="en")

# ------------------------------------------------------------------ license
LICENSE = """
<h1>Your license</h1>
<p class="giris" id="hesap-giris">Your subscription's license key appears here. You enter it once in the Kalibre add-ons; they renew it on their own while your subscription runs.</p>

<div class="lisans" id="lisans" hidden>
  <p class="not" id="lisans-durum"></p>
  <label for="anahtar-alan">Your license key</label>
  <div class="satir">
    <input id="anahtar-alan" class="sayi" readonly spellcheck="false">
    <button type="button" class="dugme" id="kopyala">Copy</button>
  </div>
  <p class="not">Do not share the key. It can be used on up to 2 MT5 accounts and is bound to the first accounts it is used on.</p>
  <div class="eylem-satir">
    <button type="button" class="dugme ikincil" id="portal">Manage subscription</button>
    <button type="button" class="dugme ikincil" id="unut">Remove from this browser</button>
  </div>
  <p class="not" id="portal-durum" role="status"></p>
</div>

<div class="lisans" id="indirmeler" hidden>
  <h2 style="font-size:22px;margin:0 0 6px">Download the add-ons</h2>
  <p class="not">Both work with the same license key. Setup steps are on the <a href="/en/setup/">setup page</a>.</p>
  <div class="eylem-satir">
    <button type="button" class="dugme" data-eklenti="kopru">Kalibre Bridge</button>
    <button type="button" class="dugme" data-eklenti="motor">Kalibre Engine</button>
  </div>
  <p class="not" id="indir-durum" role="status"></p>
</div>

<div id="anahtar-yok">
  <p>There is no license saved in this browser. If you have subscribed, paste your key below; otherwise see the <a href="/en/pricing/">pricing page</a>.</p>
  <div class="lisans">
    <label for="anahtar-gir">License key</label>
    <div class="satir">
      <input id="anahtar-gir" class="sayi" placeholder="KLM-XXXXX-XXXXX-XXXXX-XXXXX" spellcheck="false" autocomplete="off">
      <button type="button" class="dugme ikincil" id="kaydet">Save</button>
    </div>
    <p class="not" id="gir-durum" role="status"></p>
  </div>
</div>

<h2 id="motor">Enter the key in Kalibre Engine</h2>
<ol>
  <li>Attach Kalibre Engine to a chart and open the <b>Inputs</b> tab.</li>
  <li>Paste your key into <b>License key</b> and click <b>OK</b>.</li>
  <li>Make sure MT5 allows WebRequest for <code>https://kalibremarkets.com</code> (<a href="/en/setup/#permission">step 4 of setup</a>).</li>
</ol>
<p>Engine checks the license a few seconds after starting and renews it every 6 hours. If the internet connection drops, it keeps working on the last valid license for 72 more hours. Historical tests in Strategy Tester need no license.</p>

<h2 id="cancel">Cancelling and changing accounts</h2>
<p><b>Manage subscription</b> takes you to Stripe's secure page, where you can change your card, download invoices or cancel. If you cancel, your license stays valid until the end of the period.</p>
<p>To move your license to another MT5 account, <a href="/iletisim/">write to us</a>.</p>
"""
_hb = _tr.split('HESAP_BETIK = """')[1].split('"""')[0]
CEVIRI = [
  ("var DURUM = { active: 'etkin', trialing: 'deneme süresinde', past_due: 'ödeme bekleniyor', canceled: 'iptal edildi', unpaid: 'ödenmedi' };",
   "var DURUM = { active: 'active', trialing: 'in trial', past_due: 'payment pending', canceled: 'cancelled', unpaid: 'unpaid' };"),
  ("toLocaleDateString('tr-TR'", "toLocaleDateString('en-GB'"),
  ("'Abonelik: <b class=\"'", "'Subscription: <b class=\"'"),
  ("', geçerlilik ' + tarih(bilgi.bitis)", "', valid until ' + tarih(bilgi.bitis)"),
  ("'. Hesap: ' + bilgi.eposta", "'. Account: ' + bilgi.eposta"),
  ("'Ödemen alınıyor, lisans anahtarın hazırlanıyor.'", "'Receiving your payment, preparing your license key.'"),
  ("'Teşekkürler, aboneliğin başladı. Lisans anahtarın aşağıda; bu tarayıcıda da saklandı.'", "'Thank you, your subscription has started. Your license key is below; it is also saved in this browser.'"),
  ("history.replaceState(null, '', '/hesap/');", "history.replaceState(null, '', '/en/license/');"),
  ("'Lisans bilgisi alınamadı. Ödeme tamamlandıysa birkaç dakika sonra bu sayfayı yenile ya da bize yaz.'", "'License details could not be retrieved. If your payment went through, reload this page in a few minutes or write to us.'"),
  ("'Bağlantı kurulamadı. Sayfayı yenile.'", "'Could not connect. Reload the page.'"),
  ("this.textContent = 'Kopyalandı'", "this.textContent = 'Copied'"),
  ("this.textContent = 'Seçildi, Ctrl+C'", "this.textContent = 'Selected, press Ctrl+C'"),
  ("b.textContent = 'Kopyala'", "b.textContent = 'Copy'"),
  ("'Anahtar KLM ile başlar ve dört gruptan oluşur. Kopyalarken eksik kalmış olabilir.'", "'The key starts with KLM and has four groups. Part of it may be missing.'"),
  ("'Anahtar yalnız bu tarayıcıdan kaldırılır; aboneliğin ve MT5 eklentin etkilenmez. Devam edilsin mi?'", "'The key is only removed from this browser; your subscription and MT5 add-ons are not affected. Continue?'"),
  ("durum.textContent = j.hata || 'İndirilemedi.';", "durum.textContent = j.hata || 'Download failed.';"),
  ("' indirildi' + (r.headers.get('X-Kalibre-Surum') ? ' (sürüm ' + r.headers.get('X-Kalibre-Surum') + ')' : '') + '. Dosyayı MT5 veri klasöründe MQL5\\\\Experts altına kopyala.'",
   "' downloaded' + (r.headers.get('X-Kalibre-Surum') ? ' (version ' + r.headers.get('X-Kalibre-Surum') + ')' : '') + '. Copy the file into MQL5\\\\Experts in your MT5 data folder.'"),
  ("durum.textContent = 'Bağlantı kurulamadı.';", "durum.textContent = 'Could not connect.';"),
  ("$('portal-durum').textContent = j.hata || 'Abonelik sayfası açılamadı.';", "$('portal-durum').textContent = j.hata || 'The subscription page could not be opened.';"),
  ("$('portal-durum').textContent = 'Bağlantı kurulamadı.';", "$('portal-durum').textContent = 'Could not connect.';"),
  ("'/api/odeme/oturum?oturum=' + encodeURIComponent(oturum)", "'/api/odeme/oturum?dil=en&oturum=' + encodeURIComponent(oturum)"),
  ("JSON.stringify({ anahtar: $('anahtar-alan').value, eklenti: b.dataset.eklenti })", "JSON.stringify({ anahtar: $('anahtar-alan').value, eklenti: b.dataset.eklenti, dil: 'en' })"),
  ("JSON.stringify({ anahtar: $('anahtar-alan').value }) });", "JSON.stringify({ anahtar: $('anahtar-alan').value, dil: 'en' }) });"),
]
for a, b in CEVIRI:
    assert _hb.count(a) >= 1, a[:70]
    _hb = _hb.replace(a, b)
sayfa("en/license/index.html", "Your license: Kalibre Lab", "Your Kalibre Lab license key, subscription status, add-on downloads and subscription management.", "", LICENSE, ek_stil=HESAP_STIL, ek_betik=_hb, gizli=True, dil="en")

# ------------------------------------------------------------------ prop
PROP = """
<h1>Don't fail the challenge on a rule breach.</h1>
<p class="giris">Most prop firm challenges are not lost to a bad strategy but to one bad day: the daily loss or total drawdown limit is breached and the account is closed. The Kalibre Engine shield watches those limits on every tick and steps in before you notice.</p>
<div class="eylem-satir"><a class="dugme" href="/en/pricing/">See pricing</a><a class="dugme ikincil" href="#calculate">Check your own account</a></div>

<h2 id="how">What the shield does</h2>
<ul>
  <li><b>It tracks both floors.</b> The daily floor comes from the start-of-day balance, the total floor from the starting or peak balance; whichever is higher applies. The day resets at the firm's time (for FTMO, 00:00 Central European time, including summer time).</li>
  <li><b>It sizes lots to the limit.</b> A new trade's loss at its stop, together with the risk left to the stops of open positions, cannot exceed the distance to the floor. Positions you opened by hand on the account count too.</li>
  <li><b>It stops first, then closes.</b> Once the distance to the floor is down to twice the safety margin, no new trades are opened. At one margin, Engine closes its own positions and trades no more until the day resets.</li>
  <li><b>It applies the news rule.</b> If the firm bans trading around high-impact news, no new trades are opened in that window.</li>
</ul>

<h2 id="presets">Presets</h2>
<table class="tablo">
  <thead><tr><th>Program</th><th>Daily loss</th><th>Total loss</th><th>Source</th></tr></thead>
  <tbody>
    <tr><td>FTMO 2-Step</td><td>5%</td><td>10%, static</td><td>Firm's page, 23 Oct 2026</td></tr>
    <tr><td>FTMO 1-Step</td><td>3%</td><td>10%, trails the end-of-day balance peak</td><td>Firm's page, 23 Oct 2026</td></tr>
    <tr><td>FTMO Instant</td><td>3%</td><td>10%, trails the balance peak intraday</td><td>Firm's page, 23 Oct 2026</td></tr>
    <tr><td>The5ers High Stakes</td><td>5%</td><td>10%</td><td>Firm's page, 23 Oct 2026; cautious setting because the page does not say how the daily limit is calculated</td></tr>
    <tr><td>Custom</td><td colspan="3">At another firm? Enter your own limits.</td></tr>
  </tbody>
</table>
<p class="not">Firm rules can change. Before turning the shield on, compare the preset with your own account's terms. Consistency rules such as "best day" are not covered by the shield.</p>

<h2 id="calculate">Check your own account</h2>
<p>The same calculation the shield makes, for a single moment. You enter the values; nothing is sent anywhere.</p>
<div class="hesap" id="kalkan-hesap">
  <div class="alanlar">
    <label>Program<select name="program"><option value="ftmo2">FTMO 2-Step</option><option value="ftmo1">FTMO 1-Step</option><option value="ftmoi">FTMO Instant</option><option value="the5ers">The5ers High Stakes</option></select></label>
    <label>Starting capital<input name="baslangic" inputmode="decimal" value="100000"></label>
    <label>Balance at the start of today<input name="gunbasi" inputmode="decimal" value="101200"></label>
    <label>Current equity<input name="varlik" inputmode="decimal" value="98400"></label>
    <label data-tepe hidden>Highest balance<input name="tepe" inputmode="decimal" value="102000"></label>
    <label>Risk left to open positions' stops<input name="acik" inputmode="decimal" value="0"></label>
    <label>Safety margin (% of starting capital)<input name="pay" inputmode="decimal" value="0.5"></label>
  </div>
  <div data-sonuc>
    <table class="tablo">
      <tbody>
        <tr><th>Daily floor</th><td class="sayi" data-s="gunluk"></td></tr>
        <tr><th>Total loss floor</th><td class="sayi" data-s="azami"></td></tr>
        <tr><th>Floor in force</th><td class="sayi" data-s="taban"></td></tr>
        <tr><th>Distance to floor</th><td class="sayi" data-s="oda"></td></tr>
        <tr><th>Largest risk a new trade can carry</th><td class="sayi" data-s="risk"></td></tr>
      </tbody>
    </table>
    <p class="durum" data-s="durum"></p>
  </div>
</div>

<h2 id="trial">A trial run</h2>
<p>We tested the shield in Strategy Tester with a deliberately reckless strategy: EURUSD 15-minute, 1 January to 1 October 2026, $100,000 starting balance, 5% of balance risked per trade.</p>
<table class="tablo">
  <thead><tr><th></th><th>Without the shield</th><th>With the FTMO 2-Step shield</th></tr></thead>
  <tbody>
    <tr><td>Worst day's realised loss</td><td class="sayi">18,900</td><td class="sayi">4,009</td></tr>
    <tr><td>Daily limit (5,000) breached?</td><td>Yes, the challenge would be lost</td><td>No</td></tr>
    <tr><td>Lowest balance (total floor 90,000)</td><td class="sayi">94,432</td><td class="sayi">90,999</td></tr>
  </tbody>
</table>
<div class="kutu">This is a historical simulation and shows how the shield follows the rules; it is not a claim of profit. The shielded account ended the period at a loss, but broke no rule. The shield does not turn a bad strategy into a good one; it stops one bad day from closing the account.</div>

<h2 id="scope">Scope and limits</h2>
<ul>
  <li>The shield is part of Kalibre Engine. Engine runs the rule file you build in Kalibre Lab on your own account; we sell no signals and make no decisions for you.</li>
  <li>Kalibre is not a prop firm and is not affiliated with any firm. Firm names appear only to describe their rules.</li>
  <li>Slippage and gaps can cause losses beyond the stop; that is what the safety margin is for.</li>
  <li>The shield is in beta and is not a guarantee. Read the <a href="/en/risk-disclosure/">risk disclosure</a> before using it on a real account.</li>
</ul>
"""
sayfa("en/prop/index.html", "Prop firm shield: don't fail the challenge on a rule breach", "The Kalibre Engine shield watches daily and total loss limits on every tick, sizes lots to the limit and stops near the floor. FTMO and The5ers presets.", "/en/prop/", PROP, icindekiler(PROP), ek_stil=PROP_STIL, ek_betik='<script src="/static/kalkan-hesap.js" defer></script>', dil="en")

# ------------------------------------------------------------------ forex
FOREX = """
<h1>Don't blow up your account.</h1>
<p class="giris">Most retail leveraged trading accounts lose money. The strongest driver of those losses is leverage and position size; strategy comes second. Kalibre Lab fixes those two first.</p>
<div class="eylem-satir"><a class="dugme" href="/en/lab/">Open the lab</a><a class="dugme ikincil" href="/en/setup/">Read the setup guide</a></div>

<h2 id="why">Why risk first?</h2>
<ul>
  <li><b>Loss rates are high.</b> According to the European regulator ESMA's 2018 review, 74-89% of retail CFD accounts lost money. In Turkey, the Capital Markets Board said in 2015 that about 87-88% of forex investors lost money, and cut maximum leverage to 1:10 in 2017.</li>
  <li><b>Leverage magnifies losses.</b> An academic study of the 2010 US leverage cap (Heimer and Simsek, Journal of Financial Economics, 2019) found that the cap reduced high-leverage traders' losses by about 40%.</li>
  <li><b>Volatility changes, so should your lot size.</b> When volatility rises, the same lot means more risk. Scaling positions to volatility has been shown not to raise returns meaningfully in currencies, but to reduce extreme losses (Harvey et al., 2018). That is why our promise is not "win more" but "blow up less".</li>
</ul>

<h2 id="tools">In Kalibre Lab</h2>
<ul>
  <li><b>Risk budget:</b> you decide what percentage of your balance each trade risks; the lot is calculated from the stop distance.</li>
  <li><b>Volatility scaling:</b> when volatility rises above normal, risk shrinks on its own (EWMA, Yang-Zhang, GARCH).</li>
  <li><b>Daily loss limit and news filter:</b> to stop on a bad day and to stay out around high-impact releases.</li>
  <li><b>Your own data:</b> you test your rule on your broker's prices; the final test is in MT5 Strategy Tester, with your own cost settings.</li>
</ul>

<h2 id="broker">Your broker</h2>
<p>Kalibre Lab is not a broker. It does not open your account or route your orders; it works on your own account with any broker that offers MetaTrader 5. Use a broker authorised by the regulator in your country.</p>

<div class="kutu">Kalibre Lab is a software tool; it does not provide investment advice and does not promise returns. Leveraged trading can lose you all of the money you deposit.</div>
"""
sayfa("en/forex/index.html", "Retail forex: don't blow up your account", "In leveraged trading, the strongest driver of losses is position size. Kalibre Lab fixes risk first with a risk budget, volatility-scaled lots and a daily loss limit.", "", FOREX, icindekiler(FOREX), ek_stil=PROP_STIL, dil="en")

# ------------------------------------------------------------------ closed beta guide
_tr2 = open(os.path.join(_d, "sayfa-uret.py")).read()
exec(_tr2[_tr2.index("# ------------------------------------------------------------------ kapalı beta rehberi"):_tr2.index('BETA = f"""')])
BETA_EN = f"""
<h1>Beta programme guide</h1>
<p class="giris">Thank you for trying Kalibre Lab. This page explains what is in the beta, what to do in your first session, what to avoid and how to send feedback.</p>
<div class="kutu"><b>Use a demo account in the beta programme.</b> Do not connect an account that trades real money with an invited beta licence. All results are simulations and may not include costs; do not make real-money decisions with them. Details are in the <a href="/en/risk-disclosure/">risk disclosure</a>.</div>

<h2 id="licence">How do I get my beta licence?</h2>
<p>Your invitation comes with an <b>invite code</b>. On the <a href="/en/pricing/">Pricing</a> page, accept the terms and press "Subscribe"; on the checkout page choose "Add promotion code" and enter your code. The code makes the first 3 months free and no card is needed. After checkout your licence key appears on the <a href="/en/license/">License</a> page. If you were sent a licence key directly, save it on the same page.</p>
<div class="kutu"><b>What happens after 3 months?</b> When the free period ends, the subscription moves to the paid monthly plan and Stripe asks you for payment. If you do not want to continue, cancel on the <a href="/en/license/">License</a> page before the period ends; if no payment is made the licence closes within a few days. While the invite code is active the licence covers Kalibre Bridge only; once the free period ends and the paid plan starts, the licence covers the full product, including Kalibre Engine.</div>

<h2 id="whats-in">What is in the beta?</h2>
<ul>
  <li><b>MetaTrader 5 bridge and Dashboard:</b> your demo MT5 balance, open positions, the symbols you follow and the last 90 days of closed trades, end-to-end encrypted.</li>
  <li><b>Strategy builder:</b> Simple mode (blocks) and Advanced mode (form); both edit the same strategy.</li>
  <li><b>Quick test:</b> tries a rule on your own candles in seconds. It does not include costs.</li>
  <li><b>Optimization:</b> parameter scan, training and test periods, heat map, a measure of whether a result could be luck.</li>
  <li><b>Alpaca (paper) and Tradier (sandbox):</b> direct browser connection to US brokers.</li>
</ul>
<div class="kutu"><b>Automated trading is not part of the beta programme.</b> Kalibre Engine (the add-on that runs a rule file in MT5) and the prop shield are not included in the beta licence; your beta licence covers Kalibre Bridge (read-only) only. No orders are placed on any account in the beta programme.</div>

<h2 id="first-session">First session (about 30 minutes)</h2>
<ol>
  <li>Connect your demo MT5 account on the <a href="/en/connect">connect page</a>: download the add-on, paste the code, add the permission address, press <b>OK</b>. Note any step where you get stuck.</li>
  <li>Open the <a href="/en/dashboard">Dashboard</a>: are balance, quotes and positions right? Compare with what MT5 shows.</li>
  <li>In the strategy builder, build a strategy in Simple mode (e.g. a moving-average cross) or load an educational example; fill in the risk section yourself; run the quick test.</li>
  <li>On the <a href="/lab/optimizasyon.html?dil=en">Optimization</a> page, scan two parameters; look at the heat map and the test-period result.</li>
  <li>If you like, also connect an Alpaca paper or Tradier sandbox account on the <a href="/en/connect">connect page</a> and try the Dashboard with it.</li>
</ol>

<h2 id="dont">Please don't</h2>
<ul>
  <li>Connect a real account.</li>
  <li>Run rule files for automated trading on any account; there is no automated trading in the beta.</li>
  <li>Share your pairing code, licence key or Alpaca/Tradier keys with anyone, including us.</li>
  <li>Use simulation results for investment decisions.</li>
</ul>

<h2 id="feedback-wanted">What feedback do we want?</h2>
<ul>
  <li><b>Setup friction:</b> which step, and what the screen said.</li>
  <li><b>Wrong numbers:</b> compared with MT5 or your broker; with a screenshot if possible (cover your account number).</li>
  <li><b>Confusing wording:</b> which sentence, and what you understood.</li>
  <li><b>Crashes or freezes:</b> browser, operating system and the steps you took.</li>
</ul>

<h2 id="privacy">What do we see about you?</h2>
<p>We cannot see your market data, positions or trades: data from the bridge is encrypted and opens only in your browser; Alpaca and Tradier data comes straight to your browser. All we see is the feedback you send us and the MT5 account number your beta licence is used on (to bind the licence to the account).</p>

<h2 id="send">Send feedback</h2>
<p>Fill in the form or <a href="{beta_mailto("en")}">send it by email</a> (a template opens).</p>
{beta_form("en")}
"""
sayfa("en/beta/index.html", "Beta programme guide: Kalibre Lab", "Kalibre Lab beta programme: what is included, first session, what to avoid and how to send feedback.", "", BETA_EN, icindekiler(BETA_EN), ek_stil=BETA_FORM_STIL, ek_betik=BETA_BETIK, gizli=True, dil="en")

# ------------------------------------------------------------------ risk disclosure
RISK = """
<h1>Risk disclosure</h1>
<p class="giris">Read this page before using Kalibre Lab, Kalibre Bridge and Kalibre Engine. This risk disclosure forms an integral part of the <a href="/en/terms">terms of use</a>.</p>

<h2 id="beta">Beta version</h2>
<p>Kalibre Lab is in beta. Features may change, the software may contain errors and calculations may produce incorrect results. Before relying on a result, test the same rule in your own MetaTrader 5 Strategy Tester and on a demo account. Report any number that looks wrong through the <a href="/en/beta/">feedback form</a>.</p>

<h2 id="simulated">Simulated and hypothetical results</h2>
<p>The lab, the quick test, the optimization panel and the examples on these pages show hypothetical (simulated) results, which have inherent limitations:</p>
<ul>
  <li>Unlike an actual performance record, simulated results do not represent actual trading.</li>
  <li>Since the trades have not been executed, the results may have under- or over-compensated for the impact, if any, of certain market factors, such as lack of liquidity.</li>
  <li>The quick test does not include spread, commission, swap or slippage; real results are usually lower.</li>
  <li>Optimization is carried out on past data with the benefit of hindsight; the setting that looks best is often fitted to the past.</li>
  <li>No representation is being made that any account will or is likely to achieve profits or losses similar to those shown.</li>
</ul>

<h2 id="leverage">Risk of leveraged trading</h2>
<p>Leveraged trading (forex, CFDs and similar products) can lose you all of the money you deposit. According to the European regulator ESMA's 2018 review, 74-89% of retail CFD accounts lost money. In Turkey, the Capital Markets Board said in 2015 that about 87-88% of forex investors lost money. Do not trade with money you cannot afford to lose.</p>

<h2 id="engine">Using Kalibre Engine on a real account</h2>
<p>Kalibre Engine runs the rule file you build on your account and sends orders. On a real account during the beta, these risks apply:</p>
<ul>
  <li><b>Software errors:</b> the rule file or the Engine may behave unexpectedly.</li>
  <li><b>Connectivity:</b> if MetaTrader 5 closes, the computer sleeps or the internet drops, the Engine cannot manage positions.</li>
  <li><b>Slippage and gaps:</b> in fast markets, around news and at weekend opens, orders can be filled at prices different from the stop or target.</li>
  <li><b>The shield is not a guarantee:</b> the prop shield and loss limits can be exceeded because of gaps, slippage and broker rules.</li>
</ul>
<p>That is why, on a real account, the Engine opens no new trades unless you tick "I accept the beta risk on a real account" in the add-on's settings and a loss limit (the prop shield or a daily loss limit) is set.</p>

<h2 id="no-advice">Not investment advice</h2>
<p>Kalibre Markets does not provide investment advice, portfolio management or brokerage services and is not a licensed investment firm. You decide which rule to build and when, in which symbol and at what size to trade; you are responsible for the results. Educational examples are starting points, not recommendations.</p>
<p>Kalibre Markets never holds your money, securities or crypto assets, never asks for access to them and never opens an account in your name. Your assets are held only at the broker you choose.</p>

<h2 id="data">Data and privacy</h2>
<p>Your data from the bridge is end-to-end encrypted; your Alpaca and Tradier data comes directly to your browser. Which data is processed where is described in the <a href="/en/privacy/">privacy policy</a> and on the <a href="/en/security/">security page</a>.</p>
"""
sayfa("en/risk-disclosure/index.html", "Risk disclosure: Kalibre Lab", "Kalibre Lab beta status, limits of simulated results, the risk of leveraged trading and the risks of using Kalibre Engine on a real account.", "", RISK, icindekiler(RISK), dil="en")
