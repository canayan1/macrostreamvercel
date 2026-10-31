# Current marketing pages in the site design system (static/site.css), English and Turkish:
#   /                home: one panel per product, privacy, validation
#   /trade-analytics /fx-blotter /rule-guard /desk-signal /kalibre-lab   product pages with a local nav
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
FX_TOUR = {k: v + "&amp;tour=1" for k, v in FX_SAMPLE.items()}
LAB_SAMPLE = "/lab?demo=1"

# ------------------------------------------------------------------ Rule Guard illustration
def prop_chart(lang, days=60, legend=True):
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
            f'<path d="{path("end")}" fill="none" stroke="#ffa630" stroke-width="2.5" stroke-linejoin="round"/>{lows}{ticks}{leg if legend else ""}</svg></figure>')

def replay(lang):
    """Rule Guard on the example account's closest day: closed balance after each trade against the floor,
    with the default safety margin bands (summary.json propReplay, written by ornek-dosya-uret.mjs)."""
    r = SUMMARY["tradeAnalytics_en"]["propReplay"]
    st, floor, m = r["steps"], r["floor"], r["margin"]
    W, H, L, R, TOP, BOT = 1000, 400, 40, 200, 20, 44
    lo, hi = floor - 500, max(x["balance"] for x in st) + 500
    x = lambda i: L + i * (W - L - R) / (len(st) - 1)
    y = lambda v: TOP + (hi - v) * (H - TOP - BOT) / (hi - lo)
    path = f"M{x(0):.1f},{y(st[0]['balance']):.1f}" + "".join(f" H{x(i):.1f} V{y(p['balance']):.1f}" for i, p in enumerate(st) if i)
    band = lambda v1, v2, c: f'<rect x="{L}" y="{y(v2):.1f}" width="{W - L - R}" height="{y(v1) - y(v2):.1f}" fill="{c}"/>'
    line = lambda v, c, dash, label: (f'<line x1="{L}" x2="{W - R}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="{c}" stroke-width="1.5" stroke-dasharray="{dash}"/>'
                                     f'<text x="{W - R + 10}" y="{y(v) + 4:.1f}" fill="{c}" font-size="17">{label}</text>')
    colour = {"open": "#ebe3d3", "pause": "#ffa630", "lock": "#ef4444"}
    dots = "".join(f'<circle cx="{x(i):.1f}" cy="{y(p["balance"]):.1f}" r="5" fill="{colour[p["state"]]}"/>' for i, p in enumerate(st))
    times = "".join(f'<text x="{x(i):.1f}" y="{H - 14}" text-anchor="middle" fill="#6f6553" font-size="17">{p["time"] or T(lang, "start", "gün başı")}</text>' for i, p in enumerate(st))
    title = T(lang, "Closed balance through the closest day against the daily floor and Rule Guard's margins", "En yakın günde kapanış bakiyesi, günlük taban ve Rule Guard payları")
    svg = (f'<figure class="shot" style="background:var(--night);padding:24px 16px 8px"><svg viewBox="0 0 {W} {H}" role="img" aria-label="{title}" font-family="Geist Mono, ui-monospace, monospace">'
           + band(floor, floor + m, "rgba(239,68,68,.14)") + band(floor + m, floor + 2 * m, "rgba(255,166,48,.12)")
           + line(floor, "#ef4444", "6 5", T(lang, "daily floor", "günlük taban")) + line(floor + m, "#ef4444", "2 4", T(lang, "close and lock", "kapat ve kilitle"))
           + line(floor + 2 * m, "#ffa630", "2 4", T(lang, "pause new trades", "yeni işlem bekler"))
           + f'<path d="{path}" fill="none" stroke="#ffa630" stroke-width="2.5"/>{dots}{times}</svg></figure>')
    lock = next(p for p in st if p["state"] == "lock")
    before = st[st.index(lock) - 1]
    months = {"en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
              "tr": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]}[lang]
    d = r["day"]
    day = f"{int(d[8:])} {months[int(d[5:7]) - 1]}"
    usd = lambda v: fmt(v, lang) + " USD"
    events = [(before["time"], T(lang, f"Room to the floor: {usd(before['room'])}. Trading as usual.", f"Tabana mesafe: {usd(before['room'])}. İşlemler olağan.")),
              (lock["time"], T(lang, f"Room {usd(lock['room'])}, inside the {usd(m)} margin. Rule Guard closes the positions it opened and locks the day until the reset.",
                               f"Mesafe {usd(lock['room'])}, {usd(m)} payın içinde. Rule Guard açtığı pozisyonları kapatır ve günü sıfırlanana kadar kilitler."))]
    items = "".join(f'<li><b>{t}</b><span>{e}</span></li>' for t, e in events)
    return f'''
<section class="sec mist" id="replay">
  <div class="wrap">
    <h2 class="title">{T(lang, "Replay the closest day.", "En yakın günü yeniden oynat.")}</h2>
    <p class="lede">{T(lang, f"{day}, the example account on FTMO 2-Step. The closed balance came within {usd(lock['room'])} of the daily floor.", f"{day}, FTMO 2-Step üzerindeki örnek hesap. Kapanış bakiyesi günlük tabana {usd(lock['room'])} yaklaştı.")}</p>
    <div class="replay">{svg}<ol class="replay-events">{items}</ol></div>
    <p class="caption">{T(lang, "Times are server time. Live, Rule Guard reads equity on every tick, so new trades wait as soon as the room reaches", "Saatler sunucu saatidir. Canlıda Rule Guard varlığı her tick'te okur; mesafe")} {usd(2 * m)}{T(lang, ".", "'a indiğinde yeni işlemler bekler.")} {T(lang, "Margins shown are the defaults: 0.5% of the start.", "Gösterilen paylar varsayılandır: başlangıcın %0,5'i.")}</p>
  </div>
</section>'''

FORMATS = [("platform-export", "Trading platform export", "İşlem platformu dökümü", "Bought and sold columns, UTC times, one ID for both swap legs.", "Alınan ve satılan sütunları, UTC saat, iki swap bacağına tek kimlik."),
           ("tms-export", "Treasury system report", "Hazine sistemi raporu", "Title rows, DD/MM/YYYY dates, dealt and contra amounts, a grand total row.", "Başlık satırları, GG/AA/YYYY tarih, işlem ve karşı tutar, genel toplam satırı."),
           ("confirmation-mt300", "MT300 confirmations", "MT300 teyitleri", "SWIFT field tags, comma decimals, amendments as AMND with a related reference.", "SWIFT alan etiketleri, virgüllü ondalık, düzeltmeler ilgili referanslı AMND."),
           ("fix-dropcopy", "FIX drop copy", "FIX işlem kopyası", "Tag numbers as headers, side codes 1 and 2, corrections as ExecType G.", "Başlıkta etiket numaraları, 1 ve 2 yön kodları, ExecType G düzeltmeleri."),
           ("desk-excel", "Hand-kept Excel (German)", "Elle tutulan Excel (Almanca)", "German headers, 1.000.000,00 numbers, mixed date formats, a Summe row.", "Almanca başlıklar, 1.000.000,00 sayılar, karışık tarih biçimleri, Summe satırı.")]

def formats_block(lang):
    legs = fmt(SUMMARY[f"fxBlotter_{lang}"]["legs"], lang)
    def card(k, en, tr, den, dtr):
        links = (more(LAB(lang, f"/lab/blotter?file=samples/formats/fx-blotter-{k}.xlsx"), T(lang, "Open it", "Aç"))
                 + more(f"/lab/samples/formats/fx-blotter-{k}.xlsx", "Excel", " download")
                 + more(f"/lab/samples/formats/fx-blotter-{k}.csv", "CSV", " download"))
        return f'<div class="file"><h3>{T(lang, en, tr)}</h3><p>{T(lang, den, dtr)}</p><div class="file-links">{links}</div></div>'
    head = T(lang, "Same deals, five systems.", "Aynı deal'ler, beş sistem.")
    lede = T(lang, f"Each file lays out the same week the way a different system would. Every one gives {legs} legs and the same total P&amp;L.",
             f"Her dosya aynı haftayı farklı bir sistemin dizdiği gibi verir. Hepsi {legs} bacak ve aynı toplam K/Z verir.")
    rows = "".join(card(*f) for f in FORMATS)
    return (f'<h3 class="title-s" style="margin-top:clamp(56px,7vw,88px)">{head}</h3><p class="lede">{lede}</p>'
            f'<div class="files files-5">{rows}</div>')

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
{page_hero(T(lang, "Find your edge.", "Avantajını bul."),
           T(lang, "Drop in an MT5 report. See what works, by symbol, hour and habit.", "Bir MT5 raporu bırak. Neyin işe yaradığını sembol, saat ve alışkanlığa göre gör."),
           btn(sample, T(lang, "Try it with a sample file", "Örnek dosyayla dene")) + more("#pricing", T(lang, "Get early access", "Erken erişim al"), " data-erken-erisim"),
           hero_image("trade-analytics", lang, T(lang, "Trade Analytics on a laptop: account overview of an example account with net P&amp;L, balance curve and segments", "Dizüstünde Trade Analytics: örnek hesabın net K/Z, bakiye eğrisi ve dilimleriyle hesap özeti")),
           kicker="Trade Analytics" + status_tag("beta", lang))}

<section class="sec center" id="how">
  <div class="wrap">
    <h2 class="title">{T(lang, "From a file to an answer in three steps.", "Bir dosyadan cevaba üç adımda.")}</h2>
    {steps([(T(lang, "Export your report", "Raporunu al"), T(lang, "In MT5, right-click the History tab and choose Report, then HTML.", "MT5'te Geçmiş sekmesinde sağ tıkla, Rapor menüsünden HTML'i seç.")),
            (T(lang, "Drop it in", "Sayfaya bırak"), T(lang, "The file is read in your browser. No install and no account.", "Dosya tarayıcında okunur. Kurulum ya da hesap gerekmez.")),
            (T(lang, "Read the breakdowns", "Kırılımları oku"), T(lang, "Overview, segments, prop limits and the views you save.", "Özet, dilimler, prop sınırları ve kaydettiğin görünümler."))])}
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
{page_hero(T(lang, "Your blotter, explained.", "Blotter'ın, açıklanmış."),
           T(lang, "Drop in your desk's export. Every total opens its deals.", "Masanın dökümünü bırak. Her toplam deal'lerini açar."),
           btn(FX_TOUR[lang], T(lang, "Take the 2-minute tour", "2 dakikalık turu başlat")) + more("#demo", T(lang, "Request a demo", "Demo iste"), " data-erken-erisim"),
           hero_image("fx-blotter", lang, T(lang, "FX Blotter Analytics on a laptop: P&amp;L table of the sample blotter by pair, split into price, points, carry and MTM", "Dizüstünde FX Blotter Analytics: örnek blotter'ın parite bazında fiyat, puan, taşıma ve MTM olarak ayrılmış K/Z tablosu")),
           kicker="FX Blotter Analytics" + status_tag("beta", lang))}

<section class="sec center" id="how">
  <div class="wrap">
    <h2 class="title">{T(lang, "Export. Drop. Read.", "Dök. Bırak. Oku.")}</h2>
    {steps([(T(lang, "Export the blotter", "Blotter'ı dök"), T(lang, "From 360T, Murex, Bloomberg or the Excel your desk keeps.", "360T, Murex, Bloomberg ya da masanın tuttuğu Excel'den.")),
            (T(lang, "Drop it in", "Sayfaya bırak"), T(lang, "Columns are matched for you. The file stays in your browser.", "Sütunlar senin için eşleşir. Dosya tarayıcında kalır.")),
            (T(lang, "Read the day", "Günü oku"), T(lang, "P&amp;L by price and points, positions, and seven checks.", "Fiyat ve puana göre K/Z, pozisyonlar ve yedi kontrol."))])}
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
    {formats_block(lang)}
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
    local = lnav("Rule Guard", lang, [(T(lang, "Overview", "Genel bakış"), "#top"), (T(lang, "Replay", "Tekrar"), "#replay"), (T(lang, "What it does", "Ne yapar"), "#features"), (T(lang, "Pricing", "Fiyat"), "#pricing")],
                 T(lang, "Get early access", "Erken erişim al"), "#pricing", " data-erken-erisim")
    questions = (select("firma", T(lang, "Which firm are you taking a challenge with?", "Hangi firmada sınava giriyorsun?"), [("ftmo", "FTMO"), ("fundednext", "FundedNext"), ("fundingpips", "FundingPips"), ("the5ers", "The5ers"), ("topstep", "Topstep"), ("diger", T(lang, "Other", "Başka")), ("yok", T(lang, "Not yet", "Henüz girmedim"))], T(lang, "Choose", "Seç"))
                 + select("sinav", T(lang, "How many challenges in the last 12 months?", "Son 12 ayda kaç sınav aldın?"), [("0", "0"), ("1", "1"), ("2-3", "2-3"), ("4-10", "4-10"), ("10+", T(lang, "More than 10", "10'dan fazla"))], T(lang, "Choose", "Seç"))
                 + text_field("simdi", T(lang, "How do you track the daily loss limit today?", "Günlük kayıp sınırını şu an nasıl takip ediyorsun?")))
    caption = T(lang, "Example account against FTMO 2-Step floors, first 60 trading days. Rule Guard watches the same floors live in MT5.", "Örnek hesap, FTMO 2-Step tabanlarına karşı ilk 60 işlem günü. Rule Guard aynı tabanları MT5'te canlı izler.")
    chart = prop_chart(lang) + f'<p class="caption">{caption}</p>'
    body = f'''
<div data-talep-sayfa="rule-guard">
{local}
{page_hero(T(lang, "Stay inside the limits.", "Sınırların içinde kal."),
           T(lang, "Your firm's daily and total limits, watched on every tick in MT5.", "Firmanın günlük ve toplam sınırları, MT5'te her tick'te izlenir."),
           btn("#pricing", T(lang, "Get early access", "Erken erişim al"), " data-erken-erisim") + more(LAB(lang, TA_SAMPLE), T(lang, "Check past days on a sample", "Geçmiş günleri bir örnekte kontrol et")),
           chart,
           kicker="Rule Guard" + status_tag("test", lang), media_cls="chart")}

<section class="sec center" id="how">
  <div class="wrap">
    <h2 class="title">{T(lang, "Set it once.", "Bir kez kur.")}</h2>
    {steps([(T(lang, "Add it to MT5", "MT5'e ekle"), T(lang, "Rule Guard runs as an Expert Advisor in your terminal.", "Rule Guard terminalinde Expert Advisor olarak çalışır.")),
            (T(lang, "Pick your firm", "Firmanı seç"), T(lang, "Choose a preset or type your own limits.", "Bir ön ayar seç ya da kendi sınırlarını yaz.")),
            (T(lang, "Trade as usual", "Her zamanki gibi işlem yap"), T(lang, "Near the floor, new trades wait.", "Tabana yaklaşınca yeni işlemler bekler."))])}
  </div>
</section>

{replay(lang)}
<section class="sec" id="features">
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

# ================================================================== Desk Signal
DESK_DEMO = "/lab/desk"

def desk_signal(lang):
    tr = lang == "tr"
    local = lnav("Desk Signal", lang, [(T(lang, "Overview", "Genel bakış"), "#top"), (T(lang, "How it works", "Nasıl çalışır"), "#how"), (T(lang, "What it does", "Ne yapar"), "#features"), (T(lang, "Next", "Sırada"), "#next"), (T(lang, "Early access", "Erken erişim"), "#pricing")],
                 T(lang, "Try the demo", "Demoyu dene"), LAB(lang, DESK_DEMO))
    questions = (select("kurum", T(lang, "Where do you work?", "Nerede çalışıyorsun?"), [("prop-firma", T(lang, "Prop firm", "Prop firması")), ("banka", T(lang, "Bank", "Banka")), ("kurumsal-hazine", T(lang, "Corporate treasury", "Kurumsal hazine")), ("araci-kurum", T(lang, "Broker", "Aracı kurum")), ("fon", T(lang, "Fund", "Fon")), ("diger", T(lang, "Other", "Başka"))], T(lang, "Choose", "Seç"))
                 + select("masa", T(lang, "How many traders on the desk?", "Masada kaç trader var?"), [("2-5", "2-5"), ("6-20", "6-20"), ("21-50", "21-50"), ("50+", T(lang, "More than 50", "50'den fazla"))], T(lang, "Choose", "Seç"))
                 + text_field("simdi", T(lang, "How does the head of desk reach traders today?", "Masa şefi trader'lara bugün nasıl ulaşıyor?"), T(lang, "Chat, voice, calling across the room", "Sohbet, ses hattı, odada seslenmek")))
    def plan_tile(h, p, cls=""):
        return tile(h + status_tag("plan", lang), p, "", cls)
    body = f'''
<div data-talep-sayfa="desk-signal">
{local}
{page_hero(T(lang, "One key to the whole desk.", "Tek tuşla bütün masa."),
           T(lang, "Colour signals from the head of desk to every trader's screen, in every city, with a record of who answered.", "Masa şefinden her şehirdeki her trader'ın ekranına renkli sinyal; kimin yanıt verdiğinin kaydıyla."),
           btn(LAB(lang, DESK_DEMO), T(lang, "Try the demo", "Demoyu dene")) + more(LAB(lang, DESK_DEMO + "?tour=1"), T(lang, "Take the 1-minute tour", "1 dakikalık turu başlat")),
           hero_image("desk-signal", lang, T(lang, "Desk Signal demo on a laptop: the head of desk's signal board next to four trader screens, one orb lit amber in London and one grown red in Tokyo", "Dizüstünde Desk Signal demosu: masa şefinin sinyal panosu ve dört trader ekranı; Londra'da amber, Tokyo'da büyümüş kırmızı bir top")),
           kicker="Desk Signal" + status_tag("test", lang))}

<section class="sec center" id="how">
  <div class="wrap">
    <h2 class="title">{T(lang, "Pick. Send. See.", "Seç. Gönder. Gör.")}</h2>
    {steps([(T(lang, "Pick a signal", "Sinyali seç"), T(lang, "Up to nine colours, each with one meaning your desk agrees on.", "Dokuz renge kadar; her birinin masanın üzerinde anlaştığı tek bir anlamı var.")),
            (T(lang, "Pick who gets it", "Kime gideceğini seç"), T(lang, "One trader, one city or everyone. Two keys or two clicks.", "Bir trader, bir şehir ya da herkes. İki tuş ya da iki tık.")),
            (T(lang, "See who answered", "Kimin yanıt verdiğini gör"), T(lang, "Every signal shows when it was seen and when it was done.", "Her sinyal ne zaman görüldüğünü ve ne zaman bittiğini gösterir."))])}
  </div>
</section>

<section class="sec mist" id="features">
  <div class="wrap">
    <h2 class="title">{T(lang, "What it does.", "Ne yapar.")}</h2>
    <div class="tiles">
      {tile(T(lang, "Quicker than a chat message.", "Sohbet mesajından hızlı."), T(lang, "No window to find and nothing to type. The signal lights up the corner of every screen it is sent to.", "Bulunacak pencere, yazılacak mesaj yok. Sinyal gönderildiği her ekranın köşesinde yanar."))}
      {tile(T(lang, "Rings until answered.", "Yanıtlanana kadar çalar."), T(lang, "Urgent signals keep sounding until the trader opens them. After 10 seconds the orb grows. After 20 seconds the trader's name turns red on your screen.", "Acil sinyaller trader açana kadar çalmaya devam eder. 10 saniye sonra top büyür. 20 saniye sonra trader'ın adı senin ekranında kırmızıya döner."), "", "dark")}
      {tile(T(lang, "Every location on one board.", "Her lokasyon tek panoda."), T(lang, "Send to a city with one key and see each trader's local time next to their answer.", "Tek tuşla bir şehre gönder; her trader'ın yerel saatini yanıtının yanında gör."), "", "third")}
      {tile(T(lang, "A log for your records.", "Kayıtların için bir log."), T(lang, "Sent, delivered, seen and done, to the second in UTC. Download it as CSV or Excel.", "Gönderildi, ulaştı, görüldü ve bitti; UTC'de saniyesine kadar. CSV ya da Excel olarak indir."), "", "third")}
      {tile(T(lang, "Fixed meanings, never orders.", "Sabit anlamlar, asla emir değil."), T(lang, "A signal carries only a meaning from your board. No free text, no orders and no market data.", "Sinyal yalnız panondaki bir anlamı taşır. Serbest metin, emir ya da piyasa verisi yok."), "", "third")}
    </div>
  </div>
</section>

<section class="sec" id="next">
  <div class="wrap">
    <h2 class="title">{T(lang, "What comes next.", "Sırada ne var.")}</h2>
    <div class="tiles">
      {plan_tile(T(lang, "Desktop app.", "Masaüstü uygulaması."), T(lang, "For Mac and Windows. The orb sits in a corner above every window, and the same keys work from any app with ⌃⌥.", "Mac ve Windows için. Top her pencerenin üstünde bir köşede durur; aynı tuşlar ⌃⌥ ile her uygulamadan çalışır."), "third")}
      {plan_tile(T(lang, "Phone alarm.", "Telefon alarmı."), T(lang, "Urgent signals that wait too long on the desktop ring on the trader's phone, even when it is on silent.", "Masaüstünde fazla bekleyen acil sinyaller trader'ın telefonunda, sessizdeyken bile çalar."), "dark third")}
      {plan_tile(T(lang, "Key pad.", "Tuş takımı."), T(lang, "A programmable key pad on the head's desk, one key per signal.", "Masa şefinin masasında programlanabilir bir tuş takımı; her sinyale bir tuş."), "third")}
    </div>
  </div>
</section>

<section class="sec center" id="pricing">
  <div class="wrap">
    <h2 class="title">{T(lang, "Free during early access.", "Erken erişimde ücretsiz.")}</h2>
    <p class="lede">{T(lang, "Early access opens first for prop firms and trading desks of 2 to 50 people.", "Erken erişim önce prop firmalarına ve 2 ile 50 kişilik işlem masalarına açılıyor.")}</p>
    <div class="actions">{btn("#pricing", T(lang, "Get early access", "Erken erişim al"), " data-erken-erisim")}{more(LAB(lang, DESK_DEMO), T(lang, "Try the demo first", "Önce demoyu dene"))}</div>
    {faq([(T(lang, "Does it replace our chat or recorded lines?", "Sohbeti ya da kayıtlı hatları değiştirir mi?"), T(lang, "No. It sits next to them for the quick signals. Your firm's own record-keeping rules still apply, and the signal log helps you keep them.", "Hayır. Hızlı sinyaller için onların yanında durur. Firmanın kendi kayıt tutma kuralları geçerliliğini korur; sinyal logu bunlara yardımcı olur.")),
          (T(lang, "Does the demo send anything?", "Demo bir şey gönderiyor mu?"), T(lang, "No. The demo runs in your browser and sends nothing to a server.", "Hayır. Demo tarayıcında çalışır ve hiçbir sunucuya bir şey göndermez.")),
          (T(lang, "Can we choose our own colours and meanings?", "Renkleri ve anlamları kendimiz seçebilir miyiz?"), T(lang, "Yes. Up to nine signals, each with its own meaning and key. You choose which ones ring until answered.", "Evet. Dokuz sinyale kadar; her birinin kendi anlamı ve tuşu olur. Hangilerinin yanıtlanana kadar çalacağını sen seçersin.")),
          (T(lang, "What does a trader need to install?", "Trader'ın ne kurması gerekiyor?"), T(lang, "For the demo, nothing. Early access starts in a browser tab, and the desktop app follows.", "Demo için hiçbir şey. Erken erişim bir tarayıcı sekmesinde başlar, masaüstü uygulaması ardından gelir."))])}
    <p class="legal-note">{T(lang, "Desk Signal is a communication tool. It does not send orders or give investment advice.", "Desk Signal bir iletişim aracıdır. Emir göndermez ve yatırım tavsiyesi vermez.")}</p>
  </div>
</section>
{signup_dialog(lang, questions)}
</div>'''
    page("tr/desk-signal/index.html" if tr else "desk-signal/index.html", lang,
         T(lang, "Desk Signal: colour signals from the head of desk to every trader", "Desk Signal: masa şefinden her trader'a renkli sinyal"),
         T(lang, "Send a colour signal to one trader, a city or the whole desk with one key. Urgent signals ring until answered, and every signal is logged.", "Tek tuşla bir trader'a, bir şehre ya da bütün masaya renkli sinyal gönder. Acil sinyaller yanıtlanana kadar çalar, her sinyal kaydedilir."),
         body, P(lang, "/desk-signal"), "/desk-signal" if tr else "/tr/desk-signal", '<script src="/static/talep.js" defer></script>')

# ================================================================== Kalibre Lab
def kalibre_lab(lang):
    tr = lang == "tr"
    lab = SUMMARY["kalibreLab"]
    local = lnav("Kalibre Lab", lang, [(T(lang, "Overview", "Genel bakış"), "#top"), (T(lang, "Highlights", "Öne çıkanlar"), "#highlights"), (T(lang, "Validation", "Doğrulama"), "#validation")],
                 T(lang, "Open the lab", "Laboratuvarı aç"), LAB(lang, "/lab"))
    body = f'''
{local}
{page_hero(T(lang, "Test before you trade.", "İşlemden önce sına."),
           T(lang, "Build a rule, backtest it with costs, check it holds up.", "Kural kur, maliyetlerle backtest et, dayanıp dayanmadığını sına."),
           btn(LAB(lang, LAB_SAMPLE), T(lang, "Run the sample backtest", "Örnek backtest'i çalıştır")) + more(LAB(lang, "/lab"), T(lang, "Open the lab", "Laboratuvarı aç")),
           hero_image("kalibre-lab", lang, T(lang, "Kalibre Lab on a laptop: strategy builder next to a sample backtest with trades, equity curve and statistics", "Dizüstünde Kalibre Lab: kural kurucu ve yanında işlemler, özkaynak eğrisi ve istatistiklerle örnek backtest")),
           kicker="Kalibre Lab" + status_tag("beta", lang))}

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
{page_hero(T(lang, "Try every product.", "Her ürünü dene."),
           T(lang, "Sample in, result out. Open it in your browser.", "Örnek girer, sonuç çıkar. Tarayıcında aç."),
           btn("#trade-analytics", "Trade Analytics", "", True) + btn("#fx-blotter", "FX Blotter", "", True) + btn("#lab", "Kalibre Lab", "", True) + btn("#desk-signal", "Desk Signal", "", True),
           hero_image("suite", lang, T(lang, "Trade Analytics, FX Blotter Analytics and Kalibre Lab open on sample files", "Örnek dosyalarla açık Trade Analytics, FX Blotter Analytics ve Kalibre Lab")))}
{section("trade-analytics", "Trade Analytics", "beta", T(lang, "A trade log of 343 closed trades.", "343 kapanmış işlemlik bir işlem kaydı.") if ta["trades"] == 343 else "Trade Analytics",
         [(fmt(ta["trades"], lang), T(lang, "closed trades", "kapanmış işlem")), (fmt(ta["netUsd"], lang, 0, True), T(lang, "net P&amp;L, USD", "net K/Z, USD")), (pct(ta["winRatePct"], lang), T(lang, "win rate", "kazanma oranı")), (fmt(ta["profitFactor"], lang, 2), T(lang, "profit factor", "kâr faktörü"))],
         files(more("/lab/templates/kalibre-trade-log-example.xlsx", "kalibre-trade-log-example.xlsx", " download") + more("/lab/templates/kalibre-trade-log-example.csv", T(lang, "CSV version", "CSV sürümü"), " download"),
               LAB(lang, TA_SAMPLE), more(f"/lab/samples/{ta_res}.xlsx", f"{ta_res}.xlsx", " download"), T(lang, "The same file opens in Trade Analytics.", "Aynı dosya Trade Analytics'te açılır.")),
         shot_tile("analytics-overview", T(lang, "Account overview of the example log", "Örnek kaydın hesap özeti")) + shot_tile("analytics-segments", T(lang, "Segments ranked by their effect on the result", "Sonuca etkisine göre sıralı dilimler")), "paper")}
{section("fx-blotter", "FX Blotter Analytics", "beta", T(lang, "One week of a bank FX desk.", "Bir banka FX masasının bir haftası."),
         [(fmt(fx["legs"], lang), T(lang, "legs imported", "bacak aktarıldı")), (fmt(fx["totalUsd"], lang, 0, True), T(lang, "total P&amp;L, USD", "toplam K/Z, USD")), (fmt(fx["priceUsd"], lang, 0, True), T(lang, "price P&amp;L, USD", "fiyat K/Z, USD")), (f'{fx["checksPassed"]}/{fx["checks"]}', T(lang, "reconciliation checks passed", "mutabakat kontrolü geçti"))],
         files(more(f"/lab/samples/{fx_in}.xlsx", f"{fx_in}.xlsx", " download") + more(f"/lab/samples/{fx_in}.csv", T(lang, "CSV version", "CSV sürümü"), " download"),
               FX_SAMPLE[lang], more(f"/lab/samples/{fx_res}.xlsx", f"{fx_res}.xlsx", " download"), T(lang, "Example rates, overnight rates and limits are filled in.", "Örnek kur, faiz ve limitler girilir.")) + formats_block(lang),
         shot_tile("blotter-summary", T(lang, "Summary of the sample blotter", "Örnek blotter özeti")) + shot_tile("blotter-reconciliation", T(lang, "Reconciliation panel", "Mutabakat paneli")), "mist")}
{section("lab", "Kalibre Lab", "beta", T(lang, "A trend rule on 3,000 hourly bars.", "3.000 saatlik mumda bir trend kuralı.") if lab["bars"] == 3000 else "Kalibre Lab",
         [(fmt(lab["trades"], lang), T(lang, "trades", "işlem")), (fmt(lab["profitFactor"], lang, 2), T(lang, "profit factor", "kâr faktörü")), (pct(lab["returnPct"], lang, 2), T(lang, "return, no costs", "getiri, maliyetsiz")), (pct(lab["maxDrawdownPct"], lang, 2), T(lang, "max drawdown", "azami düşüş"))],
         files(more("/lab/samples/kalibre-lab-sample-strategy.json", "kalibre-lab-sample-strategy.json", " download") + more("/lab/samples/kalibre-lab-sample-prices.csv", "kalibre-lab-sample-prices.csv", " download"),
               LAB(lang, LAB_SAMPLE), more("/lab/samples/kalibre-lab-sample-result.xlsx", "kalibre-lab-sample-result.xlsx", " download") + more("/lab/samples/kalibre-lab-sample-result.json", "kalibre-lab-sample-result.json", " download"), T(lang, f"The rule and prices load and the backtest runs. Result ID kr1-{lab['resultId'][:16]}.", f"Kural ve fiyatlar yüklenir, backtest çalışır. Sonuç kimliği kr1-{lab['resultId'][:16]}.")),
         shot_tile("lab-backtest", T(lang, "Backtest result with equity curve and statistics", "Özkaynak eğrisi ve istatistiklerle backtest sonucu")), "paper")}
<section class="sec mist" id="desk-signal">
  <div class="wrap">
    <span class="kicker">Desk Signal{status_tag("test", lang)}</span>
    <h2 class="title">{T(lang, "A desk of four traders in three cities.", "Üç şehirde dört trader'lık bir masa.")}</h2>
    <p class="lede">{T(lang, "Send signals as the head of desk and answer them as each trader. The answer grid and the signal log fill in as you go, and the log downloads as CSV or Excel.", "Masa şefi olarak sinyal gönder, her trader olarak yanıtla. Yanıt tablosu ve sinyal logu sen ilerledikçe dolar; log CSV ya da Excel olarak iner.")}</p>
    <div class="actions left">{btn(LAB(lang, DESK_DEMO), T(lang, "Open the demo", "Demoyu aç"))}{more(LAB(lang, DESK_DEMO + "?tour=1"), T(lang, "Take the 1-minute tour", "1 dakikalık turu başlat"))}{more(P(lang, "/desk-signal"), T(lang, "About Desk Signal", "Desk Signal hakkında"))}</div>
  </div>
</section>
<section class="sec paper center">
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
def company_flow(lang):
    tr = lang == "tr"
    cols = [{"title": T(lang, "Trade records", "İşlem kayıtları"), "items": [T(lang, "MT5 reports", "MT5 raporları"), T(lang, "FX blotters", "FX blotter'ları"), T(lang, "Trade logs", "İşlem günlükleri"), T(lang, "Live MT5 data", "Canlı MT5 verisi")]},
            {"title": "Kalibre Markets", "items": [T(lang, "Reads files as exported", "Dosyayı olduğu gibi okur"), T(lang, "Reconciles every total", "Her toplamı mutabık kılar"), T(lang, "Explains every result", "Her sonucu açıklar")], "accent": True},
            {"title": T(lang, "Decisions", "Kararlar"), "items": [T(lang, "Traders", "Trader'lar"), T(lang, "Brokers and prop firms", "Aracı kurum ve prop firmaları"), T(lang, "Treasury desks", "Hazine masaları")]}]
    return flow_diagram(cols, T(lang, "Trade records flow into Kalibre Markets, which reads, reconciles and explains them for traders, firms and treasury desks", "İşlem kayıtları Kalibre Markets'e gelir; okunur, mutabık kılınır ve trader'lar, firmalar ve hazine masaları için açıklanır"))

# ================================================================== Pricing
def pricing(lang):
    tr = lang == "tr"
    free = T(lang, "Free during early access", "Erken erişimde ücretsiz")
    def plan(name, status, href_more, price, bullets, action, media):
        items = "".join(f"<li>{b}</li>" for b in bullets)
        return (f'<div class="plan-card"><a class="plan-media" href="{href_more}" tabindex="-1" aria-hidden="true">{media}</a><div class="plan-body">'
                f'<h2>{name}{status_tag(status, lang)}</h2><p class="plan-price">{price}</p><ul>{items}</ul><div class="plan-actions">{action}{more(href_more, T(lang, "Learn more", "Daha fazla"))}</div></div></div>')
    def thumb(name):
        base = f"/static/urun/hero/{name}-{lang}"
        return f'<img src="{base}-1x.webp" width="1440" height="860" alt="" loading="eager" decoding="async">'
    cards = (plan("Trade Analytics", "beta", P(lang, "/trade-analytics"), free,
                  [T(lang, "MT5 reports, Excel and CSV", "MT5 raporu, Excel ve CSV"), T(lang, "Segments and prop limits", "Dilimler ve prop sınırları"), T(lang, "No card needed", "Kart gerekmez")],
                  btn(LAB(lang, TA_SAMPLE), T(lang, "Try the sample", "Örneği dene")), thumb("trade-analytics"))
             + plan("FX Blotter", "beta", P(lang, "/fx-blotter"), T(lang, "Desk pilot", "Masa pilotu"),
                  [T(lang, "Your desk's own export", "Masanızın kendi dökümü"), T(lang, "Seven reconciliation checks", "Yedi mutabakat kontrolü"), T(lang, "Sample or anonymized data", "Örnek ya da anonim veri")],
                  btn(P(lang, "/fx-blotter") + "#demo", T(lang, "Request a demo", "Demo iste")), thumb("fx-blotter"))
             + plan("Rule Guard", "test", P(lang, "/rule-guard"), free,
                  [T(lang, "FTMO and The5ers presets", "FTMO ve The5ers ön ayarları"), T(lang, "Daily and total floors", "Günlük ve toplam taban"), T(lang, "Two MT5 accounts", "İki MT5 hesabı")],
                  btn(P(lang, "/rule-guard") + "#pricing", T(lang, "Get early access", "Erken erişim al")), prop_chart(lang, days=40, legend=False))
             + plan("Kalibre Lab", "beta", P(lang, "/kalibre-lab"), T(lang, "Backtesting is free", "Backtest ücretsiz"),
                  [T(lang, "Strategy builder and templates", "Kural kurucu ve şablonlar"), T(lang, "Costs, fills and validation", "Maliyet, dolum ve doğrulama"), T(lang, "Runs in your browser", "Tarayıcında çalışır")],
                  btn(LAB(lang, LAB_SAMPLE), T(lang, "Run the sample", "Örneği çalıştır")), thumb("kalibre-lab")))
    ok = "/tr/pricing?ok=1" if tr else "/pricing?ok=1"
    body = f'''
{page_hero(T(lang, "Start free.", "Ücretsiz başla."),
           T(lang, "Every product is free during early access. No card.", "Erken erişimde her ürün ücretsiz. Kart yok."),
           "", f'<div class="plans">{cards}</div>', media_cls="plans-wrap")}

<section class="sec mist center" id="waitlist">
  <div class="wrap">
    <h2 class="title">{T(lang, "Hear first.", "İlk sen duy.")}</h2>
    <p class="lede">{T(lang, "We will email you before any paid plan, so you can choose.", "Ücretli bir plan açılmadan önce e-posta göndeririz; seçim senin.")}</p>
    <p class="waitlist-ok" id="ok-msg" hidden><b>{T(lang, "You are on the list.", "Listedesin.")}</b></p>
    <form class="waitlist" action="https://formsubmit.co/markets@kalibrefin.com" method="POST" id="wl-form">
      <input type="hidden" name="_subject" value="{T(lang, "Kalibre waitlist: new sign-up (EN)", "Kalibre bekleme listesi: yeni kayıt (TR)")}">
      <input type="hidden" name="_next" value="https://kalibremarkets.com{ok}">
      <input type="hidden" name="_captcha" value="false">
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
      <label for="eposta" class="visually-hidden">{T(lang, "Your email", "E-postan")}</label>
      <div class="waitlist-row"><input type="email" id="eposta" name="email" required autocomplete="email" placeholder="{T(lang, "Your email", "E-postan")}"><button type="submit" class="btn">{T(lang, "Join the list", "Listeye katıl")}</button></div>
      <label class="waitlist-consent"><input type="checkbox" name="consent" value="yes" required> <span>{T(lang, "I agree to receive emails from Kalibre Markets about early access and product updates. I can unsubscribe at any time.", "Kalibre Markets'in erken erişim ve ürün güncellemeleri hakkında bana e-posta göndermesini kabul ediyorum. İstediğim zaman listeden çıkabilirim.")}</span></label>
      <p class="fine">{T(lang, "Your email is delivered to us through the FormSubmit service and used only for this. Details are in the", "E-postan bize FormSubmit hizmetiyle ulaşır ve yalnız bunun için kullanılır. Ayrıntılar")} <a href="{P(lang, "/privacy")}">{T(lang, "privacy policy", "gizlilik politikasında")}</a>.</p>
    </form>
  </div>
</section>

<section class="sec center">
  <div class="wrap">
    <h2 class="title">{T(lang, "Questions.", "Sorular.")}</h2>
    {faq([(T(lang, "Do I need a card?", "Kart gerekir mi?"), T(lang, "No. Early access is free and asks for no payment details.", "Hayır. Erken erişim ücretsizdir ve ödeme bilgisi istemez.")),
          (T(lang, "What happens after early access?", "Erken erişimden sonra ne olur?"), T(lang, "We will email you with the plans and prices before anything is charged. Nothing renews by itself.", "Herhangi bir ücret alınmadan önce planları ve fiyatları e-postayla bildiririz. Hiçbir şey kendiliğinden yenilenmez.")),
          (T(lang, "How do desk pilots work?", "Masa pilotları nasıl işler?"), T(lang, "Each pilot is set up with the desk on our sample blotter or an anonymized export. No client data leaves the building.", "Her pilot masayla birlikte örnek blotter'ımız ya da anonim bir döküm üzerinde kurulur. Binadan müşteri verisi çıkmaz.")),
          (T(lang, "Is backtesting free?", "Backtest ücretsiz mi?"), T(lang, "Yes. Building and backtesting rules in Kalibre Lab is free.", "Evet. Kalibre Lab'de kural kurmak ve backtest etmek ücretsizdir."))])}
    <p class="legal-note">{T(lang, "Kalibre is software and does not give investment advice.", "Kalibre bir yazılımdır ve yatırım tavsiyesi vermez.")} <a href="{P(lang, "/risk-disclosure")}">{T(lang, "Risk disclosure", "Risk bildirimi")}</a></p>
  </div>
</section>'''
    script = "<script>if (new URLSearchParams(location.search).get('ok') === '1') { document.getElementById('ok-msg').hidden = false; document.getElementById('wl-form').hidden = true; }</script>"
    page("tr/pricing/index.html" if tr else "pricing/index.html", lang,
         T(lang, "Pricing: free during early access", "Fiyat: erken erişimde ücretsiz"),
         T(lang, "Trade Analytics, Rule Guard and Kalibre Lab are free during early access. FX Blotter Analytics runs as a desk pilot. No card needed.", "Trade Analytics, Rule Guard ve Kalibre Lab erken erişimde ücretsiz. FX Blotter Analytics masa pilotu olarak çalışır. Kart gerekmez."),
         body, P(lang, "/pricing"), "/pricing" if tr else "/tr/pricing", script)

def company(lang):
    tr = lang == "tr"
    c = COMPANY[lang]
    who = "".join(tile(f"{k}", f"{d}", f'<p class="big" style="font-size:clamp(22px,2.4vw,28px);letter-spacing:0">{w}</p>', "third") for w, k, d in c["kimler"])
    beliefs = "".join(f'<div><h3>{h}</h3><p>{p}</p>' + (f'<div class="actions left" style="margin-top:12px">{more(u, l)}</div>' if u else "") + "</div>" for h, p, u, l in c["ilkeler"])
    body = f'''
{page_hero(c["h1"], c["katman_not"], "", company_flow(lang), media_cls="diagram")}

<section class="sec center" style="padding-bottom:0">
  <div class="wrap"><p class="lede">{c["giris"]}</p></div>
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
    desk_signal(lang)
    kalibre_lab(lang)
    demos(lang)
    company(lang)
    if not ODEME_ACIK:
        pricing(lang)
