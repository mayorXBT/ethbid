export const RANKING_FORMULA = "score = active canonical USDG bid";

export const TIE_BREAK = [
  "Higher active USDG bid",
  "Earlier transaction in the current round",
  "Stable project id",
] as const;
