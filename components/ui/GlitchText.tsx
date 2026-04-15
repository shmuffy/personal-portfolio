interface GlitchTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function GlitchText({
  children,
  className = "",
  as: Tag = "span",
}: GlitchTextProps) {
  return (
    <Tag className={`glitch-text ${className}`} data-text={children}>
      {children}
    </Tag>
  );
}
