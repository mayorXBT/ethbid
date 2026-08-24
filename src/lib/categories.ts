export const CATEGORIES = [
  { slug: "l1s-l2s", label: "L1s & L2s" },
  { slug: "defi", label: "DeFi" },
  { slug: "wallets", label: "Wallets & MPC" },
  { slug: "ai-crypto", label: "AI + Crypto" },
  { slug: "infra", label: "Infrastructure" },
  { slug: "stablecoins", label: "Stablecoins & Payments" },
  { slug: "nfts-gaming", label: "NFTs & Gaming" },
  { slug: "analytics", label: "Analytics" },
  { slug: "exchanges", label: "Exchanges" },
  { slug: "social", label: "Social & Consumer" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

const SLUGS = new Set<string>(CATEGORIES.map((c) => c.slug));

export function isCategory(value: string): value is CategorySlug {
  return SLUGS.has(value);
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
