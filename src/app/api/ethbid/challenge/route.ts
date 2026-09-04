import { issueChallenge, wellKnownBody } from "@/lib/ethbid/domain-challenge";
import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, readJsonLimited, RequestTooLargeError } from "@/lib/request";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const gate = limiter().hit(`ethbid-challenge:${clientIp(req)}`, { max: 8, windowMs: 15 * 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);
  try {
    const raw = await readJsonLimited(req);
    const domain = typeof (raw as { domain?: unknown })?.domain === "string" ? (raw as { domain: string }).domain : "";
    const wallet = typeof (raw as { wallet?: unknown })?.wallet === "string" ? (raw as { wallet: string }).wallet : "";
    const challenge = await issueChallenge(domain, wallet);
    return NextResponse.json({
      domain: challenge.domain,
      nonce: challenge.nonce,
      expiresAt: challenge.expiresAt,
      txt: `ethbid-verify=${challenge.nonce};wallet=${challenge.wallet}`,
      wellKnownPath: `https://${challenge.domain}/.well-known/ethbid.json`,
      wellKnownBody: wellKnownBody(challenge.wallet, challenge.nonce),
    });
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }
    const message = error instanceof Error ? error.message : "Could not issue challenge.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
