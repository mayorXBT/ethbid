import { recipientFromWebhook, verifyCrossmintSignature } from "@/lib/crossmint";
import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, readTextLimited } from "@/lib/request";
import { getBidByDepositAddress } from "@/lib/store";
import { settleIfFunded } from "@/lib/settle";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const gate = limiter().hit(`webhook:${clientIp(req)}`, { max: 120, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  const raw = await readTextLimited(req, 32_768);
  if (raw == null) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }
  const signature =
    req.headers.get("x-webhook-signature") ?? req.headers.get("x-crossmint-signature");
  const ok = await verifyCrossmintSignature(raw, signature);
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  let event: { type?: string; data?: { recipient?: { address?: string } } };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (event.type === "wallets.transfer.in") {
    const address = recipientFromWebhook(event);
    if (address) {
      const bid = await getBidByDepositAddress(address);
      if (bid) await settleIfFunded(bid.id);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ignored: event.type ?? "unknown" });
}
