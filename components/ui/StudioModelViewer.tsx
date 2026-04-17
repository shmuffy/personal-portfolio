"use client";

import Script from "next/script";
import { createElement, useEffect, useRef } from "react";

const MODEL_VIEWER_SRC =
  "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

interface StudioModelViewerProps {
  src: string;
  alt: string;
  className?: string;
  cameraOrbit?: string;
  rotationPerSecond?: string;
}

// #region agent log
function debugLog(location: string, message: string, data: unknown) {
  try {
    fetch("http://127.0.0.1:7629/ingest/395b46be-14f4-4b2a-913b-1b82b44c9d74", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "bc21d8",
      },
      body: JSON.stringify({
        sessionId: "bc21d8",
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {}
}
// #endregion

export function StudioModelViewer({
  src,
  alt,
  className,
  cameraOrbit = "15deg 70deg 105%",
  rotationPerSecond = "-12deg",
}: StudioModelViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // #region agent log
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const mv = el.querySelector("model-viewer") as HTMLElement | null;
    if (!mv) return;
    const onLoad = () => {
      try {
        type MVMat = {
          name?: string;
          getAlphaMode?: () => string;
          isDoubleSided?: () => boolean;
          getAlphaCutoff?: () => number;
          pbrMetallicRoughness?: {
            baseColorTexture?: unknown;
            baseColorFactor?: number[];
          };
        };
        const model = (mv as unknown as { model?: { materials?: MVMat[] } })
          .model;
        const mats = Array.isArray(model?.materials) ? model!.materials! : [];
        const dump = mats.map((m, i) => {
          let alphaMode: string | undefined;
          let doubleSided: boolean | undefined;
          let alphaCutoff: number | undefined;
          try {
            alphaMode = m.getAlphaMode?.();
          } catch {}
          try {
            doubleSided = m.isDoubleSided?.();
          } catch {}
          try {
            alphaCutoff = m.getAlphaCutoff?.();
          } catch {}
          return {
            i,
            name: m.name,
            alphaMode,
            doubleSided,
            alphaCutoff,
            baseColorFactor: m.pbrMetallicRoughness?.baseColorFactor,
            hasBaseColorTexture: Boolean(m.pbrMetallicRoughness?.baseColorTexture),
          };
        });
        debugLog(
          "StudioModelViewer.tsx:model-viewer:load",
          "silkscreen debug — material dump",
          { hypothesisId: "H6,H7,H8,H9", count: dump.length, materials: dump },
        );
      } catch (e) {
        debugLog("StudioModelViewer.tsx:model-viewer:load", "inspect error", {
          error: String(e),
        });
      }
    };
    mv.addEventListener("load", onLoad);
    return () => mv.removeEventListener("load", onLoad);
  }, []);
  // #endregion

  return (
    <>
      <Script src={MODEL_VIEWER_SRC} type="module" strategy="afterInteractive" />
      <div ref={containerRef} className={className}>
        {createElement("model-viewer", {
          src,
          alt,
          "camera-controls": true,
          "auto-rotate": true,
          "auto-rotate-delay": "0",
          "rotation-per-second": rotationPerSecond,
          "interaction-prompt": "none",
          "touch-action": "pan-y",
          "camera-orbit": cameraOrbit,
          style: {
            width: "100%",
            height: "100%",
            display: "block",
            background: "transparent",
          },
        })}
      </div>
    </>
  );
}
