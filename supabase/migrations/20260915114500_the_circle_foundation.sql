create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('like','comment','follow')),
  post_id uuid references public.posts(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists comments_post_id_idx on public.comments (post_id, created_at desc);
create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(replace(new.id::text, '-', ''), 1, 10)), coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)), new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists posts_authenticated_read on public.posts;
create policy posts_authenticated_read on public.posts for select to authenticated using (true);
drop policy if exists posts_self_insert on public.posts;
create policy posts_self_insert on public.posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists posts_self_update on public.posts;
create policy posts_self_update on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists posts_self_delete on public.posts;
create policy posts_self_delete on public.posts for delete to authenticated using (author_id = auth.uid());

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select to authenticated using (true);
drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists follows_delete on public.follows;
create policy follows_delete on public.follows for delete to authenticated using (follower_id = auth.uid());

drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select to authenticated using (true);
drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists likes_delete on public.likes;
create policy likes_delete on public.likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated using (true);
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated using (author_id = auth.uid());

drop policy if exists notifications_self_read on public.notifications;
create policy notifications_self_read on public.notifications for select to authenticated using (recipient_id = auth.uid());
drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create or replace function public.notify_like() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, post_id)
  select author_id, new.user_id, 'like', new.post_id from public.posts where id = new.post_id and author_id <> new.user_id;
  return new;
end; $$;
drop trigger if exists like_notification on public.likes;
create trigger like_notification after insert on public.likes for each row execute function public.notify_like();

create or replace function public.notify_comment() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, post_id)
  select author_id, new.author_id, 'comment', new.post_id from public.posts where id = new.post_id and author_id <> new.author_id;
  return new;
end; $$;
drop trigger if exists comment_notification on public.comments;
create trigger comment_notification after insert on public.comments for each row execute function public.notify_comment();

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true) on conflict (id) do nothing;

alter table public.profiles replica identity full;
alter table public.posts replica identity full;
alter table public.comments replica identity full;
alter table public.notifications replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;


drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects for select to public using (bucket_id = 'avatars');
drop policy if exists avatars_auth_upload on storage.objects;
create policy avatars_auth_upload on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_auth_update on storage.objects;
create policy avatars_auth_update on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_auth_delete on storage.objects;
create policy avatars_auth_delete on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select to public using (bucket_id = 'post-media');
drop policy if exists media_auth_upload on storage.objects;
create policy media_auth_upload on storage.objects for insert to authenticated with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists media_auth_delete on storage.objects;
create policy media_auth_delete on storage.objects for delete to authenticated using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
