import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { pg } from "./pg";
import { rankListings, topBidUsd } from "./ranking";
import { describeSupabaseWriteKey, isPrivilegedSupabaseKey } from "./supabase-key";
import type {
  ActivityItem,
  Bid,
  BoardSnapshot,
  Listing,
  SiteStats,
} from "./types";

interface StoreShape {
  listings: Listing[];
  bids: Bid[];
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
    bids: [],
    activity: [],
    visitors: 0,
    presence: {},
  };
}

function fileWritesAllowed() {
  return !process.env.VERCEL;
}

function missingWriteConfigError(action: string) {
  const kind = describeSupabaseWriteKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const url = supabaseUrl() ? "set" : "missing";
  return new Error(
    `Cannot ${action}. SUPABASE_SERVICE_ROLE_KEY is ${kind}, NEXT_PUBLIC_SUPABASE_URL is ${url}. Need the service_role secret and project URL.`,
  );
}

function supabaseUrl() {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  );
}

function publicSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
}

function supabaseFromKey(key: string | undefined): SupabaseClient | null {
  const url = supabaseUrl();
  const trimmed = key?.trim().replace(/^["']|["']$/g, "");
  if (!url || !trimmed || !url.startsWith("http")) return null;
  return createClient(url, trimmed, { auth: { persistSession: false } });
}

function supabaseAdmin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

export async function getBid(id: string): Promise<Bid | null> {
  const sql = pg();
  if (sql) {
    try {
      const rows = await sql`select * from bids where id = ${id} limit 1`;
      if (rows[0]) return bidFromRow(rows[0] as Record<string, unknown>);
    } catch {
      // fall through
    }
  }
  const sb = supabaseAdmin() ?? supabase();
  if (sb) {
    const { data, error } = await sb.from("bids").select("*").eq("id", id).maybeSingle();
    if (!error && data) return bidFromRow(data);
  }
  const store = await loadFile();
  return store.bids.find((b) => b.id === id) ?? null;
}

export async function createBid(bid: Bid): Promise<Bid> {
  const sql = pg();
  if (sql) {
    try {
      const row = bidToRow(bid);
      await sql`insert into bids ${sql(row)}`;
      return bid;
    } catch {
      // fall through
    }
  }
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb.from("bids").insert(bidToRow(bid));
    if (error) throw new Error(error.message);
    return bid;
  }
  if (!fileWritesAllowed()) throw missingWriteConfigError("save bid");
  return mutate((s) => {
    s.bids.push(bid);
    return bid;
  });
}

export async function attachOrderId(bidId: string, orderId: string): Promise<void> {
  const sql = pg();
  if (sql) {
    await sql`update bids set crossmint_order_id = ${orderId} where id = ${bidId}`;
    return;
  }
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb.from("bids").update({ crossmint_order_id: orderId }).eq("id", bidId);
    if (error) throw error;
    return;
  }
  if (!fileWritesAllowed()) throw missingWriteConfigError("attach order");
  await mutate((s) => {
    const bid = s.bids.find((b) => b.id === bidId);
    if (bid) bid.crossmintOrderId = orderId;
  });
}

export async function patchBidDeposits(
  bidId: string,
  patch: Partial<Pick<Bid, "depositEvm" | "depositSol" | "crossmintOrderId">>,
): Promise<Bid | null> {
  const sql = pg();
  if (sql) {
    await sql`
      update bids set
        deposit_evm = coalesce(${patch.depositEvm ?? null}, deposit_evm),
        deposit_sol = coalesce(${patch.depositSol ?? null}, deposit_sol),
        crossmint_order_id = coalesce(${patch.crossmintOrderId ?? null}, crossmint_order_id)
      where id = ${bidId}
    `;
    return getBid(bidId);
  }
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("bids")
      .update({
        deposit_evm: patch.depositEvm,
        deposit_sol: patch.depositSol,
        crossmint_order_id: patch.crossmintOrderId,
      })
      .eq("id", bidId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? bidFromRow(data) : null;
  }
  if (!fileWritesAllowed()) throw missingWriteConfigError("save deposit addresses");
  return mutate((s) => {
    const bid = s.bids.find((b) => b.id === bidId);
    if (!bid) return null;
    Object.assign(bid, patch);
    return bid;
  });
}

export async function getBidByDepositAddress(address: string): Promise<Bid | null> {
  const sql = pg();
  if (sql) {
    const rows = await sql`
      select * from bids
      where deposit_evm = ${address} or deposit_sol = ${address}
      limit 1
    `;
    return rows[0] ? bidFromRow(rows[0] as Record<string, unknown>) : null;
  }
  const sb = supabaseAdmin() ?? supabase();
  if (sb) {
    const { data, error } = await sb
      .from("bids")
      .select("*")
      .or(`deposit_evm.eq.${address},deposit_sol.eq.${address}`)
      .maybeSingle();
    if (error) throw error;
    if (data) return bidFromRow(data);
  }
  const store = await loadFile();
  return store.bids.find((b) => b.depositEvm === address || b.depositSol === address) ?? null;
}

export async function applyPaidBid(opts: {
  bidId?: string;
  orderId?: string;
}): Promise<{ listing: Listing; activity: ActivityItem } | null> {
  const apply = async (s: { listings: Listing[]; bids: Bid[]; activity: ActivityItem[] }) => {
    const bid = s.bids.find((b) =>
      opts.bidId ? b.id === opts.bidId : opts.orderId ? b.crossmintOrderId === opts.orderId : false,
    );
    if (!bid) return null;
    if (bid.status === "paid") {
      const listing = s.listings.find((l) => l.id === bid.listingId);
      return listing ? { listing, activity: s.activity[0] } : null;
    }

    const now = new Date().toISOString();
    let listing = bid.listingId
      ? s.listings.find((l) => l.id === bid.listingId)
      : s.listings.find((l) => l.canonicalKey === bid.canonicalKey);

    const kind = listing ? "raised" : "claimed";

    if (!listing) {
      listing = {
        id: crypto.randomUUID(),
        canonicalKey: bid.canonicalKey,
        url: bid.url,
        handle: bid.url.includes("x.com/") ? `@${bid.url.split("x.com/")[1]}` : null,
        name: new URL(bid.url).hostname.replace(/^www\./, ""),
        description: "",
        faviconUrl: `https://www.google.com/s2/favicons?domain=${new URL(bid.url).hostname}&sz=64`,
        ogImageUrl: null,
        category: bid.category,
        bidUsd: bid.targetBidUsd,
        clickCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      s.listings.push(listing);
      bid.listingId = listing.id;
    } else {
      listing.bidUsd = bid.targetBidUsd;
      listing.category = bid.category;
      listing.updatedAt = now;
    }

    bid.status = "paid";
    bid.paidAt = now;
    if (opts.orderId) bid.crossmintOrderId = opts.orderId;

    const ranked = rankListings(s.listings);
    const placed = ranked.find((l) => l.id === listing!.id)!;
    const activity: ActivityItem = {
      id: crypto.randomUUID(),
      listingId: listing.id,
      name: listing.name,
      rank: placed.rank,
      bidUsd: listing.bidUsd,
      kind,
      createdAt: now,
    };
    s.activity.unshift(activity);
    s.activity = s.activity.slice(0, 50);
    return { listing, activity };
  };

  const sql = pg();
  if (sql) {
    const listings = await getListings();
    const bidRows = await sql`select * from bids`;
    const local = {
      listings,
      bids: bidRows.map((row) => bidFromRow(row as Record<string, unknown>)),
      activity: [] as ActivityItem[],
    };
    const result = await apply(local);
    if (!result) return null;
    const listingRow = toRow(result.listing);
    await sql`
      insert into listings ${sql(listingRow)}
      on conflict (id) do update set
        bid_usd = excluded.bid_usd,
        category = excluded.category,
        updated_at = excluded.updated_at,
        name = excluded.name,
        description = excluded.description,
        favicon_url = excluded.favicon_url,
        og_image_url = excluded.og_image_url
    `;
    const bid = local.bids.find((b) => b.id === opts.bidId || b.crossmintOrderId === opts.orderId);
    if (bid) {
      const bidRow = bidToRow(bid);
      await sql`update bids set ${sql(bidRow)} where id = ${bid.id}`;
    }
    await sql`
      insert into activity (id, listing_id, name, rank, bid_usd, kind, created_at)
      values (
        ${result.activity.id},
        ${result.activity.listingId},
        ${result.activity.name},
        ${result.activity.rank},
        ${result.activity.bidUsd},
        ${result.activity.kind},
        ${result.activity.createdAt}
      )
    `;
    return result;
  }

  const sb = supabaseAdmin();
  if (sb) {
    const local: { listings: Listing[]; bids: Bid[]; activity: ActivityItem[] } = {
      listings: await getListings(),
      bids: [],
      activity: [],
    };
    const { data: bids } = await sb.from("bids").select("*");
    local.bids = (bids ?? []).map(bidFromRow);
    const result = await apply(local);
    if (!result) return null;
    const listingRes = await sb.from("listings").upsert(toRow(result.listing));
    if (listingRes.error) throw new Error(listingRes.error.message);
    const bid = local.bids.find((b) => b.id === opts.bidId || b.crossmintOrderId === opts.orderId);
    if (bid) {
      const bidRes = await sb.from("bids").update(bidToRow(bid)).eq("id", bid.id);
      if (bidRes.error) throw new Error(bidRes.error.message);
    }
    const activityRes = await sb.from("activity").insert({
      id: result.activity.id,
      listing_id: result.activity.listingId,
      name: result.activity.name,
      rank: result.activity.rank,
      bid_usd: result.activity.bidUsd,
      kind: result.activity.kind,
      created_at: result.activity.createdAt,
    });
    if (activityRes.error) throw new Error(activityRes.error.message);
    return result;
  }

  if (!fileWritesAllowed()) throw missingWriteConfigError("settle bid");
  return mutate((s) => apply(s));
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

function toRow(l: Listing) {
  return {
    id: l.id,
    canonical_key: l.canonicalKey,
    url: l.url,
    handle: l.handle,
    name: l.name,
    description: l.description,
    favicon_url: l.faviconUrl,
    og_image_url: l.ogImageUrl,
    category: l.category,
    bid_usd: l.bidUsd,
    click_count: l.clickCount,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  };
}

function bidFromRow(row: Record<string, unknown>): Bid {
  return {
    id: String(row.id),
    listingId: (row.listing_id as string | null) ?? null,
    canonicalKey: String(row.canonical_key),
    url: String(row.url),
    category: row.category as Bid["category"],
    targetBidUsd: Number(row.target_bid_usd),
    amountDueUsd: Number(row.amount_due_usd),
    kind: row.kind as Bid["kind"],
    status: row.status as Bid["status"],
    crossmintOrderId: (row.crossmint_order_id as string | null) ?? null,
    depositEvm: (row.deposit_evm as string | null) ?? null,
    depositSol: (row.deposit_sol as string | null) ?? null,
    createdAt: String(row.created_at),
    paidAt: (row.paid_at as string | null) ?? null,
  };
}

function bidToRow(b: Bid) {
  return {
    id: b.id,
    listing_id: b.listingId,
    canonical_key: b.canonicalKey,
    url: b.url,
    category: b.category,
    target_bid_usd: b.targetBidUsd,
    amount_due_usd: b.amountDueUsd,
    kind: b.kind,
    status: b.status,
    crossmint_order_id: b.crossmintOrderId,
    deposit_evm: b.depositEvm,
    deposit_sol: b.depositSol,
    created_at: b.createdAt,
    paid_at: b.paidAt,
  };
}
