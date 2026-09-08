import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, publicHttpUrl, UUID_RE } from "@/lib/request";
import { incrementClicks } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = limiter().hit(`go:${clientIp(req)}`, { max: 20, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  const { id } = await ctx.params;
  const origin = new URL(req.url).origin;
  if (!UUID_RE.test(id) || id.length > 36) return NextResponse.redirect(new URL("/", origin));
  const listing = await incrementClicks(id);
  const target = listing ? publicHttpUrl(listing.url) : null;
  if (!target) return NextResponse.redirect(new URL("/", origin));
  return NextResponse.redirect(target);
}
