import { settleIfFunded } from "@/lib/settle";
import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const status = await settleIfFunded(id);
    return NextResponse.json({
      bid: status.bid,
      deposits: status.deposits,
      received: status.received,
      settled: status.settled,
      rank: status.activity?.rank ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load bid." },
      { status: 404 },
    );
  }
}
