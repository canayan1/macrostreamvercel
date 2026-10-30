# Kullanım: python3 yerel/og-uret.py (site kökünden çalıştır)
# Paylaşım görseli (1200x630): koyu mürekkep zemin, serif başlık, sağda ürün ekran görüntüsü (sentetik veri).
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
im = Image.new('RGB', (W, H), '#0e1724'); d = ImageDraw.Draw(im)
serif = lambda s, i=0: ImageFont.truetype('/System/Library/Fonts/Supplemental/Charter.ttc', s, index=i)
sans = lambda s: ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', s, index=0)
mono = lambda s: ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', s, index=0)
d.text((64, 56), 'Kalibre', font=serif(38, 3), fill='#e7ecf2')
d.text((214, 70), 'Markets', font=sans(22), fill='#73839a')
y = 168
for satir in ['Analytics for', 'trading data.']:
    d.text((64, y), satir, font=serif(64, 0), fill='#e7ecf2'); y += 76
y += 18
for satir in ['See where an account or desk', 'makes and loses money.', 'Files are processed in your browser.']:
    d.text((64, y), satir, font=sans(25), fill='#a3b0c2'); y += 36
d.rounded_rectangle((64, 548, 132, 578), radius=5, outline='#5fb89a', width=2)
d.text((77, 554), 'BETA', font=mono(16), fill='#5fb89a')
d.text((148, 554), 'Software only. Not investment advice.', font=sans(18), fill='#73839a')
# Ekran görüntüsü: hafif ışık + çerçeve
ek = Image.open('static/urun/analytics/insights.png').convert('RGB')
gen = 548; yuk = int(ek.height * gen / ek.width); kes = min(yuk, 342)
ek = ek.resize((gen, yuk), Image.LANCZOS).crop((0, 0, gen, kes))
x0, y0 = 600, 126
im.paste(ek, (x0, y0))
d.rounded_rectangle((x0 - 2, y0 - 2, x0 + gen + 1, y0 + kes + 1), radius=10, outline='#33465f', width=2)
d.text((x0, y0 + kes + 14), 'SYNTHETIC SAMPLE DATA', font=mono(14), fill='#d9a441')
im.save('og-default.png', optimize=True); print('ok')
