# Veya — AI Fitness App

Veya is a Vite + React fitness app with guest mode, Supabase persistence, workouts, nutrition logging, XP, cosmetics, courses, recipes, and an AI assistant.

## Run locally

```bash
npm install
npm run dev
```

The app uses a root-level Vite entry point (`main.jsx`).

## Environment

Create a local `.env` file from the template:

```bash
cp .env.example .env
```

Set:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

Never commit `.env` or any server-side API key.

## Supabase database

The canonical migrations are under `supabase/migrations/`:

1. `20260912000100_core_schema.sql`
2. `20260912000200_xp_shop_constraint.sql`
3. `20260912000300_user_cosmetics.sql`

For an existing Supabase project, apply these migrations in order. If using the Supabase CLI, link the project first and use the normal migration workflow.

## AI Coach / food AI

The Anthropic API key must stay server-side. The Edge Function is located at:

```text
supabase/functions/ai-chat/index.ts
```

Deploy with the Supabase CLI after linking your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy ai-chat
supabase secrets set ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY
```

The frontend only calls the Edge Function; it must never contain the Anthropic key.

## Production build

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static host such as Vercel, Netlify, or Cloudflare Pages. Configure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables on the host.

## Current persistence

Supabase-backed: authentication, profiles, workout history, course badges, food logs, XP transactions, and cosmetic ownership/equipped state.

Browser-local: guest state and several app features such as daily check-ins, meal planning, grocery/cart state, and some recipe tracking. These will be moved to dedicated tables as the backend is expanded.

## Important development notes

- Guest mode is intentionally local-only.
- The current app still contains a large monolithic `App.jsx`; refactoring it into feature modules is planned after the project is stable.
- XP/shop authorization needs server-side hardening before production launch.
- Admin authorization also needs a real server-side/RLS role boundary before production launch.
