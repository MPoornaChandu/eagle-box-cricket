# Architecture

Eagle Box Cricket is a Next.js App Router project for cricket tournament operations. The app is designed to run with Supabase PostgreSQL in production-style environments and LocalStorage fallback in local demo mode.

## High-Level Flow

```text
Next.js UI
  -> Auth and role guard
  -> Storage service
  -> Supabase PostgreSQL or LocalStorage fallback
  -> Points engine and workflow helpers
  -> Reports, standings, public scoreboard, and automated insights
```

## Storage Modes

The storage layer selects Supabase when public Supabase environment variables are configured. If Supabase is missing or a read fails locally, the app falls back to browser LocalStorage so the demo remains usable.

Primary storage entry point:

```text
lib/storage/index.ts
```

Supabase implementation:

```text
lib/storage/supabaseStore.ts
```

Local fallback implementation:

```text
lib/storage/localStore.ts
```

## Data Flow

1. Pages load teams, fixtures, results, standings, reports, settings, and activity logs through the storage service.
2. Admin actions write through the same service.
3. Fixtures and match results feed the points engine.
4. Reports and workflow pages read the latest normalized tournament state.
5. The public scoreboard renders shareable tournament information.

## Points Calculation

The points engine lives in:

```text
lib/points.ts
```

It recalculates standings from completed fixtures and match results. Cricket overs are converted to balls before calculating run rates and Net Run Rate.

NRR formula:

```text
(Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
```

## AI Assistant Flow

Automated Insights and chat use server-side API routes:

```text
app/api/insights/route.ts
app/api/assistant-chat/route.ts
```

The frontend sends current tournament data to these routes. The routes use `GEMINI_API_KEY` only on the server. If Gemini is unavailable, the API returns local rule-based responses from:

```text
lib/insights/ruleBasedInsights.ts
lib/insights/localAssistant.ts
```

## Public Scoreboard Flow

The scoreboard page is designed as a public-facing route. It reads tournament data and standings without exposing admin controls.

```text
app/scoreboard/page.tsx
```

## Deployment Notes

The project is deployed on Vercel. Add Supabase and Gemini environment variables in Vercel project settings, then redeploy after schema or environment updates.
