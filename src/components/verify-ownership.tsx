"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount } from "wagmi";
import { useState } from "react";

export type VerifyMethod = "ens" | "domain";
export type VerifyPhase = "idle" | "pending" | "success" | "failed";

export function VerifyOwnership({
  method,
  onMethod,
  ens,
  onEns,
  domain,
  onDomain,
  domainVerified,
  onDomainVerified,
}: {
  method: VerifyMethod;
  onMethod: (method: VerifyMethod) => void;
  ens: string;
  onEns: (value: string) => void;
  domain: string;
  onDomain: (value: string) => void;
  domainVerified: boolean;
  onDomainVerified: (ok: boolean) => void;
}) {
  const { address, isConnected } = useAccount();
  const [phase, setPhase] = useState<VerifyPhase>(domainVerified ? "success" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [txt, setTxt] = useState<string | null>(null);
  const [wellKnown, setWellKnown] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);

  async function issue() {
    setMessage(null);
    onDomainVerified(false);
    if (!isConnected || !address) {
      setPhase("failed");
      setMessage("Connect a wallet first.");
      return;
    }
    setPhase("pending");
    const res = await fetch("/api/ethbid/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain, wallet: address }),
    });
    const data = (await res.json()) as { error?: string; txt?: string; wellKnownPath?: string; wellKnownBody?: string };
    if (!res.ok) {
      setPhase("failed");
      setMessage(data.error ?? "Could not issue a challenge.");
      return;
    }
    setTxt(data.txt ?? null);
    setWellKnown(data.wellKnownPath ?? null);
    setBody(data.wellKnownBody ?? null);
    setMessage("Publish the nonce, then check records. This proves the connected wallet controls the site.");
  }

  async function check() {
    if (!address) {
      setPhase("failed");
      setMessage("Connect a wallet first.");
      return;
    }
    setPhase("pending");
    const res = await fetch("/api/ethbid/challenge/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain, wallet: address }),
    });
    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok || !data.ok) {
      setPhase("failed");
      setMessage(data.error ?? "Domain challenge mismatch. Retry.");
      onDomainVerified(false);
      return;
    }
    setPhase("success");
    setMessage("Domain verified for this wallet. You can bid.");
    onDomainVerified(true);
  }

  return (
    <div className="space-y-3 border border-line bg-panel px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-bid">Ownership</p>
      <p className="text-sm text-muted-foreground">
        Prove you control the product. ENS is the primary path. Domain TXT or /.well-known/ethbid.json is the fallback.
      </p>
      <div className="flex gap-2 text-[11px] uppercase tracking-[0.14em]">
        <button
          type="button"
          className={`border px-2 py-1 ${method === "ens" ? "border-bid text-bid" : "border-line text-muted-foreground"}`}
          onClick={() => onMethod("ens")}
        >
          ENS
        </button>
        <button
          type="button"
          className={`border px-2 py-1 ${method === "domain" ? "border-bid text-bid" : "border-line text-muted-foreground"}`}
          onClick={() => onMethod("domain")}
        >
          Domain
        </button>
      </div>
      {method === "ens" ? (
        <Input
          name="ens"
          value={ens}
          onChange={(e) => onEns(e.target.value)}
          placeholder="ghoste.eth"
          autoComplete="off"
        />
      ) : (
        <div className="space-y-2">
          <Input
            name="domain"
            value={domain}
            onChange={(e) => {
              onDomain(e.target.value);
              onDomainVerified(false);
              setPhase("idle");
            }}
            placeholder="example.xyz"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => void issue()}>
              Issue challenge
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => void check()}>
              Check records
            </Button>
          </div>
          {txt ? <p className="break-all font-mono text-[11px] text-muted-foreground">TXT {txt}</p> : null}
          {wellKnown ? <p className="break-all font-mono text-[11px] text-muted-foreground">{wellKnown}</p> : null}
          {body ? <pre className="overflow-x-auto text-[11px] text-muted-foreground">{body}</pre> : null}
        </div>
      )}
      {phase === "pending" ? <p className="text-xs text-muted-foreground">Pending…</p> : null}
      {phase === "success" ? <p className="text-xs text-bid">{message}</p> : null}
      {phase === "failed" ? (
        <p className="text-xs text-heat">
          {message}{" "}
          <button type="button" className="underline" onClick={() => setPhase("idle")}>
            Retry
          </button>
        </p>
      ) : null}
      {phase === "idle" && message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
