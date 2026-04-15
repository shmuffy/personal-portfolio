"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const navLinks = [
  { href: "/", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Blog" },
];

function ThreeBars() {
  return (
    <svg
      width="18"
      height="11"
      viewBox="0 0 18 11"
      fill="none"
      aria-hidden="true"
    >
      <rect width="18" height="1" fill="currentColor" />
      <rect y="5" width="18" height="1" fill="currentColor" />
      <rect y="10" width="18" height="1" fill="currentColor" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Close on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav
      className="sticky top-0 z-10 h-12 flex items-center justify-between px-6 md:px-12 border-b border-border-dim"
      style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(8px)" }}
    >
      <Link
        href="/"
        id="nav-logo"
        className="font-display text-sm font-bold text-white tracking-[0.12em]"
      >
        CK
      </Link>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label="Menu"
          className={`flex items-center justify-center w-8 h-8 transition-opacity duration-150 ${
            open ? "text-white opacity-100" : "text-signal opacity-70 hover:opacity-100 hover:text-white"
          }`}
        >
          <ThreeBars />
        </button>

        <div
          className="absolute top-full right-0 mt-2 bg-surface border border-border-active z-20 min-w-36 transition-all duration-200 ease-out"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-6px)",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`block px-5 py-3 font-display text-2xs tracking-[0.12em] uppercase border-b border-border last:border-b-0 transition-colors duration-100 hover:bg-surface-raised ${
                  isActive ? "text-white" : "text-signal hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
