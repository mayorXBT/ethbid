import { resolveTxt } from "node:dns/promises";
import {
  consumeIfValid,
  markConsumed,
  matchTxtRecords,
  matchWellKnown,
} from "@/lib/ethbid/domain-challenge";
import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, readJsonLimited, RequestTooLargeError } from "@/lib/request";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const gate = limiter().hit(`ethbid-challenge-verify:${clientIp(req)}`, { max: 12, windowMs: 15 * 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);
  try {
    const raw = await readJsonLimited(req);
    const domain = typeof (raw as { domain?: unknown })?.domain === "string" ? (raw as { domain: string }).domain : "";
    const wallet = typeof (raw as { wallet?: unknown })?.wallet === "string" ? (raw as { wallet: string }).wallet : "";
    const challenge = await consumeIfValid(domain, wallet);

    const wellKnownUrl = `https://${challenge.domain}/.well-known/ethbid.json`;
    let matched = false;
    try {
      const res = await fetch(wellKnownUrl, { redirect: "error", signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json: unknown = await res.json();
        matched = matchWellKnown(json, challenge.wallet, challenge.nonce);
      }
    } catch {
      matched = false;
    }

    if (!matched) {
      try {
        const txt = await resolveTxt(challenge.domain);
        matched = matchTxtRecords(txt, challenge.wallet, challenge.nonce);
      } catch {
        matched = false;
      }
    }

    if (!matched) {
      return NextResponse.json(
        { error: "Domain challenge mismatch. Publish the nonce on DNS TXT or /.well-known/ethbid.json, then retry." },
        { status: 400 },
      );
    }

    await markConsumed(challenge.nonce);
    return NextResponse.json({
      ok: true,
      domain: challenge.domain,
      wallet: challenge.wallet,
    });
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }
    const message = error instanceof Error ? error.message : "Could not verify domain.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
