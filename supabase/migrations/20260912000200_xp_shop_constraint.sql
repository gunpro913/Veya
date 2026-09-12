-- Veya migration 002: allow XP spending transactions.
alter table public.xp_transactions
  drop constraint if exists xp_transactions_amount_check;

alter table public.xp_transactions
  add constraint xp_transactions_amount_check check (amount <> 0);
