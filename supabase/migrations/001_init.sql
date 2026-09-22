-- Restaurant Marketing OS — initial schema
-- Multi-tenant: every business table is restaurant-scoped.
-- Enable RLS and policies assume auth.uid() maps to profiles.id

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Orgs & restaurants
-- ---------------------------------------------------------------------------
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  slug text not null,
  cuisine text,
  city text,
  state text,
  timezone text default 'America/Los_Angeles',
  logo_url text,
  brand_voice text,
  brand_primary text default '#ea580c',
  brand_secondary text default '#0f172a',
  locations int default 1,
  website text,
  phone text,
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'owner' check (role in ('owner','manager','marketer','viewer')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_members (
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'manager',
  primary key (restaurant_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Content & campaigns
-- ---------------------------------------------------------------------------
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  body text not null,
  hashtags text[] default '{}',
  platforms text[] default '{}',
  status text not null default 'draft'
    check (status in ('draft','pending_approval','approved','scheduled','published','rejected','failed')),
  media_urls text[] default '{}',
  media_type text default 'none',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by text,
  approved_by text,
  rejection_reason text,
  ai_generated boolean default false,
  campaign_id uuid,
  offer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  objective text,
  status text default 'draft',
  budget numeric default 0,
  spent numeric default 0,
  channels text[] default '{}',
  start_at timestamptz,
  end_at timestamptz,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  type text not null,
  value numeric not null default 0,
  channels text[] default '{}',
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  min_order numeric,
  max_redemptions int,
  redemptions int default 0,
  revenue_attributed numeric default 0,
  audience text default 'all',
  stackable boolean default false,
  created_at timestamptz not null default now(),
  unique (restaurant_id, code)
);

-- ---------------------------------------------------------------------------
-- CRM / POS / reviews
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  tier text default 'bronze',
  points int default 0,
  lifetime_spend numeric default 0,
  visit_count int default 0,
  last_visit_at timestamptz,
  tags text[] default '{}',
  source text,
  birthday date,
  marketing_opt_in boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  external_id text not null,
  channel text,
  pos_source text,
  customer_id uuid references public.customers(id),
  customer_name text,
  items jsonb default '[]'::jsonb,
  subtotal numeric,
  tax numeric,
  tip numeric,
  total numeric not null,
  offer_code text,
  status text default 'completed',
  ordered_at timestamptz not null default now()
);

create unique index if not exists orders_restaurant_external
  on public.orders (restaurant_id, external_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  platform text,
  rating int check (rating between 1 and 5),
  author text,
  body text,
  replied boolean default false,
  reply_body text,
  sentiment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Integrations, notifications, audit
-- ---------------------------------------------------------------------------
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  provider text not null,
  category text,
  status text default 'disconnected',
  last_sync_at timestamptz,
  config jsonb default '{}'::jsonb,
  env_keys text[] default '{}',
  created_at timestamptz not null default now(),
  unique (restaurant_id, provider)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid references public.profiles(id),
  type text,
  title text not null,
  body text,
  read boolean default false,
  href text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  actor text,
  action text not null,
  entity_type text,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  storage_path text not null,
  public_url text,
  mime_type text,
  width int,
  height int,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_restaurant_member(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurant_members m
    where m.restaurant_id = rid and m.user_id = auth.uid()
  );
$$;

alter table public.restaurants enable row level security;
alter table public.content_items enable row level security;
alter table public.offers enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.integrations enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.campaigns enable row level security;
alter table public.media_assets enable row level security;
alter table public.restaurant_members enable row level security;

create policy restaurants_member_select on public.restaurants
  for select using (public.is_restaurant_member(id));

create policy content_member_all on public.content_items
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy offers_member_all on public.offers
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy customers_member_all on public.customers
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy orders_member_all on public.orders
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy reviews_member_all on public.reviews
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy integrations_member_all on public.integrations
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy notifications_member_all on public.notifications
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy audit_member_select on public.audit_logs
  for select using (public.is_restaurant_member(restaurant_id));

create policy campaigns_member_all on public.campaigns
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy media_member_all on public.media_assets
  for all using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy members_self_select on public.restaurant_members
  for select using (user_id = auth.uid() or public.is_restaurant_member(restaurant_id));

-- Indexes
create index if not exists idx_content_restaurant on public.content_items(restaurant_id, status);
create index if not exists idx_offers_restaurant on public.offers(restaurant_id, status);
create index if not exists idx_customers_restaurant on public.customers(restaurant_id);
create index if not exists idx_orders_restaurant_ordered on public.orders(restaurant_id, ordered_at desc);
create index if not exists idx_audit_restaurant on public.audit_logs(restaurant_id, created_at desc);
