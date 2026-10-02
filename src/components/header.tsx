import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { WalletButton } from "@/components/wallet-button";
import { settlementCopy } from "@/lib/ethbid/copy";
import { getStats } from "@/lib/store";

export async function Header() {
  const copy = settlementCopy();
  const stats = await getStats().catch(() => ({
    online: 0,
    visitors: 0,
    listings: 0,
    volumeUsd: 0,
    clicks: 0,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-1.5 justify-self-start sm:gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-bid.png" alt="" width={32} height={32} className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          <span className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
            ETHBid
          </span>
        </Link>

        <div
          className="mx-auto flex max-w-full items-center justify-center overflow-hidden rounded-full border border-line bg-panel px-2 py-1 text-[11px] sm:px-3 sm:text-[12px]"
          title="Live = unique browsers in the last 60 seconds. Visitors = unique browsers ever. Clicks = outbound through listings."
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-bid">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-bid" />
            {stats.online.toLocaleString()}
            <span className="hidden sm:inline"> Live</span>
          </span>
          <span className="mx-1.5 h-3 w-px bg-line sm:mx-2" />
          <span className="inline-flex items-center gap-1 text-cyan">
            {stats.visitors.toLocaleString()}
            <span className="hidden sm:inline"> Visitors</span>
          </span>
          <span className="mx-1.5 h-3 w-px bg-line sm:mx-2" />
          <span className="inline-flex items-center gap-1 text-heat">
            {stats.clicks.toLocaleString()}
            <span className="hidden sm:inline"> Clicks</span>
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 justify-self-end sm:gap-3">
          {copy.faucetStable ? (
            <a
              href={copy.faucetStable}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 shrink-0 items-center border border-bid/40 px-2 text-[10px] uppercase tracking-[0.12em] text-bid hover:bg-bid/10 sm:px-2.5 sm:text-[11px] sm:tracking-[0.14em]"
            >
              Get test {copy.asset}
            </a>
          ) : null}
          <nav className="hidden items-center justify-end gap-4 text-[12px] uppercase tracking-[0.14em] text-muted-foreground md:flex">
            <Link href="/rules" className="hover:text-bid">
              Rules
            </Link>
            <Link href="/about" className="hover:text-bid">
              About
            </Link>
            <WalletButton />
            <ThemeToggle />
          </nav>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
