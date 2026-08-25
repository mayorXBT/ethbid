import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, UUID_RE } from "@/lib/request";
import { settleIfFunded } from "@/lib/settle";
import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = limiter().hit(`bid-get:${clientIp(req)}`, { max: 40, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid bid." }, { status: 400 });
  }
  try {
    const status = await settleIfFunded(id);
    return NextResponse.json({
      bid: status.bid,
      deposits: status.deposits,
      paymentProvider: status.bid.paymentProvider ?? "crossmint",
      paymentUrl: status.bid.paymentUrl ?? null,
      received: status.received,
      settled: status.settled,
      rank: status.activity?.rank ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load bid." }, { status: 404 });
  }
}
