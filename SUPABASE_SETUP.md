# Supabase Setup — Core Backend (Auth, Profile, Workouts, Food Log, XP)

This covers the first slice: authentication + the core tables. Courses,
recipes, meal plans, grocery lists, and purchases/subscriptions come in a
follow-up migration once this is working end-to-end.

## 1. Get your project credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project.
2. **Project Settings → API.**
3. Copy the **Project URL** and the **anon / public** key.
4. Do **not** copy the `service_role` / secret key anywhere in this app — it
   bypasses Row Level Security and must only ever live on a secure server.

## 2. Run the schema migration

1. In the dashboard, open **SQL Editor → New query**.
2. Paste the full contents of `001_core_schema.sql`.
3. Click **Run**.
4. You should see new tables under **Table Editor**: `profiles`,
   `workout_history`, `course_badges`, `food_logs`, `xp_transactions`,
   `achievements`, `user_achievements`.

This migration is safe to re-run — it uses `create table if not exists` and
`drop policy if exists` before recreating policies, so running it twice
won't duplicate anything or error out.

## 3. What the migration actually sets up

- **`profiles`** — one row per user, auto-created by a database trigger the
  moment someone signs up (`handle_new_user()`), so the frontend never has
  to remember to create it manually.
- **`workout_history`**, **`food_logs`**, **`xp_transactions`**,
  **`course_badges`**, **`user_achievements`** — all user-owned tables with
  Row Level Security enabled, restricted to `auth.uid() = user_id`. A user
  can only ever see or write their own rows — this is enforced by
  PostgreSQL itself, not by the frontend, so it holds even if the frontend
  had a bug.
- **`achievements`** — a small public read-only catalog (not user data), so
  anyone can look up what an achievement is.
- **`user_xp_totals`** — a view that sums `xp_transactions` per user. XP is
  never stored as a single editable number; it's always the sum of
  individual, timestamped transactions, which is what makes "prevent
  duplicate XP rewards" actually enforceable later.

## 4. Configure the app

Two ways, depending on where this app is running:

**A. Inside this chat's React artifact** (current setup): open
`supabaseClient.js` and replace the two placeholder constants at the top:

```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

**B. In a real project** (recommended for production — see below): copy
`.env.example` to `.env`, fill in the same two values, and use
`@supabase/supabase-js`'s `createClient(url, anonKey)` instead of the
fetch-based shim.

## 5. Why a fetch-based client right now

The chat environment this app is built in only allows importing from a
fixed list of pre-approved packages, and `@supabase/supabase-js` isn't on
it. `supabaseClient.js` talks to Supabase's underlying Auth (GoTrue) and
Database (PostgREST) HTTP APIs directly with `fetch`, which works the same
way the real SDK does under the hood — just without the typed client,
realtime subscriptions, or storage helpers the SDK adds.

## 6. What still needs a real project (can't be done from this chat)

- Running the `supabase` CLI, `npm install`, or applying migrations
  automatically — this chat's sandbox has no network access to your
  project.
- Deploying an **Edge Function** to keep the Claude API key server-side
  (Step 18 of your original spec) — there's no deploy target from here.
  Until that exists, the AI calls in this app go directly from the browser,
  which is fine for a prototype but not for a real production launch.
- TypeScript type generation (`supabase gen types typescript`).

All of this is exactly what **Claude Code** is built for — it can run the
CLI, install the real SDK, and deploy Edge Functions. Everything in this
folder is written to drop straight into a real project when you're ready
to move there.

## 7. Testing checklist for this slice

- [ ] Sign up with a new email — a row appears in `profiles` automatically
- [ ] Sign in / sign out — session persists across a page reload
- [ ] Complete a workout — a row appears in `workout_history`, tied to your
      user id
- [ ] Log a meal — a row appears in `food_logs`
- [ ] Create a second test account — confirm it **cannot** see the first
      account's `workout_history` or `food_logs` rows (this is the RLS
      check — try querying as User B and confirm you get zero rows, not an
      error and not User A's data)

## Next migration

`002_courses_recipes_commerce.sql` (not built yet) will add: courses,
course sections, recipes, meal plans, grocery lists, purchases, and
subscriptions, following the same RLS pattern established here.
