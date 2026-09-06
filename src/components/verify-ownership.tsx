"use client";

import { ensLookupUnread, lookupEns, parseEnsName, walletControlsEns } from "@/lib/ens/verify-ens";
import { classifyTarget, type TargetIdentity } from "@/lib/urls";
import { useAccount, usePublicClient } from "wagmi";
import { useEffect, useState } from "react";

export type VerifyPhase = "idle" | "pending" | "success" | "failed";

export function useTargetVerify(value: string, onDomainVerified: (ok: boolean) => void) {
  const identity = classifyTarget(value);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [phase, setPhase] = useState<VerifyPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [txt, setTxt] = useState<string | null>(null);
  const [wellKnown, setWellKnown] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);

  const showCheck = identity.kind === "ens" || identity.kind === "domain";

  useEffect(() => {
    setPhase("idle");
    setMessage(null);
    setTxt(null);
    setWellKnown(null);
    setBody(null);
    onDomainVerified(false);
  }, [value, onDomainVerified]);

  async function verify() {
    setMessage(null);
    if (!isConnected || !address) {
      setPhase("failed");
      setMessage("Connect a wallet first.");
      return;
    }
    if (identity.kind === "ens") {
      if (!publicClient) {
        setPhase("failed");
        setMessage("Wallet client is not ready.");
        return;
      }
      const ens = parseEnsName(identity.name);
      if (!ens) {
        setPhase("failed");
        setMessage("ENS name not found. Use a name like ghoste.eth.");
        return;
      }
      setPhase("pending");
      const lookup = await lookupEns(publicClient, ens);
      if (!lookup) {
        setPhase("failed");
        setMessage("ENS name not found.");
        return;
      }
      if (ensLookupUnread(lookup)) {
        setPhase("failed");
        setMessage("Could not read that ENS name from Ethereum. Retry.");
        return;
      }
      if (!walletControlsEns(address, lookup)) {
        setPhase("failed");
        setMessage("Connected wallet does not control that ENS identity.");
        return;
      }
      setPhase("success");
      setMessage("ENS verified for this wallet.");
      return;
    }
    if (identity.kind !== "domain") return;
    if (!txt) {
      setPhase("pending");
      onDomainVerified(false);
      const res = await fetch("/api/ethbid/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: identity.host, wallet: address }),
      });
      const data = (await res.json()) as {
        error?: string;
        txt?: string;
        wellKnownPath?: string;
        wellKnownBody?: string;
      };
      if (!res.ok) {
        setPhase("failed");
        setMessage(data.error ?? "Could not issue a challenge.");
        return;
      }
      setTxt(data.txt ?? null);
      setWellKnown(data.wellKnownPath ?? null);
      setBody(data.wellKnownBody ?? null);
      setPhase("idle");
      setMessage("Publish the nonce, then click the check again.");
      return;
    }
    setPhase("pending");
    const res = await fetch("/api/ethbid/challenge/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain: identity.host, wallet: address }),
    });
    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok || !data.ok) {
      setPhase("failed");
      setMessage(data.error ?? "Domain challenge mismatch. Retry.");
      onDomainVerified(false);
      return;
    }
    setPhase("success");
    setMessage("Domain verified for this wallet.");
    onDomainVerified(true);
  }

  return { identity, showCheck, phase, message, txt, wellKnown, body, verify };
}

export function TargetVerifyCheck({
  identity,
  phase,
  onVerify,
}: {
  identity: TargetIdentity;
  phase: VerifyPhase;
  onVerify: () => void;
}) {
  if (identity.kind !== "ens" && identity.kind !== "domain") return null;
  const verified = phase === "success";
  const label =
    identity.kind === "ens"
      ? verified
        ? "ENS verified"
        : "Verify ENS"
      : verified
        ? "Domain verified"
        : "Verify domain";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onVerify}
      className={`absolute left-1.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg ${
        verified ? "text-bid" : phase === "failed" ? "text-heat" : "text-muted-foreground hover:text-bid"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function TargetVerifyStatus({
  identity,
  phase,
  message,
  txt,
  wellKnown,
  body,
  onRetry,
}: {
  identity: TargetIdentity;
  phase: VerifyPhase;
  message: string | null;
  txt: string | null;
  wellKnown: string | null;
  body: string | null;
  onRetry: () => void;
}) {
  if (identity.kind !== "domain" && identity.kind !== "ens") return null;
  const show =
    Boolean(identity.kind === "domain" && (txt || wellKnown || body)) ||
    phase === "pending" ||
    phase === "success" ||
    phase === "failed" ||
    Boolean(phase === "idle" && message);
  if (!show) return null;
  return (
    <div className="space-y-1">
      {identity.kind === "domain" && txt ? (
        <p className="break-all font-mono text-[11px] text-muted-foreground">TXT {txt}</p>
      ) : null}
      {identity.kind === "domain" && wellKnown ? (
        <p className="break-all font-mono text-[11px] text-muted-foreground">{wellKnown}</p>
      ) : null}
      {identity.kind === "domain" && body ? (
        <pre className="overflow-x-auto text-[11px] text-muted-foreground">{body}</pre>
      ) : null}
      {phase === "pending" ? <p className="text-xs text-muted-foreground">Pending…</p> : null}
      {phase === "success" ? <p className="text-xs text-bid">{message}</p> : null}
      {phase === "failed" ? (
        <p className="text-xs text-heat">
          {message}{" "}
          <button type="button" className="underline" onClick={onRetry}>
            Retry
          </button>
        </p>
      ) : null}
      {phase === "idle" && message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
