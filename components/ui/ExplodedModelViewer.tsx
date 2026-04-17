"use client";

import Script from "next/script";
import * as THREE from "three";
import { createElement, useEffect, useRef, useState } from "react";

const MODEL_VIEWER_SRC =
  "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

/** One shared timeline for every housing part */
const EXPLODE_MS = 1200;
/** Fade begins while motion is still finishing (overlap) */
const FADE_START_AT_MS = 900;
const FADE_MS = 700;

const KNOWN_PART_NAMES = new Set([
  "Heatsink",
  "Fan_Enclosure",
  "Fan_Blades",
  "PCB",
  "Bottom-Body",
  "Side Enclosure [Left]",
  "Side Enclosure [Right]",
  /** GLB export variant (see asset) */
  "Side_Enclosure_Left",
  "Side_Enclosure_Right",
  "Top-Lid",
]);

function getInternalModelScene(modelViewer: HTMLElement): {
  model: THREE.Object3D;
  updateBoundingBox: () => void;
  queueRender: () => void;
} | null {
  const sceneKey = Object.getOwnPropertySymbols(modelViewer).find(
    (sym) => sym.description === "scene",
  );
  if (!sceneKey) {
    return null;
  }
  return (modelViewer as unknown as Record<symbol, unknown>)[sceneKey] as {
    model: THREE.Object3D;
    updateBoundingBox: () => void;
    queueRender: () => void;
  };
}

function enhancePcbHighlight(pcbRoot: THREE.Object3D): void {
  pcbRoot.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const next = mats.map((raw) => {
      const m = raw.clone();
      if (
        m instanceof THREE.MeshStandardMaterial ||
        m instanceof THREE.MeshPhysicalMaterial
      ) {
        m.emissive = m.emissive?.clone() ?? new THREE.Color(0x112211);
        m.emissiveIntensity = Math.max(0.45, m.emissiveIntensity ?? 0) + 0.55;
      }
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}

/** Strong ease-in: nearly still early, then explosive finish */
function blastEase(t: number): number {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  return 2 ** (10 * (t - 1));
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - 2 ** (-12 * t);
}

function collectNamedParts(root: THREE.Object3D): Map<string, THREE.Object3D> {
  const map = new Map<string, THREE.Object3D>();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!obj.name) {
      return;
    }
    const t = obj.name.trim();
    if (KNOWN_PART_NAMES.has(t) && !map.has(t)) {
      map.set(t, obj);
    }
  });
  return map;
}

function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      meshes.push(child as THREE.Mesh);
    }
  });
  return meshes;
}

function cloneMaterialsForFade(mesh: THREE.Mesh): THREE.Material[] {
  const mats = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];
  const cloned = mats.map((m) => m.clone());
  mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
  return cloned;
}

export interface ExplodedModelViewerProps {
  src: string;
  alt: string;
  focusNodeName: string;
  /** Scale factor × model largest AABB dimension (radial distance) */
  explodeDistance?: number;
  fadedOpacity?: number;
  className?: string;
}

type BurstPart = {
  obj: THREE.Object3D;
  initialWorldPos: THREE.Vector3;
  explodeWorld: THREE.Vector3;
  initialQuat: THREE.Quaternion;
};

export function ExplodedModelViewer({
  src,
  alt,
  focusNodeName,
  explodeDistance = 1.65,
  fadedOpacity = 0.04,
  className,
}: ExplodedModelViewerProps) {
  const [modelViewerEl, setModelViewerEl] = useState<HTMLElement | null>(null);
  const [hintHidden, setHintHidden] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!modelViewerEl) {
      return;
    }

    const onLoad = () => {
      if (startedRef.current) {
        return;
      }

      const modelScene = getInternalModelScene(modelViewerEl);
      const root = modelScene?.model;
      if (!modelScene || !root) {
        return;
      }

      startedRef.current = true;

      modelScene.updateBoundingBox();

      const parts = collectNamedParts(root);

      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);
      const scaleLen = Math.max(size.x, size.y, size.z, 1e-6);

      const pcbRootForCenter = parts.get(focusNodeName);
      const pcbCenter = new THREE.Vector3();
      if (pcbRootForCenter) {
        pcbRootForCenter.updateMatrixWorld(true);
        enhancePcbHighlight(pcbRootForCenter);
        new THREE.Box3().setFromObject(pcbRootForCenter).getCenter(pcbCenter);
      }

      const radialMag = scaleLen * explodeDistance;
      const burstPartsFixed: BurstPart[] = [];

      for (const [name, obj] of parts) {
        if (name === focusNodeName) {
          continue;
        }

        obj.updateMatrixWorld(true);
        const initialQuat = obj.quaternion.clone();

        const initialWorldPos = new THREE.Vector3();
        obj.getWorldPosition(initialWorldPos);

        const partBox = new THREE.Box3().setFromObject(obj);
        const partCenter = new THREE.Vector3();
        partBox.getCenter(partCenter);

        const radial = new THREE.Vector3().subVectors(partCenter, pcbCenter);
        if (radial.lengthSq() < 1e-10) {
          radial.set(0, 1, 0);
        } else {
          radial.normalize();
        }

        const explodeWorld = radial.multiplyScalar(radialMag);

        burstPartsFixed.push({
          obj,
          initialWorldPos,
          explodeWorld,
          initialQuat,
        });
      }

      const pcbRoot = parts.get(focusNodeName);
      const fadeMeshes = collectMeshes(root).filter((m) => {
        let p: THREE.Object3D | null = m;
        while (p) {
          if (pcbRoot && p === pcbRoot) {
            return false;
          }
          p = p.parent;
        }
        return true;
      });

      type FadeRec = {
        mat: THREE.Material;
        startOpacity: number;
        startColor: THREE.Color | null;
        gray: THREE.Color;
      };
      const fadeRecords: FadeRec[] = [];

      const gray = new THREE.Color(0x444444);
      let phase2Prep = false;

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;

        const linearT = Math.max(0, Math.min(1, elapsed / EXPLODE_MS));
        const blastT = blastEase(linearT);

        for (const part of burstPartsFixed) {
          const displacement = part.explodeWorld.clone().multiplyScalar(blastT);
          const targetWorld = part.initialWorldPos.clone().add(displacement);
          const parent = part.obj.parent;
          if (parent) {
            parent.updateMatrixWorld(true);
            const local = targetWorld.clone();
            parent.worldToLocal(local);
            part.obj.position.copy(local);
          }
          part.obj.quaternion.copy(part.initialQuat);
        }

        const fadeElapsed = elapsed - FADE_START_AT_MS;
        if (fadeElapsed >= 0 && fadeElapsed <= FADE_MS) {
          if (!phase2Prep) {
            phase2Prep = true;
            for (const mesh of fadeMeshes) {
              const mats = cloneMaterialsForFade(mesh);
              for (const rawMat of mats) {
                const mat = rawMat;
                mat.transparent = true;
                const startOpacity =
                  typeof mat.opacity === "number" ? mat.opacity : 1;
                const startColor =
                  "color" in mat && mat.color instanceof THREE.Color
                    ? mat.color.clone()
                    : null;
                fadeRecords.push({
                  mat,
                  startOpacity,
                  startColor,
                  gray,
                });
              }
            }
          }

          const ft = Math.max(0, Math.min(1, fadeElapsed / FADE_MS));
          const fadeEase = easeOutExpo(ft);
          for (const rec of fadeRecords) {
            rec.mat.opacity =
              rec.startOpacity * (1 - fadeEase) + fadedOpacity * fadeEase;
            if (
              rec.startColor &&
              "color" in rec.mat &&
              rec.mat.color instanceof THREE.Color
            ) {
              rec.mat.color.copy(rec.startColor).lerp(rec.gray, fadeEase);
            }
          }
        }

        modelScene.updateBoundingBox();
        modelScene.queueRender();

        const timelineEnd = Math.max(
          EXPLODE_MS,
          FADE_START_AT_MS + FADE_MS,
        );
        if (elapsed < timelineEnd) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    modelViewerEl.addEventListener("load", onLoad);
    queueMicrotask(() => {
      const loaded = (modelViewerEl as unknown as { loaded?: boolean }).loaded;
      if (loaded) {
        onLoad();
      }
    });

    return () => {
      modelViewerEl.removeEventListener("load", onLoad);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      startedRef.current = false;
    };
  }, [modelViewerEl, src, focusNodeName, explodeDistance, fadedOpacity]);

  return (
    <>
      <Script src={MODEL_VIEWER_SRC} type="module" strategy="afterInteractive" />
      <div
        className={`relative h-full min-h-0 w-full ${className ?? ""}`}
        onPointerDown={() => setHintHidden(true)}
      >
        {createElement("model-viewer", {
          src,
          alt,
          ref: setModelViewerEl,
          "camera-controls": true,
          "touch-action": "none",
          "interaction-prompt": "none",
          "shadow-intensity": "1",
          "environment-image": "neutral",
          exposure: "1.1",
          style: {
            display: "block",
            width: "100%",
            height: "100%",
          },
        })}
        <div
          className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-void/70 px-3 py-1 font-body text-[11px] tracking-wide text-signal/80 transition-opacity duration-300 ${
            hintHidden ? "opacity-0" : "opacity-100"
          }`}
        >
          Drag to rotate
        </div>
      </div>
    </>
  );
}
