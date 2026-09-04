import { keccak256, toBytes, type Hex } from "viem";
import { namehash, normalize } from "viem/ens";

export function projectIdFromCanonical(canonicalKey: string): Hex {
  return keccak256(toBytes(canonicalKey));
}

export function ensIdentityRef(name: string): Hex {
  return namehash(normalize(name.trim()));
}
