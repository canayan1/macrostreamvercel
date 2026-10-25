# Yasal sayfalar: İngilizce asıl metin kökte (/terms, /privacy, /refunds, /risk-disclosure, /cookies),
# Türkçe çevirisi /tr altında. Kaynaklar yerel/yasal/en/*.md ve yerel/yasal/tr/*.md; bu betik onları
# sitenin ortak üst bar ve alt bilgisiyle (sayfa-uret.py) HTML'e çevirir.
# Kullanım: python3 yerel/yasal-uret.py   (metni değiştirmek için .md dosyasını düzenle, betiği yeniden çalıştır)
#
# Markdown alt kümesi: # / ## / ### başlık ("{#kimlik}" ile bağlantı kimliği), paragraf, "- " ve "1. " listeleri,
# | tablo |, "> " alıntı, **kalın**, `kod`, [metin](/yol). "<" ile başlayan bloklar HTML olarak aynen geçer;
# <!-- FOR COUNSEL --> yorumları görünmez HTML yorumu olarak kalır. [BÜYÜK HARF] yer tutucuları
# <span class="yer-tutucu"> ile işaretlenir. {{SURUM}} şartların sürümüyle (api/odeme/baslat.ts SARTLAR_SURUMU) değişir.
import html as _html, os, re
_d = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_d, "sayfa-uret.py")).read().split("# ------------------------------------------------------------------ kurulum")[0])

SURUM = re.search(r"export const SARTLAR_SURUMU = '([^']+)'", open(os.path.join(KOK, "api/odeme/baslat.ts")).read()).group(1)
assert f"var SARTLAR_SURUMU = '{SURUM}'" in open(os.path.join(KOK, "static/giris.js")).read(), "static/giris.js SARTLAR_SURUMU baslat.ts ile aynı olmalı"

# (kısa ad, EN başlık, EN açıklama, TR başlık, TR açıklama)
BELGELER = [
    ("terms", "Terms of Service | Kalibre Markets",
     "Terms of Service for kalibremarkets.com, Kalibre Lab, Kalibre Bridge and Kalibre Engine: software not advice, no custody, licences, subscriptions, liability and disputes.",
     "Hizmet Şartları | Kalibre Markets",
     "kalibremarkets.com, Kalibre Lab, Kalibre Bridge ve Kalibre Engine için Hizmet Şartları: yatırım tavsiyesi olmayan yazılım, saklama yok, lisans, abonelik, sorumluluk ve uyuşmazlıklar."),
    ("privacy", "Privacy Policy | Kalibre Markets",
     "What personal data Kalibre Markets collects, why, who processes it, how long it is kept and your rights. Trading data stays local; Bridge data is end-to-end encrypted.",
     "Gizlilik Politikası | Kalibre Markets",
     "Kalibre Markets'ın hangi kişisel verileri neden topladığı, kimlerin işlediği, ne kadar saklandığı ve haklarınız. İşlem verileri cihazınızda kalır; Bridge verisi uçtan uca şifrelidir."),
    ("refunds", "Refund and Cancellation Policy | Kalibre Markets",
     "How to cancel a Kalibre Markets subscription, when refunds are given, and the 14-day right of withdrawal for EU, EEA and UK consumers.",
     "İade ve İptal Politikası | Kalibre Markets",
     "Kalibre Markets aboneliğinin nasıl iptal edileceği, hangi durumlarda iade yapıldığı ve AB, AEA ve Birleşik Krallık tüketicileri için 14 günlük cayma hakkı."),
    ("risk-disclosure", "Risk Disclosure | Kalibre Markets",
     "Risks of trading and of using Kalibre Lab, Kalibre Bridge and Kalibre Engine: leverage, hypothetical backtest results, automated trading and beta software.",
     "Risk Bildirimi | Kalibre Markets",
     "Alım satım işlemlerinin ve Kalibre Lab, Kalibre Bridge ile Kalibre Engine kullanımının riskleri: kaldıraç, varsayımsal backtest sonuçları, otomatik işlem ve beta yazılım."),
    ("cookies", "Cookie Notice | Kalibre Markets",
     "Cookies and browser storage used on kalibremarkets.com and in Kalibre Lab: strictly necessary items, optional Google Analytics and how to change your choice.",
     "Çerez Bildirimi | Kalibre Markets",
     "kalibremarkets.com ve Kalibre Lab'de kullanılan çerezler ve tarayıcı depolaması: zorunlu öğeler, isteğe bağlı Google Analytics ve tercihinizi nasıl değiştireceğiniz."),
]

CEVIRI_NOTU = ('<p class="ceviri-notu">Bu metin İngilizce aslının çevirisidir; uyuşmazlıkta İngilizce metin esastır. '
               '<a href="/{ad}" hreflang="en" lang="en">English original</a></p>')

YASAL_STIL = """
.belge-meta { font-size: 14px; color: var(--silik); margin: -8px 0 20px; }
.ceviri-notu { font-size: 14px; color: #d6dee8; border: 1px solid var(--cizgi-2); border-radius: 4px; padding: 10px 14px; margin: 0 0 20px; }
.yer-tutucu { font-family: var(--mono); font-size: .86em; background: rgba(217,164,65,.14); color: #f0c46c; border: 1px dashed rgba(217,164,65,.6); border-radius: 3px; padding: 0 4px; white-space: normal; overflow-wrap: anywhere; }
.belge-govde h3 { font-size: 19px; }
.belge-govde blockquote { margin: 20px 0; padding: 12px 18px; border-left: 3px solid var(--cizgi-2); background: var(--zemin-2); color: #cdd6e1; }
.belge-govde blockquote p { margin: 0 0 .6em; } .belge-govde blockquote p:last-child { margin-bottom: 0; }
.belge-govde blockquote.buyuk-harf p { font-size: 13px; letter-spacing: .01em; }
.belge-izgara > * { min-width: 0; }
.tablo-kap { overflow-x: auto; margin: 16px 0 24px; }
.belge-govde table { border-collapse: collapse; width: 100%; font-size: 14.5px; }
.belge-govde table.genis { min-width: 520px; }
.belge-govde th, .belge-govde td { text-align: left; vertical-align: top; padding: 9px 12px; border-bottom: 1px solid var(--cizgi); color: #cdd6e1; }
.belge-govde th { color: var(--metin); font-weight: 600; border-bottom-color: var(--cizgi-2); }
.belge-govde p, .belge-govde li { overflow-wrap: break-word; }
.icindekiler-mobil { display: none; margin: 0 0 28px; border: 1px solid var(--cizgi); border-radius: 4px; padding: 10px 14px; }
.icindekiler-mobil summary { cursor: pointer; font-weight: 600; }
.icindekiler-mobil ol { list-style: none; padding: 0; margin: 10px 0 0; }
.icindekiler-mobil a { display: block; padding: 5px 0; text-decoration: none; }
@media (max-width: 960px) { .icindekiler-mobil { display: block; } }
"""

def satir_ici(s):
    yorumlar = []
    def sakla(m):
        yorumlar.append(m.group(0)); return f"\x00{len(yorumlar) - 1}\x00"
    s = re.sub(r"<!--.*?-->", sakla, s)
    s = _html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', s)
    s = re.sub(r"\[([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ0-9 ,./-]*)\]", r'<span class="yer-tutucu">[\1]</span>', s)
    return re.sub(r"\x00(\d+)\x00", lambda m: yorumlar[int(m.group(1))], s)

def md_html(md):
    bloklar = re.split(r"\n\s*\n", md.strip())
    cikti = []
    for b in bloklar:
        b = b.strip("\n")
        satirlar = b.split("\n")
        ilk = satirlar[0]
        if ilk.startswith("<"):
            cikti.append(b)  # HTML ya da yorum, aynen
        elif re.match(r"#{1,3} ", ilk):
            assert len(satirlar) == 1, b
            m = re.match(r"(#{1,3}) (.*?)(?:\s*\{#([a-z0-9-]+)\})?$", ilk)
            n, metin, kimlik = len(m.group(1)), m.group(2), m.group(3)
            if n == 2: assert kimlik, "## başlığında {#kimlik} gerekli: " + ilk
            cikti.append(f'<h{n}{f" id={chr(34)}{kimlik}{chr(34)}" if kimlik else ""}>{satir_ici(metin)}</h{n}>')
        elif ilk.startswith("|"):
            hucre = lambda l: [c.strip() for c in l.strip().strip("|").split("|")]
            bas, govde = hucre(ilk), [hucre(l) for l in satirlar[2:]]
            t = "<thead><tr>" + "".join(f"<th>{satir_ici(c)}</th>" for c in bas) + "</tr></thead><tbody>"
            t += "".join("<tr>" + "".join(f"<td>{satir_ici(c)}</td>" for c in r) + "</tr>" for r in govde) + "</tbody>"
            cikti.append(f'<div class="tablo-kap"><table{" class=" + chr(34) + "genis" + chr(34) if len(bas) > 2 else ""}>{t}</table></div>')
        elif ilk.startswith(">"):
            ic = "\n".join(re.sub(r"^>\s?", "", l) for l in satirlar)
            pler = [p for p in re.split(r"\n\s*\n", ic) if p.strip()]
            buyuk = all(not re.search(r"[a-zçğıöşü]", re.sub(r"<!--.*?-->", "", p)) for p in pler)
            ps = "".join("<p>" + "<br>\n".join(satir_ici(x) for x in p.split("\n")) + "</p>" for p in pler)
            cikti.append(f'<blockquote{" class=" + chr(34) + "buyuk-harf" + chr(34) if buyuk else ""}>{ps}</blockquote>')
        elif re.match(r"- ", ilk) or re.match(r"\d+\. ", ilk):
            sirali = not ilk.startswith("- ")
            ogeler, simdiki = [], None
            for l in satirlar:
                m = re.match(r"(?:- |\d+\. )(.*)", l)
                if m: ogeler.append(m.group(1))
                else: ogeler[-1] += " " + l.strip()
            etiket = "ol" if sirali else "ul"
            cikti.append(f"<{etiket}>\n" + "\n".join(f"  <li>{satir_ici(o)}</li>" for o in ogeler) + f"\n</{etiket}>")
        else:
            cikti.append("<p>" + satir_ici(" ".join(l.strip() for l in satirlar)) + "</p>")
    return "\n\n".join(cikti)

def uret(ad, dil, baslik, aciklama):
    md = open(os.path.join(_d, "yasal", dil, ad + ".md"), encoding="utf-8").read().replace("{{SURUM}}", SURUM)
    govde = md_html(md)
    if dil == "tr":
        govde = govde.replace("</h1>", "</h1>\n" + CEVIRI_NOTU.format(ad=ad), 1)
    basliklar = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', govde)
    kenar = "".join(f'<a href="#{i}">{t}</a>' for i, t in basliklar)
    mobil = (f'<details class="icindekiler-mobil"><summary>{"Contents" if dil == "en" else "İçindekiler"}</summary><ol>'
             + "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in basliklar) + "</ol></details>")
    govde = re.sub(r'(<p class="belge-meta">.*?</p>)', lambda m: m.group(1) + "\n" + mobil, govde, count=1)
    assert "icindekiler-mobil" in govde, ad
    for kotu in ("—", "–"):
        assert kotu not in govde, f"{dil}/{ad}: uzun tire"
    yol = (f"tr/{ad}/index.html" if dil == "tr" else f"{ad}/index.html")
    sayfa(yol, baslik, aciklama, "", govde, kenar, ek_stil=YASAL_STIL, dil=dil)

for ad, en_b, en_a, tr_b, tr_a in BELGELER:
    uret(ad, "en", en_b, en_a)
    uret(ad, "tr", tr_b, tr_a)
