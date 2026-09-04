export type RankRow = {
  id: string;
  canonicalUsdc: bigint;
  firstBidAt: bigint;
};

export function rankRows(rows: RankRow[]): RankRow[] {
  return [...rows].sort((a, b) => {
    if (a.canonicalUsdc !== b.canonicalUsdc) return a.canonicalUsdc < b.canonicalUsdc ? 1 : -1;
    if (a.firstBidAt !== b.firstBidAt) return a.firstBidAt < b.firstBidAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
