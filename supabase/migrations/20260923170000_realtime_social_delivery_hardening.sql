-- Allow the conversation creator to add the other participant when creating a DM.
drop policy if exists members_self_insert on public.conversation_members;
create policy members_self_insert on public.conversation_members
for insert to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and c.created_by = auth.uid()
  )
);

-- Media-only messages are valid, and typing indicators are valid realtime signals.
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages
  add constraint messages_body_check
  check ((char_length(body) between 1 and 4000) or media_url is not null);

alter table public.call_signals drop constraint if exists call_signals_signal_type_check;
alter table public.call_signals
  add constraint call_signals_signal_type_check
  check (signal_type in ('offer','answer','ice','hangup','ringing','accepted','declined','typing'));

alter table public.likes replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.likes;
exception when duplicate_object then null;
end $$;
