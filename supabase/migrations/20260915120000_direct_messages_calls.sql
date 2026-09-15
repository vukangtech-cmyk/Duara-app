create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group')),
  created_by uuid not null references public.profiles(id) on delete cascade,
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
  body text not null check (char_length(body) between 1 and 4000),
  media_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  signal_type text not null check (signal_type in ('offer','answer','ice','hangup','ringing','accepted','declined')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists call_signals_recipient_idx on public.call_signals (recipient_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.call_signals enable row level security;

create or replace function public.is_conversation_member(target_conversation uuid, target_user uuid default auth.uid()) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members where conversation_id = target_conversation and user_id = target_user);
$$;
revoke execute on function public.is_conversation_member(uuid, uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

drop policy if exists conversations_member_read on public.conversations;
create policy conversations_member_read on public.conversations for select to authenticated using (public.is_conversation_member(id));
drop policy if exists conversations_create on public.conversations;
create policy conversations_create on public.conversations for insert to authenticated with check (created_by = auth.uid());

drop policy if exists members_member_read on public.conversation_members;
create policy members_member_read on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists members_self_insert on public.conversation_members;
create policy members_self_insert on public.conversation_members for insert to authenticated with check (user_id = auth.uid() and (public.is_conversation_member(conversation_id) or exists (select 1 from public.conversations where id = conversation_id and created_by = auth.uid())));

drop policy if exists messages_member_read on public.messages;
create policy messages_member_read on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists messages_member_insert on public.messages;
create policy messages_member_insert on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));
drop policy if exists messages_sender_update on public.messages;
create policy messages_sender_update on public.messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- Signaling rows are only visible to the two participants and are short-lived application events.
drop policy if exists call_signals_participant_read on public.call_signals;
create policy call_signals_participant_read on public.call_signals for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists call_signals_sender_insert on public.call_signals;
create policy call_signals_sender_insert on public.call_signals for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id) and public.is_conversation_member(conversation_id, recipient_id));

alter table public.messages replica identity full;
alter table public.call_signals replica identity full;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.call_signals;
