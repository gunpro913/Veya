-- Veya security hardening.
-- Sensitive business rules belong in Postgres/RPCs, not in the browser.

/* ----------------------------- XP -------------------------------- */

create or replace function public.veya_apply_xp(p_amount integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := current_date;
  allowed_amount integer;
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'XP reason is required';
  end if;

  -- Positive rewards are server-controlled. The daily cap prevents a
  -- compromised client from farming the same browser action repeatedly.
  if p_amount > 0 then
    allowed_amount := case
      when p_reason = 'Meal logged' then 20
      when p_reason = 'Workout completed' then 100
      when p_reason = 'Morning check-in' then 15
      when p_reason = 'Evening check-in' then 10
      when p_reason = 'Daily insight read' then 10
      when p_reason = 'Recipe explored' then 10
      when p_reason = 'Course lesson completed' then 15
      when p_reason like '% unlocked!' then p_amount
      else null
    end;

    if allowed_amount is null or p_amount <> allowed_amount then
      raise exception 'Invalid XP reward';
    end if;

    if p_reason <> 'Workout completed'
       and exists (
         select 1 from public.xp_transactions
         where user_id = uid
           and reason = p_reason
           and created_at >= date_trunc('day', now())
       ) then
      return;
    end if;

    if p_reason = 'Workout completed'
       and exists (
         select 1 from public.xp_transactions
         where user_id = uid
           and reason = p_reason
           and created_at >= date_trunc('day', now())
       ) then
      return;
    end if;
  else
    -- Negative XP is only valid for the known shop prices.
    if not (
      (p_reason = 'Amber Accent' and p_amount = -150) or
      (p_reason = 'Rose Accent' and p_amount = -150) or
      (p_reason = 'Sky Accent' and p_amount = -150) or
      (p_reason = 'Momentum Glow' and p_amount = -100) or
      (p_reason = 'Mark Avatar' and p_amount = -120) or
      (p_reason = 'Iron Will Badge' and p_amount = -200) or
      (p_reason = 'Early Riser Badge' and p_amount = -150) or
      (p_reason = 'Founding Member Badge' and p_amount = -300)
    ) then
      raise exception 'Invalid shop transaction';
    end if;

    if (select coalesce(sum(amount), 0) from public.xp_transactions where user_id = uid) + p_amount < 0 then
      raise exception 'Insufficient XP';
    end if;

    if exists (
      select 1 from public.xp_transactions
      where user_id = uid and amount = p_amount and reason = p_reason
    ) then
      return;
    end if;
  end if;

  insert into public.xp_transactions(user_id, amount, reason)
  values (uid, p_amount, trim(p_reason));
end;
$$;

revoke execute on function public.veya_apply_xp(integer, text) from public, anon;
grant execute on function public.veya_apply_xp(integer, text) to authenticated;

/* No direct client INSERTs into the XP ledger. The browser calls the RPC. */
revoke insert on table public.xp_transactions from anon, authenticated;

/* -------------------------- Cosmetics ----------------------------- */

create or replace function public.veya_validate_cosmetic_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_name text;
  item_price integer;
begin
  if new.user_id <> auth.uid() then
    raise exception 'Cannot modify another user''s cosmetics';
  end if;

  select name, price into item_name, item_price
  from (
    values
      ('accent_amber','Amber Accent',150),
      ('accent_rose','Rose Accent',150),
      ('accent_sky','Sky Accent',150),
      ('fx_glow','Momentum Glow',100),
      ('avatar_mark','Mark Avatar',120),
      ('badge_iron','Iron Will Badge',200),
      ('badge_early','Early Riser Badge',150),
      ('badge_founding','Founding Member Badge',300)
  ) as shop(id, name, price)
  where id = new.cosmetic_id;

  if item_name is null then
    raise exception 'Unknown cosmetic';
  end if;

  if not exists (
    select 1 from public.xp_transactions
    where user_id = new.user_id
      and amount = -item_price
      and reason = item_name
      and created_at >= now() - interval '2 minutes'
  ) then
    raise exception 'Cosmetic has not been purchased';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_cosmetic_purchase on public.user_cosmetics;
create trigger validate_cosmetic_purchase
before insert on public.user_cosmetics
for each row execute function public.veya_validate_cosmetic_purchase();

/* Keep ownership rows readable but prevent arbitrary client-created rows
   unless the purchase trigger validates the matching XP transaction. */
revoke insert on table public.user_cosmetics from anon, authenticated;

/* --------------------------- Profiles ------------------------------ */

create or replace function public.veya_protect_profile_rewards()
returns trigger
language plpgsql
as $$
begin
  if new.user_id = old.user_id then
    if new.streak < old.streak or new.streak > old.streak + 1 then
      new.streak := old.streak;
    end if;
    if new.last_active_date is not null and new.last_active_date > current_date then
      new.last_active_date := old.last_active_date;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_rewards on public.profiles;
create trigger protect_profile_rewards
before update on public.profiles
for each row execute function public.veya_protect_profile_rewards();

/* ---------------------------- Admin -------------------------------- */

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','user')) default 'user',
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles
for select to authenticated using (auth.uid() = user_id);

insert into public.user_roles(user_id, role)
select id, 'admin'
from auth.users
where lower(email) = 'yunusfawzan9@gmail.com'
on conflict (user_id) do update set role = excluded.role;

create or replace function public.veya_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.veya_is_admin() from public, anon;
grant execute on function public.veya_is_admin() to authenticated;

/* Ensure the XP aggregate view obeys underlying RLS. */
drop view if exists public.user_xp_totals;
create view public.user_xp_totals
with (security_invoker = true)
as
select user_id, coalesce(sum(amount), 0) as total_xp
from public.xp_transactions
group by user_id;

revoke all on public.user_xp_totals from anon;
grant select on public.user_xp_totals to authenticated;
