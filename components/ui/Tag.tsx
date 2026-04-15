interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <span className="inline-block font-body text-2xs font-medium text-fog tracking-[0.1em] uppercase px-2 py-0.5 bg-surface border border-border transition-colors duration-150 hover:border-border-active hover:text-signal">
      {label}
    </span>
  );
}
