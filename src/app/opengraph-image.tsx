import { settlementCopy } from "@/lib/ethbid/copy";
import { MIN_NEW_BID_USD } from "@/lib/money";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ETHBid. Rank is the onchain bid.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const copy = settlementCopy();
  const logo = await readFile(join(process.cwd(), "public/logo-bid.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07080a",
          color: "#e8eaef",
          padding: "56px 64px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="" width={72} height={72} />
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>ETHBid</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1px solid #1c2129",
              background: "#0e1014",
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 16,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#3dff9a" }} />
            <div style={{ color: "#3dff9a", fontWeight: 500 }}>Live</div>
            <div style={{ width: 1, height: 16, background: "#1c2129" }} />
            <div style={{ color: "#8b93a1" }}>
              {copy.label} · {copy.asset}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 600, lineHeight: 0.95, letterSpacing: -2 }}>
            Rank is the bid.
          </div>
          <div style={{ marginTop: 24, fontSize: 28, color: "#8b93a1" }}>Bid. Rank. Repeat.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
          <div style={{ fontSize: 18, color: "#8b93a1" }}>
            Pay more. Rank higher. Floor ${MIN_NEW_BID_USD} {copy.asset}.
          </div>
          <div
            style={{
              background: "#3dff9a",
              color: "#07080a",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "12px 24px",
            }}
          >
            Place bid
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
