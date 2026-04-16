from __future__ import annotations

import glob
import math
import os
from typing import Iterable

from PIL import Image

FRAMES_DIR = os.path.join(os.path.dirname(__file__), "..", ".claude-slop-frames")

BODY_A = (197, 122, 93)
BODY_B = (194, 121, 91)
SHADOW_A = (171, 107, 81)
SHADOW_B = (170, 106, 80)
ACCENT = (128, 80, 62)

COLS = 12
ROWS = 8
FPS = 30.0


def dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)


def is_bg(p: tuple[int, int, int]) -> bool:
    r, g, b = p
    # Claude canvas background
    return r <= 18 and g <= 18 and b <= 18


def classify(p: tuple[int, int, int]) -> str:
    if is_bg(p):
        return "."
    r, g, b = p

    # Pure-black eyes (avoid matching background by requiring max RGB == 0)
    if r == 0 and g == 0 and b == 0:
        return "E"

    # Main body terracotta
    if min(dist(p, BODY_A), dist(p, BODY_B), dist(p, (198, 123, 94)), dist(p, (195, 120, 91))) < 18:
        return "X"

    # Side-face / depth shadow
    if min(dist(p, SHADOW_A), dist(p, SHADOW_B), dist(p, (171, 106, 83)), dist(p, (170, 105, 82))) < 20:
        return "o"

    # Small rust / claw edge pixels seen in recording
    if dist(p, ACCENT) < 35 or (110 <= r <= 145 and 60 <= g <= 95 and 45 <= b <= 75):
        return "n"

    # Laptop / silver UI pixels
    if 52 <= r <= 82 and abs(r - g) < 8 and abs(g - b) < 8:
        return "H"  # dark laptop gray
    if 120 <= r <= 150 and abs(r - g) < 12 and abs(g - b) < 12:
        return "G"  # light laptop gray

    # Input bar / other UI greys (exclude from sprite)
    if 25 <= r <= 45 and abs(r - g) < 5 and abs(g - b) < 5:
        return "."

    # Default: drop unknowns (keeps bbox tight on the mascot + laptop only)
    return "."


def tight_bbox(im: Image.Image):
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    anypix = False
    for y in range(h):
        for x in range(w):
            ch = classify(px[x, y])
            if ch != ".":
                anypix = True
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if not anypix:
        return None
    return minx, miny, maxx, maxy


def majority(values: Iterable[str]) -> str:
    counts: dict[str, int] = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    return max(counts.items(), key=lambda kv: kv[1])[0]


def downsample_grid(im: Image.Image, box: tuple[int, int, int, int]) -> list[list[str]]:
    x0, y0, x1, y1 = box
    cw = (x1 - x0 + 1) / COLS
    ch = (y1 - y0 + 1) / ROWS
    px = im.load()
    grid: list[list[str]] = []
    for r in range(ROWS):
        row: list[str] = []
        for c in range(COLS):
            xs = int(x0 + c * cw)
            xe = int(x0 + (c + 1) * cw)
            ys = int(y0 + r * ch)
            ye = int(y0 + (r + 1) * ch)
            cells: list[str] = []
            for y in range(ys, max(ys + 1, ye)):
                for x in range(xs, max(xs + 1, xe)):
                    cells.append(classify(px[x, y]))
            row.append(majority(cells))
        grid.append(row)
    return grid


def format_ts_grid(grid: list[list[str]]) -> str:
    # keep fixed width 12 columns; trim unknown trailing spaces by using full 12 always
    lines = ["".join(row).ljust(COLS, ".")[:COLS] for row in grid]
    return "\n".join(lines)


def main():
    paths = sorted(glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")))
    if not paths:
        raise SystemExit(f"no frames in {FRAMES_DIR}")

    roi = (260, 230, 520, 410)  # loose crop around mascot in claude UI

    grids: list[list[list[str]]] = []
    for p in paths:
        im = Image.open(p).convert("RGB").crop(roi)
        bb = tight_bbox(im)
        if bb is None:
            grids.append([["." * COLS] * ROWS])  # should not happen
            continue
        # padding so motion arcs aren't clipped
        minx, miny, maxx, maxy = bb
        pad = 4
        minx = max(0, minx - pad)
        miny = max(0, miny - pad)
        maxx = min(im.size[0] - 1, maxx + pad)
        maxy = min(im.size[1] - 1, maxy + pad)
        g = downsample_grid(im, (minx, miny, maxx, maxy))
        grids.append(g)

    # Merge consecutive duplicates
    merged: list[tuple[int, list[list[str]]]] = []
    for i, g in enumerate(grids):
        if not merged or g != merged[-1][1]:
            merged.append((1, g))
        else:
            count, prev = merged[-1]
            merged[-1] = (count + 1, prev)

    out_path = os.path.join(os.path.dirname(__file__), "mascot_export_summary.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"frames={len(paths)} segments={len(merged)}\n\n")
        for idx, (count, g) in enumerate(merged):
            ms = int(round(count / FPS * 1000))
            f.write(f"SEG {idx+1} dur_ms={ms} frames={count}\n")
            f.write(format_ts_grid(g))
            f.write("\n\n")

    print(f"Wrote {out_path} ({len(merged)} segments from {len(paths)} frames)")


if __name__ == "__main__":
    main()
