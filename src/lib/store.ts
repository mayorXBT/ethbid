import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "./env";
import { ethbidContracts } from "./ethbid/config";
import { getLogsBoard } from "./ethbid/logs";
import { getGraphBoard } from "./graph/board";
import { graphConfigured } from "./graph/client";
import { pg } from "./pg";
import { rankListings, topBidUsd } from "./ranking";
import { UUID_RE } from "./request";
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
  clicks: Record<string, number>;
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
    clicks: {},
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
    g.__longbidStore.clicks ??= {};
    g.__longbidStore.presence ??= {};
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
  const key = id.toLowerCase();
  return listings.find((l) => l.id.toLowerCase() === key) ?? null;
}

export async function listingFromOnchainBoard(id: string): Promise<Listing | null> {
  const contracts = ethbidContracts();
  if (!contracts) return null;
  const key = id.toLowerCase();
  const board =
    graphConfigured() && contracts.chainId === 1
      ? await getGraphBoard().catch(() => getLogsBoard(contracts))
      : await getLogsBoard(contracts);
  return board.listings.find((row) => row.id.toLowerCase() === key) ?? null;
}

const CLICKS_BUCKET = "ethbid-stats";
const CLICKS_FILE = "clicks.json";

async function loadClickFile(sb: SupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await sb.storage.from(CLICKS_BUCKET).download(CLICKS_FILE);
  if (error || !data) return {};
  try {
    const parsed = JSON.parse(await data.text()) as Record<string, number>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

async function saveClickFile(sb: SupabaseClient, map: Record<string, number>): Promise<boolean> {
  const { error } = await sb.storage.from(CLICKS_BUCKET).upload(CLICKS_FILE, JSON.stringify(map), {
    upsert: true,
    contentType: "application/json",
  });
  if (!error) return true;
  const created = await sb.storage.createBucket(CLICKS_BUCKET, { public: false });
  if (created.error && !/already exists/i.test(created.error.message)) return false;
  const retry = await sb.storage.from(CLICKS_BUCKET).upload(CLICKS_FILE, JSON.stringify(map), {
    upsert: true,
    contentType: "application/json",
  });
  return !retry.error;
}

async function bumpListingClick(id: string): Promise<number> {
  const key = id.toLowerCase();
  const sql = pg();
  if (sql) {
    try {
      const rows = await sql`select increment_listing_clicks(${key}) as n`;
      return Number(rows[0]?.n ?? 0);
    } catch {
      try {
        const rows = await sql`
          insert into listing_clicks (listing_id, click_count)
          values (${key}, 1)
          on conflict (listing_id) do update
          set click_count = listing_clicks.click_count + 1,
              updated_at = now()
          returning click_count
        `;
        return Number(rows[0]?.click_count ?? 0);
      } catch {
        // table missing; fall through
      }
    }
  }
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb.rpc("increment_listing_clicks", { p_id: key });
    if (!error && data != null) return Number(data);
    const map = await loadClickFile(sb);
    map[key] = (map[key] ?? 0) + 1;
    if (await saveClickFile(sb, map)) return map[key];
  }
  if (!fileWritesAllowed()) return 0;
  return mutate((s) => {
    s.clicks[key] = (s.clicks[key] ?? 0) + 1;
    const listing = s.listings.find((l) => l.id.toLowerCase() === key);
    if (listing) listing.clickCount = s.clicks[key];
    return s.clicks[key];
  });
}

async function clickCountMap(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const keys = [...new Set(ids.map((id) => id.toLowerCase()))];
  if (keys.length === 0) return map;
  const sql = pg();
  if (sql) {
    try {
      const rows = await sql`
        select listing_id, click_count from listing_clicks where listing_id in ${sql(keys)}
      `;
      for (const row of rows) map.set(String(row.listing_id).toLowerCase(), Number(row.click_count));
      return map;
    } catch {
      // fall through
    }
  }
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb.from("listing_clicks").select("listing_id, click_count").in("listing_id", keys);
    if (!error) {
      for (const row of data ?? []) {
        map.set(String(row.listing_id).toLowerCase(), Number(row.click_count));
      }
      return map;
    }
    const admin = supabaseAdmin();
    if (admin) {
      const file = await loadClickFile(admin);
      for (const key of keys) map.set(key, file[key] ?? 0);
      return map;
    }
  }
  const store = await loadFile();
  for (const key of keys) {
    const listing = store.listings.find((l) => l.id.toLowerCase() === key);
    map.set(key, store.clicks[key] ?? listing?.clickCount ?? 0);
  }
  return map;
}

async function totalListingClicks(): Promise<number> {
  const sql = pg();
  if (sql) {
    try {
      const rows = await sql`select coalesce(sum(click_count), 0)::int as n from listing_clicks`;
      return Number(rows[0]?.n ?? 0);
    } catch {
      // fall through
    }
  }
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb.from("listing_clicks").select("click_count");
    if (!error) return (data ?? []).reduce((sum, row) => sum + Number(row.click_count ?? 0), 0);
    const admin = supabaseAdmin();
    if (admin) {
      const file = await loadClickFile(admin);
      return Object.values(file).reduce((sum, n) => sum + n, 0);
    }
  }
  const store = await loadFile();
  return Object.values(store.clicks).reduce((sum, n) => sum + n, 0);
}

export async function incrementClicks(id: string): Promise<Listing | null> {
  const key = id.toLowerCase();
  const next = await bumpListingClick(key);
  if (UUID_RE.test(id)) {
    const sql = pg();
    if (sql) {
      const rows = await sql`
        update listings set click_count = click_count + 1 where id = ${id}
        returning *
      `;
      if (rows[0]) {
        const listing = fromRow(rows[0] as Record<string, unknown>);
        listing.clickCount = next || listing.clickCount;
        return listing;
      }
    }
    const sb = supabaseAdmin();
    if (sb) {
      const listing = await getListingById(id);
      if (listing) {
        listing.clickCount = next || listing.clickCount + 1;
        await sb.from("listings").update({ click_count: listing.clickCount }).eq("id", id);
        return listing;
      }
    }
  }
  const listing = await getListingById(id);
  if (listing) {
    listing.clickCount = next || listing.clickCount;
    return listing;
  }
  return null;
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
      clicks: ethbidContracts()
        ? await totalListingClicks()
        : listings.reduce((sum, l) => sum + l.clickCount, 0),
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
        clicks: ethbidContracts()
          ? await totalListingClicks()
          : listings.reduce((sum, l) => sum + l.clickCount, 0),
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

async function withSiteStats(board: BoardSnapshot): Promise<BoardSnapshot> {
  const [stats, counts] = await Promise.all([
    getStats(),
    clickCountMap(board.listings.map((row) => row.id)),
  ]);
  const listings = board.listings.map((row) => ({
    ...row,
    clickCount: counts.get(row.id.toLowerCase()) ?? 0,
  }));
  return {
    ...board,
    listings,
    stats: {
      online: stats.online,
      visitors: stats.visitors,
      listings: listings.length,
      volumeUsd: board.stats.volumeUsd,
      clicks: listings.reduce((sum, row) => sum + row.clickCount, 0),
    },
  };
}

export async function getBoard(): Promise<BoardSnapshot> {
  if (serverEnv("ETHBID_FILE_STORE") === "1") {
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
  const contracts = ethbidContracts();
  // The published subgraph indexes Ethereum mainnet. Arbitrum and Robinhood
  // boards read BidPlaced logs from the settlement RPC.
  if (graphConfigured() && (!contracts || contracts.chainId === 1)) {
    try {
      return await withSiteStats(await getGraphBoard());
    } catch {
      if (contracts) return withSiteStats(await getLogsBoard(contracts));
      throw new Error("Graph query failed and no contract fallback is configured.");
    }
  }
  if (contracts) return withSiteStats(await getLogsBoard(contracts));
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
    clicks:
      Object.values(s.clicks).reduce((sum, n) => sum + n, 0) ||
      s.listings.reduce((sum, l) => sum + l.clickCount, 0),
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


