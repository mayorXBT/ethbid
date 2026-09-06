import { createPublicClient, http, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import {
  ENS_CCIP_PROBE,
  ENS_UNIVERSAL_RESOLVER_PROBE,
  ensLookupUnread,
  lookupEns,
  parseEnsName,
  walletControlsEns,
} from "./verify-ens";

const rpc = process.env.ETH_RPC_URL?.trim() || "https://ethereum-rpc.publicnode.com";
const client = createPublicClient({
  chain: mainnet,
  transport: http(rpc),
});

describe("parseEnsName", () => {
  it("accepts .eth and DNS-shaped names", () => {
    expect(parseEnsName("Ghoste.eth")).toBe("ghoste.eth");
    expect(parseEnsName("ensfairy.xyz")).toBe("ensfairy.xyz");
  });

  it("rejects a bare wallet or handle", () => {
    expect(parseEnsName("0xabc")).toBeNull();
    expect(parseEnsName("@ghoste")).toBeNull();
  });
});

describe("walletControlsEns", () => {
  const lookup = {
    name: "ghoste.eth",
    resolvedAddress: "0x1111111111111111111111111111111111111111" as const,
    registryOwner: "0x2222222222222222222222222222222222222222" as const,
    texts: { url: null, description: null, avatar: null, twitter: null },
  };

  it("matches the resolved addr record", () => {
    expect(walletControlsEns(lookup.resolvedAddress!, lookup)).toBe(true);
  });

  it("matches the registry or wrapper owner", () => {
    expect(walletControlsEns(lookup.registryOwner!, lookup)).toBe(true);
  });

  it("rejects a stranger wallet", () => {
    expect(walletControlsEns("0x3333333333333333333333333333333333333333", lookup)).toBe(false);
  });

  it("does not treat a blank RPC lookup as control", () => {
    const blank = {
      ...lookup,
      resolvedAddress: null,
      registryOwner: null,
    };
    expect(ensLookupUnread(blank)).toBe(true);
    expect(walletControlsEns(lookup.resolvedAddress!, blank)).toBe(false);
    expect(ensLookupUnread(lookup)).toBe(false);
  });
});

describe("live Universal Resolver", () => {
  it("resolves ur.integration-tests.eth to 0x2222… (current viem UR path)", async () => {
    const lookup = await lookupEns(client, ENS_UNIVERSAL_RESOLVER_PROBE.name);
    expect(lookup).not.toBeNull();
    expect(lookup?.resolvedAddress).toBeTruthy();
    expect(isAddressEqual(lookup!.resolvedAddress!, ENS_UNIVERSAL_RESOLVER_PROBE.address)).toBe(true);
  }, 30_000);

  it("resolves test.offchaindemo.eth through CCIP-Read", async () => {
    const lookup = await lookupEns(client, ENS_CCIP_PROBE.name);
    expect(lookup).not.toBeNull();
    expect(lookup?.resolvedAddress).toBeTruthy();
    expect(isAddressEqual(lookup!.resolvedAddress!, ENS_CCIP_PROBE.address)).toBe(true);
  }, 30_000);
});
