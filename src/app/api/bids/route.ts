import { isCategory } from "@/lib/categories";
import { parseUsd } from "@/lib/money";
import { quoteBid } from "@/lib/ranking";
import { createBid, getListingByCanonical, getListings } from "@/lib/store";
import { normalizeTarget } from "@/lib/urls";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });

  const target = normalizeTarget(String(body.target ?? ""));
  if (!target) return NextResponse.json({ error: "Need a real URL or @handle." }, { status: 400 });

  const category = String(body.category ?? "");
  if (!isCategory(category)) {
    return NextResponse.json({ error: "Pick a crypto category." }, { status: 400 });
  }

  const amount = parseUsd(body.amount);
  if (amount == null) {
    return NextResponse.json({ error: "Bid must be a whole USDC amount." }, { status: 400 });
  }

  const listings = await getListings();
  const existing = await getListingByCanonical(target.canonicalKey);
  const quote = quoteBid({ listings, existing, requestedUsd: amount });
  if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 });

  const bid = await createBid({
    id: crypto.randomUUID(),
    listingId: existing?.id ?? null,
    canonicalKey: target.canonicalKey,
    url: target.url,
    category,
    targetBidUsd: quote.targetBidUsd,
    amountDueUsd: quote.amountDueUsd,
    kind: quote.kind,
    status: "pending",
    crossmintOrderId: null,
    depositEvm: null,
    depositSol: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  });

  return NextResponse.json({
    bid,
    quote: {
      projectedRank: quote.projectedRank,
      amountDueUsd: quote.amountDueUsd,
      targetBidUsd: quote.targetBidUsd,
      kind: quote.kind,
    },
  });
}
