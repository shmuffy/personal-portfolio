'use client';

import { useEffect, useRef } from 'react';

// Density palette: void → mass  (two leading spaces bias toward emptiness)
const CHARS = '  .:-=+*#@';

// τ = 2π, φ = golden ratio
const τ = Math.PI * 2;
const φ = (1 + Math.sqrt(5)) / 2;

// Monospace chars are ~2× taller than wide.
// Compress y-coordinates so circular wave-fronts look circular on screen.
const YS = 0.42;

const ROWS = 11;

// Five wave sources orbit the canvas centre.
// Angular velocities are φ-derived irrational numbers → the pattern
// never periodically repeats (quasi-crystalline time structure).
const SOURCES = [
  { r: 0.30, ω:  φ - 1,           k: 2.618, p: 0,                 a: 1.00 },
  { r: 0.38, ω: -(2 - φ),         k: 4.236, p: Math.PI / φ,       a: 0.85 },
  { r: 0.22, ω:  φ / 2,           k: 6.854, p: Math.PI * φ,       a: 0.65 },
  { r: 0.44, ω: -(φ - 1) / 3,     k: 1.618, p: τ / φ,             a: 0.75 },
  { r: 0.16, ω:  (φ * φ) / 4,     k: 9.472, p: Math.PI / (φ * φ), a: 0.45 },
] as const;

/**
 * Three-layer superposition field:
 *
 *  1. Circular interference — φ-frequency orbiting point sources
 *  2. Lissajous cross-term  — horizontal × vertical sinusoid at φ and 1/φ
 *  3. Radial standing wave  — adds structural backbone, prevents flatness
 *
 * tanh soft-clips the sum, emphasising mid-range gradients over peaks.
 */
function fieldValue(nx: number, ny: number, t: number): number {
  let v = 0;

  for (const s of SOURCES) {
    const sx = s.r * Math.cos(s.ω * t + s.p);
    const sy = s.r * Math.sin(s.ω * t + s.p) * YS;
    v += Math.sin(Math.hypot(nx - sx, ny - sy) * s.k * τ - t * 1.1) * s.a;
  }

  // Lissajous: x at φ-frequency × y at 1/φ-frequency — they never lock phase
  v += 0.22 * Math.sin(nx * τ * φ + t * 0.41) * Math.sin((ny / YS) * τ / φ * 1.7 - t * 0.73);

  // Radial standing wave
  v += 0.18 * Math.cos(Math.hypot(nx, ny) * τ * 2.3 - t * 0.29);

  return (Math.tanh(v * 0.48) + 1) / 2;
}

export function AphexField() {
  const preRef = useRef<HTMLPreElement>(null);
  const colsRef = useRef(120);
  const rafRef = useRef<number>(0);
  const t0Ref = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = preRef.current;
    if (!el) return;

    // Recompute column count whenever the element resizes.
    // Geist Mono character width ≈ 0.601 × font-size.
    const measureCols = () => {
      const fs = parseFloat(window.getComputedStyle(el).fontSize);
      const w = el.getBoundingClientRect().width;
      colsRef.current = Math.max(40, Math.floor(w / (fs * 0.601)));
    };

    t0Ref.current = performance.now();
    measureCols();

    const ro = new ResizeObserver(measureCols);
    ro.observe(el);

    const render = () => {
      const t = (performance.now() - t0Ref.current) / 1000;
      const C = colsRef.current;
      const rows: string[] = [];

      for (let r = 0; r < ROWS; r++) {
        let line = '';
        const ny = ((r / (ROWS - 1)) * 2 - 1) * YS;
        for (let c = 0; c < C; c++) {
          const nx = (c / (C - 1)) * 2 - 1;
          const v = fieldValue(nx, ny, t);
          line += CHARS[Math.min(CHARS.length - 1, Math.floor(v * CHARS.length))];
        }
        rows.push(line);
      }

      el.textContent = rows.join('\n');
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <pre
      ref={preRef}
      aria-hidden="true"
      className="w-full select-none overflow-hidden pointer-events-none mb-8"
      style={{
        fontSize: 'clamp(7px, 0.9vw, 10px)',
        lineHeight: 1.45,
        letterSpacing: '0.02em',
        color: 'var(--color-signal)',
        opacity: 0.45,
        // Horizontal fade — anchors the field within the text column
        maskImage:
          'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
      }}
    />
  );
}
