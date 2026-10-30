# English pages of the product site. Uses the shared header/footer from sayfa-uret.py.
import os
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

# ------------------------------------------------------------------ setup
SETUP = '''
<h1>Setup</h1>
<p class="giris">You connect MetaTrader 5 to Kalibre Lab with the Kalibre Bridge add-on, a pairing code and one MT5 setting. Setup is done once. After that, the add-on sends data to the lab whenever MT5 is open.</p>
<div class="kutu yesil">Do your first setup on a <b>demo account</b>. Kalibre Bridge is read-only, and a demo account lets you learn the tool with no money at risk.</div>

<h2 id="requirements">What you need</h2>
<ul>
  <li>MetaTrader 5. On Windows, your broker's installer is enough; on macOS, the official MetaQuotes app.</li>
  <li>A demo or live MT5 account with any broker.</li>
  <li>The Kalibre Bridge add-on (<code>KalibreKopru.ex5</code>) and your license key. Both are on the <a href="/account">Account</a> page once you subscribe.</li>
</ul>

<h2 id="add-on">1. Add the add-on to MetaTrader 5</h2>
<ol>
  <li>In MT5, open <b>File &gt; Open Data Folder</b>.</li>
  <li>Go to <code>MQL5\\Experts</code> and copy <code>KalibreKopru.ex5</code> there.</li>
  <li>Back in MT5, right-click <b>Expert Advisors</b> in the <b>Navigator</b> and choose <b>Refresh</b>. <b>KalibreKopru</b> appears in the list.</li>
</ol>

<h2 id="code">2. Create a pairing code in the lab</h2>
<ol>
  <li>Open the <a href="/connect">Connect MetaTrader 5</a> page. It shows the steps in order.</li>
  <li>Your browser generates a pairing code. Copy it with the <b>Copy</b> button.</li>
</ol>
<p>The code starts with <code>KLB1</code>. Kalibre Bridge derives the encryption key from it. The code is stored in this browser and in the add-on's inputs, and is never sent to our servers. Do not share it.</p>

<h2 id="chart">3. Attach the add-on to a chart</h2>
<ol>
  <li>Drag <b>KalibreKopru</b> from the Navigator onto any chart.</li>
  <li>Open the <b>Inputs</b> tab.</li>
  <li>Paste the lab's code into <b>Pairing code</b>.</li>
  <li>Paste your license key (it starts with <code>KLM-</code>) from the <a href="/account">Account</a> page into <b>License key</b>.</li>
  <li>List the symbols you want under <b>Symbols</b>, separated by commas, e.g. <code>EURUSD,GBPUSD,XAUUSD</code>. Left empty, the add-on uses the first 12 symbols in Market Watch.</li>
  <li>Pick a <b>Timeframe</b> (M1, M5, M15, M30, H1, H4, D1 or W1) and click <b>OK</b>.</li>
</ol>
<p>Kalibre Bridge cannot place, modify or close orders, so <b>Algo Trading</b> can stay off in MT5.</p>

<h2 id="permission">4. Allow the Kalibre address in MetaTrader 5</h2>
<p>MT5 lets add-ons connect only to addresses you allow. You add the Kalibre address once.</p>
<ol>
  <li>Open <b>Tools &gt; Options</b>.</li>
  <li>Go to the <b>Expert Advisors</b> tab.</li>
  <li>Tick <b>Allow WebRequest for listed URL</b>.</li>
  <li>Add <code>https://kalibremarkets.com</code> to the list.</li>
  <li>Click <b>OK</b>. If you close the window with the X, the permission is not saved.</li>
</ol>

<h2 id="check">5. Check the connection</h2>
<p>A <b>Kalibre Bridge</b> line appears in the top-left corner of the chart. The add-on checks your license first, which takes a few seconds, and then starts sending data. When the status reads <b>connected</b>, the count of sent documents goes up. The lab shows the connection status, your broker's name and the time of the last heartbeat.</p>
<p>Series refresh when a new candle closes: hourly on H1, daily on D1.</p>

<h2 id="troubleshooting">Common situations</h2>
<table class="tablo">
  <thead><tr><th>What you see on the chart</th><th>What to do</th></tr></thead>
  <tbody>
    <tr><td>No WebRequest permission</td><td>Repeat step 4. Make sure the address is exactly <code>https://kalibremarkets.com</code> and that you clicked <b>OK</b>.</td></tr>
    <tr><td>The add-on will not attach, a code error appears</td><td>Copy the code from the lab again. A character may be missing at the start or end.</td></tr>
    <tr><td>License invalid</td><td>Copy the key again from the <a href="/account">Account</a> page. You also see this if your subscription has ended or the key is already used on two MT5 accounts. The add-on retries every minute.</td></tr>
    <tr><td>Relay unreachable</td><td>Check your internet connection. The add-on retries every few seconds.</td></tr>
    <tr><td>The lab says "code does not match"</td><td>The code in the add-on differs from the lab's. If you created a new code in the lab, paste the new one into the add-on too.</td></tr>
    <tr><td>The connection drops after a while</td><td>The bridge works while MT5 is open and the computer is awake. When the computer sleeps, data stops; it resumes on its own when MT5 is back.</td></tr>
  </tbody>
</table>

<h2 id="tradier">Connecting with Tradier (US)</h2>
<p>If you have an account with the US broker Tradier, you can connect it instead of MetaTrader 5. No add-on is needed; the lab talks to Tradier directly from your browser.</p>
<ol>
  <li>Create an API access token in your Tradier account. We suggest a <b>Sandbox</b> token for your first try; Sandbox prices are delayed by 15 minutes.</li>
  <li>On the <a href="/lab/baglan?kaynak=tradier">connect page</a>, choose the <b>Tradier</b> tab, paste the token, pick the environment and press <b>Connect</b>.</li>
  <li>If you have several accounts, pick one. The Dashboard, the strategy builder and the optimizer now use Tradier data.</li>
</ol>
<div class="kutu">A Tradier token gives full access to your account. Kalibre makes read-only requests with it and never sends orders. The token is stored in this browser and sent only to Tradier. It is never sent to Kalibre servers. Disconnecting deletes it from this browser. Under Tradier's terms, this connection is for personal use.</div>

<h2 id="alpaca">Connecting with Alpaca (US)</h2>
<p>If you have an account with the US broker Alpaca, you can connect it too. No add-on is needed; the lab talks to Alpaca directly from your browser.</p>
<ol>
  <li>Create an API key pair in your Alpaca dashboard (Key ID and Secret). We suggest a <b>Paper</b> (simulated) account for your first try.</li>
  <li>On the <a href="/lab/baglan?kaynak=alpaca">connect page</a>, choose the <b>Alpaca</b> tab, paste both keys, pick the environment and press <b>Connect</b>.</li>
  <li>The Dashboard, the strategy builder and the optimizer now use Alpaca data. If your watchlist is empty, your open positions are shown; if there are none, the symbols you add on the Dashboard.</li>
</ol>
<div class="kutu">On the free Alpaca plan, live prices come from the IEX exchange only, which is a small share of total market volume. Kalibre makes read-only requests with your keys and never sends orders. The keys are stored in this browser and sent only to Alpaca. They are never sent to Kalibre servers. Disconnecting deletes them from this browser. Use your own personal API keys.</div>

<div class="kutu">Kalibre Lab is in beta. Read the <a href="/risk-disclosure">risk disclosure</a> before setup, and use a demo account first.</div>

<h2 id="without">Working without the add-on</h2>
<p>You can also drag a candle file exported from MT5 (CSV or JSON) into the lab. Your browser reads the file locally. It is not uploaded.</p>
<p class="not">The add-ons show their messages in English, or in Turkish if your MetaTrader 5 is set to Turkish.</p>
'''
sayfa("setup/index.html", "Setup: connect MetaTrader 5 to Kalibre Lab", "How to install the Kalibre Bridge add-on in MetaTrader 5, enter the pairing code and license key, and allow WebRequest.", "/setup", SETUP,
      icindekiler(SETUP) + '<p>Stuck on a step? <a href="mailto:markets@kalibrefin.com" style="display:inline">Email us</a>.</p>', dil="en")

# ------------------------------------------------------------------ security
SECURITY = '''
<h1>Security</h1>
<p class="giris">Kalibre Bridge encrypts your MetaTrader 5 data on your computer before sending it. Our relay server stores only encrypted packets and cannot decrypt them. This page lists the methods we use and their limits.</p>

<h2 id="summary">Summary</h2>
<ul>
  <li>Kalibre Bridge is read-only. It cannot place, modify or close orders.</li>
  <li>Every packet is encrypted with AES-256-CTR and signed with HMAC-SHA256.</li>
  <li>The keys are derived from your pairing code. The code is never sent to our servers.</li>
  <li>The relay server deletes each packet within 2 hours.</li>
  <li>Kalibre never asks for your MT5 password.</li>
  <li>The license check sends your license key and MT5 account number to our license server.</li>
</ul>

<h2 id="code">Pairing code</h2>
<p>The pairing code is a 32-byte secret generated by your browser's cryptographic random number generator. It starts with <code>KLB1</code>. It is stored in two places: this browser's local storage and the add-on's inputs in MT5.</p>
<p>Three keys are derived from the code with HMAC-SHA256: a <b>channel ID</b> used to find packets, an <b>encryption key</b> and a <b>signing key</b>. The server sees only the channel ID. The code and the other two keys cannot be derived from it.</p>

<h2 id="encryption">Encryption and signatures</h2>
<ul>
  <li>Content is encrypted with AES-256 in CTR mode. Each packet uses a new nonce.</li>
  <li>Each packet is signed with HMAC-SHA256. The signature covers the channel ID, the packet's slot and the encrypted content.</li>
  <li>Your browser verifies the signature before decrypting. It rejects any packet that was changed, moved to another slot or signed with another code.</li>
  <li>Symbol names are encrypted. Packet names do not reveal which symbols you follow.</li>
</ul>
<p>The protocol is implemented three times: in the MT5 add-on, in the lab and in an independent reference implementation. Automated tests check that all three produce identical packets from the same input.</p>

<h2 id="server">Relay server</h2>
<table class="tablo">
  <thead><tr><th>What the relay server sees</th><th>What it cannot see</th></tr></thead>
  <tbody>
    <tr><td>Encrypted packets</td><td>Symbols, prices, candles</td></tr>
    <tr><td>Packet size and arrival time</td><td>Positions, balance, trade history</td></tr>
    <tr><td>Channel ID</td><td>Broker and server name</td></tr>
    <tr><td>IP address of the connection, during transfer</td><td>Your pairing code</td></tr>
  </tbody>
</table>
<p>The server checks each packet's format and keeps it in short-lived storage. A newer packet of the same type replaces the old one, and every packet is deleted within 2 hours. Packet contents are not written to logs. Writes per channel are rate-limited.</p>

<h2 id="add-on">Data Kalibre Bridge reads</h2>
<p>Kalibre Bridge reads the following from MT5, encrypts it and sends it. You can turn off positions, quotes and trade history in the add-on's inputs.</p>
<ul>
  <li>Closed candles for your symbols: time, open, high, low, close and tick volume. With the Symbols input empty, the first 12 symbols in Market Watch are used.</li>
  <li>Market Watch quotes for up to 40 symbols: bid, ask, time and description.</li>
  <li>Open positions: symbol, side, lot, open time and price, current price, stop, target, profit and magic number.</li>
  <li>Closed trades from the last 90 days (adjustable): symbol, side, lot, open and close time and price, profit, swap, commission, fees, magic number and comment.</li>
  <li>Deposits, withdrawals and other balance operations in the same period, with amount and time.</li>
  <li>Account currency, balance and equity.</li>
  <li>Broker name, server name and account type (demo, live or contest).</li>
</ul>
<p>Kalibre Bridge does not read your MT5 password or personal details. The encrypted data does not include your account number.</p>

<h2 id="license">License check</h2>
<p>Kalibre Bridge and Kalibre Engine check your license with our license server. The request contains your license key, your MT5 account number, the product name and the add-on's language. We store the MT5 account numbers linked to each license, up to 2 per license. This request is separate from the encrypted data channel.</p>

<h2 id="brokers">Alpaca and Tradier</h2>
<p>API keys and tokens for Alpaca and Tradier are stored in this browser and sent only to Alpaca or Tradier. They are never sent to Kalibre servers. Kalibre makes read-only requests with them.</p>

<h2 id="limits">Limits</h2>
<ul>
  <li><b>Anyone with your pairing code can read your data.</b> Do not share the code. To replace it, generate a new code in the lab and paste it into the add-on. The add-on then stops using the old code.</li>
  <li><b>Device security is your responsibility.</b> Anyone with access to your computer or browser can see decrypted data.</li>
  <li><b>Traffic metadata is visible.</b> The server sees packet size and timing for each channel.</li>
</ul>
<p>To report a security issue, email <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a>.</p>
'''
sayfa("security/index.html", "Security: Kalibre Lab", "How Kalibre Bridge encrypts MetaTrader 5 data, what our relay and license servers receive, and the limits of the protection.", "/security", SECURITY, icindekiler(SECURITY), dil="en")

# ------------------------------------------------------------------ methodology
METHOD = '''
<h1>Methodology</h1>
<p class="giris">This page explains where the lab's data comes from, how Quick Backtest calculates results and what it leaves out.</p>

<h2 id="data">Where the data comes from</h2>
<p>Kalibre does not publish market data. Each series in the lab comes from one of these sources, and the source is shown on the series:</p>
<table class="tablo">
  <thead><tr><th>Source</th><th>Label</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Sample series</td><td>EXAMPLE</td><td>Generated by a seeded random process, for getting to know the lab.</td></tr>
    <tr><td>Your file</td><td>YOUR DATA</td><td>A file you exported from MT5 or elsewhere. Your browser reads it locally.</td></tr>
    <tr><td>Kalibre Bridge</td><td>MT5 and broker name</td><td>Price history from your MT5 account, end-to-end encrypted (<a href="/security">security</a>).</td></tr>
    <tr><td>Alpaca, Tradier</td><td>Broker name</td><td>Price history requested by your browser with your own API key.</td></tr>
  </tbody>
</table>

<h2 id="time">Candle times</h2>
<p>Candle times from MT5 are your broker's server time, the time you see on the MT5 chart. We do not convert them to UTC: converting past candles with today's offset would shift them by an hour around daylight-saving changes. The lab shows the server time's offset from UTC separately.</p>

<h2 id="test">How Quick Backtest works</h2>
<p>Quick Backtest runs your rule in your browser with the same rules as Kalibre Engine in MetaTrader 5:</p>
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
  <li>Spread, commission and slippage are optional and zero by default. Swap is not included. There is no news filter.</li>
</ul>
<div class="kutu">Use Quick Backtest to filter ideas. Confirm a rule in MT5 Strategy Tester with the same rule file and your broker's costs.</div>

<h2 id="volatility">Volatility models</h2>
<p>The volatility lab offers three measures. EWMA weights recent returns exponentially (the RiskMetrics approach). Yang-Zhang uses open, close and intraday range together. GARCH models volatility clustering and its return to a long-run level; its parameters are estimated on your data by maximum likelihood.</p>

<h2 id="reading">How to read results</h2>
<ul>
  <li>Read return together with max drawdown.</li>
  <li>A result from a small number of trades may be luck.</li>
  <li>Testing many settings and keeping the best one fits the rule to the past. Test the chosen setting on a period you did not use.</li>
  <li>Past results do not predict future results.</li>
</ul>
'''
sayfa("methodology/index.html", "Methodology: Kalibre Lab", "Where Kalibre Lab's data comes from, how Quick Backtest works, the volatility models and how to read results.", "", METHOD, icindekiler(METHOD), dil="en")

# ------------------------------------------------------------------ about
ABOUT = '''
<h1>About Kalibre Markets</h1>
<p class="giris">Kalibre Markets builds software for traders. Our first product, Kalibre Lab, is a backtesting and risk toolkit for MetaTrader 5, Alpaca and Tradier accounts.</p>

<h2 id="product">Kalibre Lab</h2>
<ul>
  <li><b>Strategy Builder and Quick Backtest:</b> build entry and exit rules and test them on your data in the browser.</li>
  <li><b>Optimization:</b> scan parameters with separate training and test periods.</li>
  <li><b>Dashboard:</b> balance, positions, quotes and closed trades from your connected account.</li>
  <li><b>Kalibre Bridge and Kalibre Engine:</b> MT5 add-ons for encrypted data sync and for running your rule file.</li>
  <li><b>Prop Shield:</b> daily and total loss limits for prop firm challenges.</li>
</ul>

<h2 id="principles">How we work</h2>
<ul>
  <li><b>We publish no market data.</b> The lab uses your account's data, your files or labelled example series.</li>
  <li><b>Bridge data is end-to-end encrypted.</b> Our servers cannot decrypt it (<a href="/security">security</a>).</li>
  <li><b>The method is documented.</b> We describe how each number is calculated and what it leaves out (<a href="/methodology">methodology</a>).</li>
  <li><b>We do not sell signals or give advice.</b> You choose the rules and the trades.</li>
</ul>

<h2 id="legal">Legal</h2>
<p>Kalibre Lab is software. Kalibre Markets is not a broker, investment adviser or portfolio manager, does not hold client funds and does not provide investment advice. Past performance, actual or simulated, is not indicative of future results.</p>

<h2 id="contact">Contact</h2>
<p>For questions, suggestions or bug reports, email <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a>.</p>
'''
sayfa("about/index.html", "About: Kalibre Markets", "Kalibre Markets builds software for traders. Kalibre Lab is a backtesting and risk toolkit for MetaTrader 5, Alpaca and Tradier accounts.", "", ABOUT, dil="en")

# ------------------------------------------------------------------ pricing
EN_MOTOR = '<li>Kalibre Engine for demo and live accounts. Live use is in <b>beta</b> and requires explicit acceptance and a loss limit (<a href="/risk-disclosure">risk disclosure</a>).</li>'
EN_ACIK = """  <label class="onay"><input type="checkbox" id="sartlar" required> <span>I accept the <a href="/terms">Terms of Service</a> and the <a href="/refunds">Refund and Cancellation Policy</a>, and I have read the <a href="/privacy">Privacy Policy</a>.</span></label>
  <label class="onay"><input type="checkbox" id="cayma" required> <span>I request immediate access to the service. I understand that I lose my 14-day right of withdrawal once my licence key is first activated on a MetaTrader 5 account (<a href="/refunds#withdrawal">Refund and Cancellation Policy, section 4</a>).</span></label>
  <button type="button" class="dugme" id="abone-ol">Subscribe</button>
  <p class="not" id="odeme-durum" role="status"></p>
  <p class="not">You sign in to your Kalibre Markets account before checkout. If you do not have an account, it is created at this step. Payments are processed by Stripe, and we do not receive your card details. Cancel anytime on your <a href="/account">Account</a> page. Access continues until the end of the billing period.</p>"""
EN_KAPALI = """  <div class="yakinda">
    <h3>Subscriptions open soon</h3>
    <p>Kalibre Lab is in beta. The planned price at launch is $19 per month. Join the waitlist to hear when subscriptions open.</p>
    <div class="eylem-satir"><a class="dugme" href="#waitlist">Join the waitlist</a><a class="dugme ikincil" href="mailto:markets@kalibrefin.com?subject=Kalibre%20Lab%20beta%20access">Request beta access</a></div>
    <p><b>Invited?</b> Sign in and link the beta license you received to your account on the <a href="/account">Account</a> page.</p>
  </div>"""
EN_BEKLEME = f"""
<h2 id="waitlist">{"Not ready yet?" if ODEME_ACIK else "Waitlist"}</h2>
<p>{"Leave your email to hear when new features ship." if ODEME_ACIK else "We will email you when subscriptions open and when new features ship."}</p>
<div class="bekleme">
  <p id="ok-msg" hidden><b>You are on the list.</b> We will email you {"when new features ship" if ODEME_ACIK else "when subscriptions open"}.</p>
  <form action="https://formsubmit.co/markets@kalibrefin.com" method="POST" id="wl-form">
    <input type="hidden" name="_subject" value="Kalibre Lab waitlist: new sign-up (EN)">
    <input type="hidden" name="_next" value="https://kalibremarkets.com/pricing?ok=1">
    <input type="hidden" name="_captcha" value="false">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
    <label for="eposta">Your email</label>
    <div class="satir">
      <input type="email" id="eposta" name="email" required autocomplete="email">
      <button type="submit" class="dugme">Join the waitlist</button>
    </div>
    <label class="onay"><input type="checkbox" name="consent" value="yes" required> <span>I agree to receive emails from Kalibre Markets about Kalibre Lab. I can unsubscribe at any time.</span></label>
  </form>
  <p class="not">Your email is used only for this and is delivered to us through the FormSubmit service. To leave the list, write to <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a>. Details are in the <a href="/privacy">privacy policy</a>.</p>
</div>
"""
PLAN_SECIM = ('<div id="odeme-acik">\n' + EN_ACIK + '\n</div>\n' + EN_KAPALI.replace('<div class="yakinda">', '<div class="yakinda" id="odeme-yakinda" hidden>')) if ODEME_ACIK else EN_KAPALI
PRICING = f"""
<h1>Pricing</h1>
<p class="giris">Backtesting is free. At launch, the subscription will add Kalibre Engine, Prop Shield and the live data bridge for MetaTrader 5.</p>

<div class="plan" id="plan">
  <div class="plan-bas">
    <h2>Kalibre Lab <span class="rozet-beta">beta</span></h2>
    <p class="fiyat"><span class="sayi">$19</span> / month at launch <span class="not">Also available in EUR: €17 / month. Checkout shows the price in your currency.</span></p>
  </div>
  <ul>
    <li>2 MT5 accounts per license</li>
    {EN_MOTOR}
    <li>Prop Shield with FTMO and The5ers presets</li>
    <li>Kalibre Bridge: encrypted live data from MT5 to the Dashboard and lab</li>
    <li>Everything in Free</li>
  </ul>
{PLAN_SECIM}
</div>

<h2 id="free">Free</h2>
<ul>
  <li>The lab with example series and your own files</li>
  <li>Strategy Builder, Quick Backtest and Volatility Lab</li>
  <li>Kalibre Engine in MT5 Strategy Tester, with no license needed</li>
</ul>
{EN_BEKLEME}
<div class="kutu">Kalibre Lab is software. Kalibre Markets is not a broker or investment adviser and does not provide investment advice. Kalibre Engine places orders only from a rule file you built, on an account you choose, after you start it. Test on a demo account first. You are responsible for all trades. See the <a href="/risk-disclosure">risk disclosure</a>.</div>
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
  if (q.get('abone') === '1') { var plan = document.getElementById('plan'); if (plan) plan.scrollIntoView({ block: 'start' }); }
  d.addEventListener('click', async function () {
    if (!document.getElementById('sartlar').checked) { durum.textContent = 'To continue, please accept the Terms of Service and the Refund and Cancellation Policy.'; return; }
    if (!document.getElementById('cayma').checked) { durum.textContent = 'To continue, please tick the box about the right of withdrawal.'; return; }
    d.disabled = true; d.textContent = 'Opening checkout';
    durum.textContent = '';
    var A = window.KalibreAuth; // ertelenmiş betik: tıklama anında okunur
    if (A) await A.ready();
    if (!A || !A.enabled) { durum.textContent = 'Accounts are not available yet. Please try again shortly.'; d.disabled = false; d.textContent = 'Subscribe'; return; }
    if (!A.user()) { location.href = A.paths.signIn + '?sonra=' + encodeURIComponent(location.pathname + '?abone=1'); return; }
    var r = await A.api('/api/odeme/baslat', { body: { sartlar: true, cayma_onay: true } });
    if (r.ok && r.data && r.data.url) { location.href = r.data.url; return; }
    durum.textContent = (r.data && r.data.hata) || (r.status ? 'Checkout could not be opened. Please try again shortly.' : 'Could not connect. Check your internet connection and try again.');
    d.disabled = false; d.textContent = 'Subscribe';
  });
})();
</script>"""
_tr = open(os.path.join(_d, "sayfa-uret.py")).read()
PRO_STIL = _tr.split('PRO_STIL = """')[1].split('"""')[0]
PROP_STIL = _tr.split('PROP_STIL = """')[1].split('"""')[0]
PRO_ODEME_YEDEK = _tr.split('PRO_ODEME_YEDEK = """')[1].split('"""')[0]
EN_PRO_BETIK = (EN_PRO_BETIK_ACIK + EN_PRO_BETIK_KAPALI + PRO_ODEME_YEDEK) if ODEME_ACIK else EN_PRO_BETIK_KAPALI
sayfa("pricing/index.html", "Pricing: Kalibre Lab", ("Kalibre Lab subscription: Kalibre Engine, Prop Shield and the encrypted MT5 data bridge. $19 per month, cancel anytime." if ODEME_ACIK else "Kalibre Lab (beta): planned launch price $19 per month. Join the waitlist or request beta access."), "/pricing", PRICING, ek_stil=PRO_STIL, ek_betik=EN_PRO_BETIK, dil="en")

# ------------------------------------------------------------------ account
# Sign-in (/sign-in) and Account (/account) pages: yerel/hesap-uret.py (EN + TR).

# ------------------------------------------------------------------ prop
PROP = """
<h1>Prop Shield: loss limits for prop firm challenges</h1>
<p class="giris">Kalibre Engine checks your Maximum Daily Loss and Maximum Loss on every tick. It blocks new trades near the limit and closes its own positions at the safety margin.</p>
<div class="eylem-satir"><a class="dugme" href="/pricing#waitlist">Join the waitlist</a><a class="dugme ikincil" href="#calculate">Check your account</a></div>

<h2 id="how">How Prop Shield works</h2>
<ul>
  <li><b>Daily and total floors.</b> The daily floor is based on the start-of-day balance. The total floor is based on the starting or peak balance. The higher floor applies. The day resets at the firm's time, which is 00:00 CE(S)T for FTMO.</li>
  <li><b>Lot sizing.</b> The loss of a new trade at its stop, plus the open risk to the stops of existing positions, cannot exceed the distance to the floor. Positions you opened manually are included.</li>
  <li><b>Stop, then close.</b> At twice the safety margin from the floor, no new trades are opened. At one safety margin, Kalibre Engine closes its own positions and opens no trades until the day resets.</li>
  <li><b>News rule.</b> If the firm restricts trading around high-impact news, no new trades are opened in that window.</li>
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
<p class="not">Firm rules can change. Compare the preset with your account's terms before you turn Prop Shield on. Consistency rules such as "best day" are not covered.</p>

<h2 id="calculate">Check your own account</h2>
<p>This calculator runs the same calculation as Prop Shield for one moment. The values stay in your browser.</p>
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

<h2 id="trial">Strategy Tester example</h2>
<p>Test setup: a deliberately high-risk strategy in MT5 Strategy Tester. EURUSD M15, 1 January to 1 October 2026, $100,000 starting balance, 5% of balance risked per trade.</p>
<table class="tablo">
  <thead><tr><th></th><th>Without Prop Shield</th><th>With Prop Shield (FTMO 2-Step)</th></tr></thead>
  <tbody>
    <tr><td>Worst day's realised loss</td><td class="sayi">18,900</td><td class="sayi">4,009</td></tr>
    <tr><td>Daily limit (5,000) breached?</td><td>Yes, the challenge would be lost</td><td>No</td></tr>
    <tr><td>Lowest balance (total floor 90,000)</td><td class="sayi">94,432</td><td class="sayi">90,999</td></tr>
  </tbody>
</table>
<div class="kutu">Historical simulation. Hypothetical results have inherent limitations and do not represent actual trading. The account with Prop Shield ended the period at a loss and breached no limit. Prop Shield limits losses. It does not improve a strategy.</div>

<h2 id="scope">Scope and limits</h2>
<ul>
  <li>Prop Shield is part of Kalibre Engine. Kalibre Engine runs the rule file you build in Kalibre Lab on your account. Kalibre does not sell signals.</li>
  <li>Kalibre is not a prop firm and is not affiliated with any prop firm. Firm names are used only to describe their rules.</li>
  <li>Slippage and gaps can cause losses beyond the stop. The safety margin is there for this.</li>
  <li>Prop Shield is in beta and is not a guarantee. Read the <a href="/risk-disclosure">risk disclosure</a> before using it on a live account.</li>
</ul>
"""
sayfa("prop/index.html", "Prop Shield: loss limits for prop firm challenges", "Kalibre Engine checks daily and total loss limits on every tick, sizes lots to the remaining room and stops near the floor. FTMO and The5ers presets.", "/prop", PROP, icindekiler(PROP), ek_stil=PROP_STIL, ek_betik='<script src="/static/kalkan-hesap.js" defer></script>', dil="en")

# ------------------------------------------------------------------ forex
FOREX = """
<h1>Risk tools for retail forex traders</h1>
<p class="giris">Set a risk per trade, scale lot size to volatility and add a daily loss limit. Then backtest the rule with those settings on your broker's data.</p>
<div class="eylem-satir"><a class="dugme" href="/lab">Open the lab</a><a class="dugme ikincil" href="/setup">View setup guide</a></div>

<h2 id="why">Why position size matters</h2>
<ul>
  <li><b>Most retail CFD accounts lose money.</b> In 2018 the European Securities and Markets Authority (ESMA) reported that 74-89% of retail CFD accounts lose money.</li>
  <li><b>Leverage increases losses.</b> After the US capped retail forex leverage in 2010, losses of high-leverage traders fell by 40% (Heimer and Simsek, Journal of Financial Economics, 2019).</li>
  <li><b>Volatility changes the risk of a fixed lot.</b> In currencies, scaling positions to volatility did not meaningfully raise returns but reduced extreme losses (Harvey et al., 2018).</li>
</ul>

<h2 id="tools">In Kalibre Lab</h2>
<ul>
  <li><b>Risk-based position sizing:</b> set the share of balance each trade risks. The lot is calculated from the stop distance.</li>
  <li><b>Volatility scaling:</b> risk per trade is reduced when volatility rises above its normal level (EWMA, Yang-Zhang, GARCH).</li>
  <li><b>Daily loss limit and news filter:</b> stop trading after a set daily loss and stay out around high-impact releases.</li>
  <li><b>Your broker's data:</b> backtest on your broker's prices, then confirm in MT5 Strategy Tester with your broker's costs.</li>
</ul>

<h2 id="broker">Your broker</h2>
<p>Kalibre Lab is not a broker. It does not open accounts or route orders. It works with any broker that offers MetaTrader 5. Use a broker authorised by the regulator in your country.</p>

<div class="kutu">Kalibre Lab is software and does not provide investment advice. Trading forex and CFDs on margin carries a high level of risk. You can lose all of the money you deposit.</div>
"""
sayfa("forex/index.html", "Retail forex: risk tools in Kalibre Lab", "Risk-based position sizing, volatility scaling and a daily loss limit, backtested on your broker's MetaTrader 5 data.", "", FOREX, icindekiler(FOREX), ek_stil=PROP_STIL, dil="en")

# ------------------------------------------------------------------ closed beta guide
_tr2 = open(os.path.join(_d, "sayfa-uret.py")).read()
exec(_tr2[_tr2.index("# ------------------------------------------------------------------ kapalı beta rehberi"):_tr2.index('BETA = f"""')])
BETA_EN = f"""
<h1>Beta programme guide</h1>
<p class="giris">This guide covers what is in the Kalibre Lab beta, a first session, what to avoid and how to send feedback.</p>
<div class="kutu"><b>Use a demo account in the beta programme.</b> Do not connect an account that trades real money with an invited beta license. All results are simulations and may not include costs; do not make real-money decisions with them. Details are in the <a href="/risk-disclosure">risk disclosure</a>.</div>

<h2 id="license">How do I get my beta license?</h2>
<p>Your invitation includes a <b>beta license key</b>. Sign in to your Kalibre Markets account (it is created when you first sign in) and use "Link to my account" on the <a href="/account">Account</a> page. The key then appears under Products and licenses. No payment details are needed.</p>
<div class="kutu"><b>How long does a beta license last?</b> A beta license is free and personal. It covers Kalibre Bridge only and expires on the date shown on your Account page. Subscriptions are not open during the beta.</div>

<h2 id="whats-in">What is in the beta?</h2>
<ul>
  <li><b>MetaTrader 5 bridge and Dashboard:</b> your demo MT5 balance, open positions, the symbols you follow and the last 90 days of closed trades, end-to-end encrypted.</li>
  <li><b>Strategy builder:</b> Simple mode (blocks) and Advanced mode (form); both edit the same strategy.</li>
  <li><b>Quick Backtest:</b> runs a rule on your candles in seconds. Costs are optional and zero by default.</li>
  <li><b>Optimization:</b> parameter scan, training and test periods, heat map, a measure of whether a result could be luck.</li>
  <li><b>Alpaca (paper) and Tradier (sandbox):</b> direct browser connection to US brokers.</li>
</ul>
<div class="kutu"><b>Automated trading is not part of the beta programme.</b> Kalibre Engine (the add-on that runs a rule file in MT5) and the prop shield are not included in the beta license; your beta license covers Kalibre Bridge (read-only) only. No orders are placed on any account in the beta programme.</div>

<h2 id="first-session">First session (about 30 minutes)</h2>
<ol>
  <li>Connect your demo MT5 account on the <a href="/connect">connect page</a>: download the add-on, paste the code, add the permission address, press <b>OK</b>. Note any step where you get stuck.</li>
  <li>Open the <a href="/dashboard">Dashboard</a>: are balance, quotes and positions right? Compare with what MT5 shows.</li>
  <li>In the strategy builder, build a strategy in Simple mode (e.g. a moving-average cross) or load an educational example; fill in the risk section yourself; run Quick Backtest.</li>
  <li>On the <a href="/lab/optimizasyon">Optimization</a> page, scan two parameters; look at the heat map and the test-period result.</li>
  <li>If you like, also connect an Alpaca paper or Tradier sandbox account on the <a href="/connect">connect page</a> and try the Dashboard with it.</li>
</ol>

<h2 id="dont">Please don't</h2>
<ul>
  <li>Connect a real account.</li>
  <li>Run rule files for automated trading on any account; there is no automated trading in the beta.</li>
  <li>Share your pairing code, license key or Alpaca/Tradier keys with anyone, including us.</li>
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
<p>We cannot see your market data, positions or trades. Kalibre Bridge data is encrypted and decrypted only in your browser. Your browser requests Alpaca and Tradier data directly. What we do see: your Kalibre Markets account e-mail and profile, the strategy drafts you save while signed in, the feedback you send us and the MT5 account number your beta license is used on (to bind the license to the account).</p>

<h2 id="send">Send feedback</h2>
<p>Fill in the form or <a href="{beta_mailto("en")}">send it by email</a> (a template opens).</p>
{beta_form("en")}
"""
sayfa("beta/index.html", "Beta programme guide: Kalibre Lab", "Kalibre Lab beta programme: what is included, first session, what to avoid and how to send feedback.", "", BETA_EN, icindekiler(BETA_EN), ek_stil=BETA_FORM_STIL, ek_betik=BETA_BETIK, gizli=True, dil="en")

# The risk disclosure and the other legal pages (terms, privacy, refunds, cookies) are generated by yerel/yasal-uret.py.
