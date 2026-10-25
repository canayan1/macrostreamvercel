# English legal pages (privacy, terms) in the new site design. One-off generator.
import os, re
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # site kökü
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
      <a href="/en/risk-disclosure/">Risk disclosure</a>
    </div>
    <p class="yasal">Kalibre Lab is in beta. Kalibre Lab is a software tool; it does not provide investment advice or brokerage services. Results shown in the lab are based on past data and are not an indication of future results. Leveraged trading can lead to the loss of your entire deposit. MetaTrader is a trademark of MetaQuotes Ltd.; Kalibre is not affiliated with MetaQuotes.</p>
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
<script src="/static/beta.js" defer></script>
<script src="/static/kalibre-auth.js" defer></script>
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
    open(p, "w").write(re.sub(r'(href|content)="((?:https://kalibremarkets\.com)?/[^"?#]*?[^/"])/"', r'\1="\2"', html))
    print("written", yol)

CEVIRI = '<p class="not">This is a translation. If the English and Turkish versions differ, the Turkish version prevails. <a href="{tr}" hreflang="tr" lang="tr">Türkçe metin</a></p>\n<!-- FOR COUNSEL: EU/UK consumers may require English-language terms and privacy information that stand on their own (GDPR, consumer protection law) rather than a translation in which the Turkish text prevails. To be reviewed. -->'

# ------------------------------------------------------------------ privacy
GIZLILIK = f'''
<h1>Privacy Policy and Information Notice</h1>
<p class="not">Effective date: 25 October 2026</p>
{CEVIRI.format(tr="/gizlilik/")}
<p class="giris">This notice explains, under Turkish Law No. 6698 on the Protection of Personal Data ("KVKK"), which personal data is processed through kalibremarkets.com (the "Site"), for what purposes and on what legal grounds, to whom it is transferred, and what your rights are.</p>

<h2 id="controller">1. Data controller</h2>
<p>[COMPANY NAME] ("Kalibre Markets"). Address: [ADDRESS]. E-mail: {MAIL}</p>
<p>Separate services offered at oyun.kalibremarkets.com and other subdomains of kalibremarkets.com are outside the scope of this notice.</p>

<h2 id="account">2. Your Kalibre Markets account</h2>
<p>The Site's free tools, including the Kalibre Lab strategy builder, can be used without an account. To subscribe, you need a Kalibre Markets account. One account covers all Kalibre Markets products. You sign in with a one-time link or code sent to your e-mail address, or with your Google account; we do not use passwords.</p>
<p><strong>What we store in your account:</strong> your e-mail address; the name and interface language you choose; whether you agreed to receive product news and when; when you accepted the Terms of Use and which version; the licences linked to your account (product, the last five characters of the key, status and validity date); and, if you are signed in while using the lab, the strategy drafts and lists you save. We do not store market data, positions or trade history in your account. Your MetaTrader 5 pairing code and broker keys stay in your browser (section 5) and are not saved to your account.</p>
<p><strong>Google sign-in.</strong> If you sign in with Google, Google sends us your e-mail address, your name and the address of your profile picture, and confirms that the e-mail address is verified. We use these only to create and identify your account; we do not receive your Google password or access to your Google services.</p>
<p><strong>Sign-in e-mails</strong> are sent through our e-mail delivery provider ([EMAIL DELIVERY PROVIDER]). Sign-in records (time, IP address and browser information) are kept by our account provider for security.</p>
<p><strong>Account provider.</strong> Account data is stored by Supabase, Inc. on servers in [SUPABASE REGION], acting as our data processor. Legal ground: the establishment and performance of the contract for the account and subscription you request (KVKK art. 5(2)(c)); for product news, your consent (KVKK art. 5(1)), which you can withdraw at any time on the Account page.</p>
<p><strong>Deleting your account.</strong> You can delete your account at any time on the Account page. Your profile, saved strategies and licence links are deleted at once; an active subscription is set to end at the close of the current period and you are not charged again. Payment and invoice records are kept as described in section 8.</p>
<!-- FOR COUNSEL: (1) Supabase's role as processor and the data processing agreement (DPA) to be accepted in the Supabase dashboard; region to be filled in ([SUPABASE REGION], planned: EU, Frankfurt). (2) Transfer abroad under KVKK art. 9 for Supabase and the e-mail delivery provider. (3) Whether Google, for Google sign-in, should be named as an independent controller. -->

<h2 id="data">3. What data we process and why</h2>
<p><strong>a) When you visit the Site.</strong> Your IP address, browser and device information, the page requested and the time of the request are recorded in server logs by the Site's hosting provider. This information is processed to operate the Site, keep it secure and protect it against automated attacks. Legal ground: our legitimate interest in providing the Site securely (KVKK art. 5(2)(f)).</p>
<p><strong>b) Visit statistics (Google Analytics).</strong> Used only if you select "Accept" in the cookie banner. In that case usage data such as a cookie identifier, the pages visited, visit duration, device and browser type and approximate location is processed to measure how the Site is used. Legal ground: your explicit consent (KVKK art. 5(1)). You may withdraw your consent at any time (see section 6).</p>
<p><strong>c) AI assistant.</strong> Messages you write to the assistant are sent to Google's Gemini service, or to Groq if that service is unavailable, to generate a reply. Your messages are not stored on our servers; the last 20 messages of your chat history are kept only in your own browser. Do not write identity details, contact details or other personal data to the assistant. Legal ground: provision of the service you request (KVKK art. 5(2)(c)).</p>
<p><strong>d) Subscription waitlist.</strong> The e-mail address you leave on the waitlist is sent to us through the FormSubmit service and is used only to inform you when Kalibre Lab subscriptions become available. Legal ground: the consent you give when signing up (KVKK art. 5(1)).</p>
<p><strong>e) Contact e-mails.</strong> The links on the contact page open your e-mail program; your name, e-mail address and message are sent to us from your own e-mail account. This information is processed to assess your question or request and to reply to you. Legal ground: our legitimate interest in responding to your request (KVKK art. 5(2)(f)) and, where your request relates to entering into a contract, the establishment of that contract (KVKK art. 5(2)(c)).</p>
<p><strong>f) Page translation.</strong> If you press the translation button on a page, the Google Translate service is loaded and the page content and your connection information are sent to Google for translation. The service is not loaded unless you press the button.</p>
<p><strong>g) Fonts.</strong> The Site's fonts are loaded from Google Fonts. In doing so your IP address and browser information are sent to Google's servers. Legal ground: our legitimate interest in displaying the Site (KVKK art. 5(2)(f)).</p>
<p><strong>h) Subscription and license.</strong> When you subscribe, the payment page is provided by Stripe. Your name, e-mail address, card details and billing address are sent directly to Stripe; <strong>your card details do not reach us</strong>. The information we receive from Stripe and store is: your e-mail address, the Kalibre Markets account the subscription belongs to, your Stripe customer and subscription numbers, the status of the subscription and its validity date. In addition we store the license key issued to you and the numbers of up to two MetaTrader 5 accounts on which the license has been used. When checking the license, Kalibre Engine sends the license key and the MT5 account number to our server; these requests may also appear in the hosting provider's server logs. To prevent abuse, a request counter per account number is kept for about two minutes. The fact that you ticked the right-of-withdrawal consent box on the payment page, and any promotion code you used, are also stored at Stripe with the payment record; this record is kept so that we can show your consent was given. Service e-mails about your licence, payments and security fall under this purpose; promotional commercial messages are sent only if you give separate consent. This information is used to run the subscription, bind the license to your account and keep payment records. Legal ground: the establishment and performance of a contract (KVKK art. 5(2)(c)) and, for invoice and tax records, compliance with a legal obligation (KVKK art. 5(2)(ç)).
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
<p>If you connect a Tradier account in Kalibre Lab, your Tradier access token, the selected environment and account number are also kept only in your browser's local storage. Your browser sends the token directly to Tradier and receives your account and market data directly from Tradier; none of this passes through or is stored on our servers, and we receive none of it. Disconnecting in Kalibre Lab deletes the token from your browser. Tradier processes this data under its own privacy policy.</p>
<!-- FOR COUNSEL: Tradier connection (browser-only, direct to Tradier, nothing reaches Kalibre). Confirm whether this needs mention under recipients/transfers abroad, and whether Tradier's personal-use API terms require any wording here. To be reviewed. -->
<p>If you connect an Alpaca account in Kalibre Lab, your Alpaca API key ID and secret key, the selected environment and any symbols you add to your list are also kept only in your browser's local storage. Your browser sends the keys directly to Alpaca and receives your account and market data directly from Alpaca; none of this passes through or is stored on our servers, and we receive none of it. Disconnecting in Kalibre Lab deletes the keys from your browser. Alpaca processes this data under its own privacy policy.</p>
<!-- FOR COUNSEL: Alpaca connection (browser-only, user's own personal API keys, direct to Alpaca, nothing reaches Kalibre). Same questions as Tradier: recipients/transfers abroad, and whether Alpaca's API terms need wording here. A later Alpaca Connect (OAuth) version would involve a small Kalibre server step for the code exchange and must be reviewed again before launch. To be reviewed. -->

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
  <li><strong>Supabase, Inc.</strong> Storage of Kalibre Markets accounts (section 2) and sign-in.</li>
  <li><strong>[EMAIL DELIVERY PROVIDER].</strong> Delivery of sign-in e-mails.</li>
  <li><strong>Google LLC (Google sign-in).</strong> Only if you choose to sign in with Google.</li>
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
  <li>Account (profile, saved strategies, licence links): until you delete your account. Accounts with no sign-in and no subscription for three years may be deleted after advance notice by e-mail. Sign-in records: for the period set by our account provider, at most one year.</li>
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
<p class="not">Effective date: 25 October 2026</p>
{CEVIRI.format(tr="/kullanim-sartlari/")}

<h2 id="parties">1. Parties and scope</h2>
<p>These Terms of Use (the "Terms") govern the use of the content and tools offered through the kalibremarkets.com domain and its subpages, (the "Site"), the Kalibre Lab strategy lab and the Kalibre Bridge, Kalibre Engine and other add-ons offered for MetaTrader 5 (together, the "Service"). The <a href="/en/risk-disclosure">Risk Disclosure</a> forms an integral part of these Terms. The Service is operated by [COMPANY NAME] ("Kalibre Markets"). Address: [ADDRESS]. E-mail: {MAIL}.</p>
<p>The simulation game at oyun.kalibremarkets.com is a separate service; it is outside the scope of these Terms and is subject to its own conditions.</p>

<h2 id="acceptance">2. Acceptance and changes</h2>
<p>By using the Site you declare that you have read and accepted these Terms. If you do not accept the Terms, do not use the Site.</p>
<p>Kalibre Markets may update these Terms. The current text is published on this page together with its effective date. In the case of material changes, paying subscribers and beta licence holders are also notified separately by e-mail. Continuing to use the Site after a change means that you accept the updated Terms.</p>

<h2 id="eligibility">2a. Who may use the Service</h2>
<p>To use the Site, Kalibre Lab and the add-ons you must be at least 18 years old and have the legal capacity to enter into a contract. If you use them on behalf of a legal entity, you declare that you are authorised to bind that entity to these Terms. If the law of the country where you are located prohibits, or requires a licence for, the use of automated trading software, leveraged products or similar tools, complying with that law is your responsibility. You may not purchase paid services if you are on a sanctions list maintained by the Republic of Türkiye, the United Nations, the European Union or the United States, or if you are resident in a country or region covered by such lists. Kalibre Markets may restrict access or sales from certain countries where legislation or the rules of the payment provider require it; in that case any amount paid in advance for an unused period is refunded.</p>
<!-- FOR COUNSEL: (1) Which sanctions regimes to name (TR, UN, EU, US/OFAC) should match Stripe's merchant terms. (2) US users: if the Engine sends orders on a forex/CFD account used from the US, the CTA status or software vendor exemption under CFTC/NFA rules should be assessed; the emphasis that the software runs the user's own rules and gives no personalised advice matters. Excluding the US entirely is also an option. (3) The "law of your country" sentence places a compliance burden on consumers; unfair-term risk is low but the wording was kept plain. -->

<h2 id="no-advice">3. Not investment advice</h2>
<p>The Site has been prepared for educational and informational purposes. Kalibre Markets is not an institution authorised by the Capital Markets Board of Turkey (Sermaye Piyasası Kurulu) to provide investment advice or any other investment service or activity, and it does not provide any such service within the meaning of Capital Markets Law No. 6362.</p>
<p>The articles, example strategies, calculators, tests and simulations on the Site are information of a general nature. Kalibre Lab is a software tool that tests the rules you set up against the data you choose; you decide which rules to set up and whether to trade. The content has not been prepared taking into account your personal financial situation, risk preferences or investment objectives. No content may be interpreted as a recommendation, advice or signal to buy, sell or hold any particular asset. You should make your investment decisions based on your own assessment and, where necessary, with advisory services obtained from an authorised institution.</p>
<p>Kalibre Markets never holds your money, securities or crypto assets, never asks for access to them and never opens an account in your name. Your assets are held only at the broker you choose.</p>

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

<h2 id="your-data">7. Your account, data you enter and your licence key</h2>
<p>Entries you make in tools such as the decision journal and Kalibre Lab are, unless stated otherwise, stored only in your own browser. If you are signed in to your account, your Kalibre Lab strategy drafts are also saved to your account (section 10a). Clearing browser data will cause entries kept only in the browser to be lost; backing them up is your responsibility.</p>
<p><strong>Account.</strong> A Kalibre Markets account is required to subscribe to paid services; one account covers all Kalibre Markets products. You must sign in with an e-mail address that belongs to you and that you control, and keep access to that e-mail address and to your Google account secure. An account is personal: do not share it or let others use it. You are responsible for activity carried out through your account. You may delete your account at any time on the Account page. We may suspend or close an account used in breach of these Terms; where possible, we will tell you first and give our reasons.</p>
<p><strong>Licence key.</strong> Paid and beta services are activated with a licence key shown on your Account page. You are responsible for keeping your licence key confidential and for use made with your key. Your personal data is processed in accordance with Law No. 6698 on the Protection of Personal Data; details are in the <a href="/en/privacy/">Privacy Policy</a>.</p>

<h2 id="software">8. Kalibre Lab and the MetaTrader 5 add-ons</h2>
<p><strong>License.</strong> Kalibre Markets permits you to use Kalibre Lab and the add-ons it offers for MetaTrader 5 (including Kalibre Bridge and Kalibre Engine) for your own personal use in accordance with these Terms. This permission is personal, non-transferable, non-sublicensable and non-exclusive. Ownership of the software remains with Kalibre Markets; for paid versions the conditions in section 12 also apply.</p>
<p><strong>What Kalibre Bridge does.</strong> The Kalibre Bridge add-on only reads: it encrypts the price history of the symbols you select, your open positions and your account summary, and transmits them to Kalibre Lab. It does not send orders, close positions or make changes to your account. You decide on which account and with which settings to run the add-on.</p>
<p><strong>What Kalibre Engine does.</strong> Unlike Kalibre Bridge, Kalibre Engine sends orders: it runs the rule file you build on your account and opens, manages and closes trades only according to those rules. It does not choose or recommend strategies on its own. Additional conditions for its use on a real account are in section 8b.</p>
<p><strong>MetaTrader 5 permission.</strong> For the add-on to connect to the internet you must allow the Kalibre address in the MetaTrader 5 settings. You grant this permission yourself and may withdraw it at any time. The setup steps are on the <a href="/en/setup/">Setup</a> page.</p>
<p><strong>Broker terms.</strong> Prices passing through the bridge come from your broker, through your account. You are responsible for complying with the terms of use of your broker and of MetaQuotes when using this data. This data is for your own use only; you agree not to distribute, publish or sell to others price data obtained through Kalibre Lab.</p>
<p><strong>Pairing code.</strong> The pairing code is the key that encrypts your data and is held only by you. Keeping the code confidential is your responsibility. If you suspect that your code has fallen into someone else's hands, you must generate a new code in Kalibre Lab. Because Kalibre Markets does not know your code, it cannot recover a lost code and cannot access data encrypted with it.</p>
<p><strong>Continuity.</strong> The bridge depends on MetaTrader 5 being open, on your internet connection, on your broker's server and on the Site's relay server. Kalibre Markets does not guarantee that the bridge will operate without interruption, that every piece of data will be transmitted or that data will arrive within a particular time. The bridge is not a trading or risk management system; rely on your broker's platform to monitor your open positions.</p>
<p><strong>MetaTrader.</strong> MetaTrader is a trademark of MetaQuotes Ltd. Kalibre Markets is not affiliated with or endorsed by MetaQuotes Ltd.</p>

<h2 id="beta">8a. Beta version</h2>
<p>Kalibre Lab, Kalibre Bridge and Kalibre Engine are in <strong>beta</strong>. During the beta, features may change, be added or be removed without prior notice; the software may contain errors and calculations may produce incorrect results. Except where the law requires otherwise, the beta is provided "as is", without any warranty of accuracy, uninterrupted availability or fitness for a particular purpose.</p>
<p><strong>Beta licence.</strong> Free beta licences given by invitation are personal, non-transferable, valid for the stated period and cover only the products named in the licence (for example, Kalibre Bridge only). Kalibre Markets may end a beta licence before its expiry. A beta licence does not turn into a paid subscription automatically.</p>
<p><strong>Feedback.</strong> Kalibre Markets may use the feedback you send during the beta to improve the product without paying you anything for it. Do not include pairing codes, licence keys, API keys or passwords in your feedback.</p>
<!-- FOR COUNSEL: "as is" provision and warranty disclaimer have limited effect against consumers under Turkish consumer law (Law No. 6502) and EU/UK consumer law; review the scope of the beta clause for consumers once paid subscriptions start. -->

<h2 id="engine-real">8b. Using Kalibre Engine on a real account</h2>
<p>Kalibre Engine runs the rule file you build on your MetaTrader 5 account and sends orders according to those rules. Using the Engine on an account that trades real money (a real account) carries additional risks during the beta: software errors, lost connections, broker-side delays, slippage and price gaps can cause losses larger than expected.</p>
<ul>
  <li><strong>Explicit acceptance.</strong> On a real account, the Engine opens no new trades unless you yourself tick "I accept the beta risk on a real account" in the add-on's settings.</li>
  <li><strong>Mandatory loss limit.</strong> On a real account, the Engine opens no new trades unless the prop shield or a daily loss limit in the rule file is set.</li>
  <li><strong>The shield is not a guarantee.</strong> The prop shield and loss limits can be exceeded because of price gaps, slippage, lost connections or differences in your broker's trading rules.</li>
  <li><strong>Responsibility.</strong> The results of all trades the Engine opens with your rules are yours. Before using the Engine on a real account, you must test the same rule file in MT5 Strategy Tester and on a demo account. Details are in the <a href="/en/risk-disclosure/">Risk Disclosure</a>.</li>
</ul>
<!-- FOR COUNSEL: offering the Engine on real accounts as part of a paid plan should be reassessed under SPK (III-37.1 art. 37 and 45), CFTC 4.14(a)(9) and FCA PERG 8.30; explicit acceptance and the mandatory loss limit are enforced in the software. -->

<h2 id="brokers">8c. Broker connections and keys</h2>
<p>If you connect Kalibre Lab to a broker account other than MetaTrader 5, such as Alpaca or Tradier, the connection is made between your browser and the broker and is subject to that broker's terms of use, fees and data licences. Kalibre Markets is not the representative, partner or intermediary of these firms; it does not hold the money or assets in your account, does not route orders on your behalf, and is not responsible for the broker's service interruptions, account restrictions or insolvency.</p>
<p>It is your obligation to use the API keys, access tokens, pairing code and Kalibre licence key you use for the connection only yourself, not to share them with anyone, and not to put them in screenshots, feedback or public code. Where possible, we recommend creating keys at your broker that carry only the permissions needed and no withdrawal rights. If you suspect a key has fallen into someone else's hands, you must revoke it at your broker immediately and, in the case of a licence key, tell us. Kalibre Markets is not responsible for the consequences of third parties using a key before you notify us.</p>
<!-- FOR COUNSEL: Liability for use before notification may be considered heavy for consumers; should cases of Kalibre's own fault (e.g. a leak) be expressly reserved? Check consistency with Privacy Policy section 5. -->

<h2 id="prohibited">9. Prohibited uses</h2>
<p>When using the Site you agree not to:</p>
<ul>
  <li>collect, copy or bulk-download Site content with automated tools;</li>
  <li>attempt to circumvent or disable the Site's security and bot protection measures;</li>
  <li>place an unusual load on the Site or its infrastructure or disrupt its operation;</li>
  <li>reverse engineer, modify or distribute in modified form the software and add-ons on the Site, except where permitted by law;</li>
  <li>use the bridge server for purposes other than Kalibre Lab, for example as a general data storage or transmission tool;</li>
  <li>republish or distribute Site content for commercial purposes;</li>
  <li>share, rent or sell your licence key, pairing code or access to a paid feature, or run the licence on accounts other than your own;</li>
  <li>use Kalibre Lab, Kalibre Engine or the results you produce with them to provide investment advice, trading signals, account management or portfolio management services to others without the required authorisations, or use the Kalibre name to promote such a service;</li>
  <li>publish test results produced by Kalibre as if they were realised returns, without stating that they are hypothetical;</li>
  <li>use the Site for an unlawful purpose or in a way that infringes the rights of others.</li>
</ul>
<!-- FOR COUNSEL: Capital Markets Law No. 6362 art. 109 and Communiqué III-37.1: prohibition on unauthorised investment advice. This item regulates user conduct, not Kalibre's own activity; read together with the power to restrict access in section 14. -->

<h2 id="ip">10. Intellectual property</h2>
<p>The original texts, educational content, tools, software and design on the Site, and the "Kalibre" name and logo, belong to Kalibre Markets and are protected under Law No. 5846 on Intellectual and Artistic Works and related legislation. Short quotations may be made from the content with attribution and a link. Written permission is required to copy, reproduce or publish all or a substantial part of the content. Rights in data and content belonging to third-party sources belong to their owners.</p>

<h2 id="your-strategies">10a. Your strategies</h2>
<p>The strategies, rules, parameters and notes you build in Kalibre Lab or in a rule file belong to you. Kalibre Markets claims no ownership of them. Unless stated otherwise, this content is kept only on your device; if you use optional sync or sharing features, you grant Kalibre Markets a non-exclusive permission, limited in time to that function, only to store this content, show it to you and perform the function you request. Kalibre Markets does not show your strategies to others, sell them or use them in its own examples without your explicit consent. The example strategies and templates on the Site belong to Kalibre Markets; you may modify and run them for your own use but may not republish them for commercial purposes.</p>
<!-- FOR COUNSEL: Whether a "rule set" is a work under Law No. 5846 is debatable; the clause rests on Kalibre not claiming rights rather than on ownership. If a sync feature is launched, sync data must be added to the Privacy Policy. -->

<h2 id="third-party">11. Third-party links</h2>
<p>The Site may contain links to sites and services belonging to third parties. Kalibre Markets has no control over the content, privacy practices or terms of those sites; their use is subject to the terms of the relevant third party.</p>

<h2 id="paid">12. Paid services</h2>
<p>The Kalibre Lab subscription is monthly. Payment is taken on the payment page provided by Stripe; the applicable price and taxes are shown on the payment page. The subscription renews automatically at the end of each period with the same payment method until you cancel it.</p>
<p>After payment you receive a license key. The key is bound to the first MetaTrader 5 accounts on which it is used, up to two; to move it to another account you can contact us.</p>
<p>You can cancel your subscription at any time from the Account page on the Site. Cancellation takes effect at the end of the current period, and you can continue to use the service until the end of the period. Except where required by law, no partial refunds are given for periods already used. If a payment cannot be collected, Stripe retries the payment over a few days; during this time your license remains valid for at most three more days.</p>
<p>When the subscription ends, Kalibre Engine does not open new trades on a live account; the stop, target and exit rules of your open positions continue to be managed. The free sections and past tests in Strategy Tester do not require a subscription.</p>
<p>Paid services are also subject to any pre-contractual information form and distance sales contract that may be provided before purchase. In the event of a conflict between those documents and these Terms, those documents prevail with respect to the service concerned.
<!-- FOR COUNSEL: (1) The seller is outside Turkey; how should the distance contract, pre-contractual information and right of withdrawal be applied to sales to consumers in Turkey? (2) A waiver of the 14-day right of withdrawal has been added to the payment flow (consent checkbox on /pro and /en/pricing, stored as cayma_onay in the Checkout metadata); confirmation on a durable medium (e-mail) should be assessed separately. (3) Notice of automatic renewal. -->
</p>
<p>Signing up for the waitlist does not create any obligation to purchase.</p>

<h2 id="withdrawal">12a. Right of withdrawal</h2>
<p>If you subscribed as a consumer, under distance contract legislation you have the right to withdraw within fourteen days from the day the contract is concluded, without giving any reason. However, supply of the digital content begins when the licence key is delivered to you and the licence is activated for the first time on a MetaTrader 5 account; if you gave your explicit consent to this on the payment page, your right of withdrawal ends after activation. Payment cannot be made without this consent. If you have never activated the licence, you may withdraw within fourteen days by writing to {MAIL}; the amount you paid is refunded to the same payment method within fourteen days at the latest.</p>

<h2 id="price-changes">12b. Price changes</h2>
<p>Kalibre Markets may change the subscription price. For existing subscribers, a new price applies only from the first renewal period that starts at least thirty days after the change is notified by e-mail. If you do not accept the new price, you may cancel your subscription before that renewal.</p>

<h2 id="trials">12c. Trial periods and promotion codes</h2>
<p>If a free trial, discount or promotion code is offered, its duration, scope and whether a paid subscription follows the end of the trial are shown separately with the offer; if you will be charged at the end of a trial, this is stated clearly before your payment method is requested. Promotion codes are personal, cannot be exchanged for cash, cannot be combined with other codes and are valid until the expiry date stated on them. Codes that are misused may be cancelled.</p>
<p>Codes with a 100% discount given to invited testers are valid for a period of at most three months and cover only the products stated with the code (for example, Kalibre Bridge only); while the code is active your licence is limited to those products. After the code expires, your subscription continues at the normal price unless you cancel it, and your licence then covers the full product. You are notified by e-mail before any charge is made.</p>
<!-- FOR COUNSEL: With tester codes the subscription can start without a payment method (Stripe "if_required"); if there is no payment method when the code ends, the subscription becomes unpaid and the licence ends. The founder should confirm that the "notice before any charge" commitment is met by Stripe's renewal reminder e-mails. -->

<h2 id="taxes">12d. Taxes and payment disputes</h2>
<p>Applicable taxes are either included in the price shown on the payment page or shown separately. The tax consequences of gains and losses from trades you make with Kalibre Lab are yours. If you start a payment dispute through your bank without a valid reason, your licence may be suspended until the dispute is resolved; we ask that you contact us first.</p>
<!-- FOR COUNSEL: Regulation on Distance Contracts art. 15(1)(ğ): withdrawal exception for intangible goods performed instantly in electronic form and delivered instantly to the consumer; applying the exception may require the consumer's prior explicit consent and confirmation of the information on a durable medium. The pre-contractual information form and distance sales contract are referenced in section 12; their content must match. Notice obligations for subscription renewals under the Regulation and Law No. 6502 art. 51 (subscription contracts) should be assessed separately. The payment-dispute sentence must not read as restricting the consumer's right to apply to their bank. -->

<h2 id="liability">13. Limitation of liability</h2>
<p>The Site and its content are provided "as is". Kalibre Markets does not warrant that the Site will operate without interruption or error, or that the content will be fit for a particular purpose.</p>
<p>To the extent permitted by law, Kalibre Markets is not liable for investment decisions made in reliance on Site content or Kalibre Lab results, for loss of profit or damage arising from such decisions, for indirect damage, for interruption of the bridge or delays in data, or for the Site being unavailable.</p>
<p>These limitations do not exclude or restrict Kalibre Markets' liability arising from intent or gross negligence, or consumers' statutory rights.</p>
<p><strong>Maximum liability.</strong> To the extent permitted by law and without prejudice to cases of intent and gross negligence, Kalibre Markets' total liability to you for any reason arising from these Terms or the paid services does not exceed the total subscription fees you actually paid to Kalibre Markets in the twelve months before the event that caused the damage. For users of the free sections or a free beta licence this amount is zero, except where the law requires otherwise. This limit never makes Kalibre Markets liable for market losses from trades that Kalibre Engine opens with your rule file; under section 8b those losses are yours.</p>
<p><strong>Force majeure.</strong> Kalibre Markets cannot be held liable for late performance or non-performance of its obligations due to events that could not reasonably be foreseen or prevented, such as natural disasters, epidemics, war, terrorism, civil unrest, strikes, decisions of public authorities, large-scale outages of energy or internet infrastructure, disruptions outside Kalibre Markets' control in the services of hosting and storage providers, brokers, MetaQuotes or payment institutions, and cyber attacks. The obligations concerned are suspended for that period. If force majeure lasts longer than thirty days, paying subscribers may terminate their subscription immediately and request a refund of the fee for the unused period.</p>
<!-- FOR COUNSEL: Under Turkish Code of Obligations art. 115, an agreement excluding liability for gross fault is void; for slight negligence, consumer contracts are also subject to unfair-terms review under Law No. 6502 art. 5 and the Unfair Terms Regulation. The validity of a 12-month fee cap against consumers is debatable; a separate cap for merchant users and a softened version for consumers ("to the extent permitted by law") could be considered. "Zero" for free users may be considered an unfair term in Turkey; alternative: a reasonable fixed amount. The 30-day threshold and refund right in force majeure were added to keep the balance for consumers. EU/UK consumer law may also limit these clauses. -->

<h2 id="claims">13a. Third-party claims</h2>
<p>You agree to cover the damage and reasonable defence costs that Kalibre Markets incurs because of claims brought against it by third parties as a result of your culpable breach of these Terms, of the terms of your broker or data provider, or of the rights of third parties, where that damage is determined by a final court or arbitral decision or with your consent. When Kalibre Markets learns of such a claim, it notifies you within a reasonable time and gives you the opportunity to take part in the defence.</p>
<!-- FOR COUNSEL: A general indemnity obligation in a consumer contract may be considered an unfair term; the clause was tied to fault and a final decision. A broader version could be kept for merchant users. Since the general liability rules of the Code of Obligations (art. 49 et seq.) apply anyway, including this clause is a matter of choice. -->

<h2 id="changes-access">14. Changes to the service, suspension and termination</h2>
<p>Kalibre Markets may change or end all or part of the Service. If it permanently removes a paid feature, it refunds the fee for the unused period.</p>
<p>If you breach these Terms, use the Service in a way that harms others, or a legal obligation requires it, Kalibre Markets may temporarily suspend your access or licence; if the breach can be remedied it first gives you a reasonable period, and in the case of serious or repeated breaches it may end the licence with notice. Where the licence is ended for a serious breach, the fee for the unused period is not refunded, except where the law requires otherwise. You may also stop using the Service at any time and cancel your subscription under section 12.</p>
<p>Whatever the reason the licence ends, Kalibre Engine stops opening new trades and your open positions are managed as described in section 12; however, checking and, if necessary, closing your open positions is your responsibility. The provisions on intellectual property, limitation of liability, third-party claims, governing law and other provisions that by their nature must continue remain in force after the agreement ends.</p>
<!-- FOR COUNSEL: Whether the Engine continues to manage open positions during a suspension must be confirmed technically; the text must be consistent with section 12. -->

<h2 id="law">15. Governing law and disputes</h2>
<p>These Terms are governed by the laws of the Republic of Türkiye. Those who use the Site as consumers may apply to the consumer arbitration committees at their place of residence within the monetary limits set under Consumer Protection Law No. 6502, and to consumer courts for disputes exceeding those limits. For disputes with users who are not consumers, the courts and enforcement offices of Istanbul have jurisdiction.</p>

<h2 id="general">16. General provisions</h2>
<p>These Terms, the Risk Disclosure and the Privacy Policy, together with the pre-contractual information form and distance sales contract provided separately for paid services, form the entire agreement between us regarding the Service. If any provision is held invalid, the other provisions are not affected; the invalid provision is deemed replaced by the valid provision closest to its purpose. Kalibre Markets not exercising a right, or exercising it late, does not mean it has waived that right. You may not transfer your rights under these Terms or your licence to anyone else without Kalibre Markets' written consent. Kalibre Markets may transfer these Terms to a person who takes over the Service, provided your rights are not reduced and you are notified. These Terms are published in Turkish and English; if the two texts conflict, the Turkish text prevails.</p>
<!-- FOR COUNSEL: Against consumers, the rule that the Turkish text prevails may be challenged because a foreign consumer would be bound in a language they do not understand; decide whether the English version should be stated to be for information only, or whether both languages should be equal. Check whether consumer consent is required for transfer (Code of Obligations art. 205, transfer of contract). -->

<h2 id="notices">16a. Notices and communications</h2>
<p>Notices under these Terms are given to the e-mail address you provided at checkout or through the Site. A notice sent by e-mail is deemed to reach you on the day it is sent; keeping your e-mail address up to date is your responsibility. Service e-mails about your licence, your payments, security and changes to these Terms are part of the subscription and do not require separate consent. Promotional messages such as campaigns, new products and newsletters are sent only if you give separate consent; you may withdraw that consent at any time through the link in each message or by writing to us. For formal notices to us, use markets@kalibrefin.com and the postal address given in section 1.</p>
<!-- FOR COUNSEL: Law No. 6563 on the Regulation of Electronic Commerce art. 6 and the Regulation on Commercial Communications: prior consent and registration in the Turkish message management system (İYS) for commercial messages. The distinction between service e-mails and commercial messages must match the exceptions in art. 6 of the Regulation. For merchant users, assess whether notices with serious consequences (termination) require registered electronic mail (KEP) or a notary. For EU/UK users, e-privacy rules on marketing consent also apply. -->

<h2 id="contact">17. Contact</h2>
<p>For questions about these Terms: {MAIL}</p>
'''

sayfa("en/privacy/index.html", "/gizlilik/", "Privacy Policy | Kalibre Lab",
      "How Kalibre Markets processes personal data under Turkish Law No. 6698 (KVKK): site visits, analytics, subscriptions, the encrypted MetaTrader 5 bridge, retention and your rights.", GIZLILIK)
sayfa("en/terms/index.html", "/kullanim-sartlari/", "Terms of Use | Kalibre Lab",
      "Terms of use for kalibremarkets.com, Kalibre Lab and the Kalibre Bridge add-on: not investment advice, data policy, software license, subscriptions and liability.", SARTLAR)
