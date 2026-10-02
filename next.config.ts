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
  // Public Arbitrum Sepolia CAs. Vercel dashboard NEXT_PUBLIC_* did not inline on the first prod builds.
  env: {
    NEXT_PUBLIC_ETHBID_CHAIN_ID: process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID || "421614",
    NEXT_PUBLIC_ETHBID_REGISTRY:
      process.env.NEXT_PUBLIC_ETHBID_REGISTRY || "0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6",
    NEXT_PUBLIC_ETHBID_RANKING:
      process.env.NEXT_PUBLIC_ETHBID_RANKING || "0x3cC438F47c330AB747cf5404c573156221beD2fD",
    NEXT_PUBLIC_ETHBID_ROUTER:
      process.env.NEXT_PUBLIC_ETHBID_ROUTER || "0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C",
    NEXT_PUBLIC_ETHBID_USDC:
      process.env.NEXT_PUBLIC_ETHBID_USDC || "0xFFC95faa3d63Cde504a05B567C600B78C0b41892",
    NEXT_PUBLIC_ETHBID_WETH:
      process.env.NEXT_PUBLIC_ETHBID_WETH || "0x980B62Da83eFF3D4576C647993b0c1D7faf17c73",
    // Production ethbid (chain 1) must set NEXT_PUBLIC_ETHBID_START_BLOCK. Fallback is Arbitrum Sepolia.
    NEXT_PUBLIC_ETHBID_START_BLOCK: process.env.NEXT_PUBLIC_ETHBID_START_BLOCK || "314937339",
  },
};

export default nextConfig;
