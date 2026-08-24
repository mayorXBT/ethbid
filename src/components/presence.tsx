"use client";

import { useEffect } from "react";

export function Presence() {
  useEffect(() => {
    const ping = () => {
      void fetch("/api/presence", { method: "POST" });
    };
    ping();
    const id = setInterval(ping, 25_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
