-- Veya core schema: auth profiles, workouts, food logs, XP, achievements.
-- Canonical Supabase migration. See the original project documentation for details.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  goal text default 'general_fitness',
  equipment text default 'Dumbbells',
  dietary text default 'No restrictions',
  target_calories int default 2100,
  target_protein int default 140,
  target_carbs int default 230,
  target_fat int default 70,
  streak int not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create table if not exists public.workout_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null,
  course_id text,
  workout_name text not null,
  completed_at timestamptz not null default now()
);
alter table public.workout_history enable row level security;
drop policy if exists "workout_history_select_own" on public.workout_history;
create policy "workout_history_select_own" on public.workout_history for select using (auth.uid() = user_id);
drop policy if exists "workout_history_insert_own" on public.workout_history;
create policy "workout_history_insert_own" on public.workout_history for insert with check (auth.uid() = user_id);
drop policy if exists "workout_history_delete_own" on public.workout_history;
create policy "workout_history_delete_own" on public.workout_history for delete using (auth.uid() = user_id);
create index if not exists workout_history_user_idx on public.workout_history(user_id, completed_at desc);

create table if not exists public.course_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, course_id)
);
alter table public.course_badges enable row level security;
drop policy if exists "course_badges_select_own" on public.course_badges;
create policy "course_badges_select_own" on public.course_badges for select using (auth.uid() = user_id);
drop policy if exists "course_badges_insert_own" on public.course_badges;
create policy "course_badges_insert_own" on public.course_badges for insert with check (auth.uid() = user_id);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null default current_date,
  meal_type text not null check (meal_type in ('Breakfast','Lunch','Dinner','Snacks')),
  food_name text not null,
  portion text,
  estimated_calories numeric,
  estimated_protein numeric,
  estimated_carbs numeric,
  estimated_fat numeric,
  density text check (density in ('green','yellow','red')),
  source text check (source in ('scanned','described','manual','recipe')),
  confidence text check (confidence in ('low','medium','high')),
  created_at timestamptz not null default now()
);
alter table public.food_logs enable row level security;
drop policy if exists "food_logs_select_own" on public.food_logs;
create policy "food_logs_select_own" on public.food_logs for select using (auth.uid() = user_id);
drop policy if exists "food_logs_insert_own" on public.food_logs;
create policy "food_logs_insert_own" on public.food_logs for insert with check (auth.uid() = user_id);
drop policy if exists "food_logs_update_own" on public.food_logs;
create policy "food_logs_update_own" on public.food_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "food_logs_delete_own" on public.food_logs;
create policy "food_logs_delete_own" on public.food_logs for delete using (auth.uid() = user_id);
create index if not exists food_logs_user_date_idx on public.food_logs(user_id, logged_at desc);

create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null check (amount > 0),
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.xp_transactions enable row level security;
drop policy if exists "xp_select_own" on public.xp_transactions;
create policy "xp_select_own" on public.xp_transactions for select using (auth.uid() = user_id);
drop policy if exists "xp_insert_own" on public.xp_transactions;
create policy "xp_insert_own" on public.xp_transactions for insert with check (auth.uid() = user_id);
create index if not exists xp_transactions_user_idx on public.xp_transactions(user_id);

create or replace view public.user_xp_totals as
select user_id, coalesce(sum(amount), 0) as total_xp from public.xp_transactions group by user_id;
alter view public.user_xp_totals set (security_barrier = true);

create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  xp_reward int not null default 0
);
alter table public.achievements enable row level security;
drop policy if exists "achievements_public_read" on public.achievements;
create policy "achievements_public_read" on public.achievements for select using (true);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id),
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
drop policy if exists "user_achievements_select_own" on public.user_achievements;
create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);
drop policy if exists "user_achievements_insert_own" on public.user_achievements;
create policy "user_achievements_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);

insert into public.achievements (id, name, description, xp_reward) values
('first_workout','First Workout','Complete your first session',0),
('five_workouts','5 Workouts','Complete 5 workout sessions',0),
('first_scan','First Scan','Log a meal with AI scan',0),
('streak_3','3-Day Streak','Stay active 3 days in a row',0),
('streak_7','7-Day Streak','Stay active 7 days in a row',0),
('mindful_start','Mindful Start','Complete your first daily check-in',0)
on conflict (id) do update set name=excluded.name, description=excluded.description, xp_reward=excluded.xp_reward;
