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
  b1="Try with sample data", b1u="/analytics?ornek=1", b2="Get early access", b2u="/mt5-analytics#pricing", b3="Request a desk demo", b3u="/treasury#demo",
  not_="Beta software. No account needed to try it. Not investment advice.",
  hero_alt="Kalibre Trade Analytics showing an account overview for a synthetic sample account",
  sentetik="Synthetic sample data", hero_yazi="Kalibre Trade Analytics with a generated sample account. It is not a real trader.",
  urun_bas="Products", urun_giris="Every product works on the same trade model. Start with the job in front of you.",
  ta_ac="Drop in an MT5 history report, a CSV file or an Excel log. See results by symbol, hour, weekday, session, holding time, trade size and the trade after a loss.",
  ta_madde=["Losing and winning segments ranked, each with at least 20 trades", "Prop firm daily and total limits, day by day", "Your own group-by views, saved in your browser"],
  ta_bag="Explore Trade Analytics", ta_alt="Ranked losing and winning segments for the synthetic sample account",
  fx_ac="Reads the FX blotter a treasury or dealing desk already keeps, as it is exported.", fx_bag="See the plan",
  fx_madde=["Daily P&amp;L: mark-to-market plus realized, on value date", "Spot and swap-points P&amp;L on separate lines", "Carry cost as overnight swap", "Intraday net open position and value-date ladder", "One-click drill-down to the deals"],
  rg_ac="An MT5 add-on that tracks the firm's daily and total loss floors on every tick and blocks new trades near the floor. Presets for FTMO and The5ers.", rg_bag="About Rule Guard",
  lab_ac="Build a rule with blocks or a form, backtest it with costs and check settings with training and test periods, deflated Sharpe and the probability of backtest overfitting.", lab_bag="Open the lab",
  bag_ac="Bring data from where it already lives.",
  bag_liste=[("Kalibre Bridge for MT5", "/setup", "beta"), ("CSV and Excel trade logs", "/mt5-analytics#import-your-log", "beta"), ("Alpaca and Tradier", "/lab/baglan", "beta")],
  adim_bas="How it works", adim_giris="Three steps from a file to a decision you make yourself.",
  adimlar=[("01", "Connect", "Export a report from MT5, drop in a CSV or Excel log, or link a live MT5 account with Kalibre Bridge."),
           ("02", "Analyze", "Kalibre builds one trade model and breaks results down by the fields that matter. Small samples are flagged as possible noise."),
           ("03", "Act", "Set loss limits with Rule Guard, or test a change to your rules in Kalibre Lab before you trade it.")],
  satirlar=[("insights", "Where you make and lose money", "The list ranks segments by their contribution to net P&amp;L. Each row shows the trade count, win rate against your average and, when it differs, your average size. A segment needs at least 20 trades to appear.", "Ranked segments for the synthetic sample account"),
            ("prop-limits", "Prop limits, day by day", "Pick a firm preset or enter your own percentages. Each day shows both floors, the lowest closed balance and how close it came. A history report has no intraday equity, so this view measures closed trades only.", "Daily prop limit table for the synthetic sample account"),
            ("custom-view", "Your own views", "Group by any field, choose a measure and a chart. Views are saved in your browser and open again on your next visit.", "Custom view builder grouping the synthetic sample by session")],
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
       ("Next", [("Rule Guard", "test", "Early access on demo accounts"), ("FX Blotter Analytics", "gelis", "Demo for treasury and dealing desks")]),
       ("Later", [("Weekly rule report", "plan", "Rule breaks and costly habits, once a week"), ("Multi-account views", "plan", "For prop firms and brokers"), ("More platforms", "plan", "cTrader and Match-Trader")])],
  son_bas="Try it on your own history", son_giris="Use the synthetic sample, or drop in your MT5 report. Nothing is uploaded.",
 ),
 "tr": dict(
  title="Kalibre Markets: alım satım verisi için analiz (beta)",
  desc="Bir hesabın ya da masanın nerede kazanıp kaybettiğini gör, prop firması kayıp sınırlarını denetle ve kurallarını kendi geçmişinde sına. Dosyalar tarayıcında işlenir.",
  rozet="Trade Analytics MT5 raporlarını, CSV ve Excel dosyalarını okur", rozet_url="/tr/mt5-analytics",
  h1="Alım satım verisi için analiz.",
  giris="Bir hesabın ya da masanın nerede kazanıp kaybettiğini gör, risk sınırları içinde kal ve kurallarını kendi geçmişinde sına. Dosyalar tarayıcında işlenir.",
  b1="Örnek veriyle dene", b1u="/analytics?dil=tr&amp;ornek=1", b2="Erken erişim", b2u="/tr/mt5-analytics#pricing", b3="Masa demosu iste", b3u="/tr/treasury#demo",
  not_="Beta yazılım. Denemek için hesap gerekmez. Yatırım tavsiyesi değildir.",
  hero_alt="Sentetik bir örnek hesap için hesap özetini gösteren Kalibre Trade Analytics",
  sentetik="Sentetik örnek veri", hero_yazi="Üretilmiş bir örnek hesapla Kalibre Trade Analytics. Gerçek bir trader değildir.",
  urun_bas="Ürünler", urun_giris="Her ürün aynı işlem modeli üzerinde çalışır. Önündeki işe uyanla başla.",
  ta_ac="MT5 geçmiş raporunu, bir CSV dosyasını ya da Excel kaydını bırak. Sonuçlarını sembol, saat, gün, seans, pozisyon süresi, işlem büyüklüğü ve kayıptan sonraki işleme göre gör.",
  ta_madde=["Kaybettiren ve kazandıran durumlar sıralı, her biri en az 20 işlemle", "Prop firması günlük ve toplam sınırları, gün gün", "Kendi gruplama görünümlerin, tarayıcında kayıtlı"],
  ta_bag="Trade Analytics'i incele", ta_alt="Sentetik örnek hesap için sıralı kaybettiren ve kazandıran durumlar",
  fx_ac="Hazine ya da dealing masasının zaten tuttuğu FX blotter'ını, dışa aktarıldığı haliyle okur.", fx_bag="Planı gör",
  fx_madde=["Günlük kâr/zarar: değerleme artı gerçekleşen, valör tarihinde", "Spot ve swap puanı kâr/zararı ayrı satırlarda", "Taşıma maliyeti gecelik swap olarak", "Gün içi net açık pozisyon ve valör merdiveni", "Tek tıkla deal'lere inme"],
  rg_ac="Firmanın günlük ve toplam kayıp tabanlarını her tick'te izleyen ve tabana yakın yeni işlemi engelleyen MT5 eklentisi. FTMO ve The5ers ön ayarları.", rg_bag="Rule Guard hakkında",
  lab_ac="Bloklarla ya da formla kural kur, maliyetlerle backtest et, ayarları eğitim ve test dönemleri, deflated Sharpe ve backtest aşırı uyum olasılığıyla sına.", lab_bag="Laboratuvarı aç",
  bag_ac="Veriyi zaten bulunduğu yerden getir.",
  bag_liste=[("MT5 için Kalibre Bridge", "/tr/setup", "beta"), ("CSV ve Excel işlem kayıtları", "/tr/mt5-analytics#kendi-kaydin", "beta"), ("Alpaca ve Tradier", "/lab/baglan?dil=tr", "beta")],
  adim_bas="Nasıl çalışır", adim_giris="Bir dosyadan kendi vereceğin karara üç adım.",
  adimlar=[("01", "Bağla", "MT5'ten rapor al, bir CSV ya da Excel kaydı bırak ya da canlı MT5 hesabını Kalibre Bridge ile bağla."),
           ("02", "Analiz et", "Kalibre tek bir işlem modeli kurar ve sonuçları önemli alanlara göre ayırır. Küçük örneklemler gürültü olabilir diye işaretlenir."),
           ("03", "Harekete geç", "Rule Guard ile kayıp sınırlarını kur ya da kuralındaki bir değişikliği işleme koymadan önce Kalibre Lab'de sına.")],
  satirlar=[("insights", "Nerede kazanıp kaybettiğin", "Liste durumları net kâr/zarara katkılarına göre sıralar. Her satır işlem sayısını, ortalamana göre kazanma oranını ve farklıysa ortalama büyüklüğünü gösterir. Bir durumun listeye girmesi için en az 20 işlem gerekir.", "Sentetik örnek hesap için sıralı durumlar"),
            ("prop-limits", "Prop sınırları, gün gün", "Bir firma ön ayarı seç ya da kendi yüzdelerini gir. Her gün iki tabanı, en düşük kapanış bakiyesini ve tabana ne kadar yaklaşıldığını gösterir. Geçmiş raporunda gün içi varlık değeri olmadığı için bu görünüm yalnız kapanmış işlemleri ölçer.", "Sentetik örnek hesap için günlük prop sınırı tablosu"),
            ("custom-view", "Kendi görünümlerin", "Herhangi bir alana göre grupla, bir ölçü ve grafik seç. Görünümler tarayıcında kaydedilir ve sonraki ziyaretinde yeniden açılır.", "Sentetik örneği seansa göre gruplayan görünüm kurucu")],
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
       ("Sırada", [("Rule Guard", "test", "Demo hesaplarda erken erişim"), ("FX Blotter Analytics", "gelis", "Hazine ve dealing masaları için demo")]),
       ("Sonra", [("Haftalık kural raporu", "plan", "Kural ihlalleri ve pahalı alışkanlıklar, haftada bir"), ("Çok hesaplı görünümler", "plan", "Prop firmaları ve aracı kurumlar için"), ("Yeni platformlar", "plan", "cTrader ve Match-Trader")])],
  son_bas="Kendi geçmişinde dene", son_giris="Sentetik örneği kullan ya da MT5 raporunu bırak. Hiçbir şey yüklenmez.",
 ),
}

def bolum_bas(h2, p, id_=""):
    return f'<div class="bolum-bas"{f" id={chr(34)}{id_}{chr(34)}" if id_ else ""}><h2>{h2}</h2><p>{p}</p></div>'

def ana_govde(dil):
    t = M[dil]; tr = dil == "tr"
    is_ad = (["Analiz", "Koru", "Araştır", "Bağla"] if tr else ["Analyze", "Protect", "Research", "Connect"])
    lab_u = "/lab?dil=tr" if tr else "/lab"
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
        <h3>FX Blotter Analytics{durum_et("gelis", dil)}</h3>
        <p>{t["fx_ac"]}</p>
        <ul>{"".join(f"<li>{m}</li>" for m in t["fx_madde"])}</ul>
        <p class="p-baslik-ornek">{"İşlem Tarihi · Valör · Döviz Cinsi · Alış/Satış · Tutar · Kur" if tr else "Trade Date · Value Date · Pair · Buy/Sell · Notional · Rate"}</p>
        <a class="bag" href="{hazine}">{t["fx_bag"]}</a>
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
<div class="p-belge-hero"><h1>FX Blotter Analytics {durum_et("gelis", dil)}</h1></div>
<p class="giris">Masanın zaten tuttuğu FX blotter'ını analiz et. Dışa aktarımı olduğu gibi bırak. Kalibre sütunları tanır, deal'leri pozisyonlara eşler ve defterin nerede kazanıp kaybettiğini gösterir.</p>
<div class="p-eylem"><a class="dugme" href="#demo" data-erken-erisim>Demo iste</a><a class="dugme ikincil" href="/analytics?dil=tr&amp;ornek=1">Trade Analytics'i örnekle dene</a></div>
<div class="kutu">Bu ürün geliştiriliyor. Aşağıdaki kapsam ilk sürüm için planlanandır. İlk sürümü sentetik ya da anonimleştirilmiş blotter'larla deneyecek az sayıda masa arıyoruz.</div>

<h2 id="reads">Neyi okur</h2>
<p>Hedef, dışa aktarımı yeniden biçimlendirmeden okumak:</p>
<ul>
  <li>360T, FXall, Bloomberg FXGO ve Murex gibi sistemlerin CSV ve Excel dışa aktarımları</li>
  <li>Elle tutulan Excel blotter'ları, Türkçe başlıklar dahil</li>
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
  <li>Taşıma maliyeti gecelik swap olarak, fırsat maliyetiyle birlikte görünür</li>
  <li>Müşteri marjı, blotter'daki maliyet sütunundan</li>
  <li>Gün içi net açık pozisyon (NOP), para birimi bazında ve valör merdiveninde</li>
  <li>Tutarlar önce USD karşılığı, sonra yerel para birimi olarak</li>
  <li>Her rakamdan tek tıkla ilgili deal'lere inme</li>
</ul>
<p>Değerleme ve karşılık tutarlar için gün sonu ya da gün içi kur dosyasını siz sağlarsınız. Piyasa verisi lisansımız yok.</p>

<h2 id="standard">Ölçüt</h2>
<p>Bir hazine müdürünün güvendiği şey hızlı ve hiç yanılmayan bir tablodur. İlk sürümün kabul ölçütü budur: her toplam deal satırlarına kadar izlenebilir olacak ve elle hesaplanmış örneklerle sınanacak.</p>

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
        sayfa("tr/treasury/index.html", "FX Blotter Analytics: hazine ve dealing masaları için (geliştiriliyor)", "Masanın kendi FX blotter'ını olduğu gibi okuyan, FIFO ile gerçekleşen kâr/zarar, valör merdiveni ve marj analizi veren araç. Geliştiriliyor; demo isteyin.", "/tr/treasury", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=FORM_STIL, ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css"><script src="/static/talep.js" defer></script>', dil="tr")
    else:
        govde = f'''<div data-talep-sayfa="treasury">
<div class="p-belge-hero"><h1>FX Blotter Analytics {durum_et("gelis", dil)}</h1></div>
<p class="giris">Analyze the FX blotter your desk already keeps. Drop in the export as it is. Kalibre detects the columns, matches deals into positions and shows where the book made and lost money.</p>
<div class="p-eylem"><a class="dugme" href="#demo" data-erken-erisim>Request a demo</a><a class="dugme ikincil" href="/analytics?ornek=1">Try Trade Analytics with sample data</a></div>
<div class="kutu">This product is in development. The scope below is what we plan for the first version. We are looking for a small number of desks to try it on synthetic or anonymized blotters.</div>

<h2 id="reads">What it reads</h2>
<p>The goal is to read the export without reformatting it:</p>
<ul>
  <li>CSV and Excel exports from systems such as 360T, FXall, Bloomberg FXGO and Murex</li>
  <li>Excel blotters kept by hand, including Turkish headers</li>
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
  <li>Carry cost shown as overnight swap, with the opportunity cost next to it</li>
  <li>Client margin from the blotter's cost column</li>
  <li>Intraday net open position (NOP) by currency and on a value-date ladder</li>
  <li>Amounts in USD equivalent first, then in local currency</li>
  <li>One-click drill-down from any figure to the deals behind it</li>
</ul>
<p>For marking and currency equivalents you supply an end-of-day or intraday rates file. We have no market data licence.</p>

<h2 id="standard">The standard</h2>
<p>What a head of treasury trusts is a fast table that is never wrong. That is the acceptance bar for the first version: every total traces back to deal rows and is tested against hand-computed cases.</p>

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
        sayfa("treasury/index.html", "FX Blotter Analytics for treasury and dealing desks (in development)", "Reads your desk's own FX blotter as it is: realized P&L with FIFO, a value-date ladder and spread capture against your mid rates. In development; request a demo.", "/treasury", govde, icindekiler(govde.split('<dialog')[0]), ek_stil=FORM_STIL, ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css"><script src="/static/talep.js" defer></script>', dil="en")

# ------------------------------------------------------------------ /company
def sirket(dil):
    tr = dil == "tr"
    if tr:
        urunler = "".join(f'<li><b>{ad}</b> {durum_et(d, dil)}: {ac}</li>' for _, og in URUNLER["tr"] for ad, d, ac, h in og if d)
        govde = f'''<h1>Kalibre Markets</h1>
<p class="giris">Kalibre Markets alım satım verisi için analiz yazılımı geliştiriyor: bireysel trader'lar, prop trader'lar ve işlem masaları için.</p>
<p>Erken aşamada bir fintech girişimiyiz. Ürünlerimiz beta aşamasında.</p>

<h2 id="building">Ne geliştiriyoruz</h2>
<ul>{urunler}</ul>

<h2 id="principles">İlkeler</h2>
<div class="p-sutun2">
  <div><h3>Doğrulanmış motor</h3><p>Bir sayıyı göstermeden önce nasıl hesaplandığını sınarız. Motor MetaTrader 5 Strategy Tester'a ve ayrı bir referans uygulamasına karşı karşılaştırıldı. <a href="/tr/methodology">Metodoloji</a></p></div>
  <div><h3>Önce yerel gizlilik</h3><p>Dosyalar tarayıcında işlenir. Canlı MT5 verisi uçtan uca şifrelidir. Şifre istemeyiz. <a href="/tr/security">Güvenlik</a></p></div>
  <div><h3>Yalnız yazılım</h3><p>Yatırım tavsiyesi, işlem sinyali ya da kopya işlem sunmayız. Müşteri parası tutmayız ve sunucularımızdan emir göndermeyiz.</p></div>
  <div><h3>Dürüst durum etiketleri</h3><p>Her ürün durumunu gösterir: Beta, Testte, Geliştiriliyor ya da Planlanıyor. Performans iddiasında bulunmayız.</p></div>
</div>

<h2 id="partners">Aracı kurumlar ve prop firmaları</h2>
<p>Çok sayıda hesap için analiz, kural izleme ve kendi markanızla trader panelleri üzerinde çalışıyoruz. Bu alan keşif aşamasında. İhtiyacınızı anlatmak isterseniz <a href="mailto:markets@kalibrefin.com?subject=Kalibre%20partners">markets@kalibrefin.com</a> adresine yazın.</p>

<h2 id="contact">İletişim</h2>
<p>E-posta: <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a></p>'''
        sayfa("tr/company/index.html", "Şirket: Kalibre Markets", "Kalibre Markets alım satım verisi için analiz yazılımı geliştiriyor. İlkeler: doğrulanmış motor, önce yerel gizlilik, yalnız yazılım.", "/tr/company", govde, icindekiler(govde), ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css">', dil="tr")
    else:
        urunler = "".join(f'<li><b>{ad}</b> {durum_et(d, dil)}: {ac}</li>' for _, og in URUNLER["en"] for ad, d, ac, h in og if d)
        govde = f'''<h1>Kalibre Markets</h1>
<p class="giris">Kalibre Markets builds analytics software for trading data: for individual traders, prop traders and trading desks.</p>
<p>We are an early-stage fintech venture. Our products are in beta.</p>

<h2 id="building">What we are building</h2>
<ul>{urunler}</ul>

<h2 id="principles">Principles</h2>
<div class="p-sutun2">
  <div><h3>A verified engine</h3><p>We check how a number is computed before we show it. The engine is compared against the MetaTrader 5 Strategy Tester and a separate reference implementation. <a href="/methodology">Methodology</a></p></div>
  <div><h3>Local-first privacy</h3><p>Files are processed in your browser. Live MT5 data is encrypted end to end. We never ask for passwords. <a href="/security">Security</a></p></div>
  <div><h3>Software only</h3><p>We do not provide investment advice, trading signals or copy trading. We do not hold client funds and do not send orders from our servers.</p></div>
  <div><h3>Honest status labels</h3><p>Every product shows its status: Beta, In testing, In development or Planned. We make no performance claims.</p></div>
</div>

<h2 id="partners">Brokers and prop firms</h2>
<p>We are working on analytics and rule monitoring across many accounts, and on trader dashboards under your own brand. This area is in discovery. To tell us what you need, email <a href="mailto:markets@kalibrefin.com?subject=Kalibre%20partners">markets@kalibrefin.com</a>.</p>

<h2 id="contact">Contact</h2>
<p>Email: <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a></p>'''
        sayfa("company/index.html", "Company: Kalibre Markets", "Kalibre Markets builds analytics software for trading data. Principles: a verified engine, local-first privacy, software only.", "/company", govde, icindekiler(govde), ek_betik='<link rel="stylesheet" href="/static/ana/pitch.css">', dil="en")

# icindekiler sayfa-uret.py'de "kurulum" işaretinden sonra tanımlı olabilir; yoksa basit sürüm.
if "icindekiler" not in globals():
    def icindekiler(govde):
        bas = re.findall(r'<h2 id="([^"]+)"[^>]*>(.*?)</h2>', govde)
        return "".join(f'<a href="#{i}">{re.sub("<[^>]+>", "", b)}</a>' for i, b in bas)

for d in ("en", "tr"):
    ana_yaz(d)
    hazine(d)
    sirket(d)
