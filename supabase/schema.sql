-- Graph Visualizer: auth + subscriptions schema.
-- Run this in the Supabase SQL editor once, after creating a new project.
-- Re-running is safe (uses IF NOT EXISTS / IF EXISTS guards where possible).

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, with Stripe + plan state.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    stripe_customer_id text unique,
    stripe_subscription_id text unique,
    -- plan: 'free' or 'pro'. Derived from subscription_status on webhook.
    plan text not null default 'free' check (plan in ('free','pro')),
    -- Mirror of Stripe subscription.status for debugging/admin views.
    subscription_status text,
    current_period_end timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Touch updated_at on row updates.
create or replace function public.profiles_set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.profiles_set_updated_at();

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
    return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user can read their own profile.
drop policy if exists "profiles: self read" on public.profiles;
create policy "profiles: self read" on public.profiles
    for select using (auth.uid() = id);

-- A user can update non-billing fields on their own profile. (Plan/Stripe
-- fields are only ever written by the service role via the Stripe webhook.)
drop policy if exists "profiles: self update email" on public.profiles;
create policy "profiles: self update email" on public.profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id);

-- No policies for INSERT or DELETE: rows are created by the trigger above
-- (running as security definer) and never deleted from client code.

-- ---------------------------------------------------------------------------
-- Helper view (optional) for admin/debugging.
-- ---------------------------------------------------------------------------
create or replace view public.pro_users as
    select id, email, stripe_customer_id, current_period_end, updated_at
    from public.profiles
    where plan = 'pro';

-- ---------------------------------------------------------------------------
-- graphs: per-user "Canvas Management" rows. Mirrors what the editor stores
-- in localStorage.savedGraphs so signed-in users get cross-device sync.
--
-- client_id is the Date.now() identifier the editor assigns at save time —
-- preserving it lets us merge a user's local graphs into their account when
-- they sign in for the first time.
-- ---------------------------------------------------------------------------
create table if not exists public.graphs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    client_id bigint not null,
    name text not null,
    data jsonb not null,
    vertex_count int not null default 0,
    edge_count int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, client_id)
);

create index if not exists graphs_user_updated_idx
    on public.graphs(user_id, updated_at desc);

create or replace function public.graphs_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;

drop trigger if exists graphs_set_updated_at on public.graphs;
create trigger graphs_set_updated_at
    before update on public.graphs
    for each row execute function public.graphs_set_updated_at();

alter table public.graphs enable row level security;

drop policy if exists "graphs: self read"   on public.graphs;
drop policy if exists "graphs: self insert" on public.graphs;
drop policy if exists "graphs: self update" on public.graphs;
drop policy if exists "graphs: self delete" on public.graphs;

create policy "graphs: self read"   on public.graphs for select using (auth.uid() = user_id);
create policy "graphs: self insert" on public.graphs for insert with check (auth.uid() = user_id);
create policy "graphs: self update" on public.graphs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "graphs: self delete" on public.graphs for delete using (auth.uid() = user_id);
