import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OG",
  robots: { index: false, follow: false },
};

export default function OgCardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div
        id="og"
        className="relative overflow-hidden bg-[#07080a] text-[#e8eaef]"
        style={{ width: 1200, height: 630, fontFamily: "var(--font-jetbrains), JetBrains Mono, ui-monospace, monospace" }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#3dff9a]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[#3dff9a]/8 blur-3xl" />

        <div className="flex h-full flex-col justify-between px-16 py-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-bid.png" alt="" width={72} height={72} className="h-[72px] w-[72px]" />
              <p className="text-[28px] font-semibold tracking-tight">
                Longbid<span className="text-[#8b93a1]">.lol</span>
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-[#1c2129] bg-[#0e1014] px-4 py-2 text-[16px]">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3dff9a]" />
              <span className="font-medium text-[#3dff9a]">Live</span>
              <span className="h-4 w-px bg-[#1c2129]" />
              <span className="text-[#8b93a1]">USDC on Base + Solana</span>
            </div>
          </div>

          <div>
            <h1 className="text-[84px] font-semibold leading-[0.95] tracking-tight">Rank is the bid.</h1>
            <p className="mt-6 text-[28px] tracking-tight text-[#8b93a1]">
              Bid. Rank. Repeat.
            </p>
          </div>

          <div className="flex items-center justify-end gap-5">
            <p className="text-[18px] text-[#8b93a1]">Pay more. Rank higher. Floor $1 USDC.</p>
            <span className="bg-[#3dff9a] px-6 py-3 text-[18px] font-semibold uppercase tracking-[0.14em] text-[#07080a]">
              Place bid
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
