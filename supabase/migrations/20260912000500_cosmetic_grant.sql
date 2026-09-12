-- The insert privilege is retained because the existing UI writes ownership rows
-- after spending XP. The BEFORE INSERT trigger from migration 004 is the
-- authorization boundary and rejects unknown/unpaid cosmetics.
grant insert on table public.user_cosmetics to authenticated;
