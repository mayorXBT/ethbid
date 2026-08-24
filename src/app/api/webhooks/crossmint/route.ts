import { recipientFromWebhook, verifyCrossmintSignature } from "@/lib/crossmint";
import { getBidByDepositAddress } from "@/lib/store";
import { settleIfFunded } from "@/lib/settle";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature =
    req.headers.get("x-webhook-signature") ?? req.headers.get("x-crossmint-signature");
  const ok = await verifyCrossmintSignature(raw, signature);
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  const event = JSON.parse(raw) as {
    type?: string;
    data?: { recipient?: { address?: string } };
  };

  if (event.type === "wallets.transfer.in") {
    const address = recipientFromWebhook(event);
    if (address) {
      const bid = await getBidByDepositAddress(address);
      if (bid) await settleIfFunded(bid.id);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ignored: event.type ?? "unknown" });
}
