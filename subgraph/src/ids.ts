import { BigInt, Bytes } from "@graphprotocol/graph-ts";

/** Match /verify: 0x + 64 hex chars of the uint256 round id. */
export function roundIdBytes(roundId: BigInt): Bytes {
  let hex = roundId.toHexString().slice(2);
  while (hex.length < 64) {
    hex = "0" + hex;
  }
  return Bytes.fromHexString("0x" + hex);
}

export function bidId(roundId: Bytes, projectId: Bytes): Bytes {
  return roundId.concat(projectId);
}

export function verificationLabel(value: i32): string {
  if (value == 1) return "Ens";
  if (value == 2) return "Domain";
  return "None";
}
