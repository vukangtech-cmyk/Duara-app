alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists location text default '';
alter table public.profiles add column if not exists website text default '';
alter table public.profiles add column if not exists pronouns text default '';
