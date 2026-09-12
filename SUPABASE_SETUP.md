# Supabase Setup

## 1. Create/configure your Supabase project

1. Open your Supabase project dashboard.
2. Go to **Project Settings → API**.
3. Copy the **Project URL** and **anon/public key**.
4. Never put the `service_role`/secret key in the browser or GitHub.

For local development:

```bash
cp .env.example .env
```

Then set:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 2. Apply the database migrations

The repository now uses the standard Supabase migration layout:

```text
supabase/
├── config.toml
├── functions/
│   └── ai-chat/
│       └── index.ts
└── migrations/
    ├── 20260912000100_core_schema.sql
    ├── 20260912000200_xp_shop_constraint.sql
    └── 20260912000300_user_cosmetics.sql
```

### Using the Supabase CLI (recommended)

From the repository root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Do not paste migrations into random files or rename them after they have been applied. Supabase uses the migration filenames/timestamps to track database state.

### SQL Editor alternative

If you are not using the CLI, run the three migration files in timestamp order in the Supabase SQL Editor:

1. `20260912000100_core_schema.sql`
2. `20260912000200_xp_shop_constraint.sql`
3. `20260912000300_user_cosmetics.sql`

The migrations should be reviewed against your existing database before applying them to a project that already contains older Veya tables.

## 3. Authentication

The app uses Supabase Auth. Create a test account and verify that a corresponding `profiles` row is created by the database trigger.

Check:

- Sign up
- Sign in
- Sign out
- Reload the page while signed in
- Let an access token expire and verify the app can obtain a refreshed session

## 4. AI chat Edge Function

The AI endpoint is now in the correct Supabase location:

```text
supabase/functions/ai-chat/index.ts
```

`supabase/config.toml` enables JWT verification for the function.

Set the Anthropic secret in Supabase — **not** in Vite/browser environment variables:

```bash
supabase secrets set ANTHROPIC_API_KEY=your-key
```

Deploy:

```bash
supabase functions deploy ai-chat
```

The browser should only know the Supabase URL and anon/public key. The Anthropic API key must remain server-side.

## 5. RLS and data ownership

The database uses Row Level Security for user-owned records. Test with two different accounts and confirm that User B cannot read or modify User A's data.

Important: RLS is not a substitute for business-logic authorization. Ownership policies protect rows, while sensitive operations such as XP awards, purchases, badges, cosmetics, and admin actions need server-side validation.

## 6. Production security checklist

- [ ] No service-role/secret key in frontend code
- [ ] `.env` is ignored by Git
- [ ] AI API key is stored as a Supabase secret
- [ ] AI Edge Function verifies the authenticated user
- [ ] XP awards/spending are enforced server-side
- [ ] Cosmetic purchases/unlocks are enforced server-side
- [ ] Admin privileges are enforced server-side/database-side, not by email checks in React
- [ ] Duplicate rewards are prevented by database constraints/idempotency
- [ ] Supabase migrations apply cleanly to a fresh database
- [ ] Existing production data is backed up before schema changes

## 7. Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

If Vite reports missing environment variables, verify `.env` and restart the dev server.
