create schema if not exists private;
create or replace function private.is_conversation_member(target_conversation uuid, target_user uuid default auth.uid()) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members where conversation_id = target_conversation and user_id = target_user);
$$;
revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke execute on function private.is_conversation_member(uuid, uuid) from public, anon;
grant execute on function private.is_conversation_member(uuid, uuid) to authenticated;

drop policy if exists conversations_member_read on public.conversations;
drop policy if exists members_member_read on public.conversation_members;
drop policy if exists members_self_insert on public.conversation_members;
drop policy if exists messages_member_read on public.messages;
drop policy if exists messages_member_insert on public.messages;
drop policy if exists call_signals_sender_insert on public.call_signals;
drop function if exists public.is_conversation_member(uuid, uuid);

create policy conversations_member_read on public.conversations for select to authenticated using (private.is_conversation_member(id));
create policy members_member_read on public.conversation_members for select to authenticated using (private.is_conversation_member(conversation_id));
create policy members_self_insert on public.conversation_members for insert to authenticated with check (user_id = auth.uid() and (private.is_conversation_member(conversation_id) or exists (select 1 from public.conversations where id = conversation_id and created_by = auth.uid())));
create policy messages_member_read on public.messages for select to authenticated using (private.is_conversation_member(conversation_id));
create policy messages_member_insert on public.messages for insert to authenticated with check (sender_id = auth.uid() and private.is_conversation_member(conversation_id));
create policy call_signals_sender_insert on public.call_signals for insert to authenticated with check (sender_id = auth.uid() and private.is_conversation_member(conversation_id) and private.is_conversation_member(conversation_id, recipient_id));
