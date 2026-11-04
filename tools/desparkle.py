# xoá dấu sao: tạo mặt nạ pixel sáng-ít-màu quanh tâm, rồi lấp bằng cách khuếch tán màu từ viền vào (inpaint đơn giản)
import sys
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); px = im.load()
def fix(cx, cy, R, thr):
    # mặt nạ: pixel sáng hơn trung bình vùng & ít bão hoà
    reg = [(x, y) for y in range(cy - R, cy + R) for x in range(cx - R, cx + R)]
    lum = lambda p: .3 * p[0] + .59 * p[1] + .11 * p[2]
    base = sorted(lum(px[x, y]) for x, y in reg)[len(reg) // 2]
    mask = {(x, y) for x, y in reg if lum(px[x, y]) > base + thr and (max(px[x, y]) - min(px[x, y])) < 95}
    # nới mặt nạ 3px
    grow = set(mask)
    for (x, y) in mask:
        for dx in range(-3, 4):
            for dy in range(-3, 4): grow.add((x + dx, y + dy))
    mask = grow
    for it in range(60):
        nxt = {}
        for (x, y) in mask:
            nb = [px[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2)) if (x + dx, y + dy) not in mask]
            if nb: nxt[(x, y)] = tuple(sum(c[k] for c in nb) // len(nb) for k in range(3))
        for k, v in nxt.items(): px[k] = v
        mask -= set(nxt)
        if not mask: break
    print('fixed', cx, cy, 'left', len(mask))
fix(1707, 1207, 34, 22)
fix(2637, 1421, 70, 30)
im.save(out)
