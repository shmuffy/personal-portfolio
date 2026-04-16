from __future__ import annotations

import glob
import os
from PIL import Image


BASE = os.path.join(os.path.dirname(__file__), "..", ".claude-slop-frames")


def sprite_mask(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    # near-black background (chat canvas)
    if r < 25 and g < 25 and b < 25:
        return False
    # orange crab body range
    if r > 140 and 80 < g < 180 and 50 < b < 140 and r > g and r > b:
        return True
    # dark terracotta shadow / edge
    if r > 110 and g > 60 and r > g and b < 120 and (r + g + b) > 180 and r < 210 and g < 170:
        return True
    # gray laptop / UI silver
    if 85 <= r <= 160 and 85 <= g <= 160 and 85 <= b <= 160 and max(r, g, b) - min(r, g, b) < 50:
        return True
    # black eyes
    if r < 45 and g < 45 and b < 45 and (r + g + b) > 10:
        return True
    return False


def bbox_for(im: Image.Image):
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    count = 0
    for y in range(h):
        for x in range(w):
            if sprite_mask(px[x, y]):
                count += 1
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if count == 0:
        return None
    return minx, miny, maxx, maxy, count


def main():
    paths = sorted(glob.glob(os.path.join(BASE, "frame_*.png")))
    samples = [1, 40, 80, 120, 150, 200, 250, len(paths)]
    for idx in samples:
        if idx < 1 or idx > len(paths):
            continue
        p = paths[idx - 1]
        im = Image.open(p).convert("RGB")
        bb = bbox_for(im)
        print(os.path.basename(p), bb)


if __name__ == "__main__":
    main()
