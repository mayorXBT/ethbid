import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const gate = limiter().hit(`ethbid-challenge-verify:${clientIp(req)}`, { max: 12, windowMs: 15 * 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);
  return NextResponse.json({ error: "Domain challenges are retired." }, { status: 410 });
}
