export function plainEthbidError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes("user rejected") || lower.includes("denied transaction") || lower.includes("rejected the request")) {
    return "Signature rejected. Try again when you are ready.";
  }
  if (lower.includes("chain mismatch") || lower.includes("wrong network") || lower.includes("chain id")) {
    return "Wrong network. Switch the wallet to the ETHBid chain.";
  }
  if (lower.includes("connect a wallet") || lower.includes("connector")) {
    return "Connect a wallet first.";
  }
  if (lower.includes("ens name not found")) {
    return "ENS name not found.";
  }
  if (lower.includes("does not control")) {
    return "Connected wallet does not control that ENS identity.";
  }
  if (lower.includes("expired")) {
    return "Domain challenge expired. Issue a new one.";
  }
  if (lower.includes("mismatch") && lower.includes("domain")) {
    return "Domain challenge mismatch. Publish the nonce, then retry.";
  }
  if (lower.includes("unauthorized")) {
    return "Unauthorized. Only the verified owner can edit or bid.";
  }
  if (lower.includes("not deployed")) {
    return "ETHBid contracts are not deployed yet.";
  }
  if (lower.includes("need a real url")) {
    return "Need a real URL or @handle.";
  }
  return raw.slice(0, 240) || "Something failed. Retry.";
}
