-- Parlo Italiano: database setup. Paste this whole file into Supabase → SQL Editor → Run.

-- Profiles: one row per user, created automatically at sign-up.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  new_per_session int not null default 10 check (new_per_session between 0 and 50),
  direction text not null default 'it' check (direction in ('it', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Progress: one row per user per unit; items maps item id -> {d, iv, k, s, t}.
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  unit int not null check (unit between 1 and 200),
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, unit)
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- Each person can only see and change their own rows.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create a profile when someone signs up (name from Google if available).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets a signed-in user permanently delete their own account (and, by cascade, all their data).
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
