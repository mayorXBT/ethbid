import { ActivityFeed } from "@/components/activity-feed";
import { ClaimForm } from "@/components/claim-form";
import { Header } from "@/components/header";
import { BoardTable } from "@/components/board-table";
import { LiveRefresh } from "@/components/live-refresh";
import { PaidFlash } from "@/components/paid-flash";
import { formatUsd, MIN_NEW_BID_USD, TOP_SPOT_PREMIUM_USD } from "@/lib/money";
import { getBoard } from "@/lib/store";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const board = await getBoard().catch(() => ({
    listings: [],
    activity: [],
    stats: { online: 0, visitors: 0, listings: 0, volumeUsd: 0, clicks: 0 },
    topBidUsd: 0,
  }));
  const defaultBid = Math.max(MIN_NEW_BID_USD, board.topBidUsd + TOP_SPOT_PREMIUM_USD);

  return (
    <div className="min-h-screen">
      <Header />
      <LiveRefresh />
      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="border-b border-line py-6 sm:py-10">
          <Suspense>
            <PaidFlash />
          </Suspense>
          <Suspense>
            <ClaimForm defaultBid={defaultBid} />
          </Suspense>
        </section>

        <section className="pt-8">
          <p className="mb-4 text-right text-[11px] text-muted-foreground">
            {board.listings.length} names · {formatUsd(board.stats.volumeUsd)} USDC locked
          </p>
          <BoardTable listings={board.listings} />
          <ActivityFeed items={board.activity} />
        </section>
      </main>
    </div>
  );
}
