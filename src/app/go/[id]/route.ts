import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, UUID_RE } from "@/lib/request";
import { incrementClicks } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = limiter().hit(`go:${clientIp(req)}`, { max: 20, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  const { id } = await ctx.params;
  const origin = new URL(req.url).origin;
  if (!UUID_RE.test(id)) return NextResponse.redirect(new URL("/", origin));
  const listing = await incrementClicks(id);
  if (!listing) return NextResponse.redirect(new URL("/", origin));
  return NextResponse.redirect(listing.url);
}
