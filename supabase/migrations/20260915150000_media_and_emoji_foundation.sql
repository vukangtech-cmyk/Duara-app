alter table public.posts add column if not exists media_type text check (media_type in ('image','video'));
alter table public.reels add column if not exists thumbnail_url text;

insert into storage.buckets (id, name, public) values ('reels', 'reels', true) on conflict (id) do nothing;
drop policy if exists reels_public_read on storage.objects;
create policy reels_public_read on storage.objects for select using (bucket_id = 'reels');
drop policy if exists reels_user_upload on storage.objects;
create policy reels_user_upload on storage.objects for insert to authenticated with check (bucket_id = 'reels' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists reels_user_update on storage.objects;
create policy reels_user_update on storage.objects for update to authenticated using (bucket_id = 'reels' and (storage.foldername(name))[1] = auth.uid()::text);
