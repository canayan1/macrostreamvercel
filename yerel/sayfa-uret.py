# Ürün sitesinin metin sayfalarını ortak üst bar ve alt bilgiyle yazar (tek seferlik üretici).
import os, re
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # site kökü

# Ödemeler açıldığında True yap ve üç üreticiyi yeniden çalıştır (sayfa-uret.py, sayfa-uret-en.py, ana-en-uret.py).
ODEME_ACIK = False  # 25.10.2026: ödemeler şirket kurulana kadar kapalı (bekleme listesi + davetli beta). Açıkken de sunucu 503 dönerse sayfa "ödemeler yakında" kartına düşer

# Üst menü: "Ürünler" ve "Çözümler" panelleri (işe göre gruplu) + düz bağlantılar.
# Aynı yapı static/kabuk.js'te (eski Türkçe sayfalar) elle tekrarlanır; birini değiştirirsen ötekini de değiştir.
# Durum etiketleri dürüst: beta (Beta), test (demoda test), gelis (geliştiriliyor), plan (planlanıyor).
DURUM = {"beta": ("Beta", "Beta"), "test": ("In testing", "Testte"), "gelis": ("In development", "Geliştiriliyor"), "plan": ("Planned", "Planlanıyor")}
URUNLER = {
 "en": [
  ("Analyze", [("Trade Analytics", "beta", "Find what works in your trading.", "/trade-analytics"),
               ("FX Blotter Analytics", "beta", "Realized P&amp;L and positions from your desk's own blotter.", "/fx-blotter")]),
  ("Protect", [("Rule Guard", "test", "Prop firm loss limits, checked on every tick in MT5.", "/rule-guard")]),
  ("Research", [("Kalibre Lab", "beta", "Build rules, backtest them and check settings for overfitting.", "/lab"),
                ("Methodology", None, "How the engine is validated.", "/methodology")]),
  ("Connect", [("Kalibre Bridge for MT5", "beta", "Encrypted, read-only link from MetaTrader 5.", "/setup"),
               ("CSV and Excel trade logs", "beta", "Bring trades from any platform or spreadsheet.", "/trade-analytics#import-your-log"),
               ("Alpaca and Tradier", "beta", "US brokerage accounts, read-only, with your own keys.", "/lab/connect")]),
 ],
 "tr": [
  ("Analiz", [("Trade Analytics", "beta", "İşlemlerinde neyin işe yaradığını bul.", "/tr/trade-analytics"),
              ("FX Blotter Analytics", "beta", "Masanın kendi blotter'ından gerçekleşen kâr/zarar ve pozisyon.", "/tr/fx-blotter")]),
  ("Koru", [("Rule Guard", "test", "Prop firması kayıp sınırları, MT5'te her tick'te denetlenir.", "/tr/rule-guard")]),
  ("Araştır", [("Kalibre Lab", "beta", "Kural kur, backtest et, ayarları aşırı uyuma karşı sına.", "/lab?lang=tr"),
               ("Metodoloji", None, "Motorun nasıl doğrulandığı.", "/tr/methodology")]),
  ("Bağla", [("MT5 için Kalibre Bridge", "beta", "MetaTrader 5'ten şifreli, salt okunur bağlantı.", "/tr/setup"),
             ("CSV ve Excel işlem kayıtları", "beta", "Her platformdan ya da tablodan işlem getir.", "/tr/trade-analytics#kendi-kaydin"),
             ("Alpaca ve Tradier", "beta", "ABD aracı kurum hesapları, salt okunur, kendi anahtarınla.", "/lab/connect?lang=tr")]),
 ],
}
COZUMLER = {
 "en": [("Prop traders", "Stay inside the firm's daily and total loss limits.", "/rule-guard"),
        ("Active MT5 traders", "Find the hours, symbols and habits that work for you.", "/trade-analytics"),
        ("Treasury and dealing desks", "Analyze the FX blotter your desk already keeps.", "/fx-blotter"),
        ("Brokers and prop firms", "Analytics across many accounts. Talk to us.", "/company#partners")],
 "tr": [("Prop trader'lar", "Firmanın günlük ve toplam kayıp sınırları içinde kal.", "/tr/rule-guard"),
        ("Aktif MT5 trader'ları", "Sana kazandıran saatleri, sembolleri ve alışkanlıkları bul.", "/tr/trade-analytics"),
        ("Hazine ve dealing masaları", "Masanın zaten tuttuğu FX blotter'ını analiz et.", "/tr/fx-blotter"),
        ("Aracı kurumlar ve prop firmaları", "Çok hesaplı analiz. Bizimle konuşun.", "/tr/company#partners")],
}
DUZ = {"en": [("/demo", "Demos"), ("/security", "Security"), ("/pricing", "Pricing"), ("/company", "Company")],
       "tr": [("/tr/demo", "Demolar"), ("/tr/security", "Güvenlik"), ("/tr/pricing", "Fiyat"), ("/tr/company", "Şirket")]}
# Eski adlar: başka üreticiler MENU/MENU_EN'e bakıyorsa kırılmasın.
MENU = DUZ["tr"]; MENU_EN = DUZ["en"]

# Türkçe sayfa ↔ İngilizce karşılığı (hreflang ve dil bağlantısı için). Site kökü İngilizce, Türkçe /tr altında.
ESLER = {"/tr": "/", "/tr/prop": "/prop", "/tr/forex": "/forex", "/tr/setup": "/setup",
         "/tr/security": "/security", "/tr/methodology": "/methodology", "/tr/about": "/about", "/tr/pricing": "/pricing",
         "/tr/account": "/account", "/tr/sign-in": "/sign-in", "/tr/risk-disclosure": "/risk-disclosure", "/tr/terms": "/terms", "/tr/privacy": "/privacy", "/tr/refunds": "/refunds", "/tr/cookies": "/cookies", "/tr/beta": "/beta",
         "/tr/rule-guard": "/rule-guard", "/tr/company": "/company", "/tr/demo": "/demo", "/tr/trade-analytics": "/trade-analytics", "/tr/fx-blotter": "/fx-blotter", "/tr/kalibre-lab": "/kalibre-lab"}
ESLER_TERS = {v: k for k, v in ESLER.items()}

def yol_url(yol):
    # vercel.json trailingSlash:false: kanonik adresler sondaki eğik çizgisiz (kök "/" hariç).
    return ("/" + yol.replace("index.html", "").replace(".html", "")).replace("//", "/").rstrip("/") or "/"

# English only for now (Can, 30.10.2026): English pages carry no link or hreflang to the Turkish pages.
# The /tr pages are still generated; set True to offer Turkish again.
TURKISH_PUBLIC = False

def english_only(html):
    if TURKISH_PUBLIC or '<html lang="en">' not in html:
        return html
    return re.sub(r'\n?<link rel="alternate" hreflang="(tr|x-default)"[^>]*>', '', html)

def egik_cizgisiz(html):
    # İç bağlantılardaki ve kanonik/og adreslerindeki sondaki eğik çizgiyi kaldırır ("/" kök hariç).
    html = english_only(html)
    return re.sub(r'(href|content)="((?:https://kalibremarkets\.com)?/[^"?#]*?[^/"])/"', r'\1="\2"', html)

def durum_et(d, dil):
    if not d: return ""
    return f'<span class="durum durum-{d}">{DURUM[d][1 if dil == "tr" else 0]}</span>'

def ust(aktif, dil="tr", diger=None):
    tr = dil == "tr"
    AK = ' aria-current="page"'
    kolon = ""
    for baslik, ogeler in URUNLER[dil]:
        o = "".join(f'<a class="mitem" href="{h}"{AK if h == aktif else ""}><b>{ad}{durum_et(d, dil)}</b><small>{ac}</small></a>'
                    for ad, d, ac, h in ogeler)
        kolon += f'<div class="mkol"><p class="mbas">{baslik}</p>{o}</div>'
    cozum = "".join(f'<a class="mitem" href="{h}"{AK if h == aktif else ""}><b>{ad}</b><small>{ac}</small></a>' for ad, ac, h in COZUMLER[dil])
    duz = "".join(f'<a class="mduz" href="{h}"{AK if h == aktif else ""}>{t}</a>' for h, t in DUZ[dil])
    dil_baglanti = ""
    if diger:
        dil_baglanti = (f'<a class="dil" href="{diger}" hreflang="tr" lang="tr">TR</a>' if dil == "en"
                        else f'<a class="dil" href="{diger}" hreflang="en" lang="en">EN</a>')
    ana = "/tr" if tr else "/"
    alt_not = ("Hepsi yazılım. Tavsiye ve sinyal yok. Verin cihazında işlenir." if tr
               else "All products are software. No advice, no signals. Your data is processed on your device.")
    guv = "/tr/security" if tr else "/security"
    ornek = "/tr/demo" if tr else "/demo"
    erken = "/tr/trade-analytics#pricing" if tr else "/trade-analytics#pricing"
    return ("<script>document.documentElement.classList.add('js')</script>\n"
            f'<header class="ust">\n  <div class="kap">\n'
            f'    <a class="marka" href="{ana}"><b>Kalibre</b><span>Markets</span></a>\n'
            f'    <nav class="ana-menu" id="ana-menu" aria-label="{"Ana menü" if tr else "Main menu"}">\n'
            f'      <details class="mgrup"><summary>{"Ürünler" if tr else "Products"}</summary>\n'
            f'        <div class="mega"><div class="mega-izgara">{kolon}</div><p class="mega-alt">{alt_not} <a href="{guv}">{"Güvenlik mimarisi" if tr else "Security architecture"}</a></p></div>\n'
            f'      </details>\n'
            f'      <details class="mgrup mgrup-dar"><summary>{"Çözümler" if tr else "Solutions"}</summary>\n'
            f'        <div class="mega mega-dar"><div class="mega-liste">{cozum}</div></div>\n'
            f'      </details>\n'
            f'      {duz}\n'
            f'      <div class="menu-eylem"><a class="dugme" href="{erken}">{"Erken erişim" if tr else "Get early access"}</a><a class="dugme ikincil" href="{ornek}">{"Demolar" if tr else "Try the demos"}</a></div>\n'
            f'    </nav>\n'
            f'    {dil_baglanti}\n'
            f'    <button class="menu-ac" type="button" aria-controls="ana-menu" aria-expanded="false">{"Menü" if tr else "Menu"}</button>\n'
            f'    <a class="dugme ikincil kucuk baglan" href="{ornek}">{"Demolar" if tr else "Try the demos"}</a>\n'
            f'    <a class="dugme kucuk" href="{erken}">{"Erken erişim" if tr else "Get early access"}</a>\n'
            f'  </div>\n</header>')

def _alt(dil):
    tr = dil == "tr"
    def kol(baslik, ogeler): return f'<div><h4>{baslik}</h4>' + "".join(f'<a href="{h}">{t}</a>' for h, t in ogeler) + '</div>'
    urun = [(h, ad) for _, og in URUNLER[dil] for ad, d, ac, h in og if d]
    cozum = [(h, ad) for ad, ac, h in COZUMLER[dil]]
    if tr:
        kaynak = [("/tr/security", "Güvenlik"), ("/tr/methodology", "Metodoloji"), ("/tr/setup", "Kurulum"), ("/tr/pricing", "Fiyat"), ("/egitim", "Eğitim yazıları"), ("/grafik-oku", "Grafik okuma testi"), ("/trading/onyargi-testi", "Önyargı testi")]
        sirket = [("/tr/company", "Şirket"), ("mailto:markets@kalibrefin.com", "İletişim"), ("/tr/terms", "Hizmet şartları"), ("/tr/privacy", "Gizlilik"), ("/tr/refunds", "İade ve iptal"), ("/tr/cookies", "Çerezler"), ("/tr/risk-disclosure", "Risk bildirimi")]
        tanim = "Alım satım verisi için analiz. Ürünler beta aşamasında."
        yasal = ("Kalibre Markets ürünleri beta aşamasında olan yazılımlardır. Kalibre Markets aracı kurum, yatırım danışmanı ya da portföy yöneticisi değildir; müşteri parası tutmaz, yatırım tavsiyesi ya da işlem sinyali vermez. "
                 "Kaldıraçlı forex ve CFD işlemleri yüksek risk taşır ve herkes için uygun olmayabilir; yatırdığınız paranın tamamını kaybedebilirsiniz. Gerçek ya da simülasyon, geçmiş performans gelecekteki sonuçların göstergesi değildir. "
                 "Backtest ve simülasyonlar varsayımsaldır. Bu sitedeki içerik yatırım danışmanlığı kapsamında değildir. MetaTrader, MetaQuotes Ltd.'nin markasıdır; Kalibre Markets MetaQuotes ile bağlantılı değildir. &copy; 2026 Kalibre Markets")
        ayar = "Çerez ayarları"
    else:
        kaynak = [("/security", "Security"), ("/methodology", "Methodology"), ("/setup", "Setup"), ("/pricing", "Pricing"), ("/egitim", "Articles (Turkish)")]
        sirket = [("/company", "Company"), ("mailto:markets@kalibrefin.com", "Contact"), ("/terms", "Terms of service"), ("/privacy", "Privacy"), ("/refunds", "Refunds"), ("/cookies", "Cookies"), ("/risk-disclosure", "Risk disclosure")]
        tanim = "Analytics for trading data. Products are in beta."
        yasal = ("Kalibre Markets products are software in beta. Kalibre Markets is not a broker, investment adviser or portfolio manager, does not hold client funds and does not provide investment advice or trading signals. "
                 "Trading forex and CFDs on margin carries a high level of risk and may not be suitable for all investors. You can lose all of the money you deposit. Past performance, whether actual or simulated, is not indicative of future results. "
                 "Backtests and simulations are hypothetical and do not reflect actual trading. MetaTrader is a trademark of MetaQuotes Ltd. Kalibre Markets is not affiliated with MetaQuotes. &copy; 2026 Kalibre Markets")
        ayar = "Cookie settings"
    cerez = "/tr/cookies#manage" if tr else "/cookies#manage"
    sirket_html = "".join(f'<a href="{h}">{t}</a>' for h, t in sirket)
    return ('<footer class="alt">\n  <div class="kap">\n    <div>\n'
            f'      <p><b style="font:600 18px var(--serif);color:var(--metin)">Kalibre Markets</b></p>\n'
            f'      <p>{tanim}</p>\n      <p><a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a></p>\n    </div>\n'
            f'    {kol("Ürünler" if tr else "Products", urun)}\n'
            f'    {kol("Çözümler" if tr else "Solutions", cozum)}\n'
            f'    {kol("Kaynaklar" if tr else "Resources", kaynak)}\n'
            f'    <div><h4>Kalibre Markets</h4>{sirket_html}<a href="{cerez}" data-cerez-ayar>{ayar}</a></div>\n'
            f'    <p class="yasal">{yasal}</p>\n  </div>\n</footer>\n'
            '<script src="/static/menu.js" defer></script>\n<script src="/static/lightbox.js" defer></script>')

ALT = _alt("tr")
ALT_EN = _alt("en")

# ------------------------------------------------------------------ site shell (current design)
# Global nav, product local nav and footer for the current pages. ust()/ALT above stay for the
# older Turkish content pages, whose header comes from static/kabuk.js.
PRODUCTS = {
 "en": [("Trade Analytics", "/trade-analytics", "beta"), ("FX Blotter", "/fx-blotter", "beta"), ("Rule Guard", "/rule-guard", "test"), ("Kalibre Lab", "/kalibre-lab", "beta")],
 "tr": [("Trade Analytics", "/tr/trade-analytics", "beta"), ("FX Blotter", "/tr/fx-blotter", "beta"), ("Rule Guard", "/tr/rule-guard", "test"), ("Kalibre Lab", "/tr/kalibre-lab", "beta")],
}
NAV_MORE = {
 "en": [("Demos", "/demo"), ("Security", "/security"), ("Pricing", "/pricing"), ("Company", "/company")],
 "tr": [("Demolar", "/tr/demo"), ("Güvenlik", "/tr/security"), ("Fiyat", "/tr/pricing"), ("Şirket", "/tr/company")],
}
STATUS_TEXT = {"beta": ("Beta", "Beta"), "test": ("In testing", "Testte"), "plan": ("Planned", "Planlanıyor")}

def status_tag(code, lang):
    return f'<span class="status status-{code}">{STATUS_TEXT[code][1 if lang == "tr" else 0]}</span>' if code else ""

def gnav(active, lang, other=None):
    tr = lang == "tr"
    home = "/tr" if tr else "/"
    items = [(n, h) for n, h, _ in PRODUCTS[lang]] + NAV_MORE[lang]
    current = ' aria-current="page"'
    links = "".join(f'<li><a href="{h}"{current if h == active else ""}>{n}</a></li>' for n, h in items)
    lang_link = (f'<a class="gnav-lang" href="{other}" hreflang="{"en" if tr else "tr"}" lang="{"en" if tr else "tr"}">{"English" if tr else "Türkçe"}</a>' if other and (tr or TURKISH_PUBLIC) else "")
    return (f'<header class="gnav">\n  <div class="wrap">\n'
            f'    <a class="gnav-brand" href="{home}" aria-label="Kalibre Markets"><span class="logo-k" aria-hidden="true">K</span>KALIBRE<span class="logo-sub" aria-hidden="true">// MARKETS</span></a>\n'
            f'    <nav aria-label="{"Ana menü" if tr else "Main menu"}"><ul class="gnav-links" id="gnav-links">{links}</ul></nav>\n'
            f'    {lang_link}<span data-kalibre-auth></span>\n'
            f'    <button class="gnav-toggle" type="button" aria-controls="gnav-links" aria-expanded="false" aria-label="{"Menü" if tr else "Menu"}"><span></span><span></span></button>\n'
            f'  </div>\n</header>')

def lnav(title, lang, links, action_label, action_href, action_attr="", status=None):
    tr = lang == "tr"
    items = "".join(f'<li><a href="{h}">{n}</a></li>' for n, h in links)
    return (f'<nav class="lnav" aria-label="{title}">\n  <div class="wrap">\n'
            f'    <a class="lnav-title" href="#top">{title}</a>\n'
            f'    <ul class="lnav-links">{items}</ul>\n'
            f'    <a class="btn" href="{action_href}"{action_attr}>{action_label}</a>\n'
            f'  </div>\n</nav>')

def gfoot(lang):
    tr = lang == "tr"
    p = "/tr" if tr else ""
    products = [(n, h) for n, h, _ in PRODUCTS[lang]] + [("Kalibre Bridge", f"{p}/setup")]
    solutions = ([("Prop trader'lar", "/tr/rule-guard"), ("Aktif MT5 trader'ları", "/tr/trade-analytics"), ("Hazine ve dealing masaları", "/tr/fx-blotter"), ("Aracı kurumlar ve prop firmaları", "/tr/company#partners")] if tr else
                 [("Prop traders", "/rule-guard"), ("Active MT5 traders", "/trade-analytics"), ("Treasury and dealing desks", "/fx-blotter"), ("Brokers and prop firms", "/company#partners")])
    resources = ([("Demolar", "/tr/demo"), ("Güvenlik", "/tr/security"), ("Metodoloji", "/tr/methodology"), ("Kurulum", "/tr/setup"), ("Fiyat", "/tr/pricing"), ("Eğitim yazıları", "/egitim")] if tr else
                 [("Demos", "/demo"), ("Security", "/security"), ("Methodology", "/methodology"), ("Setup", "/setup"), ("Pricing", "/pricing")] + ([("Articles (Turkish)", "/egitim")] if TURKISH_PUBLIC else []))
    company = ([("Şirket", "/tr/company"), ("İletişim", "mailto:markets@kalibrefin.com"), ("Hizmet şartları", "/tr/terms"), ("Gizlilik", "/tr/privacy"), ("İade ve iptal", "/tr/refunds"), ("Çerezler", "/tr/cookies"), ("Risk bildirimi", "/tr/risk-disclosure")] if tr else
               [("Company", "/company"), ("Contact", "mailto:markets@kalibrefin.com"), ("Terms of service", "/terms"), ("Privacy", "/privacy"), ("Refunds", "/refunds"), ("Cookies", "/cookies"), ("Risk disclosure", "/risk-disclosure")])
    col = lambda head, items: f'<div><h4>{head}</h4><ul>' + "".join(f'<li><a href="{h}">{n}</a></li>' for n, h in items) + '</ul></div>'
    legal = (["Kalibre Markets ürünleri beta aşamasında olan yazılımlardır. Kalibre Markets aracı kurum, yatırım danışmanı ya da portföy yöneticisi değildir; müşteri parası tutmaz, yatırım tavsiyesi ya da işlem sinyali vermez.",
              "Kaldıraçlı forex ve CFD işlemleri yüksek risk taşır ve herkes için uygun olmayabilir; yatırdığınız paranın tamamını kaybedebilirsiniz. Gerçek ya da simülasyon, geçmiş performans gelecekteki sonuçların göstergesi değildir. Backtest ve simülasyonlar varsayımsaldır.",
              "MetaTrader, MetaQuotes Ltd.'nin markasıdır; Kalibre Markets MetaQuotes ile bağlantılı değildir."] if tr else
             ["Kalibre Markets products are software in beta. Kalibre Markets is not a broker, investment adviser or portfolio manager, does not hold client funds and does not provide investment advice or trading signals.",
              "Trading forex and CFDs on margin carries a high level of risk and may not be suitable for all investors. You can lose all of the money you deposit. Past performance, whether actual or simulated, is not indicative of future results. Backtests and simulations are hypothetical and do not reflect actual trading.",
              "MetaTrader is a trademark of MetaQuotes Ltd. Kalibre Markets is not affiliated with MetaQuotes."])
    cookie = ("/tr/cookies#manage", "Çerez ayarları") if tr else ("/cookies#manage", "Cookie settings")
    return ('<footer class="gfoot">\n  <div class="wrap">\n'
            f'    <div class="gfoot-legal">{"".join(f"<p>{x}</p>" for x in legal)}</div>\n'
            f'    <div class="gfoot-cols">{col("Ürünler" if tr else "Products", products)}{col("Çözümler" if tr else "Solutions", solutions)}{col("Kaynaklar" if tr else "Resources", resources)}{col("Kalibre Markets", company)}</div>\n'
            f'    <div class="gfoot-base"><span>&copy; 2026 Kalibre Markets. <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a></span><a href="{cookie[0]}" data-cerez-ayar>{cookie[1]}</a></div>\n'
            '  </div>\n</footer>\n'
            '<script src="/static/nav.js" defer></script>\n<script src="/static/lightbox.js" defer></script>')

def head(lang, title, description, canonical_path, alternates="", extra=""):
    """<head> contents shared by the current pages."""
    url = "https://kalibremarkets.com" + canonical_path
    return f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{url}">{alternates}
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kalibre Markets">
<meta property="og:locale" content="{"tr_TR" if lang == "tr" else "en_US"}">
<meta property="og:image" content="https://kalibremarkets.com/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#100e0c">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/site.css">
<script src="/static/kalibre-cerez.js"></script>
<script src="/static/beta.js" defer></script>
{yol_etiketleri(lang)}<script src="/static/kalibre-auth.js" defer></script>
{extra}"""

# Hesap betiği (static/kalibre-auth.js) bu yolları okur; site köküne İngilizce taşınınca yalnız burası değişir.
YOLLAR = {"tr": {"signIn": "/tr/sign-in", "account": "/tr/account", "pricing": "/tr/pricing", "connect": "/tr/connect", "lab": "/lab?lang=tr", "home": "/tr"},
          "en": {"signIn": "/sign-in", "account": "/account", "pricing": "/pricing", "connect": "/connect", "lab": "/lab", "home": "/"}}
def yol_etiketleri(dil):
    return "".join(f'<meta name="kalibre:yol:{k}" content="{v}">\n' for k, v in YOLLAR[dil].items())

def sayfa(yol, baslik, aciklama, aktif, govde, kenar="", ek_stil="", ek_betik="", gizli=False, dil="tr", hero=""):
    url = yol_url(yol)
    kanon = "https://kalibremarkets.com" + url
    diger = (ESLER_TERS.get(url) if dil == "en" else ESLER.get(url))
    alternatif = ""
    if diger:
        tr_url, en_url = (diger, url) if dil == "en" else (url, diger)
        alternatif = (f'\n<link rel="alternate" hreflang="en" href="https://kalibremarkets.com{en_url}">'
                      f'\n<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com{tr_url}">'
                      f'\n<link rel="alternate" hreflang="x-default" href="https://kalibremarkets.com{en_url}">')
    kenar_etiket = "On this page" if dil == "en" else "Bu sayfada"
    html = f'''<!doctype html>
<html lang="{dil}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>{baslik}</title>
<meta name="description" content="{aciklama}">
<link rel="canonical" href="{kanon}">{alternatif}{chr(10) + '<meta name="robots" content="noindex">' if gizli else ""}
<meta property="og:title" content="{baslik}">
<meta property="og:description" content="{aciklama}">
<meta property="og:site_name" content="Kalibre Markets">
<meta property="og:locale" content="{"en_US" if dil == "en" else "tr_TR"}">
<meta property="og:image" content="https://kalibremarkets.com/og-default.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/site.css">
<script src="/static/kalibre-cerez.js"></script>
<script src="/static/beta.js" defer></script>
{yol_etiketleri(dil)}<script src="/static/kalibre-auth.js" defer></script>
{f"<style>{ek_stil}</style>" if ek_stil else ""}
</head>
<body>

{gnav(aktif, dil, diger)}
{hero}
<main class="doc{" after-hero" if hero else ""}">
  <div class="doc-grid">
    <article class="doc-body">
{govde}
    </article>
    {f'<aside class="doc-side" aria-label="{kenar_etiket}"><p>{kenar_etiket}</p>{kenar}</aside>' if kenar else ""}
  </div>
</main>

{gfoot(dil)}
{ek_betik}
</body>
</html>
'''
    assert "—" not in html, yol + ": uzun tire"
    p = os.path.join(KOK, yol)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w").write(egik_cizgisiz(html))
    print("yazıldı", yol)

def icindekiler(govde):
    return "".join(f'<a href="#{i}">{t}</a>' for i, t in re.findall(r'<h2 id="([^"]+)">([^<]+)</h2>', govde))

# ------------------------------------------------------------------ page hero (shared by every top-level page)
def page_hero(h1, sub, actions, media, kicker="", media_cls=""):
    """Short headline, one line of copy, actions, then the page's main visual inside the first screen."""
    k = f'<span class="kicker">{kicker}</span>' if kicker else ""
    a = f'<div class="actions">{actions}</div>' if actions else ""
    return (f'<section class="hero page-hero"><div class="wrap">{k}<h1 class="display">{h1}</h1><p class="sub">{sub}</p>{a}</div>'
            f'<div class="page-hero-media {media_cls}">{media}</div></section>')

def hero_image(name, lang, alt):
    """Composited product render from yerel/hero-render.mjs, installed in static/urun/hero."""
    base = f"/static/urun/hero/{name}-{lang}"
    return (f'<picture><source type="image/webp" srcset="{base}-1x.webp 1440w, {base}-2x.webp 2880w" sizes="(max-width: 1240px) 100vw, 1240px">'
            f'<img src="{base}.png" width="2880" height="1720" alt="{alt}" fetchpriority="high" decoding="async"></picture>')

def flow_diagram(columns, label, note=""):
    """Cards joined by arrows. Two drawings: wide for desktop, stacked for phones (site.css shows one).
    columns: [{"title", "tag" (optional), "items": [...], "accent": bool}]"""
    sans, mono = "Inter Tight, Helvetica, sans-serif", "Geist Mono, ui-monospace, monospace"
    rows = max(len(c["items"]) for c in columns)
    tagged = any(c.get("tag") for c in columns)
    head = 78 if tagged else 58
    ch = head + 42 * rows + 8
    def card(x, y, w, c):
        stroke = "#ffa630" if c.get("accent") else "#3a332a"
        out = f'<rect x="{x:.0f}" y="{y}" width="{w:.0f}" height="{ch}" rx="14" fill="#1a1612" stroke="{stroke}" stroke-width="1.5"/>'
        out += f'<text x="{x + 22:.0f}" y="{y + 38}" fill="#ebe3d3" font-size="21" font-weight="600" font-family="{sans}">{c["title"]}</text>'
        if c.get("tag"):
            out += f'<text x="{x + 22:.0f}" y="{y + 62}" fill="#ffa630" font-size="13" font-family="{mono}">// {c["tag"]}</text>'
        for i, item in enumerate(c["items"]):
            iy = y + head + 42 * i
            out += (f'<rect x="{x + 14:.0f}" y="{iy}" width="{w - 28:.0f}" height="34" rx="8" fill="#100e0c" stroke="#26221d"/>'
                    f'<circle cx="{x + 30:.0f}" cy="{iy + 17}" r="3.5" fill="{"#ffa630" if c.get("accent") else "#6f6553"}"/>'
                    f'<text x="{x + 44:.0f}" y="{iy + 22}" fill="#a89c83" font-size="15" font-family="{sans}">{item}</text>')
        return out
    arrow = lambda mid: f'<marker id="{mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ffa630"/></marker>'
    # wide
    W, gap, top = 1100, 84, 8
    cw = (W - gap * (len(columns) - 1)) / len(columns)
    wide = "".join(card(i * (cw + gap), top, cw, c) for i, c in enumerate(columns))
    for i in range(len(columns) - 1):
        x1 = (i + 1) * cw + i * gap + 8
        wide += f'<line x1="{x1:.0f}" x2="{x1 + gap - 18:.0f}" y1="{top + ch / 2:.0f}" y2="{top + ch / 2:.0f}" stroke="#ffa630" stroke-width="2" marker-end="url(#fa-w)"/>'
    H = top + ch + 8
    if note:
        ny = top + ch + 46
        x0, x1 = cw / 2, (len(columns) - 1) * (cw + gap) + cw / 2
        wide += (f'<path d="M{x0:.0f},{top + ch} V{ny} H{x1:.0f} V{top + ch}" fill="none" stroke="#a89c83" stroke-width="1.5" stroke-dasharray="5 5"/>'
                 f'<rect x="{W / 2 - 330:.0f}" y="{ny - 18}" width="660" height="36" rx="18" fill="#100e0c" stroke="#3a332a"/>'
                 f'<text x="{W / 2:.0f}" y="{ny + 5}" text-anchor="middle" fill="#ebe3d3" font-size="15" font-family="{sans}">{note}</text>')
        H = ny + 26
    # stacked
    TW, tgap = 360, 52
    tall = "".join(card(0, i * (ch + tgap) + 2, TW, c) for i, c in enumerate(columns))
    for i in range(len(columns) - 1):
        y1 = (i + 1) * ch + i * tgap + 10
        tall += f'<line x1="{TW // 2}" x2="{TW // 2}" y1="{y1}" y2="{y1 + tgap - 18}" stroke="#ffa630" stroke-width="2" marker-end="url(#fa-t)"/>'
    TH = len(columns) * (ch + tgap) - tgap + 4
    if note:
        TH += 18
        tall += f'<foreignObject x="0" y="{TH}" width="{TW}" height="80"><p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:10px 14px;border:1.5px dashed #6f6553;border-radius:14px;color:#ebe3d3;font:15px/1.35 {sans}">{note}</p></foreignObject>'
        TH += 84
    return (f'<figure class="flow" role="img" aria-label="{label}">'
            f'<svg class="flow-wide" viewBox="-2 0 {W + 4} {H}" aria-hidden="true"><defs>{arrow("fa-w")}</defs>{wide}</svg>'
            f'<svg class="flow-tall" viewBox="-2 0 {TW + 4} {TH}" aria-hidden="true"><defs>{arrow("fa-t")}</defs>{tall}</svg></figure>')

def security_flow(lang):
    tr = lang == "tr"
    cols = [{"title": "MetaTrader 5", "tag": "Kalibre Bridge", "items": ["Şifreler: AES-256-CTR", "İmzalar: HMAC-SHA256"] if tr else ["Encrypts: AES-256-CTR", "Signs: HMAC-SHA256"]},
            {"title": "Röle sunucusu" if tr else "Relay server", "tag": "kalibremarkets.com", "items": ["Yalnız şifreli paket tutar", "2 saat içinde siler"] if tr else ["Holds ciphertext only", "Deletes within 2 hours"]},
            {"title": "Tarayıcın" if tr else "Your browser", "tag": "Kalibre Lab", "items": ["İmzayı doğrular", "Çözer ve gösterir"] if tr else ["Checks the signature", "Decrypts and shows"], "accent": True}]
    note = ("Eşleştirme kodu: MT5'te ve tarayıcında kalır, sunucularımıza gönderilmez" if tr else
            "Pairing code: kept in MT5 and your browser, never sent to our servers")
    label = ("MT5 verisi terminalde şifrelenir, röle yalnız şifreli paketi tutar, tarayıcın doğrulayıp çözer" if tr else
             "MT5 data is encrypted in the terminal, the relay holds only ciphertext, your browser verifies and decrypts it")
    return flow_diagram(cols, label, note)

def security_hero(lang):
    tr = lang == "tr"
    return page_hero(T_(lang, "Encrypted before it leaves MT5.", "MT5'ten çıkmadan şifreli."),
                     T_(lang, "Our relay carries your MT5 data. It cannot read it.", "Rölemiz MT5 verini taşır. Okuyamaz."),
                     "", security_flow(lang), media_cls="diagram")

def T_(lang, en, tr):
    return tr if lang == "tr" else en

# ------------------------------------------------------------------ kurulum
KURULUM = '''
<h1>Kurulum</h1>
<p class="giris">MetaTrader 5'i Kalibre Lab'e Kalibre Bridge eklentisi, bir eşleştirme kodu ve tek bir MT5 ayarıyla bağlarsın. Kurulum bir kez yapılır. Sonrasında eklenti, MT5 açık olduğu sürece laboratuvara veri gönderir.</p>
<div class="kutu yesil">İlk kurulumu bir <b>demo hesapta</b> yap. Kalibre Bridge salt okunurdur ve demo hesapta aracı parayı riske atmadan tanırsın.</div>

<h2 id="gerekenler">Gerekenler</h2>
<ul>
  <li>MetaTrader 5. Windows'ta aracı kurumunun kurulum dosyası, macOS'ta MetaQuotes'un resmi uygulaması yeterli.</li>
  <li>Herhangi bir aracı kurumda demo ya da gerçek bir MT5 hesabı.</li>
  <li>Kalibre Bridge eklentisi (<code>KalibreKopru.ex5</code>) ve lisans anahtarın. İkisi de abone olduktan sonra <a href="/tr/account">Hesabım</a> sayfasındadır.</li>
</ul>

<h2 id="eklenti">1. Eklentiyi MetaTrader 5'e ekle</h2>
<ol>
  <li>MT5'te <b>File &gt; Open Data Folder</b> menüsünü aç (Türkçe menüde <b>Dosya &gt; Veri Klasörünü Aç</b>).</li>
  <li><code>MQL5\\Experts</code> klasörüne gir ve <code>KalibreKopru.ex5</code> dosyasını buraya kopyala.</li>
  <li>MT5'e dön. <b>Navigator</b> penceresinde <b>Expert Advisors</b> başlığına sağ tıklayıp <b>Refresh</b> de. Listede <b>KalibreKopru</b> görünür.</li>
</ol>

<h2 id="kod">2. Laboratuvarda eşleştirme kodunu üret</h2>
<ol>
  <li><a href="/tr/connect">MetaTrader 5'i bağla</a> sayfasını aç. Adımlar orada sırayla gösterilir.</li>
  <li>Tarayıcın bir eşleştirme kodu üretir. <b>Kopyala</b> düğmesiyle kopyala.</li>
</ol>
<p>Kod <code>KLB1</code> ile başlar. Kalibre Bridge şifreleme anahtarını bu koddan türetir. Kod bu tarayıcıda ve eklentinin ayarlarında saklanır, sunucularımıza gönderilmez. Kodu kimseyle paylaşma.</p>

<h2 id="grafik">3. Eklentiyi bir grafiğe ekle</h2>
<ol>
  <li>Navigator'da <b>KalibreKopru</b>'yu herhangi bir grafiğin üzerine sürükle.</li>
  <li>Açılan pencerede <b>Inputs</b> sekmesine geç.</li>
  <li><b>Eşleştirme kodu</b> satırına laboratuvardaki kodu yapıştır.</li>
  <li><b>Lisans anahtarı</b> satırına <a href="/tr/account">Hesabım</a> sayfasındaki <code>KLM-</code> ile başlayan anahtarı yapıştır.</li>
  <li><b>Semboller</b> satırına izlemek istediklerini virgülle yaz, ör. <code>EURUSD,GBPUSD,XAUUSD</code>. Boş bırakırsan eklenti Market Watch'taki ilk 12 sembolü kullanır.</li>
  <li><b>Zaman dilimi</b> olarak M1, M5, M15, M30, H1, H4, D1 ya da W1 seç ve <b>OK</b> de.</li>
</ol>
<p>Kalibre Bridge emir açamaz, değiştiremez, kapatamaz. Bu yüzden MT5'te <b>Algo Trading</b> kapalı kalabilir.</p>

<h2 id="izin">4. MetaTrader 5'te Kalibre adresine izin ver</h2>
<p>MT5, eklentilerin sadece izin verdiğin adreslere bağlanmasına izin verir. Kalibre adresini bir kez eklersin.</p>
<ol>
  <li><b>Tools &gt; Options</b> menüsünü aç (Türkçe menüde <b>Araçlar &gt; Seçenekler</b>).</li>
  <li><b>Expert Advisors</b> sekmesine geç (<b>Uzman Danışmanlar</b>).</li>
  <li><b>Allow WebRequest for listed URL</b> kutusunu işaretle.</li>
  <li>Listeye <code>https://kalibremarkets.com</code> adresini ekle.</li>
  <li><b>OK</b> düğmesine bas. Pencereyi çarpıyla kapatırsan izin kaydedilmez.</li>
</ol>

<h2 id="dogrula">5. Bağlantıyı doğrula</h2>
<p>Grafiğin sol üst köşesinde <b>Kalibre Bridge</b> satırı görünür. Eklenti önce lisansı kontrol eder, bu birkaç saniye sürer. Sonra veri göndermeye başlar. Durum <b>bağlı</b> olduğunda gönderilen belge sayısı artar. Laboratuvar bağlantı durumunu, aracı kurumunun adını ve son kalp atışının zamanını gösterir.</p>
<p>Seriler yeni bir mum kapandığında güncellenir. H1 seçtiysen saatte bir, D1 seçtiysen günde bir.</p>

<h2 id="sorunlar">Sık karşılaşılan durumlar</h2>
<table class="tablo">
  <thead><tr><th>Grafikte görünen</th><th>Ne yapmalı</th></tr></thead>
  <tbody>
    <tr><td>WebRequest izni yok</td><td>4. adımı tekrarla. Adresin tam olarak <code>https://kalibremarkets.com</code> yazıldığından ve <b>OK</b>'e basıldığından emin ol.</td></tr>
    <tr><td>Eklenti grafiğe eklenmiyor, kod hatası uyarısı çıkıyor</td><td>Kodu laboratuvardan yeniden kopyala. Başında ya da sonunda eksik karakter kalmış olabilir.</td></tr>
    <tr><td>Röleye ulaşılamadı</td><td>İnternet bağlantını kontrol et. Eklenti birkaç saniyede bir yeniden dener.</td></tr>
    <tr><td>Lisans geçersiz</td><td>Anahtarı <a href="/tr/account">Hesabım</a> sayfasından yeniden kopyala. Aboneliğin bittiyse ya da anahtar zaten iki MT5 hesabında kullanılıyorsa bu uyarıyı görürsün. Eklenti dakikada bir yeniden dener.</td></tr>
    <tr><td>Laboratuvar "kod eşleşmiyor" diyor</td><td>Eklentideki kod ile laboratuvardaki kod farklı. Laboratuvarda yeni kod ürettiysen eklentiye de yenisini yapıştır.</td></tr>
    <tr><td>Bağlantı bir süre sonra kopuyor</td><td>Kalibre Bridge, MT5 açık ve bilgisayar uyanıkken çalışır. Bilgisayar uykuya geçince veri akışı durur, MT5 yeniden açılınca kendiliğinden devam eder.</td></tr>
  </tbody>
</table>

<h2 id="tradier">Tradier (ABD) ile bağlanmak</h2>
<p>ABD'deki aracı kurum Tradier'de hesabın varsa MetaTrader 5 yerine onu da bağlayabilirsin. Eklenti gerekmez; laboratuvar Tradier'e doğrudan senin tarayıcından bağlanır.</p>
<ol>
  <li>Tradier hesabında bir API erişim token'ı oluştur. İlk deneme için <b>Sandbox</b> token'ı öneririz; Sandbox fiyatları 15 dakika gecikmelidir.</li>
  <li><a href="/lab/connect?kaynak=tradier&lang=tr">Bağlantı sayfasında</a> <b>Tradier</b> sekmesini seç, token'ı yapıştır, ortamı seç ve <b>Bağlan</b>'a bas.</li>
  <li>Birden çok hesabın varsa birini seç. Pano, strateji kurucu ve optimizasyon artık Tradier verisini kullanır.</li>
</ol>
<div class="kutu">Tradier token'ı hesabına tam erişim verir. Kalibre bu token'la sadece okuma isteği yapar, emir göndermez. Token bu tarayıcıda saklanır ve sadece Tradier'e gönderilir. Kalibre sunucularına gönderilmez. Bağlantıyı kestiğinde bu tarayıcıdan silinir. Tradier'in koşullarına göre bu bağlantı kişisel kullanım içindir.</div>

<h2 id="alpaca">Alpaca (ABD) ile bağlanmak</h2>
<p>ABD'deki aracı kurum Alpaca'da hesabın varsa onu da bağlayabilirsin. Eklenti gerekmez; laboratuvar Alpaca'ya doğrudan senin tarayıcından bağlanır.</p>
<ol>
  <li>Alpaca panelinde bir API anahtar çifti oluştur (Key ID ve Secret). İlk deneme için <b>Paper</b> (sanal) hesabı öneririz.</li>
  <li><a href="/lab/connect?kaynak=alpaca&lang=tr">Bağlantı sayfasında</a> <b>Alpaca</b> sekmesini seç, iki anahtarı yapıştır, ortamı seç ve <b>Bağlan</b>'a bas.</li>
  <li>Pano, strateji kurucu ve optimizasyon artık Alpaca verisini kullanır. İzleme listen boşsa açık pozisyonların, o da yoksa Pano'da eklediğin semboller gösterilir.</li>
</ol>
<div class="kutu">Ücretsiz Alpaca planında anlık fiyatlar sadece IEX borsasından gelir. Bu, toplam piyasa hacminin küçük bir kısmıdır. Kalibre anahtarlarınla sadece okuma isteği yapar, emir göndermez. Anahtarlar bu tarayıcıda saklanır ve sadece Alpaca'ya gönderilir. Kalibre sunucularına gönderilmez. Bağlantıyı kestiğinde bu tarayıcıdan silinir. Kendi kişisel API anahtarlarını kullan.</div>

<div class="kutu">Kalibre Lab beta sürümündedir. Kurulumdan önce <a href="/tr/risk-disclosure">risk bildirimini</a> oku ve önce demo hesap kullan.</div>

<h2 id="eklentisiz">Eklentisiz çalışmak</h2>
<p>MT5'ten dışa aktardığın bir mum dosyasını (CSV ya da JSON) laboratuvara da sürükleyebilirsin. Tarayıcın dosyayı yerelde okur, dosya yüklenmez.</p>
'''
sayfa("tr/setup/index.html", "Kurulum: MetaTrader 5'i Kalibre Lab'e bağla", "Kalibre Bridge eklentisini MetaTrader 5'e kurma, eşleştirme kodunu ve lisans anahtarını girme, WebRequest iznini verme adımları.", "/tr/setup", KURULUM,
      icindekiler(KURULUM) + '<p>Takıldığın bir adım olursa <a href="/iletisim/" style="display:inline">bize yaz</a>.</p>')

# ------------------------------------------------------------------ güvenlik
GUVENLIK = '''
<h1>Güvenlik</h1>
<p class="giris">Kalibre Bridge, MetaTrader 5 verini göndermeden önce bilgisayarında şifreler. Röle sunucumuz sadece şifreli paketleri saklar ve bunları çözemez. Bu sayfa kullandığımız yöntemleri ve sınırlarını listeler.</p>

<h2 id="kisaca">Özet</h2>
<ul>
  <li>Kalibre Bridge salt okunurdur. Emir açamaz, değiştiremez, kapatamaz.</li>
  <li>Her paket AES-256-CTR ile şifrelenir ve HMAC-SHA256 ile imzalanır.</li>
  <li>Anahtarlar eşleştirme kodundan türetilir. Kod sunucularımıza gönderilmez.</li>
  <li>Röle sunucusu her paketi en geç 2 saat içinde siler.</li>
  <li>Kalibre MT5 şifreni hiçbir zaman istemez.</li>
  <li>Lisans kontrolü, lisans anahtarını ve MT5 hesap numaranı lisans sunucumuza gönderir.</li>
</ul>

<h2 id="kod">Eşleştirme kodu</h2>
<p>Eşleştirme kodu, tarayıcının kriptografik rastgele sayı üreteciyle oluşturulan 32 baytlık bir sırdır. <code>KLB1</code> ile başlar. Kod iki yerde saklanır: bu tarayıcının yerel deposunda ve MT5'te eklentinin ayarlarında.</p>
<p>Koddan HMAC-SHA256 ile üç anahtar türetilir: paketleri bulmaya yarayan bir <b>kanal kimliği</b>, bir <b>şifreleme anahtarı</b> ve bir <b>imza anahtarı</b>. Sunucu sadece kanal kimliğini görür. Kod ve diğer iki anahtar kanal kimliğinden hesaplanamaz.</p>

<h2 id="sifreleme">Şifreleme ve imza</h2>
<ul>
  <li>İçerik CTR kipinde AES-256 ile şifrelenir. Her paket yeni bir başlangıç değeri (nonce) kullanır.</li>
  <li>Her paket HMAC-SHA256 ile imzalanır. İmza kanal kimliğini, paketin yuvasını ve şifreli içeriği kapsar.</li>
  <li>Tarayıcın şifreyi çözmeden önce imzayı doğrular. Değiştirilmiş, başka yuvaya taşınmış ya da başka bir kodla imzalanmış paketi reddeder.</li>
  <li>Sembol adları şifrelenir. Paket adları hangi sembolleri izlediğini göstermez.</li>
</ul>
<p>Protokol üç ayrı yerde uygulanır: MT5 eklentisinde, laboratuvarda ve bağımsız bir referans uygulamasında. Otomatik testler, üçünün aynı girdiden aynı paketi ürettiğini kontrol eder.</p>

<h2 id="sunucu">Röle sunucusu</h2>
<table class="tablo">
  <thead><tr><th>Röle sunucusunun gördüğü</th><th>Göremediği</th></tr></thead>
  <tbody>
    <tr><td>Şifreli paketler</td><td>Semboller, fiyatlar, mumlar</td></tr>
    <tr><td>Paket boyutu ve geliş zamanı</td><td>Pozisyonlar, bakiye, işlem geçmişi</td></tr>
    <tr><td>Kanal kimliği</td><td>Aracı kurum ve sunucu adı</td></tr>
    <tr><td>İletim sırasında bağlantının IP adresi</td><td>Eşleştirme kodun</td></tr>
  </tbody>
</table>
<p>Sunucu her paketin biçimini kontrol eder ve kısa ömürlü bir depoda tutar. Aynı türden yeni bir paket eskisinin yerini alır ve her paket en geç 2 saat içinde silinir. Paket içerikleri günlüklere yazılmaz. Kanal başına yazma sayısı sınırlıdır.</p>

<h2 id="eklenti">Kalibre Bridge'in okuduğu veriler</h2>
<p>Kalibre Bridge aşağıdaki bilgileri MT5'ten okur, şifreler ve gönderir. Pozisyonları, fiyatları ve işlem geçmişini eklentinin ayarlarından kapatabilirsin.</p>
<ul>
  <li>Sembollerinin kapanmış mumları: zaman, açılış, en yüksek, en düşük, kapanış ve tik hacmi. Semboller ayarı boşsa Market Watch'taki ilk 12 sembol kullanılır.</li>
  <li>En çok 40 sembol için Market Watch fiyatları: alış, satış, zaman ve açıklama.</li>
  <li>Açık pozisyonlar: sembol, yön, lot, açılış zamanı ve fiyatı, güncel fiyat, stop, hedef, kâr ve sihirli numara (magic number).</li>
  <li>Son 90 günün kapanmış işlemleri (süre ayarlanabilir): sembol, yön, lot, açılış ve kapanış zamanı ile fiyatı, kâr, swap, komisyon, ücretler, sihirli numara ve yorum.</li>
  <li>Aynı dönemdeki para yatırma, çekme ve diğer bakiye işlemleri, tutar ve zamanıyla.</li>
  <li>Hesabın para birimi, bakiyesi ve varlığı (equity).</li>
  <li>Aracı kurum adı, sunucu adı ve hesap türü (demo, gerçek ya da yarışma).</li>
</ul>
<p>Kalibre Bridge MT5 şifreni ve kişisel bilgilerini okumaz. Şifreli veri hesap numaranı içermez.</p>

<h2 id="lisans">Lisans kontrolü</h2>
<p>Kalibre Bridge ve Kalibre Engine lisansını lisans sunucumuzla kontrol eder. İstek lisans anahtarını, MT5 hesap numaranı, ürün adını ve eklentinin dilini içerir. Her lisansa bağlı MT5 hesap numaralarını, lisans başına en çok 2 tane olmak üzere saklarız. Bu istek şifreli veri kanalından ayrıdır.</p>

<h2 id="araci">Alpaca ve Tradier</h2>
<p>Alpaca ve Tradier API anahtarların ve token'ların bu tarayıcıda saklanır ve sadece Alpaca'ya ya da Tradier'e gönderilir. Kalibre sunucularına gönderilmez. Kalibre bunlarla sadece okuma isteği yapar.</p>

<h2 id="sinirlar">Sınırlar</h2>
<ul>
  <li><b>Eşleştirme kodunu bilen herkes verini okuyabilir.</b> Kodu paylaşma. Değiştirmek için laboratuvarda yeni kod üret ve eklentiye yapıştır. Eklenti bundan sonra eski kodu kullanmaz.</li>
  <li><b>Cihaz güvenliği senin sorumluluğundadır.</b> Bilgisayarına ya da tarayıcına erişen biri çözülmüş veriyi görebilir.</li>
  <li><b>Trafik üst verisi görünür.</b> Sunucu her kanalın paket boyutunu ve zamanını görür.</li>
</ul>
<p>Bir güvenlik açığı bildirmek için <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a> adresine yaz.</p>
'''
sayfa("tr/security/index.html", "Güvenlik: Kalibre Lab", "Kalibre Bridge MetaTrader 5 verisini nasıl şifreler, röle ve lisans sunucularımız neyi alır, korumanın sınırları nelerdir.", "/tr/security", GUVENLIK.replace("<h1>Güvenlik</h1>\n", "", 1), icindekiler(GUVENLIK), hero=security_hero("tr"))

# ------------------------------------------------------------------ metodoloji
METODOLOJI = '''
<h1>Metodoloji</h1>
<p class="giris">Bu sayfa laboratuvarın verisinin nereden geldiğini, Hızlı Backtest'in sonuçları nasıl hesapladığını ve neyi hesaba katmadığını anlatır.</p>

<h2 id="veri">Veri nereden gelir?</h2>
<p>Kalibre piyasa verisi yayınlamaz. Laboratuvardaki her seri aşağıdaki kaynaklardan birinden gelir ve kaynak serinin üzerinde yazar:</p>
<table class="tablo">
  <thead><tr><th>Kaynak</th><th>Etiket</th><th>Açıklama</th></tr></thead>
  <tbody>
    <tr><td>Örnek seri</td><td>ÖRNEK</td><td>Tohumlu bir rastgele süreçle üretilir; laboratuvarı tanımak içindir.</td></tr>
    <tr><td>Kendi dosyan</td><td>KENDİ VERİN</td><td>MT5'ten ya da başka bir yerden dışa aktardığın dosya. Tarayıcın dosyayı yerelde okur.</td></tr>
    <tr><td>Kalibre Bridge</td><td>MT5 ve aracı kurum adı</td><td>MT5 hesabının fiyat geçmişi, uçtan uca şifreli (<a href="/tr/security">güvenlik</a>).</td></tr>
    <tr><td>Alpaca, Tradier</td><td>Aracı kurum adı</td><td>Tarayıcının kendi API anahtarınla istediği fiyat geçmişi.</td></tr>
  </tbody>
</table>
<p>Eğitim yazılarındaki rakamlar kamuya açık kaynaklardan bir kez alınır. Kaynak ve tarih yazıda belirtilir, rakamlar güncellenmez.</p>

<h2 id="zaman">Mum zamanları</h2>
<p>MT5'ten gelen mum zamanları aracı kurumunun sunucu saatidir, yani MT5 grafiğinde gördüğün saat. Bunları UTC'ye çevirmeyiz: geçmiş mumları bugünkü saat farkıyla çevirmek, yaz saati geçişlerinde bir saatlik kaymaya yol açar. Laboratuvar sunucu saatinin UTC'ye göre farkını ayrıca gösterir.</p>

<h2 id="prova">Hızlı Backtest nasıl çalışır?</h2>
<p>Hızlı Backtest kuralını tarayıcında, MetaTrader 5'teki Kalibre Engine ile aynı kurallarla çalıştırır:</p>
<ul>
  <li>Kurallar yeni mumun açılışında, son kapanmış mumla değerlendirilir. Kesişme kuralları son iki mumu kullanır. Gelecekteki bir mum hiçbir zaman kullanılmaz.</li>
  <li>Önce çıkış kuralları, sonra giriş kuralları değerlendirilir. Ters yönde bir sinyal, açık pozisyonu kapatır.</li>
  <li>Aynı mumda iki yönde de sinyal varsa işlem açılmaz.</li>
  <li>Lot, bakiye, işlem başına risk yüzdesi, oynaklık ölçeği ve stop mesafesinden hesaplanır.</li>
</ul>
<p>Yaklaşık olanlar:</p>
<ul>
  <li>Bir mumun içinde fiyatın hangi sırayla hareket ettiği bilinmez. Aynı mumda hem stop hem hedef görülürse stop sayılır; bu ihtiyatlı bir varsayımdır.</li>
  <li>İz süren stop mum kapanışında güncellenir.</li>
  <li>Spread, komisyon ve kayma isteğe bağlıdır, varsayılan değerleri sıfırdır. Swap hesaba katılmaz. Haber filtresi yoktur.</li>
</ul>
<div class="kutu">Hızlı Backtest'i fikir elemek için kullan. Bir kuralı aynı kural dosyasıyla, aracı kurumunun maliyetleriyle MT5 Strategy Tester'da doğrula.</div>

<h2 id="oynaklik">Oynaklık modelleri</h2>
<p>Oynaklık laboratuvarı üç ölçü sunar. EWMA, son getirilere üstel ağırlık verir (RiskMetrics yaklaşımı). Yang-Zhang, açılış, kapanış ve mum içi aralığı birlikte kullanır. GARCH, oynaklığın kümelenmesini ve uzun dönem düzeyine dönüşünü modeller; parametreler kendi verinde en çok olabilirlikle tahmin edilir.</p>

<h2 id="yorum">Sonuçları nasıl okumalı?</h2>
<ul>
  <li>Getiriyi en büyük düşüşle (max drawdown) birlikte oku.</li>
  <li>Az sayıda işlemden çıkan sonuç tesadüf olabilir.</li>
  <li>Çok sayıda ayar deneyip en iyisini seçmek kuralı geçmişe uydurur. Seçtiğin ayarı kullanmadığın bir dönemde test et.</li>
  <li>Geçmiş sonuçlar gelecekteki sonuçları göstermez.</li>
</ul>
'''
sayfa("tr/methodology/index.html", "Metodoloji: Kalibre Lab", "Kalibre Lab'deki verinin kaynağı, Hızlı Backtest'in çalışma biçimi, oynaklık modelleri ve sonuçların okunması.", "", METODOLOJI, icindekiler(METODOLOJI))

# ------------------------------------------------------------------ hakkında
HAKKINDA = '''
<h1>Kalibre Markets hakkında</h1>
<p class="giris">Kalibre Markets yatırımcılar için yazılım geliştirir. İlk ürünümüz Kalibre Lab; MetaTrader 5, Alpaca ve Tradier hesapları için bir backtest ve risk aracıdır.</p>

<h2 id="urun">Kalibre Lab</h2>
<ul>
  <li><b>Strateji Kurucu ve Hızlı Backtest:</b> giriş ve çıkış kurallarını kur, verinde tarayıcıda test et.</li>
  <li><b>Optimizasyon:</b> parametreleri ayrı eğitim ve test dönemleriyle tara.</li>
  <li><b>Pano:</b> bağlı hesabının bakiyesi, pozisyonları, fiyatları ve kapanmış işlemleri.</li>
  <li><b>Kalibre Bridge ve Kalibre Engine:</b> şifreli veri eşitleme ve kural dosyasını çalıştırma için MT5 eklentileri.</li>
  <li><b>Prop Kalkanı:</b> prop firması sınavları için günlük ve toplam kayıp sınırları.</li>
</ul>

<h2 id="ilkeler">Nasıl çalışırız?</h2>
<ul>
  <li><b>Piyasa verisi yayınlamayız.</b> Laboratuvar hesabının verisini, kendi dosyalarını ya da SENTETİK etiketli örnekleri kullanır.</li>
  <li><b>Kalibre Bridge verisi uçtan uca şifrelidir.</b> Sunucularımız bu veriyi çözemez (<a href="/tr/security">güvenlik</a>).</li>
  <li><b>Yöntem belgelenir.</b> Her rakamın nasıl hesaplandığını ve neyi dışarıda bıraktığını yazarız (<a href="/tr/methodology">metodoloji</a>).</li>
  <li><b>Sinyal satmayız, tavsiye vermeyiz.</b> Kuralları ve işlemleri sen seçersin.</li>
</ul>

<h2 id="yasal">Yasal</h2>
<p>Kalibre Lab bir yazılımdır. Kalibre Markets aracı kurum, yatırım danışmanı ya da portföy yöneticisi değildir. Müşteri parası tutmaz ve yatırım tavsiyesi vermez. Gerçek ya da simülasyon olsun, geçmiş performans gelecekteki sonuçların göstergesi değildir.</p>

<h2 id="iletisim">İletişim</h2>
<p>Soru, öneri ya da hata bildirimi için <a href="/iletisim">iletişim sayfası</a>.</p>
'''
sayfa("tr/about/index.html", "Hakkında: Kalibre Markets", "Kalibre Markets yatırımcılar için yazılım geliştirir. Kalibre Lab; MetaTrader 5, Alpaca ve Tradier hesapları için backtest ve risk aracıdır.", "", HAKKINDA)

# ------------------------------------------------------------------ abonelik
PRO_MOTOR_TR = '<li>Demo ve gerçek hesapta Kalibre Engine. Gerçek hesapta kullanım <b>beta</b>dır; açık kabul ve kayıp sınırı ister (<a href="/tr/risk-disclosure">risk bildirimi</a>).</li>'
PRO_ACIK_TR = """  <label class="onay"><input type="checkbox" id="sartlar" required> <span><a href="/tr/terms">Hizmet Şartları</a>'nı ve <a href="/tr/refunds">İade ve İptal Politikası</a>'nı kabul ediyorum; <a href="/tr/privacy">Gizlilik Politikası</a>'nı okudum.</span></label>
  <label class="onay"><input type="checkbox" id="cayma" required> <span>Hizmete hemen erişim istiyorum. Lisans anahtarım bir MetaTrader 5 hesabında ilk kez etkinleştirildiğinde 14 günlük cayma hakkımı kaybedeceğimi anlıyorum (<a href="/tr/refunds#withdrawal">İade ve İptal Politikası, bölüm 4</a>).</span></label>
  <button type="button" class="dugme" id="abone-ol">Abone ol</button>
  <p class="not" id="odeme-durum" role="status"></p>
  <p class="not">Ödemeden önce Kalibre Markets hesabına giriş yaparsın. Hesabın yoksa bu adımda oluşturulur. Ödemeler Stripe tarafından işlenir, kart bilgilerin bize ulaşmaz. İstediğin zaman <a href="/tr/account">Hesabım</a> sayfasından iptal et. Erişim dönem sonuna kadar sürer.</p>"""
PRO_KAPALI_TR = """  <div class="yakinda">
    <h3>Abonelikler yakında açılıyor</h3>
    <p>Kalibre Lab beta sürümündedir. Planlanan lansman fiyatı aylık 19 USD. Abonelikler açıldığında haber almak için bekleme listesine katıl.</p>
    <div class="eylem-satir"><a class="dugme" href="#bekleme">Listeye katıl</a><a class="dugme ikincil" href="mailto:markets@kalibrefin.com?subject=Kalibre%20Lab%20beta%20erisimi">Beta erişimi iste</a></div>
    <p><b>Davetli misin?</b> Giriş yap ve sana gönderilen beta lisansını <a href="/tr/account">Hesabım</a> sayfasında hesabına bağla.</p>
  </div>"""
PLAN_SECIM = ('<div id="odeme-acik">\n' + PRO_ACIK_TR + '\n</div>\n' + PRO_KAPALI_TR.replace('<div class="yakinda">', '<div class="yakinda" id="odeme-yakinda" hidden>')) if ODEME_ACIK else PRO_KAPALI_TR
PRO = f"""
<h1>Fiyat</h1>
<p class="giris">Backtest ücretsizdir. Lansmanda abonelik; Kalibre Engine, Prop Kalkanı ve MetaTrader 5 canlı veri köprüsünü ekleyecek.</p>

<div class="plan" id="plan">
  <div class="plan-bas">
    <h2>Kalibre Lab <span class="rozet-beta">beta</span></h2>
    <p class="fiyat"><span class="sayi">19 USD</span> / ay, lansmanda <span class="not">Euro ile de: 17 EUR / ay. Ödeme sayfası fiyatı senin para biriminde gösterir.</span></p>
  </div>
  <ul>
    <li>Lisans başına 2 MT5 hesabı</li>
    {PRO_MOTOR_TR}
    <li>FTMO ve The5ers ön ayarlı Prop Kalkanı</li>
    <li>Kalibre Bridge: MT5'ten Pano'ya ve laboratuvara şifreli canlı veri</li>
    <li>Ücretsiz plandaki her şey</li>
  </ul>
{PLAN_SECIM}
</div>

<h2 id="ucretsiz">Ücretsiz</h2>
<ul>
  <li>SENTETİK örnek serilerle ve kendi dosyalarınla laboratuvar</li>
  <li>Strateji Kurucu, Hızlı Backtest ve Oynaklık Laboratuvarı</li>
  <li>MT5 Strategy Tester'da Kalibre Engine, lisans gerekmeden</li>
  <li>Eğitim yazıları, grafik okuma testi ve önyargı testi</li>
</ul>

<h2 id="bekleme">{"Henüz karar vermedin mi?" if ODEME_ACIK else "Bekleme listesi"}</h2>
<p>{"Yeni özellikler çıktığında haber almak için e-postanı bırakabilirsin." if ODEME_ACIK else "Abonelikler açıldığında ve yeni özellikler çıktığında sana e-posta göndeririz."}</p>
<div class="bekleme">
  <p id="ok-msg" hidden><b>Listedesin.</b> {"Yeni özellikler çıktığında" if ODEME_ACIK else "Abonelikler açıldığında"} sana e-posta göndereceğiz.</p>
  <form action="https://formsubmit.co/markets@kalibrefin.com" method="POST" id="wl-form">
    <input type="hidden" name="_subject" value="Kalibre Lab bekleme listesi: yeni kayıt">
    <input type="hidden" name="_next" value="https://kalibremarkets.com/tr/pricing?ok=1">
    <input type="hidden" name="_captcha" value="false">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
    <label for="eposta">E-posta adresin</label>
    <div class="satir">
      <input type="email" id="eposta" name="email" required autocomplete="email">
      <button type="submit" class="dugme{" ikincil" if ODEME_ACIK else ""}">Listeye katıl</button>
    </div>
    <label class="onay"><input type="checkbox" name="onay" value="evet" required> <span>Kalibre Markets'in Kalibre Lab hakkında e-posta göndermesini kabul ediyorum. İstediğim zaman listeden çıkabilirim.</span></label>
  </form>
  <p class="not">E-postan yalnız bunun için kullanılır ve FormSubmit hizmeti aracılığıyla bize iletilir. Listeden çıkmak için <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a> adresine yazman yeterli.</p>
</div>

<div class="kutu">Kalibre Lab bir yazılımdır. Kalibre Markets aracı kurum ya da yatırım danışmanı değildir ve yatırım tavsiyesi vermez. Kalibre Engine yalnızca sizin kurduğunuz kural dosyasıyla, seçtiğiniz hesapta ve siz başlattıktan sonra emir gönderir. Önce demo hesapta deneyin. Tüm işlemlerin sorumluluğu size aittir. Ayrıntılar <a href="/tr/risk-disclosure">risk bildiriminde</a>.</div>
"""
PRO_STIL = """
.plan { background: var(--zemin-2); border: 1px solid var(--cizgi-2); border-top: 3px solid var(--yesil); border-radius: 6px; padding: 26px 28px; margin: 8px 0 32px; }
.plan-bas { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; border-bottom: 1px solid var(--cizgi); padding-bottom: 14px; margin-bottom: 14px; }
.plan-bas h2 { margin: 0; font-size: 26px; }
.fiyat { margin: 0; color: var(--soluk); }
.fiyat .sayi { font-size: 28px; color: var(--metin); }
.plan ul { margin: 0 0 20px; }
.onay { display: flex; gap: 10px; align-items: flex-start; font-size: 15px; color: var(--soluk); margin-bottom: 16px; cursor: pointer; }
.onay input { margin-top: 4px; width: 18px; height: 18px; accent-color: var(--yesil); }
#odeme-durum:empty { display: none; }
.yakinda { border-top: 1px solid var(--cizgi); padding-top: 14px; }
.yakinda h3 { margin: 0 0 6px; font-size: 20px; color: var(--kehribar); }
.yakinda p { margin: 0 0 8px; color: var(--soluk); }
.rozet-beta { font: 600 12px var(--sans); color: #08130f; background: var(--kehribar); border-radius: 4px; padding: 2px 8px; vertical-align: middle; margin-left: 6px; }
#odeme-durum { color: var(--kehribar); }
.bekleme { background: var(--zemin-2); border: 1px solid var(--cizgi); border-radius: 6px; padding: 22px 24px; margin: 8px 0 24px; }
.bekleme label { display: block; font-size: 15px; color: var(--soluk); margin-bottom: 8px; }
.bekleme .satir { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.bekleme input[type=email] { flex: 1 1 240px; min-height: 44px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin); color: var(--metin); font: 400 16px var(--sans); }
.bekleme #ok-msg { color: var(--yesil); }
.eylem-satir { display: flex; gap: 12px; flex-wrap: wrap; margin: 8px 0 12px; }
"""
PRO_BETIK_KAPALI = """<script>
if (new URLSearchParams(location.search).get('ok') === '1') { document.getElementById('ok-msg').hidden = false; document.getElementById('wl-form').hidden = true; }
</script>"""
PRO_BETIK_ACIK = """<script>
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get('ok') === '1') { document.getElementById('ok-msg').hidden = false; document.getElementById('wl-form').hidden = true; }
  var durum = document.getElementById('odeme-durum');
  if (q.get('iptal') === '1') durum.textContent = 'Ödeme tamamlanmadı; kartından bir şey çekilmedi. İstediğin zaman yeniden deneyebilirsin.';
  var d = document.getElementById('abone-ol');
  if (q.get('abone') === '1') { var plan = document.getElementById('plan'); if (plan) plan.scrollIntoView({ block: 'start' }); }
  d.addEventListener('click', async function () {
    if (!document.getElementById('sartlar').checked) { durum.textContent = 'Devam etmek için hizmet şartlarını ve iade ve iptal politikasını onaylamalısın.'; return; }
    if (!document.getElementById('cayma').checked) { durum.textContent = 'Devam etmek için cayma hakkına ilişkin onay kutusunu işaretlemelisin.'; return; }
    d.disabled = true; d.textContent = 'Ödeme sayfası açılıyor';
    durum.textContent = '';
    var A = window.KalibreAuth; // ertelenmiş betik: tıklama anında okunur
    if (A) await A.ready();
    if (!A || !A.enabled) { durum.textContent = 'Hesaplar henüz açılmadı. Biraz sonra yeniden dene.'; d.disabled = false; d.textContent = 'Abone ol'; return; }
    // Abonelik bir hesaba bağlanır: giriş yoksa giriş sayfasına, sonra bu plana dönülür.
    if (!A.user()) { location.href = A.paths.signIn + '?sonra=' + encodeURIComponent(location.pathname + '?abone=1'); return; }
    var r = await A.api('/api/odeme/baslat', { body: { sartlar: true, cayma_onay: true } });
    if (r.ok && r.data && r.data.url) { location.href = r.data.url; return; }
    durum.textContent = (r.data && r.data.hata) || (r.status ? 'Ödeme sayfası açılamadı. Biraz sonra yeniden dene.' : 'Bağlantı kurulamadı. İnternet bağlantını kontrol edip yeniden dene.');
    d.disabled = false; d.textContent = 'Abone ol';
  });
})();
</script>"""
PRO_ODEME_YEDEK = """<script>
// Ödeme sunucuda yapılandırılmamışsa (503) "yakında" kartına düş.
(function () {
  var acik = document.getElementById('odeme-acik'), yakin = document.getElementById('odeme-yakinda');
  if (!acik || !yakin) return;
  fetch('/api/odeme/baslat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sartlar: false }) })
    .then(function (r) { if (r.status === 503) { acik.hidden = true; yakin.hidden = false; } })
    .catch(function () {});
})();
</script>"""
PRO_BETIK = (PRO_BETIK_ACIK + PRO_BETIK_KAPALI + PRO_ODEME_YEDEK) if ODEME_ACIK else PRO_BETIK_KAPALI
if ODEME_ACIK:  # while payments are closed, yerel/product-pages.py writes the pricing page
    sayfa("tr/pricing/index.html", "Fiyat: Kalibre Lab", ("Kalibre Lab aboneliği: Kalibre Engine, Prop Kalkanı ve şifreli MT5 veri köprüsü. Aylık 19 USD, istediğin zaman iptal." if ODEME_ACIK else "Kalibre Lab (beta): planlanan lansman fiyatı aylık 19 USD. Bekleme listesine katıl ya da beta erişimi iste."), "/tr/pricing", PRO, ek_stil=PRO_STIL, ek_betik=PRO_BETIK)

# ------------------------------------------------------------------ hesap
# Giriş (/tr/sign-in) ve Hesabım (/tr/account) sayfaları: yerel/hesap-uret.py (TR + EN).

# ------------------------------------------------------------------ prop trader
PROP = """
<h1>Prop Kalkanı: prop firması sınavları için kayıp sınırları</h1>
<p class="giris">Kalibre Engine günlük ve toplam kayıp sınırını her tikte kontrol eder. Sınıra yaklaşınca yeni işlem açmaz, güvenlik payında kendi pozisyonlarını kapatır.</p>
<div class="eylem-satir"><a class="dugme" href="/tr/pricing#bekleme">Listeye katıl</a><a class="dugme ikincil" href="#hesapla">Hesabını kontrol et</a></div>

<h2 id="nasil">Prop Kalkanı nasıl çalışır?</h2>
<ul>
  <li><b>Günlük ve toplam taban.</b> Günlük taban gün başı bakiyesine, toplam taban başlangıç ya da tepe bakiyeye göre hesaplanır. Yüksek olan geçerlidir. Gün firmanın saatiyle sıfırlanır, FTMO'da bu saat 00:00 CE(S)T'dir.</li>
  <li><b>Lot hesabı.</b> Yeni işlemin stoptaki kaybı ile açık pozisyonların stoplarına kalan risk, tabana olan mesafeyi aşamaz. Elle açtığın pozisyonlar da hesaba katılır.</li>
  <li><b>Önce durdurur, sonra kapatır.</b> Tabana güvenlik payının iki katı kalınca yeni işlem açılmaz. Bir kat kalınca Kalibre Engine kendi pozisyonlarını kapatır ve gün sıfırlanana kadar işlem açmaz.</li>
  <li><b>Haber kuralı.</b> Firma yüksek önemli haberler çevresinde işlemi kısıtlıyorsa o pencerede yeni işlem açılmaz.</li>
</ul>

<h2 id="on-ayarlar">Hazır kurallar</h2>
<table class="tablo">
  <thead><tr><th>Program</th><th>Günlük kayıp</th><th>Toplam kayıp</th><th>Kaynak</th></tr></thead>
  <tbody>
    <tr><td>FTMO 2-Step</td><td>%5</td><td>%10, sabit</td><td>Firma sayfası, 23.10.2026</td></tr>
    <tr><td>FTMO 1-Step</td><td>%3</td><td>%10, gün sonu bakiye tepesini izler</td><td>Firma sayfası, 23.10.2026</td></tr>
    <tr><td>FTMO Instant</td><td>%3</td><td>%10, bakiye tepesini gün içinde izler</td><td>Firma sayfası, 23.10.2026</td></tr>
    <tr><td>The5ers High Stakes</td><td>%5</td><td>%10</td><td>Firma sayfası, 23.10.2026; günlük hesap yöntemi yazmadığı için ihtiyatlı ayar</td></tr>
    <tr><td>Özel</td><td colspan="3">Başka bir firmadaysan kendi sınırlarını girersin.</td></tr>
  </tbody>
</table>
<p class="not">Firma kuralları değişebilir. Prop Kalkanı'nı açmadan önce ön ayarı hesabının koşullarıyla karşılaştır. "En iyi gün" gibi tutarlılık kuralları kapsanmaz.</p>

<h2 id="hesapla">Hesabını kontrol et</h2>
<p>Bu hesaplayıcı, Prop Kalkanı'nın yaptığı hesabı tek bir an için yapar. Değerler tarayıcında kalır.</p>
<div class="hesap" id="kalkan-hesap">
  <div class="alanlar">
    <label>Program<select name="program"><option value="ftmo2">FTMO 2-Step</option><option value="ftmo1">FTMO 1-Step</option><option value="ftmoi">FTMO Instant</option><option value="the5ers">The5ers High Stakes</option></select></label>
    <label>Başlangıç sermayesi<input name="baslangic" inputmode="decimal" value="100000"></label>
    <label>Bugünün başındaki bakiye<input name="gunbasi" inputmode="decimal" value="101200"></label>
    <label>Şu anki varlık (equity)<input name="varlik" inputmode="decimal" value="98400"></label>
    <label data-tepe hidden>En yüksek bakiye<input name="tepe" inputmode="decimal" value="102000"></label>
    <label>Açık pozisyonların stoplarına kalan risk<input name="acik" inputmode="decimal" value="0"></label>
    <label>Güvenlik payı (başlangıcın %)<input name="pay" inputmode="decimal" value="0.5"></label>
  </div>
  <div data-sonuc>
    <table class="tablo">
      <tbody>
        <tr><th>Günlük taban</th><td class="sayi" data-s="gunluk"></td></tr>
        <tr><th>Toplam kayıp tabanı</th><td class="sayi" data-s="azami"></td></tr>
        <tr><th>Geçerli taban</th><td class="sayi" data-s="taban"></td></tr>
        <tr><th>Tabana mesafe</th><td class="sayi" data-s="oda"></td></tr>
        <tr><th>Yeni işlemin taşıyabileceği en büyük risk</th><td class="sayi" data-s="risk"></td></tr>
      </tbody>
    </table>
    <p class="durum" data-s="durum"></p>
  </div>
</div>

<h2 id="deneme">Strategy Tester örneği</h2>
<p>Test düzeni: MT5 Strategy Tester'da bilerek yüksek riskli bir strateji. EURUSD M15, 1 Ocak - 1 Ekim 2026, 100.000 USD başlangıç bakiyesi, işlem başına bakiyenin %5'i risk.</p>
<table class="tablo">
  <thead><tr><th></th><th>Prop Kalkanı olmadan</th><th>Prop Kalkanı ile (FTMO 2-Step)</th></tr></thead>
  <tbody>
    <tr><td>En kötü günün kapanan kaybı</td><td class="sayi">18.900</td><td class="sayi">4.009</td></tr>
    <tr><td>Günlük sınır (5.000) aşıldı mı?</td><td>Evet, sınav kaybedilirdi</td><td>Hayır</td></tr>
    <tr><td>En düşük bakiye (toplam taban 90.000)</td><td class="sayi">94.432</td><td class="sayi">90.999</td></tr>
  </tbody>
</table>
<div class="kutu">Tarihsel simülasyon. Varsayımsal performansın doğal sınırları vardır, gerçek işlemleri temsil etmez. Prop Kalkanı'nın açık olduğu hesap dönemi zararla kapattı ve hiçbir sınırı aşmadı. Prop Kalkanı kaybı sınırlar, stratejiyi iyileştirmez.</div>

<h2 id="kapsam">Kapsam ve sınırlar</h2>
<ul>
  <li>Prop Kalkanı, Kalibre Engine'in bir parçasıdır. Kalibre Engine, Kalibre Lab'de kurduğun kural dosyasını hesabında çalıştırır. Kalibre sinyal satmaz.</li>
  <li>Kalibre bir prop firması değildir ve hiçbir prop firmasıyla bağlantılı değildir. Firma adları sadece kurallarını tanımlamak için kullanılır.</li>
  <li>Kayma ve boşluklu açılışlar (gap) stopun ötesinde kayba yol açabilir. Güvenlik payı bunun içindir.</li>
  <li>Prop Kalkanı beta sürümündedir ve garanti değildir. Gerçek hesapta kullanmadan önce <a href="/tr/risk-disclosure">risk bildirimini</a> oku.</li>
</ul>
"""
PROP_STIL = """
.eylem-satir { display: flex; gap: 12px; flex-wrap: wrap; margin: 8px 0 8px; }
.hesap { background: var(--zemin-2); border: 1px solid var(--cizgi-2); border-radius: 6px; padding: 22px 24px; margin: 8px 0 24px; }
.hesap .alanlar { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px 18px; margin-bottom: 14px; }
.hesap label { display: grid; gap: 6px; font-size: 14px; color: var(--soluk); }
.hesap input, .hesap select { min-height: 42px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin); color: var(--metin); font: 400 16px var(--mono); }
.hesap select { font-family: var(--sans); }
.hesap .tablo th { width: 55%; }
.durum { margin: 4px 0 0; font-weight: 600; }
.durum.iyi { color: var(--yesil); } .durum.uyari { color: var(--kehribar); } .durum.kotu { color: var(--kirmizi); }
"""
sayfa("tr/prop/index.html", "Prop Kalkanı: prop firması sınavları için kayıp sınırları", "Kalibre Engine günlük ve toplam kayıp sınırlarını her tikte kontrol eder, lotu kalan paya göre ayarlar ve tabana yaklaşınca durur. FTMO ve The5ers ön ayarları.", "/tr/prop", PROP, icindekiler(PROP), ek_stil=PROP_STIL, ek_betik='<script src="/static/kalkan-hesap.js" defer></script>')

# ------------------------------------------------------------------ bireysel forex
FOREX = """
<h1>Bireysel forex yatırımcıları için risk araçları</h1>
<p class="giris">İşlem başına risk belirle, lotu oynaklığa göre ayarla ve günlük kayıp sınırı ekle. Sonra kuralı bu ayarlarla aracı kurumunun verisinde test et.</p>
<div class="eylem-satir"><a class="dugme" href="/lab?lang=tr">Laboratuvarı aç</a><a class="dugme ikincil" href="/tr/setup">Kurulum rehberi</a></div>

<h2 id="neden">Pozisyon büyüklüğü neden önemli?</h2>
<ul>
  <li><b>Bireysel CFD hesaplarının çoğu para kaybeder.</b> Avrupa Menkul Kıymetler ve Piyasalar Otoritesi (ESMA) 2018'de bireysel CFD hesaplarının %74-89'unun para kaybettiğini açıkladı.</li>
  <li><b>Kaldıraç kaybı artırır.</b> ABD 2010'da bireysel forex kaldıracını sınırladıktan sonra yüksek kaldıraçlı yatırımcıların kayıpları %40 azaldı (Heimer ve Simsek, Journal of Financial Economics, 2019).</li>
  <li><b>Oynaklık sabit lotun riskini değiştirir.</b> Döviz piyasasında pozisyonu oynaklığa göre ayarlamak getiriyi belirgin artırmadı, ama aşırı kayıpları azalttı (Harvey ve diğerleri, 2018).</li>
</ul>

<h2 id="araclar">Kalibre Lab'de</h2>
<ul>
  <li><b>Riske göre lot hesabı:</b> her işlemde bakiyenin ne kadarını riske atacağını belirle. Lot stop mesafesinden hesaplanır.</li>
  <li><b>Oynaklığa göre ölçek:</b> oynaklık normal düzeyinin üstüne çıkınca işlem başına risk azaltılır (EWMA, Yang-Zhang, GARCH).</li>
  <li><b>Günlük kayıp sınırı ve haber filtresi:</b> belirlediğin günlük kayıptan sonra işlem açılmaz, yüksek önemli veriler çevresinde işlem açılmaz.</li>
  <li><b>Aracı kurumunun verisi:</b> aracı kurumunun fiyatlarıyla backtest yap, sonra MT5 Strategy Tester'da aracı kurumunun maliyetleriyle doğrula.</li>
</ul>

<h2 id="turkiye">Aracı kurumun</h2>
<p>Kalibre Lab aracı kurum değildir. Hesap açmaz ve emir iletmez. MetaTrader 5 sunan herhangi bir aracı kurumla çalışır. Ülkendeki düzenleyicinin yetkilendirdiği bir aracı kurum kullan. Türkiye'de kaldıraçlı işlemler SPK yetkili aracı kurumlar üzerinden yapılır.</p>

<div class="kutu">Kalibre Lab bir yazılımdır ve yatırım tavsiyesi vermez. Kaldıraçlı forex ve CFD işlemleri yüksek risk içerir. Yatırılan paranın tamamı kaybedilebilir.</div>
"""
sayfa("tr/forex/index.html", "Bireysel forex: Kalibre Lab risk araçları", "Riske göre lot hesabı, oynaklığa göre ölçek ve günlük kayıp sınırı; aracı kurumunun MetaTrader 5 verisiyle backtest.", "", FOREX, icindekiler(FOREX), ek_stil=PROP_STIL)

# ------------------------------------------------------------------ kapalı beta rehberi
BETA_FORM_STIL = """
.geri { background: var(--zemin-2); border: 1px solid var(--cizgi-2); border-radius: 6px; padding: 22px 24px; margin: 8px 0 24px; }
.geri .alanlar { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px 18px; margin-bottom: 14px; }
.geri label { display: grid; gap: 6px; font-size: 14px; color: var(--soluk); }
.geri input, .geri select, .geri textarea { min-height: 42px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--cizgi-2); background: var(--zemin); color: var(--metin); font: 400 15px var(--sans); }
.geri textarea { min-height: 96px; resize: vertical; }
.geri .genis { grid-column: 1 / -1; }
.geri #ok-msg { color: var(--yesil); }
"""

def beta_form(dil):
    en = dil == "en"
    t = (lambda tr, e: e) if en else (lambda tr, e: tr)
    sonraki = "https://kalibremarkets.com/beta?ok=1" if en else "https://kalibremarkets.com/tr/beta?ok=1"
    secenek = lambda deger, etiket: f'<option value="{deger}">{etiket}</option>'
    sayfalar = [("baglan", t("Bağlanma sayfası", "Connect page")), ("panom", t("Pano", "Dashboard")), ("kurucu", t("Strateji kurucu", "Strategy builder")),
                ("optimizasyon", t("Optimizasyon", "Optimization")),
                ("kopru", t("Kalibre Bridge (MT5)", "Kalibre Bridge (MT5)")), ("alpaca", "Alpaca"), ("tradier", "Tradier"), ("site", t("Sitenin diğer sayfaları", "Other site pages"))]
    ciddiyet = [("P0", t("P0: yanlış sayı ya da veri sızıntısı", "P0: wrong numbers or a data leak")),
                ("P1", t("P1: kurulum ya da kullanım engellendi", "P1: setup or use is blocked")),
                ("P2", t("P2: kafa karıştırıcı ya da küçük hata", "P2: confusing or a minor bug")),
                ("oneri", t("Öneri", "Suggestion"))]
    return f'''<div class="geri" id="geri-bildirim-formu">
  <p id="ok-msg" hidden><b>{t("Teşekkürler, geri bildirimin bize ulaştı.", "Thank you, your feedback reached us.")}</b></p>
  <form action="https://formsubmit.co/markets@kalibrefin.com" method="POST" id="geri-form">
    <input type="hidden" name="_subject" value="Kalibre beta geri bildirim">
    <input type="hidden" name="_next" value="{sonraki}">
    <input type="hidden" name="_captcha" value="false">
    <input type="hidden" name="_template" value="table">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
    <div class="alanlar">
      <label>{t("Hangi bölüm?", "Which part?")}<select name="bolum" required>{"".join(secenek(d, e) for d, e in sayfalar)}</select></label>
      <label>{t("Önem", "Severity")}<select name="onem" required>{"".join(secenek(d, e) for d, e in ciddiyet)}</select></label>
      <label>{t("Tarayıcı ve işletim sistemi", "Browser and operating system")}<input name="ortam" placeholder="{t("ör. Chrome 141, Windows 11", "e.g. Chrome 141, Windows 11")}" required></label>
      <label>{t("E-posta (yanıt istersen)", "Email (if you want a reply)")}<input type="email" name="email" autocomplete="email"></label>
      <label class="genis">{t("Ne yaptın? Adım adım", "What did you do? Step by step")}<textarea name="adimlar" required></textarea></label>
      <label class="genis">{t("Ne bekliyordun?", "What did you expect?")}<textarea name="beklenen"></textarea></label>
      <label class="genis">{t("Ne oldu? Hata mesajını aynen yaz", "What happened? Copy any error message exactly")}<textarea name="olan" required></textarea></label>
    </div>
    <p class="not">{t("Kod, lisans anahtarı, API anahtarı ya da şifre yazma. Ekran görüntüsü göndermek istersen hesap numaranı ve bakiyeni kapatıp e-postayla gönder.",
                     "Do not include pairing codes, license keys, API keys or passwords. If you want to send a screenshot, cover your account number and balance and email it.")}</p>
    <button type="submit" class="dugme">{t("Gönder", "Send")}</button>
  </form>
  <p class="not">{t("Form, FormSubmit hizmeti aracılığıyla bize iletilir ve yalnız ürünü düzeltmek için kullanılır. Ayrıntılar ", "The form is delivered to us through the FormSubmit service and is used only to fix the product. Details are in the ")}<a href="{"/privacy" if en else "/tr/privacy"}">{t("gizlilik politikasında", "privacy policy")}</a>.</p>
</div>'''

def beta_mailto(dil):
    import urllib.parse
    en = dil == "en"
    konu = "Kalibre beta geri bildirim"
    govde = ("Section / page:\nBrowser and OS:\nSteps:\n1.\n2.\n3.\nExpected:\nActual (exact error message):\n\nDo not include pairing codes, license keys, API keys or passwords."
             if en else
             "Bölüm / sayfa:\nTarayıcı ve işletim sistemi:\nAdımlar:\n1.\n2.\n3.\nBeklenen:\nOlan (hata mesajı aynen):\n\nKod, lisans anahtarı, API anahtarı ya da şifre yazma.")
    return "mailto:markets@kalibrefin.com?subject=" + urllib.parse.quote(konu) + "&body=" + urllib.parse.quote(govde)

BETA_BETIK = """<script>
if (new URLSearchParams(location.search).get('ok') === '1') {
  document.getElementById('ok-msg').hidden = false;
  document.getElementById('geri-form').hidden = true;
}
</script>"""

BETA = f"""
<h1>Beta programı rehberi</h1>
<p class="giris">Kalibre Lab'i denediğin için teşekkürler. Bu sayfa betada ne olduğunu, ilk oturumda ne yapacağını, nelerden kaçınacağını ve geri bildirimi nasıl göndereceğini anlatır.</p>
<div class="kutu"><b>Beta programında demo hesap kullan.</b> Davetle verilen beta lisansıyla gerçek parayla çalışan bir hesap bağlama. Tüm sonuçlar simülasyondur ve maliyetleri içermeyebilir; gerçek parayla karar verme. Ayrıntılar <a href="/tr/risk-disclosure">risk bildiriminde</a>.</div>

<h2 id="lisans">Beta lisansını nasıl alırım?</h2>
<p>Davetinle birlikte bir <b>beta lisans anahtarı</b> gelir. Kalibre Markets hesabına giriş yap (hesabın ilk girişte oluşturulur) ve <a href="/tr/account">Hesabım</a> sayfasında "Hesabıma bağla"yı kullan. Anahtar Ürünler ve lisanslar bölümünde görünür. Ödeme bilgisi gerekmez.</p>
<div class="kutu"><b>Beta lisansı ne kadar geçerli?</b> Beta lisansı ücretsiz ve kişiseldir. Sadece Kalibre Bridge'i kapsar ve Hesabım sayfasında gösterilen tarihte sona erer. Beta süresince abonelikler açık değildir.</div>

<h2 id="neler-var">Betada neler var?</h2>
<ul>
  <li><b>MetaTrader 5 köprüsü ve Pano:</b> demo MT5 hesabının bakiyesi, açık pozisyonları, izlediğin kurlar ve son 90 günün kapanmış işlemleri, uçtan uca şifreli.</li>
  <li><b>Strateji kurucu:</b> Basit mod (bloklar) ve İleri mod (form); ikisi aynı stratejiyi düzenler.</li>
  <li><b>Hızlı Backtest:</b> kuralı mumlarında saniyeler içinde çalıştırır. Maliyetler isteğe bağlıdır, varsayılanı sıfırdır.</li>
  <li><b>Optimizasyon:</b> parametre taraması, eğitim ve sınama dönemi, ısı haritası, şans eseri olup olmadığı ölçüsü.</li>
  <li><b>Alpaca (paper) ve Tradier (sandbox):</b> ABD aracı kurumlarına tarayıcıdan doğrudan bağlantı.</li>
</ul>
<div class="kutu"><b>Otomatik işlem beta programının parçası değildir.</b> Kalibre Engine (kural dosyasını MT5'te çalıştıran eklenti) ve Prop Kalkanı beta lisansına dahil değildir; beta lisansın yalnız Kalibre Bridge'i (okuma) kapsar. Beta programında hiçbir hesapta emir açılmaz.</div>

<h2 id="ilk-oturum">İlk oturum (yaklaşık 30 dakika)</h2>
<ol>
  <li><a href="/tr/connect">Bağlanma sayfasından</a> demo MT5 hesabını bağla: eklentiyi indir, kodu yapıştır, izin adresini ekle, <b>OK</b>'e bas. Takıldığın adımı not al.</li>
  <li><a href="/tr/dashboard">Pano'yu</a> aç: bakiye, kurlar ve pozisyonlar doğru mu? MT5'te gördüklerinle karşılaştır.</li>
  <li>Strateji kurucuda Basit modda bir strateji kur (ör. iki ortalamanın kesişmesi) ya da bir eğitim örneği yükle; risk bölümünü kendin doldur; Hızlı Backtest'i çalıştır.</li>
  <li><a href="/lab/optimization?lang=tr">Optimizasyon</a> sayfasında iki parametreyi tara; ısı haritasına ve sınama dönemi sonucuna bak.</li>
  <li>İstersen Alpaca paper ya da Tradier sandbox hesabını da <a href="/tr/connect">bağlanma sayfasından</a> bağla ve Pano'yu onunla dene.</li>
</ol>

<h2 id="yapma">Bunları yapma</h2>
<ul>
  <li>Gerçek hesap bağlama.</li>
  <li>Kural dosyalarını herhangi bir hesapta otomatik işlem için çalıştırma; betada otomatik işlem yok.</li>
  <li>Eşleştirme kodunu, lisans anahtarını ya da Alpaca/Tradier anahtarlarını kimseyle paylaşma; bize de gönderme.</li>
  <li>Simülasyon sonuçlarını yatırım kararı için kullanma.</li>
</ul>

<h2 id="ne-istiyoruz">Hangi geri bildirimi istiyoruz?</h2>
<ul>
  <li><b>Kurulumda takılma:</b> hangi adımda, ekranda ne yazıyordu.</li>
  <li><b>Yanlış sayılar:</b> MT5 ya da aracı kurumundaki değerle karşılaştırmalı; mümkünse ekran görüntüsüyle (hesap numarasını kapat).</li>
  <li><b>Kafa karıştıran ifadeler:</b> hangi cümle, ne anladın.</li>
  <li><b>Çökme ya da donma:</b> tarayıcı, işletim sistemi ve yaptığın adımlar.</li>
</ul>

<h2 id="gizlilik">Senin hakkında ne görüyoruz?</h2>
<p>Piyasa verini, pozisyonlarını ve işlemlerini göremeyiz: köprüden gelen veri şifrelidir ve yalnız senin tarayıcında açılır; Alpaca ve Tradier verisi doğrudan tarayıcına gelir. Gördüklerimiz: Kalibre Markets hesabının e-posta adresi ve profilin, giriş yapmışken kaydettiğin strateji taslakları, bize gönderdiğin geri bildirim ve beta lisansının kullanıldığı MT5 hesap numarası (lisansı hesaba bağlamak için).</p>

<h2 id="gonder">Geri bildirim gönder</h2>
<p>Formu doldur ya da <a href="{beta_mailto("tr")}">e-postayla gönder</a> (hazır şablon açılır).</p>
{beta_form("tr")}
"""
sayfa("tr/beta/index.html", "Beta programı rehberi: Kalibre Lab", "Kalibre Lab beta programı: neler var, ilk oturum, yapılmaması gerekenler ve geri bildirim.", "", BETA, icindekiler(BETA), ek_stil=BETA_FORM_STIL, ek_betik=BETA_BETIK, gizli=True)

# Risk bildirimi ve diğer yasal sayfalar (şartlar, gizlilik, iade, çerez) yerel/yasal-uret.py ile üretilir.
