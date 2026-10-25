# Privacy Policy

<p class="belge-meta">Effective date: 25 October 2026<br>Version: {{SURUM}}</p>

This policy explains what personal data Kalibre Markets collects when you use our website, Kalibre Lab, Kalibre Bridge, Kalibre Engine and our other products (the "Services"), why we use it, who we share it with, how long we keep it and what rights you have.

Our approach in one paragraph: Kalibre Lab is built to work locally first. Your trading data (prices from your broker, positions, account balances and trade history) is not stored on our servers. The Bridge relay only ever holds encrypted packets that we cannot read, for at most two hours. What we do keep is the minimum needed to run your account and subscription.

## 1. Who is responsible for your data {#controller}

The controller of your personal data is [FULL LEGAL NAME], an individual trading as Kalibre Markets, [POSTAL ADDRESS], [COUNTRY OF RESIDENCE] ("we", "us"). Contact: [CONTACT EMAIL].

<!-- FOR COUNSEL: (1) If the entity is outside the EU/UK and we target EU/UK users, GDPR Art. 27 and UK GDPR Art. 27 representatives are likely needed (Myfxbook and TradingView appoint them). Add [EU REPRESENTATIVE] and [UK REPRESENTATIVE]. (2) Decide whether a DPO is required. (3) If the entity is in Turkey, add the KVKK information-notice elements and VERBIS position. -->

## 2. What we collect and why {#collect-why}

### 2.1 Your account

When you sign in we create a Kalibre Markets account, using Supabase as our authentication and database provider.

- **Data:** email address; an internal user ID; display name if you add one; language preference; whether you opted in to marketing emails and when; when you accepted our Terms and which version; account creation and update times. If you sign in with Google, Google tells us your email address, name and Google account identifier, and confirms your identity. We never receive your Google password.
- **Sign-in:** we send a one-time link or code to your email address. We do not store a password for you.
- **Why:** to create and secure your account, let you sign in, and link your licences to you.
- **Legal basis:** performance of our contract with you. Recording your acceptance of the Terms: our legitimate interest in being able to show what was agreed.

### 2.2 Items you save while signed in

If you are signed in and save a strategy, watchlist, setting or note in Kalibre Lab, a copy is stored in your account so you can use it on other devices. These items contain your rules and preferences, not your broker's market data or your trade history. You can delete them at any time. If you are not signed in, these items stay only in your browser.

- **Legal basis:** performance of our contract with you.

### 2.3 Subscriptions and payments

Paid subscriptions are not yet available; during the beta, access is free and by invitation. This section applies once paid plans open. Payments are handled by Stripe. When you subscribe, you enter your card details and billing address on Stripe's checkout page; they go directly to Stripe and we never see your full card number.

- **What we receive and keep:** your email address; your Stripe customer and subscription IDs; subscription status and the date it is paid until; any promotion code used and the products it covers.
- **Checkout consents:** at checkout we record, with the Stripe payment record, which version of the Terms you accepted, that you ticked the box requesting immediate access and acknowledging the loss of the withdrawal right on activation, and the time you did so. We keep this so we can show the consent was given.
- **Why:** to take payment, run and renew your subscription, prevent fraud, handle refunds and disputes, and keep accounting records.
- **Legal basis:** performance of our contract; compliance with tax and accounting law; our legitimate interest in preventing fraud and defending claims.

### 2.4 Licences and the MetaTrader 5 add-ons

- **Licence record:** your licence key; the products it covers; its status and expiry; the email address and Stripe IDs above; the account it belongs to; and the numbers of up to two MetaTrader 5 accounts on which the licence has been used.
- **Licence check:** Kalibre Engine and Kalibre Bridge check your licence with our server when they start and about every six hours. Each check sends your licence key, your MetaTrader 5 account number, the product name and a protocol version number. It does not send your password, balances or positions. Our hosting provider also sees your IP address for these requests (see 2.7). To stop abuse we keep a short-lived counter of checks per MetaTrader 5 account number, deleted after about two minutes.
- **Downloads:** when you download an add-on we check your licence key and keep a short-lived download counter, deleted after about two minutes.
- **Why:** to bind your licence to your accounts, enforce the account limit and stop key sharing.
- **Legal basis:** performance of our contract; our legitimate interest in preventing misuse.

### 2.5 Kalibre Bridge relay (encrypted)

If you connect Kalibre Lab to MetaTrader 5, Kalibre Bridge reads from your terminal: closed price candles for the symbols you choose; your open positions (symbol, direction, size, open time and price, current price, stop-loss and take-profit, profit or loss, and the magic number of the add-on that opened it); your account currency, balance and equity; and your broker name, server name and whether the account is demo or live. It never reads or sends your MetaTrader 5 password.

This data is encrypted (AES-256) and authenticated (HMAC-SHA256) on your computer, with keys derived from a pairing code that Kalibre Lab creates in your browser. The pairing code never reaches us. Symbol names are inside the encrypted content.

Our servers handle only: the encrypted packets; their size and arrival time; a channel identifier derived from the pairing code, from which the code cannot be worked out; and a write counter for rate limiting. Packets are stored in Upstash and each packet is replaced by the next one of the same type and deleted automatically no later than two hours after it arrives. Counters are deleted after about two minutes. We do not write packet contents to logs, and our relay code does not store IP addresses.

Because we cannot decrypt the packets, it is arguable whether they are personal data in our hands. We describe them here anyway for transparency.

- **Legal basis:** performance of our contract (providing the feature you asked for).

### 2.6 Data that stays only in your browser

These stay in your browser's local storage and are not sent to us: your Bridge pairing code; unsynced strategy drafts, journal entries and test results; your sign-in session token; your cookie choice; and interface preferences. If you connect a broker account directly in Kalibre Lab (for example Alpaca or Tradier), your API keys or access tokens are also kept only in your browser and your browser talks to that broker directly; we receive none of that data. Clearing your browser's site data deletes these items permanently.

### 2.7 Website visits and security

Our hosting provider, Vercel, processes your IP address, browser and device information, the page or endpoint requested and the time, to deliver the Site, protect it against attacks and keep short-term logs.

- **Legal basis:** our legitimate interest in running a secure service.

### 2.8 Analytics (only with your consent)

If you click "Accept" in the cookie banner, we load Google Analytics to understand how the Site is used (pages viewed, visit length, device and browser type, approximate location, a cookie identifier). If you decline, Google Analytics is not loaded.

- **Legal basis:** your consent, which you can withdraw at any time from the cookie settings link.

<p><button type="button" class="dugme ikincil kucuk" data-cerez-ayar>Cookie settings</button></p>

### 2.9 Emails

- **Service emails** (sign-in links, receipts, licence and payment notices, security alerts, changes to our Terms) are part of the Services and are sent whether or not you opt in to marketing.
- **Product update emails** (new features, product news and offers for Kalibre Markets products) are sent to account holders. When you create an account we tell you this and give you a way to opt out straight away. You can also opt out at any time from the link in every such email or in your account settings. Opting out does not affect service emails.
- **People without an account** (for example on a waiting list) receive marketing emails only if they ask for them.
- **Legal basis:** contract for service emails; our legitimate interest in telling customers about similar products of our own, with the right to object at any time, for product update emails; consent for people without an account.

<!-- FOR COUNSEL: competitors mostly use opt-out or "soft opt-in" for existing customers (FX Blue, TradingView, QuantConnect, Myfxbook). Founder decision 25 Oct 2026: follow the competitor majority (soft opt-in for account holders, opt-out at sign-up and in every email). Check national ePrivacy rules (e.g. Germany is strict; UK PECR soft opt-in needs a sale or negotiation of a sale, so free accounts may need consent) and Turkish IYS rules if Turkish users are targeted. Implemented: profiles.marketing_consent defaults to true with marketing_consent_at recorded; the sign-in page offers opt-out at sign-up; the Account page toggle turns it off. -->

### 2.10 Waitlists, contact and support

If you join a waitlist or beta sign-up, your email address and any details you enter are sent to us through FormSubmit and used only for that purpose. If you email us, we use your message and contact details to answer you.

- **Legal basis:** consent (waitlists); legitimate interest in answering you (support).

### 2.11 AI assistant (where offered)

If you use the assistant, your messages are sent to an AI provider (Google Gemini, or Groq as a fallback) to generate a reply. We do not store your messages on our servers; recent chat history stays in your browser. Do not enter personal or account details.

- **Legal basis:** performance of the service you request.

### 2.12 What we do not do

We do not sell or rent your personal data. We do not use your strategies or trading data for advertising. We do not make decisions about you based solely on automated processing that have legal or similarly significant effects.

## 3. Who we share data with {#sharing}

We use the following service providers (processors), each only for the purposes described above:

| Provider | Purpose | Data location |
|---|---|---|
| Supabase, Inc. | Authentication, account database, sign-in emails | [SUPABASE REGION] |
| Stripe (Stripe Payments Europe Ltd or Stripe, Inc., depending on region) | Payments, invoices, subscription management, fraud prevention | US and EU |
| Vercel Inc. | Hosting, serverless functions, security | US and global edge network |
| Upstash, Inc. | Licence records, short-lived counters, encrypted Bridge packets (max 2 hours) | [UPSTASH REGION] |
| Google LLC / Google Ireland Ltd | Google sign-in (if you choose it); Google Analytics (only with consent); Google Fonts; Gemini for the assistant (where offered) | US and global |
| Groq, Inc. | Fallback assistant replies (where offered) | US |
| FormSubmit | Delivering waitlist and beta sign-up forms | [FORMSUBMIT LOCATION] |
| [EMAIL PROVIDER] | Sending and receiving email | [EMAIL PROVIDER LOCATION] |

Stripe and Google are also independent controllers for some of their own processing (for example Stripe's fraud checks and Google account sign-in), under their own privacy policies.

We may also disclose data to professional advisers, to a buyer or successor if our business is sold or reorganised (who must respect this policy), and to courts, regulators or authorities where the law requires it or to protect our rights.

<!-- FOR COUNSEL: confirm the Stripe contracting entity for [COUNTRY OF RESIDENCE], whether Supabase sends sign-in emails with its built-in service or a custom SMTP provider, the Upstash database region, and data processing agreements with each provider. -->

## 4. International transfers {#transfers}

Some providers process data outside your country, including in the United States. Where data leaves the EU, EEA or UK, we rely on an adequacy decision (including the EU-US Data Privacy Framework and its UK extension, for providers certified under it) or on the European Commission's Standard Contractual Clauses and the UK International Data Transfer Addendum, together with additional safeguards where needed. You can ask us for a copy of the relevant safeguards.

## 5. How long we keep data {#retention}

| Data | How long |
|---|---|
| Account profile | Until you delete your account. Deleting it removes your profile, saved items and licence display records immediately. |
| Saved strategies, watchlists, settings, notes | Until you delete them or your account. |
| Licence record and linked MT5 account numbers | While the subscription is active and for up to 12 months after it ends, then deleted or anonymised. |
| Payment, invoice and tax records | For the period required by tax and commercial law in [COUNTRY OF RESIDENCE] (typically [X] years). Stripe keeps its own records under its policy. |
| Checkout consent records (terms version, withdrawal-consent tick and time) | For as long as the payment record is kept, so we can show the consent was given. |
| Encrypted Bridge packets | At most 2 hours. |
| Rate-limit counters | About 2 minutes. |
| Checkout session pointer (used to show your key after payment) | 7 days. |
| Hosting and security logs | For the limited period set by Vercel. |
| Google Analytics data | Up to 14 months. |
| Marketing consent record | While you are subscribed to marketing and for 24 months after you unsubscribe, to show consent. |
| Support emails | Up to 3 years after the last message, or longer if needed for a dispute. |
| Waitlist sign-ups | Until we have contacted you about the launch or you ask to be removed. |

<!-- FOR COUNSEL: fill [X] years for [COUNTRY OF RESIDENCE] tax law; confirm the 12-month licence retention (matches previous TR/EN draft) and whether a deletion job exists for expired licence records in Upstash (code keeps them until removed). -->

## 6. Security {#security}

We use encryption in transit (TLS), end-to-end encryption for Bridge data, row-level security on our database, server-side secrets kept out of the browser, and rate limits on our endpoints. No system is perfectly secure, so please keep your email account, licence key and pairing code safe.

## 7. Your rights {#rights}

Depending on where you live, you may have the right to: access your data; correct it; delete it; restrict or object to processing (including at any time to direct marketing); receive your data in a portable format; and withdraw consent at any time without affecting earlier processing.

- **EU, EEA and UK residents** can also complain to their data protection authority (in the UK, the Information Commissioner's Office). We would appreciate the chance to resolve your concern first.
- **California and other US state residents** have the right to know, delete and correct personal information and not to be discriminated against for using these rights. We do not sell or share personal information for cross-context behavioural advertising.

You can delete your account and saved items yourself in your account page. For other requests, email [CONTACT EMAIL] from the address linked to your account. We will reply within one month (this can be extended by two months for complex requests, and we will tell you if so). We may need to verify your identity.

## 8. Children {#children}

The Services are for adults. We do not knowingly collect data from anyone under 18. If you believe a child has given us data, contact us and we will delete it.

## 9. Changes to this policy {#changes}

We will post updates here with a new effective date. If a change materially affects how we use your data, we will tell account holders by email or in the Services before it applies.

## 10. Contact {#contact}

[FULL LEGAL NAME], an individual trading as Kalibre Markets, [POSTAL ADDRESS], [COUNTRY OF RESIDENCE]. Email: [CONTACT EMAIL].
