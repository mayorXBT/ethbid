"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
