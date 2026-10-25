#!/usr/bin/env python3
"""sitemap.xml üretir. Kullanım: python3 yerel/site-haritasi.py (site kökünden).

Kurallar:
- Yalnız var olan, noindex olmayan sayfalar; vercel.json'da yönlendirilen yollar alınmaz.
- vercel.json trailingSlash:false olduğu için adresler sondaki eğik çizgisiz yazılır
  (canlıda /egitim/ -> /egitim yönlendiriliyor; site haritasında yönlendiren adres olmamalı).
- TR/EN eşleri hreflang ile bağlanır (eşler sayfa-uret.py'deki ESLER ile aynı).
"""
import json, os, re, subprocess, datetime

KOK = 'https://kalibremarkets.com'
DISARI = {'404.html', 'google96988813a828bfb8.html'}
DISARI_DIZIN = ('yeni-ana/', 'static/', 'yerel/', 'test/', 'docs/', 'api/', 'node_modules/', 'lab/')
# Laboratuvarın yalnız giriş sayfası haritada; bağlan/panom gibi uygulama ekranları değil.
EK = ['lab/index.html']
ESLER = {'/': '/en', '/lab': '/en/lab', '/beta': '/en/beta', '/hesap': '/en/license', '/prop': '/en/prop', '/forex': '/en/forex', '/kurulum': '/en/setup',
         '/guvenlik': '/en/security', '/metodoloji': '/en/methodology', '/hakkinda': '/en/about',
         '/pro': '/en/pricing', '/risk-bildirimi': '/en/risk-disclosure',
         '/kullanim-sartlari': '/en/terms', '/gizlilik': '/en/privacy'}
ONCELIK = {'/': '1.0', '/en': '1.0', '/lab': '0.9', '/pro': '0.9', '/en/pricing': '0.9',
           '/prop': '0.8', '/en/prop': '0.8', '/forex': '0.8', '/en/forex': '0.8'}

yonlenen = [r['source'] for r in json.load(open('vercel.json')).get('redirects', [])]
def yonleniyor(yol):
    for k in yonlenen:
        if k.endswith('/:path*') and (yol == k[:-7] or yol.startswith(k[:-7] + '/')): return True
        if yol == k: return True
    return False

def yol_of(f):
    y = '/' + f
    y = y[:-len('index.html')] if y.endswith('index.html') else y[:-5] if y.endswith('.html') else y
    return y.rstrip('/') or '/'

def tarih(f):
    if subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', f]).returncode != 0 or \
       subprocess.run(['git', 'ls-files', '--error-unmatch', f], capture_output=True).returncode != 0:
        return datetime.date.today().isoformat()
    t = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', f], capture_output=True, text=True).stdout.strip()
    return t or datetime.date.today().isoformat()

dosyalar = []
for kok, dizinler, adlar in os.walk('.'):
    for a in adlar:
        if not a.endswith('.html'): continue
        f = os.path.relpath(os.path.join(kok, a), '.')
        if f in DISARI or (f.startswith(DISARI_DIZIN) and f not in EK): continue
        dosyalar.append(f)

kayitlar = {}
for f in sorted(dosyalar):
    s = open(f, encoding='utf-8').read()
    if re.search(r'<meta[^>]+noindex', s, re.I): continue
    y = yol_of(f)
    if yonleniyor(y): continue
    kayitlar[y] = tarih(f)

ters = {v: k for k, v in ESLER.items()}
satir = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
def adres(y): return KOK + ('/' if y == '/' else y)
for y in sorted(kayitlar, key=lambda y: (y.startswith('/en'), y != '/', y)):
    satir.append('  <url>')
    satir.append(f'    <loc>{adres(y)}</loc>')
    satir.append(f'    <lastmod>{kayitlar[y]}</lastmod>')
    tr, en = (y, ESLER.get(y)) if y in ESLER else (ters.get(y), y) if y in ters else (None, None)
    if tr in kayitlar and en in kayitlar:
        satir.append(f'    <xhtml:link rel="alternate" hreflang="tr" href="{adres(tr)}"/>')
        satir.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{adres(en)}"/>')
        satir.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{adres(tr)}"/>')
    satir.append(f'    <priority>{ONCELIK.get(y, "0.6")}</priority>')
    satir.append('  </url>')
satir.append('</urlset>')
open('sitemap.xml', 'w').write('\n'.join(satir) + '\n')
print(f'sitemap.xml: {len(kayitlar)} adres')
