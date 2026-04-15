interface SpecLabelProps {
  label: string;
  variant?: "slash" | "bracket" | "plain";
  className?: string;
}

export function SpecLabel({
  label,
  variant = "slash",
  className = "",
}: SpecLabelProps) {
  const formatted =
    variant === "slash"
      ? `// ${label}`
      : variant === "bracket"
        ? `[ ${label} ]`
        : label;

  return (
    <span
      className={`font-display text-2xs font-medium text-fog tracking-[0.15em] uppercase ${className}`}
    >
      {formatted}
    </span>
  );
}
