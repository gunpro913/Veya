# AI Fitness App — Real Project

This is the same app that was running in the chat artifact, packaged as an
actual runnable project. The reason it needs to live here: the chat
artifact's preview sandbox blocks outbound requests to anything except
`api.anthropic.com` (Content-Security-Policy), so it could never actually
reach your Supabase project — no code change could fix that, since it's a
platform restriction on the artifact preview itself, not a bug in the app.
Running as a real site removes that restriction entirely.

## 1. Install

```
npm install
```

## 2. Configure environment variables

```
cp .env.example .env
```

The example file already has your Supabase URL and anon key filled in —
double check they match Project Settings → API in your dashboard.

## 3. Run the database migration (if you haven't already)

Paste `supabase/001_core_schema.sql` (from the earlier setup step) into
your Supabase project's SQL Editor and run it, if you haven't already.

## 4. Run locally

```
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Auth, profile,
workouts, food log, and XP should now genuinely persist to your Supabase
project.

## 5. Deploy the AI Edge Function

The AI Coach and food scanner need a server-side function so your Claude
API key never reaches the browser. This requires the Supabase CLI:

```
npm install -g supabase
supabase login
supabase link --project-ref orosfesudgybtvhbgjxu
supabase functions deploy ai-chat
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-real-key-here
```

Until this is deployed, the AI Coach and food scanner will fail with a
network error — everything else (auth, workouts, food log, XP) works
without it.

## 6. Deploy the site itself

Any static host works since this is a plain Vite app — Vercel, Netlify,
Cloudflare Pages, etc. The general pattern:

```
npm run build
```

This produces a `dist/` folder — point your host at that. Set the same two
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` environment variables in
your host's dashboard (not the Anthropic key — that only ever goes in the
Edge Function's secrets, never here).

## What's real vs. still local-only

Persisted to Supabase: auth, profile, workout history, course completion
badges, food log, XP transactions.

Still browser-local only (localStorage) for now: daily check-ins, meal
plan, grocery list, cart, purchase history, recipe-exploration tracking.
These didn't have tables in the first migration — a follow-up migration
(`002_courses_recipes_commerce.sql`, not built yet) would move these over
too.

## Easiest path from here

If you'd rather not manage the CLI commands above by hand, open this
folder in **Claude Code** — it can run `npm install`, the Supabase CLI,
and the Edge Function deploy for you directly.
