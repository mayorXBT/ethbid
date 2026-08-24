import { Header } from "@/components/header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  return (
    <div>
      <Header />
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-bid">Why this exists</p>
        <h1 className="mt-3 text-4xl tracking-tight">About</h1>
        <p className="mt-4 text-mute">
          Crypto Twitter ranks products with vibes, recaps, and whoever paid the newsletter. Longbid makes the bid
          public. If you want the top slot, you pay for it in USDC. If someone wants it more, they pay more.
        </p>
        <p className="mt-4 text-mute">
          No algorithm. No quality score. No featured slot. The board is a book. Size talks.
        </p>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">How it works</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-ink/90">
          <li>Drop a URL or @handle.</li>
          <li>Pick a category. Bid whole USDC.</li>
          <li>Send USDC to the deposit address. Rank writes when the transfer confirms.</li>
          <li>Raise later by paying only the difference.</li>
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
        <p className="mt-12 font-mono text-sm text-bid">Rank is the bid — nothing else.</p>
        <Link href="/" className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-mute hover:text-ink">
          Claim a rank →
        </Link>
      </article>
    </div>
  );
}
