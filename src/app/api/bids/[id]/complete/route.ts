import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, UUID_RE } from "@/lib/request";
import { settleIfFunded } from "@/lib/settle";
import { NextResponse } from "next/server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = limiter().hit(`bid-complete:${clientIp(req)}`, { max: 10, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid bid." }, { status: 400 });
  }
  try {
    const status = await settleIfFunded(id);
    if (!status.settled) {
      return NextResponse.json(
        {
          ok: false,
          waiting: true,
          received: status.received,
          due: status.bid.amountDueUsd,
          deposits: status.deposits,
        },
        { status: 202 },
      );
    }
    return NextResponse.json({
      ok: true,
      listingId: status.listing?.id,
      rank: status.activity?.rank,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not settle bid." }, { status: 409 });
  }
}
