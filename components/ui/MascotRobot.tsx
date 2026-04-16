'use client';

import { useEffect, useRef } from 'react';

const FPS = 30;
const SOURCE_WIDTH = 221;
const SOURCE_HEIGHT = 154;
const DISPLAY_WIDTH = 234;
const DISPLAY_HEIGHT = 163;

export function MascotRobot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let cancelled = false;
    fetch('/mascot/frames/manifest.json')
      .then((r) => r.json() as Promise<{ frameCount: number; fps?: number }>)
      .then((manifest) => {
        const frameCount = manifest.frameCount;
        const fps = manifest.fps ?? FPS;
        const frames = Array.from({ length: frameCount }, (_, i) => {
          const img = new Image();
          img.decoding = 'sync';
          img.src = `/mascot/frames/frame_${String(i + 1).padStart(6, '0')}.png`;
          return img;
        });
        return Promise.all(
          frames.map(
            (img) =>
              new Promise<void>((resolve, reject) => {
                if (img.complete) {
                  resolve();
                  return;
                }
                img.onload = () => resolve();
                img.onerror = () =>
                  reject(new Error(`Failed to load ${img.src}`));
              }),
          ),
        ).then(() => ({ frameCount, fps, frames }));
      })
      .then(({ frameCount, fps, frames }) => {
        if (cancelled) return;
        const frameMs = 1000 / fps;
        const startedAt = performance.now();
        const safeFrameCount =
          Number.isFinite(frameCount) && frameCount > 0
            ? frameCount
            : frames.length;
        let raf = 0;

        const tick = (now: number) => {
          if (cancelled) return;
          const frameIdx =
            safeFrameCount > 0
              ? Math.floor((now - startedAt) / frameMs) % safeFrameCount
              : -1;
          if (!Number.isFinite(frameIdx) || safeFrameCount <= 0) {
            return;
          }
          const frame = frames[frameIdx];
          if (!frame || !frame.complete || frame.naturalWidth === 0) {
            raf = requestAnimationFrame(tick);
            return;
          }
          ctx.clearRect(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
          ctx.drawImage(frame, 0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
          raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      })
      .catch(() => {
        // If frames fail to load, keep the widget invisible rather than broken.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute top-56 right-12 md:right-20 pointer-events-none select-none"
      style={{ zIndex: 20 }}
    >
      <canvas
        ref={canvasRef}
        width={SOURCE_WIDTH}
        height={SOURCE_HEIGHT}
        style={{
          display: 'block',
          width: `${DISPLAY_WIDTH}px`,
          height: `${DISPLAY_HEIGHT}px`,
          imageRendering: 'pixelated',
          filter: 'grayscale(1) contrast(1.05) brightness(0.92)',
        }}
      />
    </div>
  );
}
