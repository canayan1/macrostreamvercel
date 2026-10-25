# Risk Disclosure

<p class="belge-meta">Effective date: 25 October 2026<br>Version: {{SURUM}}</p>

Please read this before using Kalibre Lab, Kalibre Bridge, Kalibre Engine or any other Kalibre Markets product. This disclosure is part of our [Terms of Service](/terms). It does not list every risk.

## 1. Trading can lose you money {#loss}

Trading forex, CFDs, futures, stocks, crypto assets and other instruments carries a high risk of loss. Leveraged products magnify both gains and losses, and you can lose all the money you deposit; with some brokers and products you can lose more. When the European Securities and Markets Authority introduced its 2018 restrictions on CFDs sold to retail clients, it reported that between 74% and 89% of retail CFD accounts typically lose money. Your broker publishes its own figure. Only trade with money you can afford to lose, and make sure you understand the products you trade.

<!-- FOR COUNSEL / DATA CHECK: the 74-89% range is from ESMA's 2018 CFD product intervention measures (ESMA Decision (EU) 2018/796 and accompanying statement). Verified 25 Oct 2026 against ESMA's press release of 27 March 2018 ("ESMA agrees to prohibit binary options and restrict CFDs to protect retail investors", esma.europa.eu/node/84933): national regulators' analyses showed 74-89% of retail accounts typically lose money. -->

## 2. We do not give advice {#no-advice}

Kalibre Markets provides software and general education. We are not a broker, investment adviser, commodity trading adviser, portfolio manager or signal provider. Nothing in our products is a recommendation to buy, sell or hold anything, and nothing takes your personal situation into account. Example strategies are for learning, not recommendations. You decide which rules to build, which instruments to trade, when and how much. If you need advice, speak to an authorised adviser.

## 3. We never hold your money {#no-custody}

We do not hold, receive or control your funds or assets, and we do not open accounts for you. Your money stays with your broker, and the risk of your broker failing or restricting your account is outside our control.

## 4. Hypothetical and simulated results {#hypothetical}

Backtests, quick tests, optimisation results, equity curves, example results and anything else in our products that shows how a rule "would have" performed are hypothetical.

The following statement is required by the U.S. Commodity Futures Trading Commission for hypothetical performance presentations and applies to all such results we show:

> THESE RESULTS ARE BASED ON SIMULATED OR HYPOTHETICAL PERFORMANCE RESULTS THAT HAVE CERTAIN INHERENT LIMITATIONS. UNLIKE THE RESULTS SHOWN IN AN ACTUAL PERFORMANCE RECORD, THESE RESULTS DO NOT REPRESENT ACTUAL TRADING. ALSO, BECAUSE THESE TRADES HAVE NOT ACTUALLY BEEN EXECUTED, THESE RESULTS MAY HAVE UNDER-OR OVER-COMPENSATED FOR THE IMPACT, IF ANY, OF CERTAIN MARKET FACTORS, SUCH AS LACK OF LIQUIDITY. SIMULATED OR HYPOTHETICAL TRADING PROGRAMS IN GENERAL ARE ALSO SUBJECT TO THE FACT THAT THEY ARE DESIGNED WITH THE BENEFIT OF HINDSIGHT. NO REPRESENTATION IS BEING MADE THAT ANY ACCOUNT WILL OR IS LIKELY TO ACHIEVE PROFITS OR LOSSES SIMILAR TO THESE BEING SHOWN.

<!-- FOR COUNSEL: text of CFTC Rule 4.41(b)(1)(i) (17 CFR 4.41), verified verbatim against the LII copy of the e-CFR on 25 Oct 2026. Myfxbook uses the longer NFA-style statement; TraderSync paraphrases it. Rule 4.41 strictly applies to CPOs/CTAs and their principals; we use it as the market-standard disclosure, not as an admission that Kalibre Markets is a CTA. -->

In addition, in our products specifically:

- **Costs left out.** The quick test does not include spread, commission, swap or slippage. Real results are usually worse.
- **Inside-the-candle assumptions.** When a stop and a target could both have been hit within one candle, the test has to assume which came first. Real fills may differ.
- **Data quality.** Results depend on the data used. Broker data differs between brokers and servers; gaps, errors and missing history change results. Synthetic data, marked as synthetic, does not represent any real market.
- **Overfitting.** Optimisation searches past data for the settings that would have worked best. The best-looking settings are often fitted to past noise and tend to perform worse on new data.
- **No real-world pressure.** A backtest does not have to survive losing streaks, missed trades or the temptation to change rules halfway, all of which affect real results.
- **Past performance is not a reliable indicator of future results.**

The Methodology page explains how our calculations work. MetaTrader 5 Strategy Tester results also depend on your broker and the test settings you choose.

## 5. Automated trading with Kalibre Engine {#kalibre-engine}

Kalibre Engine places real orders on the account where you attach it, following your rule file. Additional risks include:

- **Rule and software errors.** Your rule file may not do what you intended, and our software may contain bugs, especially in beta.
- **Connectivity.** If MetaTrader 5 closes, your computer sleeps, your VPS fails or the internet drops, Kalibre Engine cannot manage positions.
- **Execution.** Fast markets, news releases, low liquidity and weekend or session openings can cause slippage, gaps, partial fills, requotes or rejected orders, so trades can close at prices far from your stop or target.
- **Broker differences.** Contract sizes, margin rules, trading hours, swaps and order types differ by broker and can change.
- **Prop firm rules.** Prop firms set their own drawdown, news and consistency rules. Meeting them is your responsibility.

**Safeguards on live accounts.** On a live account Kalibre Engine opens no new positions until you tick the setting accepting the live-account risk and a loss limit (the risk shield or a daily loss limit in your rule file) is set. These safeguards reduce risk but do not remove it: **the risk shield and loss limits are not a guarantee** and can be exceeded because of gaps, slippage, delays, disconnections or broker rules.

Always test a rule file in Strategy Tester and on a demo account before using it on a live account, and monitor live trading.

## 6. Kalibre Bridge and data {#kalibre-bridge}

Kalibre Bridge is read-only and does not place orders. It depends on your terminal, your connection, your broker's servers and our relay, so data may be delayed, incomplete or missing. Do not use it as your only way to watch open positions.

## 7. Beta software {#beta-software}

Features marked beta may change, contain errors or produce wrong results. Check important numbers against your own MetaTrader 5 terminal and report anything that looks wrong.

## 8. Your responsibility {#responsibility}

You are responsible for your trading decisions, the rules you run, the settings you choose, checking that trading is lawful where you live, and any taxes on your results. All trades placed on your account, including by Kalibre Engine, are your trades.

## 9. Questions {#contact}

If anything here is unclear, contact [CONTACT EMAIL] before you trade.
