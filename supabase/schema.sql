-- Eagle Box Cricket - Supabase/PostgreSQL schema
-- Enable proper RLS/auth before production. For internship demo, this schema supports CRUD prototype sync.

create extension if not exists "pgcrypto";

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  name text not null,
  short_code text not null,
  captain text,
  coach text,
  home_venue text,
  contact text,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  match_id text unique,
  team_a_id uuid references teams(id) on delete cascade,
  team_b_id uuid references teams(id) on delete cascade,
  date date,
  time text,
  venue text,
  match_type text,
  status text,
  toss_winner_id uuid references teams(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  fixture_id uuid unique references fixtures(id) on delete cascade,
  team_a_runs int,
  team_a_wickets int,
  team_a_balls int,
  team_b_runs int,
  team_b_wickets int,
  team_b_balls int,
  result_type text,
  winner_team_id uuid references teams(id),
  player_of_match text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists report_logs (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  title text,
  type text,
  summary text,
  generated_at timestamptz default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  message text,
  type text,
  created_at timestamptz default now()
);

create index if not exists fixtures_status_idx on fixtures(status);
create index if not exists fixtures_date_idx on fixtures(date);
create index if not exists match_results_fixture_id_idx on match_results(fixture_id);

alter table teams enable row level security;
alter table fixtures enable row level security;
alter table match_results enable row level security;
alter table report_logs enable row level security;
alter table activity_logs enable row level security;

-- Demo policies for public anonymous CRUD during internship prototype review.
-- Replace these with authenticated role-based policies before production.
drop policy if exists "demo teams read" on teams;
drop policy if exists "demo teams write" on teams;
create policy "demo teams read" on teams for select using (true);
create policy "demo teams write" on teams for all using (true) with check (true);

drop policy if exists "demo fixtures read" on fixtures;
drop policy if exists "demo fixtures write" on fixtures;
create policy "demo fixtures read" on fixtures for select using (true);
create policy "demo fixtures write" on fixtures for all using (true) with check (true);

drop policy if exists "demo match results read" on match_results;
drop policy if exists "demo match results write" on match_results;
create policy "demo match results read" on match_results for select using (true);
create policy "demo match results write" on match_results for all using (true) with check (true);

drop policy if exists "demo report logs read" on report_logs;
drop policy if exists "demo report logs write" on report_logs;
create policy "demo report logs read" on report_logs for select using (true);
create policy "demo report logs write" on report_logs for all using (true) with check (true);

drop policy if exists "demo activity logs read" on activity_logs;
drop policy if exists "demo activity logs write" on activity_logs;
create policy "demo activity logs read" on activity_logs for select using (true);
create policy "demo activity logs write" on activity_logs for all using (true) with check (true);
