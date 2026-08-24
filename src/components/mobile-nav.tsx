"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/rules", label: "Rules" },
  { href: "/about", label: "About" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center border border-line text-foreground hover:border-bid hover:text-bid"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-void/70"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 flex h-full w-[min(18rem,86vw)] flex-col gap-1 border-l border-line bg-panel px-5 py-6">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-bid">Menu</p>
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 text-sm uppercase tracking-[0.16em] text-foreground hover:text-bid"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
