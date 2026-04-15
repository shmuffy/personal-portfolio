import Link from "next/link";
import { SpecLabel } from "@/components/ui/SpecLabel";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start justify-center min-h-[60vh] px-6 md:px-12 max-w-7xl mx-auto">
      <SpecLabel label="404" className="text-ghost mb-4 text-4xl" />
      <h1 className="font-display text-2xl font-bold text-white tracking-tight mb-3">
        Signal Lost
      </h1>
      <p className="font-body text-sm text-static mb-8">
        No route found at this address.
      </p>
      <Link
        href="/"
        className="font-display text-2xs tracking-[0.15em] uppercase text-signal border border-border px-5 py-3 transition-all duration-150 hover:border-border-active hover:text-white"
      >
        Return Home
      </Link>
    </div>
  );
}
