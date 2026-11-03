# Vẽ nền rừng từ ảnh cây của Karian-Library (Pine Tree, Large Pine) — rải ngẫu nhiên, cây xa tối hơn
import random, sys
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
L = sys.argv[1]; out = sys.argv[2]
random.seed(7)
W, H = 1920, 1200
bg = Image.new('RGB', (W, H), (38, 82, 44))
# lớp nền: các đốm cỏ tối/ sáng mềm
d = ImageDraw.Draw(bg)
for _ in range(260):
    x, y, r = random.randrange(W), random.randrange(H), random.randint(40, 140)
    c = random.choice([(34, 74, 40), (44, 92, 48), (30, 66, 36), (52, 102, 52)])
    d.ellipse([x - r, y - r * .7, x + r, y + r * .7], fill=c)
bg = bg.filter(ImageFilter.GaussianBlur(18))
trees = [Image.open(f'{L}/Decoration/01 Camping Days/{n}.png').convert('RGBA') for n in ('Pine Tree', 'Large Pine')]
items = []
for _ in range(330):
    t = random.choice(trees)
    s = random.uniform(.38, .72)
    x, y = random.randrange(-120, W), random.randrange(-260, H)
    items.append((y + t.height * s, x, s, t))
items.sort(key=lambda a: a[0])
for base, x, s, t in items:
    im = t.resize((int(t.width * s), int(t.height * s)), Image.LANCZOS)
    depth = min(1, max(0, base / H))
    im = ImageEnhance.Brightness(im).enhance(.62 + .38 * random.uniform(.7, 1) * (.6 + .4 * depth))
    im = ImageEnhance.Color(im).enhance(random.uniform(.85, 1.1))
    bg.paste(im, (x, int(base - im.height)), im)
bg = ImageEnhance.Brightness(bg).enhance(.92)
bg.save(out, 'WEBP', quality=72)
print('ok', out)
