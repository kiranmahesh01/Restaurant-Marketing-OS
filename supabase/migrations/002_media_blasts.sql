-- Media library + message blasts (SMS/email) for multi-tenant scale

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  mime_type text,
  size_bytes int default 0,
  url text not null,
  kind text default 'image',
  width int,
  height int,
  source text default 'upload',
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.message_blasts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('sms','email')),
  segment text not null default 'all_opted_in',
  subject text,
  body text not null,
  offer_id uuid references public.offers(id) on delete set null,
  offer_code text,
  status text not null default 'draft',
  audience_count int default 0,
  sent_count int default 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  demo boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_restaurant on public.media_assets(restaurant_id, created_at desc);
create index if not exists idx_blasts_restaurant on public.message_blasts(restaurant_id, created_at desc);

alter table public.media_assets enable row level security;
alter table public.message_blasts enable row level security;

drop policy if exists media_member_all on public.media_assets;
create policy media_member_all on public.media_assets
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

drop policy if exists blasts_member_all on public.message_blasts;
create policy blasts_member_all on public.message_blasts
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

-- Org-level rollup helper for 100–1000 locations
create or replace view public.v_restaurant_health as
select
  r.id as restaurant_id,
  r.org_id,
  r.name,
  r.city,
  r.state,
  (select count(*) from public.content_items c where c.restaurant_id = r.id) as content_count,
  (select count(*) from public.offers o where o.restaurant_id = r.id and o.status = 'active') as active_offers,
  (select count(*) from public.customers g where g.restaurant_id = r.id) as guest_count,
  (select count(*) from public.orders ord where ord.restaurant_id = r.id) as order_count
from public.restaurants r;
