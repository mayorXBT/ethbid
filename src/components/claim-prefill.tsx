"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ClaimPrefill() {
  const params = useSearchParams();
  useEffect(() => {
    const amount = params.get("amount");
    if (!amount) return;
    const input = document.querySelector<HTMLInputElement>('input[name="amount"]');
    if (input) {
      input.value = amount;
      input.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [params]);
  return null;
}
