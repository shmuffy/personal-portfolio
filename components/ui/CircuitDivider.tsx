interface CircuitDividerProps {
  className?: string;
}

export function CircuitDivider({ className = "" }: CircuitDividerProps) {
  return (
    <div className={`relative w-full ${className}`} aria-hidden="true">
      <svg
        width="100%"
        height="8"
        preserveAspectRatio="none"
        viewBox="0 0 100 8"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left tick */}
        <line x1="0" y1="1" x2="0" y2="7" stroke="#1c1c1c" strokeWidth="0.5" />
        {/* Main horizontal trace */}
        <line x1="0" y1="4" x2="100" y2="4" stroke="#1c1c1c" strokeWidth="0.3" />
        {/* Right tick */}
        <line x1="100" y1="1" x2="100" y2="7" stroke="#1c1c1c" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
