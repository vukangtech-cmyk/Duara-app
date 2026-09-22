alter table public.profiles
  add column if not exists role text not null default 'customer';

update public.profiles
set role = 'customer'
where role is null or role not in ('customer', 'manager', 'ceo');

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check check (role in ('customer', 'manager', 'ceo'));

create or replace function public.prevent_client_role_escalation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'Role changes must be performed by an authorized server administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_client_role_escalation on public.profiles;
create trigger profiles_prevent_client_role_escalation
before update on public.profiles
for each row execute function public.prevent_client_role_escalation();

create or replace function public.is_ceo()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ceo'
  );
$$;

revoke execute on function public.is_ceo() from anon;
grant execute on function public.is_ceo() to authenticated;

comment on column public.profiles.role is 'Authorization role. CEO assignment is server-controlled and never accepted from browser registration.';
