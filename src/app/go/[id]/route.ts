import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, isOutboundListingId, publicHttpUrl } from "@/lib/request";
import { getListingById, incrementClicks, listingFromOnchainBoard } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = limiter().hit(`go:${clientIp(req)}`, { max: 20, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  const { id } = await ctx.params;
  const origin = new URL(req.url).origin;
  if (!isOutboundListingId(id)) return NextResponse.redirect(new URL("/", origin));
  const listing = (await getListingById(id)) ?? (await listingFromOnchainBoard(id));
  const target = listing ? publicHttpUrl(listing.url) : null;
  if (!target) return NextResponse.redirect(new URL("/", origin));
  await incrementClicks(listing.id);
  return NextResponse.redirect(target);
}
