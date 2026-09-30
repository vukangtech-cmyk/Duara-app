-- THE CIRCLE DUARA - Commerce, Ads, Catalogues & Production Database Readiness
-- Migration: 20260923000000_commerce_ads_and_production_readiness.sql

-- 1. Ensure extensions
create extension if not exists pgcrypto;

-- 2. Enhance profiles table with commerce & location fields
alter table public.profiles
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists location text default 'Dar es Salaam, Tanzania',
  add column if not exists business_name text default '',
  add column if not exists category text default '',
  add column if not exists role text not null default 'customer',
  add column if not exists verified boolean default false;

-- Ensure role constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer', 'manager', 'ceo'));

-- 3. Robust Auth Trigger to automatically create profile and wallet on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  assigned_role := case
    when new.raw_user_meta_data->>'role' in ('manager', 'customer') then new.raw_user_meta_data->>'role'
    else 'customer'
  end;

  insert into public.profiles (
    id,
    username,
    display_name,
    phone,
    whatsapp,
    role,
    location,
    business_name,
    category
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user_' || substr(replace(new.id::text, '-', ''), 1, 10)),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    assigned_role,
    coalesce(new.raw_user_meta_data->>'location', 'Dar es Salaam, Tanzania'),
    coalesce(new.raw_user_meta_data->>'business_name', ''),
    coalesce(new.raw_user_meta_data->>'category', '')
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    whatsapp = coalesce(nullif(excluded.whatsapp, ''), public.profiles.whatsapp),
    location = coalesce(nullif(excluded.location, ''), public.profiles.location),
    business_name = coalesce(nullif(excluded.business_name, ''), public.profiles.business_name),
    category = coalesce(nullif(excluded.category, ''), public.profiles.category);

  -- Initialize wallet account for user
  insert into public.wallet_accounts (user_id, currency, balance)
  values (new.id, 'TZS', 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Customer Ads Table
create table if not exists public.customer_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  price numeric(14,2) not null default 0 check (price >= 0),
  currency text not null default 'TZS',
  category text not null default 'General',
  description text not null default '',
  image_url text,
  location text default 'Dar es Salaam',
  phone text,
  whatsapp text,
  status text not null default 'active',
  paid_amount numeric(14,2) default 0,
  payment_status text default 'pending_verification',
  views_count integer default 0,
  clicks_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_ads_user_id_idx on public.customer_ads(user_id);
create index if not exists customer_ads_status_idx on public.customer_ads(status);
create index if not exists customer_ads_created_at_idx on public.customer_ads(created_at desc);

alter table public.customer_ads enable row level security;

drop policy if exists customer_ads_read on public.customer_ads;
create policy customer_ads_read on public.customer_ads
  for select to authenticated using (true);

drop policy if exists customer_ads_insert on public.customer_ads;
create policy customer_ads_insert on public.customer_ads
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists customer_ads_update on public.customer_ads;
create policy customer_ads_update on public.customer_ads
  for update to authenticated using (user_id = auth.uid() or public.is_ceo());

drop policy if exists customer_ads_delete on public.customer_ads;
create policy customer_ads_delete on public.customer_ads
  for delete to authenticated using (user_id = auth.uid() or public.is_ceo());

-- 5. Manager Catalogues Table
create table if not exists public.catalogues (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  title text,
  description text default '',
  price numeric(14,2) not null default 0 check (price >= 0),
  original_price numeric(14,2),
  currency text not null default 'TZS',
  commission_rate numeric(5,2) default 10,
  category text default 'General',
  image_url text,
  images jsonb default '[]'::jsonb,
  whatsapp_number text,
  affiliate_code text unique,
  in_stock boolean default true,
  views_count integer default 0,
  orders_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalogues_manager_id_idx on public.catalogues(manager_id);
create index if not exists catalogues_created_at_idx on public.catalogues(created_at desc);

alter table public.catalogues enable row level security;

drop policy if exists catalogues_read on public.catalogues;
create policy catalogues_read on public.catalogues
  for select to authenticated using (true);

drop policy if exists catalogues_insert on public.catalogues;
create policy catalogues_insert on public.catalogues
  for insert to authenticated with check (
    manager_id = auth.uid() and exists (
      select 1 from public.profiles where id = auth.uid() and role in ('manager', 'ceo')
    )
  );

drop policy if exists catalogues_update on public.catalogues;
create policy catalogues_update on public.catalogues
  for update to authenticated using (manager_id = auth.uid() or public.is_ceo());

drop policy if exists catalogues_delete on public.catalogues;
create policy catalogues_delete on public.catalogues
  for delete to authenticated using (manager_id = auth.uid() or public.is_ceo());

-- 6. Affiliate Orders Table
create table if not exists public.affiliate_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.catalogues(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_location text,
  quantity integer default 1,
  total_amount numeric(14,2) default 0,
  commission_amount numeric(14,2) default 0,
  currency text default 'TZS',
  status text default 'completed',
  payment_reference text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_orders_manager_id_idx on public.affiliate_orders(manager_id);

alter table public.affiliate_orders enable row level security;

drop policy if exists affiliate_orders_read on public.affiliate_orders;
create policy affiliate_orders_read on public.affiliate_orders
  for select to authenticated using (manager_id = auth.uid() or public.is_ceo());

drop policy if exists affiliate_orders_insert on public.affiliate_orders;
create policy affiliate_orders_insert on public.affiliate_orders
  for insert to authenticated with check (true);

-- 7. Payout Requests Table
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'TZS',
  method text not null,
  account_number text not null,
  status text not null default 'pending' check (status in ('pending','approved','completed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payout_requests_manager_id_idx on public.payout_requests(manager_id);

alter table public.payout_requests enable row level security;

drop policy if exists payout_requests_read on public.payout_requests;
create policy payout_requests_read on public.payout_requests
  for select to authenticated using (manager_id = auth.uid() or public.is_ceo());

drop policy if exists payout_requests_insert on public.payout_requests;
create policy payout_requests_insert on public.payout_requests
  for insert to authenticated with check (manager_id = auth.uid());

drop policy if exists payout_requests_update on public.payout_requests;
create policy payout_requests_update on public.payout_requests
  for update to authenticated using (public.is_ceo());

-- 8. Platform Settings Table
create table if not exists public.platform_settings (
  id text primary key default 'primary',
  platform_name text not null default 'THE CIRCLE DUARA Affiliate Network',
  ceo_name text not null default 'HAMZA VUKANG',
  ceo_email text not null default 'vukangtech@gmail.com',
  default_commission_rate numeric(5,2) not null default 10,
  ad_posting_fee numeric(14,2) not null default 5000,
  ad_boost_fee numeric(14,2) not null default 15000,
  payment_numbers jsonb not null default '{"mpesa":"554433","tigopesa":"778899","airtel":"992211","halopesa":"332211"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_read on public.platform_settings;
create policy platform_settings_read on public.platform_settings
  for select to authenticated using (true);

drop policy if exists platform_settings_update on public.platform_settings;
create policy platform_settings_update on public.platform_settings
  for update to authenticated using (public.is_ceo());

insert into public.platform_settings (id, platform_name, ceo_name, ceo_email)
values ('primary', 'THE CIRCLE DUARA Affiliate Network', 'HAMZA VUKANG', 'vukangtech@gmail.com')
on conflict (id) do nothing;

-- 9. Wallet Accounts and Transactions Table Hardening
alter table public.wallet_transactions
  add column if not exists description text;

alter table public.wallet_transactions drop constraint if exists wallet_transactions_type_check;
alter table public.wallet_transactions add constraint wallet_transactions_type_check check (char_length(type) > 0);

alter table public.wallet_transactions drop constraint if exists wallet_transactions_status_check;

-- Ensure wallet policies allow updates and inserts
drop policy if exists wallet_account_owner_insert on public.wallet_accounts;
create policy wallet_account_owner_insert on public.wallet_accounts
  for insert to authenticated with check (user_id = auth.uid() or public.is_ceo());

drop policy if exists wallet_account_owner_update on public.wallet_accounts;
create policy wallet_account_owner_update on public.wallet_accounts
  for update to authenticated using (user_id = auth.uid() or public.is_ceo())
  with check (user_id = auth.uid() or public.is_ceo());

drop policy if exists wallet_transaction_owner_insert on public.wallet_transactions;
create policy wallet_transaction_owner_insert on public.wallet_transactions
  for insert to authenticated with check (user_id = auth.uid() or public.is_ceo());

-- 10. Enable Realtime Publications
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'customer_ads') then
    alter publication supabase_realtime add table public.customer_ads;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'catalogues') then
    alter publication supabase_realtime add table public.catalogues;
  end if;
exception when others then
  null;
end $$;

-- 11. Storage Buckets Setup
insert into storage.buckets (id, name, public)
values
  ('post-media', 'post-media', true),
  ('ads-media', 'ads-media', true),
  ('catalogue-media', 'catalogue-media', true),
  ('reels', 'reels', true),
  ('statuses', 'statuses', true),
  ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Storage object policies
drop policy if exists "Public Access Storage" on storage.objects;
create policy "Public Access Storage" on storage.objects
  for select using (bucket_id in ('post-media', 'ads-media', 'catalogue-media', 'reels', 'statuses', 'avatars'));

drop policy if exists "Authenticated User Upload Storage" on storage.objects;
create policy "Authenticated User Upload Storage" on storage.objects
  for insert to authenticated with check (bucket_id in ('post-media', 'ads-media', 'catalogue-media', 'reels', 'statuses', 'avatars'));
