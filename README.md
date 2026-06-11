# Fixture & Points Table Manager

Premium internship demo web app for Eagle Box Cricket, a sports venue management company.

This app helps an admin manage cricket tournament teams, fixtures, match results, reports, and a simplified Net Run Rate based points table. It is built as a local-first demo, so it works immediately without database keys, backend setup, or paid services.

## Features

- Demo admin login with localStorage session persistence
- Protected dashboard, teams, fixtures, results, points table, and reports pages
- Add, edit, delete, and search teams
- Create, edit, and delete fixtures
- Submit match results with runs, wickets, cricket overs, fours, sixes, and notes
- Automatic full points table recalculation from teams plus completed fixtures
- Simplified cricket Net Run Rate calculation with correct overs parsing
- Celebration overlay for SIX, FOUR, WINNER, and MATCH TIED
- Dashboard stats, previews, and animated cricket ball
- JSON report download, copy summary, and print / save as PDF
- Seed and reset demo data
- Persistent localStorage data after refresh

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- lucide-react icons
- localStorage persistence

## Folder Structure

```text
app/
  layout.tsx
  globals.css
  login/page.tsx
  page.tsx
  teams/page.tsx
  fixtures/page.tsx
  results/page.tsx
  points-table/page.tsx
  reports/page.tsx
components/
  AppShell.tsx
  AuthGuard.tsx
  Sidebar.tsx
  GlassCard.tsx
  StatCard.tsx
  TeamCard.tsx
  FixtureCard.tsx
  PointsTableView.tsx
  ResultForm.tsx
  CelebrationOverlay.tsx
  CricketBallAnimation.tsx
  EmptyState.tsx
  ConfirmDialog.tsx
  ToastProvider.tsx
  PageHeader.tsx
  LoadingSkeleton.tsx
lib/
  types.ts
  storage.ts
  points.ts
  seed.ts
  utils.ts
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Login

- Email: `admin@eaglebox.com`
- Password: `admin123`

## Demo Flow

1. Login with the demo admin account.
2. Click `Seed Demo Data` on the dashboard.
3. Review teams, add a team, edit it, and delete with confirmation.
4. Create and edit an upcoming fixture.
5. Submit a result with runs, wickets, overs, fours, and sixes.
6. Watch the celebration overlay.
7. Open Points Table and confirm standings plus NRR are updated.
8. Recalculate the table manually.
9. Open Reports, copy the summary, download JSON, and print / save as PDF.
10. Refresh the browser and confirm local data persists.
11. Logout and confirm protected routes redirect to login.

## localStorage Design

The app stores all demo data in browser localStorage:

- `isLoggedIn`
- `ebc_teams`
- `ebc_fixtures`
- `ebc_points_table`

The storage functions live in `lib/storage.ts`, so localStorage can later be replaced by Firebase, Supabase, or another backend without rewriting page components.

## Future Scope

- Firebase or Supabase database
- Real user authentication
- PDF report export
- WhatsApp reminder integration using WhatsApp Business API
- AI-generated match summaries using OpenAI or Gemini
- Role-based admin access
- Cloud deployment
