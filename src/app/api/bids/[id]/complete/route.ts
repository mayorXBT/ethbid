import { settleIfFunded } from "@/lib/settle";
import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not settle bid." },
      { status: 409 },
    );
  }
}
