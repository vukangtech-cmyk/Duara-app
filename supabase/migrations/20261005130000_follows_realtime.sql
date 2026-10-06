-- =======================================================================
-- MIGRATION: REAL-TIME FOLLOWS & REPUTATION SUPPORT
-- =======================================================================

-- 1. Ensure foreign key names and indices on public.follows
create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_following_id on public.follows(following_id);

-- 2. Ensure RLS policies allow reading and managing follows
alter table public.follows enable row level security;

drop policy if exists "follows_read" on public.follows;
create policy "follows_read" on public.follows 
  for select to authenticated, anon using (true);

drop policy if exists "follows_insert" on public.follows;
create policy "follows_insert" on public.follows 
  for insert to authenticated with check (follower_id = auth.uid());

drop policy if exists "follows_delete" on public.follows;
create policy "follows_delete" on public.follows 
  for delete to authenticated using (follower_id = auth.uid());

-- 3. Add public.follows to Supabase Realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.follows;
  end if;
exception when others then
  -- Ignore duplicate or publication errors
end $$;
