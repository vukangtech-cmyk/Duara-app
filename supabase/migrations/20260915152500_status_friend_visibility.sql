drop policy if exists statuses_active_read on public.statuses;
create policy statuses_active_read on public.statuses for select to authenticated using (
  user_id = auth.uid()
  or exists (
    select 1 from public.friend_requests fr
    where fr.status = 'accepted'
      and ((fr.sender_id = statuses.user_id and fr.recipient_id = auth.uid()) or (fr.recipient_id = statuses.user_id and fr.sender_id = auth.uid()))
  )
  or exists (
    select 1 from public.follows f
    where (f.follower_id = auth.uid() and f.following_id = statuses.user_id)
       or (f.following_id = auth.uid() and f.follower_id = statuses.user_id)
  )
);
