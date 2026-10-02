import { Header } from "@/components/header";
import { reconstructFrom, settlementCopy, thirdPartyRankCopy } from "@/lib/ethbid/copy";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const copy = settlementCopy();
  const explorerHost = new URL(copy.explorer).host;

  return (
    <div>
      <Header />
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-bid">Why this exists</p>
        <h1 className="mt-3 text-4xl tracking-tight">About</h1>
        <p className="mt-4 text-mute">
          Crypto Twitter ranks products with vibes and recaps. ETHBid is Longbid rebuilt so the rank is
          onchain. Verify you control the product. Bid {copy.asset} on {copy.label}. Anyone can rebuild the
          board from {reconstructFrom(copy)}.
        </p>
        <p className="mt-4 text-mute">
          No algorithm. No featured slot. If you want #1, you pay for it. If someone wants it more, they
          pay more. {thirdPartyRankCopy(copy)}
        </p>
        <p className="mt-4 text-mute">
          ENS identity is resolved on Ethereum mainnet. Settlement and rank live on {copy.label}.
        </p>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">How it works</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-ink/90">
          <li>Connect the wallet that controls your ENS name or verified domain.</li>
          <li>Submit the product. Ownership writes onchain.</li>
          <li>
            Bid {copy.asset} on {copy.label}. Rank is the active bid.
          </li>
          <li>Open Verify and reconstruct the same ranking from {explorerHost} events.</li>
        </ol>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Counters</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/90">
          <li>Online is unique browsers that pinged in the last 60 seconds. It is not fake activity.</li>
          <li>Visitors since launch is unique browsers that have opened the site. It starts at 0.</li>
          <li>Your own tab counts. Until people show up, both numbers stay small.</li>
        </ul>

        <p className="mt-10 text-sm text-mute">
          Inspired by the simplicity of pay-to-rank boards. Built for crypto products that already know attention is
          a market.
        </p>
        <p className="mt-12 font-mono text-sm text-bid">Rank is the onchain bid.</p>
        <Link href="/" className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-mute hover:text-ink">
          Claim a rank →
        </Link>
      </article>
    </div>
  );
}
