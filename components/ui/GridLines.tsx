interface GridLinesProps {
  gridSize?: number;
  className?: string;
}

export function GridLines({ gridSize = 40, className = "" }: GridLinesProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, #111111 1px, transparent 1px),
          linear-gradient(to bottom, #111111 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}
