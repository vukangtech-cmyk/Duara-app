-- =======================================================================
-- MIGRATION: USERS TABLE WITH USER_BALANCE COLUMN & MOCK PAYMENT SUPPORT
-- =======================================================================

-- 1. Create or alter public.users table with user_balance column
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  user_balance numeric(14,2) not null default 0 check (user_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure user_balance column exists if public.users was already present
alter table public.users add column if not exists email text;
alter table public.users add column if not exists username text;
alter table public.users add column if not exists user_balance numeric(14,2) not null default 0 check (user_balance >= 0);
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

-- 2. Populate public.users from existing auth.users and profiles if not already populated
insert into public.users (id, email, username, user_balance)
select 
  p.id, 
  au.email, 
  p.username, 
  coalesce(w.balance, 0) as user_balance
from public.profiles p
left join auth.users au on au.id = p.id
left join public.wallet_accounts w on w.user_id = p.id
on conflict (id) do update set
  user_balance = coalesce(excluded.user_balance, public.users.user_balance);

-- 3. Row Level Security for public.users
alter table public.users enable row level security;

drop policy if exists "users_read_all" on public.users;
create policy "users_read_all" on public.users 
  for select to authenticated using (true);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users 
  for insert to authenticated with check (id = auth.uid() or public.is_ceo());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users 
  for update to authenticated using (id = auth.uid() or public.is_ceo()) 
  with check (id = auth.uid() or public.is_ceo());

-- 4. Function & Trigger to sync user_balance with wallet_accounts
create or replace function public.sync_user_balance_to_wallet()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Keep wallet_accounts in sync whenever user_balance in users table is updated
  insert into public.wallet_accounts (user_id, balance, currency, updated_at)
  values (new.id, new.user_balance, 'TZS', now())
  on conflict (user_id) do update set
    balance = excluded.balance,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_user_balance_updated on public.users;
create trigger on_user_balance_updated
  after insert or update of user_balance on public.users
  for each row execute function public.sync_user_balance_to_wallet();

-- 5. Realtime publication for public.users table
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.users;
  end if;
exception when others then
  -- Ignore duplicate or publication errors
end $$;
