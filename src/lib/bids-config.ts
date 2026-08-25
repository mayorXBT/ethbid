export function bidsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BIDS_ENABLED === "true";
}
