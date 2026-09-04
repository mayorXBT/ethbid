import { Header } from "@/components/header";
import { CURRENT_LEADERBOARD } from "@/lib/graph/queries";
import { ethbidContracts } from "@/lib/ethbid/config";
import { rankingRoundAbi } from "@/lib/ethbid/abi";
import { RANKING_FORMULA, TIE_BREAK } from "@/lib/ethbid/ranking-formula";
import { graphEndpoint, graphQuery } from "@/lib/graph/client";
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Verify ranking" };
export const dynamic = "force-dynamic";

type GraphBid = {
  canonicalUsdc: string;
  project: { id: string };
};

async function loadRound() {
  const contracts = ethbidContracts();
  if (!contracts) return null;
  const chain = contracts.chainId === 1 ? mainnet : sepolia;
  const client = createPublicClient({ chain, transport: http() });
  try {
    const roundId = await client.readContract({
      address: contracts.ranking,
      abi: rankingRoundAbi,
      functionName: "currentRoundId",
    });
    if (roundId === 0n) return { contracts, roundId, start: 0n, end: 0n, finalized: false };
    const round = await client.readContract({
      address: contracts.ranking,
      abi: rankingRoundAbi,
      functionName: "rounds",
      args: [roundId],
    });
    return { contracts, roundId, start: round[0], end: round[1], finalized: round[2] };
  } catch {
    return { contracts, roundId: 0n, start: 0n, end: 0n, finalized: false };
  }
}

async function loadGraph(roundId: bigint) {
  try {
    graphEndpoint();
    const data = await graphQuery<{ bids: GraphBid[] }>(CURRENT_LEADERBOARD, {
      roundId: `0x${roundId.toString(16).padStart(64, "0")}`,
    });
    return { ok: true as const, bids: data.bids };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Graph query failed." };
  }
}

export default async function VerifyRankingPage() {
  const round = await loadRound();
  const graph = round ? await loadGraph(round.roundId) : { ok: false as const, error: "No active round to query." };
  const subgraph = process.env.GRAPH_SUBGRAPH_URL?.trim() || "not configured";
  const remaining =
    round && round.end > 0n ? Math.max(0, Number(round.end) - Math.floor(Date.now() / 1000)) : null;

  return (
    <div>
      <Header />
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-bid">Public check</p>
        <h1 className="mt-3 text-4xl tracking-tight">Verify ranking</h1>
        <p className="mt-4 text-mute">
          Rank is the active canonical USDC bid in the current round. Reconstruct it from the contracts and The Graph.
          Do not trust the Longbid backend for ETHBid rank.
        </p>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Formula</h2>
        <p className="mt-4 font-mono text-sm text-ink">{RANKING_FORMULA}</p>
        <ul className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink/90">
          {TIE_BREAK.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Contracts</h2>
        {round?.contracts ? (
          <ul className="mt-4 space-y-2 break-all font-mono text-[12px] text-ink/90">
            <li>registry {round.contracts.registry}</li>
            <li>ranking {round.contracts.ranking}</li>
            <li>router {round.contracts.router}</li>
            <li>usdc {round.contracts.usdc}</li>
            <li>chain {round.contracts.chainId}</li>
          </ul>
        ) : (
          <p className="mt-4 text-sm text-mute">Addresses empty until deploy. Set NEXT_PUBLIC_ETHBID_* then refresh.</p>
        )}

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Active round</h2>
        {round && round.roundId !== 0n ? (
          <p className="mt-4 text-sm text-ink/90">
            Round {round.roundId.toString()} · start {round.start.toString()} · end {round.end.toString()}
            {round.finalized ? " · finalized" : remaining != null ? ` · ${remaining}s left` : ""}
          </p>
        ) : (
          <p className="mt-4 text-sm text-mute">No round onchain yet.</p>
        )}

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Subgraph</h2>
        <p className="mt-4 break-all font-mono text-[12px] text-ink/90">{subgraph}</p>
        <pre className="mt-4 overflow-x-auto border border-line bg-panel p-3 text-[11px] text-mute">{CURRENT_LEADERBOARD.trim()}</pre>

        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Indexed bids</h2>
        {graph.ok ? (
          graph.bids.length === 0 ? (
            <p className="mt-4 text-sm text-mute">Graph returned an empty bid list for this round.</p>
          ) : (
            <ol className="mt-4 space-y-2 text-sm">
              {graph.bids.map((bid, i) => (
                <li key={bid.project.id} className="flex justify-between border border-line bg-panel px-3 py-2">
                  <span className="font-mono text-[12px]">
                    #{i + 1} {bid.project.id.slice(0, 10)}…
                  </span>
                  <span className="tabular-nums">{bid.canonicalUsdc} USDC</span>
                </li>
              ))}
            </ol>
          )
        ) : (
          <p className="mt-4 text-sm text-heat">{graph.error}</p>
        )}

        <Link href="/" className="mt-12 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-mute hover:text-ink">
          ← Back to the board
        </Link>
      </article>
    </div>
  );
}
