'use client';

import { useState, useEffect, useRef } from 'react';

/* -------------------------------------------------------
   TIMING (ms) -- matched to reference video within ~100ms
   Adjust these constants to speed up / slow down.
------------------------------------------------------- */

/** Absolute timestamps for each icon appearance (ms from mount) */
const ICON_AT = [650, 775, 1075, 1200, 1500, 2300] as const;

/** When the curtain starts sliding up */
const CURTAIN_AT = 2700;

/** Duration of the curtain slide */
const CURTAIN_DUR = 400;

/* -------------------------------------------------------
   EASING CURVES
------------------------------------------------------- */
const EASE = {
  pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  curtain: 'cubic-bezier(0.76, 0, 0.24, 1)',
  flip: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

/* -------------------------------------------------------
   COLORS -- portfolio palette tokens
------------------------------------------------------- */
const BG = '#e8e8e8'; // --color-white  (splash background)
const FG = '#050505'; // --color-void   (icon fill)

/* -------------------------------------------------------
   SVG GLYPHS -- 40x40, EE-themed, bold geometric
   currentColor = icon fill
   BG const    = cutout fills (match splash background)
------------------------------------------------------- */

function GlyphChip() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="28" height="28" rx="5" fill="currentColor" />
      <rect x="15" y="3" width="10" height="5" rx="2" fill={BG} />
      <circle cx="14" cy="14" r="3" fill={BG} />
    </svg>
  );
}

function GlyphWave() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M2 20c4-16 8-16 12 0s8 16 12 0 8-16 12 0"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function GlyphBolt() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M23 2L11 20h8L15 38 29 20h-8z" fill="currentColor" />
    </svg>
  );
}

function GlyphSpark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 4v12M20 24v12M4 20h12M24 20h12M9 9l8 8M23 23l8 8M31 9l-8 8M17 23l-8 8"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlyphHex() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 4l14 8v16l-14 8-14-8V12l14-8z" fill="currentColor" />
      <circle cx="20" cy="20" r="5.5" fill={BG} />
    </svg>
  );
}

function GlyphScope() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="34" height="28" rx="5" fill="currentColor" />
      <path
        d="M9 24l5-8 4 5 5-10 5 8 3-3"
        stroke={BG}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const GLYPHS = [GlyphChip, GlyphWave, GlyphBolt, GlyphSpark, GlyphHex, GlyphScope];

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

interface FlipData {
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  scale: number;
}

export function LoadingAnimation() {
  const [iconCount, setIconCount] = useState(0);
  const [curtain, setCurtain] = useState(false);
  const [done, setDone] = useState(false);
  const [flipData, setFlipData] = useState<FlipData | null>(null);
  const [flipActive, setFlipActive] = useState(false);
  const firstIconRef = useRef<HTMLDivElement>(null);

  /* -- Main timer orchestration -- */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Schedule each icon pop-in
    ICON_AT.forEach((ms, i) => {
      timers.push(setTimeout(() => setIconCount(i + 1), ms));
    });

    // FLIP: measure first icon + nav logo positions before curtain
    timers.push(
      setTimeout(() => {
        const from = firstIconRef.current?.getBoundingClientRect();
        const to = document.getElementById('nav-logo')?.getBoundingClientRect();
        if (from && to) {
          setFlipData({
            x: from.left,
            y: from.top,
            w: from.width,
            h: from.height,
            dx: to.left + to.width / 2 - (from.left + from.width / 2),
            dy: to.top + to.height / 2 - (from.top + from.height / 2),
            scale: to.height / from.height,
          });
        }
      }, CURTAIN_AT - 50),
    );

    // Start curtain slide
    timers.push(setTimeout(() => setCurtain(true), CURTAIN_AT));

    // Remove overlay after curtain completes
    timers.push(setTimeout(() => setDone(true), CURTAIN_AT + CURTAIN_DUR + 100));

    return () => timers.forEach(clearTimeout);
  }, []);

  /* -- FLIP activation: double-rAF ensures browser paints the
       "from" state before we set the "to" state -- */
  useEffect(() => {
    if (!flipData || flipActive) return;
    let id1: number;
    let id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        setFlipActive(true);
      });
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [flipData, flipActive]);

  /* -- Lock body scroll during animation -- */
  useEffect(() => {
    if (!done) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [done]);

  if (done) return null;

  return (
    <>
      {/* -- Curtain overlay -- */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: curtain ? 'translateY(-100%)' : 'translateY(0)',
          transition: curtain
            ? `transform ${CURTAIN_DUR}ms ${EASE.curtain}`
            : 'none',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            color: FG,
          }}
        >
          {GLYPHS.slice(0, iconCount).map((Glyph, i) => (
            <div
              key={i}
              ref={i === 0 ? firstIconRef : undefined}
              style={{
                animation: `loader-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
              }}
            >
              <Glyph />
            </div>
          ))}
        </div>
      </div>

      {/* -- FLIP clone: first icon flies from center to nav logo -- */}
      {flipData && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            zIndex: 10001,
            left: flipData.x,
            top: flipData.y,
            width: flipData.w,
            height: flipData.h,
            color: FG,
            transform: flipActive
              ? `translate(${flipData.dx}px, ${flipData.dy}px) scale(${flipData.scale})`
              : 'translate(0px, 0px) scale(1)',
            opacity: flipActive ? 0 : 1,
            transition: flipActive
              ? `transform ${CURTAIN_DUR}ms ${EASE.flip}, opacity 150ms ease ${CURTAIN_DUR - 150}ms`
              : 'none',
            pointerEvents: 'none',
            willChange: 'transform, opacity',
          }}
        >
          <GlyphChip />
        </div>
      )}
    </>
  );
}
