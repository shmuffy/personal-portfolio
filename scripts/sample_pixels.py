from PIL import Image
import os
BASE = os.path.join(os.path.dirname(__file__), "..", ".claude-slop-frames")
im = Image.open(os.path.join(BASE, "frame_0080.png")).convert("RGB")
for x in range(430, 520, 2):
    p = im.getpixel((x, 300))
    if p[0] > 60 or p[1] > 60:
        print(x, p)
