# Kalibre Markets ana sayfası (EN kök, TR /tr), /treasury ve /company sayfaları.
# Ortak üst menü ve alt bilgi sayfa-uret.py'den gelir (ust, ALT, ALT_EN, sayfa).
# Yapı: işe göre ürün ızgarası (Stripe), ekran görüntüsü öncelikli sahne ve numaralı adımlar (Linear),
# trader segmentleri ve yoğun ama okunur özellik satırları (TradingView). Tasarım dili static/site.css.
# Rakamlar yalnız doğrulama raporlarından: kalibre-lab docs/dogrulama/C-raporu.md ve E-raporu.md.
# Kullanım: python3 yerel/pitch-uret.py
import os, re, sys
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

GORSEL = "/static/urun/analytics"

def resim(ad, alt, dil, ilk=False, sizes="(max-width: 1180px) 100vw, 1100px"):
    ek = "-tr" if dil == "tr" else ""
    yukle = 'fetchpriority="high" decoding="async"' if ilk else 'loading="lazy" decoding="async"'
    return (f'<picture><source type="image/webp" srcset="{GORSEL}/{ad}{ek}-1x.webp 1440w, {GORSEL}/{ad}{ek}-2x.webp 2880w" sizes="{sizes}">'
            f'<img src="{GORSEL}/{ad}{ek}.png" width="2880" height="1800" alt="{alt}" {yukle}></picture>')

IKON = {
    "tarayici": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>',
    "kilit": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    "anahtar": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></svg>',
}

M = {
 "en": dict(
  title="Kalibre Markets: analytics for trading data (beta)",
  desc="See where a trading account or desk makes and loses money, check prop firm loss limits and test rules on your own history. Files are processed in your browser.",
  rozet="Trade Analytics reads MT5 reports, CSV and Excel files", rozet_url="/mt5-analytics",
  h1="Analytics for trading data.",
  giris="See where a trading account or desk makes and loses money, keep within risk limits and test rules on your own history. Files are processed in your browser.",
  b1="Try every product with sample files", b1u="/demo", b2="Get early access", b2u="/mt5-analytics#pricing", b3="Request a desk demo", b3u="/treasury#demo",
  not_="Beta software. No account needed to try it. Not investment advice.",
  hero_alt="Kalibre Trade Analytics showing an account overview for an example account",
  sentetik="Example", hero_yazi="Kalibre Trade Analytics with an example account.",
  urun_bas="Products", urun_giris="Every product works on the same trade model. Start with the job in front of you.",
  ta_ac="Drop in an MT5 history report, a CSV file or an Excel log. See results by symbol, hour, weekday, session, holding time, trade size and the trade after a loss.",
  ta_madde=["Losing and winning segments ranked, each with at least 20 trades", "Prop firm daily and total limits, day by day", "Your own group-by views, saved in your browser"],
  ta_bag="Explore Trade Analytics", ta_alt="Ranked losing and winning segments for the example account",
  fx_ac="Reads the FX blotter a treasury or dealing desk already keeps, as it is exported.", fx_bag="Try the sample Excel blotter", fx_url="/lab/blotter?file=samples/fx-blotter-sample.xlsx",
  fx_madde=["Daily P&amp;L: mark-to-market plus realized, on value date", "Spot and swap-points P&amp;L on separate lines", "Carry cost as overnight swap", "Intraday net open position and value-date ladder", "One-click drill-down to the deals"],
  rg_ac="An MT5 add-on that tracks the firm's daily and total loss floors on every tick and blocks new trades near the floor. Presets for FTMO and The5ers.", rg_bag="About Rule Guard",
  lab_ac="Build a rule with blocks or a form, backtest it with costs and check settings with training and test periods, deflated Sharpe and the probability of backtest overfitting.", lab_bag="Open the lab",
  bag_ac="Bring data from where it already lives.",
  bag_liste=[("Kalibre Bridge for MT5", "/setup", "beta"), ("CSV and Excel trade logs", "/mt5-analytics#import-your-log", "beta"), ("Alpaca and Tradier", "/lab/connect", "beta")],
  adim_bas="How it works", adim_giris="Three steps from a file to a decision you make yourself.",
  adimlar=[("01", "Connect", "Export a report from MT5, drop in a CSV or Excel log, or link a live MT5 account with Kalibre Bridge."),
           ("02", "Analyze", "Kalibre builds one trade model and breaks results down by the fields that matter. Small samples are flagged as possible noise."),
           ("03", "Act", "Set loss limits with Rule Guard, or test a change to your rules in Kalibre Lab before you trade it.")],
  satirlar=[("insights", "Where you make and lose money", "The list ranks segments by their contribution to net P&amp;L. Each row shows the trade count, win rate against your average and, when it differs, your average size. A segment needs at least 20 trades to appear.", "Ranked segments for the example account"),
            ("prop-limits", "Prop limits, day by day", "Pick a firm preset or enter your own percentages. Each day shows both floors, the lowest closed balance and how close it came. A history report has no intraday equity, so this view measures closed trades only.", "Daily prop limit table for the example account"),
            ("custom-view", "Your own views", "Group by any field, choose a measure and a chart. Views are saved in your browser and open again on your next visit.", "Custom view builder grouping the example account by session")],
  dog_bas="An engine checked against MetaTrader 5", dog_giris="We check how a number is computed before we show it. These are validation facts about the engine, not trading results.",
  sayilar=[("97", "MT5 Strategy Tester runs compared trade by trade"), ("44,015", "MT5 trades in those runs"), ("87,315", "trades recomputed by a separate reference implementation"), ("0", "unexplained differences in either check")],
  dog_not="Strategy Tester comparison: 7 strategies on EURUSD, GBPUSD, XAUUSD and USDJPY, July 2025 to June 2026. Every remaining difference is traced to a documented cause. The reference implementation was written from the rule specification without access to the engine code.",
  dog_bag="Read the methodology", dog_url="/methodology",
  giz_bas="Your data stays on your device", giz_giris="The privacy model is part of the architecture, not a setting.",
  giz=[("tarayici", "Files are read in your browser", "MT5 reports, CSV and Excel files are parsed on your device and are not uploaded. The account number and name in a report are not read."),
       ("kilit", "Live MT5 data is encrypted end to end", "Kalibre Bridge encrypts each packet with AES-256 before it leaves the terminal. The relay stores only ciphertext and deletes it within 2 hours."),
       ("anahtar", "No passwords", "We never ask for your MT5 or broker password. Alpaca and Tradier keys stay in your browser.")],
  giz_bag="Read the security details", giz_url="/security",
  seg_bas="Built for how you trade", seg_giris="The same engine, framed for four kinds of users.",
  segler=[("Prop traders", "Stay inside the firm's daily and total loss limits, and see which days came close.", "/rule-guard", "Rule Guard"),
          ("Active MT5 traders", "Find the hours, symbols and habits that cost you money.", "/mt5-analytics", "Trade Analytics"),
          ("Treasury and dealing desks", "Analyze the FX blotter your desk already keeps, without reformatting it.", "/treasury", "FX Blotter Analytics"),
          ("Brokers and prop firms", "Analytics and rule monitoring across many accounts.", "/company#partners", "Talk to us")],
  yol_bas="Roadmap", yol_giris="What is available, what comes next and what is planned. Dates are not promised.",
  yol=[("Now", [("Trade Analytics", "beta", "MT5 reports, CSV and Excel, breakdowns, prop limits"), ("Kalibre Lab", "beta", "Rule builder, backtest, optimization with overfitting checks"), ("Kalibre Bridge", "beta", "Encrypted read-only link from MT5"), ("Trade log templates", "beta", "CSV and Excel templates with row-level checks")]),
       ("Next", [("Rule Guard", "test", "Early access on demo accounts"), ("FX Blotter Analytics", "beta", "Pilots with treasury and dealing desks on their own blotters")]),
       ("Later", [("Weekly rule report", "plan", "Rule breaks and costly habits, once a week"), ("Multi-account views", "plan", "For prop firms and brokers"), ("More platforms", "plan", "cTrader and Match-Trader")])],
  son_bas="Try it on your own history", son_giris="Open each product with a sample file and download the result, or drop in your own file. Nothing is uploaded.",
 ),
 "tr": dict(
  title="Kalibre Markets: alım satım verisi için analiz (beta)",
  desc="Bir hesabın ya da masanın nerede kazanıp kaybettiğini gör, prop firması kayıp sınırlarını denetle ve kurallarını kendi geçmişinde sına. Dosyalar tarayıcında işlenir.",
  rozet="Trade Analytics MT5 raporlarını, CSV ve Excel dosyalarını okur", rozet_url="/tr/mt5-analytics",
  h1="Alım satım verisi için analiz.",
  giris="Bir hesabın ya da masanın nerede kazanıp kaybettiğini gör, risk sınırları içinde kal ve kurallarını kendi geçmişinde sına. Dosyalar tarayıcında işlenir.",
  b1="Her ürünü örnek dosyalarla dene", b1u="/tr/demo", b2="Erken erişim", b2u="/tr/mt5-analytics#pricing", b3="Masa demosu iste", b3u="/tr/treasury#demo",
  not_="Beta yazılım. Denemek için hesap gerekmez. Yatırım tavsiyesi değildir.",
  hero_alt="Örnek bir hesap için hesap özetini gösteren Kalibre Trade Analytics",
  sentetik="Örnek", hero_yazi="Örnek bir hesapla Kalibre Trade Analytics.",
  urun_bas="Ürünler", urun_giris="Her ürün aynı işlem modeli üzerinde çalışır. Önündeki işe uyanla başla.",
  ta_ac="MT5 geçmiş raporunu, bir CSV dosyasını ya da Excel kaydını bırak. Sonuçlarını sembol, saat, gün, seans, pozisyon süresi, işlem büyüklüğü ve kayıptan sonraki işleme göre gör.",
  ta_madde=["Kaybettiren ve kazandıran durumlar sıralı, her biri en az 20 işlemle", "Prop firması günlük ve toplam sınırları, gün gün", "Kendi gruplama görünümlerin, tarayıcında kayıtlı"],
  ta_bag="Trade Analytics'i incele", ta_alt="Örnek hesap için sıralı kaybettiren ve kazandıran durumlar",
  fx_ac="Hazine ya da dealing masasının zaten tuttuğu FX blotter'ını, dışa aktarıldığı haliyle okur.", fx_bag="Örnek Excel blotter ile dene", fx_url="/lab/blotter?lang=tr&amp;file=samples/fx-blotter-ornek.xlsx",
  fx_madde=["Günlük kâr/zarar: değerleme artı gerçekleşen, valör tarihinde", "Spot ve swap puanı kâr/zararı ayrı satırlarda", "Taşıma maliyeti gecelik swap olarak", "Gün içi net açık pozisyon ve valör merdiveni", "Tek tıkla deal'lere inme"],
  rg_ac="Firmanın günlük ve toplam kayıp tabanlarını her tick'te izleyen ve tabana yakın yeni işlemi engelleyen MT5 eklentisi. FTMO ve The5ers ön ayarları.", rg_bag="Rule Guard hakkında",
  lab_ac="Bloklarla ya da formla kural kur, maliyetlerle backtest et, ayarları eğitim ve test dönemleri, deflated Sharpe ve backtest aşırı uyum olasılığıyla sına.", lab_bag="Laboratuvarı aç",
  bag_ac="Veriyi zaten bulunduğu yerden getir.",
  bag_liste=[("MT5 için Kalibre Bridge", "/tr/setup", "beta"), ("CSV ve Excel işlem kayıtları", "/tr/mt5-analytics#kendi-kaydin", "beta"), ("Alpaca ve Tradier", "/lab/connect?lang=tr", "beta")],
  adim_bas="Nasıl çalışır", adim_giris="Bir dosyadan kendi vereceğin karara üç adım.",
  adimlar=[("01", "Bağla", "MT5'ten rapor al, bir CSV ya da Excel kaydı bırak ya da canlı MT5 hesabını Kalibre Bridge ile bağla."),
           ("02", "Analiz et", "Kalibre tek bir işlem modeli kurar ve sonuçları önemli alanlara göre ayırır. Küçük örneklemler gürültü olabilir diye işaretlenir."),
           ("03", "Harekete geç", "Rule Guard ile kayıp sınırlarını kur ya da kuralındaki bir değişikliği işleme koymadan önce Kalibre Lab'de sına.")],
  satirlar=[("insights", "Nerede kazanıp kaybettiğin", "Liste durumları net kâr/zarara katkılarına göre sıralar. Her satır işlem sayısını, ortalamana göre kazanma oranını ve farklıysa ortalama büyüklüğünü gösterir. Bir durumun listeye girmesi için en az 20 işlem gerekir.", "Örnek hesap için sıralı durumlar"),
            ("prop-limits", "Prop sınırları, gün gün", "Bir firma ön ayarı seç ya da kendi yüzdelerini gir. Her gün iki tabanı, en düşük kapanış bakiyesini ve tabana ne kadar yaklaşıldığını gösterir. Geçmiş raporunda gün içi varlık değeri olmadığı için bu görünüm yalnız kapanmış işlemleri ölçer.", "Örnek hesap için günlük prop sınırı tablosu"),
            ("custom-view", "Kendi görünümlerin", "Herhangi bir alana göre grupla, bir ölçü ve grafik seç. Görünümler tarayıcında kaydedilir ve sonraki ziyaretinde yeniden açılır.", "Örnek hesabı seansa göre gruplayan görünüm kurucu")],
  dog_bas="MetaTrader 5'e karşı sınanmış bir motor", dog_giris="Bir sayıyı göstermeden önce nasıl hesaplandığını sınarız. Bunlar motorla ilgili doğrulama bilgileridir, işlem sonucu değildir.",
  sayilar=[("97", "işlem işlem karşılaştırılan MT5 Strategy Tester koşusu"), ("44.015", "bu koşulardaki MT5 işlemi"), ("87.315", "ayrı bir referans uygulamasıyla yeniden hesaplanan işlem"), ("0", "iki denetimde de açıklanamayan fark")],
  dog_not="Strategy Tester karşılaştırması: EURUSD, GBPUSD, XAUUSD ve USDJPY'de 7 strateji, Temmuz 2025 ile Haziran 2026 arası. Kalan her fark belgelenmiş bir nedene bağlandı. Referans uygulama, motor koduna bakılmadan yalnız kural şartnamesinden yazıldı.",
  dog_bag="Metodolojiyi oku", dog_url="/tr/methodology",
  giz_bas="Verin cihazında kalır", giz_giris="Gizlilik bir ayar değil, mimarinin parçası.",
  giz=[("tarayici", "Dosyalar tarayıcında okunur", "MT5 raporları, CSV ve Excel dosyaları cihazında işlenir ve yüklenmez. Rapordaki hesap numarası ve ad okunmaz."),
       ("kilit", "Canlı MT5 verisi uçtan uca şifreli", "Kalibre Bridge her paketi terminalden çıkmadan AES-256 ile şifreler. Röle yalnız şifreli metni tutar ve 2 saat içinde siler."),
       ("anahtar", "Şifre yok", "MT5 ya da aracı kurum şifreni hiçbir zaman istemeyiz. Alpaca ve Tradier anahtarları tarayıcında kalır.")],
  giz_bag="Güvenlik ayrıntılarını oku", giz_url="/tr/security",
  seg_bas="İşlem yapma biçimine göre", seg_giris="Aynı motor, dört tür kullanıcı için.",
  segler=[("Prop trader'lar", "Firmanın günlük ve toplam kayıp sınırları içinde kal, hangi günlerin yaklaştığını gör.", "/tr/rule-guard", "Rule Guard"),
          ("Aktif MT5 trader'ları", "Sana para kaybettiren saatleri, sembolleri ve alışkanlıkları bul.", "/tr/mt5-analytics", "Trade Analytics"),
          ("Hazine ve dealing masaları", "Masanın zaten tuttuğu FX blotter'ını yeniden biçimlendirmeden analiz et.", "/tr/treasury", "FX Blotter Analytics"),
          ("Aracı kurumlar ve prop firmaları", "Çok sayıda hesapta analiz ve kural izleme.", "/tr/company#partners", "Bizimle konuşun")],
  yol_bas="Yol haritası", yol_giris="Neyin hazır olduğu, sırada ne olduğu ve neyin planlandığı. Tarih sözü verilmez.",
  yol=[("Şimdi", [("Trade Analytics", "beta", "MT5 raporu, CSV ve Excel, kırılımlar, prop sınırları"), ("Kalibre Lab", "beta", "Kural kurucu, backtest, aşırı uyum denetimli optimizasyon"), ("Kalibre Bridge", "beta", "MT5'ten şifreli, salt okunur bağlantı"), ("İşlem kaydı şablonları", "beta", "Satır satır denetimli CSV ve Excel şablonları")]),
       ("Sırada", [("Rule Guard", "test", "Demo hesaplarda erken erişim"), ("FX Blotter Analytics", "beta", "Hazine ve dealing masalarıyla kendi blotter'larında pilot")]),
       ("Sonra", [("Haftalık kural raporu", "plan", "Kural ihlalleri ve pahalı alışkanlıklar, haftada bir"), ("Çok hesaplı görünümler", "plan", "Prop firmaları ve aracı kurumlar için"), ("Yeni platformlar", "plan", "cTrader ve Match-Trader")])],
  son_bas="Kendi geçmişinde dene", son_giris="Her ürünü örnek dosyayla aç ve sonucu indir ya da kendi dosyanı bırak. Hiçbir şey yüklenmez.",
 ),
}

def bolum_bas(h2, p, id_=""):
    return f'<div class="bolum-bas"{f" id={chr(34)}{id_}{chr(34)}" if id_ else ""}><h2>{h2}</h2><p>{p}</p></div>'

def ana_govde(dil):
    t = M[dil]; tr = dil == "tr"
    is_ad = (["Analiz", "Koru", "Araştır", "Bağla"] if tr else ["Analyze", "Protect", "Research", "Connect"])
    lab_u = "/lab?lang=tr" if tr else "/lab"
    madde = "".join(f"<li>{m}</li>" for m in t["ta_madde"])
    bag = "".join(f'<a href="{h}">{ad}{durum_et(d, dil)}</a>' for ad, h, d in t["bag_liste"])
    adimlar = "".join(f'<div class="p-adim"><span class="no">{"ŞEKİL" if tr else "FIG"} {n}</span><h3>{b}</h3><p>{a}</p></div>' for n, b, a in t["adimlar"])
    satirlar = ""
    for i, (ad, b, a, alt) in enumerate(t["satirlar"]):
        satirlar += (f'<div class="p-satir{" ters" if i % 2 else ""}"><div><h3>{b}</h3><p>{a}</p></div>'
                     f'<figure class="p-cerceve">{resim(ad, alt, dil, sizes="(max-width: 760px) 100vw, 640px")}</figure></div>')
    sayilar = "".join(f'<div class="p-sayi"><b>{s}</b><span>{a}</span></div>' for s, a in t["sayilar"])
    giz = "".join(f'<div><span class="p-ikon">{IKON[i]}</span><h3>{b}</h3><p>{a}</p></div>' for i, b, a in t["giz"])
    seg = "".join(f'<a class="p-segment" href="{h}"><h3>{b}</h3><p>{a}</p><span>{e}</span></a>' for b, a, h, e in t["segler"])
    yol = "".join(f'<div><h3>{b}</h3><ul>' + "".join(f'<li><b>{ad}{durum_et(d, dil)}</b><small>{ac}</small></li>' for ad, d, ac in og) + '</ul></div>' for b, og in t["yol"])
    hazine = "/tr/treasury" if tr else "/treasury"
    rg = "/tr/rule-guard" if tr else "/rule-guard"
    ta = "/tr/mt5-analytics" if tr else "/mt5-analytics"
    return f'''<main>
<section class="p-hero p-ust-bosluk">
  <div class="kap">
    <a class="p-rozet" href="{t["rozet_url"]}">{durum_et("beta", dil)}<span>{t["rozet"]}</span></a>
    <h1>{t["h1"]}</h1>
    <p class="giris">{t["giris"]}</p>
    <div class="p-eylem">
      <a class="dugme" href="{t["b1u"]}">{t["b1"]}</a>
      <a class="dugme ikincil" href="{t["b2u"]}">{t["b2"]}</a>
      <a class="metin-bag" href="{t["b3u"]}">{t["b3"]}</a>
    </div>
    <p class="not">{t["not_"]}</p>
    <div class="p-sahne">
      <figure class="p-cerceve">{resim("hero", t["hero_alt"], dil, ilk=True)}</figure>
      <p class="p-alt-yazi"><span class="p-sentetik">{t["sentetik"]}</span>{t["hero_yazi"]}</p>
    </div>
  </div>
</section>

<section class="bolum" id="products" aria-labelledby="urun-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="urun-bas">{t["urun_bas"]}</h2><p>{t["urun_giris"]}</p></div>
    <div class="p-izgara">
      <article class="p-kart genis">
        <span class="p-is">{is_ad[0]}</span>
        <h3>Trade Analytics{durum_et("beta", dil)}</h3>
        <p>{t["ta_ac"]}</p>
        <ul>{madde}</ul>
        <a class="bag" href="{ta}">{t["ta_bag"]}</a>
        <div class="p-mini">{resim("insights", t["ta_alt"], dil, sizes="(max-width: 1000px) 100vw, 760px")}</div>
      </article>
      <article class="p-kart dar">
        <span class="p-is">{is_ad[0]}</span>
        <h3>FX Blotter Analytics{durum_et("beta", dil)}</h3>
        <p>{t["fx_ac"]}</p>
        <ul>{"".join(f"<li>{m}</li>" for m in t["fx_madde"])}</ul>
        <p class="p-baslik-ornek">{"İşlem Tarihi · Valör · Döviz Cinsi · Alış/Satış · Tutar · Kur" if tr else "Trade Date · Value Date · Pair · Buy/Sell · Notional · Rate"}</p>
        <a class="bag" href="{t["fx_url"]}">{t["fx_bag"]}</a> <a class="bag" href="{hazine}">{"Masalar için" if tr else "For desks"}</a>
      </article>
      <article class="p-kart uc">
        <span class="p-is">{is_ad[1]}</span>
        <h3>Rule Guard{durum_et("test", dil)}</h3>
        <p>{t["rg_ac"]}</p>
        <a class="bag" href="{rg}">{t["rg_bag"]}</a>
      </article>
      <article class="p-kart uc">
        <span class="p-is">{is_ad[2]}</span>
        <h3>Kalibre Lab{durum_et("beta", dil)}</h3>
        <p>{t["lab_ac"]}</p>
        <a class="bag" href="{lab_u}">{t["lab_bag"]}</a>
      </article>
      <article class="p-kart uc">
        <span class="p-is">{is_ad[3]}</span>
        <h3>{"Bağlantılar" if tr else "Connections"}</h3>
        <p>{t["bag_ac"]}</p>
        <div class="p-baglanti-liste">{bag}</div>
      </article>
    </div>
  </div>
</section>

<section class="bolum" aria-labelledby="adim-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="adim-bas">{t["adim_bas"]}</h2><p>{t["adim_giris"]}</p></div>
    <div class="p-adimlar">{adimlar}</div>
    <div style="margin-top:40px">{satirlar}</div>
  </div>
</section>

<section class="p-kagit" aria-labelledby="dog-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="dog-bas">{t["dog_bas"]}</h2><p>{t["dog_giris"]}</p></div>
    <div class="p-sayilar">{sayilar}</div>
    <p class="p-dipnot">{t["dog_not"]} <a href="{t["dog_url"]}">{t["dog_bag"]}</a></p>
  </div>
</section>

<section class="bolum" style="border-top:0" aria-labelledby="giz-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="giz-bas">{t["giz_bas"]}</h2><p>{t["giz_giris"]} <a href="{t["giz_url"]}">{t["giz_bag"]}</a></p></div>
    <div class="p-uclu">{giz}</div>
  </div>
</section>

<section class="bolum" aria-labelledby="seg-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="seg-bas">{t["seg_bas"]}</h2><p>{t["seg_giris"]}</p></div>
    <div class="p-segmentler">{seg}</div>
  </div>
</section>

<section class="bolum" id="roadmap" aria-labelledby="yol-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="yol-bas">{t["yol_bas"]}</h2><p>{t["yol_giris"]}</p></div>
    <div class="p-yol">{yol}</div>
  </div>
</section>

<section class="bolum p-son" aria-labelledby="son-bas">
  <div class="kap">
    <h2 id="son-bas">{t["son_bas"]}</h2>
    <p class="giris">{t["son_giris"]}</p>
    <div class="p-eylem">
      <a class="dugme" href="{t["b1u"]}">{t["b1"]}</a>
      <a class="dugme ikincil" href="{t["b2u"]}">{t["b2"]}</a>
      <a class="metin-bag" href="{t["b3u"]}">{t["b3"]}</a>
    </div>
  </div>
</section>
</main>'''

def ana_yaz(dil):
    t = M[dil]
    yol, diger = ("/", "/tr") if dil == "en" else ("/tr", "/")
    kanon = "https://kalibremarkets.com" + yol
    ek = "-tr" if dil == "tr" else ""
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
<link rel="alternate" hreflang="en" href="https://kalibremarkets.com/">
<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com/tr">
<link rel="alternate" hreflang="x-default" href="https://kalibremarkets.com/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:title" content="{t["title"]}">
<meta property="og:description" content="{t["desc"]}">
<meta property="og:url" content="{kanon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kalibre Markets">
<meta property="og:locale" content="{"en_US" if dil == "en" else "tr_TR"}">
<meta property="og:image" content="https://kalibremarkets.com/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Organization","name":"Kalibre Markets","url":"https://kalibremarkets.com","email":"markets@kalibrefin.com"}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">
<link rel="preload" as="image" type="image/webp" imagesrcset="{GORSEL}/hero{ek}-1x.webp 1440w, {GORSEL}/hero{ek}-2x.webp 2880w" imagesizes="(max-width: 1180px) 100vw, 1100px">
<link rel="stylesheet" href="/static/site.css">
<link rel="stylesheet" href="/static/ana/pitch.css">
<script src="/static/kalibre-cerez.js"></script>
<script src="/static/beta.js" defer></script>
{yol_etiketleri(dil)}<script src="/static/kalibre-auth.js" defer></script>
</head>
<body>

{ust(yol, dil, diger)}

{ana_govde(dil)}

{ALT_EN if dil == "en" else ALT}
</body>
</html>
'''
    assert "—" not in html and "–" not in html, dil + ": uzun tire"
    hedef = os.path.join(KOK, yol.lstrip("/"), "index.html")
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    open(hedef, "w").write(egik_cizgisiz(html))
    print("yazıldı", os.path.relpath(hedef, KOK))

# ------------------------------------------------------------------ /treasury
FORM_STIL = """
dialog#erken-erisim { max-width: 560px; width: calc(100% - 32px); background: var(--zemin-2); color: var(--metin); border: 1px solid var(--cizgi-2); border-radius: 8px; padding: 24px; }
dialog#erken-erisim::backdrop { background: rgba(5, 10, 18, .7); }
dialog#erken-erisim h2 { margin: 0 0 6px; font-size: 24px; }
dialog#erken-erisim .alanlar { display: grid; gap: 12px; margin: 14px 0; }
dialog#erken-erisim label { display: grid; gap: 6px; font-size: 14px; color: var(--soluk); }
dialog#erken-erisim input[type=email], dialog#erken-erisim input[type=text], dialog#erken-erisim select { min-height: 42px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin); color: var(--metin); font: 400 15px var(--sans); width: 100%; box-sizing: border-box; }
dialog#erken-erisim label.onay { display: flex; font-size: 14px; }
dialog#erken-erisim .kapat-satir { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.talep-mesaj { margin: 10px 0; font-weight: 600; }
.talep-mesaj.tamam { color: var(--yesil); } .talep-mesaj.hata { color: var(--kehribar); }
.gizli-alan { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.demo-kutu { border: 1px solid var(--cizgi-2); border-radius: 12px; padding: 24px; background: var(--zemin-2); margin: 24px 0; }
.demo-kutu h2 { margin: 0 0 8px !important; }
"""

def secim(ad, etiket, secenekler, bos):
    s = "".join(f'<option value="{v}">{t}</option>' for v, t in secenekler)
    return f'<label for="ee-{ad}">{etiket}<select id="ee-{ad}" name="{ad}" data-soru><option value="">{bos}</option>{s}</select></label>'

def demo_pencere(dil):
    tr = dil == "tr"
    bos = "Seçin" if tr else "Choose"
    kurum = [("banka", "Banka" if tr else "Bank"), ("kurumsal-hazine", "Şirket hazinesi" if tr else "Corporate treasury"),
             ("araci-kurum", "Aracı kurum" if tr else "Broker"), ("prop-firma", "Prop firması" if tr else "Prop firm"),
             ("fon", "Fon ya da portföy yönetimi" if tr else "Fund or asset manager"), ("diger", "Diğer" if tr else "Other")]
    masa = [("1", "1"), ("2-5", "2-5"), ("6-20", "6-20"), ("20+", "20+")]
    sorular = (secim("kurum", "Kurum türü" if tr else "Organization type", kurum, bos)
               + secim("masa", "Masadaki kişi sayısı" if tr else "People on the desk", masa, bos)
               + f'<label for="ee-sistem">{"Blotter hangi sistemden geliyor?" if tr else "Which system does your blotter come from?"}<input type="text" id="ee-sistem" name="sistem" maxlength="300" placeholder="{"ör. 360T, Murex, Excel" if tr else "e.g. 360T, Murex, Excel"}" data-soru></label>')
    gizlilik = "/tr/privacy#collect-why" if tr else "/privacy#collect-why"
    tamam = ("Talebiniz alındı. Demo için e-posta ile yazacağız." if tr else "Thanks. We will email you to arrange a demo.")
    return f'''
<dialog id="erken-erisim" aria-labelledby="ee-baslik" data-tamam="{tamam}">
  <h2 id="ee-baslik">{"Demo iste" if tr else "Request a demo"}</h2>
  <p>{"Demo ücretsizdir ve sentetik ya da anonimleştirilmiş bir blotter üzerinde yapılır. Gerçek müşteri verisi göndermeyin." if tr else "The demo is free and runs on a synthetic or anonymized blotter. Do not send real client data."}</p>
  <form novalidate>
    <div class="alanlar">
      <label for="ee-eposta">{"İş e-postası" if tr else "Work email"}<input type="email" id="ee-eposta" name="eposta" required autocomplete="email" maxlength="254"></label>
      {sorular}
    </div>
    <div class="gizli-alan" aria-hidden="true"><label>Web<input type="text" name="web" tabindex="-1" autocomplete="off"></label></div>
    <label class="onay" for="ee-onay"><input type="checkbox" id="ee-onay" name="onay" value="evet" required> <span>{"Kalibre Markets'in demo ve ürün güncellemeleri hakkında bana e-posta göndermesini kabul ediyorum. İstediğim zaman listeden çıkabilirim." if tr else "I agree to receive emails from Kalibre Markets about the demo and product updates. I can unsubscribe at any time."}</span></label>
    <p class="not">{f'E-postanızı, cevaplarınızı ve talep zamanını saklarız. Ayrıntılar <a href="{gizlilik}">gizlilik politikasında</a>.' if tr else f'We store your email, your answers and the time of your request. Details are in the <a href="{gizlilik}">privacy policy</a>.'}</p>
    <div class="kapat-satir">
      <button type="button" class="dugme ikincil" data-kapat>{"Kapat" if tr else "Close"}</button>
      <button type="submit" class="dugme">{"Demo iste" if tr else "Request a demo"}</button>
    </div>
  </form>
  <p class="talep-mesaj" data-mesaj hidden aria-live="polite"></p>
  <div class="kapat-satir" data-sonra hidden><button type="button" class="dugme ikincil" data-kapat>{"Kapat" if tr else "Close"}</button></div>
</dialog>'''

def hazine(dil):
    tr = dil == "tr"
    if tr:
        govde = f'''<div data-talep-sayfa="treasury">
<div class="p-belge-hero"><h1>FX Blotter Analytics {durum_et("beta", dil)}</h1></div>
<p class="giris">Masanın zaten tuttuğu FX blotter'ını analiz et. Dışa aktarımı olduğu gibi bırak. Kalibre sütunları tanır, deal'leri pozisyonlara eşler ve defterin nerede kazanıp kaybettiğini gösterir.</p>
<div class="p-eylem"><a class="dugme" href="#demo" data-erken-erisim>Demo iste</a><a class="dugme ikincil" href="/lab/blotter?lang=tr&amp;file=samples/fx-blotter-ornek.xlsx">Örnek Excel blotter ile dene</a><a class="metin-bag" href="/tr/demo#fx-blotter">Örnek girdi ve sonuç dosyaları</a></div>
<div class="kutu">İlk sürüm çalışıyor. Örnek Excel blotter'ı açıp sonucu görebilir, girdi ve sonuç dosyalarını demo sayfasından indirebilirsin. Kendi blotter'larıyla deneyecek az sayıda masa arıyoruz. Fırsat maliyeti henüz gösterilmiyor; tanımı masalarla netleşince eklenecek.</div>

<h2 id="reads">Neyi okur</h2>
<p>Hedef, dışa aktarımı yeniden biçimlendirmeden okumak:</p>
<ul>
  <li>360T, FXall, Bloomberg FXGO ve Murex gibi sistemlerin CSV ve Excel dışa aktarımları</li>
  <li>Elle tutulan Excel blotter'ları: Türkçe, İngilizce, Almanca ve Fransızca başlıklar</li>
  <li>Spot, outright forward, swap bacakları ve NDF. Opsiyonlar tanınır ve dışarıda bırakılır.</li>
</ul>
<p class="p-baslik-ornek">İşlem Tarihi · Valör · Döviz Cinsi · Alış/Satış · Tutar · Kur · Karşı Taraf · Portföy</p>

<h2 id="detect">Sütunlar nasıl tanınır</h2>
<div class="p-sutun2">
  <div><h3>Başlık ve değer</h3><p>Başlıklar İngilizce ve Türkçe eşanlamlılarla, değerler desenleriyle eşleştirilir: parite, tarih, tutar, kur. "Alınan döviz ve tutar, satılan döviz ve tutar" düzeninde kur iki tutarın oranından çıkarılır.</p></div>
  <div><h3>Siz onaylarsınız</h3><p>İçe aktarmadan önce bulunan eşleşmeler gösterilir, örneğin "İşlem tarihi = C sütunu". Blotter'lar yönü genelde bankanın bakışından kaydeder; varsayılan budur ve tek bir seçimle değiştirilebilir. Kurlar all-in, valörler tarih olarak okunur. Okunamayan satırlar nedeniyle listelenir.</p></div>
</div>

<h2 id="see">Ne görürsünüz</h2>
<p>Bir hazine masasının günü nasıl okuduğuna göre kurgulandı:</p>
<ul>
  <li>Günün kâr/zararı: günün değerlemesi (MTM) artı gerçekleşen kâr/zarar. Gerçekleşen kâr/zarar valör tarihinde tanınır.</li>
  <li>Spot kâr/zararı ve swap puanı kâr/zararı ayrı satırlarda</li>
  <li>Taşıma maliyeti gecelik swap olarak</li>
  <li>Müşteri marjı, blotter'daki maliyet sütunundan</li>
  <li>Gün içi net açık pozisyon (NOP), para birimi bazında ve valör merdiveninde</li>
  <li>Tutarlar önce USD karşılığı, sonra yerel para birimi olarak</li>
  <li>Her rakamdan tek tıkla ilgili deal'lere inme</li>
</ul>
<p>Değerleme ve karşılık tutarlar için gün sonu ya da gün içi kur dosyasını siz sağlarsınız. Piyasa verisi lisansımız yok.</p>

<h2 id="standard">Ölçüt</h2>
<p>Bir hazine müdürünün güvendiği şey hızlı ve hiç yanılmayan bir tablodur. İlk sürümün kabul ölçütü budur: her toplam deal satırlarına kadar izlenebilir, 12 elle hesaplanmış vaka birebir tutuyor ve her dosyada 7 kontrollü bir mutabakat paneli çalışıyor.</p>

<h2 id="data">Veri nasıl işlenir</h2>
<ul>
  <li>Dosya tarayıcınızda okunur ve sunucumuza yüklenmez.</li>
  <li>Karşı taraf adları varsayılan olarak alınmaz. İşlem numaraları yalnız eşleştirme için kullanılır.</li>
  <li>Demo sentetik ya da anonimleştirilmiş veriyle yapılır. Gerçek müşteri verisi göndermeyin.</li>
</ul>

<div class="demo-kutu" id="demo">
  <h2>Demo iste</h2>
  <p>Kurum türünüzü, masa büyüklüğünü ve blotter'ın geldiği sistemi yazın. Uygun bir zaman için e-posta ile döneriz.</p>
  <a class="dugme" href="#demo" data-erken-erisim>Demo iste</a>
</div>
{demo_pencere(dil)}
</div>'''
        sayfa("tr/treasury/index.html", "FX Blotter Analytics: hazine ve dealing masaları için (beta)", "Masanın kendi FX blotter'ını olduğu gibi okur: FIFO ile gerçekleşen kâr/zarar, fiyat ve swap puanı ayrı, taşıma, MTM, valör merdiveni ve müşteri marjı. Örnek Excel blotter ile dene ya da demo iste.", "/tr/treasury", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=FORM_STIL, ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css"><script src="/static/talep.js" defer></script>', dil="tr")
    else:
        govde = f'''<div data-talep-sayfa="treasury">
<div class="p-belge-hero"><h1>FX Blotter Analytics {durum_et("beta", dil)}</h1></div>
<p class="giris">Analyze the FX blotter your desk already keeps. Drop in the export as it is. Kalibre detects the columns, matches deals into positions and shows where the book made and lost money.</p>
<div class="p-eylem"><a class="dugme" href="#demo" data-erken-erisim>Request a demo</a><a class="dugme ikincil" href="/lab/blotter?file=samples/fx-blotter-sample.xlsx">Try it with a sample Excel blotter</a><a class="metin-bag" href="/demo#fx-blotter">Sample input and result files</a></div>
<div class="kutu">The first version works. Open the sample Excel blotter to see the result, or download the input and result files from the demo page. We are looking for a small number of desks to try it on their own blotters. Opportunity cost is not shown yet; it will be added once its definition is agreed with desks.</div>

<h2 id="reads">What it reads</h2>
<p>The goal is to read the export without reformatting it:</p>
<ul>
  <li>CSV and Excel exports from systems such as 360T, FXall, Bloomberg FXGO and Murex</li>
  <li>Excel blotters kept by hand, with English, Turkish, German or French headers</li>
  <li>Spot, outright forwards, swap legs and NDFs. Options are detected and left out.</li>
</ul>
<p class="p-baslik-ornek">Trade Date · Value Date · Currency Pair · Buy/Sell · Notional · Rate · Counterparty · Book</p>

<h2 id="detect">How columns are detected</h2>
<div class="p-sutun2">
  <div><h3>Headers and values</h3><p>Headers are matched against English and Turkish synonyms, and values by their patterns: pairs, dates, amounts and rates. In a "bought currency and amount, sold currency and amount" layout, the rate is derived from the two amounts.</p></div>
  <div><h3>You confirm</h3><p>Before import, Kalibre shows what it found, for example "Trade date = column C". Blotters usually record the side from the bank's view; that is the default, and one choice switches it. Rates are read as all-in rates and value dates as dates. Rows that cannot be read are listed with a reason.</p></div>
</div>

<h2 id="see">What you see</h2>
<p>Built around how a treasury desk reads its day:</p>
<ul>
  <li>Daily P&amp;L: the day's mark-to-market plus realized P&amp;L. Realized P&amp;L is recognized on the value date.</li>
  <li>Spot P&amp;L and swap-points P&amp;L on separate lines</li>
  <li>Carry cost shown as overnight swap</li>
  <li>Client margin from the blotter's cost column</li>
  <li>Intraday net open position (NOP) by currency and on a value-date ladder</li>
  <li>Amounts in USD equivalent first, then in local currency</li>
  <li>One-click drill-down from any figure to the deals behind it</li>
</ul>
<p>For marking and currency equivalents you supply an end-of-day or intraday rates file. We have no market data licence.</p>

<h2 id="standard">The standard</h2>
<p>What a head of treasury trusts is a fast table that is never wrong. That is the acceptance bar for the first version: every total traces back to deal rows, 12 hand-computed cases match exactly, and a reconciliation panel with 7 checks runs on every file.</p>

<h2 id="data">How data is handled</h2>
<ul>
  <li>The file is read in your browser and is not uploaded to our servers.</li>
  <li>Counterparty names are dropped by default. Deal IDs are used only to match legs and positions.</li>
  <li>Demos run on synthetic or anonymized data. Do not send real client data.</li>
</ul>

<div class="demo-kutu" id="demo">
  <h2>Request a demo</h2>
  <p>Tell us your organization type, desk size and the system your blotter comes from. We will reply by email to find a time.</p>
  <a class="dugme" href="#demo" data-erken-erisim>Request a demo</a>
</div>
{demo_pencere(dil)}
</div>'''
        sayfa("treasury/index.html", "FX Blotter Analytics for treasury and dealing desks (beta)", "Reads your desk's own FX blotter as it is: realized P&L with FIFO, price and swap points apart, carry, MTM, a value-date ladder and client margin. Try it with a sample Excel blotter or request a demo.", "/treasury", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=FORM_STIL, ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css"><script src="/static/talep.js" defer></script>', dil="en")

# ------------------------------------------------------------------ /company
# Şirket sayfası: ana sayfa gibi tam genişlik (pitch.css), belge düzeni değil.
# Ürün ya da özellik listesi yok (o iş Products ve Solutions menüsünde). Misyon, sorun, kiminle çalıştığımız,
# ilkeler, kurumlarla çalışma biçimi ve iletişim. Rakamlar yalnız doğrulama raporlarından (ana sayfadaki sayilar ile aynı).
# Uydurma bilgi yok: isim, ekip büyüklüğü, ofis, yatırım, müşteri, tarih yazılmaz.
S = {
 "en": dict(
  title="Company: Kalibre Markets",
  desc="Kalibre Markets builds analytics software for trading data, for treasury and dealing desks, brokers, prop firms and traders. Founded by a former bank treasurer and economist.",
  ust="Company",
  h1="Make trading data explainable.",
  giris="Kalibre Markets builds analytics software for trading data. We want every desk, firm and trader to see where a result came from, and to be able to show it.",
  kunye=[("Origin", "Founded by a former bank treasurer and economist"), ("Stage", "Early stage and independent. Products in beta."), ("Model", "Software only. No advice, no client funds.")],
  neden_bas="Why trading data needs an analytics layer",
  neden_giris="Every trade is recorded somewhere. Yet simple questions about those records still take a day of spreadsheet work.",
  sorunlar=[("Blotters live in spreadsheets", "A dealing desk keeps its deals in an Excel blotter exported from another system. Reports are rebuilt by hand, and every rebuild can break."),
            ("P&amp;L that cannot be traced", "A daily figure gets reported, but the split between spot, swap points and carry is hard to show. When someone questions a number, finding the deals behind it is slow."),
            ("Limits checked by hand", "Position and loss limits are often checked after the fact, by someone reading a sheet. A breach can be found late.")],
  katman=(("Trade records", ["Blotters", "Platform reports", "Trade logs"]),
          ("Analytics layer", ["One trade model", "Checked against a reference"]),
          ("Decisions", ["P&amp;L traced to deals", "Limits watched", "Rules tested"])),
  katman_not="We sit between the trade record and the decision. We do not sit between a client and the market.",
  kim_bas="Who we work with",
  kim_giris="We start with traders, because they can test software on their own history today. Our long-term work is with institutions.",
  kimler=[("Where we start", "Active and prop traders", "People who trade their own or a funded account and want to know which habits cost them money. They are the first to test our engine, on their own files."),
          ("Where we grow", "Brokers and prop firms", "Firms that run many accounts and need the same rules applied to each one. They need analytics and rule monitoring per account, not one trader at a time."),
          ("Where we are going", "Bank and corporate treasury desks", "Desks that run FX positions and report P&amp;L to a treasurer and a risk team. They need numbers that trace back to each deal.")],
  ilke_bas="What we believe",
  ilke_giris="Four principles decide what we build and what we leave out.",
  ilkeler=[("Check the number before you show it", "Our engine is compared trade by trade against the MetaTrader 5 Strategy Tester. A separate reference implementation, written without access to the engine code, recomputes the same rules. Neither check left an unexplained difference.", "/methodology", "Read the methodology"),
           ("Data stays on your side", "Files are processed in your browser and are not uploaded. Live MT5 data is encrypted end to end with AES-256, and the relay deletes it within 2 hours. We never ask for a password.", "/security", "Read the security details"),
           ("Software, not a broker", "We do not give investment advice or trading signals. We do not hold client funds, and our servers do not send orders.", "", ""),
           ("Say what is ready", "Every product carries a status label: Beta, In testing, In development or Planned. We do not publish performance claims.", "", "")],
  sayilar=[("97", "MT5 Strategy Tester runs"), ("44,015", "MT5 trades compared"), ("87,315", "trades recomputed"), ("0", "unexplained differences")],
  kurum_bas="How we work with institutions",
  kurum_giris="A desk should be able to judge the software before any client data leaves the building. Our pilots are designed around that.",
  kurum=[("Start on sample or anonymized data", "We begin with our sample files or an anonymized export of your own. No real client data is needed to judge the fit."),
         ("Your data stays with you", "Files are read in the browser on your own machine. We do not receive or store your blotter."),
         ("Bring your own rate files", "Valuation uses the rates you already have. We do not supply market data, so there is no new market data licence to sign."),
         ("Talk to the founder", "Questions and requests go to the founder, not a sales team. What we learn in a pilot shapes what we build next.")],
  son_bas="Talk to us about your desk or firm",
  son_giris="We are looking for treasury desks, brokers and prop firms to run early pilots with. Tell us your role and the system your data comes from.",
  b1="Propose a pilot", b1_konu="Kalibre%20pilot",
  b2="Email markets@kalibrefin.com",
 ),
 "tr": dict(
  title="Şirket: Kalibre Markets",
  desc="Kalibre Markets alım satım verisi için analiz yazılımı geliştiriyor: hazine ve dealing masaları, aracı kurumlar, prop firmaları ve trader'lar için. Kurucusu eski bir banka hazinecisi ve ekonomist.",
  ust="Şirket",
  h1="Alım satım verisini açıklanabilir kılmak.",
  giris="Kalibre Markets alım satım verisi için analiz yazılımı geliştiriyor. Her masanın, firmanın ve trader'ın bir sonucun nereden geldiğini görmesini ve bunu gösterebilmesini istiyoruz.",
  kunye=[("Köken", "Kurucusu eski bir banka hazinecisi ve ekonomist"), ("Aşama", "Erken aşama ve bağımsız. Ürünler beta aşamasında."), ("Model", "Yalnız yazılım. Tavsiye yok, müşteri parası yok.")],
  neden_bas="Alım satım verisinin neden bir analiz katmanına ihtiyacı var",
  neden_giris="Her işlem bir yerde kayıtlı. Yine de bu kayıtlarla ilgili basit sorular hâlâ bir günlük tablo işi gerektiriyor.",
  sorunlar=[("Blotter'lar tablolarda yaşıyor", "Bir dealing masası deal'lerini başka bir sistemden dışa aktarılmış bir Excel blotter'ında tutar. Raporlar elle yeniden kurulur ve her yeniden kurulum bozulabilir."),
            ("İzi sürülemeyen kâr/zarar", "Günlük bir rakam raporlanır ama spot, swap puanı ve taşıma maliyeti ayrımını göstermek zordur. Bir rakam sorgulandığında arkasındaki deal'leri bulmak yavaştır."),
            ("Elle denetlenen sınırlar", "Pozisyon ve kayıp sınırları çoğu zaman sonradan, bir tabloyu okuyan biri tarafından denetlenir. Bir ihlal geç fark edilebilir.")],
  katman=(("İşlem kayıtları", ["Blotter'lar", "Platform raporları", "İşlem kayıtları"]),
          ("Analiz katmanı", ["Tek bir işlem modeli", "Bir referansa karşı sınanmış"]),
          ("Kararlar", ["Deal'e kadar izlenen kâr/zarar", "İzlenen sınırlar", "Sınanan kurallar"])),
  katman_not="İşlem kaydı ile karar arasında dururuz. Müşteri ile piyasa arasında durmayız.",
  kim_bas="Kimlerle çalışıyoruz",
  kim_giris="Trader'larla başlıyoruz, çünkü yazılımı bugün kendi geçmişlerinde sınayabilirler. Uzun vadeli işimiz kurumlarla.",
  kimler=[("Başladığımız yer", "Aktif ve prop trader'lar", "Kendi hesabıyla ya da fonlanmış bir hesapla işlem yapan ve hangi alışkanlıklarının para kaybettirdiğini bilmek isteyen kişiler. Motorumuzu kendi dosyalarında ilk onlar sınar."),
          ("Büyüdüğümüz yer", "Aracı kurumlar ve prop firmaları", "Çok sayıda hesap yöneten ve aynı kuralları her birine uygulaması gereken firmalar. Tek tek trader değil, hesap bazında analiz ve kural izleme gerekir."),
          ("Gittiğimiz yer", "Banka ve şirket hazine masaları", "FX pozisyonu yöneten ve kâr/zararı hazine yöneticisine ve risk ekibine raporlayan masalar. Her deal'e kadar izlenebilen rakamlara ihtiyaç duyarlar.")],
  ilke_bas="Neye inanıyoruz",
  ilke_giris="Neyi geliştirip neyi dışarıda bırakacağımıza dört ilke karar verir.",
  ilkeler=[("Sayıyı göstermeden önce sına", "Motorumuz MetaTrader 5 Strategy Tester'a karşı işlem işlem karşılaştırılır. Motor koduna bakılmadan yazılmış ayrı bir referans uygulaması aynı kuralları yeniden hesaplar. İki denetimde de açıklanamayan fark kalmadı.", "/tr/methodology", "Metodolojiyi oku"),
           ("Veri kullanıcının tarafında kalır", "Dosyalar tarayıcıda işlenir ve yüklenmez. Canlı MT5 verisi AES-256 ile uçtan uca şifrelenir ve röle onu 2 saat içinde siler. Hiçbir zaman şifre istemeyiz.", "/tr/security", "Güvenlik ayrıntılarını oku"),
           ("Aracı kurum değil, yazılım", "Yatırım tavsiyesi ya da işlem sinyali vermeyiz. Müşteri parası tutmayız ve sunucularımız emir göndermez.", "", ""),
           ("Neyin hazır olduğunu söyle", "Her ürün bir durum etiketi taşır: Beta, Testte, Geliştiriliyor ya da Planlanıyor. Performans iddiası yayımlamayız.", "", "")],
  sayilar=[("97", "MT5 Strategy Tester koşusu"), ("44.015", "karşılaştırılan MT5 işlemi"), ("87.315", "yeniden hesaplanan işlem"), ("0", "açıklanamayan fark")],
  kurum_bas="Kurumlarla nasıl çalışıyoruz",
  kurum_giris="Bir masa, binadan tek bir müşteri verisi çıkmadan yazılımı değerlendirebilmeli. Pilotlarımızı buna göre kurarız.",
  kurum=[("Örnek ya da anonim veriyle başlayın", "Örnek dosyalarımızla ya da sizin anonimleştirilmiş bir dışa aktarımınızla başlarız. Uygunluğu görmek için gerçek müşteri verisi gerekmez."),
         ("Veriniz sizde kalır", "Dosyalar kendi bilgisayarınızda, tarayıcıda okunur. Blotter'ınızı almayız ve saklamayız."),
         ("Kendi kur dosyanızı getirin", "Değerleme zaten elinizdeki kurlarla yapılır. Piyasa verisi sağlamadığımız için yeni bir piyasa verisi lisansı imzalamanız gerekmez."),
         ("Kurucuyla konuşun", "Sorular ve talepler bir satış ekibine değil, kurucuya gider. Pilotta öğrendiğimiz şey sıradaki geliştirmeyi belirler.")],
  son_bas="Masanız ya da firmanız için bizimle konuşun",
  son_giris="Erken pilotlar için hazine masaları, aracı kurumlar ve prop firmaları arıyoruz. Görevinizi ve verinizin geldiği sistemi yazın.",
  b1="Pilot önerin", b1_konu="Kalibre%20pilot",
  b2="markets@kalibrefin.com adresine yazın",
 ),
}

def sirket_govde(dil):
    t = S[dil]
    kunye = "".join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in t["kunye"])
    sorun = "".join(f'<li><span class="no">0{i}</span><h3>{b}</h3><p>{a}</p></li>' for i, (b, a) in enumerate(t["sorunlar"], 1))
    katman = ""
    for i, (b, og) in enumerate(t["katman"]):
        katman += (f'<div class="s-katman-sutun{" orta" if i == 1 else ""}"><p class="s-katman-bas">{b}</p>'
                   + "".join(f'<span>{o}</span>' for o in og) + '</div>')
        if i < 2:
            katman += '<div class="s-ok" aria-hidden="true"></div>'
    kim = "".join(f'<article class="s-kim"><span class="s-asama"><i></i>{e}</span><h3>{b}</h3><p>{a}</p></article>' for e, b, a in t["kimler"])
    sayilar = "".join(f'<div><b>{s}</b><span>{a}</span></div>' for s, a in t["sayilar"])
    ilke = ""
    for i, (b, a, h, e) in enumerate(t["ilkeler"], 1):
        ek = f'<div class="s-sayilar">{sayilar}</div>' if i == 1 else ""
        bag = f' <a href="{h}">{e}</a>' if h else ""
        ilke += f'<li><div class="s-ilke-bas"><span class="no">0{i}</span><h3>{b}</h3></div><div><p>{a}{bag}</p>{ek}</div></li>'
    kurum = "".join(f'<div class="p-adim"><span class="no">0{i}</span><h3>{b}</h3><p>{a}</p></div>' for i, (b, a) in enumerate(t["kurum"], 1))
    return f'''<main class="s-sayfa">
<section class="p-hero p-ust-bosluk s-hero" aria-labelledby="s-h1">
  <div class="kap">
    <p class="p-is">{t["ust"]}</p>
    <h1 id="s-h1">{t["h1"]}</h1>
    <p class="giris">{t["giris"]}</p>
    <dl class="s-kunye">{kunye}</dl>
  </div>
</section>

<section class="bolum" id="why" aria-labelledby="neden-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="neden-bas">{t["neden_bas"]}</h2><p>{t["neden_giris"]}</p></div>
    <ol class="s-sorunlar">{sorun}</ol>
    <figure class="s-katman">
      <div class="s-katman-akis">{katman}</div>
      <figcaption>{t["katman_not"]}</figcaption>
    </figure>
  </div>
</section>

<section class="bolum" id="who" aria-labelledby="kim-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="kim-bas">{t["kim_bas"]}</h2><p>{t["kim_giris"]}</p></div>
    <div class="s-kimler">{kim}</div>
  </div>
</section>

<section class="bolum" id="principles" aria-labelledby="ilke-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="ilke-bas">{t["ilke_bas"]}</h2><p>{t["ilke_giris"]}</p></div>
    <ol class="s-ilkeler">{ilke}</ol>
  </div>
</section>

<section class="p-kagit s-kurum" id="partners" aria-labelledby="kurum-bas">
  <div class="kap">
    <div class="bolum-bas"><h2 id="kurum-bas">{t["kurum_bas"]}</h2><p>{t["kurum_giris"]}</p></div>
    <div class="p-adimlar s-kurum-adim">{kurum}</div>
  </div>
</section>

<section class="bolum p-son" id="contact" aria-labelledby="son-bas" style="border-top:0">
  <div class="kap">
    <h2 id="son-bas">{t["son_bas"]}</h2>
    <p class="giris">{t["son_giris"]}</p>
    <div class="p-eylem">
      <a class="dugme" href="mailto:markets@kalibrefin.com?subject={t["b1_konu"]}">{t["b1"]}</a>
      <a class="dugme ikincil" href="mailto:markets@kalibrefin.com">{t["b2"]}</a>
    </div>
  </div>
</section>
</main>'''

def sirket(dil):
    t = S[dil]
    yol = "/tr/company" if dil == "tr" else "/company"
    diger = "/company" if dil == "tr" else "/tr/company"
    kanon = "https://kalibremarkets.com" + yol
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
<link rel="alternate" hreflang="en" href="https://kalibremarkets.com/company">
<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com/tr/company">
<link rel="alternate" hreflang="x-default" href="https://kalibremarkets.com/company">
<meta property="og:title" content="{t["title"]}">
<meta property="og:description" content="{t["desc"]}">
<meta property="og:url" content="{kanon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kalibre Markets">
<meta property="og:locale" content="{"en_US" if dil == "en" else "tr_TR"}">
<meta property="og:image" content="https://kalibremarkets.com/og-default.png">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Organization","name":"Kalibre Markets","url":"https://kalibremarkets.com","email":"markets@kalibrefin.com"}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/site.css">
<link rel="stylesheet" href="/static/ana/pitch.css">
<script src="/static/kalibre-cerez.js"></script>
<script src="/static/beta.js" defer></script>
{yol_etiketleri(dil)}<script src="/static/kalibre-auth.js" defer></script>
</head>
<body>

{ust(yol, dil, diger)}

{sirket_govde(dil)}

{ALT_EN if dil == "en" else ALT}
</body>
</html>
'''
    assert "—" not in html and "–" not in html, dil + ": uzun tire"
    assert "!" not in re.sub(r"<!doctype html>|<!--.*?-->", "", sirket_govde(dil)), dil + ": ünlem"
    hedef = os.path.join(KOK, yol.lstrip("/"), "index.html")
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    open(hedef, "w").write(egik_cizgisiz(html))
    print("yazıldı", os.path.relpath(hedef, KOK))

# ------------------------------------------------------------------ /demo
# Her ürün için örnek girdi, tek tıkla sonuç ve indirilebilir sonuç dosyası. Rakamlar elle yazılmaz:
# kalibre-lab araclar/ornek-dosya-uret.mjs'in ürettiği lab/samples/summary.json'dan okunur.
DEMO_STIL = """
.d-urun { border: 1px solid var(--cizgi-2); border-radius: 6px; padding: 22px 24px; margin: 22px 0 30px; background: var(--zemin-2); }
.d-urun h2 { margin-top: 0; }
.d-adimlar { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 18px 0; }
.d-adimlar > div { border: 1px solid var(--cizgi-2); border-radius: 4px; padding: 14px 16px; }
.d-adimlar b.no { display: block; font: 500 12px var(--mono, monospace); letter-spacing: .06em; color: var(--soluk, #8a97a8); margin-bottom: 6px; }
.d-adimlar a { display: block; margin-top: 6px; overflow-wrap: anywhere; }
.d-adimlar a.dugme { display: inline-flex; align-items: center; justify-content: center; width: auto; margin-top: 2px; }
.d-adimlar small { display: block; color: var(--soluk, #8a97a8); }
.d-sayilar { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 14px 0 6px; }
.d-sayilar div { border-top: 1px solid var(--cizgi-2); padding-top: 8px; }
.d-sayilar b { display: block; font: 600 20px var(--serif); }
.d-sayilar span { font-size: 13px; color: var(--soluk, #8a97a8); }
@media (max-width: 760px) { .d-adimlar, .d-sayilar { grid-template-columns: 1fr 1fr; } .d-adimlar { grid-template-columns: 1fr; } }
.d-bakis { margin: 18px 0 6px; }
.d-bakis > b { display: block; font: 500 12px var(--mono, monospace); letter-spacing: .06em; color: var(--soluk, #8a97a8); margin-bottom: 8px; }
.d-gorseller { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.d-gorseller.tek { grid-template-columns: minmax(0, 640px); }
figure.d-gorsel { margin: 0; border: 1px solid var(--cizgi-2); border-radius: 6px; overflow: hidden; background: #0f1722; }
figure.d-gorsel img { display: block; width: 100%; height: auto; }
figure.d-gorsel figcaption { padding: 8px 12px; font-size: 13px; color: var(--soluk, #8a97a8); border-top: 1px solid var(--cizgi-2); }
@media (max-width: 760px) { .d-gorseller { grid-template-columns: 1fr; } }
"""

def demo(dil):
    import json
    tr = dil == "tr"
    oz = json.load(open(os.path.join(KOK, "lab", "samples", "summary.json")))
    b, a, lab = oz["fxBlotter_tr" if tr else "fxBlotter_en"], oz["tradeAnalytics_tr" if tr else "tradeAnalytics_en"], oz["kalibreLab"]
    def say(x, k=0):
        m = f"{abs(x):,.{k}f}"
        if tr: m = m.replace(",", "X").replace(".", ",").replace("X", ".")
        return ("−" if x < 0 else "") + m
    isaret = lambda x, k=0: ("+" if x > 0 else "") + say(x, k)
    yuzde = lambda x, k=1: (f"%{say(x, k)}" if tr else f"{say(x, k)}%")
    q = "lang=tr&amp;" if tr else ""
    ind = "İndir" if tr else "Download"
    def adimlar(girdi, ac, cikti):
        return ('<div class="d-adimlar">'
                f'<div><b class="no">1 · {"GİRDİ" if tr else "INPUT"}</b>{girdi}</div>'
                f'<div><b class="no">2 · {"ÜRÜNDE AÇ" if tr else "OPEN IN THE PRODUCT"}</b>{ac}</div>'
                f'<div><b class="no">3 · {"SONUÇ DOSYASI" if tr else "RESULT FILE"}</b>{cikti}</div></div>')
    def dosya(yol, ad, not_=""):
        return f'<a href="{yol}" download>{ad}</a>' + (f"<small>{not_}</small>" if not_ else "")
    import struct
    def gorsel(ad, alt):
        ek = "-tr" if tr else ""
        yol = os.path.join(KOK, "static", "urun", "demo", f"{ad}{ek}.png")
        w, h = struct.unpack(">II", open(yol, "rb").read()[16:24])
        kok = f"/static/urun/demo/{ad}{ek}"
        return (f'<figure class="d-gorsel"><picture><source type="image/webp" srcset="{kok}-1x.webp {w // 2}w, {kok}-2x.webp {w}w" sizes="(max-width: 760px) 100vw, 560px">'
                f'<img src="{kok}.png" width="{w}" height="{h}" alt="{alt}" loading="lazy" decoding="async"></picture><figcaption>{alt}</figcaption></figure>')
    def bakis(*figurler):
        etiket = "SONUÇ, BİR BAKIŞTA · büyütmek için tıkla" if tr else "THE RESULT AT A GLANCE · click to enlarge"
        return f'<div class="d-bakis"><b>{etiket}</b><div class="d-gorseller{" tek" if len(figurler) == 1 else ""}">{"".join(figurler)}</div></div>'
    def sayilar(liste):
        return '<div class="d-sayilar">' + "".join(f"<div><b>{d}</b><span>{e}</span></div>" for d, e in liste) + "</div>"

    blotter_girdi = ("fx-blotter-ornek", "fx-blotter-sample") if tr else ("fx-blotter-sample", "fx-blotter-ornek")
    blotter_sonuc = "fx-blotter-ornek-sonuc" if tr else "fx-blotter-sample-result"
    analiz_sonuc = "trade-analytics-ornek-sonuc" if tr else "trade-analytics-sample-result"
    def toc(govde):
        return "".join(f'<a href="#{i}">{re.sub(r"<span.*?</span>", "", n).strip()}</a>' for i, n in re.findall(r'<section class="d-urun" id="([^"]+)"><h2>(.*?)</h2>', govde))
    if tr:
        govde = f"""<div class="p-belge-hero"><h1>Demolar</h1></div>
<p class="giris">Her ürün, örnek bir girdi dosyası ve ürettiği sonuçla. Sonucu ürünün içinde tek tıkla aç ya da girdi dosyasını indirip kendin bırak ve sonuç dosyasıyla karşılaştır.</p>
<div class="kutu">Aşağıdaki rakamlar sayfaların kullandığı motorla hesaplandı ve sonuç dosyalarındakiyle aynıdır. Dosyalar tarayıcında okunur, hiçbir yere yüklenmez.</div>

<section class="d-urun" id="trade-analytics"><h2>Trade Analytics {durum_et("beta", dil)}</h2>
<p>Bir işlem kaydının nerede kazandırıp kaybettirdiğini gösterir. Örnek: Kalibre şablonunda {say(a["trades"])} kapanmış işlemli örnek bir hesap.</p>
{adimlar(dosya("/lab/templates/kalibre-trade-log-example.xlsx", "kalibre-trade-log-example.xlsx", "Excel, işlem kaydı") + dosya("/lab/templates/kalibre-trade-log-example.csv", "CSV sürümü"),
         f'<a class="dugme kucuk" href="/lab/analytics?{q}file=templates/kalibre-trade-log-example.xlsx">Sonucu aç</a><small>Aynı dosya Trade Analytics&#39;te açılır.</small>',
         dosya(f"/lab/samples/{analiz_sonuc}.xlsx", f"{analiz_sonuc}.xlsx", "Özet, kaybettiren ve kazandıran dilimler, 8 kırılım, günlük prop sınırları"))}
{sayilar([(say(a["trades"]), "kapanmış işlem"), (isaret(a["netUsd"], 2) + " USD", "net kâr/zarar"), (yuzde(a["winRatePct"]), "kazanma oranı"), (say(a["profitFactor"], 2), "kâr faktörü")])}
{bakis(gorsel("analytics-overview", "Hesap özeti: net K/Z, kazanma oranı, kâr faktörü, düşüş ve bakiye eğrisi"), gorsel("analytics-segments", "Kaybettiren ve kazandıran dilimler, her biri en az 20 işlem"))}
<p>Prop sınırları ({a["propRuleSet"]} ön ayarı): {say(a["days"])} günün {say(a["propBreachDays"])} gününde sınır aşıldı. Kendi dosyan için: MT5 geçmiş raporu (HTML ya da XLSX), CSV ya da Excel kaydı. <a href="/lab/templates/kalibre-trade-log-template.xlsx" download>Boş şablon</a> · <a href="/tr/mt5-analytics">Ürün sayfası</a></p>
</section>

<section class="d-urun" id="fx-blotter"><h2>FX Blotter Analytics {durum_et("beta", dil)}</h2>
<p>Masanın FX blotter'ını dışa aktarıldığı haliyle okur. Örnek: bir banka FX masasının bir haftalık Excel dökümü; rapor başlığı satırları, toplam satırı, bir opsiyon ve düzeltilmiş bir işlem dahil.</p>
{adimlar(dosya(f"/lab/samples/{blotter_girdi[0]}.xlsx", f"{blotter_girdi[0]}.xlsx", "Excel, Türkçe başlık ve sayı biçimi") + dosya(f"/lab/samples/{blotter_girdi[0]}.csv", "CSV sürümü") + dosya(f"/lab/samples/{blotter_girdi[1]}.xlsx", "İngilizce başlıklı sürüm"),
         f'<a class="dugme kucuk" href="/lab/blotter?{q}file=samples/{blotter_girdi[0]}.xlsx">Sonucu aç</a><small>Kur, faiz ve limit tablolarına örnek değerler girilir.</small>',
         dosya(f"/lab/samples/{blotter_sonuc}.xlsx", f"{blotter_sonuc}.xlsx", "Özet, parite, portföy, trader ve kalem türüne göre K/Z, pozisyon, valör merdiveni, limitler, mutabakat, dışlanan satırlar"))}
{sayilar([(say(b["legs"]), "bacak aktarıldı"), (isaret(b["totalUsd"]) + " USD", "toplam K/Z"), (isaret(b["priceUsd"]) + " USD", "fiyat (spot) K/Z"), (f'{b["checksPassed"]}/{b["checks"]}', "mutabakat kontrolü geçti")])}
{bakis(gorsel("blotter-summary", "Özet: toplam K/Z fiyat, puan, taşıma ve MTM olarak ayrılmış"), gorsel("blotter-reconciliation", "Mutabakat paneli: her dosyada çalışan 7 kontrol"))}
<p>Toplamın geri kalanı: puan ve swap {isaret(b["pointsUsd"])} USD, taşıma {isaret(b["carryUsd"])} USD, açık pozisyon MTM {isaret(b["mtmUsd"])} USD. {say(b["excludedRows"])} satır gerekçesiyle dışlandı: bir opsiyon ve düzeltilmiş işlemin eski satırı. <a href="/tr/treasury">Ürün sayfası</a></p>
</section>

<section class="d-urun" id="lab"><h2>Kalibre Lab {durum_et("beta", dil)}</h2>
<p>Bir kuralı maliyetlerle backtest eder ve her sonuca bir kimlik (resultId) verir. Örnek: kütüphanedeki EMA trend şablonu (risk %1) ve {say(lab["bars"])} H1 mumluk örnek fiyat serisi.</p>
{adimlar(dosya("/lab/samples/kalibre-lab-sample-strategy.json", "kalibre-lab-sample-strategy.json", "Kural dosyası") + dosya("/lab/samples/kalibre-lab-sample-prices.csv", "kalibre-lab-sample-prices.csv", "Fiyat serisi"),
         f'<a class="dugme kucuk" href="/lab?{q}demo=1">Sonucu aç</a><small>Kural ve fiyat dosyası yüklenir, backtest çalışır.</small>',
         dosya("/lab/samples/kalibre-lab-sample-result.xlsx", "kalibre-lab-sample-result.xlsx", "Özet ve işlem listesi") + dosya("/lab/samples/kalibre-lab-sample-result.json", "kalibre-lab-sample-result.json", "Çalıştırma paketi"))}
{sayilar([(say(lab["trades"]), "işlem"), (say(lab["profitFactor"], 2), "kâr faktörü"), (yuzde(lab["returnPct"], 2), "getiri, maliyetsiz"), (yuzde(lab["maxDrawdownPct"], 2), "azami düşüş")])}
{bakis(gorsel("lab-backtest", "Fiyat grafiğinde işlemler, özkaynak eğrisi, sonuç kimliği ve istatistikler"))}
<p>Sonuç kimliği <code>kr1-{lab["resultId"][:16]}</code>: aynı kural, veri ve ayarlar her zaman aynı kimliği verir.</p>
</section>

<section class="d-urun" id="rule-guard"><h2>Rule Guard {durum_et("test", dil)}</h2>
<p>MT5 içinde çalışan bir eklenti olduğu için web demosu yok; demo hesaplarda test ediliyor. Aynı günlük ve toplam kayıp kurallarını örnek işlem kaydında görebilirsin: Trade Analytics sonucunda "Prop sınırları" bölümü. <a href="/lab/analytics?{q}file=templates/kalibre-trade-log-example.xlsx">Örnekte aç</a> · <a href="/tr/rule-guard">Ürün sayfası</a></p>
</section>

<section class="d-urun" id="connections"><h2>Bağlantılar</h2>
<p>Kalibre Bridge MT5 terminali gerektirir: <a href="/tr/setup">kurulum</a>. CSV ve Excel kayıtları için <a href="/lab/templates/kalibre-trade-log-template.xlsx" download>şablon</a>. Alpaca ve Tradier kendi anahtarınla bağlanır: <a href="/lab/connect?lang=tr">bağlantılar</a>.</p>
</section>"""
        sayfa("tr/demo/index.html", "Demolar: her ürün örnek girdi ve sonuç dosyasıyla", "Kalibre Markets ürünlerini örnek dosyalarla dene: Trade Analytics, FX Blotter Analytics ve Kalibre Lab. Girdiyi indir, sonucu tek tıkla aç, sonuç dosyasıyla karşılaştır.", "/tr/demo", govde, toc(govde), ek_stil=DEMO_STIL, ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css">', dil="tr")
    else:
        govde = f"""<div class="p-belge-hero"><h1>Product demos</h1></div>
<p class="giris">Every product with a sample input file and the result it produces. Open the result in the product with one click, or download the input, drop it in yourself and compare with the result file.</p>
<div class="kutu">The figures below are computed by the engine the pages use and match the result files. Files are read in your browser and are not uploaded.</div>

<section class="d-urun" id="trade-analytics"><h2>Trade Analytics {durum_et("beta", dil)}</h2>
<p>Shows where a trade log makes and loses money. Sample: an example account with {say(a["trades"])} closed trades in the Kalibre template.</p>
{adimlar(dosya("/lab/templates/kalibre-trade-log-example.xlsx", "kalibre-trade-log-example.xlsx", "Excel trade log") + dosya("/lab/templates/kalibre-trade-log-example.csv", "CSV version"),
         '<a class="dugme kucuk" href="/lab/analytics?file=templates/kalibre-trade-log-example.xlsx">Open the result</a><small>The same file opens in Trade Analytics.</small>',
         dosya(f"/lab/samples/{analiz_sonuc}.xlsx", f"{analiz_sonuc}.xlsx", "Summary, losing and winning segments, 8 breakdowns, daily prop limits"))}
{sayilar([(say(a["trades"]), "closed trades"), (isaret(a["netUsd"], 2) + " USD", "net P&amp;L"), (yuzde(a["winRatePct"]), "win rate"), (say(a["profitFactor"], 2), "profit factor")])}
{bakis(gorsel("analytics-overview", "Account overview: net P&amp;L, win rate, profit factor, drawdown and the balance curve"), gorsel("analytics-segments", "Losing and winning segments, each with at least 20 trades"))}
<p>Prop limits ({a["propRuleSet"]} preset): a limit was breached on {say(a["propBreachDays"])} of {say(a["days"])} days. For your own file: an MT5 history report (HTML or XLSX), a CSV or an Excel log. <a href="/lab/templates/kalibre-trade-log-template.xlsx" download>Empty template</a> · <a href="/mt5-analytics">Product page</a></p>
</section>

<section class="d-urun" id="fx-blotter"><h2>FX Blotter Analytics {durum_et("beta", dil)}</h2>
<p>Reads a desk's FX blotter as it is exported. Sample: one week of deals from a bank FX desk as an Excel export, with report title rows, a total row, an option and a corrected deal.</p>
{adimlar(dosya(f"/lab/samples/{blotter_girdi[0]}.xlsx", f"{blotter_girdi[0]}.xlsx", "Excel, English headers") + dosya(f"/lab/samples/{blotter_girdi[0]}.csv", "CSV version") + dosya(f"/lab/samples/{blotter_girdi[1]}.xlsx", "Turkish-format version"),
         f'<a class="dugme kucuk" href="/lab/blotter?file=samples/{blotter_girdi[0]}.xlsx">Open the result</a><small>Example rates, overnight rates and limits are filled in.</small>',
         dosya(f"/lab/samples/{blotter_sonuc}.xlsx", f"{blotter_sonuc}.xlsx", "Summary, P&amp;L by pair, book, dealer and item type, positions, value-date ladder, limits, reconciliation, excluded rows"))}
{sayilar([(say(b["legs"]), "legs imported"), (isaret(b["totalUsd"]) + " USD", "total P&amp;L"), (isaret(b["priceUsd"]) + " USD", "price (spot) P&amp;L"), (f'{b["checksPassed"]}/{b["checks"]}', "reconciliation checks passed")])}
{bakis(gorsel("blotter-summary", "Summary: total P&amp;L split into price, points, carry and MTM"), gorsel("blotter-reconciliation", "Reconciliation panel: 7 checks that run on every file"))}
<p>The rest of the total: points and swap {isaret(b["pointsUsd"])} USD, carry {isaret(b["carryUsd"])} USD, MTM of the open position {isaret(b["mtmUsd"])} USD. {say(b["excludedRows"])} rows were excluded with a reason: an option and the earlier line of a corrected deal. <a href="/treasury">Product page</a></p>
</section>

<section class="d-urun" id="lab"><h2>Kalibre Lab {durum_et("beta", dil)}</h2>
<p>Backtests a rule with costs and gives every result an ID (resultId). Sample: the EMA trend template from the library (1% risk) on an example price series of {say(lab["bars"])} H1 candles.</p>
{adimlar(dosya("/lab/samples/kalibre-lab-sample-strategy.json", "kalibre-lab-sample-strategy.json", "Rule file") + dosya("/lab/samples/kalibre-lab-sample-prices.csv", "kalibre-lab-sample-prices.csv", "Price series"),
         '<a class="dugme kucuk" href="/lab?demo=1">Open the result</a><small>The rule and price file are loaded and the backtest runs.</small>',
         dosya("/lab/samples/kalibre-lab-sample-result.xlsx", "kalibre-lab-sample-result.xlsx", "Summary and trade list") + dosya("/lab/samples/kalibre-lab-sample-result.json", "kalibre-lab-sample-result.json", "Run package"))}
{sayilar([(say(lab["trades"]), "trades"), (say(lab["profitFactor"], 2), "profit factor"), (yuzde(lab["returnPct"], 2), "return, gross"), (yuzde(lab["maxDrawdownPct"], 2), "max drawdown")])}
{bakis(gorsel("lab-backtest", "Trades on the price chart, the equity curve, the result ID and the statistics"))}
<p>Result ID <code>kr1-{lab["resultId"][:16]}</code>: the same rule, data and settings always give the same ID.</p>
</section>

<section class="d-urun" id="rule-guard"><h2>Rule Guard {durum_et("test", dil)}</h2>
<p>Rule Guard is an add-on that runs inside MT5, so there is no web demo; it is being tested on demo accounts. You can see the same daily and total loss rules on the sample trade log: the "Prop limits" section of the Trade Analytics result. <a href="/lab/analytics?file=templates/kalibre-trade-log-example.xlsx">Open in the sample</a> · <a href="/rule-guard">Product page</a></p>
</section>

<section class="d-urun" id="connections"><h2>Connections</h2>
<p>Kalibre Bridge needs an MT5 terminal: <a href="/setup">setup</a>. For CSV and Excel logs, use the <a href="/lab/templates/kalibre-trade-log-template.xlsx" download>template</a>. Alpaca and Tradier connect with your own keys: <a href="/lab/connect">connections</a>.</p>
</section>"""
        sayfa("demo/index.html", "Product demos: every product with sample input and result files", "Try Kalibre Markets products with sample files: Trade Analytics, FX Blotter Analytics and Kalibre Lab. Download the input, open the result in one click and compare with the result file.", "/demo", govde, toc(govde), ek_stil=DEMO_STIL, ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css">', dil="en")

# icindekiler sayfa-uret.py'de "kurulum" işaretinden sonra tanımlı olabilir; yoksa basit sürüm.
if "icindekiler" not in globals():
    def icindekiler(govde):
        bas = re.findall(r'<h2 id="([^"]+)"[^>]*>(.*?)</h2>', govde)
        return "".join(f'<a href="#{i}">{re.sub("<[^>]+>", "", b)}</a>' for i, b in bas)

for d in ("en", "tr"):
    ana_yaz(d)
    hazine(d)
    sirket(d)
    demo(d)
