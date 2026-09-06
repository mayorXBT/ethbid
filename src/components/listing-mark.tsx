"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

function glyph(name: string): string {
  const letters = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
  return letters || "·";
}

export function ListingMark({
  src,
  name,
  rank,
  className,
}: {
  src: string | null;
  name: string;
  rank: number;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const size = rank === 1 ? 48 : rank <= 3 ? 44 : 32;
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
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
