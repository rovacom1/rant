# Ham kart görsellerini (tasks/gorsel-ham) oyuna uygun boyuta getirir: assets/kart/<id>.jpg
# Kullanım: python tools/kart_gorsel_hazirla.py
import glob, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tasks', 'gorsel-ham')
OUT = os.path.join(ROOT, 'assets', 'kart')
os.makedirs(OUT, exist_ok=True)
for f in sorted(glob.glob(os.path.join(SRC, '*.jpg'))):
    name = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert('RGB')
    if name == 'arka':
        w, h = im.size  # kart arkası dikey (5:7) kırpılır
        cw = int(h * 5 / 7)
        im = im.crop(((w - cw) // 2, 0, (w + cw) // 2, h)).resize((250, 350), Image.LANCZOS)
    else:
        im = im.resize((360, 360), Image.LANCZOS)
    out = os.path.join(OUT, f'{name}.jpg')
    im.save(out, 'JPEG', quality=80, optimize=True, progressive=True)
    print(name, os.path.getsize(out))
