from __future__ import annotations

import glob
import math
import os
from typing import Iterable

from PIL import Image

FRAMES_DIR = os.path.join(os.path.dirname(__file__), "..", ".claude-slop-frames")
OUT_TS = os.path.join(
    os.path.dirname(__file__), "..", "components", "ui", "mascot_frames.generated.ts"
)

# Region of interest in full-frame pixel coords (left, top, right, bottom), before bbox_sprite.
# Scaled to each source frame using REF_W × REF_H. Bottom-right crop matches Claude Code’s
# canvas where the crab + laptop sit in typical screen recordings (older clips used top-center).
REF_W, REF_H = 1920, 1080
ROI_REF = (1600, 762, 1920, 1080)

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
    return r <= 18 and g <= 18 and b <= 18


def classify(p: tuple[int, int, int]) -> str:
    if is_bg(p):
        return "."
    r, g, b = p

    if r == 0 and g == 0 and b == 0:
        return "E"

    if (
        min(
            dist(p, BODY_A),
            dist(p, BODY_B),
            dist(p, (198, 123, 94)),
            dist(p, (195, 120, 91)),
            dist(p, (192, 119, 89)),
            dist(p, (193, 118, 89)),
        )
        < 22
    ):
        return "X"

    if (
        min(
            dist(p, SHADOW_A),
            dist(p, SHADOW_B),
            dist(p, (171, 106, 83)),
            dist(p, (170, 105, 82)),
            dist(p, (172, 105, 78)),
        )
        < 22
    ):
        return "o"

    if dist(p, ACCENT) < 35 or (50 <= r <= 95 and 35 <= g <= 70 and 25 <= b <= 55):
        return "n"

    # Laptop / silver UI pixels
    if 52 <= r <= 82 and abs(r - g) < 8 and abs(g - b) < 8:
        return "H"
    if 120 <= r <= 155 and abs(r - g) < 12 and abs(g - b) < 12:
        return "G"

    # Input bar greys
    if 25 <= r <= 45 and abs(r - g) < 5 and abs(g - b) < 5:
        return "."

    return "."


def bbox_for_mask(im: Image.Image, mask_fn) -> tuple[int, int, int, int] | None:
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    anypix = False
    for y in range(h):
        for x in range(w):
            if not mask_fn(px[x, y]):
                continue
            anypix = True
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)
    if not anypix:
        return None
    return minx, miny, maxx, maxy


def bbox_sprite(im: Image.Image) -> tuple[int, int, int, int]:
    px = im.load()

    def core(p):
        ch = classify(p)
        return ch in {"X", "o", "E", "n"}

    bb_core = bbox_for_mask(im, core)
    if bb_core is None:
        return 0, 0, im.size[0] - 1, im.size[1] - 1

    minx, miny, maxx, maxy = bb_core
    pad_x = 20
    pad_y = 18
    minx = max(0, minx - pad_x)
    miny = max(0, miny - pad_y)
    maxx = min(im.size[0] - 1, maxx + pad_x)
    maxy = min(im.size[1] - 1, maxy + pad_y)

    def attach(p):
        ch = classify(p)
        return ch in {"G", "H"}

    bb_att = bbox_for_mask(im, attach)
    if bb_att is not None:
        ax0, ay0, ax1, ay1 = bb_att
        # Only merge attachment if it is "near" the crab horizontally / vertically.
        near = (ax0 <= maxx + 35) and (ax1 >= minx - 35) and (ay0 <= maxy + 40)
        if near:
            minx = max(0, min(minx, ax0 - 6))
            maxx = min(im.size[0] - 1, max(maxx, ax1 + 6))
            maxy = min(im.size[1] - 1, max(maxy, ay1 + 6))
            miny = max(0, min(miny, ay0 - 6))

    return minx, miny, maxx, maxy


def majority(values: Iterable[str]) -> str:
    counts: dict[str, int] = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    # True plurality vote — stray anti-aliased pixels must not override the dominant color.
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


def grid_to_ts_literal(grid: list[list[str]]) -> str:
    lines = ["".join(row).ljust(COLS, ".")[:COLS] for row in grid]
    body = "\\n".join(lines)
    return f"`\\n{body}`"


def grid_is_empty(grid: list[list[str]]) -> bool:
    return all(ch == "." for row in grid for ch in row)


def main():
    paths = sorted(glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")))
    if not paths:
        raise SystemExit(f"no frames in {FRAMES_DIR}")

    sample = Image.open(paths[0]).convert("RGB")
    sw, sh = sample.size
    rx0, ry0, rx1, ry1 = ROI_REF
    roi = (
        int(rx0 * sw / REF_W),
        int(ry0 * sh / REF_H),
        int(rx1 * sw / REF_W),
        int(ry1 * sh / REF_H),
    )

    grids: list[list[list[str]]] = []
    for p in paths:
        im = Image.open(p).convert("RGB").crop(roi)
        bb = bbox_sprite(im)
        g = downsample_grid(im, bb)
        grids.append(g)

    merged: list[tuple[int, list[list[str]]]] = []
    for g in grids:
        if not merged or g != merged[-1][1]:
            merged.append((1, g))
        else:
            merged[-1] = (merged[-1][0] + 1, merged[-1][1])

    while merged and grid_is_empty(merged[0][1]):
        merged.pop(0)
    while merged and grid_is_empty(merged[-1][1]):
        merged.pop()

    lines: list[str] = []
    lines.append("// AUTO-GENERATED by scripts/export_mascot_ts.py — do not hand edit")
    lines.append("export const GENERATED_FRAME_DURATIONS_MS = [")
    for count, grid in merged:
        ms = int(round(count / FPS * 1000))
        lines.append(f"  {ms},")
    lines.append("] as const;")
    lines.append("")
    lines.append("export const GENERATED_FRAME_GRIDS: string[] = [")
    for _, grid in merged:
        rows = ["".join(r).ljust(COLS, ".")[:COLS] for r in grid]
        joined = "\n".join(rows)
        lines.append(f"  `{joined}`,")
    lines.append("];")

    with open(OUT_TS, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Wrote {OUT_TS} ({len(merged)} segments from {len(paths)} frames)")


if __name__ == "__main__":
    main()
