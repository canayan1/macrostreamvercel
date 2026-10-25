# Tek seferlik geçiş (25.10.2026): site kökü İngilizce, Türkçe /tr altında.
# 1) Sayfa dosyalarını git mv ile yeni yerlerine taşır.
# 2) Metin dosyalarındaki eski site yollarını yeni yollara çevirir (yalnız bilinen ürün sayfaları;
#    eğitim yazıları ve diğer eski Türkçe sayfalar yerinde kalır).
# vercel.json'a eski yollar için kalıcı yönlendirmeler ayrıca eklenir (yonlendirme_ekle).
# Kullanım: python3 yerel/kok-ingilizce-tasi.py   (site kökünden; ikinci kez çalıştırılmaz)
import json, os, re, subprocess, sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(KOK)

# Eski Türkçe yol -> yeni yol
TR = {"/pro": "/tr/pricing", "/guvenlik": "/tr/security", "/prop": "/tr/prop", "/forex": "/tr/forex",
      "/kurulum": "/tr/setup", "/metodoloji": "/tr/methodology", "/hakkinda": "/tr/about", "/hakkinda.html": "/tr/about",
      "/hesap": "/tr/account", "/giris": "/tr/sign-in", "/beta": "/tr/beta", "/risk-bildirimi": "/tr/risk-disclosure",
      "/kullanim-sartlari": "/tr/terms", "/gizlilik": "/tr/privacy", "/baglan": "/tr/connect", "/panom": "/tr/dashboard"}
# Eski İngilizce yol -> yeni yol
EN = {"/en": "/", "/en/license": "/account", "/en/connect": "/connect", "/en/dashboard": "/dashboard", "/en/lab": "/lab"}
for s in ["setup", "security", "methodology", "about", "pricing", "prop", "forex", "beta", "risk-disclosure", "terms", "privacy", "sign-in"]:
    EN["/en/" + s] = "/" + s
LAB = {"/lab", "/lab/index.html", "/lab/panom.html", "/lab/baglan.html", "/lab/optimizasyon.html", "/lab/oynaklik.html"}

# Dosya taşımaları: önce Türkçe sayfalar /tr altına, sonra İngilizceler köke.
TASI = [("index.html", "tr/index.html"), ("pro", "tr/pricing"), ("guvenlik", "tr/security"), ("prop", "tr/prop"),
        ("forex", "tr/forex"), ("kurulum", "tr/setup"), ("metodoloji", "tr/methodology"), ("hakkinda.html", "tr/about/index.html"),
        ("hesap", "tr/account"), ("giris", "tr/sign-in"), ("beta", "tr/beta"), ("risk-bildirimi", "tr/risk-disclosure"),
        ("kullanim-sartlari", "tr/terms"), ("gizlilik", "tr/privacy"),
        ("en/index.html", "index.html"), ("en/license", "account"), ("en/sign-in", "sign-in")]
TASI += [(f"en/{s}", s) for s in ["setup", "security", "methodology", "about", "pricing", "prop", "forex", "beta", "risk-disclosure", "terms", "privacy"]]
TASI += [("yeni-ana/index.html", "yeni-ana/tr/index.html"), ("yeni-ana/en/index.html", "yeni-ana/index.html")]


def yeni_yol(yol, sorgu=""):
    """Eski bir site yolunu (sorgu ve #parça dahil) yenisine çevirir; bilinmiyorsa None."""
    p = yol.rstrip("/") or "/"
    if p in EN: return EN[p] + sorgu
    if p in TR: return TR[p] + sorgu
    if p in LAB or p == "/lab/":
        ad = "/lab" if p in ("/lab", "/lab/index.html") else p[:-5]  # .html atılır (cleanUrls)
        q, parca = (sorgu.split("#", 1) + [""])[:2] if sorgu else ("", "")
        q = q.lstrip("?")
        ps = [x for x in q.split("&") if x]
        if "dil=en" in ps: ps.remove("dil=en")
        elif "dil=tr" not in ps: ps.append("dil=tr")
        return ad + ("?" + "&".join(ps) if ps else "") + ("#" + parca if parca else "")
    return None


DESEN = re.compile(r'(?P<on>["\'`(])(?P<alan>https://kalibremarkets\.com)?(?P<yol>/[A-Za-z0-9._\-/]+)(?P<sorgu>[?#][^"\'`)\s<>]*)?(?=["\'`)])')

def cevir(metin):
    def f(m):
        y = yeni_yol(m["yol"], m["sorgu"] or "")
        if y is None: return m.group(0)
        if m["alan"] and y == "/": y = ""  # https://kalibremarkets.com kökü
        return m["on"] + (m["alan"] or "") + y
    return DESEN.sub(f, metin)


def tasi():
    for a, b in TASI:
        if not os.path.exists(a):
            print("yok:", a); continue
        os.makedirs(os.path.dirname(b) or ".", exist_ok=True)
        if os.path.isdir(a) and os.path.exists(b):
            sys.exit(f"hedef var: {b}")
        subprocess.run(["git", "mv", a, b], check=True)
        print("taşındı", a, "->", b)


def metinleri_cevir():
    atla = ("node_modules/", "lab/", ".git/", "docs/", ".vercel/")
    for d, _, dosyalar in os.walk("."):
        for ad in dosyalar:
            p = os.path.join(d, ad)[2:]
            if p.startswith(atla) or p == "vercel.json" or p == "yerel/kok-ingilizce-tasi.py": continue
            if not ad.endswith((".html", ".js", ".ts", ".mjs", ".py", ".json", ".xml")): continue
            s = open(p, encoding="utf-8").read()
            y = cevir(s)
            # Türkçe sayfalarda logo/ana sayfa bağlantısı ("/") Türkçe ana sayfaya gider.
            if p.endswith(".html") and re.search(r'<html[^>]*lang="tr"', y):
                y = y.replace('href="/"', 'href="/tr"')
            if y != s:
                open(p, "w", encoding="utf-8").write(y)
                print("çevrildi", p)


def yonlendirme_ekle():
    v = json.load(open("vercel.json"))
    eski = v.get("redirects", [])
    for r in eski:  # var olan yönlendirmelerin hedefleri de yeni yollara
        y = yeni_yol(*(r["destination"].split("?", 1)[0], ("?" + r["destination"].split("?", 1)[1]) if "?" in r["destination"] else ""))
        if y: r["destination"] = y
    # Çakışmayan eski Türkçe yollar (/prop, /forex, /beta artık İngilizce sayfa; yönlenmez).
    yeni = []
    for a, b in TR.items():
        if a in ("/prop", "/forex", "/beta", "/hakkinda.html"): continue
        if a in ("/baglan", "/panom"): continue  # aşağıda laboratuvara
        yeni += [{"source": a, "destination": b, "statusCode": 308}]
    yeni += [{"source": "/hakkinda.html", "destination": "/tr/about", "statusCode": 308}]
    for a, b in EN.items():
        if a in ("/en/connect", "/en/dashboard", "/en/lab"): continue
        yeni += [{"source": a, "destination": b, "statusCode": 308}]
    yeni += [
        {"source": "/en/lab/:path*", "destination": "/lab/:path*", "statusCode": 308},
        {"source": "/en/lab", "destination": "/lab", "statusCode": 308},
        {"source": "/en/connect", "destination": "/connect", "statusCode": 308},
        {"source": "/en/dashboard", "destination": "/dashboard", "statusCode": 308},
        {"source": "/connect", "destination": "/lab/baglan", "statusCode": 302},
        {"source": "/dashboard", "destination": "/lab/panom", "statusCode": 302},
        {"source": "/tr/connect", "destination": "/lab/baglan?dil=tr", "statusCode": 302},
        {"source": "/tr/dashboard", "destination": "/lab/panom?dil=tr", "statusCode": 302},
        {"source": "/baglan", "destination": "/lab/baglan?dil=tr", "statusCode": 308},
        {"source": "/panom", "destination": "/lab/panom?dil=tr", "statusCode": 308},
        {"source": "/tr/lab", "destination": "/lab?dil=tr", "statusCode": 302},
    ]
    kaynaklar = {r["source"] for r in yeni}
    eski = [r for r in eski if r["source"] not in kaynaklar]
    v["redirects"] = yeni + eski
    open("vercel.json", "w").write(json.dumps(v, indent=2, ensure_ascii=False) + "\n")
    print("vercel.json:", len(v["redirects"]), "yönlendirme")


if __name__ == "__main__":
    if os.path.exists("tr/index.html"):
        sys.exit("geçiş zaten yapılmış (tr/index.html var)")
    tasi()
    metinleri_cevir()
    yonlendirme_ekle()
