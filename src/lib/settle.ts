import {
  ensureDepositAddresses,
  paymentCovered,
  receivedUsdc,
  sweepToTreasury,
  type DepositAddresses,
} from "./crossmint";
import { fetchSiteMeta } from "./metadata";
import { applyPaidBid, getBid, patchBidDeposits, patchListingMeta } from "./store";
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

export async function settleIfFunded(
  bidId: string,
): Promise<{
  bid: Bid;
  deposits: DepositAddresses;
  received: number;
  settled: boolean;
  listing?: Listing;
  activity?: ActivityItem;
}> {
  const bid = await getBid(bidId);
  if (!bid) throw new Error("Unknown bid.");
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
