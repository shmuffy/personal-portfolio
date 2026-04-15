export function ScanlineOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 49,
        pointerEvents: "none",
        background:
          "repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
        opacity: 0.4,
      }}
    />
  );
}
