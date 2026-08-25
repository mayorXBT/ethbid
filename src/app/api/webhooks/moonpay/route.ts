import { moonPayEventDetails, verifyMoonPaySignature } from "@/lib/moonpay";
import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, readTextLimited, UUID_RE } from "@/lib/request";
import { settlePaidBid } from "@/lib/settle";
import { getBid, getBidByPaymentId } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const gate = limiter().hit(`moonpay-webhook:${clientIp(req)}`, { max: 120, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  const raw = await readTextLimited(req, 32_768);
  if (raw == null) return NextResponse.json({ error: "Payload too large." }, { status: 413 });

  const signature = req.headers.get("x-signature");
  if (!(await verifyMoonPaySignature(raw, signature))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const details = moonPayEventDetails(event);
  if (!details || !UUID_RE.test(details.bidId)) return NextResponse.json({ ignored: true });

  const bid = (await getBid(details.bidId)) ?? (await getBidByPaymentId(details.chargeId));
  if (!bid || bid.paymentProvider !== "moonpay") return NextResponse.json({ ignored: true });
  if (bid.paymentId && bid.paymentId !== details.chargeId) return NextResponse.json({ ignored: true });

  const settled = await settlePaidBid(bid.id);
  return NextResponse.json({ ok: true, bidId: settled.bid.id });
}
