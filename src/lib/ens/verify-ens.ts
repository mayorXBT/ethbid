import {
  type Address,
  type PublicClient,
  isAddress,
  isAddressEqual,
  parseAbi,
  zeroAddress,
} from "viem";
import { namehash, normalize } from "viem/ens";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as const;
const NAME_WRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401" as const;

const registryAbi = parseAbi(["function owner(bytes32 node) view returns (address)"]);
const wrapperAbi = parseAbi(["function ownerOf(uint256 id) view returns (address)"]);

export const ENS_UNIVERSAL_RESOLVER_PROBE = {
  name: "ur.integration-tests.eth",
  address: "0x2222222222222222222222222222222222222222",
} as const;

export const ENS_CCIP_PROBE = {
  name: "test.offchaindemo.eth",
  address: "0x779981590E7Ccc0CFAe8040Ce7151324747cDb97",
} as const;

export type EnsLookup = {
  name: string;
  resolvedAddress: Address | null;
  registryOwner: Address | null;
  texts: {
    url: string | null;
    description: string | null;
    avatar: string | null;
    twitter: string | null;
  };
};

export type EnsMatch = {
  resolved: boolean;
  owner: boolean;
};

export function looksLikeEnsName(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.includes(".") && trimmed.length > 2;
}

export function parseEnsName(input: string): string | null {
  if (!looksLikeEnsName(input)) return null;
  try {
    return normalize(input.trim());
  } catch {
    return null;
  }
}

function asAddress(value: string | null | undefined): Address | null {
  if (!value || !isAddress(value) || isAddressEqual(value, zeroAddress)) return null;
  return value;
}

export async function lookupEns(client: PublicClient, input: string): Promise<EnsLookup | null> {
  const name = parseEnsName(input);
  if (!name) return null;

  const node = namehash(name);
  const [resolved, registryOwner, url, description, avatar, twitter] = await Promise.all([
    client.getEnsAddress({ name }).catch(() => null),
    client
      .readContract({
        address: ENS_REGISTRY,
        abi: registryAbi,
        functionName: "owner",
        args: [node],
      })
      .catch(() => null),
    client.getEnsText({ name, key: "url" }).catch(() => null),
    client.getEnsText({ name, key: "description" }).catch(() => null),
    client.getEnsText({ name, key: "avatar" }).catch(() => null),
    client.getEnsText({ name, key: "com.twitter" }).catch(() => null),
  ]);

  let owner = asAddress(registryOwner);
  if (owner && isAddressEqual(owner, NAME_WRAPPER)) {
    const wrapped = await client
      .readContract({
        address: NAME_WRAPPER,
        abi: wrapperAbi,
        functionName: "ownerOf",
        args: [BigInt(node)],
      })
      .catch(() => null);
    owner = asAddress(wrapped);
  }

  return {
    name,
    resolvedAddress: asAddress(resolved),
    registryOwner: owner,
    texts: {
      url: url || null,
      description: description || null,
      avatar: avatar || null,
      twitter: twitter || null,
    },
  };
}

export function matchWalletToEns(wallet: Address, lookup: EnsLookup): EnsMatch {
  const resolved = Boolean(lookup.resolvedAddress && isAddressEqual(wallet, lookup.resolvedAddress));
  const owner = Boolean(lookup.registryOwner && isAddressEqual(wallet, lookup.registryOwner));
  return { resolved, owner };
}

export function walletControlsEns(wallet: Address, lookup: EnsLookup): boolean {
  const match = matchWalletToEns(wallet, lookup);
  return match.resolved || match.owner;
}
