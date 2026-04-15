import Link from "next/link";
import { CircuitDivider } from "@/components/ui/CircuitDivider";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 md:px-12 pb-8">
      <CircuitDivider className="mb-6" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <span className="font-body text-xs text-fog">
          © {year} Christian Kim
        </span>
        <span className="font-display text-2xs tracking-[0.12em] uppercase text-fog hidden md:block">
          Electrical Design Engineer
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="https://github.com/shmuffy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal transition-colors duration-150"
          >
            GitHub ↗
          </Link>
          <Link
            href="https://linkedin.com/in/christian-kim1"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal transition-colors duration-150"
          >
            LinkedIn ↗
          </Link>
        </div>
      </div>
    </footer>
  );
}
