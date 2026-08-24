import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { getBoard } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const gate = limiter().hit(`listings:${clientIp(req)}`, { max: 60, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  try {
    const board = await getBoard();
    return NextResponse.json(board);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        listings: [],
        activity: [],
        stats: { online: 0, visitors: 0, listings: 0, volumeUsd: 0, clicks: 0 },
        topBidUsd: 0,
      },
      { status: 200 },
    );
  }
}
