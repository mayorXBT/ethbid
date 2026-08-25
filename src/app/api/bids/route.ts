import { isCategory } from "@/lib/categories";
import { bidsEnabled } from "@/lib/bids-config";
import { parseUsd } from "@/lib/money";
import { limiter, limitResponse } from "@/lib/rate-limit";
import { quoteBid } from "@/lib/ranking";
import { clientIp, readJsonLimited, RequestTooLargeError } from "@/lib/request";
import { createBidBody } from "@/lib/schemas";
import { createBid, getListingByCanonical, getListings } from "@/lib/store";
import { normalizeTarget } from "@/lib/urls";
import { serverEnv } from "@/lib/env";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!bidsEnabled()) {
    return NextResponse.json({ error: "Bidding is coming soon." }, { status: 503 });
  }
  const gate = limiter().hit(`bids:${clientIp(req)}`, { max: 5, windowMs: 15 * 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  try {
    let raw: unknown;
    try {
      raw = await readJsonLimited(req);
    } catch (error) {
      if (error instanceof RequestTooLargeError) {
        return NextResponse.json({ error: "Payload too large." }, { status: 413 });
      }
      throw error;
    }
    if (raw == null) {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }
    const parsed = createBidBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Malformed bid." }, { status: 400 });
    }

    const target = normalizeTarget(parsed.data.target);
    if (!target) return NextResponse.json({ error: "Need a real URL or @handle." }, { status: 400 });

    const category = parsed.data.category;
    if (!isCategory(category)) {
      return NextResponse.json({ error: "Pick a crypto category." }, { status: 400 });
    }

    const amount = parseUsd(parsed.data.amount);
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
      paymentProvider: serverEnv("PAYMENT_PROVIDER") === "moonpay" ? "moonpay" : "crossmint",
      paymentId: null,
      paymentUrl: null,
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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create bid." }, { status: 500 });
  }
}
