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
          Longbid is a public leaderboard for crypto products. There are no ads, no API keys, and no revenue share.
          You pay USDC to stand above everyone else. Rank is the bid — nothing else.
        </p>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">How ranking works</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/90">
          <li>New listings are whole USDC, $1 minimum, $999,999 maximum, $1 at a time.</li>
          <li>Bids already on the board keep their amount until they raise or get outranked.</li>
          <li>Taking #1 costs at least $1 more than the current top bid.</li>
          <li>Paying less still puts you on the board at whatever rank that bid can take.</li>
          <li>Equal bids stay in the order they were placed — the older bid keeps the higher rank.</li>
          <li>Raise an existing listing by paying only the difference.</li>
        </ul>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Money</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/90">
          <li>Settlement is USDC on Base and Solana. Each bid gets a Crossmint deposit wallet. No NFT, no collection, no contract.</li>
          <li>A confirmed USDC transfer is what claims the rank. Pending checkouts do nothing.</li>
          <li>Bids never expire. All sales are final.</li>
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
          <li>Clicks are counted when someone leaves the board through your listing.</li>
        </ul>

        <p className="mt-12 font-mono text-sm text-bid">Rank is the bid — nothing else.</p>
        <Link href="/" className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-mute hover:text-ink">
          ← Back to the board
        </Link>
      </article>
    </div>
  );
}
