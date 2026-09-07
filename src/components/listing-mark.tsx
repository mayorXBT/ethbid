"use client";

import { addressAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

function glyph(name: string): string {
  const letters = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
  return letters || "·";
}

export function ListingMark({
  src,
  owner,
  name,
  rank,
  className,
}: {
  src: string | null;
  owner?: string | null;
  name: string;
  rank: number;
  className: string;
}) {
  const sources = useMemo(() => {
    const next: string[] = [];
    if (src) next.push(src);
    const generated = addressAvatarUrl(owner ?? null);
    if (generated && generated !== src) next.push(generated);
    return next;
  }, [src, owner]);
  const [index, setIndex] = useState(0);
  const size = rank === 1 ? 48 : rank <= 3 ? 44 : 32;
  const current = sources[index];
  if (current) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={current}
        alt=""
        width={size}
        height={size}
        onError={() => setIndex((i) => i + 1)}
        className={cn("mt-0.5 shrink-0 rounded-lg object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "mt-0.5 flex shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold tracking-wide text-bid sm:text-xs",
        className,
      )}
      aria-hidden="true"
    >
      {glyph(name)}
    </div>
  );
}
