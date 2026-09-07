export function addressAvatarUrl(owner: string | null): string | null {
  if (!owner) return null;
  return `https://api.dicebear.com/10.x/avataaars/svg?seed=${encodeURIComponent(owner)}`;
}

export function ensAvatarUrl(host: string, verification: string): string | null {
  if (verification !== "Ens" || !host) return null;
  return `https://euc.li/${host.toLowerCase()}`;
}
