# Ürün ekran görüntülerinden WebP sürümleri üretir (1x 1440 px, 2x 2880 px).
# Kullanım: python3 yerel/gorsel-uret.py   (cwebp gerekir: brew install webp)
import os, subprocess
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KLASOR = os.path.join(KOK, "static/urun/analytics")
ADLAR = ["hero", "overview", "insights", "prop-limits", "custom-view"]
for ad in ADLAR:
    for ek in ("", "-tr"):
        kaynak = os.path.join(KLASOR, f"{ad}{ek}.png")
        if not os.path.exists(kaynak):
            continue
        for gen, son in ((1440, "1x"), (2880, "2x")):
            hedef = os.path.join(KLASOR, f"{ad}{ek}-{son}.webp")
            subprocess.run(["cwebp", "-quiet", "-q", "78", "-m", "6", "-resize", str(gen), "0", kaynak, "-o", hedef], check=True)
            print(os.path.relpath(hedef, KOK), os.path.getsize(hedef) // 1024, "KB")
