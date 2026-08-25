alter table bids add column if not exists payment_provider text not null default 'crossmint';
alter table bids add column if not exists payment_id text;
alter table bids add column if not exists payment_url text;

update bids set payment_provider = 'crossmint' where payment_provider is null;

alter table bids drop constraint if exists bids_payment_provider_check;
alter table bids add constraint bids_payment_provider_check check (payment_provider in ('crossmint', 'moonpay'));

create unique index if not exists bids_payment_id_unique_idx on bids (payment_id) where payment_id is not null;
