import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStats } from "@/lib/store";

export async function Header() {
  const stats = await getStats().catch(() => ({
    online: 0,
    visitors: 0,
    listings: 0,
    volumeUsd: 0,
    clicks: 0,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 justify-self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-bid.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
          <span className="truncate text-base font-semibold tracking-tight text-foreground">
            Longbid
            <span className="hidden text-muted-foreground sm:inline">.lol</span>
          </span>
        </Link>

        <div
          className="flex items-center rounded-full border border-line bg-panel px-2.5 py-1 text-[12px] sm:px-3"
          title="Live = unique browsers in the last 60 seconds. Clicks = outbound clicks through listings."
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-bid">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-bid" />
            {stats.online.toLocaleString()}
            <span className="hidden sm:inline"> Live</span>
          </span>
          <span className="mx-2 h-3 w-px bg-line" />
          <span className="inline-flex items-center gap-1 text-heat">
            {stats.clicks.toLocaleString()}
            <span className="hidden sm:inline"> Clicks</span>
          </span>
        </div>

        <nav className="flex items-center justify-end gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:gap-4 sm:text-[12px]">
          <Link href="/" className="hidden hover:text-bid sm:inline">
            Board
          </Link>
          <Link href="/rules" className="hover:text-bid">
            Rules
          </Link>
          <Link href="/about" className="hover:text-bid">
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
