"use client";

import { useSearchParams } from "next/navigation";

export function PaidFlash() {
  const params = useSearchParams();
  if (params.get("paid") !== "1") return null;
  return (
    <p className="mb-4 border border-bid/40 bg-bid/10 px-3 py-2 font-mono text-xs text-bid">
      Bid confirmed. Rank is the onchain bid. You are on the board.
    </p>
  );
}
