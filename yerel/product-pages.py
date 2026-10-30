# Current marketing pages in the site design system (static/site.css), English and Turkish:
#   /                home: one panel per product, privacy, validation
#   /trade-analytics /fx-blotter /rule-guard /kalibre-lab   product pages with a local nav
#   /demo            every product with its sample input and result files
#   /company         who we are and how we work with institutions
# Shared shell (gnav, lnav, gfoot, head) comes from sayfa-uret.py. Figures on the pages are read
# from lab/samples/summary.json (written by kalibre-lab araclar/ornek-dosya-uret.mjs), never typed.
# Usage: python3 yerel/product-pages.py
import json, os, struct

_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

# Company page copy (English and Turkish).
COMPANY = json.load(open(os.path.join(_d, "company-copy.json")))

SUMMARY = json.load(open(os.path.join(KOK, "lab", "samples", "summary.json")))

def T(lang, en, tr):
    return tr if lang == "tr" else en

def fmt(x, lang, digits=0, sign=False):
    s = f"{abs(x):,.{digits}f}"
    if lang == "tr":
        s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    prefix = ("+" if x > 0 else "−" if x < 0 else "") if sign else ("−" if x < 0 else "")
    return prefix + s

def pct(x, lang, digits=1):
    s = fmt(x, lang, digits)
    return f"%{s}" if lang == "tr" else f"{s}%"

# ------------------------------------------------------------------ images
def shot(name, alt, lang, kind="demo", eager=False, sizes="(max-width: 1100px) 100vw, 1100px", caption=""):
    ek = "-tr" if lang == "tr" else ""
    if kind == "analytics":
        base, w, h = f"/static/urun/analytics/{name}{ek}", 2880, 1800
        srcset = f"{base}-1x.webp 1440w, {base}-2x.webp 2880w"
    else:
        base = f"/static/urun/demo/{name}{ek}"
        w, h = struct.unpack(">II", open(os.path.join(KOK, base.lstrip("/") + ".png"), "rb").read()[16:24])
        srcset = f"{base}-1x.webp {w // 2}w, {base}-2x.webp {w}w"
    load = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    cap = f'<figcaption class="caption">{caption}</figcaption>' if caption else ""
    return (f'<figure class="shot"><picture><source type="image/webp" srcset="{srcset}" sizes="{sizes}">'
            f'<img src="{base}.png" width="{w}" height="{h}" alt="{alt}" {load}></picture></figure>{cap}')

ICON = {
    "browser": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="28" height="22" rx="3"/><path d="M4 13h28"/><circle cx="8" cy="10" r=".6" fill="currentColor"/><circle cx="11" cy="10" r=".6" fill="currentColor"/></svg>',
    "lock": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="16" width="20" height="14" rx="3"/><path d="M12 16v-4a6 6 0 0 1 12 0v4"/><path d="M18 22v3"/></svg>',
    "key": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="22" r="6"/><path d="M16.5 17.5 29 5M24 10l3 3M21 13l2 2"/></svg>',
    "file": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 4H10a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V11z"/><path d="M21 4v7h7M13 19h10M13 24h10"/></svg>',
    "rate": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 27l8-9 6 5 12-14"/><path d="M24 9h7v7"/></svg>',
    "person": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="12" r="6"/><path d="M6 31c1.5-6 6.5-9 12-9s10.5 3 12 9"/></svg>',
    "check": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="18" r="13"/><path d="M12 18.5l4 4 8-9"/></svg>',
    "shield": '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 4l11 4v9c0 7-4.7 12.3-11 15-6.3-2.7-11-8-11-15V8z"/></svg>',
}

def facts(items):
    return '<div class="facts">' + "".join(f'<div>{ICON[i]}<h3>{h}</h3><p>{p}</p></div>' for i, h, p in items) + "</div>"

def steps(items):
    return '<ol class="steps">' + "".join(f"<li><h3>{h}</h3><p>{p}</p></li>" for h, p in items) + "</ol>"

def faq(items):
    return '<div class="faq">' + "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in items) + "</div>"

def tile(h, p, extra="", cls=""):
    return f'<div class="tile {cls}"><h3>{h}</h3><p>{p}</p>{extra}</div>'

def row(h, p, media, flip=False, links=""):
    actions = f'<div class="actions left">{links}</div>' if links else ""
    return (f'<div class="row{" flip" if flip else ""}"><div class="row-text"><h3 class="title-s">{h}</h3><p class="lede">{p}</p>{actions}</div>'
            f'<div>{media}</div></div>')

def more(href, label, attr=""):
    return f'<a class="more" href="{href}"{attr}>{label}</a>'

def btn(href, label, attr="", ghost=False):
    return f'<a class="btn{" btn-ghost" if ghost else ""}" href="{href}"{attr}>{label}</a>'

# ------------------------------------------------------------------ forms (static/talep.js reads these)
def select(name, label, options, empty):
    opts = "".join(f'<option value="{v}">{t}</option>' for v, t in options)
    return f'<label for="ee-{name}">{label}<select id="ee-{name}" name="{name}" data-soru><option value="">{empty}</option>{opts}</select></label>'

def text_field(name, label, placeholder=""):
    ph = f' placeholder="{placeholder}"' if placeholder else ""
    return f'<label for="ee-{name}">{label}<input type="text" id="ee-{name}" name="{name}" maxlength="300"{ph} data-soru></label>'

def signup_dialog(lang, questions, demo=False):
    tr = lang == "tr"
    privacy = "/tr/privacy#collect-why" if tr else "/privacy#collect-why"
    if demo:
        heading, intro, submit = T(lang, "Request a demo", "Demo iste"), T(lang, "The demo is free and runs on our sample blotter or an anonymized export of yours. Do not send real client data.", "Demo ücretsizdir ve örnek blotter'ımız ya da sizin anonimleştirilmiş bir dökümünüz üzerinde yapılır. Gerçek müşteri verisi göndermeyin."), T(lang, "Request a demo", "Demo iste")
        email_label = T(lang, "Work email", "İş e-postası")
        consent = T(lang, "I agree to receive emails from Kalibre Markets about the demo and product updates. I can unsubscribe at any time.", "Kalibre Markets'in demo ve ürün güncellemeleri hakkında bana e-posta göndermesini kabul ediyorum. İstediğim zaman listeden çıkabilirim.")
        stored = T(lang, "We store your email, your answers and the time of your request.", "E-postanızı, cevaplarınızı ve talep zamanını saklarız.")
        done = f' data-tamam="{T(lang, "Thanks. We will email you to arrange a demo.", "Talebiniz alındı. Demo için e-posta ile yazacağız.")}"'
    else:
        heading, intro, submit = T(lang, "Get early access", "Erken erişim"), T(lang, "Early access is free. No card required. We will tell you before any paid plan.", "Erken erişim ücretsiz. Kart gerekmez. Ücretli bir plan açılmadan önce haber vereceğiz."), T(lang, "Join early access", "Listeye katıl")
        email_label = T(lang, "Email", "E-posta")
        consent = T(lang, "I agree to receive emails from Kalibre Markets about early access and product updates. I can unsubscribe at any time.", "Kalibre Markets'in erken erişim ve ürün güncellemeleri hakkında bana e-posta göndermesini kabul ediyorum. İstediğim zaman listeden çıkabilirim.")
        stored = T(lang, "We store your email, your answers and the time you joined.", "E-postanızı, cevaplarınızı ve katılma zamanını saklarız.")
        done = ""
    close = T(lang, "Close", "Kapat")
    return f'''
<dialog id="erken-erisim" aria-labelledby="ee-baslik"{done}>
  <h2 id="ee-baslik">{heading}</h2>
  <p>{intro}</p>
  <form novalidate>
    <div class="alanlar">
      <label for="ee-eposta">{email_label}<input type="email" id="ee-eposta" name="eposta" required autocomplete="email" maxlength="254"></label>
      {questions}
    </div>
    <div class="gizli-alan" aria-hidden="true"><label>Web<input type="text" name="web" tabindex="-1" autocomplete="off"></label></div>
    <label class="onay" for="ee-onay"><input type="checkbox" id="ee-onay" name="onay" value="evet" required> <span>{consent}</span></label>
    <p class="not">{stored} {T(lang, "Details are in the", "Ayrıntılar")} <a href="{privacy}">{T(lang, "privacy policy", "gizlilik politikasında")}</a>.</p>
    <div class="kapat-satir">
      <button type="button" class="dugme ikincil" data-kapat>{close}</button>
      <button type="submit" class="dugme">{submit}</button>
    </div>
  </form>
  <p class="talep-mesaj" data-mesaj hidden aria-live="polite"></p>
  <div class="kapat-satir" data-sonra hidden><button type="button" class="dugme ikincil" data-kapat>{close}</button></div>
</dialog>'''

def price_block(lang, product, bullets, yearly):
    tr = lang == "tr"
    month = '<span class="num" data-fiyat-ay>19 $</span>' if tr else '<span class="num" data-fiyat-ay>$19</span>'
    alt = f'<span class="alt-price">{T(lang, "or $99 a year", "ya da yıllık 99 $")}</span>' if yearly else ""
    items = "".join(f"<li>{b}</li>" for b in bullets)
    return (f'<div class="price"><p class="amount">{month}<small> {T(lang, "/ month at launch", "/ ay, açılışta")}</small></p>{alt}'
            f'<ul>{items}</ul><div class="actions">{btn("#pricing", T(lang, "Get early access", "Erken erişim al"), " data-erken-erisim data-fiyat-tik")}</div>'
            f'<p class="fine">{T(lang, "Early access is free and needs no card. We will tell you before any paid plan.", "Erken erişim ücretsizdir ve kart gerekmez. Ücretli bir plan açılmadan önce haber vereceğiz.")}</p></div>')

# ------------------------------------------------------------------ page writer
def page(path, lang, title, description, body, active, other=None, scripts=""):
    url = yol_url(path)
    alternates = ""
    if other:
        tr_url, en_url = (url, other) if lang == "tr" else (other, url)
        alternates = (f'\n<link rel="alternate" hreflang="en" href="https://kalibremarkets.com{en_url}">'
                      f'\n<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com{tr_url}">'
                      f'\n<link rel="alternate" hreflang="x-default" href="https://kalibremarkets.com{en_url}">')
    html = f'''<!doctype html>
<html lang="{lang}">
<head>
{head(lang, title, description, url, alternates)}</head>
<body>
{gnav(active, lang, other)}
<main id="top">
{body}
</main>
{gfoot(lang)}
{scripts}
</body>
</html>
'''
    assert "—" not in html and "–" not in html, path + ": long dash"
    target = os.path.join(KOK, path)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    open(target, "w").write(egik_cizgisiz(html))
    print("written", path)

def P(lang, path):
    """Site path in the page's language."""
    if lang == "tr" and path.startswith("/") and not path.startswith(("/lab", "/static", "/tr", "/egitim")):
        return "/tr" + ("" if path == "/" else path)
    return path

def LAB(lang, path):
    """Lab app link in the page's language."""
    if lang != "tr":
        return path
    return path + ("&amp;" if "?" in path else "?") + "lang=tr"

TA_SAMPLE = "/lab/analytics?file=templates/kalibre-trade-log-example.xlsx"
FX_SAMPLE = {"en": "/lab/blotter?file=samples/fx-blotter-sample.xlsx", "tr": "/lab/blotter?lang=tr&amp;file=samples/fx-blotter-ornek.xlsx"}
LAB_SAMPLE = "/lab?demo=1"

# ------------------------------------------------------------------ Rule Guard illustration
def prop_chart(lang, days=60):
    """Closed balance by day against the daily and total floors (example account, FTMO 2-Step)."""
    data = SUMMARY["tradeAnalytics_en"]["propDays"][:days]
    W, H, L, R, TOP, BOT = 1000, 420, 64, 24, 24, 48
    lo = min(min(d["low"], d["dailyFloor"], d["totalFloor"]) for d in data)
    hi = max(max(d["start"], d["end"]) for d in data)
    lo, hi = (lo // 2000) * 2000, (hi // 2000 + 1) * 2000
    x = lambda i: L + i * (W - L - R) / (len(data) - 1)
    y = lambda v: TOP + (hi - v) * (H - TOP - BOT) / (hi - lo)
    path = lambda key: " ".join(f"{'M' if i == 0 else 'L'}{x(i):.1f},{y(d[key]):.1f}" for i, d in enumerate(data))
    step_floor = lambda key: "M" + " L".join(f"{x(i):.1f},{y(d[key]):.1f} {x(i + 1 if i + 1 < len(data) else i):.1f},{y(d[key]):.1f}" for i, d in enumerate(data))
    lows = "".join(f'<circle cx="{x(i):.1f}" cy="{y(d["low"]):.1f}" r="2.6" fill="#ebe3d3"/>' for i, d in enumerate(data))
    grid = ""
    for v in range(int(lo), int(hi) + 1, 4000):
        grid += f'<line x1="{L}" x2="{W - R}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="#26221d"/><text x="{L - 10}" y="{y(v) + 4:.1f}" text-anchor="end" fill="#6f6553" font-size="13">{fmt(v / 1000, lang)}k</text>'
    months = {}
    for i, d in enumerate(data):
        months.setdefault(d["day"][:7], i)
    month_names = {"en": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], "tr": ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]}[lang]
    ticks = "".join(f'<text x="{x(i):.1f}" y="{H - 18}" fill="#6f6553" font-size="13">{month_names[int(m[5:]) - 1]} {m[:4]}</text>' for m, i in months.items())
    legend = [("#ffa630", T(lang, "Closed balance at day end", "Gün sonu kapanış bakiyesi"), ""), ("#ebe3d3", T(lang, "Lowest closed balance in the day", "Gün içi en düşük kapanış bakiyesi"), ""),
              ("#ef4444", T(lang, "Daily floor (5%)", "Günlük taban (%5)"), "6 5"), ("#8a7f6a", T(lang, "Total floor (10%)", "Toplam taban (%10)"), "2 4")]
    leg = "".join(f'<g transform="translate({L + k * 240},{H - 2})"><line x1="0" x2="22" y1="-4" y2="-4" stroke="{c}" stroke-width="2.5" stroke-dasharray="{dash}"/><text x="30" y="0" fill="#a89c83" font-size="13">{t}</text></g>' for k, (c, t, dash) in enumerate(legend))
    title = T(lang, "Closed balance by day against FTMO 2-Step floors, example account", "Örnek hesap: FTMO 2-Step tabanlarına karşı günlük kapanış bakiyesi")
    return (f'<figure class="shot" style="background:var(--night);padding:28px 20px 12px"><svg viewBox="0 0 {W} {H + 18}" role="img" aria-label="{title}" font-family="Geist Mono, JetBrains Mono, ui-monospace, monospace">'
            f'{grid}<path d="{step_floor("totalFloor")}" fill="none" stroke="#8a7f6a" stroke-width="2" stroke-dasharray="2 4"/>'
            f'<path d="{step_floor("dailyFloor")}" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="6 5"/>'
            f'<path d="{path("end")}" fill="none" stroke="#ffa630" stroke-width="2.5" stroke-linejoin="round"/>{lows}{ticks}{leg}</svg></figure>')

# ================================================================== home
def home(lang):
    tr = lang == "tr"
    ta, fx, lab = SUMMARY[f"tradeAnalytics_{lang}"], SUMMARY[f"fxBlotter_{lang}"], SUMMARY["kalibreLab"]
    body = f'''
<section class="hero home-hero">
  <div class="wrap">
    <h1 class="display">{T(lang, "FX, solved.", "FX'i çözüyoruz.")}</h1>
    <p class="sub">{T(lang, "Every trade explained, in seconds.", "Her işlem, saniyeler içinde açıklanmış.")}</p>
    <div class="actions">{btn(P(lang, "/demo"), T(lang, "Try the demo", "Demoyu dene"))}{more(P(lang, "/fx-blotter") + "#demo", T(lang, "Request a desk demo", "Masa demosu iste"), "")}</div>
  </div>
  <figure class="home-hero-media"><picture><source type="image/webp" srcset="/static/urun/hero/home-{lang}-1x.webp 1440w, /static/urun/hero/home-{lang}-2x.webp 2880w" sizes="(max-width: 1440px) 100vw, 1440px"><img src="/static/urun/hero/home-{lang}.png" width="2880" height="1720" alt="{T(lang, "FX Blotter Analytics on a laptop: total P&amp;L split into price, points, carry and MTM, and seven reconciliation checks passed", "Dizüstünde FX Blotter Analytics: fiyat, puan, taşıma ve MTM olarak ayrılmış toplam K/Z ve geçen yedi mutabakat kontrolü")}" fetchpriority="high" decoding="async"></picture></figure>
</section>

<section class="panel mist" style="margin-top:72px">
  <h2 class="title">Trade Analytics</h2>
  <p class="sub">{T(lang, "Find what works.", "Neyin işe yaradığını bul.")}</p>
  <div class="actions">{more(P(lang, "/trade-analytics"), T(lang, "Learn more", "Daha fazla"))}{more(LAB(lang, TA_SAMPLE), T(lang, "Try the sample", "Örneği dene"))}</div>
  <div class="panel-media">{shot("analytics-overview", T(lang, "Trade Analytics account overview with an example account", "Örnek bir hesapla Trade Analytics hesap özeti"), lang, eager=True, sizes="(max-width: 1040px) 100vw, 1040px")}</div>
</section>

<section class="panel night" style="margin-top:12px">
  <h2 class="title">FX Blotter</h2>
  <p class="sub">{T(lang, "Your blotter, explained.", "Blotter'ın, açıklanmış.")}</p>
  <div class="actions">{more(P(lang, "/fx-blotter"), T(lang, "Learn more", "Daha fazla"))}{more(FX_SAMPLE[lang], T(lang, "Open the sample blotter", "Örnek blotter'ı aç"))}</div>
  <div class="panel-media">{shot("blotter-pnl", T(lang, "P&amp;L table of the sample blotter by pair, with price, points, carry and MTM", "Örnek blotter'ın parite bazında K/Z tablosu: fiyat, puan, taşıma ve MTM"), lang, sizes="(max-width: 1040px) 100vw, 1040px")}</div>
</section>

<div class="panels-2">
  <section class="panel mist">
    <h2 class="title">Rule Guard{status_tag("test", lang)}</h2>
    <p class="sub">{T(lang, "Stay inside the limits.", "Sınırların içinde kal.")}</p>
    <div class="actions">{more(P(lang, "/rule-guard"), T(lang, "Learn more", "Daha fazla"))}</div>
    <div class="panel-media">{prop_chart(lang, days=40)}</div>
  </section>
  <section class="panel night">
    <h2 class="title">Kalibre Lab</h2>
    <p class="sub">{T(lang, "Test before you trade.", "İşlemden önce sına.")}</p>
    <div class="actions">{more(P(lang, "/kalibre-lab"), T(lang, "Learn more", "Daha fazla"))}{more(LAB(lang, LAB_SAMPLE), T(lang, "Run the sample", "Örneği çalıştır"))}</div>
    <div class="panel-media" style="max-width:520px">{shot("lab-backtest", T(lang, "Sample backtest result", "Örnek backtest sonucu"), lang, sizes="(max-width: 860px) 100vw, 520px")}</div>
  </section>
</div>

<section class="sec center">
  <div class="wrap">
    <h2 class="title">{T(lang, "Your data stays with you.", "Verin sende kalır.")}</h2>
    {facts([("browser", T(lang, "Files are read in your browser", "Dosyalar tarayıcında okunur"), T(lang, "MT5 reports, CSV and Excel files are processed on your device and are not uploaded. The account number and name in a report are not read.", "MT5 raporları, CSV ve Excel dosyaları cihazında işlenir ve yüklenmez. Rapordaki hesap numarası ve ad okunmaz.")),
            ("lock", T(lang, "Live MT5 data is encrypted end to end", "Canlı MT5 verisi uçtan uca şifreli"), T(lang, "Kalibre Bridge encrypts each packet with AES-256 before it leaves the terminal. The relay stores only ciphertext and deletes it within 2 hours.", "Kalibre Bridge her paketi terminalden çıkmadan AES-256 ile şifreler. Röle yalnız şifreli metni tutar ve 2 saat içinde siler.")),
            ("key", T(lang, "No passwords", "Şifre yok"), T(lang, "We never ask for your MT5 or broker password. Alpaca and Tradier keys stay in your browser.", "MT5 ya da aracı kurum şifreni hiçbir zaman istemeyiz. Alpaca ve Tradier anahtarları tarayıcında kalır."))])}
    <div class="actions">{more(P(lang, "/security"), T(lang, "Read the security details", "Güvenlik ayrıntılarını oku"))}</div>
  </div>
</section>

<section class="sec night">
  <div class="wrap">
    <h2 class="title">{T(lang, "Checked against MetaTrader 5.", "MetaTrader 5'e karşı sınandı.")}</h2>
    <p class="lede">{T(lang, "Facts about the engine, not trading results.", "Motorla ilgili bilgiler, işlem sonucu değil.")}</p>
    <div class="numbers">
      <div><b>97</b><span>{T(lang, "MT5 Strategy Tester runs compared trade by trade", "işlem işlem karşılaştırılan MT5 Strategy Tester koşusu")}</span></div>
      <div><b>{fmt(44015, lang)}</b><span>{T(lang, "MT5 trades in those runs", "bu koşulardaki MT5 işlemi")}</span></div>
      <div><b>{fmt(87315, lang)}</b><span>{T(lang, "trades recomputed by a separate reference implementation", "ayrı bir referans uygulamasıyla yeniden hesaplanan işlem")}</span></div>
      <div><b>0</b><span>{T(lang, "unexplained differences in either check", "iki denetimde de açıklanamayan fark")}</span></div>
    </div>
    <div class="actions left">{more(P(lang, "/methodology"), T(lang, "Read the methodology", "Metodolojiyi oku"))}</div>
  </div>
</section>

<section class="sec mist center">
  <div class="wrap">
    <h2 class="title">{T(lang, "Built for desks.", "Masalar için.")}</h2>
    <p class="lede">{T(lang, "Pilot on sample or anonymized data. No client data leaves the building.", "Örnek ya da anonim veriyle pilot. Binadan müşteri verisi çıkmaz.")}</p>
    <div class="actions">{btn(P(lang, "/fx-blotter") + "#demo", T(lang, "Request a desk demo", "Masa demosu iste"))}{more(P(lang, "/company"), T(lang, "About Kalibre Markets", "Kalibre Markets hakkında"))}</div>
  </div>
</section>'''
    path = "tr/index.html" if tr else "index.html"
    page(path, lang, T(lang, "Kalibre Markets: FX, solved", "Kalibre Markets: FX'i çözüyoruz"),
         T(lang, "Trade Analytics, FX Blotter, Rule Guard and Kalibre Lab read the trading records you already keep and show what every trade earned, in seconds. Files are processed in your browser.",
           "Trade Analytics, FX Blotter, Rule Guard ve Kalibre Lab zaten tuttuğun işlem kayıtlarını okur ve her işlemin ne kazandırdığını saniyeler içinde gösterir. Dosyalar tarayıcında işlenir."),
         body, P(lang, "/"), "/" if tr else "/tr")

# ================================================================== Trade Analytics
def trade_analytics(lang):
    tr = lang == "tr"
    sample = LAB(lang, TA_SAMPLE)
    local = lnav("Trade Analytics", lang, [(T(lang, "Overview", "Genel bakış"), "#top"), (T(lang, "Highlights", "Öne çıkanlar"), "#highlights"), (T(lang, "Your data", "Verin"), "#privacy"), (T(lang, "Pricing", "Fiyat"), "#pricing")],
                 T(lang, "Try it", "Dene"), sample)
    template_cols = ["open_time", "close_time", "symbol", "side", "volume", "open_price", "close_price", "profit"]
    sheet = ('<figure class="shot" style="padding:0"><div style="overflow-x:auto"><table style="border-collapse:collapse;font:13px/1.4 var(--mono);color:var(--ink);min-width:640px;width:100%">'
             '<thead><tr>' + "".join(f'<th style="text-align:left;padding:10px 12px;background:var(--surface);border-bottom:1px solid var(--line-2);font-weight:500;color:var(--action)">{c}</th>' for c in template_cols) + '</tr></thead><tbody>'
             + "".join('<tr>' + "".join(f'<td style="padding:9px 12px;border-bottom:1px solid var(--line)">{v}</td>' for v in r) + '</tr>' for r in [
                 ["2026-04-01 09:15", "2026-04-01 13:40", "EURUSD", "buy", "1.00", "1.08345", "1.08512", "167.00"],
                 ["2026-04-01 10:02", "2026-04-01 10:31", "XAUUSD", "sell", "0.50", "3125.40", "3131.10", "−285.00"]])
             + '</tbody></table></div></figure>')
    questions = (select("platform", T(lang, "Which platform do you trade on?", "Hangi platformda işlem yapıyorsun?"), [("mt5", "MetaTrader 5"), ("mt4", "MetaTrader 4"), ("ctrader", "cTrader"), ("tradingview", "TradingView"), ("diger", T(lang, "Other", "Başka"))], T(lang, "Choose", "Seç"))
                 + select("simdi", T(lang, "What do you analyze your account with today?", "Hesabını şu an neyle analiz ediyorsun?"), [("myfxbook", "Myfxbook"), ("fxblue", "FX Blue"), ("gunluk", T(lang, "A trading journal app", "Bir işlem günlüğü uygulaması")), ("tablo", T(lang, "A spreadsheet", "Tablo")), ("hicbiri", T(lang, "Nothing", "Hiçbiri")), ("diger", T(lang, "Other", "Başka"))], T(lang, "Choose", "Seç"))
                 + text_field("odeme", T(lang, "What is the one thing you would pay to solve?", "Para ödeyerek çözmek istediğin tek şey ne?")))
    body = f'''
<div data-talep-sayfa="mt5-analytics">
{local}
<section class="hero">
  <div class="wrap">
    <span class="kicker">Trade Analytics{status_tag("beta", lang)}</span>
    <h1 class="display">{T(lang, "Find your edge.", "Avantajını bul.")}</h1>
    <p class="sub">{T(lang, "Drop in an MT5 report or a trading log. Results by symbol, hour, session and habit, worked out in your browser.", "Bir MT5 raporu ya da işlem kaydı bırak. Sembol, saat, seans ve alışkanlığa göre sonuçlar, tarayıcında hesaplanır.")}</p>
    <div class="actions">{btn(sample, T(lang, "Try it with a sample file", "Örnek dosyayla dene"))}{more("#pricing", T(lang, "Get early access", "Erken erişim al"), " data-erken-erisim")}</div>
  </div>
  <div class="stage">
    <div class="wrap">{shot("analytics-overview", T(lang, "Account overview for an example account: net P&amp;L, win rate, profit factor, drawdown and balance", "Örnek hesap için hesap özeti: net K/Z, kazanma oranı, kâr faktörü, düşüş ve bakiye"), lang, eager=True)}</div>
  </div>
</section>

<section class="sec mist" id="highlights">
  <div class="wrap">
    <h2 class="title">{T(lang, "Get the highlights.", "Öne çıkanlar.")}</h2>
    <div class="tiles">
      {tile(T(lang, "Ranked by what each habit is worth.", "Her alışkanlığın değeri, sıralı."), T(lang, "Segments with at least 20 trades, ordered by their effect on net P&amp;L: hours, symbols, holding times and streaks. Small differences are flagged as possible noise.", "En az 20 işlemli dilimler, net K/Z'ye etkisine göre sıralı: saatler, semboller, pozisyon süreleri ve seriler. Küçük farklar rastlantı olabilir diye işaretlenir."), shot("analytics-segments", T(lang, "Segments of the example account ranked by their effect on the result", "Örnek hesabın sonuca etkisine göre sıralı dilimleri"), lang, sizes="(max-width: 860px) 100vw, 1180px"), "full dark")}
      {tile(T(lang, "Prop limits, day by day.", "Prop sınırları, gün gün."), T(lang, "FTMO and The5ers presets or your own percentages. Each day shows how close it came to the daily and total floor.", "FTMO ve The5ers ön ayarları ya da kendi yüzdelerin. Her gün günlük ve toplam tabana ne kadar yaklaştığını gösterir."), shot("analytics-prop", T(lang, "Daily prop limit table of the example account", "Örnek hesabın günlük prop sınırı tablosu"), lang, sizes="(max-width: 860px) 100vw, 580px"))}
      {tile(T(lang, "Your own views.", "Kendi görünümlerin."), T(lang, "Group by any field, pick a measure and a chart. Views are saved in your browser and open on your next visit.", "Herhangi bir alana göre grupla, ölçü ve grafik seç. Görünümler tarayıcında saklanır ve sonraki ziyaretinde açılır."), shot("analytics-view", T(lang, "Custom view grouping the example account", "Örnek hesabı gruplayan görünüm"), lang, sizes="(max-width: 860px) 100vw, 580px"))}
      {tile(T(lang, "MT5 reports", "MT5 raporları"), T(lang, "HTML and Open XML history reports from any MT5 broker.", "Her MT5 aracı kurumundan HTML ve Open XML geçmiş raporları."), "", "third")}
      {tile(T(lang, "Excel and CSV", "Excel ve CSV"), T(lang, "Trades from any platform, with our template or your own columns.", "Her platformdan işlemler, şablonumuzla ya da kendi sütunlarınla."), "", "third")}
      {tile("Kalibre Bridge", T(lang, "90 days of history from a live MT5 account, encrypted on the way.", "Canlı MT5 hesabından 90 günlük geçmiş, yolda şifreli."), "", "third")}
    </div>
  </div>
</section>

<section class="sec center">
  <div class="wrap">
    <h2 class="title">{T(lang, "From a file to an answer in three steps.", "Bir dosyadan cevaba üç adımda.")}</h2>
    {steps([(T(lang, "Export your report", "Raporunu al"), T(lang, "In MT5, right-click the History tab and choose Report, then HTML.", "MT5'te Geçmiş sekmesinde sağ tıkla, Rapor menüsünden HTML'i seç.")),
            (T(lang, "Drop it in", "Sayfaya bırak"), T(lang, "The file is read in your browser. No install and no account.", "Dosya tarayıcında okunur. Kurulum ya da hesap gerekmez.")),
            (T(lang, "Read the breakdowns", "Kırılımları oku"), T(lang, "Overview, segments, prop limits and the views you save.", "Özet, dilimler, prop sınırları ve kaydettiğin görünümler."))])}
  </div>
</section>

<section class="sec mist" id="import-your-log">
  <div class="wrap">
    {row(T(lang, "Keep your trades in Excel?", "İşlemlerini Excel'de mi tutuyorsun?"),
         T(lang, "Download the template, write one closed trade per row and drop the file in. Every row that cannot be read is listed with its row number and the reason.", "Şablonu indir, her kapanmış işlemi bir satıra yaz ve dosyayı bırak. Okunamayan her satır, satır numarası ve nedeniyle listelenir."),
         sheet, links=more("/lab/templates/kalibre-trade-log-template.xlsx", T(lang, "Template for Excel", "Excel şablonu"), " download") + more("/lab/templates/kalibre-trade-log-template.csv", T(lang, "Template for CSV", "CSV şablonu"), " download"))}
  </div>
</section>

<section class="sec night center" id="privacy">
  <div class="wrap">
    <h2 class="title">{T(lang, "Your trades stay on your device.", "İşlemlerin cihazında kalır.")}</h2>
    {facts([("browser", T(lang, "Read in your browser", "Tarayıcında okunur"), T(lang, "The report or spreadsheet is read in your browser and is not sent to our servers.", "Rapor ya da tablo tarayıcında okunur ve sunucularımıza gönderilmez.")),
            ("person", T(lang, "Nothing that names you", "Seni tanıtan bir şey yok"), T(lang, "Only the account currency is read from a report header. Account number and name are not read or stored.", "Rapor başlığından yalnız hesap para birimi okunur. Hesap numarası ve ad okunmaz, saklanmaz.")),
            ("lock", T(lang, "Encrypted when live", "Canlıda şifreli"), T(lang, "With Kalibre Bridge, data travels from MT5 to your browser encrypted end to end.", "Kalibre Bridge ile veri MT5'ten tarayıcına uçtan uca şifreli gelir."))])}
  </div>
</section>

<section class="sec center" id="pricing">
  <div class="wrap">
    <h2 class="title">{T(lang, "Free during early access.", "Erken erişimde ücretsiz.")}</h2>
    {price_block(lang, "Trade Analytics", [T(lang, "MT5 reports, Excel, CSV and Kalibre Bridge", "MT5 raporu, Excel, CSV ve Kalibre Bridge"), T(lang, "Segments, breakdowns and prop limits", "Dilimler, kırılımlar ve prop sınırları"), T(lang, "Saved views", "Kaydedilen görünümler"), T(lang, "Replay and a weekly report are planned", "Replay ve haftalık rapor planlanıyor")], False)}
    {faq([(T(lang, "Which brokers does it work with?", "Hangi aracı kurumlarla çalışır?"), T(lang, "Any broker that gives you a MetaTrader 5 report. MT4 reports are not supported yet.", "MetaTrader 5 raporu veren her aracı kurumla. MT4 raporları henüz desteklenmiyor.")),
          (T(lang, "Do prop limits show a real breach?", "Prop sınırları gerçek ihlali gösterir mi?"), T(lang, "Not exactly. A history report has no intraday equity, so the page measures closed-trade balance only. A real breach may have come earlier.", "Tam değil. Geçmiş raporunda gün içi varlık yoktur, sayfa yalnız kapanan işlemlerle bakiyeyi ölçer. Gerçek ihlal daha erken olmuş olabilir.")),
          (T(lang, "Is this advice?", "Bu bir tavsiye mi?"), T(lang, "No. The page describes your past trades. It does not tell you what to do.", "Hayır. Sayfa geçmiş işlemlerini betimler. Ne yapman gerektiğini söylemez."))])}
    <p class="legal-note">{T(lang, "Results describe past trades and are not an indicator of future results. Kalibre is software and does not give investment advice.", "Sonuçlar geçmiş işlemleri betimler ve gelecekteki sonuçların göstergesi değildir. Kalibre bir yazılımdır ve yatırım tavsiyesi vermez.")} <a href="{P(lang, "/risk-disclosure")}">{T(lang, "Risk disclosure", "Risk bildirimi")}</a></p>
  </div>
</section>
{signup_dialog(lang, questions)}
</div>'''
    page("tr/trade-analytics/index.html" if tr else "trade-analytics/index.html", lang,
         T(lang, "Trade Analytics: find your edge", "Trade Analytics: avantajını bul"),
         T(lang, "Drop in an MT5 report or a trading log and see results by symbol, hour, session and habit, plus prop firm limits day by day. Files are read in your browser.", "Bir MT5 raporu ya da işlem kaydı bırak; sembol, saat, seans ve alışkanlığa göre sonuçları ve prop sınırlarını gün gün gör. Dosyalar tarayıcında okunur."),
         body, P(lang, "/trade-analytics"), "/trade-analytics" if tr else "/tr/trade-analytics", '<script src="/static/talep.js" defer></script>')

# ================================================================== FX Blotter
def fx_blotter(lang):
    tr = lang == "tr"
    fx = SUMMARY[f"fxBlotter_{lang}"]
    sample = FX_SAMPLE[lang]
    local = lnav("FX Blotter", lang, [(T(lang, "Overview", "Genel bakış"), "#top"), (T(lang, "Reconciliation", "Mutabakat"), "#reconciliation"), (T(lang, "Sample files", "Örnek dosyalar"), "#samples"), (T(lang, "Pilots", "Pilotlar"), "#pilots")],
                 T(lang, "Request a demo", "Demo iste"), "#demo", " data-erken-erisim")
    inp, res = ("fx-blotter-ornek", "fx-blotter-ornek-sonuc") if tr else ("fx-blotter-sample", "fx-blotter-sample-result")
    other_inp = "fx-blotter-sample" if tr else "fx-blotter-ornek"
    kind = [("banka", T(lang, "Bank", "Banka")), ("kurumsal-hazine", T(lang, "Corporate treasury", "Şirket hazinesi")), ("araci-kurum", T(lang, "Broker", "Aracı kurum")), ("prop-firma", T(lang, "Prop firm", "Prop firması")), ("fon", T(lang, "Fund or asset manager", "Fon ya da portföy yönetimi")), ("diger", T(lang, "Other", "Diğer"))]
    questions = (select("kurum", T(lang, "Organization type", "Kurum türü"), kind, T(lang, "Choose", "Seçin"))
                 + select("masa", T(lang, "People on the desk", "Masadaki kişi sayısı"), [("1", "1"), ("2-5", "2-5"), ("6-20", "6-20"), ("20+", "20+")], T(lang, "Choose", "Seçin"))
                 + text_field("sistem", T(lang, "Which system does your blotter come from?", "Blotter hangi sistemden geliyor?"), T(lang, "e.g. 360T, Murex, Excel", "ör. 360T, Murex, Excel")))
    body = f'''
<div data-talep-sayfa="treasury">
{local}
<section class="hero">
  <div class="wrap">
    <span class="kicker">FX Blotter Analytics{status_tag("beta", lang)}</span>
    <h1 class="display">{T(lang, "Your blotter, explained.", "Blotter'ın, açıklanmış.")}</h1>
    <p class="sub">{T(lang, "Drop in the FX blotter your desk already exports. Every total traces back to its deals.", "Masanın zaten dışa aktardığı FX blotter'ını bırak. Her toplam deal'lerine kadar izlenir.")}</p>
    <div class="actions">{btn(sample, T(lang, "Open the sample blotter", "Örnek blotter'ı aç"))}{more("#demo", T(lang, "Request a demo", "Demo iste"), " data-erken-erisim")}</div>
  </div>
  <div class="stage">
    <div class="wrap">{shot("blotter-summary", T(lang, "Summary of the sample blotter: total P&amp;L split into price, points, carry and MTM", "Örnek blotter özeti: toplam K/Z fiyat, puan, taşıma ve MTM olarak ayrılmış"), lang, eager=True)}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <h2 class="title center" style="max-width:20ch;margin:0 auto">{T(lang, "Built around how a treasury desk reads its day.", "Bir hazine masasının günü okuma biçimine göre kuruldu.")}</h2>
    <div class="rows" style="margin-top:clamp(56px,7vw,96px)">
      {row(T(lang, "Price and points, apart.", "Fiyat ve puan, ayrı."), T(lang, "Realized P&amp;L is split into spot price and forward points. Carry shows as overnight swap and MTM covers the open position. Swaps count as rolls and do not change the net position.", "Gerçekleşen K/Z spot fiyat ve vadeli puanı olarak ayrılır. Taşıma gecelik swap olarak, MTM açık pozisyon için görünür. Swap'lar roll sayılır ve net pozisyonu değiştirmez."), shot("blotter-pnl", T(lang, "P&amp;L table by pair; every row opens its deals", "Pariteye göre K/Z tablosu; her satır deal'lerini açar"), lang, sizes="(max-width: 860px) 100vw, 720px"))}
      {row(T(lang, "Every total opens its deals.", "Her toplam deal'lerini açar."), T(lang, "Group by pair, book, dealer, item type, deal size, hour or weekday. Click any figure and the deal rows behind it open.", "Parite, portföy, dealer, kalem türü, büyüklük, saat ya da güne göre grupla. Herhangi bir rakama tıkla, arkasındaki deal satırları açılır."), shot("blotter-positions", T(lang, "Net open position by currency in USD equivalent", "USD karşılığı döviz bazında net açık pozisyon"), lang, sizes="(max-width: 860px) 100vw, 720px"), flip=True)}
      {row(T(lang, "Positions by value date.", "Valöre göre pozisyonlar."), T(lang, "A ladder from today through spot, one week, one month and beyond a year, per currency, next to your own limits.", "Bugünden spot, bir hafta, bir ay ve bir yılın ötesine uzanan, döviz bazında bir merdiven; kendi limitlerinin yanında."), shot("blotter-ladder", T(lang, "Value-date ladder of the sample blotter", "Örnek blotter'ın valör merdiveni"), lang, sizes="(max-width: 860px) 100vw, 720px"))}
      {row(T(lang, "Reads the file as it is.", "Dosyayı olduğu gibi okur."), T(lang, "Report title rows, total rows, headers in English, Turkish, German or French and local number formats are handled. Each column match shows its confidence, and you can change it.", "Rapor başlığı satırları, toplam satırları, İngilizce, Türkçe, Almanca ya da Fransızca başlıklar ve yerel sayı biçimleri tanınır. Her sütun eşleşmesi güven puanını gösterir ve değiştirilebilir."), shot("blotter-columns", T(lang, "Detected columns with their confidence", "Güven puanıyla tanınan sütunlar"), lang, sizes="(max-width: 860px) 100vw, 720px"), flip=True)}
    </div>
  </div>
</section>

<section class="sec night" id="reconciliation">
  <div class="wrap">
    <div class="row">
      <div class="row-text">
        <h2 class="title">{T(lang, "Seven checks on every file.", "Her dosyada yedi kontrol.")}</h2>
        <p class="lede">{T(lang, "Row counts, subtotals against the grand total, amount times rate on every leg, notionals by currency, the blotter's local-currency column, open lots against positions, and FIFO against average cost. A failed check turns red.", "Satır sayıları, alt toplamların genel toplamı tutması, her bacakta tutar çarpı kur, döviz bazında nominaller, blotter'ın yerel para sütunu, açık lotların pozisyona eşitliği ve FIFO ile ortalama maliyet. Başarısız kontrol kırmızıya döner.")}</p>
        <p class="lede">{T(lang, "Twelve hand-computed cases match exactly.", "Elle hesaplanmış on iki vaka birebir tutuyor.")}</p>
      </div>
      <div>{shot("blotter-reconciliation", T(lang, "Reconciliation panel: all checks passed on the sample blotter", "Mutabakat paneli: örnek blotter'da bütün kontroller geçti"), lang, sizes="(max-width: 860px) 100vw, 720px")}</div>
    </div>
  </div>
</section>

<section class="sec mist center" id="samples">
  <div class="wrap">
    <h2 class="title">{T(lang, "Try it on our sample.", "Örneğimizde dene.")}</h2>
    <p class="lede">{T(lang, f"One week of deals from a bank FX desk as an Excel export: {fmt(fx['legs'], lang)} legs, total P&amp;L {fmt(fx['totalUsd'], lang, sign=True)} USD, {fx['checksPassed']} of {fx['checks']} checks passed.", f"Bir banka FX masasının Excel dökümünde bir haftalık deal'ler: {fmt(fx['legs'], lang)} bacak, toplam K/Z {fmt(fx['totalUsd'], lang, sign=True)} USD, {fx['checks']} kontrolün {fx['checksPassed']}'si geçti.")}</p>
    <div class="files">
      <div class="file"><h3>{T(lang, "Input", "Girdi")}</h3><p>{T(lang, "The blotter as the desk exports it.", "Masanın dışa aktardığı haliyle blotter.")}</p><div class="file-links">{more(f"/lab/samples/{inp}.xlsx", f"{inp}.xlsx", " download")}{more(f"/lab/samples/{inp}.csv", T(lang, "CSV version", "CSV sürümü"), " download")}{more(f"/lab/samples/{other_inp}.xlsx", T(lang, "Turkish-format version", "İngilizce başlıklı sürüm"), " download")}</div></div>
      <div class="file"><h3>{T(lang, "In the browser", "Tarayıcıda")}</h3><p>{T(lang, "The same file opened in FX Blotter Analytics, with example rates and limits filled in.", "Aynı dosya FX Blotter Analytics'te açılır; örnek kur ve limitler girilir.")}</p><div class="file-links">{more(sample, T(lang, "Open the sample", "Örneği aç"))}</div></div>
      <div class="file"><h3>{T(lang, "Result", "Sonuç")}</h3><p>{T(lang, "A workbook with a dashboard, P&amp;L by pair, book and dealer, positions, the ladder, limits and the reconciliation.", "Pano, parite, portföy ve dealer bazında K/Z, pozisyon, merdiven, limitler ve mutabakat içeren çalışma kitabı.")}</p><div class="file-links">{more(f"/lab/samples/{res}.xlsx", f"{res}.xlsx", " download")}</div></div>
    </div>
  </div>
</section>

<section class="sec center" id="pilots">
  <div class="wrap">
    <h2 class="title">{T(lang, "Judge it before any client data leaves the building.", "Binadan tek bir müşteri verisi çıkmadan değerlendirin.")}</h2>
    {facts([("file", T(lang, "Start on sample or anonymized data", "Örnek ya da anonim veriyle başlayın"), T(lang, "Begin with our sample files or an anonymized export of your own.", "Örnek dosyalarımızla ya da kendi anonimleştirilmiş dökümünüzle başlayın.")),
            ("browser", T(lang, "Your data stays with you", "Veriniz sizde kalır"), T(lang, "The blotter is read in the browser on your machine. Counterparty names are dropped by default.", "Blotter kendi makinenizdeki tarayıcıda okunur. Karşı taraf adları varsayılan olarak alınmaz.")),
            ("rate", T(lang, "Bring your own rate files", "Kendi kur dosyalarınızı getirin"), T(lang, "Valuation uses the rates you already have. We supply no market data, so there is no new licence to sign.", "Değerleme elinizdeki kurları kullanır. Piyasa verisi vermediğimiz için yeni bir lisans imzalamanız gerekmez."))])}
    {faq([(T(lang, "Which systems can it read?", "Hangi sistemleri okuyabilir?"), T(lang, "CSV and Excel exports from systems such as 360T, FXall, Bloomberg FXGO and Murex, and blotters kept by hand in Excel.", "360T, FXall, Bloomberg FXGO ve Murex gibi sistemlerin CSV ve Excel dışa aktarımları ile Excel'de elle tutulan blotter'lar.")),
          (T(lang, "Which products are covered?", "Hangi ürünler kapsanıyor?"), T(lang, "Spot, outright forwards, swap legs and NDFs. Options are detected and left out with a reason.", "Spot, outright forward, swap bacakları ve NDF. Opsiyonlar tanınır ve gerekçesiyle dışarıda bırakılır.")),
          (T(lang, "Is opportunity cost shown?", "Fırsat maliyeti gösteriliyor mu?"), T(lang, "Not yet. It will be added once its definition is agreed with desks.", "Henüz değil. Tanımı masalarla netleşince eklenecek."))])}
  </div>
</section>

<section class="sec night center" id="demo">
  <div class="wrap">
    <h2 class="title">{T(lang, "See it on your desk's export.", "Masanızın dökümünde görün.")}</h2>
    <p class="lede">{T(lang, "Tell us your organization type, desk size and the system your blotter comes from. We will reply by email to find a time.", "Kurum türünüzü, masa büyüklüğünü ve blotter'ın geldiği sistemi yazın. Uygun bir zaman için e-postayla döneriz.")}</p>
    <div class="actions">{btn("#demo", T(lang, "Request a demo", "Demo iste"), " data-erken-erisim")}</div>
  </div>
</section>
{signup_dialog(lang, questions, demo=True)}
</div>'''
    page("tr/fx-blotter/index.html" if tr else "fx-blotter/index.html", lang,
         T(lang, "FX Blotter Analytics for treasury and dealing desks", "FX Blotter Analytics: hazine ve dealing masaları için"),
         T(lang, "Reads your desk's own FX blotter as it is: realized P&L with price and points apart, carry, MTM, positions by value date and seven reconciliation checks on every file.", "Masanın kendi FX blotter'ını olduğu gibi okur: fiyat ve puanı ayrı gerçekleşen K/Z, taşıma, MTM, valöre göre pozisyonlar ve her dosyada yedi mutabakat kontrolü."),
         body, P(lang, "/fx-blotter"), "/fx-blotter" if tr else "/tr/fx-blotter", '<script src="/static/talep.js" defer></script>')

# ================================================================== Rule Guard
def rule_guard(lang):
    tr = lang == "tr"
    local = lnav("Rule Guard", lang, [(T(lang, "Overview", "Genel bakış"), "#top"), (T(lang, "What it does", "Ne yapar"), "#features"), (T(lang, "Pricing", "Fiyat"), "#pricing")],
                 T(lang, "Get early access", "Erken erişim al"), "#pricing", " data-erken-erisim")
    questions = (select("firma", T(lang, "Which firm are you taking a challenge with?", "Hangi firmada sınava giriyorsun?"), [("ftmo", "FTMO"), ("fundednext", "FundedNext"), ("fundingpips", "FundingPips"), ("the5ers", "The5ers"), ("topstep", "Topstep"), ("diger", T(lang, "Other", "Başka")), ("yok", T(lang, "Not yet", "Henüz girmedim"))], T(lang, "Choose", "Seç"))
                 + select("sinav", T(lang, "How many challenges in the last 12 months?", "Son 12 ayda kaç sınav aldın?"), [("0", "0"), ("1", "1"), ("2-3", "2-3"), ("4-10", "4-10"), ("10+", T(lang, "More than 10", "10'dan fazla"))], T(lang, "Choose", "Seç"))
                 + text_field("simdi", T(lang, "How do you track the daily loss limit today?", "Günlük kayıp sınırını şu an nasıl takip ediyorsun?")))
    body = f'''
<div data-talep-sayfa="rule-guard">
{local}
<section class="hero">
  <div class="wrap">
    <span class="kicker">Rule Guard{status_tag("test", lang)}</span>
    <h1 class="display">{T(lang, "Stay inside the limits.", "Sınırların içinde kal.")}</h1>
    <p class="sub">{T(lang, "An MT5 add-on that watches the firm's daily and total limits on every tick and pauses new trades near the floor.", "Firmanın günlük ve toplam sınırlarını her tick'te izleyen ve tabana yakın yeni işlemi bekleten bir MT5 eklentisi.")}</p>
    <div class="actions">{btn("#pricing", T(lang, "Get early access", "Erken erişim al"), " data-erken-erisim")}{more(LAB(lang, TA_SAMPLE), T(lang, "Check past days on a sample", "Geçmiş günleri bir örnekte kontrol et"))}</div>
  </div>
  <div class="stage">
    <div class="wrap" style="max-width:1100px">{prop_chart(lang)}<p class="caption">{T(lang, "Example account against FTMO 2-Step floors, first 60 trading days. Rule Guard watches the same floors live in MT5.", "Örnek hesap, FTMO 2-Step tabanlarına karşı ilk 60 işlem günü. Rule Guard aynı tabanları MT5'te canlı izler.")}</p></div>
  </div>
</section>

<section class="sec mist" id="features">
  <div class="wrap">
    <h2 class="title">{T(lang, "What it does.", "Ne yapar.")}</h2>
    <div class="tiles">
      {tile(T(lang, "Floors calculated the way your firm does.", "Tabanlar firmanın hesapladığı gibi."), T(lang, "The daily floor uses the start-of-day balance. The total floor uses the starting balance or the peak. The day resets at the firm's time.", "Günlük taban gün başı bakiyeden, toplam taban başlangıç bakiyesinden ya da tepeden hesaplanır. Gün, firmanın saatinde sıfırlanır."), f'<p class="big">5%<span style="font-size:.4em;color:var(--ink-3)"> / 10%</span></p>' if not tr else '<p class="big">%5<span style="font-size:.4em;color:var(--ink-3)"> / %10</span></p>')}
      {tile(T(lang, "No new trades near the floor.", "Tabana yakın yeni işlem yok."), T(lang, "At twice the safety margin, Kalibre Engine opens no new trades. At one safety margin, it closes its own positions.", "Güvenlik payının iki katında Kalibre Engine yeni işlem açmaz. Bir güvenlik payında kendi pozisyonlarını kapatır."), "", "dark")}
      {tile(T(lang, "Firm presets.", "Firma ön ayarları."), T(lang, "FTMO 2-Step, FTMO 1-Step, FTMO Instant and The5ers High Stakes, or your own limits. FundedNext and FundingPips are planned.", "FTMO 2-Step, FTMO 1-Step, FTMO Instant ve The5ers High Stakes ya da kendi sınırların. FundedNext ve FundingPips planlanıyor."), "", "third")}
      {tile(T(lang, "Your password stays yours.", "Şifren sende kalır."), T(lang, "Rule Guard runs as an Expert Advisor in your terminal. You never give us your MT5 password.", "Rule Guard terminalinde Expert Advisor olarak çalışır. MT5 şifreni bize hiçbir zaman vermezsin."), "", "third")}
      {tile(T(lang, "Dashboard and weekly report.", "Panel ve haftalık rapor."), T(lang, "Planned: distance to each floor, progress to the target, and the trades that broke a rule or came close.", "Planlanıyor: her tabana mesafe, hedefe ilerleme ve bir kuralı çiğneyen ya da yaklaşan işlemler."), "", "third")}
    </div>
  </div>
</section>

<section class="sec center" id="pricing">
  <div class="wrap">
    <h2 class="title">{T(lang, "Free during early access.", "Erken erişimde ücretsiz.")}</h2>
    {price_block(lang, "Rule Guard", [T(lang, "Four firm presets plus custom limits", "Dört firma ön ayarı ve özel sınırlar"), T(lang, "Daily and total floors, reset at the firm's time", "Günlük ve toplam taban, firmanın saatinde sıfırlama"), T(lang, "Two MT5 accounts per licence", "Lisans başına iki MT5 hesabı")], True)}
    {faq([(T(lang, "Does my firm allow EAs?", "Firmam EA kullanımına izin veriyor mu?"), T(lang, "Check your firm's rules on EAs; some firms restrict them. Rule Guard runs as an Expert Advisor in MT5.", "Firmanın EA kurallarını kontrol et; bazı firmalar EA kullanımını kısıtlıyor. Rule Guard MT5'te Expert Advisor olarak çalışır.")),
          (T(lang, "Can it stop trades I open by hand?", "Elle açtığım işlemleri durdurabilir mi?"), T(lang, "No. It counts positions opened by hand or by another EA when it works out the remaining room, but it cannot block those orders.", "Hayır. Elle ya da başka bir EA ile açılan pozisyonları kalan payı hesaplarken sayar, ama o emirleri engelleyemez.")),
          (T(lang, "Does it guarantee that I pass?", "Sınavı geçmemi garanti eder mi?"), T(lang, "No. It watches the loss limits only. Slippage and price gaps can cause losses beyond a stop.", "Hayır. Yalnız kayıp sınırlarını izler. Kayma ve fiyat boşlukları stopun ötesinde kayba yol açabilir.")),
          (T(lang, "Is Kalibre a prop firm?", "Kalibre bir prop firması mı?"), T(lang, "No. Kalibre is not affiliated with any prop firm. Firm names are used only to describe their rules.", "Hayır. Hiçbir prop firmasıyla bağlantısı yok. Firma adları yalnız kurallarını anlatmak için kullanılır."))])}
    <p class="legal-note">{T(lang, "Kalibre is software and does not give investment advice. Trading forex and CFDs on margin carries a high level of risk. You can lose all of the money you deposit.", "Kalibre bir yazılımdır ve yatırım tavsiyesi vermez. Kaldıraçlı forex ve CFD işlemleri yüksek risk taşır. Yatırdığın paranın tamamını kaybedebilirsin.")} <a href="{P(lang, "/risk-disclosure")}">{T(lang, "Risk disclosure", "Risk bildirimi")}</a></p>
  </div>
</section>
{signup_dialog(lang, questions)}
</div>'''
    page("tr/rule-guard/index.html" if tr else "rule-guard/index.html", lang,
         T(lang, "Rule Guard: trade inside your prop firm's limits on MT5", "Rule Guard: MT5'te prop firmasının sınırları içinde işlem yap"),
         T(lang, "An MT5 add-on that watches your firm's daily and total limits and pauses new trades near the floor. In early access.", "Firmanın günlük ve toplam sınırlarını MT5'te izleyen ve tabana yakın yeni işlemi bekleten eklenti. Erken erişimde."),
         body, P(lang, "/rule-guard"), "/rule-guard" if tr else "/tr/rule-guard", '<script src="/static/talep.js" defer></script>')

# ================================================================== Kalibre Lab
def kalibre_lab(lang):
    tr = lang == "tr"
    lab = SUMMARY["kalibreLab"]
    local = lnav("Kalibre Lab", lang, [(T(lang, "Overview", "Genel bakış"), "#top"), (T(lang, "Highlights", "Öne çıkanlar"), "#highlights"), (T(lang, "Validation", "Doğrulama"), "#validation")],
                 T(lang, "Open the lab", "Laboratuvarı aç"), LAB(lang, "/lab"))
    body = f'''
{local}
<section class="hero">
  <div class="wrap">
    <span class="kicker">Kalibre Lab{status_tag("beta", lang)}</span>
    <h1 class="display">{T(lang, "Test the rule before you trade it.", "Kuralı işlem yapmadan önce sına.")}</h1>
    <p class="sub">{T(lang, "Build a rule with blocks or a form, backtest it with costs, and check whether the best settings would have held up.", "Bloklarla ya da formla kural kur, maliyetlerle backtest et ve en iyi ayarların dayanıp dayanmayacağını sına.")}</p>
    <div class="actions">{btn(LAB(lang, LAB_SAMPLE), T(lang, "Run the sample backtest", "Örnek backtest'i çalıştır"))}{more(LAB(lang, "/lab"), T(lang, "Open the lab", "Laboratuvarı aç"))}</div>
  </div>
  <div class="stage">
    <div class="wrap" style="max-width:820px">{shot("lab-backtest", T(lang, "Sample backtest: trades on the price chart, equity curve, result ID and statistics", "Örnek backtest: fiyat grafiğinde işlemler, özkaynak eğrisi, sonuç kimliği ve istatistikler"), lang, eager=True, sizes="(max-width: 820px) 100vw, 820px")}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="row">
      <div class="row-text"><h2 class="title-s">{T(lang, "Rules you can read.", "Okuyabildiğin kurallar.")}</h2><p class="lede">{T(lang, "Blocks for entries, exits, stops, targets and risk. The lab writes the rule back in plain language, so you can check what you built.", "Giriş, çıkış, stop, hedef ve risk için bloklar. Laboratuvar kuralı düz bir dille geri yazar; ne kurduğunu kontrol edebilirsin.")}</p>
      <div class="actions left">{more(LAB(lang, "/lab"), T(lang, "Start from a template", "Bir şablondan başla"))}</div></div>
      <div>{shot("lab-builder", T(lang, "Rule builder with entry and exit blocks", "Giriş ve çıkış bloklarıyla kural kurucu"), lang, sizes="(max-width: 860px) 100vw, 720px")}</div>
    </div>
  </div>
</section>

<section class="sec mist" id="highlights">
  <div class="wrap">
    <h2 class="title">{T(lang, "Get the highlights.", "Öne çıkanlar.")}</h2>
    <div class="tiles">
      {tile(T(lang, "Costs and fills you choose.", "Seçtiğin maliyet ve dolumlar."), T(lang, "Spread, commission and slippage. Contract size, lot steps, swap and margin. Four fill models for the bar that touches both stop and target.", "Spread, komisyon ve kayma. Sözleşme büyüklüğü, lot adımı, swap ve teminat. Aynı mumda hem stopa hem hedefe değen durum için dört dolum modeli."))}
      {tile(T(lang, "Settings that hold up, or not.", "Dayanan ayarlar, ya da dayanmayanlar."), T(lang, "Training and test periods, a walk-forward run, the deflated Sharpe ratio and the probability of backtest overfitting.", "Eğitim ve test dönemleri, yürüyen ileri analiz, deflated Sharpe oranı ve backtest aşırı uyum olasılığı."), "", "dark")}
      {tile(T(lang, "Same inputs, same result ID.", "Aynı girdi, aynı sonuç kimliği."), T(lang, "Every run gets an ID from the rule, the data and the settings. Export the run and anyone can check it.", "Her çalıştırma kural, veri ve ayarlardan bir kimlik alır. Çalıştırmayı dışa aktar, herkes kontrol edebilir."), f'<p class="big" style="font-size:clamp(24px,3vw,34px);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0">kr1-{lab["resultId"][:16]}</p>', "")}
      {tile(T(lang, "Thirteen templates.", "On üç şablon."), T(lang, "Trend, pullback, breakout and volatility-targeted rules to start from, each with its sources.", "Başlangıç için trend, geri çekilme, kırılım ve oynaklık hedefli kurallar; her biri kaynaklarıyla."), "", "")}
    </div>
  </div>
</section>

<section class="sec night" id="validation">
  <div class="wrap">
    <h2 class="title">{T(lang, "Checked against MetaTrader 5.", "MetaTrader 5'e karşı sınandı.")}</h2>
    <p class="lede">{T(lang, "The engine is compared trade by trade with the MT5 Strategy Tester, and recomputed by a separate reference implementation written from the rule specification alone.", "Motor MT5 Strategy Tester ile işlem işlem karşılaştırılır ve yalnız kural şartnamesinden yazılmış ayrı bir referans uygulamayla yeniden hesaplanır.")}</p>
    <div class="numbers">
      <div><b>97</b><span>{T(lang, "Strategy Tester runs", "Strategy Tester koşusu")}</span></div>
      <div><b>{fmt(44015, lang)}</b><span>{T(lang, "MT5 trades compared", "karşılaştırılan MT5 işlemi")}</span></div>
      <div><b>{fmt(87315, lang)}</b><span>{T(lang, "trades recomputed", "yeniden hesaplanan işlem")}</span></div>
      <div><b>0</b><span>{T(lang, "unexplained differences", "açıklanamayan fark")}</span></div>
    </div>
    <div class="actions left">{more(P(lang, "/methodology"), T(lang, "Read the methodology", "Metodolojiyi oku"))}</div>
    <p class="legal-note" style="margin-left:0">{T(lang, "Backtests and simulations are hypothetical and do not reflect actual trading. Past performance is not indicative of future results.", "Backtest ve simülasyonlar varsayımsaldır ve gerçek işlemleri yansıtmaz. Geçmiş performans gelecekteki sonuçların göstergesi değildir.")}</p>
  </div>
</section>'''
    page("tr/kalibre-lab/index.html" if tr else "kalibre-lab/index.html", lang,
         T(lang, "Kalibre Lab: build, backtest and check trading rules", "Kalibre Lab: işlem kurallarını kur, backtest et, sına"),
         T(lang, "Build a rule with blocks or a form, backtest it with costs and check settings with training and test periods, deflated Sharpe and the probability of backtest overfitting.", "Bloklarla ya da formla kural kur, maliyetlerle backtest et; ayarları eğitim ve test dönemleri, deflated Sharpe ve aşırı uyum olasılığıyla sına."),
         body, P(lang, "/kalibre-lab"), "/kalibre-lab" if tr else "/tr/kalibre-lab")

# ================================================================== Demos
def demos(lang):
    tr = lang == "tr"
    ta, fx, lab = SUMMARY[f"tradeAnalytics_{lang}"], SUMMARY[f"fxBlotter_{lang}"], SUMMARY["kalibreLab"]
    fx_in, fx_res = ("fx-blotter-ornek", "fx-blotter-ornek-sonuc") if tr else ("fx-blotter-sample", "fx-blotter-sample-result")
    ta_res = "trade-analytics-ornek-sonuc" if tr else "trade-analytics-sample-result"
    def files(input_links, open_href, result_links, open_note):
        return (f'<div class="files"><div class="file"><h3>{T(lang, "Input", "Girdi")}</h3><div class="file-links">{input_links}</div></div>'
                f'<div class="file"><h3>{T(lang, "Open in the browser", "Tarayıcıda aç")}</h3><p>{open_note}</p><div class="file-links">{more(open_href, T(lang, "Open the result", "Sonucu aç"))}</div></div>'
                f'<div class="file"><h3>{T(lang, "Result workbook", "Sonuç dosyası")}</h3><div class="file-links">{result_links}</div></div></div>')
    def section(sid, name, status, headline, figures, files_html, shots, bg):
        figs = '<div class="numbers">' + "".join(f"<div><b>{v}</b><span>{k}</span></div>" for v, k in figures) + "</div>"
        return (f'<section class="sec {bg}" id="{sid}"><div class="wrap"><span class="kicker">{name}{status_tag(status, lang)}</span><h2 class="title">{headline}</h2>'
                f'{figs}{files_html}<div class="tiles">{shots}</div></div></section>')
    def shot_tile(name, alt, cls=""):
        return f'<div class="tile {cls}" style="min-height:0;padding:0;background:transparent">{shot(name, alt, lang, sizes="(max-width: 860px) 100vw, 600px", caption=alt)}</div>'
    body = f'''
<section class="hero">
  <div class="wrap">
    <h1 class="display">{T(lang, "Try every product with a sample.", "Her ürünü bir örnekle dene.")}</h1>
    <p class="sub">{T(lang, "Download the input, open the result in your browser, then compare it with the result workbook.", "Girdiyi indir, sonucu tarayıcında aç, sonra sonuç dosyasıyla karşılaştır.")}</p>
  </div>
</section>
{section("trade-analytics", "Trade Analytics", "beta", T(lang, "A trade log of 343 closed trades.", "343 kapanmış işlemlik bir işlem kaydı.") if ta["trades"] == 343 else "Trade Analytics",
         [(fmt(ta["trades"], lang), T(lang, "closed trades", "kapanmış işlem")), (fmt(ta["netUsd"], lang, 0, True), T(lang, "net P&amp;L, USD", "net K/Z, USD")), (pct(ta["winRatePct"], lang), T(lang, "win rate", "kazanma oranı")), (fmt(ta["profitFactor"], lang, 2), T(lang, "profit factor", "kâr faktörü"))],
         files(more("/lab/templates/kalibre-trade-log-example.xlsx", "kalibre-trade-log-example.xlsx", " download") + more("/lab/templates/kalibre-trade-log-example.csv", T(lang, "CSV version", "CSV sürümü"), " download"),
               LAB(lang, TA_SAMPLE), more(f"/lab/samples/{ta_res}.xlsx", f"{ta_res}.xlsx", " download"), T(lang, "The same file opens in Trade Analytics.", "Aynı dosya Trade Analytics'te açılır.")),
         shot_tile("analytics-overview", T(lang, "Account overview of the example log", "Örnek kaydın hesap özeti")) + shot_tile("analytics-segments", T(lang, "Segments ranked by their effect on the result", "Sonuca etkisine göre sıralı dilimler")), "paper")}
{section("fx-blotter", "FX Blotter Analytics", "beta", T(lang, "One week of a bank FX desk.", "Bir banka FX masasının bir haftası."),
         [(fmt(fx["legs"], lang), T(lang, "legs imported", "bacak aktarıldı")), (fmt(fx["totalUsd"], lang, 0, True), T(lang, "total P&amp;L, USD", "toplam K/Z, USD")), (fmt(fx["priceUsd"], lang, 0, True), T(lang, "price P&amp;L, USD", "fiyat K/Z, USD")), (f'{fx["checksPassed"]}/{fx["checks"]}', T(lang, "reconciliation checks passed", "mutabakat kontrolü geçti"))],
         files(more(f"/lab/samples/{fx_in}.xlsx", f"{fx_in}.xlsx", " download") + more(f"/lab/samples/{fx_in}.csv", T(lang, "CSV version", "CSV sürümü"), " download"),
               FX_SAMPLE[lang], more(f"/lab/samples/{fx_res}.xlsx", f"{fx_res}.xlsx", " download"), T(lang, "Example rates, overnight rates and limits are filled in.", "Örnek kur, faiz ve limitler girilir.")),
         shot_tile("blotter-summary", T(lang, "Summary of the sample blotter", "Örnek blotter özeti")) + shot_tile("blotter-reconciliation", T(lang, "Reconciliation panel", "Mutabakat paneli")), "mist")}
{section("lab", "Kalibre Lab", "beta", T(lang, "A trend rule on 3,000 hourly bars.", "3.000 saatlik mumda bir trend kuralı.") if lab["bars"] == 3000 else "Kalibre Lab",
         [(fmt(lab["trades"], lang), T(lang, "trades", "işlem")), (fmt(lab["profitFactor"], lang, 2), T(lang, "profit factor", "kâr faktörü")), (pct(lab["returnPct"], lang, 2), T(lang, "return, no costs", "getiri, maliyetsiz")), (pct(lab["maxDrawdownPct"], lang, 2), T(lang, "max drawdown", "azami düşüş"))],
         files(more("/lab/samples/kalibre-lab-sample-strategy.json", "kalibre-lab-sample-strategy.json", " download") + more("/lab/samples/kalibre-lab-sample-prices.csv", "kalibre-lab-sample-prices.csv", " download"),
               LAB(lang, LAB_SAMPLE), more("/lab/samples/kalibre-lab-sample-result.xlsx", "kalibre-lab-sample-result.xlsx", " download") + more("/lab/samples/kalibre-lab-sample-result.json", "kalibre-lab-sample-result.json", " download"), T(lang, f"The rule and prices load and the backtest runs. Result ID kr1-{lab['resultId'][:16]}.", f"Kural ve fiyatlar yüklenir, backtest çalışır. Sonuç kimliği kr1-{lab['resultId'][:16]}.")),
         shot_tile("lab-backtest", T(lang, "Backtest result with equity curve and statistics", "Özkaynak eğrisi ve istatistiklerle backtest sonucu")), "paper")}
<section class="sec mist center">
  <div class="wrap">
    <h2 class="title-s">Rule Guard{status_tag("test", lang)}</h2>
    <p class="lede">{T(lang, "Rule Guard runs inside MT5, so there is no web demo. The same daily and total limits appear in the Prop limits section of the Trade Analytics sample.", "Rule Guard MT5 içinde çalışır, bu yüzden web demosu yok. Aynı günlük ve toplam sınırlar Trade Analytics örneğinin Prop sınırları bölümünde görünür.")}</p>
    <div class="actions">{more(LAB(lang, TA_SAMPLE), T(lang, "Open the sample", "Örneği aç"))}{more(P(lang, "/rule-guard"), T(lang, "About Rule Guard", "Rule Guard hakkında"))}</div>
  </div>
</section>'''
    page("tr/demo/index.html" if tr else "demo/index.html", lang,
         T(lang, "Demos: every product with sample input and result files", "Demolar: her ürün örnek girdi ve sonuç dosyasıyla"),
         T(lang, "Try Trade Analytics, FX Blotter Analytics and Kalibre Lab with sample files: download the input, open the result in your browser and compare it with the result workbook.", "Trade Analytics, FX Blotter Analytics ve Kalibre Lab'i örnek dosyalarla dene: girdiyi indir, sonucu tarayıcında aç, sonuç dosyasıyla karşılaştır."),
         body, P(lang, "/demo"), "/demo" if tr else "/tr/demo")

# ================================================================== Company
def company(lang):
    tr = lang == "tr"
    c = COMPANY[lang]
    who = "".join(tile(f"{k}", f"{d}", f'<p class="big" style="font-size:clamp(22px,2.4vw,28px);letter-spacing:0">{w}</p>', "third") for w, k, d in c["kimler"])
    beliefs = "".join(f'<div><h3>{h}</h3><p>{p}</p>' + (f'<div class="actions left" style="margin-top:12px">{more(u, l)}</div>' if u else "") + "</div>" for h, p, u, l in c["ilkeler"])
    body = f'''
<section class="hero">
  <div class="wrap">
    <h1 class="display">{c["h1"]}</h1>
    <p class="sub">{c["giris"]}</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="numbers" style="grid-template-columns:repeat(3,minmax(0,1fr))">{"".join(f'<div><span style="margin:0 0 6px">{k}</span><b style="font-size:clamp(21px,2.2vw,28px);letter-spacing:0;line-height:1.2">{v}</b></div>' for k, v in c["kunye"])}</div>
  </div>
</section>

<section class="sec mist">
  <div class="wrap">
    <h2 class="title" style="max-width:22ch">{c["neden_bas"]}.</h2>
    <p class="lede">{c["neden_giris"]}</p>
    {facts([(i, h, p) for i, (h, p) in zip(["file", "rate", "shield"], c["sorunlar"])])}
    <p class="lede" style="margin-top:56px"><b>{c["katman_not"]}</b></p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <h2 class="title">{c["kim_bas"]}.</h2>
    <p class="lede">{c["kim_giris"]}</p>
    <div class="tiles">{who}</div>
  </div>
</section>

<section class="sec night">
  <div class="wrap">
    <h2 class="title">{c["ilke_bas"]}.</h2>
    <p class="lede">{c["ilke_giris"]}</p>
    <div class="facts" style="grid-template-columns:1fr 1fr">{beliefs}</div>
  </div>
</section>

<section class="sec mist" id="partners">
  <div class="wrap">
    <h2 class="title">{c["kurum_bas"]}.</h2>
    <p class="lede">{c["kurum_giris"]}</p>
    {steps(c["kurum"])}
  </div>
</section>

<section class="sec center" id="contact">
  <div class="wrap">
    <h2 class="title">{c["son_bas"]}.</h2>
    <p class="lede">{c["son_giris"]}</p>
    <div class="actions">{btn(f'mailto:markets@kalibrefin.com?subject={c["b1_konu"]}', c["b1"])}{more("mailto:markets@kalibrefin.com", c["b2"])}</div>
  </div>
</section>'''
    page("tr/company/index.html" if tr else "company/index.html", lang, c["title"], c["desc"], body, P(lang, "/company"), "/company" if tr else "/tr/company")

for lang in ("en", "tr"):
    home(lang)
    trade_analytics(lang)
    fx_blotter(lang)
    rule_guard(lang)
    kalibre_lab(lang)
    demos(lang)
    company(lang)
