import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "./env";

const DEFAULT_API_BASE_URL = "https://api.dev.hel.io/v1";

interface MoonPayChargeBid {
  id: string;
  amountDueUsd: number;
}

interface MoonPayChargeResponse {
  id?: unknown;
  pageUrl?: unknown;
}

interface MoonPayTransaction {
  id?: unknown;
  paylinkId?: unknown;
  meta?: Record<string, unknown>;
}

function configured(name: string): string {
  return serverEnv(name);
}

function parseAdditionalJson(value: unknown): Record<string, unknown> | null {
  let current = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      return current as Record<string, unknown>;
    }
    if (typeof current !== "string") return null;
    try {
      current = JSON.parse(current) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

export function verifyMoonPaySignature(raw: string, signature: string | null): boolean {
  const secret = configured("MOONPAY_WEBHOOK_SECRET");
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(raw).digest();
  const suppliedText = signature.trim().replace(/^sha256=/i, "");
  if (!/^[a-f0-9]+$/i.test(suppliedText) || suppliedText.length !== expected.length * 2) return false;

  const supplied = Buffer.from(suppliedText, "hex");
  return timingSafeEqual(expected, supplied);
}

export async function createMoonPayCharge(bid: MoonPayChargeBid): Promise<{ id: string; pageUrl: string }> {
  const apiKey = configured("MOONPAY_API_KEY");
  const publicKey = configured("MOONPAY_PUBLIC_KEY");
  const paylinkId = configured("MOONPAY_PAYLINK_ID");
  if (!apiKey) throw new Error("MOONPAY_API_KEY is missing.");
  if (!publicKey) throw new Error("MOONPAY_PUBLIC_KEY is missing.");
  if (!paylinkId) throw new Error("MOONPAY_PAYLINK_ID is missing.");

  const siteUrl = configured("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";
  const apiBase = configured("MOONPAY_API_BASE_URL") || DEFAULT_API_BASE_URL;
  const endpoint = `${apiBase.replace(/\/$/, "")}/charge/api-key?apiKey=${encodeURIComponent(publicKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentRequestId: paylinkId,
      requestAmount: String(bid.amountDueUsd),
      successRedirectUrl: `${siteUrl}/pay/${bid.id}?paid=1`,
      cancelRedirectUrl: `${siteUrl}/pay/${bid.id}?cancelled=1`,
      prepareRequestBody: {
        additionalJSON: JSON.stringify({
          bidId: bid.id,
          amountDueUsd: bid.amountDueUsd,
        }),
      },
    }),
  });

  if (!response.ok) throw new Error(`MoonPay charge creation failed (${response.status}).`);
  const data = (await response.json()) as MoonPayChargeResponse;
  if (typeof data.id !== "string" || typeof data.pageUrl !== "string") {
    throw new Error("MoonPay returned an invalid charge.");
  }
  return { id: data.id, pageUrl: data.pageUrl };
}

export function moonPayEventDetails(event: unknown): { bidId: string; chargeId: string } | null {
  if (!event || typeof event !== "object") return null;
  const body = event as Record<string, unknown>;
  let transaction = body.transactionObject as MoonPayTransaction | undefined;
  if (!transaction && typeof body.transaction === "string") {
    try {
      transaction = JSON.parse(body.transaction) as MoonPayTransaction;
    } catch {
      return null;
    }
  }
  if (!transaction || typeof transaction !== "object") return null;

  const meta = transaction.meta;
  const status = String(meta?.transactionStatus ?? "").toUpperCase();
  if (status !== "SUCCESS") return null;

  const paylinkId = configured("MOONPAY_PAYLINK_ID");
  if (paylinkId && String(transaction.paylinkId ?? "") !== paylinkId) return null;

  const customerDetails = meta?.customerDetails;
  const additionalJSON =
    (customerDetails && typeof customerDetails === "object"
      ? (customerDetails as Record<string, unknown>).additionalJSON
      : undefined) ?? meta?.additionalJSON;
  const metadata = parseAdditionalJson(additionalJSON);
  const bidId = metadata?.bidId;
  const chargeId = transaction.id ?? body.id;
  if (typeof bidId !== "string" || typeof chargeId !== "string") return null;
  return { bidId, chargeId };
}
