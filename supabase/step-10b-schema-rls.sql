-- ============================================================
-- STEP 10B — SKRIP SQL LENGKAP (v3 — FIX infinite recursion)
-- Jalankan SEKALI di Supabase SQL Editor. Idempoten.
-- ============================================================

-- ============ LANGKAH 0: Hapus SEMUA policy lama pada profiles ============
-- Ini mencegah konflik/recursion dari policy lama
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- ============ FUNGSI is_owner — baca dari auth.users, BUKAN profiles ============
-- Membaca dari auth.users (tanpa RLS) → menghindari infinite recursion
create or replace function public.is_owner() returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
    and raw_user_meta_data->>'role' = 'owner'
  );
$$;

-- ============ PROFILES — pastikan tabel ada + kolom lengkap ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text,
  role text default 'user',
  status text default 'active',
  avatar_url text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Pastikan owner benar di profiles
insert into public.profiles (id, email, username, role, status)
select id, email, 'DayaMart', 'owner', 'approved'
from auth.users
where email = 'dayamartweb@gmail.com'
on conflict (id) do update
  set role = 'owner',
      status = 'approved',
      updated_at = now();

-- Pastikan auth metadata juga ada role=owner (ini yang dibaca is_owner)
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "owner"}'::jsonb
where email = 'dayamartweb@gmail.com';

-- ============ SETTINGS ============
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- ============ PRODUCTS (lengkap + kolom tambahan) ============
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  category text,
  brand text,
  name text not null,
  provider_code text,
  price_modal numeric default 0,
  price_sell numeric default 0,
  profit_type text default 'fixed',
  profit_value numeric default 0,
  stock integer default 0,
  image_url text,
  game_key text,
  game_slug text,
  game_name text,
  currency_label text,
  description text,
  is_active boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.products add column if not exists profit_type text default 'fixed';
alter table public.products add column if not exists profit_value numeric default 0;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists game_key text;
alter table public.products add column if not exists game_slug text;
alter table public.products add column if not exists game_name text;
alter table public.products add column if not exists currency_label text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists stock integer default 0;
alter table public.products add column if not exists provider_code text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists sort_order integer default 0;

-- ============ TABEL LAINNYA ============
create table if not exists public.product_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  plan_name text not null,
  price numeric default 0,
  stock integer default 0,
  is_active boolean default true
);

create table if not exists public.game_input_templates (
  game_key text primary key,
  game_name text,
  currency_label text,
  input_schema jsonb
);

create table if not exists public.nokos_apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.nokos_countries (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references public.nokos_apps(id) on delete cascade,
  country_name text not null,
  flag_url text,
  price numeric default 0,
  stock integer default 0,
  is_active boolean default true
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  is_active boolean default true,
  sort_order integer default 0
);

create table if not exists public.message_templates (
  key text primary key,
  content text not null,
  updated_at timestamptz default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text,
  image_mobile_url text,
  link text,
  sort_order integer default 0,
  is_active boolean default true,
  focal text default 'center'
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  order_code text,
  product_id uuid,
  module text,
  product_name text,
  name text,
  amount numeric default 0,
  target_input text,
  quantity integer,
  buyer_name text,
  buyer_phone text,
  status_payment text default 'pending',
  payment_status text default 'pending',
  status_process text default 'waiting',
  process_status text default 'waiting',
  provider_ref text,
  serial_number text,
  format_copied boolean default false,
  meta jsonb,
  created_at timestamptz default now()
);

alter table public.orders add column if not exists product_name text;
alter table public.orders add column if not exists buyer_name text;
alter table public.orders add column if not exists buyer_phone text;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists process_status text default 'waiting';

create table if not exists public.provider_balances (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  balance numeric default 0,
  currency text default 'IDR',
  checked_at timestamptz default now()
);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text,
  action text,
  total_items integer,
  status text,
  error_message text,
  created_at timestamptz default now()
);

-- ============ RLS: BACA untuk semua login, TULIS hanya owner ============
-- Untuk tabel-tabel NON-profiles, pakai is_owner() (aman, baca auth.users)
do $$
declare t text;
begin
  foreach t in array array[
    'settings','products','product_plans','game_input_templates',
    'nokos_apps','nokos_countries','faqs','message_templates','banners',
    'provider_balances','sync_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists sel_auth on public.%I', t);
    execute format(
      'create policy sel_auth on public.%I for select to authenticated using (true)', t
    );
    execute format('drop policy if exists own_write on public.%I', t);
    execute format(
      'create policy own_write on public.%I for all to authenticated using (public.is_owner()) with check (public.is_owner())', t
    );
  end loop;
end $$;

-- ============ PROFILES RLS (policy bersih, TANPA recursion) ============
alter table public.profiles enable row level security;

-- Semua user login bisa baca profiles
create policy profiles_sel on public.profiles
  for select to authenticated using (true);

-- Insert: hanya untuk diri sendiri (register)
create policy profiles_ins on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Update: diri sendiri ATAU owner (is_owner sekarang baca auth.users, bukan profiles)
create policy profiles_upd on public.profiles
  for update to authenticated using (auth.uid() = id or public.is_owner());

-- Delete: hanya owner, tidak bisa hapus diri sendiri
create policy profiles_del on public.profiles
  for delete to authenticated using (public.is_owner() and id <> auth.uid());

-- ============ ORDERS RLS ============
alter table public.orders enable row level security;
drop policy if exists orders_sel on public.orders;
create policy orders_sel on public.orders for select to authenticated
  using (public.is_owner() or user_id = auth.uid());
drop policy if exists orders_ins on public.orders;
create policy orders_ins on public.orders for insert to authenticated
  with check (true);
drop policy if exists orders_upd on public.orders;
create policy orders_upd on public.orders for update to authenticated
  using (public.is_owner() or user_id = auth.uid());

-- ============ STORAGE ============
insert into storage.buckets (id, name, public)
  values ('brand-logos', 'brand-logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('banners', 'banners', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('products', 'products', true) on conflict (id) do nothing;

drop policy if exists storage_read on storage.objects;
create policy storage_read on storage.objects for select to public
  using (bucket_id in ('brand-logos', 'avatars', 'banners', 'products'));
drop policy if exists storage_write on storage.objects;
create policy storage_write on storage.objects for insert to authenticated
  with check (bucket_id in ('brand-logos', 'avatars', 'banners', 'products'));
drop policy if exists storage_upd on storage.objects;
create policy storage_upd on storage.objects for update to authenticated
  using (bucket_id in ('brand-logos', 'avatars', 'banners', 'products'));
drop policy if exists storage_del on storage.objects;
create policy storage_del on storage.objects for delete to authenticated
  using (bucket_id in ('brand-logos', 'avatars', 'banners', 'products'));

-- ============ SELESAI ============
-- Sekarang is_owner() baca dari auth.users metadata (bukan profiles),
-- sehingga TIDAK ada infinite recursion.
-- Jalankan halaman Diagnosa untuk memverifikasi semua ✅.
