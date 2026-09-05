import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "./env";
import { getGraphBoard } from "./graph/board";
import { graphConfigured } from "./graph/client";
import { pg } from "./pg";
import { rankListings, topBidUsd } from "./ranking";
import { describeSupabaseWriteKey, isPrivilegedSupabaseKey } from "./supabase-key";
import type {
  ActivityItem,
  BoardSnapshot,
  Listing,
  SiteStats,
} from "./types";

interface StoreShape {
  listings: Listing[];
  activity: ActivityItem[];
  visitors: number;
  presence: Record<string, number>;
}

const DATA_PATH = path.join(process.cwd(), ".data", "store.json");

const g = globalThis as unknown as {
  __longbidStore?: StoreShape;
  __longbidLock?: Promise<void>;
};

function emptyStore(): StoreShape {
  return {
    listings: [],
    activity: [],
    visitors: 0,
    presence: {},
  };
}

function fileWritesAllowed() {
  return serverEnv("VERCEL") !== "1";
}

function missingWriteConfigError(action: string) {
  const kind = describeSupabaseWriteKey(serverEnv("SUPABASE_SERVICE_ROLE_KEY"));
  const url = supabaseUrl() ? "set" : "missing";
  return new Error(
    `Cannot ${action}. SUPABASE_SERVICE_ROLE_KEY is ${kind}, NEXT_PUBLIC_SUPABASE_URL is ${url}. Need the service_role secret and project URL.`,
  );
}

function supabaseUrl() {
  return serverEnv("SUPABASE_URL") || serverEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function publicSupabaseKey() {
  return serverEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || serverEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

function supabaseFromKey(key: string | undefined): SupabaseClient | null {
  const url = supabaseUrl();
  const trimmed = key?.trim().replace(/^["']|["']$/g, "");
  if (!url || !trimmed || !url.startsWith("http")) return null;
  return createClient(url, trimmed, { auth: { persistSession: false } });
}

function supabaseAdmin(): SupabaseClient | null {
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!isPrivilegedSupabaseKey(key)) return null;
  return supabaseFromKey(key);
}

function supabase(): SupabaseClient | null {
  return supabaseAdmin() ?? supabaseFromKey(publicSupabaseKey());
}

async function loadFile(): Promise<StoreShape> {
  if (g.__longbidStore) return g.__longbidStore;
  if (!fileWritesAllowed()) {
    g.__longbidStore = emptyStore();
    return g.__longbidStore;
  }
  try {
    const raw = await readFile(DATA_PATH, "utf8");
    g.__longbidStore = JSON.parse(raw) as StoreShape;
  } catch {
    g.__longbidStore = emptyStore();
    await persist();
  }
  return g.__longbidStore;
}

async function persist() {
  if (!g.__longbidStore || !fileWritesAllowed()) return;
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(g.__longbidStore, null, 2), "utf8");
}

async function mutate<T>(fn: (s: StoreShape) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const store = await loadFile();
    const result = await fn(store);
    await persist();
    return result;
  };
  const prev = g.__longbidLock ?? Promise.resolve();
  let release!: () => void;
  g.__longbidLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await run();
  } finally {
    release();
  }
}

function prunePresence(store: StoreShape, now = Date.now()) {
  const cutoff = now - 60_000;
  for (const [id, ts] of Object.entries(store.presence)) {
    if (ts < cutoff) delete store.presence[id];
  }
}

export async function getListings(): Promise<Listing[]> {
  const sql = pg();
  if (sql) {
    try {
      const rows = await sql`select * from listings order by bid_usd desc, created_at asc`;
      return rows.map((row) => fromRow(row as Record<string, unknown>));
    } catch {
      // fall through
    }
  }
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb.from("listings").select("*").order("bid_usd", { ascending: false });
    if (!error) return (data ?? []).map(fromRow);
  }
  const store = await loadFile();
  return store.listings;
}

export async function getListingByCanonical(canonicalKey: string): Promise<Listing | null> {
  const listings = await getListings();
  return listings.find((l) => l.canonicalKey === canonicalKey) ?? null;
}

export async function getListingById(id: string): Promise<Listing | null> {
  const listings = await getListings();
  return listings.find((l) => l.id === id) ?? null;
}

export async function incrementClicks(id: string): Promise<Listing | null> {
  const sql = pg();
  if (sql) {
    const rows = await sql`
      update listings set click_count = click_count + 1 where id = ${id}
      returning *
    `;
    return rows[0] ? fromRow(rows[0] as Record<string, unknown>) : null;
  }
  const sb = supabaseAdmin();
  if (sb) {
    const listing = await getListingById(id);
    if (!listing) return null;
    listing.clickCount += 1;
    const { error } = await sb.from("listings").update({ click_count: listing.clickCount }).eq("id", id);
    if (error) throw new Error(error.message);
    return listing;
  }
  if (!fileWritesAllowed()) return getListingById(id);
  return mutate((s) => {
    const listing = s.listings.find((l) => l.id === id);
    if (!listing) return null;
    listing.clickCount += 1;
    return listing;
  });
}

export async function patchListingMeta(
  id: string,
  patch: Partial<Pick<Listing, "name" | "description" | "faviconUrl" | "ogImageUrl">>,
): Promise<void> {
  const sql = pg();
  if (sql) {
    await sql`
      update listings set
        name = coalesce(${patch.name ?? null}, name),
        description = coalesce(${patch.description ?? null}, description),
        favicon_url = coalesce(${patch.faviconUrl ?? null}, favicon_url),
        og_image_url = coalesce(${patch.ogImageUrl ?? null}, og_image_url)
      where id = ${id}
    `;
    return;
  }
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb.from("listings").update({
      name: patch.name,
      description: patch.description,
      favicon_url: patch.faviconUrl,
      og_image_url: patch.ogImageUrl,
    }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  if (!fileWritesAllowed()) return;
  await mutate((s) => {
    const listing = s.listings.find((l) => l.id === id);
    if (!listing) return;
    Object.assign(listing, patch);
  });
}

export async function heartbeat(visitorId: string, isNewVisitor: boolean): Promise<SiteStats> {
  const sql = pg();
  if (sql) {
    try {
      await sql`
        insert into visitors (visitor_id, last_seen)
        values (${visitorId}::uuid, now())
        on conflict (visitor_id) do update set last_seen = now()
      `;
      return getStats();
    } catch {
      // fall through
    }
  }
  const sb = supabaseAdmin();
  if (sb) {
    const now = new Date().toISOString();
    const { error } = await sb.from("visitors").upsert(
      { visitor_id: visitorId, last_seen: now },
      { onConflict: "visitor_id" },
    );
    if (!error) return getStats();
  }
  if (!fileWritesAllowed()) return getStats();
  return mutate((s) => {
    const now = Date.now();
    s.presence[visitorId] = now;
    if (isNewVisitor) s.visitors += 1;
    prunePresence(s, now);
    return statsFrom(s);
  });
}

export async function getStats(): Promise<SiteStats> {
  const sql = pg();
  if (sql) {
    const listings = await getListings();
    const [presence] = await sql`
      select
        count(*) filter (where last_seen > now() - interval '60 seconds')::int as online,
        count(*)::int as visitors
      from visitors
    `;
    return {
      online: Number(presence?.online ?? 0),
      visitors: Number(presence?.visitors ?? 0),
      listings: listings.length,
      volumeUsd: listings.reduce((sum, l) => sum + l.bidUsd, 0),
      clicks: listings.reduce((sum, l) => sum + l.clickCount, 0),
    };
  }
  const sb = supabase();
  if (sb) {
    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const listings = await getListings();
    const [onlineRes, visitorsRes] = await Promise.all([
      sb.from("visitors").select("visitor_id", { count: "exact", head: true }).gte("last_seen", cutoff),
      sb.from("visitors").select("visitor_id", { count: "exact", head: true }),
    ]);
    if (!onlineRes.error && !visitorsRes.error) {
      return {
        online: onlineRes.count ?? 0,
        visitors: visitorsRes.count ?? 0,
        listings: listings.length,
        volumeUsd: listings.reduce((sum, l) => sum + l.bidUsd, 0),
        clicks: listings.reduce((sum, l) => sum + l.clickCount, 0),
      };
    }
  }
  const store = await loadFile();
  prunePresence(store);
  return statsFrom(store);
}

export async function getActivity(limit = 20): Promise<ActivityItem[]> {
  const sql = pg();
  if (sql) {
    const rows = await sql`
      select * from activity order by created_at desc limit ${limit}
    `;
    return rows.map((row) => ({
      id: String(row.id),
      listingId: String(row.listing_id),
      name: String(row.name),
      rank: Number(row.rank),
      bidUsd: Number(row.bid_usd),
      kind: row.kind as ActivityItem["kind"],
      createdAt: String(row.created_at),
    }));
  }
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb.from("activity").select("*").order("created_at", { ascending: false }).limit(limit);
    if (!error) return (data ?? []).map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      name: row.name,
      rank: row.rank,
      bidUsd: row.bid_usd,
      kind: row.kind,
      createdAt: row.created_at,
    }));
  }
  const store = await loadFile();
  return store.activity.slice(0, limit);
}

export async function getBoard(): Promise<BoardSnapshot> {
  if (graphConfigured()) {
    return getGraphBoard();
  }
  const listings = await getListings();
  const ranked = rankListings(listings);
  const activity = await getActivity();
  const stats = await getStats();
  stats.listings = ranked.length;
  stats.volumeUsd = ranked.reduce((s, l) => s + l.bidUsd, 0);
  stats.clicks = ranked.reduce((s, l) => s + l.clickCount, 0);
  return {
    listings: ranked,
    activity,
    stats,
    topBidUsd: topBidUsd(listings),
  };
}

function statsFrom(s: StoreShape): SiteStats {
  prunePresence(s);
  return {
    online: Object.keys(s.presence).length,
    visitors: s.visitors,
    listings: s.listings.length,
    volumeUsd: s.listings.reduce((sum, l) => sum + l.bidUsd, 0),
    clicks: s.listings.reduce((sum, l) => sum + l.clickCount, 0),
  };
}

function fromRow(row: Record<string, unknown>): Listing {
  return {
    id: String(row.id),
    canonicalKey: String(row.canonical_key),
    url: String(row.url),
    handle: (row.handle as string | null) ?? null,
    name: String(row.name),
    description: String(row.description ?? ""),
    faviconUrl: (row.favicon_url as string | null) ?? null,
    ogImageUrl: (row.og_image_url as string | null) ?? null,
    category: row.category as Listing["category"],
    bidUsd: Number(row.bid_usd),
    clickCount: Number(row.click_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}


