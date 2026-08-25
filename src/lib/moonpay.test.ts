import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMoonPayCharge,
  moonPayEventDetails,
  verifyMoonPaySignature,
} from "./moonpay";

const originalEnv = { ...process.env };

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe("MoonPay Commerce", () => {
  it("creates a dynamic charge for the bid amount and carries the bid id", async () => {
    process.env.MOONPAY_API_KEY = "test-api-key";
    process.env.MOONPAY_PAYLINK_ID = "6a8d6daea2f840feb6db6c18";
    process.env.MOONPAY_API_BASE_URL = "https://api.dev.hel.io/v1";
    process.env.NEXT_PUBLIC_SITE_URL = "https://longbid.lol";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "charge-123", pageUrl: "https://moonpay.dev.hel.io/charge/charge-123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createMoonPayCharge({
      id: "22a18bac-3bb4-4c0c-b4b9-2f78a9bfb4ea",
      amountDueUsd: 12,
    });

    expect(result).toEqual({ id: "charge-123", pageUrl: "https://moonpay.dev.hel.io/charge/charge-123" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.dev.hel.io/v1/charge/api-key?apiKey=test-api-key");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.paymentRequestId).toBe("6a8d6daea2f840feb6db6c18");
    expect(body.requestAmount).toBe("12");
    expect(JSON.parse(body.prepareRequestBody.additionalJSON)).toMatchObject({
      bidId: "22a18bac-3bb4-4c0c-b4b9-2f78a9bfb4ea",
      amountDueUsd: 12,
    });
  });

  it("rejects missing or invalid webhook signatures", async () => {
    const payload = '{"event":"CREATED"}';
    process.env.MOONPAY_WEBHOOK_SECRET = "test-webhook-secret";
    const signature = createHmac("sha256", "test-webhook-secret").update(payload).digest("hex");

    expect(await verifyMoonPaySignature(payload, signature)).toBe(true);
    expect(await verifyMoonPaySignature(payload, "wrong")).toBe(false);
    delete process.env.MOONPAY_WEBHOOK_SECRET;
    expect(await verifyMoonPaySignature(payload, signature)).toBe(false);
  });

  it("extracts a successful bid payment from the webhook metadata", () => {
    const details = moonPayEventDetails({
      event: "CREATED",
      transactionObject: {
        id: "charge-123",
        paylinkId: "6a8d6daea2f840feb6db6c18",
        meta: {
          transactionStatus: "SUCCESS",
          customerDetails: {
            additionalJSON: JSON.stringify({ bidId: "22a18bac-3bb4-4c0c-b4b9-2f78a9bfb4ea" }),
          },
        },
      },
    });

    expect(details).toEqual({
      bidId: "22a18bac-3bb4-4c0c-b4b9-2f78a9bfb4ea",
      chargeId: "charge-123",
    });
  });
});
