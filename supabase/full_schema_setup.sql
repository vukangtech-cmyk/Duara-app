-- =======================================================================
-- THE CIRCLE DUARA (TANZANIA & EAST AFRICA) - MASTER SUPABASE DATABASE SETUP
-- Run this whole script in Supabase Dashboard > SQL Editor > "Run"
-- =======================================================================

-- 1. EXTENSIONS
create extension if not exists pgcrypto;

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  cover_url text,
  phone text,
  whatsapp text,
  location text default 'Dar es Salaam, Tanzania',
  business_name text default '',
  category text default '',
  role text not null default 'customer' check (role in ('customer', 'manager', 'ceo')),
  verified boolean default false,
  website text default '',
  pronouns text default '',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. POSTS TABLE
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  media_url text,
  media_type text default 'image',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. FOLLOWS TABLE
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- 5. LIKES TABLE
create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- 6. POST KICKS TABLE
create table if not exists public.post_kicks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- 7. COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 8. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 9. STATUSES (STORIES) & INTERACTIONS
create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  background text not null default '#0f766e',
  media_url text,
  media_type text not null default 'text',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.status_views (
  status_id uuid not null references public.statuses(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (status_id, viewer_id)
);

create table if not exists public.status_reactions (
  status_id uuid not null references public.statuses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  primary key (status_id, user_id)
);

create table if not exists public.status_comments (
  id uuid primary key default gen_random_uuid(),
  status_id uuid not null references public.statuses(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 10. DIRECT MESSAGES, CONVERSATIONS & CALLS
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'direct',
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  signal_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 11. FRIEND REQUESTS, MARKETPLACE & REELS
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sender_id, recipient_id),
  check (sender_id <> recipient_id)
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'TZS',
  image_url text,
  location text,
  status text not null default 'active' check (status in ('active','sold','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  video_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

-- 12. USERS TABLE (MOCK PAYMENT & BALANCE TRACKING)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  user_balance numeric(14,2) not null default 0 check (user_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- WALLET SYSTEM (TZS MOBILE MONEY)
create table if not exists public.wallet_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  currency text not null default 'TZS',
  balance numeric(14,2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'TZS',
  status text not null default 'completed',
  reference text,
  description text,
  created_at timestamptz not null default now()
);

-- 13. CUSTOMER ADS TABLE (ADVERTISEMENT LISTINGS)
create table if not exists public.customer_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(14,2) not null default 0 check (price >= 0),
  currency text not null default 'TZS',
  category text not null default 'General',
  image_url text,
  affiliate_link text default '',
  external_url text default '',
  location text default 'Dar es Salaam',
  phone text,
  whatsapp text,
  status text not null default 'active' check (status in ('pending_payment','active','boosted','expired','archived')),
  paid_amount numeric(14,2) default 0,
  payment_status text default 'pending_verification',
  payment_method text,
  payment_ref text,
  views_count integer default 0,
  clicks_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. SHOP & AFFILIATE PRODUCTS TABLE (MANAGER CATALOGUES)
create table if not exists public.manager_catalogues (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  title text,
  description text not null default '',
  price numeric(14,2) not null default 0 check (price >= 0),
  original_price numeric(14,2),
  currency text not null default 'TZS',
  commission_rate numeric(5,2) not null default 10 check (commission_rate >= 0 and commission_rate <= 100),
  category text not null default 'Simu (Smartphones)',
  image_url text,
  images jsonb default '[]'::jsonb,
  whatsapp_number text,
  affiliate_code text unique,
  affiliate_url text default '',
  social_links jsonb not null default '{}'::jsonb,
  in_stock boolean not null default true,
  views_count integer default 0,
  orders_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  affiliate_url text default '',
  social_links jsonb not null default '{}'::jsonb,
  in_stock boolean default true,
  views_count integer default 0,
  orders_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. AFFILIATE ORDERS
create table if not exists public.affiliate_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.manager_catalogues(id) on delete set null,
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

-- 16. PAYOUT REQUESTS
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'TZS',
  method text not null,
  account_number text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 17. PLATFORM SETTINGS
create table if not exists public.platform_settings (
  id text primary key default 'primary',
  platform_name text not null default 'THE CIRCLE DUARA',
  ceo_name text not null default 'HAMZA VUKANG',
  ceo_email text not null default 'vukangtech@gmail.com',
  default_commission_rate numeric(5,2) not null default 10,
  ad_posting_fee numeric(14,2) not null default 5000,
  ad_boost_fee numeric(14,2) not null default 15000,
  payment_numbers jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, platform_name, ceo_name, ceo_email, payment_numbers, social_links)
values ('primary', 'THE CIRCLE DUARA', 'HAMZA VUKANG', 'vukangtech@gmail.com', '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

-- 18. FUNCTIONS & SECURITY TRIGGERS
create or replace function public.is_ceo()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ceo'
  );
$$;

create or replace function public.prevent_client_role_escalation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role and not public.is_ceo() then
    raise exception 'Role changes must be performed by an authorized server administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_client_role_escalation on public.profiles;
create trigger profiles_prevent_client_role_escalation
before update on public.profiles
for each row execute function public.prevent_client_role_escalation();

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
    when lower(coalesce(new.email, '')) = 'vukangtech@gmail.com' then 'ceo'
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

  -- Create wallet account
  insert into public.wallet_accounts (user_id, currency, balance)
  values (new.id, 'TZS', 0)
  on conflict (user_id) do nothing;

  -- Create users table record with user_balance
  insert into public.users (id, email, username, user_balance)
  values (new.id, new.email, clean_username, 0)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 19. ENABLE ROW LEVEL SECURITY
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.post_kicks enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.statuses enable row level security;
alter table public.status_views enable row level security;
alter table public.status_reactions enable row level security;
alter table public.status_comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.call_signals enable row level security;
alter table public.friend_requests enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.reels enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.customer_ads enable row level security;
alter table public.manager_catalogues enable row level security;
alter table public.catalogues enable row level security;
alter table public.affiliate_orders enable row level security;
alter table public.payout_requests enable row level security;
alter table public.platform_settings enable row level security;

-- 20. ROW LEVEL SECURITY POLICIES
-- Profiles
create policy "profiles_read" on public.profiles for select to authenticated using (true);
create policy "profiles_update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_ceo());

-- Posts
create policy "posts_read" on public.posts for select to authenticated using (true);
create policy "posts_insert" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "posts_update" on public.posts for update to authenticated using (author_id = auth.uid() or public.is_ceo());
create policy "posts_delete" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_ceo());

-- Follows, Likes, Comments, Kicks
create policy "follows_read" on public.follows for select to authenticated using (true);
create policy "follows_insert" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "follows_delete" on public.follows for delete to authenticated using (follower_id = auth.uid());

create policy "likes_read" on public.likes for select to authenticated using (true);
create policy "likes_insert" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes_delete" on public.likes for delete to authenticated using (user_id = auth.uid());

create policy "post_kicks_read" on public.post_kicks for select to authenticated using (true);
create policy "post_kicks_insert" on public.post_kicks for insert to authenticated with check (user_id = auth.uid());
create policy "post_kicks_delete" on public.post_kicks for delete to authenticated using (user_id = auth.uid());

create policy "comments_read" on public.comments for select to authenticated using (true);
create policy "comments_insert" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "comments_delete" on public.comments for delete to authenticated using (author_id = auth.uid() or public.is_ceo());

-- Notifications
create policy "notifications_read" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "notifications_insert" on public.notifications for insert to authenticated with check (true);
create policy "notifications_update" on public.notifications for update to authenticated using (recipient_id = auth.uid());

-- Statuses
create policy "statuses_read" on public.statuses for select to authenticated using (true);
create policy "statuses_insert" on public.statuses for insert to authenticated with check (user_id = auth.uid());
create policy "status_views_all" on public.status_views for all to authenticated using (true) with check (viewer_id = auth.uid());
create policy "status_reactions_all" on public.status_reactions for all to authenticated using (true) with check (user_id = auth.uid());
create policy "status_comments_all" on public.status_comments for all to authenticated using (true) with check (author_id = auth.uid());

-- Messaging
create policy "conversations_all" on public.conversations for all to authenticated using (true) with check (true);
create policy "conversation_members_all" on public.conversation_members for all to authenticated using (true) with check (true);
create policy "messages_all" on public.messages for all to authenticated using (true) with check (sender_id = auth.uid());
create policy "call_signals_all" on public.call_signals for all to authenticated using (true) with check (sender_id = auth.uid());

-- Friend Requests, Marketplace, Reels
create policy "friend_requests_all" on public.friend_requests for all to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "marketplace_read" on public.marketplace_listings for select to authenticated using (true);
create policy "marketplace_manage" on public.marketplace_listings for all to authenticated using (seller_id = auth.uid() or public.is_ceo());
create policy "reels_read" on public.reels for select to authenticated using (true);
create policy "reels_manage" on public.reels for all to authenticated using (creator_id = auth.uid() or public.is_ceo());

-- Users (user_balance)
create policy "users_read" on public.users for select to authenticated using (true);
create policy "users_insert" on public.users for insert to authenticated with check (id = auth.uid() or public.is_ceo());
create policy "users_update" on public.users for update to authenticated using (id = auth.uid() or public.is_ceo()) with check (id = auth.uid() or public.is_ceo());

-- Wallet
create policy "wallet_accounts_read" on public.wallet_accounts for select to authenticated using (user_id = auth.uid() or public.is_ceo());
create policy "wallet_accounts_insert" on public.wallet_accounts for insert to authenticated with check (user_id = auth.uid() or public.is_ceo());
create policy "wallet_accounts_update" on public.wallet_accounts for update to authenticated using (user_id = auth.uid() or public.is_ceo()) with check (user_id = auth.uid() or public.is_ceo());

create policy "wallet_transactions_read" on public.wallet_transactions for select to authenticated using (user_id = auth.uid() or public.is_ceo());
create policy "wallet_transactions_insert" on public.wallet_transactions for insert to authenticated with check (user_id = auth.uid() or public.is_ceo());

-- Customer Ads
create policy "customer_ads_read" on public.customer_ads for select to authenticated using (true);
create policy "customer_ads_insert" on public.customer_ads for insert to authenticated with check (user_id = auth.uid());
create policy "customer_ads_update" on public.customer_ads for update to authenticated using (user_id = auth.uid() or public.is_ceo());
create policy "customer_ads_delete" on public.customer_ads for delete to authenticated using (user_id = auth.uid() or public.is_ceo());

-- Shop & Manager Catalogues
create policy "manager_catalogues_read" on public.manager_catalogues for select to authenticated using (true);
create policy "manager_catalogues_insert" on public.manager_catalogues for insert to authenticated with check (manager_id = auth.uid() or public.is_ceo());
create policy "manager_catalogues_update" on public.manager_catalogues for update to authenticated using (manager_id = auth.uid() or public.is_ceo());
create policy "manager_catalogues_delete" on public.manager_catalogues for delete to authenticated using (manager_id = auth.uid() or public.is_ceo());

create policy "catalogues_read" on public.catalogues for select to authenticated using (true);
create policy "catalogues_insert" on public.catalogues for insert to authenticated with check (manager_id = auth.uid() or public.is_ceo());
create policy "catalogues_update" on public.catalogues for update to authenticated using (manager_id = auth.uid() or public.is_ceo());
create policy "catalogues_delete" on public.catalogues for delete to authenticated using (manager_id = auth.uid() or public.is_ceo());

-- Affiliate Orders & Payouts
create policy "affiliate_orders_read" on public.affiliate_orders for select to authenticated using (manager_id = auth.uid() or public.is_ceo());
create policy "affiliate_orders_insert" on public.affiliate_orders for insert to authenticated with check (true);

create policy "payout_requests_read" on public.payout_requests for select to authenticated using (manager_id = auth.uid() or public.is_ceo());
create policy "payout_requests_insert" on public.payout_requests for insert to authenticated with check (manager_id = auth.uid());
create policy "payout_requests_update" on public.payout_requests for update to authenticated using (public.is_ceo());

-- Platform Settings
create policy "platform_settings_read" on public.platform_settings for select to authenticated using (true);
create policy "platform_settings_insert" on public.platform_settings for insert to authenticated with check (public.is_ceo());
create policy "platform_settings_update" on public.platform_settings for update to authenticated using (public.is_ceo()) with check (public.is_ceo());

-- Direct Conversation Helper RPC
create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  conv_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select cm1.conversation_id into conv_id
  from public.conversation_members cm1
  join public.conversation_members cm2 on cm1.conversation_id = cm2.conversation_id
  join public.conversations c on c.id = cm1.conversation_id
  where cm1.user_id = current_user_id
    and cm2.user_id = other_user_id
    and c.kind = 'direct'
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations (created_by, kind)
  values (current_user_id, 'direct')
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (conv_id, current_user_id),
    (conv_id, other_user_id)
  on conflict do nothing;

  return conv_id;
end;
$$;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- 21. REALTIME PUBLICATIONS
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.call_signals;
alter publication supabase_realtime add table public.status_reactions;
alter publication supabase_realtime add table public.status_comments;
alter publication supabase_realtime add table public.customer_ads;
alter publication supabase_realtime add table public.catalogues;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.follows;

-- 22. STORAGE BUCKETS
insert into storage.buckets (id, name, public)
values
  ('post-media', 'post-media', true),
  ('ads-media', 'ads-media', true),
  ('catalogue-media', 'catalogue-media', true),
  ('reels', 'reels', true),
  ('statuses', 'statuses', true),
  ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Access Storage" on storage.objects;
create policy "Public Access Storage" on storage.objects
  for select using (bucket_id in ('post-media', 'ads-media', 'catalogue-media', 'reels', 'statuses', 'avatars'));

drop policy if exists "Authenticated User Upload Storage" on storage.objects;
create policy "Authenticated User Upload Storage" on storage.objects
  for insert to authenticated with check (bucket_id in ('post-media', 'ads-media', 'catalogue-media', 'reels', 'statuses', 'avatars'));

-- =======================================================================
-- HELPER: PROMOTING A USER TO CEO ROLE
-- After the CEO (vukangtech@gmail.com) signs up, run this in SQL Editor:
--
-- UPDATE public.profiles
-- SET role = 'ceo'
-- WHERE id IN (SELECT id FROM auth.users WHERE email = 'vukangtech@gmail.com');
-- =======================================================================
