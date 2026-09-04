import { Header } from "@/components/header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Rules" };
export const dynamic = "force-dynamic";

export default async function RulesPage() {
  return (
    <div>
      <Header />
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-bid">Protocol</p>
        <h1 className="mt-3 text-4xl tracking-tight">Rules</h1>
        <p className="mt-4 text-mute">
          ETHBid is the onchain edition of Longbid. Rank is the active canonical USDC bid in the current
          round. Anyone can reconstruct the board from the contracts and The Graph.
        </p>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">How ranking works</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/90">
          <li>Score is the active canonical USDC bid in this round. Nothing else.</li>
          <li>Tie-break: higher USDC, then the earlier bid in the round, then the stable project id.</li>
          <li>Rounds are time-boxed. Early listings do not keep #1 forever.</li>
          <li>Only the verified owner wallet can bid, raise, or withdraw for a listing.</li>
          <li>The homepage reads The Graph. Do not trust a backend cache for rank.</li>
        </ul>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Money</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/90">
          <li>Bid with ETH or a supported ERC-20. Uniswap V3 converts it to canonical USDC on Ethereum mainnet.</li>
          <li>RankingRound records the USDC that lands. That amount is the score.</li>
          <li>No ETHBid token. No fiat checkout. No Crossmint or MoonPay on this board.</li>
        </ul>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Counters</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/90">
          <li>Online: unique browsers that heartbeated in the last 60 seconds.</li>
          <li>Visitors since launch: unique browsers that have opened the site. Starts at 0. No seed number.</li>
        </ul>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Listings</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/90">
          <li>Submit a product URL or an X @handle. Tracking params are stripped. GitHub and app stores key by path/id.</li>
          <li>Crypto products only: protocols, wallets, DEXs, L1s/L2s, infra, AI+crypto, stables, analytics.</li>
          <li>The listing is the product URL. Rank is the subgraph total, not clicks.</li>
        </ul>

        <p className="mt-12 font-mono text-sm text-bid">Rank is the onchain bid.</p>
        <Link href="/" className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-mute hover:text-ink">
          ← Back to the board
        </Link>
      </article>
    </div>
  );
}
