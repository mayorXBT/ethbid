import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Public mainnet CAs. Vercel dashboard NEXT_PUBLIC_* did not inline on the first prod builds.
  env: {
    NEXT_PUBLIC_ETHBID_CHAIN_ID: process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID || "1",
    NEXT_PUBLIC_ETHBID_REGISTRY:
      process.env.NEXT_PUBLIC_ETHBID_REGISTRY || "0x3cC438F47c330AB747cf5404c573156221beD2fD",
    NEXT_PUBLIC_ETHBID_RANKING:
      process.env.NEXT_PUBLIC_ETHBID_RANKING || "0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C",
    NEXT_PUBLIC_ETHBID_ROUTER:
      process.env.NEXT_PUBLIC_ETHBID_ROUTER || "0xD5ed47C1b75D41DFE2de73620C1f496d89861D1D",
    NEXT_PUBLIC_ETHBID_USDC:
      process.env.NEXT_PUBLIC_ETHBID_USDC || "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    NEXT_PUBLIC_ETHBID_WETH:
      process.env.NEXT_PUBLIC_ETHBID_WETH || "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
};

export default nextConfig;
