alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in ('like','comment','follow','status_like','status_comment','status_kick','post_kick'));
alter table public.notifications add column if not exists status_id uuid references public.statuses(id) on delete cascade;

create table if not exists public.status_comments (
  id uuid primary key default gen_random_uuid(),
  status_id uuid not null references public.statuses(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);
create table if not exists public.status_reactions (
  status_id uuid not null references public.statuses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like','kick')),
  created_at timestamptz not null default now(),
  primary key (status_id, user_id)
);
create table if not exists public.post_kicks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.status_comments enable row level security;
alter table public.status_reactions enable row level security;
alter table public.post_kicks enable row level security;
create policy status_comments_read on public.status_comments for select to authenticated using (true);
create policy status_comments_insert on public.status_comments for insert to authenticated with check (author_id = auth.uid());
create policy status_reactions_read on public.status_reactions for select to authenticated using (true);
create policy status_reactions_write on public.status_reactions for insert to authenticated with check (user_id = auth.uid());
create policy status_reactions_delete on public.status_reactions for delete to authenticated using (user_id = auth.uid());
create policy post_kicks_read on public.post_kicks for select to authenticated using (true);
create policy post_kicks_write on public.post_kicks for insert to authenticated with check (user_id = auth.uid());
create policy post_kicks_delete on public.post_kicks for delete to authenticated using (user_id = auth.uid());

create or replace function public.notify_status_reaction() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, status_id)
  select s.user_id, new.user_id, case when new.reaction = 'kick' then 'status_kick' else 'status_like' end, new.status_id
  from public.statuses s where s.id = new.status_id and s.user_id <> new.user_id;
  return new;
end; $$;
drop trigger if exists status_reaction_notification on public.status_reactions;
create trigger status_reaction_notification after insert on public.status_reactions for each row execute function public.notify_status_reaction();

create or replace function public.notify_status_comment() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, status_id)
  select s.user_id, new.author_id, 'status_comment', new.status_id
  from public.statuses s where s.id = new.status_id and s.user_id <> new.author_id;
  return new;
end; $$;
drop trigger if exists status_comment_notification on public.status_comments;
create trigger status_comment_notification after insert on public.status_comments for each row execute function public.notify_status_comment();

create or replace function public.notify_post_kick() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, post_id)
  select p.author_id, new.user_id, 'post_kick', new.post_id from public.posts p where p.id = new.post_id and p.author_id <> new.user_id;
  return new;
end; $$;
drop trigger if exists post_kick_notification on public.post_kicks;
create trigger post_kick_notification after insert on public.post_kicks for each row execute function public.notify_post_kick();

alter table public.status_comments replica identity full;
alter table public.status_reactions replica identity full;
alter table public.post_kicks replica identity full;
do $$ begin alter publication supabase_realtime add table public.status_comments; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.status_reactions; exception when duplicate_object then null; end $$;
