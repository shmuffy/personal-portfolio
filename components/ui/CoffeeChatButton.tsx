"use client";

import { useState, useEffect, useRef } from "react";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@!?<>[]{}|";

function scramble(text: string): string {
  return text
    .split("")
    .map(() => CHARSET[Math.floor(Math.random() * CHARSET.length)])
    .join("");
}

function DecryptLine({
  text,
  delay = 0,
  active,
  speed = 0.4,
}: {
  text: string;
  delay?: number;
  active: boolean;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState(() => scramble(text));

  useEffect(() => {
    if (!active) return;

    setDisplayed(scramble(text));

    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      let iteration = 0;
      intervalId = setInterval(() => {
        setDisplayed(
          text
            .split("")
            .map((char, i) => {
              if (i < Math.floor(iteration)) return char;
              return CHARSET[Math.floor(Math.random() * CHARSET.length)];
            })
            .join("")
        );
        iteration += speed;
        if (Math.floor(iteration) >= text.length) {
          setDisplayed(text);
          clearInterval(intervalId);
        }
      }, 28);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [active, text, delay, speed]);

  return <span suppressHydrationWarning>{displayed}</span>;
}

const contacts = [
  {
    label: "email",
    display: "robowizardcat@gmail.com",
    href: "mailto:robowizardcat@gmail.com",
    external: false,
    delay: 0,
  },
  {
    label: "linkedin",
    display: "christian-kim1",
    href: "https://linkedin.com/in/christian-kim1",
    external: true,
    delay: 0,
  },
  {
    label: "resume",
    display: "download .pdf",
    href: "/resume.pdf",
    external: true,
    delay: 0,
  },
];

export function CoffeeChatButton() {
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

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`font-display text-2xs tracking-[0.15em] uppercase px-5 py-3 border flex items-center gap-3 transition-all duration-200 ${
          open
            ? "border-border-active text-white"
            : "border-border text-signal hover:border-border-active hover:text-white"
        }`}
      >
        Coffee Chat?
        {/* Three-bar icon */}
        <svg
          width="12"
          height="9"
          viewBox="0 0 12 9"
          fill="none"
          aria-hidden="true"
          className="transition-opacity duration-200"
          style={{ opacity: open ? 0.5 : 1 }}
        >
          <rect width="12" height="1" fill="currentColor" />
          <rect y="4" width="12" height="1" fill="currentColor" />
          <rect y="8" width="12" height="1" fill="currentColor" />
        </svg>
      </button>

      {/* Always rendered — CSS transition handles visibility */}
      <div
        className="absolute top-full left-0 mt-2 bg-surface border border-border-active z-20 min-w-full transition-all duration-200 ease-out"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-6px)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {contacts.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            onClick={() => setOpen(false)}
            className="flex items-baseline gap-5 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface-raised transition-colors duration-100 group"
          >
            <span className="font-display text-2xs tracking-[0.12em] uppercase text-fog group-hover:text-static transition-colors duration-100 w-16 shrink-0">
              {item.label}
            </span>
            <span className="font-body text-xs text-signal group-hover:text-white transition-colors duration-100">
              <DecryptLine
                text={item.display}
                delay={item.delay}
                active={open}
                speed={item.label === "email" ? 0.65 : 0.4}
              />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
