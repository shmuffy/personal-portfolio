'use client';

import { useEffect, useRef } from 'react';

const FPS = 30;
const SOURCE_WIDTH = 311;
const SOURCE_HEIGHT = 239;
const DISPLAY_WIDTH = 330;
const DISPLAY_HEIGHT = 254;

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
        let raf = 0;

        const tick = (now: number) => {
          if (cancelled) return;
          const frameIdx = Math.floor((now - startedAt) / frameMs) % frameCount;
          ctx.clearRect(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
          ctx.drawImage(frames[frameIdx]!, 0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
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
      className="fixed bottom-6 right-6 pointer-events-none select-none"
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
        }}
      />
    </div>
  );
}
