-- Click counters keyed by listing id text so ETHBid 0x project ids work.
-- Longbid UUID listings keep listings.click_count; both can be incremented.

create table if not exists listing_clicks (
  listing_id text primary key,
  click_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists listing_clicks_count_idx on listing_clicks (click_count desc);

alter table listing_clicks enable row level security;

drop policy if exists "public read listing_clicks" on listing_clicks;
create policy "public read listing_clicks" on listing_clicks for select using (true);

create or replace function increment_listing_clicks(p_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into listing_clicks (listing_id, click_count)
  values (lower(p_id), 1)
  on conflict (listing_id)
  do update set
    click_count = listing_clicks.click_count + 1,
    updated_at = now()
  returning click_count into n;
  return n;
end;
$$;

revoke all on function increment_listing_clicks(text) from public;
grant execute on function increment_listing_clicks(text) to service_role;
