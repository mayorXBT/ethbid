import {
  ensureDepositAddresses,
  paymentCovered,
  receivedUsdc,
  sweepToTreasury,
  type DepositAddresses,
} from "./crossmint";
import { fetchSiteMeta } from "./metadata";
import { createMoonPayCharge } from "./moonpay";
import {
  applyPaidBid,
  getBid,
  patchBidDeposits,
  patchBidPayment,
  patchListingMeta,
} from "./store";
import type { ActivityItem, Bid, Listing } from "./types";

export async function prepareDeposit(bid: Bid): Promise<{ bid: Bid; deposits: DepositAddresses }> {
  const deposits = await ensureDepositAddresses(bid);
  let next = bid;
  if (deposits.evm !== bid.depositEvm || deposits.sol !== bid.depositSol) {
    next =
      (await patchBidDeposits(bid.id, {
        depositEvm: deposits.evm,
        depositSol: deposits.sol,
      })) ?? bid;
  }
  return { bid: next, deposits };
}

export async function preparePayment(
  bid: Bid,
): Promise<{ bid: Bid; paymentUrl: string | null; deposits: DepositAddresses | null }> {
  if (bid.paymentProvider === "moonpay") {
    if (bid.paymentUrl) return { bid, paymentUrl: bid.paymentUrl, deposits: null };
    const charge = await createMoonPayCharge(bid);
    const next = await patchBidPayment(bid.id, {
      paymentProvider: "moonpay",
      paymentId: charge.id,
      paymentUrl: charge.pageUrl,
    });
    if (!next) throw new Error("Could not save MoonPay charge.");
    return { bid: next, paymentUrl: charge.pageUrl, deposits: null };
  }

  const prepared = await prepareDeposit(bid);
  return { ...prepared, paymentUrl: null };
}

export async function settlePaidBid(bidId: string): Promise<{
  bid: Bid;
  listing?: Listing;
  activity?: ActivityItem;
}> {
  const bid = await getBid(bidId);
  if (!bid) throw new Error("Unknown bid.");
  const result = await applyPaidBid({ bidId });
  if (result) {
    const meta = await fetchSiteMeta(result.listing.url);
    await patchListingMeta(result.listing.id, {
      name: meta.name || result.listing.name,
      description: meta.description || result.listing.description,
      faviconUrl: meta.faviconUrl,
      ogImageUrl: meta.ogImageUrl,
    });
  }
  return {
    bid: { ...bid, status: "paid", paidAt: bid.paidAt ?? new Date().toISOString() },
    listing: result?.listing,
    activity: result?.activity,
  };
}

export async function settleIfFunded(
  bidId: string,
): Promise<{
  bid: Bid;
  deposits: DepositAddresses | null;
  received: number;
  settled: boolean;
  listing?: Listing;
  activity?: ActivityItem;
}> {
  const bid = await getBid(bidId);
  if (!bid) throw new Error("Unknown bid.");
  if (bid.paymentProvider === "moonpay") {
    return {
      bid,
      deposits: null,
      received: 0,
      settled: bid.status === "paid",
    };
  }
  const { bid: withDeposit, deposits } = await prepareDeposit(bid);
  if (withDeposit.status === "paid") {
    const received = await receivedUsdc(deposits);
    if (paymentCovered(received, withDeposit.amountDueUsd)) {
      const sweep = await sweepToTreasury(deposits, withDeposit.amountDueUsd);
      if (sweep.errors.length > 0) {
        console.error("Treasury sweep retry failed.", sweep.errors);
      }
    }
    return { bid: withDeposit, deposits, received: withDeposit.amountDueUsd, settled: true };
  }
  const received = await receivedUsdc(deposits);
  if (!paymentCovered(received, withDeposit.amountDueUsd)) {
    return { bid: withDeposit, deposits, received, settled: false };
  }
  const result = await applyPaidBid({ bidId: withDeposit.id });
  if (result) {
    const meta = await fetchSiteMeta(result.listing.url);
    await patchListingMeta(result.listing.id, {
      name: meta.name || result.listing.name,
      description: meta.description || result.listing.description,
      faviconUrl: meta.faviconUrl,
      ogImageUrl: meta.ogImageUrl,
    });
    await sweepToTreasury(deposits, withDeposit.amountDueUsd).catch(() => null);
  }
  return {
    bid: { ...withDeposit, status: "paid" },
    deposits,
    received,
    settled: Boolean(result),
    listing: result?.listing,
    activity: result?.activity,
  };
}
