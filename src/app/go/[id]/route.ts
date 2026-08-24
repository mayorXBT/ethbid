import { incrementClicks } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listing = await incrementClicks(id);
  const origin = new URL(req.url).origin;
  if (!listing) return NextResponse.redirect(new URL("/", origin));
  return NextResponse.redirect(listing.url);
}
