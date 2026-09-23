-- Isolated tables: does not modify existing application tables or policies.
-- All business mutations go through the authenticated server, never direct client writes.
begin;
create table if not exists public.rmos_workspaces (
 id uuid primary key default gen_random_uuid(),
 restaurant jsonb not null,
 state jsonb not null default '{}'::jsonb,
 version integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint rmos_state_object check(jsonb_typeof(state)='object'),
 constraint rmos_restaurant_identity check(restaurant->>'id'=id::text)
);
create table if not exists public.rmos_members (
 workspace_id uuid not null references public.rmos_workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','manager','marketer','viewer')),
 primary key(workspace_id,user_id)
);
create index if not exists rmos_members_user_idx on public.rmos_members(user_id);
alter table public.rmos_workspaces enable row level security;
alter table public.rmos_members enable row level security;
revoke all on public.rmos_workspaces,public.rmos_members from anon,authenticated;
grant select on public.rmos_workspaces,public.rmos_members to authenticated;
grant all on public.rmos_workspaces,public.rmos_members to service_role;
drop policy if exists rmos_member_self on public.rmos_members;
create policy rmos_member_self on public.rmos_members for select to authenticated using(user_id=auth.uid());
drop policy if exists rmos_workspace_read on public.rmos_workspaces;
create policy rmos_workspace_read on public.rmos_workspaces for select to authenticated using(exists(select 1 from public.rmos_members m where m.workspace_id=id and m.user_id=auth.uid()));
create or replace function public.rmos_create_workspace(p_user uuid,p_restaurant jsonb,p_state jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare rid uuid := (p_restaurant->>'id')::uuid;
begin
 perform pg_advisory_xact_lock(hashtext(p_user::text));
 if (select count(*) from public.rmos_members where user_id=p_user and role='owner')>=20 then raise exception 'Restaurant limit reached'; end if;
 insert into public.rmos_workspaces(id,restaurant,state) values(rid,p_restaurant,p_state);
 insert into public.rmos_members(workspace_id,user_id,role) values(rid,p_user,'owner');
 return rid;
end; $$;
revoke all on function public.rmos_create_workspace(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.rmos_create_workspace(uuid,jsonb,jsonb) to service_role;
commit;
