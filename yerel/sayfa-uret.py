# Ürün sitesinin metin sayfalarını ortak üst bar ve alt bilgiyle yazar (tek seferlik üretici).
import os, re
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # site kökü

# Ödemeler açıldığında True yap ve üç üreticiyi yeniden çalıştır (sayfa-uret.py, sayfa-uret-en.py, ana-en-uret.py).
ODEME_ACIK = True  # açıkken de sunucu 503 dönerse sayfa "ödemeler yakında" kartına düşer

MENU = [("/lab/", "Laboratuvar"), ("/lab/panom.html", "Panom"), ("/prop/", "Prop kalkanı"), ("/kurulum/", "Kurulum"), ("/guvenlik/", "Güvenlik"), ("/egitim/", "Eğitim"), ("/pro/", "Abonelik")]
MENU_EN = [("/en/lab/", "Lab"), ("/lab/panom.html?dil=en", "Dashboard"), ("/en/prop/", "Prop shield"), ("/en/setup/", "Setup"), ("/en/security/", "Security"), ("/egitim/", "Education (Turkish)"), ("/en/pricing/", "Pricing")]

# Türkçe sayfa ↔ İngilizce karşılığı (hreflang ve dil bağlantısı için).
ESLER = {"/": "/en", "/lab": "/en/lab", "/lab/panom.html": "/lab/panom.html?dil=en", "/prop": "/en/prop", "/forex": "/en/forex", "/kurulum": "/en/setup",
         "/guvenlik": "/en/security", "/metodoloji": "/en/methodology", "/hakkinda": "/en/about", "/pro": "/en/pricing",
         "/hesap": "/en/license", "/giris": "/en/sign-in", "/risk-bildirimi": "/en/risk-disclosure", "/kullanim-sartlari": "/en/terms", "/gizlilik": "/en/privacy", "/beta": "/en/beta"}
ESLER_TERS = {v: k for k, v in ESLER.items()}

def yol_url(yol):
    # vercel.json trailingSlash:false: kanonik adresler sondaki eğik çizgisiz (kök "/" hariç).
    return ("/" + yol.replace("index.html", "").replace(".html", "")).replace("//", "/").rstrip("/") or "/"

def egik_cizgisiz(html):
    # İç bağlantılardaki ve kanonik/og adreslerindeki sondaki eğik çizgiyi kaldırır ("/" kök hariç).
    return re.sub(r'(href|content)="((?:https://kalibremarkets\.com)?/[^"?#]*?[^/"])/"', r'\1="\2"', html)

def ust(aktif, dil="tr", diger=None):
    AK = ' aria-current="page"'
    menu = MENU_EN if dil == "en" else MENU
    a = "\n".join(f'      <a href="{h}"{AK if h == aktif else ""}>{t}</a>' for h, t in menu)
    dil_baglanti = ""
    if diger:
        dil_baglanti = (f'<a class="dil" href="{diger}" hreflang="tr" lang="tr">TR</a>' if dil == "en"
                        else f'<a class="dil" href="{diger}" hreflang="en" lang="en">EN</a>')
    ana, ac, etiket = ("/en/", "Open the lab", "Main menu") if dil == "en" else ("/", "Laboratuvarı aç", "Ana menü")
    baglan_url, baglan = ("/en/connect", "Connect MetaTrader") if dil == "en" else ("/baglan", "MetaTrader'ı bağla")
    return f'''<header class="ust">
  <div class="kap">
    <a class="marka" href="{ana}"><b>Kalibre</b><span>Lab</span></a>
    <nav aria-label="{etiket}">
{a}
    </nav>
    {dil_baglanti}
    <a class="dugme ikincil kucuk baglan" href="{baglan_url}">{baglan}</a>
    <a class="dugme kucuk" href="{"/en/lab/" if dil == "en" else "/lab/"}">{ac}</a>
  </div>
</header>'''

ALT = open(os.path.join(KOK, "index.html")).read()
ALT = ALT[ALT.index('<footer class="alt">'):ALT.index('</footer>') + 9]
ALT_EN = '''<footer class="alt">
  <div class="kap">
    <div>
      <p><b style="font:600 18px var(--serif);color:var(--metin)">Kalibre</b></p>
      <p>A strategy lab for MetaTrader 5.</p>
    </div>
    <div>
      <h4>Product</h4>
      <a href="/en/lab/">Lab</a>
      <a href="/lab/panom.html?dil=en">Dashboard</a>
      <a href="/en/prop/">Prop shield</a>
      <a href="/en/forex/">Retail forex</a>
      <a href="/en/setup/">Setup</a>
      <a href="/en/security/">Security</a>
      <a href="/en/pricing/">Pricing</a>
    </div>
    <div>
      <h4>Learn</h4>
      <a href="/en/methodology/">Methodology</a>
      <a href="/egitim/">Education (Turkish)</a>
    </div>
    <div>
      <h4>Kalibre</h4>
      <a href="/en/about/">About</a>
      <a href="/iletisim/">Contact</a>
      <a href="/en/terms/">Terms of use</a>
      <a href="/en/privacy/">Privacy</a>
      <a href="/en/risk-disclosure/">Risk disclosure</a>
    </div>
    <p class="yasal">Kalibre Lab is in beta. Kalibre Lab is a software tool; it does not provide investment advice or brokerage services. Results shown in the lab are based on past or synthetic data and are not an indication of future results. Leveraged trading can lose you all of the money you deposit. MetaTrader is a trademark of MetaQuotes Ltd.; Kalibre is not affiliated with MetaQuotes.</p>
  </div>
</footer>'''

# Hesap betiği (static/kalibre-auth.js) bu yolları okur; site köküne İngilizce taşınınca yalnız burası değişir.
YOLLAR = {"tr": {"signIn": "/giris", "account": "/hesap", "pricing": "/pro", "connect": "/baglan", "lab": "/lab/", "home": "/"},
          "en": {"signIn": "/en/sign-in", "account": "/en/license", "pricing": "/en/pricing", "connect": "/en/connect", "lab": "/lab/?dil=en", "home": "/en"}}
def yol_etiketleri(dil):
    return "".join(f'<meta name="kalibre:yol:{k}" content="{v}">\n' for k, v in YOLLAR[dil].items())

def sayfa(yol, baslik, aciklama, aktif, govde, kenar="", ek_stil="", ek_betik="", gizli=False, dil="tr"):
    url = yol_url(yol)
    kanon = "https://kalibremarkets.com" + url
    diger = (ESLER_TERS.get(url) if dil == "en" else ESLER.get(url))
    alternatif = ""
    if diger:
        tr_url, en_url = (diger, url) if dil == "en" else (url, diger)
        alternatif = (f'\n<link rel="alternate" hreflang="tr" href="https://kalibremarkets.com{tr_url}">'
                      f'\n<link rel="alternate" hreflang="en" href="https://kalibremarkets.com{en_url}">')
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
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/site.css">
<script src="/static/kalibre-cerez.js"></script>
<script src="/static/beta.js" defer></script>
{yol_etiketleri(dil)}<script src="/static/kalibre-auth.js" defer></script>
{f"<style>{ek_stil}</style>" if ek_stil else ""}
</head>
<body>

{ust(aktif, dil, diger)}

<main class="belge">
  <div class="kap belge-izgara">
    <article class="belge-govde">
{govde}
    </article>
    {f'<aside class="belge-kenar" aria-label="{kenar_etiket}">{kenar}</aside>' if kenar else ""}
  </div>
</main>

{ALT_EN if dil == "en" else ALT}
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

# ------------------------------------------------------------------ kurulum
KURULUM = '''
<h1>Kurulum</h1>
<p class="giris">MetaTrader 5'i Kalibre Lab'e bağlamak için bir eklenti, bir kod ve bir izin gerekir. Bir kez yapılır; sonra MT5 açık olduğu sürece verin laboratuvara kendiliğinden gelir.</p>
<div class="kutu yesil">İlk kurulumu bir <b>demo hesapla</b> yapmanı öneririz. Köprü işlem açmaz, ama yeni bir aracı önce risksiz bir hesapta tanımak iyi bir alışkanlıktır.</div>

<h2 id="gerekenler">Gerekenler</h2>
<ul>
  <li>MetaTrader 5. Windows'ta aracı kurumunun kurulum dosyası, macOS'ta MetaQuotes'un resmi uygulaması yeterli.</li>
  <li>Herhangi bir aracı kurumda demo ya da gerçek bir MT5 hesabı.</li>
  <li>Kalibre Köprü eklentisi (<code>KalibreKopru.ex5</code>) ve lisans anahtarın. İkisi de abone olduktan sonra <a href="/hesap/">Hesabım</a> sayfasındadır.</li>
</ul>

<h2 id="eklenti">1. Eklentiyi MetaTrader 5'e ekle</h2>
<ol>
  <li>MT5'te <b>File &gt; Open Data Folder</b> menüsünü aç (Türkçe menüde <b>Dosya &gt; Veri Klasörünü Aç</b>).</li>
  <li><code>MQL5\\Experts</code> klasörüne gir ve <code>KalibreKopru.ex5</code> dosyasını buraya kopyala.</li>
  <li>MT5'e dön. <b>Navigator</b> penceresinde <b>Expert Advisors</b> başlığına sağ tıklayıp <b>Refresh</b> de. Listede <b>KalibreKopru</b> görünür.</li>
</ol>

<h2 id="kod">2. Laboratuvarda eşleştirme kodunu üret</h2>
<ol>
  <li><a href="/baglan">MetaTrader'ı bağla</a> sayfasını aç; adımlar orada sırayla gösterilir.</li>
  <li>Tarayıcın senin için bir eşleştirme kodu üretir. <b>Kopyala</b> düğmesiyle kopyala.</li>
</ol>
<p>Kod <code>KLB1</code> ile başlar ve verini şifreleyen anahtardır. Yalnız bu tarayıcıda ve eklentinin ayarında durur; bizde bir kopyası yoktur. Kimseyle paylaşma.</p>

<h2 id="grafik">3. Eklentiyi bir grafiğe ekle</h2>
<ol>
  <li>Navigator'da <b>KalibreKopru</b>'yu herhangi bir grafiğin üzerine sürükle.</li>
  <li>Açılan pencerede <b>Inputs</b> sekmesine geç.</li>
  <li><b>Eşleştirme kodu</b> satırına laboratuvardaki kodu yapıştır.</li>
  <li><b>Lisans anahtarı</b> satırına <a href="/hesap/">Hesabım</a> sayfasındaki <code>KLM-</code> ile başlayan anahtarı yapıştır.</li>
  <li><b>Semboller</b> satırına izlemek istediklerini virgülle yaz, ör. <code>EURUSD,GBPUSD,XAUUSD</code>. Boş bırakırsan yalnız eklendiği grafiğin sembolü gönderilir.</li>
  <li><b>Zaman dilimi</b> olarak M1, M5, M15, M30, H1, H4, D1 ya da W1 seç ve <b>OK</b> de.</li>
</ol>
<p>Eklenti emir göndermediği için MT5'teki <b>Algo Trading</b> düğmesini açman gerekmez.</p>

<h2 id="izin">4. MetaTrader 5'te Kalibre adresine izin ver</h2>
<p>MT5, eklentilerin internete bağlanmasına yalnız senin izin verdiğin adreslerle izin verir. Bu adım güvenliğin için vardır ve bir kez yapılır.</p>
<ol>
  <li><b>Tools &gt; Options</b> menüsünü aç (Türkçe menüde <b>Araçlar &gt; Seçenekler</b>).</li>
  <li><b>Expert Advisors</b> sekmesine geç (<b>Uzman Danışmanlar</b>).</li>
  <li><b>Allow WebRequest for listed URL</b> kutusunu işaretle.</li>
  <li>Listeye <code>https://kalibremarkets.com</code> adresini ekle.</li>
  <li><b>OK</b> düğmesine bas. Pencereyi çarpıyla kapatırsan izin kaydedilmez.</li>
</ol>

<h2 id="dogrula">5. Bağlantıyı doğrula</h2>
<p>Grafiğin sol üst köşesinde <b>Kalibre Köprü</b> satırı görünür. Eklenti önce lisansı denetler (birkaç saniye), sonra veri göndermeye başlar. Durum <b>bağlı</b> olduğunda gönderilen belge sayısı artmaya başlar. Laboratuvarda da bağlantı durumu, aracı kurumunun adı ve son sinyalin kaç saniye önce geldiği görünür.</p>
<p>Seriler yeni bir mum kapandığında güncellenir. H1 seçtiysen saatte bir, D1 seçtiysen günde bir.</p>

<h2 id="sorunlar">Sık karşılaşılan durumlar</h2>
<table class="tablo">
  <thead><tr><th>Grafikte görünen</th><th>Ne yapmalı</th></tr></thead>
  <tbody>
    <tr><td>WebRequest izni yok</td><td>4. adımı tekrarla. Adresin tam olarak <code>https://kalibremarkets.com</code> yazıldığından ve <b>OK</b>'e basıldığından emin ol.</td></tr>
    <tr><td>Eklenti grafiğe eklenmiyor, kod hatası uyarısı çıkıyor</td><td>Kodu laboratuvardan yeniden kopyala. Başında ya da sonunda eksik karakter kalmış olabilir.</td></tr>
    <tr><td>Röleye ulaşılamadı</td><td>İnternet bağlantını kontrol et. Eklenti birkaç saniyede bir yeniden dener.</td></tr>
    <tr><td>Lisans geçersiz</td><td>Anahtarı <a href="/hesap/">Hesabım</a> sayfasından yeniden kopyala. Aboneliğin bittiyse ya da anahtar zaten iki MT5 hesabında kullanılıyorsa bu uyarıyı görürsün. Eklenti dakikada bir yeniden dener.</td></tr>
    <tr><td>Laboratuvar "kod eşleşmiyor" diyor</td><td>Eklentideki kod ile laboratuvardaki kod farklı. Laboratuvarda yeni kod ürettiysen eklentiye de yenisini yapıştır.</td></tr>
    <tr><td>Bağlantı bir süre sonra kopuyor</td><td>Köprü, MT5 açık ve bilgisayar uyanıkken çalışır. Bilgisayar uykuya geçince veri akışı durur, MT5 yeniden açılınca kendiliğinden devam eder.</td></tr>
  </tbody>
</table>

<h2 id="tradier">Tradier (ABD) ile bağlanmak</h2>
<p>ABD'deki aracı kurum Tradier'de hesabın varsa MetaTrader 5 yerine onu da bağlayabilirsin. Eklenti gerekmez; laboratuvar Tradier'e doğrudan senin tarayıcından bağlanır.</p>
<ol>
  <li>Tradier hesabında bir API erişim token'ı oluştur. İlk deneme için <b>Sandbox</b> token'ı öneririz; Sandbox fiyatları 15 dakika gecikmelidir.</li>
  <li><a href="/lab/baglan.html?kaynak=tradier">Bağlantı sayfasında</a> <b>Tradier</b> sekmesini seç, token'ı yapıştır, ortamı seç ve <b>Bağlan</b>'a bas.</li>
  <li>Birden çok hesabın varsa birini seç. Panom, strateji kurucu ve optimizasyon artık Tradier verisini kullanır.</li>
</ol>
<div class="kutu">Tradier token'ı hesabına tam erişim verir. Laboratuvar onu yalnız okumak için kullanır, emir göndermez. Token yalnız bu tarayıcıda saklanır ve yalnız Tradier'e gönderilir; Kalibre'ye hiç ulaşmaz. Bağlantıyı kestiğinde token tarayıcından silinir. Tradier'in koşullarına göre bu bağlantı kişisel kullanım içindir.</div>

<h2 id="alpaca">Alpaca (ABD) ile bağlanmak</h2>
<p>ABD'deki aracı kurum Alpaca'da hesabın varsa onu da bağlayabilirsin. Eklenti gerekmez; laboratuvar Alpaca'ya doğrudan senin tarayıcından bağlanır.</p>
<ol>
  <li>Alpaca panelinde bir API anahtar çifti oluştur (Key ID ve Secret). İlk deneme için <b>Paper</b> (sanal) hesabı öneririz.</li>
  <li><a href="/lab/baglan.html?kaynak=alpaca">Bağlantı sayfasında</a> <b>Alpaca</b> sekmesini seç, iki anahtarı yapıştır, ortamı seç ve <b>Bağlan</b>'a bas.</li>
  <li>Panom, strateji kurucu ve optimizasyon artık Alpaca verisini kullanır. İzleme listen boşsa açık pozisyonların, o da yoksa Panom'da eklediğin semboller gösterilir.</li>
</ol>
<div class="kutu">Ücretsiz Alpaca planında anlık fiyatlar yalnız IEX borsasından gelir; bu, tüm piyasa hacminin küçük bir kısmıdır. Laboratuvar anahtarları yalnız okumak için kullanır, emir göndermez. Anahtarlar yalnız bu tarayıcıda saklanır ve yalnız Alpaca'ya gönderilir; Kalibre'ye hiç ulaşmaz. Bağlantıyı kestiğinde tarayıcından silinir. Bu bağlantı kendi kişisel anahtarlarınla çalışır.</div>

<div class="kutu">Kalibre Lab beta sürümündedir. Kurmadan önce <a href="/risk-bildirimi/">risk bildirimini</a> oku; ilk kurulumu demo hesapta yap.</div>

<h2 id="eklentisiz">Eklentisiz çalışmak</h2>
<p>Eklenti kurmak istemiyorsan, MT5'ten dışa aktardığın bir mum dosyasını (CSV ya da JSON) laboratuvara sürükleyip bırakabilirsin. Dosya bilgisayarından hiç çıkmaz; tarayıcında okunur.</p>
'''
sayfa("kurulum/index.html", "Kurulum: MetaTrader 5'i Kalibre Lab'e bağla", "Kalibre Köprü eklentisini MetaTrader 5'e kurma, eşleştirme kodunu girme ve WebRequest iznini verme adımları.", "/kurulum/", KURULUM,
      icindekiler(KURULUM) + '<p>Takıldığın bir adım olursa <a href="/iletisim/" style="display:inline">bize yaz</a>.</p>')

# ------------------------------------------------------------------ güvenlik
GUVENLIK = '''
<h1>Güvenlik</h1>
<p class="giris">Fiyat geçmişin ve pozisyonların senin bilgisayarında şifrelenir ve yalnız senin tarayıcında açılır. Aradaki sunucu, yani biz, içeriği okuyamayız. Bu sayfa bunun nasıl sağlandığını ve nerede bittiğini anlatır.</p>

<h2 id="kisaca">Kısaca</h2>
<ul>
  <li>Anahtar, laboratuvarın tarayıcında ürettiği eşleştirme kodudur. Bizde bir kopyası yoktur.</li>
  <li>Eklenti her paketi göndermeden önce şifreler ve mühürler. Mührü tutmayan paket açılmaz.</li>
  <li>Sunucu yalnız şifreli paketi kısa süre saklar ve en geç iki saat sonra siler.</li>
  <li>Eklenti işlem açmaz, hesap numaranı ve şifreni okumaz.</li>
</ul>

<h2 id="kod">Eşleştirme kodu</h2>
<p>Kod, tarayıcının güvenli rastgele sayı üreteciyle oluşturulan 32 baytlık bir sırdır ve <code>KLB1</code> ile başlar. Kod iki yerde durur: bu tarayıcının yerel deposunda ve MT5'te eklentinin ayarında. Hiçbir zaman sunucuya gönderilmez.</p>
<p>Koddan üç ayrı anahtar türetilir (HMAC-SHA256 ile): paketleri bulmaya yarayan bir <b>kanal numarası</b>, içeriği şifreleyen bir <b>şifreleme anahtarı</b> ve paketi mühürleyen bir <b>mühür anahtarı</b>. Sunucu yalnız kanal numarasını görür; kanal numarasından kod ya da diğer anahtarlar geri hesaplanamaz.</p>

<h2 id="sifreleme">Şifreleme ve mühür</h2>
<ul>
  <li>İçerik AES-256 ile şifrelenir (CTR kipi). Her paket, bir daha kullanılmayan bir başlangıç değeri alır.</li>
  <li>Her paket HMAC-SHA256 ile mühürlenir. Mühür, kanal numarasını, paketin hangi yuvaya ait olduğunu ve şifreli içeriği birlikte kapsar.</li>
  <li>Tarayıcı önce mührü doğrular, sonra açar. İçeriği değiştirilmiş, başka bir yuvaya taşınmış ya da başka bir kodla mühürlenmiş paket reddedilir.</li>
  <li>Sembol adları da şifrelidir. Sunucu, hangi sembolü izlediğini paketin adından çıkaramaz.</li>
</ul>
<p>Aynı protokol üç ayrı uygulamada yazıldı: MetaTrader 5 eklentisi, laboratuvar ve bağımsız bir referans uygulaması. Aynı girdiyle üçü bayt bayt aynı şifreli paketi üretiyor; bu karşılaştırma her sürümde otomatik testle tekrarlanır.</p>

<h2 id="sunucu">Sunucu ne yapar?</h2>
<table class="tablo">
  <thead><tr><th>Sunucunun gördüğü</th><th>Sunucunun göremediği</th></tr></thead>
  <tbody>
    <tr><td>Şifreli paketler</td><td>Semboller, fiyatlar, mumlar</td></tr>
    <tr><td>Paketlerin boyutu ve geliş zamanı</td><td>Pozisyonlar, bakiye, kâr ve zarar</td></tr>
    <tr><td>Kanal numarası</td><td>Aracı kurumun ve sunucu adın</td></tr>
    <tr><td>Bağlantının IP adresi (iletim sırasında)</td><td>Eşleştirme kodu</td></tr>
  </tbody>
</table>
<p>Sunucu, paketin biçimini denetler ve kısa ömürlü bir depoda saklar. Her paket en geç iki saat sonra kendiliğinden silinir; yerine yenisi gelirse eskisi hemen silinir. Paketlerin içeriği günlüklere yazılmaz. Kanal başına dakikada yazılabilecek paket sayısı sınırlıdır.</p>

<h2 id="eklenti">Eklenti neyi okur?</h2>
<p>Kalibre Köprü yalnız okur; emir göndermez, pozisyon kapatmaz, ayar değiştirmez. Okuduğu ve şifreleyip gönderdiği bilgiler:</p>
<ul>
  <li>Seçtiğin sembollerin kapanmış mumları: zaman, açılış, en yüksek, en düşük, kapanış, tik hacmi.</li>
  <li>Açık pozisyonlar: sembol, yön, lot, açılış zamanı ve fiyatı, güncel fiyat, stop, hedef, kâr ve pozisyonun eklenti numarası.</li>
  <li>Hesabın para birimi, bakiyesi ve varlığı.</li>
  <li>Aracı kurumun adı, sunucu adı ve hesabın demo mu gerçek mi olduğu.</li>
</ul>
<p>Okumadıkları: hesap numaran, şifren, kişisel bilgilerin, geçmiş işlem kayıtların.</p>

<h2 id="sinirlar">Korumanın sınırları</h2>
<p>Hiçbir sistem her şeye karşı korumaz. Bu sistemin dayandığı varsayımlar şunlar:</p>
<ul>
  <li><b>Kodu ele geçiren, verini okuyabilir.</b> Kodu kimseyle paylaşma. Şüphelenirsen laboratuvarda yeni kod üret ve eklentiye yenisini yapıştır; eski kod o andan sonra işe yaramaz.</li>
  <li><b>Cihazının güvenliği sana aittir.</b> Bilgisayarına ya da tarayıcına erişen biri, açılmış veriyi de görebilir.</li>
  <li><b>Trafiğin varlığı gizli değildir.</b> Sunucu, bir kanalın ne sıklıkla ve ne büyüklükte paket gönderdiğini görür. Bu, içeriği değil yalnız kullanım biçimini gösterir.</li>
</ul>
<p>Bir güvenlik açığı bulduğunu düşünüyorsan lütfen <a href="/iletisim/">bize yaz</a>.</p>
'''
sayfa("guvenlik/index.html", "Güvenlik: verin senin, anahtar da", "Kalibre Lab'in MetaTrader 5 köprüsü nasıl şifreler, sunucu neyi görür ve neyi göremez, korumanın sınırları nelerdir.", "/guvenlik/", GUVENLIK, icindekiler(GUVENLIK))

# ------------------------------------------------------------------ metodoloji
METODOLOJI = '''
<h1>Metodoloji</h1>
<p class="giris">Laboratuvarda gördüğün her rakamın nereden geldiğini ve nasıl hesaplandığını bilmen gerekir. Bu sayfa veriyi, hızlı provanın kurallarını ve bilinen sınırları anlatır.</p>

<h2 id="veri">Veri nereden gelir?</h2>
<p>Kalibre piyasa verisi yayınlamaz. Laboratuvardaki her seri üç kaynaktan birinden gelir ve kaynağı serinin adında yazar:</p>
<table class="tablo">
  <thead><tr><th>Kaynak</th><th>Etiket</th><th>Açıklama</th></tr></thead>
  <tbody>
    <tr><td>Örnek seri</td><td>SENTETİK</td><td>Tohumlu bir rastgele süreçle üretilir. Gerçek bir piyasayı göstermez; laboratuvarı tanımak içindir.</td></tr>
    <tr><td>Kendi dosyan</td><td>KENDİ VERİN</td><td>MT5'ten ya da başka bir yerden dışa aktardığın dosya. Tarayıcında okunur, bilgisayarından çıkmaz.</td></tr>
    <tr><td>Canlı köprü</td><td>MT5 ve aracı kurum adı</td><td>Kendi MT5 hesabının fiyat geçmişi, uçtan uca şifreli olarak (<a href="/guvenlik/">güvenlik</a>).</td></tr>
  </tbody>
</table>
<p>Eğitim yazılarında geçen rakamlar kamuya açık kaynaklardan bir kez alınır, kaynağı ve tarihi yazının içinde belirtilir ve güncellenmez.</p>

<h2 id="zaman">Mum zamanları</h2>
<p>MT5'ten gelen mum zamanları aracı kurumunun sunucu saatidir, yani MT5 grafiğinde gördüğün saat. Bunları UTC'ye çevirmeyiz: geçmiş mumları bugünkü saat farkıyla çevirmek, yaz saati geçişlerinde bir saatlik kaymaya yol açar. Laboratuvar sunucu saatinin UTC'ye göre farkını ayrıca gösterir.</p>

<h2 id="prova">Hızlı prova nasıl çalışır?</h2>
<p>Hızlı prova, MetaTrader 5'teki Kalibre motorunun kurallarını tarayıcıda taklit eder. Motorla aynı olanlar:</p>
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
  <li>Spread, komisyon, swap ve kayma yoktur. Haber filtresi uygulanmaz.</li>
</ul>
<div class="kutu">Bu yüzden hızlı prova bir fikri elemek içindir, onaylamak için değil. Son sınav, aynı kural dosyasıyla MT5 Strategy Tester'da, aracı kurumunun maliyet ayarlarıyla yapılır.</div>

<h2 id="oynaklik">Oynaklık modelleri</h2>
<p>Oynaklık laboratuvarı üç ölçü sunar. EWMA, son getirilere üstel ağırlık verir (RiskMetrics yaklaşımı). Yang-Zhang, açılış, kapanış ve mum içi aralığı birlikte kullanır. GARCH, oynaklığın kümelenmesini ve uzun dönem düzeyine dönüşünü modeller; parametreler kendi verinde en çok olabilirlikle tahmin edilir.</p>

<h2 id="yorum">Sonuçları nasıl okumalı?</h2>
<ul>
  <li>Getiriyi her zaman en büyük düşüşle birlikte oku. Aynı getiriyi yarı düşüşle sağlayan kural daha sağlamdır.</li>
  <li>İşlem sayısı azsa sonuç tesadüf olabilir. Birkaç işlemle kazanan bir kural, kanıt sayılmaz.</li>
  <li>Bir kuralı çok sayıda ayarla deneyip en iyisini seçmek, geçmişe uydurmadır. Beğendiğin ayarı, test etmediğin bir dönemde tekrar sına.</li>
  <li>Geçmişte işleyen bir kural gelecekte işlemeyebilir.</li>
</ul>
'''
sayfa("metodoloji/index.html", "Metodoloji: veri, hızlı prova ve sınırlar", "Kalibre Lab'deki verinin kaynağı, hızlı provanın kuralları, oynaklık modelleri ve sonuçları okurken dikkat edilecekler.", "", METODOLOJI, icindekiler(METODOLOJI))

# ------------------------------------------------------------------ hakkında
HAKKINDA = '''
<h1>Hakkında</h1>
<p class="giris">Kalibre, bir stratejiye para bağlamadan önce onu dürüstçe sınamak isteyenler için yazılım yapar.</p>

<h2 id="neden">Neden?</h2>
<p>Bireysel yatırımcının elindeki araçlar çoğu zaman getiriyi gösterir, riski saklar. Bir bankanın hazine masasında ise ilk soru ne kazandıracağı değil, en kötü gününde ne kaybettireceğidir. Bir ekonomist de tek bir dönemin sonucuna değil, o sonucu üreten koşulların tekrar edip etmeyeceğine bakar.</p>
<p>Kalibre Lab bu iki bakışı bireysel yatırımcının kendi verisine getirmek için var: varsayımı açıkça yaz, kendi aracı kurumunun fiyatlarıyla sına, riski getiriyle aynı satırda gör.</p>

<h2 id="ilkeler">Nasıl çalışırız?</h2>
<ul>
  <li><b>Veri senindir.</b> Fiyat yayınlamayız. Laboratuvar senin MT5 hesabının verisiyle ya da açıkça SENTETİK etiketli örneklerle çalışır.</li>
  <li><b>Anahtar sendedir.</b> Köprüden geçen veriyi biz okuyamayız. Bunu bir söz olarak değil, protokolün kendisiyle sağlarız (<a href="/guvenlik/">güvenlik</a>).</li>
  <li><b>Yöntem açıktır.</b> Bir rakamın nasıl hesaplandığını ve neyi hesaba katmadığını yazarız (<a href="/metodoloji/">metodoloji</a>).</li>
  <li><b>Tavsiye vermeyiz.</b> Hangi kuralı kuracağına ve ne zaman işlem yapacağına sen karar verirsin.</li>
</ul>

<h2 id="yasal">Yasal çerçeve</h2>
<p>Kalibre Markets bir yazılım sağlayıcısıdır. Sermaye Piyasası Kurulu'ndan yatırım danışmanlığı ya da aracılık izni yoktur ve bu hizmetleri sunmaz. Laboratuvarda gösterilen sonuçlar geçmiş veriye dayanır ve gelecekteki sonuçların göstergesi değildir.</p>

<h2 id="iletisim">İletişim</h2>
<p>Soru, öneri ya da hata bildirimi için <a href="/iletisim/">iletişim sayfası</a>.</p>
'''
sayfa("hakkinda.html", "Hakkında: Kalibre", "Kalibre neden var, nasıl çalışır ve neyi yapmaz.", "", HAKKINDA)

# ------------------------------------------------------------------ abonelik
PRO_MOTOR_TR = '<li>Kalibre Motor: kural dosyanı MT5\'te çalıştıran eklenti. Gerçek hesapta kullanımı <b>beta</b>dır; açık kabul ve kayıp sınırı ister, <a href="/risk-bildirimi/">risk bildirimini</a> oku.</li>'
PRO_ACIK_TR = """  <label class="onay"><input type="checkbox" id="sartlar" required> <span><a href="/kullanim-sartlari/">Kullanım şartlarını</a> ve <a href="/gizlilik/">gizlilik politikasını</a> okudum, kabul ediyorum.</span></label>
  <label class="onay"><input type="checkbox" id="cayma" required> <span>Lisans anahtarımın teslim edilip bir MetaTrader 5 hesabında etkinleştirilmesiyle hizmetin ifasına hemen başlanacağını ve etkinleştirmeden sonra 14 günlük cayma hakkımı kaybedeceğimi kabul ediyorum (<a href="/kullanim-sartlari#cayma">şartlar, bölüm 12a</a>).</span></label>
  <button type="button" class="dugme" id="abone-ol">Abone ol</button>
  <p class="not" id="odeme-durum" role="status"></p>
  <p class="not">Abonelik Kalibre Markets hesabına bağlanır: önce giriş yaparsın, hesabın yoksa bu adımda oluşturulur. Ödeme Stripe ile alınır; kart bilgilerin bize ulaşmaz. Aboneliğini istediğin zaman <a href="/hesap/">Hesabım</a> sayfasından iptal edebilirsin; dönem sonuna kadar kullanmaya devam edersin.</p>"""
PRO_KAPALI_TR = """  <div class="yakinda">
    <h3>Ödemeler yakında açılıyor</h3>
    <p>Kalibre Lab şu an beta sürümünde. Abonelikler açıldığında haber almak için aşağıdaki listeye yazıl.</p>
    <p><b>Davetli misin?</b> Giriş yap ve sana gönderilen beta lisansını <a href="/hesap/">Hesabım</a> sayfasında hesabına bağla.</p>
  </div>"""
PLAN_SECIM = ('<div id="odeme-acik">\n' + PRO_ACIK_TR + '\n</div>\n' + PRO_KAPALI_TR.replace('<div class="yakinda">', '<div class="yakinda" id="odeme-yakinda" hidden>')) if ODEME_ACIK else PRO_KAPALI_TR
PRO = f"""
<h1>Abonelik</h1>
<p class="giris">Laboratuvarın ücretsiz kısmıyla bir fikri eleyebilirsin. Abonelik, beğendiğin kuralı kendi MetaTrader 5 hesabında çalıştırman ve verini canlı taşıman içindir.</p>

<div class="plan" id="plan">
  <div class="plan-bas">
    <h2>Kalibre Lab <span class="rozet-beta">beta</span></h2>
    <p class="fiyat"><span class="sayi">399 TL</span> / ay</p>
  </div>
  <ul>
    {PRO_MOTOR_TR}
    <li>Prop kalkanı: günlük ve toplam kayıp sınırları, FTMO ve The5ers ön ayarları</li>
    <li>MetaTrader 5'ten canlı, şifreli veri köprüsü (Kalibre Köprü)</li>
    <li>En çok 2 MT5 hesabı</li>
    <li>Ücretsiz kısmın tamamı</li>
  </ul>
{PLAN_SECIM}
</div>

<h2 id="ucretsiz">Ücretsiz kalanlar</h2>
<ul>
  <li>Laboratuvar, SENTETİK örnek serilerle ve kendi yüklediğin dosyalarla.</li>
  <li>Kural dosyası oluşturma, hızlı prova ve oynaklık laboratuvarı.</li>
  <li>Kalibre Motor'un MT5 Strategy Tester'da çalışması: geçmiş testler lisans istemez.</li>
  <li>Eğitim yazıları, grafik okuma testi ve önyargı testi.</li>
</ul>

<h2 id="bekleme">{"Henüz karar vermedin mi?" if ODEME_ACIK else "Ödemeler açılınca haber al"}</h2>
<p>{"Yeni özellikler çıktığında haber almak için e-postanı bırakabilirsin." if ODEME_ACIK else "Abonelikler açıldığında ve yeni özellikler çıktığında sana e-posta göndeririz."}</p>
<div class="bekleme">
  <p id="ok-msg" hidden><b>Listedesin.</b> {"Yeni özellikler çıktığında" if ODEME_ACIK else "Abonelikler açıldığında"} sana e-posta göndereceğiz.</p>
  <form action="https://formsubmit.co/markets@kalibrefin.com" method="POST" id="wl-form">
    <input type="hidden" name="_subject" value="Kalibre Lab bekleme listesi: yeni kayıt">
    <input type="hidden" name="_next" value="https://kalibremarkets.com/pro/?ok=1">
    <input type="hidden" name="_captcha" value="false">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
    <label for="eposta">E-posta adresin</label>
    <div class="satir">
      <input type="email" id="eposta" name="email" required autocomplete="email">
      <button type="submit" class="dugme{" ikincil" if ODEME_ACIK else ""}">Listeye yazıl</button>
    </div>
  </form>
  <p class="not">E-postan yalnız bunun için kullanılır ve FormSubmit hizmeti aracılığıyla bize iletilir. Listeden çıkmak için <a href="mailto:markets@kalibrefin.com">markets@kalibrefin.com</a> adresine yazman yeterli.</p>
</div>

<div class="kutu">Kalibre Markets SPK lisanslı bir kurum değildir ve yatırım danışmanlığı vermez. Abonelik, kendi kurduğun kurallar ve testler için bir yazılım aracıdır; yatırım tavsiyesi değildir. Kalibre Motor senin onayınla, senin kurduğun kurallara göre işlem açar; sonuçların sorumluluğu sana aittir. Ayrıntılar <a href="/risk-bildirimi/">risk bildiriminde</a>.</div>
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
    if (!document.getElementById('sartlar').checked) { durum.textContent = 'Devam etmek için kullanım şartlarını ve gizlilik politikasını onaylamalısın.'; return; }
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
sayfa("pro/index.html", "Abonelik: Kalibre Lab", ("Kalibre Lab aboneliği: Kalibre Motor'u MT5 hesabında çalıştır, verini şifreli köprüyle taşı. Aylık 399 TL, istediğin zaman iptal." if ODEME_ACIK else "Kalibre Lab (beta) aboneliği: aylık 399 TL. Ödemeler yakında açılıyor; bekleme listesine yazıl."), "/pro/", PRO, ek_stil=PRO_STIL, ek_betik=PRO_BETIK)

# ------------------------------------------------------------------ hesap
# Giriş (/giris) ve Hesabım (/hesap) sayfaları: yerel/hesap-uret.py (TR + EN).

# ------------------------------------------------------------------ prop trader
PROP = """
<h1>Sınavı kural ihlalinden kaybetme.</h1>
<p class="giris">Prop firması sınavlarında hesapların çoğu kötü bir stratejiden değil, tek bir kötü günden kaybedilir: günlük kayıp ya da toplam düşüş sınırı aşılır ve hesap kapanır. Kalibre Motor'un kalkanı bu sınırları her tikte izler ve sen fark etmeden önce devreye girer.</p>
<div class="eylem-satir"><a class="dugme" href="/pro/">Aboneliği incele</a><a class="dugme ikincil" href="#hesapla">Kendi hesabını hesapla</a></div>

<h2 id="nasil">Kalkan ne yapar?</h2>
<ul>
  <li><b>İki tabanı birlikte izler.</b> Günlük taban gün başı bakiyesinden, toplam taban başlangıç ya da tepe bakiyeden hesaplanır; hangisi yüksekse o geçerlidir. Günün sıfırlanma saati firmaya göre ayarlıdır (FTMO'da Orta Avrupa saatiyle 00:00, yaz saati dahil).</li>
  <li><b>Lotu sınıra göre küçültür.</b> Yeni işlemin stop olursa kaybı, açık pozisyonların stoplarına kalan riskle birlikte tabana kalan mesafeyi aşamaz. Hesaptaki elle açtığın pozisyonlar da sayılır.</li>
  <li><b>Önce durur, sonra kapatır.</b> Tabana güvenlik payının iki katı kalınca yeni işlem açılmaz. Bir katı kalınca Motor kendi pozisyonlarını kapatır ve gün sıfırlanana kadar işlem açmaz.</li>
  <li><b>Haber kuralını uygular.</b> Firma yüksek önemli haber çevresinde işlemi yasaklıyorsa, o pencerede yeni işlem açılmaz.</li>
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
<p class="not">Firma kuralları değişebilir. Kalkanı açmadan önce ön ayarı kendi hesabının koşullarıyla karşılaştır. "En iyi gün" gibi tutarlılık kuralları kalkanın kapsamında değildir.</p>

<h2 id="hesapla">Kendi hesabını hesapla</h2>
<p>Kalkanın bir an için yaptığı hesabın aynısı. Değerleri sen girersin; hiçbir yere gönderilmez.</p>
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

<h2 id="deneme">Bir deneme</h2>
<p>Kalkanı Strategy Tester'da bilerek aşırı riskli bir stratejiyle sınadık: EURUSD 15 dakikalık, 1 Ocak - 1 Ekim 2026, 100.000 USD başlangıç, işlem başına bakiyenin %5'i risk.</p>
<table class="tablo">
  <thead><tr><th></th><th>Kalkansız</th><th>FTMO 2-Step kalkanıyla</th></tr></thead>
  <tbody>
    <tr><td>En kötü günün kapanan kaybı</td><td class="sayi">18.900</td><td class="sayi">4.009</td></tr>
    <tr><td>Günlük sınır (5.000) aşıldı mı?</td><td>Evet, sınav kaybedilirdi</td><td>Hayır</td></tr>
    <tr><td>En düşük bakiye (toplam taban 90.000)</td><td class="sayi">94.432</td><td class="sayi">90.999</td></tr>
  </tbody>
</table>
<div class="kutu">Bu bir geçmiş simülasyondur ve kalkanın kurallara nasıl uyduğunu gösterir; kâr gösterdiği iddia edilmez. Kalkanlı hesap bu dönemi zararla kapattı, ama kural ihlal etmedi. Kalkan kötü bir stratejiyi iyi yapmaz; kötü bir günün hesabı kapatmasını önler.</div>

<h2 id="kapsam">Kapsam ve sınırlar</h2>
<ul>
  <li>Kalkan Kalibre Motor'un bir parçasıdır. Motor, Kalibre Lab'de kendi kurduğun kural dosyasını kendi hesabında çalıştırır; sinyal satmayız ve senin yerine karar vermeyiz.</li>
  <li>Kalibre bir prop firması değildir ve hiçbir firmayla bağlantılı değildir. Firmaların adları yalnız kurallarını tanımlamak için geçer.</li>
  <li>Kayma ve boşluklu açılışlar (gap) stopun ötesinde kayba yol açabilir; güvenlik payı bunun için vardır.</li>
  <li>Kalkan beta sürümündedir ve bir garanti değildir. Gerçek hesapta kullanmadan önce <a href="/risk-bildirimi/">risk bildirimini</a> oku.</li>
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
sayfa("prop/index.html", "Prop firması kalkanı: sınavı kural ihlalinden kaybetme", "Kalibre Motor'un kalkanı günlük ve toplam kayıp sınırlarını her tikte izler, lotu sınıra göre küçültür ve tabana yaklaşınca durur. FTMO ve The5ers ön ayarları.", "/prop/", PROP, icindekiler(PROP), ek_stil=PROP_STIL, ek_betik='<script src="/static/kalkan-hesap.js" defer></script>')

# ------------------------------------------------------------------ bireysel forex
FOREX = """
<h1>Hesabını patlatma.</h1>
<p class="giris">Bireysel kaldıraçlı işlem hesaplarının büyük çoğunluğu para kaybeder. Kaybın en güçlü nedeni kaldıraç ve pozisyon büyüklüğüdür; strateji ikinci sırada gelir. Kalibre Lab önce bu ikisini düzeltir.</p>
<div class="eylem-satir"><a class="dugme" href="/lab/">Laboratuvarı aç</a><a class="dugme ikincil" href="/kurulum/">Kurulumu oku</a></div>

<h2 id="neden">Neden önce risk?</h2>
<ul>
  <li><b>Kayıp oranları yüksek.</b> Avrupa'da düzenleyici ESMA'nın 2018 incelemesine göre bireysel CFD hesaplarının %74-89'u para kaybetti. Türkiye'de SPK 2015'te yatırımcıların yaklaşık %87-88'inin zarar ettiğini açıkladı ve 2017'de kaldıracı 1:10'a indirdi.</li>
  <li><b>Kaldıraç kaybı büyütür.</b> ABD'de 2010'daki kaldıraç sınırının etkisini ölçen bir akademik çalışma (Heimer ve Simsek, Journal of Financial Economics, 2019), sınırın yüksek kaldıraçlı yatırımcıların kayıplarını yaklaşık %40 azalttığını buldu.</li>
  <li><b>Oynaklık değişir, lot da değişmeli.</b> Oynaklık yükseldiğinde aynı lot daha büyük bir risk demektir. Oynaklığa göre pozisyon küçültmenin döviz piyasasında getiriyi belirgin artırmadığı, ama aşırı kayıpları azalttığı gösterildi (Harvey ve diğerleri, 2018). Vaadimiz bu yüzden "daha çok kazan" değil, "daha az patla".</li>
</ul>

<h2 id="araclar">Kalibre Lab'de</h2>
<ul>
  <li><b>Risk bütçesi:</b> her işlemde bakiyenin yüzde kaçını riske attığını sen belirlersin; lot stop mesafesinden hesaplanır.</li>
  <li><b>Oynaklığa göre ölçek:</b> oynaklık olağanın üstüne çıkınca risk kendiliğinden küçülür (EWMA, Yang-Zhang, GARCH).</li>
  <li><b>Günlük kayıp sınırı ve haber filtresi:</b> kötü bir günde durmak ve yüksek önemli veri çevresinde işlem açmamak için.</li>
  <li><b>Kendi verin:</b> kuralını kendi aracı kurumunun fiyatlarıyla sınarsın; son sınav MT5 Strategy Tester'da, kendi maliyet ayarlarınla.</li>
</ul>

<h2 id="turkiye">Türkiye'deki hesaplar için</h2>
<p>Türkiye'de kaldıraçlı işlemler yalnız SPK yetkili aracı kurumlar üzerinden yapılabilir; azami kaldıraç 1:10'dur. Kalibre Lab aracı kurum değildir, hesabını açmaz ve emrini iletmez; MetaTrader 5 sunan aracı kurumundaki kendi hesabında çalışır. Yetkisiz yurt dışı sitelere erişim SPK kararlarıyla engellenmektedir; hesabını yetkili bir kurumda tut.</p>

<div class="kutu">Kalibre Lab bir yazılım aracıdır; yatırım danışmanlığı sunmaz ve getiri vaat etmez. Kaldıraçlı işlemler yatırdığın tutarın tamamını kaybetmene yol açabilir.</div>
"""
sayfa("forex/index.html", "Bireysel forex: hesabını patlatma", "Kaldıraçlı işlemde kaybın en güçlü nedeni pozisyon büyüklüğü. Kalibre Lab risk bütçesi, oynaklığa göre lot ve günlük kayıp sınırıyla önce riski düzeltir.", "", FOREX, icindekiler(FOREX), ek_stil=PROP_STIL)

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
    sonraki = "https://kalibremarkets.com/en/beta/?ok=1" if en else "https://kalibremarkets.com/beta/?ok=1"
    secenek = lambda deger, etiket: f'<option value="{deger}">{etiket}</option>'
    sayfalar = [("baglan", t("Bağlanma sayfası", "Connect page")), ("panom", t("Panom", "Dashboard")), ("kurucu", t("Strateji kurucu", "Strategy builder")),
                ("optimizasyon", t("Optimizasyon", "Optimization")),
                ("kopru", t("Köprü eklentisi (MT5)", "Bridge add-on (MT5)")), ("alpaca", "Alpaca"), ("tradier", "Tradier"), ("site", t("Sitenin diğer sayfaları", "Other site pages"))]
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
                     "Do not include pairing codes, licence keys, API keys or passwords. If you want to send a screenshot, cover your account number and balance and email it.")}</p>
    <button type="submit" class="dugme">{t("Gönder", "Send")}</button>
  </form>
  <p class="not">{t("Form, FormSubmit hizmeti aracılığıyla bize iletilir ve yalnız ürünü düzeltmek için kullanılır. Ayrıntılar ", "The form is delivered to us through the FormSubmit service and is used only to fix the product. Details are in the ")}<a href="{"/en/privacy/" if en else "/gizlilik/"}">{t("gizlilik politikasında", "privacy policy")}</a>.</p>
</div>'''

def beta_mailto(dil):
    import urllib.parse
    en = dil == "en"
    konu = "Kalibre beta geri bildirim"
    govde = ("Section / page:\nBrowser and OS:\nSteps:\n1.\n2.\n3.\nExpected:\nActual (exact error message):\n\nDo not include pairing codes, licence keys, API keys or passwords."
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
<div class="kutu"><b>Beta programında demo hesap kullan.</b> Davetle verilen beta lisansıyla gerçek parayla çalışan bir hesap bağlama. Tüm sonuçlar simülasyondur ve maliyetleri içermeyebilir; gerçek parayla karar verme. Ayrıntılar <a href="/risk-bildirimi/">risk bildiriminde</a>.</div>

<h2 id="lisans">Beta lisansını nasıl alırım?</h2>
<p>Davetle sana bir <b>davet kodu</b> gelir. <a href="/pro/">Fiyatlar</a> sayfasında şartları onaylayıp "Abone ol"a bas, Kalibre Markets hesabınla giriş yap (hesabın yoksa bu adımda açılır); ödeme sayfasında "Promosyon kodu ekle"ye kodunu yaz. Kod ilk 3 ayı ücretsiz yapar ve kart istenmez. Ödemeden sonra lisans anahtarın <a href="/hesap/">Hesabım</a> sayfasında görünür. Sana doğrudan bir lisans anahtarı geldiyse aynı sayfada "Hesabıma bağla" ile hesabına bağla.</p>
<div class="kutu"><b>3 ay sonra ne olur?</b> Ücretsiz dönem bitince abonelik aylık ücretli plana döner ve Stripe senden ödeme ister. Devam etmek istemiyorsan dönem bitmeden <a href="/hesap/">Hesabım</a> sayfasından iptal et; ödeme yapılmazsa lisans birkaç gün içinde kapanır. Davet kodu etkin olduğu sürece lisans yalnız Kalibre Köprü'yü kapsar; ücretsiz dönem bitip ücretli plana geçtiğinde lisans Kalibre Motor dahil tam ürünü kapsar.</div>

<h2 id="neler-var">Betada neler var?</h2>
<ul>
  <li><b>MetaTrader 5 köprüsü ve Panom:</b> demo MT5 hesabının bakiyesi, açık pozisyonları, izlediğin kurlar ve son 90 günün kapanmış işlemleri, uçtan uca şifreli.</li>
  <li><b>Strateji kurucu:</b> Basit mod (bloklar) ve İleri mod (form); ikisi aynı stratejiyi düzenler.</li>
  <li><b>Hızlı prova:</b> kuralı kendi mumlarında saniyeler içinde dener. Maliyetleri içermez.</li>
  <li><b>Optimizasyon:</b> parametre taraması, eğitim ve sınama dönemi, ısı haritası, şans eseri olup olmadığı ölçüsü.</li>
  <li><b>Alpaca (paper) ve Tradier (sandbox):</b> ABD aracı kurumlarına tarayıcıdan doğrudan bağlantı.</li>
</ul>
<div class="kutu"><b>Otomatik işlem beta programının parçası değildir.</b> Kalibre Motor (kural dosyasını MT5'te çalıştıran eklenti) ve prop kalkanı beta lisansına dahil değildir; beta lisansın yalnız Kalibre Köprü'yü (okuma) kapsar. Beta programında hiçbir hesapta emir açılmaz.</div>

<h2 id="ilk-oturum">İlk oturum (yaklaşık 30 dakika)</h2>
<ol>
  <li><a href="/baglan">Bağlanma sayfasından</a> demo MT5 hesabını bağla: eklentiyi indir, kodu yapıştır, izin adresini ekle, <b>OK</b>'e bas. Takıldığın adımı not al.</li>
  <li><a href="/panom">Panom'u</a> aç: bakiye, kurlar ve pozisyonlar doğru mu? MT5'te gördüklerinle karşılaştır.</li>
  <li>Strateji kurucuda Basit modda bir strateji kur (ör. iki ortalamanın kesişmesi) ya da bir eğitim örneği yükle; risk bölümünü kendin doldur; hızlı provayı çalıştır.</li>
  <li><a href="/lab/optimizasyon.html">Optimizasyon</a> sayfasında iki parametreyi tara; ısı haritasına ve sınama dönemi sonucuna bak.</li>
  <li>İstersen Alpaca paper ya da Tradier sandbox hesabını da <a href="/baglan">bağlanma sayfasından</a> bağla ve Panom'u onunla dene.</li>
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
sayfa("beta/index.html", "Beta programı rehberi: Kalibre Lab", "Kalibre Lab beta programı: neler var, ilk oturum, yapılmaması gerekenler ve geri bildirim.", "", BETA, icindekiler(BETA), ek_stil=BETA_FORM_STIL, ek_betik=BETA_BETIK, gizli=True)

# ------------------------------------------------------------------ risk bildirimi
RISK = """
<h1>Risk bildirimi</h1>
<p class="giris">Kalibre Lab, Kalibre Köprü ve Kalibre Motor'u kullanmadan önce lütfen bu sayfayı okuyun. Bu Risk Bildirimi, <a href="/kullanim-sartlari">Kullanım Şartları</a>'nın ayrılmaz bir parçasıdır.</p>

<h2 id="beta">Beta sürümü</h2>
<p>Kalibre Lab beta sürümündedir. Özellikler değişebilir, yazılımda hatalar bulunabilir ve hesaplamalar yanlış sonuç verebilir. Bir sonuca güvenmeden önce aynı kuralı kendi MetaTrader 5 Strategy Tester'ında ve demo hesapta deneyin. Yanlış gördüğünüz her sayıyı <a href="/beta">geri bildirim formuyla</a> bildirin.</p>

<h2 id="simulasyon">Simülasyon ve varsayımsal sonuçlar</h2>
<p>Laboratuvar, hızlı prova, optimizasyon ve sayfalardaki örnekler varsayımsal (simüle edilmiş) sonuçlardır ve doğal sınırları vardır:</p>
<ul>
  <li>Gerçek bir işlem kaydının aksine, simüle edilmiş sonuçlar gerçek işlemleri göstermez.</li>
  <li>İşlemler gerçekten yapılmadığı için sonuçlar, likidite eksikliği gibi bazı piyasa etkilerini olduğundan az ya da çok yansıtmış olabilir.</li>
  <li>Hızlı prova spread, komisyon, swap ve kaymayı içermez; gerçek sonuç genellikle daha düşüktür.</li>
  <li>Optimizasyon, geçmiş veri üzerinde ve geriye dönük bilgiyle yapılır; en iyi görünen ayar çoğu zaman geçmişe uydurulmuştur.</li>
  <li>Herhangi bir hesabın gösterilenlere benzer kâr ya da zarar elde edeceği ya da etmesinin muhtemel olduğu yönünde hiçbir beyanda bulunulmamaktadır.</li>
</ul>

<h2 id="kaldirac">Kaldıraçlı işlemlerin riski</h2>
<p>Kaldıraçlı işlemler (forex, CFD ve benzerleri) yatırdığınız tutarın tamamını kaybetmenize yol açabilir. Avrupa'da düzenleyici ESMA'nın 2018 incelemesine göre bireysel CFD hesaplarının %74-89'u para kaybetti. Türkiye'de SPK, 2015'te forex yatırımcılarının yaklaşık %87-88'inin zarar ettiğini açıkladı. Kaybetmeyi göze alamayacağınız parayla işlem yapmayın.</p>

<h2 id="motor">Kalibre Motor'un gerçek hesapta kullanımı</h2>
<p>Kalibre Motor, sizin kurduğunuz kural dosyasını sizin hesabınızda çalıştırır ve emir gönderir. Gerçek hesapta beta aşamasında şu riskler vardır:</p>
<ul>
  <li><b>Yazılım hataları:</b> kural dosyası ya da Motor beklenmeyen bir şekilde davranabilir.</li>
  <li><b>Bağlantı:</b> MetaTrader 5 kapanırsa, bilgisayar uykuya geçerse ya da internet koparsa Motor pozisyonları yönetemez.</li>
  <li><b>Kayma ve boşluklar:</b> hızlı piyasada, haber anlarında ve hafta sonu açılışlarında emirler stop ya da hedef fiyatından farklı gerçekleşebilir.</li>
  <li><b>Kalkan garanti değildir:</b> prop kalkanı ve kayıp sınırları boşluklar, kayma ve aracı kurum kuralları nedeniyle aşılabilir.</li>
</ul>
<p>Bu yüzden Motor gerçek hesapta, eklenti ayarlarında "Gerçek hesapta beta riskini kabul ediyorum" seçeneğini siz işaretlemedikçe ve bir kayıp sınırı (prop kalkanı ya da günlük kayıp sınırı) tanımlı olmadıkça yeni işlem açmaz.</p>

<h2 id="tavsiye">Yatırım tavsiyesi değildir</h2>
<p>Kalibre Markets yatırım danışmanlığı, portföy yöneticiliği ya da aracılık hizmeti sunmaz ve SPK lisanslı bir kurum değildir. Hangi kuralı kuracağınıza, hangi sembolde ne zaman ve ne büyüklükte işlem yapacağınıza siz karar verirsiniz; sonuçların sorumluluğu size aittir. Eğitim örnekleri birer başlangıç noktasıdır, öneri değildir.</p>
<p>Kalibre Markets hiçbir zaman paranızı, menkul kıymetlerinizi veya kripto varlıklarınızı tutmaz, bunlara erişim yetkisi istemez ve sizin adınıza hesap açmaz. Size ait varlıklar yalnızca seçtiğiniz aracı kurumda bulunur.</p>

<h2 id="veri">Veri ve gizlilik</h2>
<p>Köprüden gelen verileriniz uçtan uca şifrelidir; Alpaca ve Tradier verileriniz doğrudan tarayıcınıza gelir. Hangi verinin nerede işlendiği <a href="/gizlilik">Gizlilik Politikası</a>'nda ve <a href="/guvenlik">Güvenlik</a> sayfasında açıklanır.</p>
"""
sayfa("risk-bildirimi/index.html", "Risk bildirimi: Kalibre Lab", "Kalibre Lab beta sürümü, simülasyon sonuçlarının sınırları, kaldıraçlı işlemlerin riski ve Kalibre Motor'un gerçek hesapta kullanımına dair riskler.", "", RISK, icindekiler(RISK))
