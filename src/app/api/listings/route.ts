import { getBoard } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const board = await getBoard();
    return NextResponse.json(board);
  } catch (error) {
    return NextResponse.json(
      {
        listings: [],
        activity: [],
        stats: { online: 0, visitors: 0, listings: 0, volumeUsd: 0, clicks: 0 },
        topBidUsd: 0,
        error: error instanceof Error ? error.message : "store failed",
      },
      { status: 200 },
    );
  }
}
