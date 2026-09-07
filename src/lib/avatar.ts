export function addressAvatarUrl(owner: string | null): string | null {
  if (!owner) return null;
  return `https://api.dicebear.com/10.x/avataaars/svg?seed=${encodeURIComponent(owner)}`;
}
