# Tahta kare simgelerine (assets/kare/*.webp) ince krem kontur ekler: koyu temada lacivert dış çizgi zeminle birleşmesin.
# Kontur resme bir kez işlenir; tarayıcıda filtre çalışmaz (CLAUDE.md akıcılık kuralı). Açık temada krem zeminde görünmez.
# Kaynak konturuz resimlerdir (tasks/gorsel-ham/kare/, git geçmişinde c7870dd). İki kez çalıştırılırsa kontur kalınlaşır.
# Kullanım: python tools/kare_kontur.py <kaynak klasör> assets/kare
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter

R = 4  # 256 px'lik resimde kontur kalınlığı (40 px'te ~0,6 px)
COLOR = (255, 250, 240)

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
for f in sorted(src.glob('*.webp')):
    im = Image.open(f).convert('RGBA')
    w, h = im.size
    pad = Image.new('RGBA', (w + 2 * R, h + 2 * R), (0, 0, 0, 0))
    pad.paste(im, (R, R))
    a = pad.getchannel('A')
    grown = a.copy()
    for dx in range(-R, R + 1):
        for dy in range(-R, R + 1):
            if dx * dx + dy * dy <= R * R:
                grown = ImageChops.lighter(grown, ImageChops.offset(a, dx, dy))
    grown = grown.filter(ImageFilter.GaussianBlur(0.6))
    ring = Image.new('RGBA', pad.size, COLOR + (255,))
    ring.putalpha(grown)
    out = Image.alpha_composite(ring, pad)
    # uzun kenar 256 px kalsın
    k = 256 / max(out.size)
    out = out.resize((round(out.width * k), round(out.height * k)), Image.LANCZOS)
    out.save(dst / f.name, 'WEBP', quality=90, method=6)
    print(f.name, out.size)
