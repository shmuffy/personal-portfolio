from __future__ import annotations

import glob
import json
import os
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SRC_GLOB = str(ROOT / ".claude-slop-frames" / "frame_*.png")
OUT_DIR = ROOT / "public" / "mascot" / "frames"
MANIFEST_PATH = OUT_DIR / "manifest.json"

# Active range from source recording where mascot is visible.
START_FRAME = 94
END_FRAME = 371
FPS = 30

# Crop area in full-frame coordinates (2880x1698 recording).
# Tuned to include full crab + laptop typing motion while excluding lower textbox body.
CROP_LEFT = 2520
CROP_TOP = 1385
CROP_RIGHT = 2740
CROP_BOTTOM = 1538

# Background keying thresholds.
HARD_BG_MAX = 20
SOFT_BG_MAX = 40
BOTTOM_UI_CLEANUP_ROWS = 40


def is_mascot_pixel(r: int, g: int, b: int) -> bool:
    if r == 0 and g == 0 and b == 0:
        return True
    # Main terracotta + shadow colors used in the mascot.
    if r > 120 and 55 < g < 170 and 40 < b < 145 and r > g and r > b:
        return True
    # Laptop and typing accessory strokes are neutral greys.
    if 65 <= r <= 190 and abs(r - g) <= 22 and abs(g - b) <= 22:
        return True
    return False


def alpha_for_pixel(r: int, g: int, b: int, y: int, out_h: int) -> int:
    """Map source pixel to alpha, preserving anti-aliased edges."""
    m = max(r, g, b)
    if m <= HARD_BG_MAX:
        return 0
    # Kill the thin bottom UI separator line (neutral gray band near the floor).
    if y >= out_h - 10 and 60 <= r <= 210 and abs(r - g) <= 25 and abs(g - b) <= 25:
        return 0
    # Remove residual bottom overlay text/line while preserving mascot pixels.
    if y >= out_h - BOTTOM_UI_CLEANUP_ROWS and not is_mascot_pixel(r, g, b):
        return 0
    if m >= SOFT_BG_MAX:
        return 255
    # Linear ramp from transparent to opaque in the soft edge band.
    return int(round((m - HARD_BG_MAX) * 255 / (SOFT_BG_MAX - HARD_BG_MAX)))


def export() -> None:
    src_paths = sorted(glob.glob(SRC_GLOB))
    if not src_paths:
        raise SystemExit(f"No source frames found: {SRC_GLOB}")
    if END_FRAME > len(src_paths):
        raise SystemExit(
            f"END_FRAME={END_FRAME} exceeds available source frames={len(src_paths)}",
        )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for existing in OUT_DIR.glob("frame_*.png"):
        existing.unlink()

    frame_paths = src_paths[START_FRAME - 1 : END_FRAME]
    crop_box = (CROP_LEFT, CROP_TOP, CROP_RIGHT + 1, CROP_BOTTOM + 1)
    out_w = CROP_RIGHT - CROP_LEFT + 1
    out_h = CROP_BOTTOM - CROP_TOP + 1

    for idx, src in enumerate(frame_paths, start=1):
        rgb = Image.open(src).convert("RGB").crop(crop_box)
        rgba = Image.new("RGBA", (out_w, out_h))

        src_px = rgb.load()
        dst_px = rgba.load()
        for y in range(out_h):
            for x in range(out_w):
                r, g, b = src_px[x, y]
                a = alpha_for_pixel(r, g, b, y, out_h)
                dst_px[x, y] = (r, g, b, a)

        out_name = OUT_DIR / f"frame_{idx:06d}.png"
        rgba.save(out_name, optimize=True)

    manifest = {
        "fps": FPS,
        "frameCount": len(frame_paths),
        "width": out_w,
        "height": out_h,
        "firstFrame": "/mascot/frames/frame_000001.png",
    }
    with open(MANIFEST_PATH, "w", encoding="utf-8") as fp:
        json.dump(manifest, fp, indent=2)
        fp.write("\n")

    print(f"Exported {len(frame_paths)} frames to {OUT_DIR}")
    print(f"Manifest: {manifest}")


if __name__ == "__main__":
    export()
