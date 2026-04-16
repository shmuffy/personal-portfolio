'use client';

import { useEffect, useRef, useState } from 'react';

const ASCII_DENSITY =
  " .'^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

const TAU = Math.PI * 2;
const EPS = 1e-6;

const FONT_SIZE = 10;
const CHAR_W = 6;
const CHAR_H = 11;
const MAX_CELLS = 3200;
const TRAIL_SIZE = 96;
const TARGET_FPS = 24;
const FRAME_MS = 1000 / TARGET_FPS;
const MIN_DRAW_INDEX = 6;

const PALETTE_HUES = [182, 282, 128] as const;

type Point = { x: number; y: number };

type AttractorState = {
  x: number;
  y: number;
  z: number;
  w: number;
};

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Hyper-Lorenz-inspired 4D strange attractor.
 *
 * The added w-axis couples into x/y/z, creating richer phase-space folding
 * than classical 3D Lorenz and producing better projected structures for ASCII mapping.
 */
function stepAttractor(state: AttractorState, dt: number): AttractorState {
  const sigma = 11.2;
  const rho = 30.4;
  const beta = 2.72;
  const gamma = 0.68;

  const dx = sigma * (state.y - state.x) + 0.42 * state.w;
  const dy = state.x * (rho - state.z) - state.y + 0.11 * state.w;
  const dz = state.x * state.y - beta * state.z + 0.2 * state.w;
  const dw = -gamma * state.w + 0.045 * state.x * state.z - 0.018 * state.y * state.y;

  return {
    x: state.x + dx * dt,
    y: state.y + dy * dt,
    z: state.z + dz * dt,
    w: state.w + dw * dt,
  };
}

function spectralBands(freq: Uint8Array): { bass: number; treble: number; energy: number } {
  if (freq.length === 0) {
    return { bass: 0, treble: 0, energy: 0 };
  }

  let bassSum = 0;
  let trebleSum = 0;
  let fullSum = 0;

  const bassEnd = Math.min(16, freq.length);
  const trebleStart = Math.min(80, freq.length - 1);

  for (let i = 0; i < freq.length; i++) {
    fullSum += freq[i]!;
    if (i < bassEnd) bassSum += freq[i]!;
    if (i >= trebleStart) trebleSum += freq[i]!;
  }

  return {
    bass: bassSum / (bassEnd * 255),
    treble: trebleSum / ((freq.length - trebleStart) * 255),
    energy: fullSum / (freq.length * 255),
  };
}

function pickHue(phase: number, energy: number): number {
  const t = (Math.sin(phase * 0.9 + energy * 3.2) + 1) * 0.5;
  const u = (Math.sin(phase * 0.47 + 1.2) + 1) * 0.5;

  const a = PALETTE_HUES[0] * (1 - t) + PALETTE_HUES[1] * t;
  const b = PALETTE_HUES[1] * (1 - u) + PALETTE_HUES[2] * u;
  return (a * 0.58 + b * 0.42 + 360) % 360;
}

export function AphexField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const t0Ref = useRef(0);
  const lastFrameRef = useRef(0);

  const gridRef = useRef({ cols: 80, rows: 20, width: 0, height: 0 });

  const stateRef = useRef<AttractorState>({ x: 0.14, y: 0.01, z: -0.08, w: 0.22 });
  const trailRef = useRef<Point[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const fftRef = useRef<Uint8Array | null>(null);

  const [audioReady, setAudioReady] = useState(false);
  const [audioStarting, setAudioStarting] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 1.25));

    const resize = () => {
      const bounds = wrapper.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(120, Math.floor(bounds.width * 0.26));

      const colsRaw = Math.max(40, Math.floor(width / (CHAR_W * 1.18)));
      const rowsRaw = Math.max(8, Math.floor(height / (CHAR_H * 1.18)));

      let cols = colsRaw;
      let rows = rowsRaw;

      if (cols * rows > MAX_CELLS) {
        const ratio = Math.sqrt(MAX_CELLS / (cols * rows));
        cols = Math.max(40, Math.floor(cols * ratio));
        rows = Math.max(8, Math.floor(rows * ratio));
      }

      gridRef.current = { cols, rows, width: cols * CHAR_W, height: rows * CHAR_H };

      canvas.width = Math.floor(gridRef.current.width * dpr);
      canvas.height = Math.floor(gridRef.current.height * dpr);
      canvas.style.width = `${gridRef.current.width}px`;
      canvas.style.height = `${gridRef.current.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = 'top';
      ctx.font = `${FONT_SIZE}px PerfectDOSVGA437, monospace`;
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    roRef.current = ro;

    t0Ref.current = performance.now();
    lastFrameRef.current = 0;

    const render = (now: number) => {
      if (now - lastFrameRef.current < FRAME_MS) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameRef.current = now;

      const t = (now - t0Ref.current) * 0.001;

      const analyser = analyserRef.current;
      if (analyser && fftRef.current) {
        analyser.getByteFrequencyData(fftRef.current);
      }

      const { bass, treble, energy } = spectralBands(fftRef.current ?? new Uint8Array(0));

      // Bass drives scale/gravity, treble drives dt + wave frequency.
      const dt = 0.003 + treble * 0.007;
      const waveFrequency = 5.4 + treble * 5.2;
      const gravity = 0.024 + bass * 0.24;

      for (let i = 0; i < 2; i++) {
        stateRef.current = stepAttractor(stateRef.current, dt);
      }

      const sx = stateRef.current.x * 0.03 + stateRef.current.z * 0.011;
      const sy = stateRef.current.y * 0.024 + stateRef.current.w * 0.013;
      trailRef.current.push({ x: sx, y: sy });
      if (trailRef.current.length > TRAIL_SIZE) {
        trailRef.current.shift();
      }

      const trail = trailRef.current;
      const trailStep = Math.max(1, Math.floor(trail.length / 8));

      const { cols, rows, width, height } = gridRef.current;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${FONT_SIZE}px PerfectDOSVGA437, monospace`;
      ctx.textBaseline = 'top';

      const aspect = rows / cols;
      const enableGlow = energy > 0.08;

      for (let r = 0; r < rows; r++) {
        const yn = (r / Math.max(1, rows - 1)) * 2 - 1;
        const yCanvas = r * CHAR_H;

        for (let c = 0; c < cols; c++) {
          const xn = (c / Math.max(1, cols - 1)) * 2 - 1;
          const xCanvas = c * CHAR_W;

          const swirl = Math.sin(t * 0.35 + yn * 3.8) * gravity;
          const pinch = Math.cos(t * 0.28 + xn * 4.6) * gravity * 0.75;
          const fx = xn + swirl * yn;
          const fy = yn * aspect - pinch * xn;

          let attractorInterference = 0;
          for (let i = 0; i < trail.length; i += trailStep) {
            const p = trail[i]!;
            const dx = fx - p.x;
            const dy = fy - p.y;
            const d = Math.sqrt(dx * dx + dy * dy) + EPS;
            attractorInterference += Math.sin(d * waveFrequency * TAU - t * (1.6 + treble * 6.0));
          }

          const moireA = Math.sin((fx * 7.5 + fy * 4.2) * TAU + t * (0.9 + treble * 2.1));
          const moireB = Math.sin((fx * -5.4 + fy * 8.6) * TAU - t * (1.15 + treble * 3.2));
          const radial = Math.cos(Math.sqrt(fx * fx + fy * fy) * TAU * (3.1 + bass * 2.8) - t * 1.45);

          const field = Math.tanh(attractorInterference * 0.12 + moireA * moireB * 0.85 + radial * 0.56);
          const density = clamp01((field + 1) * 0.5);

          const idx = Math.min(
            ASCII_DENSITY.length - 1,
            Math.floor(density * ASCII_DENSITY.length),
          );
          if (idx < MIN_DRAW_INDEX) {
            continue;
          }
          const ch = ASCII_DENSITY[idx]!;

          const phase = t * 0.7 + fx * 2.2 + fy * 1.8 + density * 1.3;
          const hue = pickHue(phase, energy);
          const sat = 72 + energy * 24;
          const lum = 36 + smoothstep(0.1, 0.95, density) * 36;

          ctx.shadowBlur = enableGlow ? 1.5 + energy * 2.5 : 0;
          ctx.shadowColor = enableGlow
            ? `hsla(${hue}, ${sat}%, ${lum}%, 0.35)`
            : 'transparent';
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
          ctx.fillText(ch, xCanvas, yCanvas);
        }
      }

      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      roRef.current?.disconnect();
      roRef.current = null;

      if (micStreamRef.current) {
        for (const track of micStreamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // ignore shutdown race
        });
      }
    };
  }, []);

  const startAudio = async () => {
    if (audioReady || audioStarting) return;

    setAudioStarting(true);
    setAudioError(null);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      if (stream.getAudioTracks().length === 0) {
        throw new Error('No shared audio track available.');
      }

      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) {
        throw new Error('AudioContext is not available in this browser.');
      }

      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      micStreamRef.current = stream;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      fftRef.current = new Uint8Array(analyser.frequencyBinCount);

      setAudioReady(true);
    } catch {
      setAudioError('Share a browser tab or system audio with sound enabled to drive the field.');
    } finally {
      setAudioStarting(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full mb-8 select-none"
      style={{
        isolation: 'isolate',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block w-full"
        style={{
          background: '#000000',
          imageRendering: 'pixelated',
          border: '1px solid rgba(120, 120, 120, 0.12)',
          boxShadow:
            'inset 0 0 22px rgba(0, 160, 200, 0.08), inset 0 0 44px rgba(120, 0, 160, 0.07)',
          maskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
        }}
      />

      {!audioReady && (
        <button
          type="button"
          onClick={startAudio}
          className="absolute inset-0 flex items-center justify-center font-body text-xs md:text-sm text-white/80"
          style={{
            background:
              'radial-gradient(circle at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.82) 72%)',
            textShadow:
              '0 0 6px rgba(20, 220, 255, 0.8), 0 0 18px rgba(186, 80, 255, 0.5)',
            letterSpacing: '0.06em',
          }}
          disabled={audioStarting}
        >
          {audioStarting ? 'WAITING FOR SHARED AUDIO...' : 'SHARE TAB OR SYSTEM AUDIO'}
        </button>
      )}

      {audioError && (
        <div className="mt-2 font-body text-2xs text-fog tracking-wide">
          {audioError}
        </div>
      )}
    </div>
  );
}
