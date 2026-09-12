-- ============================================================================
-- 003 — Veya Shop cross-device sync (ownership + equipped state)
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Requires 001_core_schema.sql and 002_xp_shop_constraint.sql already applied.
-- Safe to re-run.
-- ============================================================================

-- Ownership: one row per cosmetic a user has unlocked. Permanent record —
-- no update/delete policy, since unlocks aren't meant to be revocable.
create table if not exists public.user_cosmetics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cosmetic_id text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, cosmetic_id)
);

alter table public.user_cosmetics enable row level security;

drop policy if exists "user_cosmetics_select_own" on public.user_cosmetics;
create policy "user_cosmetics_select_own" on public.user_cosmetics
  for select using (auth.uid() = user_id);

drop policy if exists "user_cosmetics_insert_own" on public.user_cosmetics;
create policy "user_cosmetics_insert_own" on public.user_cosmetics
  for insert with check (auth.uid() = user_id);

-- Equipped state: which owned cosmetic is currently active per slot.
-- Lives on profiles since there's exactly one active choice per slot per user.
alter table public.profiles add column if not exists equipped_accent text;
alter table public.profiles add column if not exists equipped_avatar text default 'initial';
alter table public.profiles add column if not exists equipped_glow boolean not null default false;
alter table public.profiles add column if not exists equipped_badge text;

-- ============================================================================
-- END — After running this, Shop purchases and equipped cosmetics will sync
-- across devices for signed-in users. Guests continue to work locally only,
-- same as everything else in guest mode.
-- ============================================================================
