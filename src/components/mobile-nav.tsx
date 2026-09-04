"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/rules", label: "Rules" },
  { href: "/about", label: "About" },
  { href: "/verify", label: "Verify" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[80] md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-void/80"
              onClick={() => setOpen(false)}
            />
            <nav className="absolute inset-y-0 right-0 flex w-[min(18rem,86vw)] flex-col border-l border-line bg-background px-5 py-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.22em] text-bid">Menu</p>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center border border-line text-foreground hover:border-bid hover:text-bid"
                  onClick={() => setOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
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
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Wallet</span>
                <WalletButton />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center border border-line text-foreground hover:border-bid hover:text-bid"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {drawer}
    </div>
  );
}
