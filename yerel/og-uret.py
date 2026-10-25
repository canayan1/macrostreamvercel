# Kullanım: python3 yerel/og-uret.py (site kökünden çalıştır)
# Paylaşım görseli (1200x630): koyu mürekkep zemin, rapor serifi başlık, sağda karar notu kartı.
from PIL import Image, ImageDraw, ImageFont
import math, random
W,H=1200,630
im=Image.new('RGB',(W,H),'#0e1724'); d=ImageDraw.Draw(im)
serif=lambda s,i=0: ImageFont.truetype('/System/Library/Fonts/Supplemental/Charter.ttc',s,index=i)
sans=lambda s: ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc',s,index=0)
sansB=lambda s: ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc',s,index=1)
d.text((72,64),'Kalibre',font=serif(40,3),fill='#e7ecf2')
d.text((232,80),'Markets',font=sans(24),fill='#73839a')
y=170
for satir in ['Backtest your','MetaTrader 5','strategies on your','broker\'s data.']:
    d.text((72,y),satir,font=serif(62,0),fill='#e7ecf2'); y+=74
d.text((72,500),'Kalibre Lab: backtesting and risk tools.',font=sans(26),fill='#a3b0c2')
d.text((72,540),'End-to-end encrypted MT5 data.',font=sans(26),fill='#a3b0c2')
# karar notu kartı
x0,y0,x1,y1=700,120,1128,520
d.rounded_rectangle((x0,y0,x1,y1),radius=10,fill='#f4f6f8')
d.text((x0+28,y0+24),'Decision memo',font=serif(30,3),fill='#18222f')
d.line((x0+28,y0+70,x1-28,y0+70),fill='#18222f',width=3)
d.rounded_rectangle((x0+28,y0+88,x0+150,y0+114),radius=4,fill='#f6e7c4')
d.text((x0+38,y0+91),'SYNTHETIC',font=sansB(18),fill='#8a5a00')
d.text((x0+162,y0+91),'sample series',font=sans(18),fill='#5a6878')
# grafik
gx0,gy0,gx1,gy1=x0+28,y0+130,x1-28,y0+290
d.rectangle((gx0,gy0,gx1,gy1),fill='#ffffff',outline='#d9dfe6')
random.seed(7); v=1.0; a=[]; b=[]
for i in range(140):
    v*=1+random.gauss(0.0008,0.012); a.append(v); b.append(v*(1-0.0006*i))
mn,mx=min(a+b),max(a+b)
pt=lambda s: [(gx0+6+i*(gx1-gx0-12)/(len(s)-1), gy1-8-(x-mn)/(mx-mn)*(gy1-gy0-16)) for i,x in enumerate(s)]
d.line(pt(a),fill='#7d8a99',width=2); d.line(pt(b),fill='#1f7a5c',width=3)
satirlar=[('Total return','gross / net'),('Max drawdown','next to return')]
yy=y0+310
for k,v in satirlar:
    d.text((x0+28,yy),k,font=sans(20),fill='#5a6878'); d.text((x1-28,yy),v,font=sans(20),fill='#18222f',anchor='ra')
    yy+=34; d.line((x0+28,yy-6,x1-28,yy-6),fill='#dfe4ea',width=1)
im.save('og-default.png',optimize=True); print('ok')
