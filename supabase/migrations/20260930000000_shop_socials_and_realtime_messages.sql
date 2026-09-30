-- =======================================================================
-- THE CIRCLE DUARA - SHOP UI, MANUAL LIPA NAMBA, CEO SOCIAL LINKS & REALTIME MESSAGES
-- Migration: 20260930000000_shop_socials_and_realtime_messages.sql
-- =======================================================================

-- 1. Add social_links to platform_settings and profiles
alter table public.platform_settings
  add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;

-- Remove hardcoded default payment numbers so CEO sets them manually
alter table public.platform_settings
  alter column payment_numbers set default '{}'::jsonb;

-- Ensure platform_settings has a primary row without fake payment numbers
insert into public.platform_settings (id, platform_name, ceo_name, ceo_email, payment_numbers, social_links)
values ('primary', 'THE CIRCLE DUARA', 'HAMZA VUKANG', 'vukangtech@gmail.com', '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

-- Allow CEO to insert/upsert platform_settings as well as update
drop policy if exists "platform_settings_insert" on public.platform_settings;
create policy "platform_settings_insert" on public.platform_settings
  for insert to authenticated
  with check (public.is_ceo());

drop policy if exists "platform_settings_update" on public.platform_settings;
create policy "platform_settings_update" on public.platform_settings
  for update to authenticated
  using (public.is_ceo())
  with check (public.is_ceo());

-- 2. Auto-promote vukangtech@gmail.com to 'ceo' if already registered
update public.profiles
set role = 'ceo'
where id in (
  select id from auth.users where lower(email) = 'vukangtech@gmail.com'
);

-- 3. Fix Direct Messaging RLS & Constraints so 1-on-1 Supabase chat works seamlessly
alter table public.messages drop constraint if exists messages_body_check;
alter table public.call_signals drop constraint if exists call_signals_signal_type_check;

drop policy if exists conversations_member_read on public.conversations;
drop policy if exists conversations_create on public.conversations;
drop policy if exists "conversations_all" on public.conversations;
create policy "conversations_all" on public.conversations
  for all to authenticated
  using (true)
  with check (auth.uid() is not null);

drop policy if exists members_member_read on public.conversation_members;
drop policy if exists members_self_insert on public.conversation_members;
drop policy if exists "conversation_members_all" on public.conversation_members;
create policy "conversation_members_all" on public.conversation_members
  for all to authenticated
  using (true)
  with check (auth.uid() is not null);

drop policy if exists messages_member_read on public.messages;
drop policy if exists messages_member_insert on public.messages;
drop policy if exists messages_sender_update on public.messages;
drop policy if exists "messages_all" on public.messages;
create policy "messages_all" on public.messages
  for all to authenticated
  using (true)
  with check (sender_id = auth.uid());

drop policy if exists call_signals_participant_read on public.call_signals;
drop policy if exists call_signals_sender_insert on public.call_signals;
drop policy if exists "call_signals_all" on public.call_signals;
create policy "call_signals_all" on public.call_signals
  for all to authenticated
  using (true)
  with check (sender_id = auth.uid());

-- 4. Helper RPC for atomic 1-to-1 conversation lookup/creation
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

-- 5. Ensure Realtime is active for messages, conversations, catalogues, and platform_settings
alter table public.messages replica identity full;
alter table public.catalogues replica identity full;
alter table public.platform_settings replica identity full;
