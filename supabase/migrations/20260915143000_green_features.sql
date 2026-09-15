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
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 2000),
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
  caption text not null default '' check (char_length(caption) <= 500),
  created_at timestamptz not null default now()
);
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
  type text not null check (type in ('deposit','withdrawal','purchase','sale','refund')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'TZS',
  status text not null default 'pending' check (status in ('pending','completed','failed','cancelled')),
  reference text,
  created_at timestamptz not null default now()
);

alter table public.friend_requests enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.reels enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;

create policy friend_requests_participant_read on public.friend_requests for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy friend_requests_sender_insert on public.friend_requests for insert to authenticated with check (sender_id = auth.uid());
create policy friend_requests_participant_update on public.friend_requests for update to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid()) with check (sender_id = auth.uid() or recipient_id = auth.uid());
create policy marketplace_public_read on public.marketplace_listings for select to authenticated using (status = 'active' or seller_id = auth.uid());
create policy marketplace_owner_insert on public.marketplace_listings for insert to authenticated with check (seller_id = auth.uid());
create policy marketplace_owner_update on public.marketplace_listings for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy marketplace_owner_delete on public.marketplace_listings for delete to authenticated using (seller_id = auth.uid());
create policy reels_authenticated_read on public.reels for select to authenticated using (true);
create policy reels_creator_insert on public.reels for insert to authenticated with check (creator_id = auth.uid());
create policy reels_creator_update on public.reels for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy wallet_account_owner_read on public.wallet_accounts for select to authenticated using (user_id = auth.uid());
create policy wallet_transaction_owner_read on public.wallet_transactions for select to authenticated using (user_id = auth.uid());

alter table public.friend_requests replica identity full;
alter table public.marketplace_listings replica identity full;
alter table public.reels replica identity full;
alter publication supabase_realtime add table public.friend_requests;
alter publication supabase_realtime add table public.marketplace_listings;
alter publication supabase_realtime add table public.reels;
