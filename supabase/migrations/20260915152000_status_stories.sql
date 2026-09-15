create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text,
  media_type text check (media_type in ('text','image','video')) default 'text',
  content text not null default '' check (char_length(content) <= 500),
  background text not null default '#18a66a',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create table if not exists public.status_views (
  status_id uuid not null references public.statuses(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (status_id, viewer_id)
);
create index if not exists statuses_active_idx on public.statuses (expires_at desc, created_at desc);

alter table public.statuses enable row level security;
alter table public.status_views enable row level security;
create policy statuses_active_read on public.statuses for select to authenticated using (expires_at > now() or user_id = auth.uid());
create policy statuses_owner_insert on public.statuses for insert to authenticated with check (user_id = auth.uid());
create policy statuses_owner_update on public.statuses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy statuses_owner_delete on public.statuses for delete to authenticated using (user_id = auth.uid());
create policy status_views_participant_read on public.status_views for select to authenticated using (viewer_id = auth.uid() or exists (select 1 from public.statuses where statuses.id = status_id and statuses.user_id = auth.uid()));
create policy status_views_self_insert on public.status_views for insert to authenticated with check (viewer_id = auth.uid());

insert into storage.buckets (id, name, public) values ('statuses', 'statuses', true) on conflict (id) do nothing;
drop policy if exists statuses_public_read on storage.objects;
create policy statuses_public_read on storage.objects for select using (bucket_id = 'statuses');
drop policy if exists statuses_user_upload on storage.objects;
create policy statuses_user_upload on storage.objects for insert to authenticated with check (bucket_id = 'statuses' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.statuses replica identity full;
alter publication supabase_realtime add table public.statuses;
