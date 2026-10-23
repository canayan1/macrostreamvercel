# English legal pages (privacy, terms) in the new site design. One-off generator.
import os, re
KOK = "/private/tmp/claude-501/-Users-can-Documents-macrostreamvercel--claude-worktrees-loving-noyce-59a4b3/aebca502-9ff1-4d14-897c-d2dcd733daaa/scratchpad/site-wt"
MAIL = '<a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a>'

MENU = [("/en/lab/", "Lab"), ("/en/prop/", "Prop shield"), ("/en/setup/", "Setup"), ("/en/security/", "Security"),
        ("/egitim/", "Education (Turkish)"), ("/en/pricing/", "Pricing")]

def ust(tr_yol):
    a = "\n".join(f'      <a href="{h}">{t}</a>' for h, t in MENU)
    return f'''<header class="ust">
  <div class="kap">
    <a class="marka" href="/en/"><b>Kalibre</b><span>Lab</span></a>
    <nav aria-label="Main menu">
{a}
      <a href="{tr_yol}" hreflang="tr" lang="tr">TR</a>
    </nav>
    <a class="dugme kucuk" href="/en/lab/">Open the lab</a>
  </div>
</header>'''

ALT = '''<footer class="alt">
  <div class="kap">
    <div>
      <p><b style="font:600 18px var(--serif);color:var(--metin)">Kalibre</b></p>
      <p>A strategy lab for MetaTrader 5.</p>
    </div>
    <div>
      <h4>Product</h4>
      <a href="/en/lab/">Lab</a>
      <a href="/en/prop/">Prop shield</a>
      <a href="/en/forex/">Retail forex</a>
      <a href="/en/setup/">Setup</a>
      <a href="/en/security/">Security</a>
      <a href="/en/pricing/">Pricing</a>
    </div>
    <div>
      <h4>Learn</h4>
      <a href="/en/methodology/">Methodology</a>
      <a href="/egitim/" hreflang="tr">Education (Turkish)</a>
    </div>
    <div>
      <h4>Kalibre</h4>
      <a href="/en/about/">About</a>
      <a href="/iletisim/" hreflang="tr">Contact</a>
      <a href="/en/terms/">Terms of use</a>
      <a href="/en/privacy/">Privacy</a>
    </div>
    <p class="yasal">Kalibre Lab is a software tool; it does not provide investment advice or brokerage services. Results shown in the lab are based on past data and are not an indication of future results. Leveraged trading can lead to the loss of your entire deposit. MetaTrader is a trademark of MetaQuotes Ltd.; Kalibre is not affiliated with MetaQuotes.</p>
  </div>
</footer>'''

def sayfa(yol, tr_yol, baslik, aciklama, govde):
    kanon = "https://kalibremarkets.com/" + yol.replace("/index.html", "")
    tr_kanon = "https://kalibremarkets.com" + tr_yol.rstrip("/")
    kenar = "".join(f'<a href="#{i}">{t}</a>' for i, t in re.findall(r'<h2 id="([^"]+)">([^<]+)</h2>', govde))
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>{baslik}</title>
<meta name="description" content="{aciklama}">
<link rel="canonical" href="{kanon}">
<link rel="alternate" hreflang="tr" href="{tr_kanon}">
<link rel="alternate" hreflang="en" href="{kanon}">
<meta property="og:title" content="{baslik}">
<meta property="og:description" content="{aciklama}">
<meta property="og:site_name" content="Kalibre Markets">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="https://kalibremarkets.com/og-default.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/site.css">
<script src="/static/kalibre-cerez.js"></script>
</head>
<body>

{ust(tr_yol)}

<main class="belge">
  <div class="kap belge-izgara">
    <article class="belge-govde">
{govde}
    </article>
    <aside class="belge-kenar" aria-label="On this page">{kenar}</aside>
  </div>
</main>

{ALT}
</body>
</html>
'''
    assert "—" not in html, yol
    p = os.path.join(KOK, yol)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w").write(html)
    print("written", yol)

CEVIRI = '<p class="not">This is a translation. If the English and Turkish versions differ, the Turkish version prevails. <a href="{tr}" hreflang="tr" lang="tr">Türkçe metin</a></p>\n<!-- FOR COUNSEL: EU/UK consumers may require English-language terms and privacy information that stand on their own (GDPR, consumer protection law) rather than a translation in which the Turkish text prevails. To be reviewed. -->'

# ------------------------------------------------------------------ privacy
GIZLILIK = f'''
<h1>Privacy Policy and Information Notice</h1>
<p class="not">Effective date: 21 October 2026</p>
{CEVIRI.format(tr="/gizlilik/")}
<p class="giris">This notice explains, under Turkish Law No. 6698 on the Protection of Personal Data ("KVKK"), which personal data is processed through kalibremarkets.com (the "Site"), for what purposes and on what legal grounds, to whom it is transferred, and what your rights are.</p>

<h2 id="controller">1. Data controller</h2>
<p>[COMPANY NAME] ("Kalibre Markets"). Address: [ADDRESS]. E-mail: {MAIL}</p>
<p>Separate services offered at oyun.kalibremarkets.com and other subdomains of kalibremarkets.com are outside the scope of this notice.</p>

<h2 id="no-account">2. No account or registration required</h2>
<p>The Site's free tools are used without an account, and user accounts cannot be created on the Site. A Kalibre Lab subscription is likewise operated through a license key issued to you after payment, rather than through a user account (section 3(h)).</p>

<h2 id="data">3. What data we process and why</h2>
<p><strong>a) When you visit the Site.</strong> Your IP address, browser and device information, the page requested and the time of the request are recorded in server logs by the Site's hosting provider. This information is processed to operate the Site, keep it secure and protect it against automated attacks. Legal ground: our legitimate interest in providing the Site securely (KVKK art. 5(2)(f)).</p>
<p><strong>b) Visit statistics (Google Analytics).</strong> Used only if you select "Accept" in the cookie banner. In that case usage data such as a cookie identifier, the pages visited, visit duration, device and browser type and approximate location is processed to measure how the Site is used. Legal ground: your explicit consent (KVKK art. 5(1)). You may withdraw your consent at any time (see section 6).</p>
<p><strong>c) AI assistant.</strong> Messages you write to the assistant are sent to Google's Gemini service, or to Groq if that service is unavailable, to generate a reply. Your messages are not stored on our servers; the last 20 messages of your chat history are kept only in your own browser. Do not write identity details, contact details or other personal data to the assistant. Legal ground: provision of the service you request (KVKK art. 5(2)(c)).</p>
<p><strong>d) Subscription waitlist.</strong> The e-mail address you leave on the waitlist is sent to us through the FormSubmit service and is used only to inform you when Kalibre Lab subscriptions become available. Legal ground: the consent you give when signing up (KVKK art. 5(1)).</p>
<p><strong>e) Contact e-mails.</strong> The links on the contact page open your e-mail program; your name, e-mail address and message are sent to us from your own e-mail account. This information is processed to assess your question or request and to reply to you. Legal ground: our legitimate interest in responding to your request (KVKK art. 5(2)(f)) and, where your request relates to entering into a contract, the establishment of that contract (KVKK art. 5(2)(c)).</p>
<p><strong>f) Page translation.</strong> If you press the translation button on a page, the Google Translate service is loaded and the page content and your connection information are sent to Google for translation. The service is not loaded unless you press the button.</p>
<p><strong>g) Fonts.</strong> The Site's fonts are loaded from Google Fonts. In doing so your IP address and browser information are sent to Google's servers. Legal ground: our legitimate interest in displaying the Site (KVKK art. 5(2)(f)).</p>
<p><strong>h) Subscription and license.</strong> When you subscribe, the payment page is provided by Stripe. Your name, e-mail address, card details and billing address are sent directly to Stripe; <strong>your card details do not reach us</strong>. The information we receive from Stripe and store is: your e-mail address, your Stripe customer and subscription numbers, the status of the subscription and its validity date. In addition we store the license key issued to you and the numbers of up to two MetaTrader 5 accounts on which the license has been used. When checking the license, Kalibre Motor sends the license key and the MT5 account number to our server; these requests may also appear in the hosting provider's server logs. To prevent abuse, a request counter per account number is kept for about two minutes. This information is used to run the subscription, bind the license to your account and keep payment records. Legal ground: the establishment and performance of a contract (KVKK art. 5(2)(c)) and, for invoice and tax records, compliance with a legal obligation (KVKK art. 5(2)(ç)).
<!-- FOR COUNSEL: Clarify whether Stripe acts as a data processor or as an independent data controller in this relationship (Stripe also processes data for its own fraud-prevention purposes), and which Stripe entity is the counterparty ([STRIPE ENTITY], depends on the country in which the account was opened). -->
</p>

<h2 id="bridge">4. MetaTrader 5 bridge</h2>
<!-- FOR COUNSEL (not shown on the page):
  1) Encrypted packets will be held with [STORAGE PROVIDER]; the provider may be located abroad. Because Kalibre does
     not hold the key, it is debatable whether the packets are personal data from Kalibre's perspective. If they are,
     a transfer mechanism is needed under KVKK art. 9 (as amended in 2024): standard contract plus notification to the
     Board within 5 business days, or another route? The same question is open for Vercel, Google, Groq and FormSubmit.
  2) Art. 5(2)(c) (performance of a contract) was chosen as the legal ground; assess whether it is sufficient for free
     use and whether explicit consent should be used instead where necessary.
  3) Broker name, server name and account type, together with the balance, may make the person identifiable; assess
     whether these categories are disclosed clearly enough.
-->
<p>If you choose to connect Kalibre Lab to your MetaTrader 5 account, the Kalibre Bridge add-on that you install on your own computer reads the following information, encrypts it on your computer and transmits it through the Site's server only to your browser:</p>
<ul>
  <li>closed candles of the symbols you select: time, open, high, low and close price, tick volume;</li>
  <li>your open positions: symbol, direction, lot size, opening time and price, current price, stop-loss and take-profit levels, profit or loss, and the number of the add-on that opened the position (magic number);</li>
  <li>your account's currency, balance and equity;</li>
  <li>the name of your broker, the name of the trading server and whether the account is a demo or a live account.</li>
</ul>
<p>The add-on does not read your account number, password, identity details or trade history; it does not open trades and makes no changes to your account.</p>
<p><strong>End-to-end encryption.</strong> This information is encrypted (AES-256) and sealed (HMAC-SHA256) on your computer with keys derived from the pairing code that Kalibre Lab generates in your browser. The pairing code exists only in your browser and in the add-on's settings; it is never transmitted to Kalibre Markets. Kalibre Markets therefore cannot access the content of the encrypted packets. Symbol names are also part of the encrypted content. Technical details are on the <a href="/en/security/">Security</a> page.</p>
<p><strong>What is processed on the server.</strong> For the bridge, the Site's server processes only: the encrypted packets; the size of the packets and the time they are received; a channel number derived from the pairing code that cannot be used to recover the code; and a counter kept to limit the number of writes per channel. The encrypted packets are held in a store provided by [STORAGE PROVIDER]; a packet is replaced when a new packet of the same type arrives and is in any case deleted automatically no later than two hours after it is received. Counters are deleted after about two minutes. The content of the packets is not written to server logs. During the connection your IP address is processed by the hosting provider to deliver the transmission (see 3(a)); Kalibre Markets does not store IP addresses in connection with the bridge.</p>
<p><strong>Legal assessment.</strong> Because Kalibre Markets does not hold the key needed to decrypt the encrypted packets, it is debatable whether these packets constitute personal data from Kalibre Markets' perspective. For transparency, this processing is described here on the assumption that it is personal data. Legal ground: provision of the service you request (KVKK art. 5(2)(c)).</p>
<p>Using the bridge is optional. When you remove the add-on from the chart or close MetaTrader 5, data transmission stops; the last packets on the server are deleted within two hours at most.</p>

<h2 id="browser">5. Data that stays only in your browser</h2>
<p>The following data is kept on your own device, in your browser's local storage, and is not sent to us:</p>
<ul>
  <li>your decision journal entries;</li>
  <li>your strategy draft in Kalibre Lab;</li>
  <li>the MetaTrader 5 bridge pairing code and, if you changed it, the relay address setting;</li>
  <li>your bias test and chart test results and your pre-trade check history;</li>
  <li>the last 20 messages of your chat with the assistant;</li>
  <li>your onboarding tour and guide preferences and your cookie preference.</li>
</ul>
<p>You can delete this data at any time using your browser's feature for clearing site data. Deleted data cannot be recovered. To invalidate a pairing code you can generate a new code in Kalibre Lab; after that, packets encrypted with the old code cannot be opened and you will need to enter the new code in the add-on.</p>

<h2 id="cookies">6. Cookies</h2>
<p>Cookies used on the Site:</p>
<ul>
  <li><strong>Strictly necessary cookies.</strong> The cookie used by our hosting provider's security check. It is required for the Site to work and does not depend on your consent.</li>
  <li><strong>Analytics cookies.</strong> Google Analytics cookies (<code>_ga</code> and those beginning with <code>_ga_</code>, up to 2 years). Used only with your consent.</li>
</ul>
<p>You can change your cookie preference at any time. When you withdraw your consent, the Google Analytics cookies are deleted from your browser.</p>
<p><button type="button" class="dugme ikincil kucuk" onclick="window.kmCerezTercihi&amp;&amp;window.kmCerezTercihi()">Change cookie preferences</button></p>

<h2 id="recipients">7. Parties to whom data is transferred</h2>
<p>Your personal data is transferred, limited to the purposes above, to the following service providers:</p>
<ul>
  <li><strong>Vercel Inc.</strong> Hosting and security of the Site.</li>
  <li><strong>Google LLC.</strong> Google Analytics (only with your consent), Gemini (assistant), Google Translate (only if you press the translation button) and Google Fonts.</li>
  <li><strong>Groq, Inc.</strong> Fallback reply service for the assistant.</li>
  <li><strong>[STORAGE PROVIDER].</strong> Storage of the MetaTrader 5 bridge's encrypted packets for up to two hours (the provider cannot read the content of the packets) and storage of subscription license records.</li>
  <li><strong>[STRIPE ENTITY] (Stripe).</strong> Collection of subscription payments, invoicing, subscription management and fraud prevention.</li>
  <li><strong>FormSubmit.</strong> Delivery of waitlist sign-ups.</li>
  <li><strong>Our e-mail service provider.</strong> Receipt and storage of e-mails you send us.</li>
</ul>
<p>The servers of these service providers are located abroad, mainly in the United States of America; the servers of [STORAGE PROVIDER] may also be located abroad. The data described above is therefore transferred abroad.</p>
<p>Your personal data may also be transferred to public authorities and institutions authorised by law, in the cases provided for by law and upon request.</p>

<h2 id="retention">8. Retention periods</h2>
<ul>
  <li>Server logs: for the limited period set by the hosting provider.</li>
  <li>Google Analytics data: for the period set in the Google Analytics settings, at most 14 months.</li>
  <li>Encrypted packets of the MetaTrader 5 bridge: at most two hours; write counters about two minutes.</li>
  <li>Waitlist: until information about subscriptions has been sent or until you ask to be removed from the list.</li>
  <li>License record (e-mail, Stripe numbers, license key, linked MT5 account numbers): for the duration of the subscription and at most one year after it ends. Payment and invoice records are kept at Stripe and in our accounting records for the period required by the applicable tax and commercial legislation.</li>
  <li>Contact e-mails: after your request has been resolved, for the statutory limitation period for possible disputes.</li>
</ul>
<p>Data whose retention period has expired is deleted, destroyed or anonymised.</p>

<h2 id="rights">9. Your rights</h2>
<p>Under Article 11 of the KVKK you have the right to:</p>
<ul>
  <li>learn whether your personal data is being processed and, if so, request information about it;</li>
  <li>learn the purpose of the processing and whether the data is used in accordance with that purpose;</li>
  <li>know the third parties in Turkey or abroad to whom it is transferred;</li>
  <li>request correction if it has been processed incompletely or inaccurately;</li>
  <li>request deletion or destruction under the conditions set out in the KVKK;</li>
  <li>request that third parties to whom the data was transferred be notified of the correction, deletion or destruction;</li>
  <li>object to a result to your detriment arising from analysis exclusively by automated systems;</li>
  <li>claim compensation if you suffer damage because of unlawful processing.</li>
</ul>

<h2 id="requests">10. How to make a request</h2>
<p>To exercise your rights, you may send your request in writing to [ADDRESS], or e-mail it to {MAIL} from an e-mail address you have previously provided to us and that is registered in our system. Your request should include information verifying your identity and a description of what you are asking for.</p>
<p>Your request will be resolved free of charge within thirty days at the latest. If the action requires an additional cost, a fee according to the tariff set by the Personal Data Protection Board may be charged. If your request is rejected, the answer is found insufficient or no answer is given in time, you may lodge a complaint with the Personal Data Protection Board.</p>

<h2 id="children">11. Children</h2>
<p>The Site is not intended for persons under 18. If you are under 18, do not submit personal data to the Site.</p>

<h2 id="changes">12. Changes</h2>
<p>This notice may be updated. The current text is published on this page together with its effective date. Updates that materially change how your personal data is processed are announced on this page before they are applied.</p>
'''

# ------------------------------------------------------------------ terms
SARTLAR = f'''
<h1>Terms of Use</h1>
<p class="not">Effective date: 21 October 2026</p>
{CEVIRI.format(tr="/kullanim-sartlari/")}

<h2 id="parties">1. Parties and scope</h2>
<p>These Terms of Use (the "Terms") govern the use of the content and tools offered through the kalibremarkets.com domain and its subpages, the Kalibre Lab strategy lab and the Kalibre Bridge add-on (together, the "Site"). The Site is operated by [COMPANY NAME] ("Kalibre Markets"). Address: [ADDRESS]. E-mail: {MAIL}.</p>
<p>The simulation game at oyun.kalibremarkets.com is a separate service; it is outside the scope of these Terms and is subject to its own conditions.</p>

<h2 id="acceptance">2. Acceptance and changes</h2>
<p>By using the Site you declare that you have read and accepted these Terms. If you do not accept the Terms, do not use the Site.</p>
<p>Kalibre Markets may update these Terms. The current text is published on this page together with its effective date. In the case of material changes, users who have opened an account are also notified separately. Continuing to use the Site after a change means that you accept the updated Terms.</p>

<h2 id="no-advice">3. Not investment advice</h2>
<p>The Site has been prepared for educational and informational purposes. Kalibre Markets is not an institution authorised by the Capital Markets Board of Turkey (Sermaye Piyasası Kurulu) to provide investment advice or any other investment service or activity, and it does not provide any such service within the meaning of Capital Markets Law No. 6362.</p>
<p>The articles, example strategies, calculators, tests and simulations on the Site are information of a general nature. Kalibre Lab is a software tool that tests the rules you set up against the data you choose; you decide which rules to set up and whether to trade. The content has not been prepared taking into account your personal financial situation, risk preferences or investment objectives. No content may be interpreted as a recommendation, advice or signal to buy, sell or hold any particular asset. You should make your investment decisions based on your own assessment and, where necessary, with advisory services obtained from an authorised institution.</p>

<h2 id="data">4. Data policy</h2>
<p>No live or delayed market prices or exchange data are published on the Site. Data used in examples, charts and calculations is of one of the following four kinds:</p>
<ul>
  <li><strong>Data you enter.</strong> Values you enter yourself into calculators, the journal or the dashboard.</li>
  <li><strong>Synthetic data.</strong> Data generated to illustrate a method that does not represent a real market. Such data is marked "SENTETİK" (synthetic).</li>
  <li><strong>Data from your own broker.</strong> Files you load into Kalibre Lab or prices arriving through the MetaTrader 5 bridge. This data comes from your account at your broker and is shown only in your browser; Kalibre Markets does not publish it, cannot read it and does not make it available to others.</li>
  <li><strong>Data taken once from public sources.</strong> Data taken once on a specific date, with its source and date stated next to it. Such data is not updated and is meaningful only as of the date stated. The rights in such data belong to the relevant source.</li>
</ul>
<p>Kalibre Markets does not warrant the accuracy, completeness or timeliness of any data.</p>

<h2 id="simulations">5. Simulations and past performance</h2>
<p>Backtests, simulations and example results on the Site are hypothetical. They do not fully reflect real trading conditions such as commissions, taxes, slippage and liquidity. Results obtained with synthetic data do not show the result that would be obtained in a real market. Past performance is not an indication or guarantee of future performance.</p>
<p>The quick test in Kalibre Lab is an approximate calculation: it does not include spread, commission, swap or slippage, and it determines the order of prices within a candle by assumption. The method and its limits are explained on the <a href="/en/methodology/">Methodology</a> page. MetaTrader 5 Strategy Tester results also depend on your broker and on the test settings you choose.</p>

<h2 id="assistant">6. AI assistant</h2>
<p>The assistant on the Site works using a third-party artificial intelligence service. The assistant's replies are generated automatically; they may contain incorrect, incomplete or outdated information and do not constitute investment advice. Messages you write to the assistant are sent to that service provider to generate a reply. Do not write identity details, account details or other personal or sensitive data to the assistant. Details are in the <a href="/en/privacy/">Privacy Policy</a>.</p>

<h2 id="your-data">7. Data you enter and accounts</h2>
<p>Entries you make in tools such as the decision journal and Kalibre Lab are, unless stated otherwise, stored only in your own browser. Clearing browser data will cause these entries to be lost; backing them up is your responsibility.</p>
<p>If you open an optional account, your entries may be synchronised with your account. You are responsible for keeping your account details confidential and for actions taken through your account. Your personal data is processed in accordance with Law No. 6698 on the Protection of Personal Data; details are in the <a href="/en/privacy/">Privacy Policy</a>.</p>

<h2 id="software">8. Kalibre Lab and the Bridge add-on</h2>
<p><strong>License.</strong> Kalibre Markets permits you to use Kalibre Lab and the add-ons it offers for MetaTrader 5 (including Kalibre Bridge) for your own personal use in accordance with these Terms. This permission is personal, non-transferable, non-sublicensable and non-exclusive. Ownership of the software remains with Kalibre Markets; for paid versions the conditions in section 12 also apply.</p>
<p><strong>What the add-on does.</strong> The Kalibre Bridge add-on only reads: it encrypts the price history of the symbols you select, your open positions and your account summary, and transmits them to Kalibre Lab. It does not send orders, close positions or make changes to your account. You decide on which account and with which settings to run the add-on.</p>
<p><strong>MetaTrader 5 permission.</strong> For the add-on to connect to the internet you must allow the Kalibre address in the MetaTrader 5 settings. You grant this permission yourself and may withdraw it at any time. The setup steps are on the <a href="/en/setup/">Setup</a> page.</p>
<p><strong>Broker terms.</strong> Prices passing through the bridge come from your broker, through your account. You are responsible for complying with the terms of use of your broker and of MetaQuotes when using this data. This data is for your own use only; you agree not to distribute, publish or sell to others price data obtained through Kalibre Lab.</p>
<p><strong>Pairing code.</strong> The pairing code is the key that encrypts your data and is held only by you. Keeping the code confidential is your responsibility. If you suspect that your code has fallen into someone else's hands, you must generate a new code in Kalibre Lab. Because Kalibre Markets does not know your code, it cannot recover a lost code and cannot access data encrypted with it.</p>
<p><strong>Continuity.</strong> The bridge depends on MetaTrader 5 being open, on your internet connection, on your broker's server and on the Site's relay server. Kalibre Markets does not guarantee that the bridge will operate without interruption, that every piece of data will be transmitted or that data will arrive within a particular time. The bridge is not a trading or risk management system; rely on your broker's platform to monitor your open positions.</p>
<p><strong>MetaTrader.</strong> MetaTrader is a trademark of MetaQuotes Ltd. Kalibre Markets is not affiliated with or endorsed by MetaQuotes Ltd.</p>

<h2 id="prohibited">9. Prohibited uses</h2>
<p>When using the Site you agree not to:</p>
<ul>
  <li>collect, copy or bulk-download Site content with automated tools;</li>
  <li>attempt to circumvent or disable the Site's security and bot protection measures;</li>
  <li>place an unusual load on the Site or its infrastructure or disrupt its operation;</li>
  <li>reverse engineer, modify or distribute in modified form the software and add-ons on the Site, except where permitted by law;</li>
  <li>use the bridge server for purposes other than Kalibre Lab, for example as a general data storage or transmission tool;</li>
  <li>republish or distribute Site content for commercial purposes;</li>
  <li>use the Site for an unlawful purpose or in a way that infringes the rights of others.</li>
</ul>

<h2 id="ip">10. Intellectual property</h2>
<p>The original texts, educational content, tools, software and design on the Site, and the "Kalibre" name and logo, belong to Kalibre Markets and are protected under Law No. 5846 on Intellectual and Artistic Works and related legislation. Short quotations may be made from the content with attribution and a link. Written permission is required to copy, reproduce or publish all or a substantial part of the content. Rights in data and content belonging to third-party sources belong to their owners.</p>

<h2 id="third-party">11. Third-party links</h2>
<p>The Site may contain links to sites and services belonging to third parties. Kalibre Markets has no control over the content, privacy practices or terms of those sites; their use is subject to the terms of the relevant third party.</p>

<h2 id="paid">12. Paid services</h2>
<p>The Kalibre Lab subscription is monthly. Payment is taken on the payment page provided by Stripe; the applicable price and taxes are shown on the payment page. The subscription renews automatically at the end of each period with the same payment method until you cancel it.</p>
<p>After payment you receive a license key. The key is bound to the first MetaTrader 5 accounts on which it is used, up to two; to move it to another account you can contact us.</p>
<p>You can cancel your subscription at any time from the "Lisansım" (My license) page on the Site. Cancellation takes effect at the end of the current period, and you can continue to use the service until the end of the period. Except where required by law, no partial refunds are given for periods already used. If a payment cannot be collected, Stripe retries the payment over a few days; during this time your license remains valid for at most three more days.</p>
<p>When the subscription ends, Kalibre Motor does not open new trades on a live account; the stop, target and exit rules of your open positions continue to be managed. The free sections and past tests in Strategy Tester do not require a subscription.</p>
<p>Paid services are also subject to any pre-contractual information form and distance sales contract that may be provided before purchase. In the event of a conflict between those documents and these Terms, those documents prevail with respect to the service concerned.
<!-- FOR COUNSEL: (1) The seller is outside Turkey; how should the distance contract, pre-contractual information and right of withdrawal be applied to sales to consumers in Turkey (Regulation on Distance Contracts art. 15(1)(ğ): exception for digital content supplied instantly and the consumer's approval)? (2) Should a waiver of the 14-day right of withdrawal for EU/UK consumers be added to the payment flow? (3) Notice of automatic renewal. -->
</p>
<p>Signing up for the waitlist does not create any obligation to purchase.</p>

<h2 id="liability">13. Limitation of liability</h2>
<p>The Site and its content are provided "as is". Kalibre Markets does not warrant that the Site will operate without interruption or error, or that the content will be fit for a particular purpose.</p>
<p>To the extent permitted by law, Kalibre Markets is not liable for investment decisions made in reliance on Site content or Kalibre Lab results, for loss of profit or damage arising from such decisions, for indirect damage, for interruption of the bridge or delays in data, or for the Site being unavailable.</p>
<p>These limitations do not exclude or restrict Kalibre Markets' liability arising from intent or gross negligence, or consumers' statutory rights.</p>

<h2 id="changes-access">14. Changes to the service and restriction of access</h2>
<p>Kalibre Markets may change all or part of the Site and may suspend it temporarily or permanently. It may restrict or terminate access to the Site or to an account for users who breach these Terms.</p>

<h2 id="law">15. Governing law and disputes</h2>
<p>These Terms are governed by the laws of the Republic of Türkiye. Those who use the Site as consumers may apply to the consumer arbitration committees at their place of residence within the monetary limits set under Consumer Protection Law No. 6502, and to consumer courts for disputes exceeding those limits. For disputes with users who are not consumers, the courts and enforcement offices of Istanbul have jurisdiction.</p>

<h2 id="severability">16. Severability</h2>
<p>If any provision of these Terms is held invalid, the validity of the other provisions is not affected.</p>

<h2 id="contact">17. Contact</h2>
<p>For questions about these Terms: {MAIL}</p>
'''

sayfa("en/privacy/index.html", "/gizlilik/", "Privacy Policy | Kalibre Lab",
      "How Kalibre Markets processes personal data under Turkish Law No. 6698 (KVKK): site visits, analytics, subscriptions, the encrypted MetaTrader 5 bridge, retention and your rights.", GIZLILIK)
sayfa("en/terms/index.html", "/kullanim-sartlari/", "Terms of Use | Kalibre Lab",
      "Terms of use for kalibremarkets.com, Kalibre Lab and the Kalibre Bridge add-on: not investment advice, data policy, software license, subscriptions and liability.", SARTLAR)
