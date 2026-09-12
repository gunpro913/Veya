-- ============================================================================
-- 002 — Allow XP spending (negative transactions)
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run.
-- ============================================================================

-- The original constraint only allowed positive amounts (amount > 0), which
-- blocked the Veya Shop from recording XP spent on cosmetics. Total XP is
-- still just SUM(amount) — a purchase simply inserts a negative row, the
-- same pattern as any other transaction, so the total stays correct and
-- auditable without any other schema change.

alter table public.xp_transactions
  drop constraint if exists xp_transactions_amount_check;

alter table public.xp_transactions
  add constraint xp_transactions_amount_check check (amount <> 0);

-- ============================================================================
-- END — After running this, "Unlock" purchases in the Veya Shop will sync
-- their negative XP transaction to Supabase for signed-in users. (This was
-- previously blocked and only worked locally.)
-- ============================================================================
