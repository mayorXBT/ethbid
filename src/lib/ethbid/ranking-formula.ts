import type { BidAsset } from "./chains";

export function rankingFormula(asset: BidAsset): string {
  return `score = active canonical ${asset} bid`;
}

export function tieBreak(asset: BidAsset): readonly string[] {
  return [
    `Higher active ${asset} bid`,
    "Earlier transaction in the current round",
    "Stable project id",
  ];
}
