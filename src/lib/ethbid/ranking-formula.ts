export const RANKING_FORMULA = "score = active canonical USDC bid";

export const TIE_BREAK = [
  "Higher active USDC bid",
  "Earlier transaction in the current round",
  "Stable project id",
] as const;
