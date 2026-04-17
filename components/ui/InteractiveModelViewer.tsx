"use client";

import Script from "next/script";
import { createElement, useEffect, useState } from "react";

interface InteractiveModelViewerProps {
  src: string;
  alt: string;
  className?: string;
  visibleNodeNames?: string[];
  exposure?: number;
  shadowIntensity?: number;
  environmentImage?: "neutral" | "legacy";
  autoRotate?: boolean;
  cameraOrbit?: string;
  cameraTarget?: string;
  fieldOfView?: string;
  toneMapping?: "commerce" | "aces" | "agx";
  showHint?: boolean;
}

const MODEL_VIEWER_SRC =
  "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

/** model-viewer keeps the Three.js scene in an internal Symbol("scene") property. */
function getInternalModelScene(modelViewer: HTMLElement): {
  model: { traverse: (cb: (obj: ThreeObj) => void) => void };
  updateBoundingBox?: () => void;
  queueRender?: () => void;
} | null {
  const sceneKey = Object.getOwnPropertySymbols(modelViewer).find(
    (sym) => sym.description === "scene",
  );
  if (!sceneKey) {
    return null;
  }
  return (modelViewer as unknown as Record<symbol, unknown>)[sceneKey] as {
    model: { traverse: (cb: (obj: ThreeObj) => void) => void };
    updateBoundingBox?: () => void;
    queueRender?: () => void;
  };
}

type ThreeObj = {
  name: string;
  visible: boolean;
  parent: ThreeObj | null;
  traverse: (cb: (obj: ThreeObj) => void) => void;
  children?: ThreeObj[];
};

function applyVisibleNodes(
  root: ThreeObj,
  visibleNames: Set<string>,
): void {
  root.traverse((obj) => {
    obj.visible = false;
  });

  root.traverse((obj) => {
    if (!visibleNames.has(obj.name)) {
      return;
    }

    let n: ThreeObj | null = obj;
    while (n) {
      n.visible = true;
      if (n === root) {
        break;
      }
      n = n.parent;
    }

    obj.traverse((d) => {
      d.visible = true;
    });
  });
}

export function InteractiveModelViewer({
  src,
  alt,
  className,
  visibleNodeNames,
  exposure = 1.1,
  shadowIntensity = 1,
  environmentImage = "neutral",
  autoRotate = false,
  cameraOrbit,
  cameraTarget,
  fieldOfView,
  toneMapping = "commerce",
  showHint = true,
}: InteractiveModelViewerProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [modelViewerEl, setModelViewerEl] = useState<HTMLElement | null>(null);

  const markInteraction = () => setHasInteracted(true);

  useEffect(() => {
    if (!visibleNodeNames || visibleNodeNames.length === 0 || !modelViewerEl) {
      return;
    }

    const visibleSet = new Set(visibleNodeNames);

    const applyNodeVisibility = () => {
      const modelScene = getInternalModelScene(modelViewerEl);
      const root = modelScene?.model as ThreeObj | undefined;
      if (!modelScene || !root) {
        return;
      }

      applyVisibleNodes(root, visibleSet);
      modelScene.updateBoundingBox?.();
      modelScene.queueRender?.();
    };

    modelViewerEl.addEventListener("load", applyNodeVisibility);
    applyNodeVisibility();

    return () => {
      modelViewerEl.removeEventListener("load", applyNodeVisibility);
    };
  }, [visibleNodeNames, src, modelViewerEl]);

  return (
    <>
      <Script src={MODEL_VIEWER_SRC} type="module" strategy="afterInteractive" />
      <div
        className={`relative ${className ?? ""}`}
        onPointerDown={markInteraction}
      >
        {createElement("model-viewer", {
          src,
          alt,
          ref: setModelViewerEl,
          "camera-controls": true,
          "auto-rotate": autoRotate,
          "touch-action": "none",
          "interaction-prompt": "none",
          "shadow-intensity": String(shadowIntensity),
          "environment-image": environmentImage,
          exposure: String(exposure),
          "camera-orbit": cameraOrbit,
          "camera-target": cameraTarget,
          "field-of-view": fieldOfView,
          "tone-mapping": toneMapping,
          style: {
            width: "100%",
            height: "100%",
          },
        })}
        {showHint && (
          <div
            className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-void/70 px-3 py-1 font-body text-[11px] tracking-wide text-signal/80 transition-opacity duration-300 ${
              hasInteracted ? "opacity-0" : "opacity-100"
            }`}
          >
            Drag to rotate
          </div>
        )}
      </div>
    </>
  );
}
