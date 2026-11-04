import sys
from PIL import Image, ImageFilter
im = Image.open(sys.argv[1]).convert('RGB')
W, H = im.size
sm = im.filter(ImageFilter.BoxBlur(6))
px = sm.load()
def lum(p): return 0.3*p[0] + 0.59*p[1] + 0.11*p[2]
def transitions(vals, thr=6):
    # tìm điểm đổi màu ô: đạo hàm lớn
    out = []
    for i in range(3, len(vals)-3):
        d = vals[i+3] - vals[i-3]
        if abs(d) > thr and abs(d) >= max(abs(vals[j+3]-vals[j-3]) for j in range(max(3,i-8), min(len(vals)-3,i+9))):
            if not out or i - out[-1] > 40: out.append(i)
    return out
print('size', W, H)
for y in [int(H*f) for f in (0.20, 0.33, 0.46, 0.58, 0.70, 0.82)]:
    vals = [lum(px[x, y]) for x in range(W)]
    print('row y', y, transitions(vals))
for x in [int(W*f) for f in (0.25, 0.4, 0.5, 0.6, 0.75)]:
    vals = [lum(px[x, y]) for y in range(H)]
    print('col x', x, transitions(vals))
