'use client';

import { useEffect, useRef } from 'react';

const COLS = 12;
const ROWS = 8;
const CELL = 10;
const PAD_X = 2; // add horizontal breathing room for throw/typing frames
const PAD_Y = 1; // add vertical breathing room for arc frames
const CANVAS_COLS = COLS + PAD_X * 2;
const CANVAS_ROWS = ROWS + PAD_Y * 2;

const BODY = '#C57A5D';
const SHADOW = '#AB6B51';
const EYE = '#000000';
const ACCENT = '#965E48';
const WORK = '#7D7B79';

// Parse a pixel-art string into a 12×8 number grid.
// '.' = 0 transparent  'X' = 1 body  'o' = 2 shadow
// 'E' = 3 eye  'n' = 4 accent  'G' = 5 gray work element
function g(src: string): number[][] {
  const lines = src.split('\n').filter((l) => /[.XoEnG]/.test(l));
  const indent = Math.min(...lines.map(l => l.search(/\S/)));
  return lines.map(l => {
    const s = l.slice(indent);
    return Array.from({ length: COLS }, (_, i) => {
      if (s[i] === 'X') return 1;
      if (s[i] === 'o') return 2;
      if (s[i] === 'E') return 3;
      if (s[i] === 'n') return 4;
      if (s[i] === 'G') return 5;
      return 0;
    });
  });
}

// ─── Frame data ─────────────────────────────────────────────────────────────
// Claude-style crab sequence: idle -> turn -> throw arc -> work -> turn back -> idle.
// ────────────────────────────────────────────────────────────────────────────
const FRAMES: { dur: number; px: number[][] }[] = [
  // ── Idle: symmetric front-facing crab ────────────────────────────────────
  { dur: 1800, px: g(`
    ..XXXXXXXX..
    ..XEXXXXEX..
    XXXXXXXXXXXX
    XXXXXXXXXXXX
    ..XXXXXXXX..
    ..XXXXXXXX..
    ..X.X..X.X..
    ..X.X..X.X..`) },

  // ── Turn to side view ─────────────────────────────────────────────────────
  { dur: 80, px: g(`
    .XXXXXXXXXX.
    .XXEXXXXEXXX
    .XXXXXXXXXXX
    .XXXXXXXXXXX
    ..XXXXXXXX..
    ..XXXXXXXX..
    ..X.X..X.X..
    ..X.X..X.X..`) },

  { dur: 90, px: g(`
    ..ooXXXXXX..
    ..ooXEXXXEX.
    .ooXXXXXXn..
    .XXXXXXXXX..
    .XXXXXXXXX..
    .XXXXXXXXX..
    .X.X..X.X...
    .X.X..X.X...`) },

  { dur: 100, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEX..
    .ooXXXXXXXn.
    .XXXXXXXXXX.
    .XXXXXXXXXX.
    .XXXXXXXXXX.
    .X.X..X.X...
    .X.X..X.X...`) },

  // ── Throw arc / settle into work state ───────────────────────────────────
  { dur: 120, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEX..
    .ooXXXXXXXnG
    .XXXXXXXXXGG
    .XXXXXXXXGG.
    .XXXXXXXGG..
    .X.X..XG.X..
    .X.X..X.X...`) },

  { dur: 140, px: g(`
    .ooXXXXXXXG.
    .ooXEXXXEGG.
    .ooXXXXXXGG.
    .XXXXXXXXX..
    .XXXXXXXXX..
    .XXXXXXXXX..
    .X.X..X.X...
    .X.X..X.X...`) },

  { dur: 140, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEXG.
    .ooXXXXXXXnG
    .XXXXXXXXXGG
    .XXXXXXXGG..
    .XXXXXXGG...
    .X.X..XG.X..
    .X.X..X.XG..`) },

  // ── Working loop (subtle bobbing) ────────────────────────────────────────
  { dur: 133, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEX..
    .ooXXXXXXXn.
    .XXXXXXXXXG.
    .XXXXXXXXGG.
    .XXXXXXXGG..
    .X.X..XG.X..
    .X.X..X.X...`) },

  { dur: 117, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEX..
    .ooXXXXXXXn.
    .XXXXXXXXGG.
    .XXXXXXXGG..
    .XXXXXXGG...
    .X.X..XG.X..
    .X.X..X.XG..`) },

  { dur: 133, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEX..
    .ooXXXXXXXn.
    .XXXXXXXXXG.
    .XXXXXXXXGG.
    .XXXXXXXGG..
    .X.X..XG.X..
    .X.X..X.X...`) },

  { dur: 117, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEX..
    .ooXXXXXXXn.
    .XXXXXXXXGG.
    .XXXXXXXGG..
    .XXXXXXGG...
    .X.X..XG.X..
    .X.X..X.XG..`) },

  // ── Transition back to front-facing idle ─────────────────────────────────
  { dur: 120, px: g(`
    .ooXXXXXXX..
    .ooXEXXXEX..
    .ooXXXXXXXn.
    .XXXXXXXXXX.
    .XXXXXXXXXX.
    .XXXXXXXXXX.
    .X.X..X.X...
    .X.X..X.X...`) },

  { dur: 120, px: g(`
    ..ooXXXXXX..
    ..ooXEXXXEX.
    .ooXXXXXXn..
    .XXXXXXXXX..
    .XXXXXXXXX..
    .XXXXXXXXX..
    ..X.X..X.X..
    ..X.X..X.X..`) },

  { dur: 100, px: g(`
    .XXXXXXXXXX.
    .XXEXXXXEXXX
    XXXXXXXXXXXX
    XXXXXXXXXXXX
    ..XXXXXXXX..
    ..XXXXXXXX..
    ..X.X..X.X..
    ..X.X..X.X..`) },

  // ── Idle hold before loop restart ────────────────────────────────────────
  { dur: 2500, px: g(`
    ..XXXXXXXX..
    ..XEXXXXEX..
    XXXXXXXXXXXX
    XXXXXXXXXXXX
    ..XXXXXXXX..
    ..XXXXXXXX..
    ..X.X..X.X..
    ..X.X..X.X..`) },
];

// ─── Component ──────────────────────────────────────────────────────────────
export function MascotRobot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    function paint(frameIdx: number) {
      ctx.clearRect(0, 0, CANVAS_COLS * CELL, CANVAS_ROWS * CELL);
      FRAMES[frameIdx].px.forEach((row, r) =>
        row.forEach((v, c) => {
          if (!v) return;
          ctx.fillStyle = v === 1
            ? BODY
            : v === 2
              ? SHADOW
              : v === 3
                ? EYE
                : v === 4
                  ? ACCENT
                  : WORK;
          ctx.fillRect((c + PAD_X) * CELL, (r + PAD_Y) * CELL, CELL, CELL);
        })
      );
    }

    // Reduced-motion: static idle frame, no rAF loop
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(0);
      return;
    }

    let frameIdx = 0;
    let elapsed  = 0;
    let lastTime = performance.now();
    let raf      = 0;

    function tick(now: number) {
      const dt = Math.min(now - lastTime, 100);
      lastTime  = now;
      elapsed  += dt;
      while (elapsed >= FRAMES[frameIdx].dur) {
        elapsed  -= FRAMES[frameIdx].dur;
        frameIdx  = (frameIdx + 1) % FRAMES.length;
      }
      paint(frameIdx);
      raf = requestAnimationFrame(tick);
    }

    paint(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-6 right-6 pointer-events-none select-none"
      style={{ zIndex: 20 }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_COLS * CELL}
        height={CANVAS_ROWS * CELL}
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
