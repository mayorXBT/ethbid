create table if not exists listings (
  id uuid primary key,
  canonical_key text unique not null,
  url text not null,
  handle text,
  name text not null,
  description text not null default '',
  favicon_url text,
  og_image_url text,
  category text not null,
  bid_usd integer not null check (bid_usd >= 1),
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bids (
  id uuid primary key,
  listing_id uuid references listings(id),
  canonical_key text not null,
  url text not null,
  category text not null,
  target_bid_usd integer not null,
  amount_due_usd integer not null,
  kind text not null check (kind in ('new', 'raise')),
  status text not null check (status in ('pending', 'paid', 'failed', 'expired')),
  crossmint_order_id text unique,
  deposit_evm text,
  deposit_sol text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists activity (
  id uuid primary key,
  listing_id uuid references listings(id),
  name text not null,
  rank integer not null,
  bid_usd integer not null,
  kind text not null check (kind in ('claimed', 'raised')),
  created_at timestamptz not null default now()
);

-- One row per browser cookie. Online = last_seen within 60s. Visitors = row count.
create table if not exists visitors (
  visitor_id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create index if not exists listings_bid_idx on listings (bid_usd desc, created_at asc);
create index if not exists activity_created_idx on activity (created_at desc);
create index if not exists bids_status_idx on bids (status);
create index if not exists bids_deposit_evm_idx on bids (deposit_evm);
create index if not exists bids_deposit_sol_idx on bids (deposit_sol);
create index if not exists visitors_last_seen_idx on visitors (last_seen desc);

alter table listings enable row level security;
alter table bids enable row level security;
alter table activity enable row level security;
alter table visitors enable row level security;

create policy "public read listings" on listings for select using (true);
create policy "public read activity" on activity for select using (true);
