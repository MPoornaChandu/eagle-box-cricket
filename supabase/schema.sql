-- Eagle Box Cricket - Supabase/PostgreSQL schema
-- For production, replace demo anon policies with Supabase Auth admin-only policies.

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

alter table teams add column if not exists app_id text unique;
alter table teams add column if not exists short_code text;
alter table teams add column if not exists captain text;
alter table teams add column if not exists coach text;
alter table teams add column if not exists home_venue text;
alter table teams add column if not exists contact text;
alter table teams add column if not exists status text default 'Active';
alter table teams add column if not exists created_at timestamptz default now();
alter table teams add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teams_status_check'
      and conrelid = 'teams'::regclass
  ) then
    alter table teams add constraint teams_status_check check (status in ('Active', 'Inactive', 'Archived'));
  end if;
end $$;

create unique index if not exists teams_name_lower_unique on teams (lower(name));
create unique index if not exists teams_short_code_lower_unique on teams (lower(short_code));

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
  elected_to text,
  notes text,
  completed_at timestamptz,
  points_updated_at timestamptz,
  report_generated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table fixtures add column if not exists app_id text unique;
alter table fixtures add column if not exists match_id text unique;
alter table fixtures add column if not exists team_a_id uuid references teams(id) on delete cascade;
alter table fixtures add column if not exists team_b_id uuid references teams(id) on delete cascade;
alter table fixtures add column if not exists date date;
alter table fixtures add column if not exists time text;
alter table fixtures add column if not exists venue text;
alter table fixtures add column if not exists match_type text;
alter table fixtures add column if not exists status text;
alter table fixtures add column if not exists toss_winner_id uuid references teams(id);
alter table fixtures add column if not exists elected_to text;
alter table fixtures add column if not exists notes text;
alter table fixtures add column if not exists completed_at timestamptz;
alter table fixtures add column if not exists points_updated_at timestamptz;
alter table fixtures add column if not exists report_generated_at timestamptz;
alter table fixtures add column if not exists created_at timestamptz default now();
alter table fixtures add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fixtures_distinct_teams_check'
      and conrelid = 'fixtures'::regclass
  ) then
    alter table fixtures add constraint fixtures_distinct_teams_check check (team_a_id <> team_b_id);
  end if;
end $$;

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

alter table match_results add column if not exists app_id text unique;
alter table match_results add column if not exists fixture_id uuid unique references fixtures(id) on delete cascade;
alter table match_results add column if not exists team_a_runs int;
alter table match_results add column if not exists team_a_wickets int;
alter table match_results add column if not exists team_a_balls int;
alter table match_results add column if not exists team_b_runs int;
alter table match_results add column if not exists team_b_wickets int;
alter table match_results add column if not exists team_b_balls int;
alter table match_results add column if not exists result_type text;
alter table match_results add column if not exists winner_team_id uuid references teams(id);
alter table match_results add column if not exists player_of_match text;
alter table match_results add column if not exists notes text;
alter table match_results add column if not exists created_at timestamptz default now();
alter table match_results add column if not exists updated_at timestamptz default now();

create table if not exists player_batting_stats (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references fixtures(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  player_name text not null,
  runs int default 0,
  balls int default 0,
  created_at timestamptz default now()
);

create table if not exists player_bowling_stats (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references fixtures(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  player_name text not null,
  overs_balls int default 0,
  wickets int default 0,
  runs_given int default 0,
  created_at timestamptz default now()
);

create table if not exists tournament_settings (
  id uuid primary key default gen_random_uuid(),
  tournament_name text default 'Eagle Box Cricket',
  format text default 'Round Robin',
  max_teams int default 8,
  points_per_win int default 2,
  points_per_tie int default 1,
  points_per_loss int default 0,
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

alter table report_logs add column if not exists app_id text unique;
alter table report_logs add column if not exists title text;
alter table report_logs add column if not exists type text;
alter table report_logs add column if not exists summary text;
alter table report_logs add column if not exists generated_at timestamptz default now();

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  message text,
  type text,
  created_at timestamptz default now()
);

alter table activity_logs add column if not exists app_id text unique;
alter table activity_logs add column if not exists message text;
alter table activity_logs add column if not exists type text;
alter table activity_logs add column if not exists created_at timestamptz default now();

create table if not exists demo_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null,
  created_at timestamptz default now()
);

insert into demo_users (email, role)
values
  ('admin@eaglebox.com', 'Admin'),
  ('viewer@eaglebox.com', 'Viewer')
on conflict (email) do update set role = excluded.role;

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  email text,
  role text default 'admin',
  created_at timestamptz default now()
);

alter table teams add column if not exists logo_url text;
alter table teams add column if not exists primary_color text default '#0f9f6e';
alter table teams add column if not exists payload jsonb default '{}'::jsonb;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  team_id uuid references teams(id) on delete set null,
  name text not null,
  dob date,
  nationality text,
  role text,
  batting_style text,
  bowling_style text,
  jersey_number int,
  photo_url text,
  bio text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table fixtures add column if not exists match_date timestamptz;
alter table fixtures add column if not exists toss_decision text;
alter table fixtures add column if not exists payload jsonb default '{}'::jsonb;

create table if not exists live_matches (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references fixtures(id) unique,
  fixture_app_id text unique,
  status text default 'upcoming',
  batting_team_id uuid references teams(id),
  bowling_team_id uuid references teams(id),
  striker_id uuid references players(id),
  non_striker_id uuid references players(id),
  bowler_id uuid references players(id),
  runs int default 0,
  wickets int default 0,
  balls int default 0,
  target int,
  current_run_rate numeric default 0,
  required_run_rate numeric,
  partnership_runs int default 0,
  partnership_balls int default 0,
  last_wicket text,
  last_six_balls jsonb default '[]'::jsonb,
  fall_of_wickets jsonb default '[]'::jsonb,
  batsmen_stats jsonb default '{}'::jsonb,
  bowler_stats jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists ball_events (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  live_match_id uuid references live_matches(id) on delete cascade,
  fixture_id uuid references fixtures(id),
  over_number int,
  ball_number int,
  legal_ball boolean default true,
  runs int default 0,
  extra_type text,
  extra_runs int default 0,
  is_wicket boolean default false,
  wicket_type text,
  batsman_id uuid references players(id),
  bowler_id uuid references players(id),
  commentary text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  app_id text unique,
  fixture_id uuid references fixtures(id) unique,
  team_a_runs int,
  team_a_wickets int,
  team_a_balls int,
  team_b_runs int,
  team_b_wickets int,
  team_b_balls int,
  winner_team_id uuid references teams(id),
  result_type text,
  player_of_match_id uuid references players(id),
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists league_snapshots (
  id text primary key default 'default',
  teams jsonb not null default '[]'::jsonb,
  players jsonb not null default '[]'::jsonb,
  matches jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb,
  live_match jsonb,
  updated_at timestamptz default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
$$;

create index if not exists players_team_id_idx on players(team_id);
create index if not exists fixtures_match_date_idx on fixtures(match_date);
create index if not exists live_matches_fixture_id_idx on live_matches(fixture_id);
create index if not exists ball_events_live_match_id_idx on ball_events(live_match_id);
create index if not exists ball_events_fixture_id_idx on ball_events(fixture_id);
create index if not exists ball_events_created_at_idx on ball_events(created_at desc);
create index if not exists results_fixture_id_idx on results(fixture_id);

alter table admins enable row level security;
alter table players enable row level security;
alter table live_matches enable row level security;
alter table ball_events enable row level security;
alter table results enable row level security;
alter table league_snapshots enable row level security;

drop policy if exists "admins can read admins" on admins;
drop policy if exists "admins can manage admins" on admins;
create policy "admins can read admins" on admins for select using (public.is_admin());
create policy "admins can manage admins" on admins for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public league snapshots read" on league_snapshots;
drop policy if exists "admin league snapshots write" on league_snapshots;
create policy "public league snapshots read" on league_snapshots for select using (true);
create policy "admin league snapshots write" on league_snapshots for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public players read" on players;
drop policy if exists "admin players write" on players;
create policy "public players read" on players for select using (true);
create policy "admin players write" on players for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public live matches read" on live_matches;
drop policy if exists "admin live matches write" on live_matches;
create policy "public live matches read" on live_matches for select using (true);
create policy "admin live matches write" on live_matches for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public ball events read" on ball_events;
drop policy if exists "admin ball events write" on ball_events;
create policy "public ball events read" on ball_events for select using (true);
create policy "admin ball events write" on ball_events for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public results read" on results;
drop policy if exists "admin results write" on results;
create policy "public results read" on results for select using (true);
create policy "admin results write" on results for all using (public.is_admin()) with check (public.is_admin());

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'league_snapshots') then
      alter publication supabase_realtime add table league_snapshots;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'live_matches') then
      alter publication supabase_realtime add table live_matches;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ball_events') then
      alter publication supabase_realtime add table ball_events;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fixtures') then
      alter publication supabase_realtime add table fixtures;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'results') then
      alter publication supabase_realtime add table results;
    end if;
  end if;
end $$;

create index if not exists fixtures_status_idx on fixtures(status);
create index if not exists fixtures_date_idx on fixtures(date);
create index if not exists match_results_fixture_id_idx on match_results(fixture_id);
create unique index if not exists match_results_fixture_id_unique on match_results(fixture_id);
create index if not exists player_batting_stats_player_name_idx on player_batting_stats(player_name);
create index if not exists player_bowling_stats_player_name_idx on player_bowling_stats(player_name);

alter table teams enable row level security;
alter table fixtures enable row level security;
alter table match_results enable row level security;
alter table player_batting_stats enable row level security;
alter table player_bowling_stats enable row level security;
alter table tournament_settings enable row level security;
alter table report_logs enable row level security;
alter table activity_logs enable row level security;
alter table demo_users enable row level security;

-- Public sports-site policies: viewers can read, admins can write.
drop policy if exists "demo teams read" on teams;
drop policy if exists "demo teams write" on teams;
drop policy if exists "public teams read" on teams;
drop policy if exists "admin teams write" on teams;
create policy "public teams read" on teams for select using (true);
create policy "admin teams write" on teams for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo fixtures read" on fixtures;
drop policy if exists "demo fixtures write" on fixtures;
drop policy if exists "public fixtures read" on fixtures;
drop policy if exists "admin fixtures write" on fixtures;
create policy "public fixtures read" on fixtures for select using (true);
create policy "admin fixtures write" on fixtures for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo match results read" on match_results;
drop policy if exists "demo match results write" on match_results;
drop policy if exists "public match results read" on match_results;
drop policy if exists "admin match results write" on match_results;
create policy "public match results read" on match_results for select using (true);
create policy "admin match results write" on match_results for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo batting read" on player_batting_stats;
drop policy if exists "demo batting write" on player_batting_stats;
drop policy if exists "public batting read" on player_batting_stats;
drop policy if exists "admin batting write" on player_batting_stats;
create policy "public batting read" on player_batting_stats for select using (true);
create policy "admin batting write" on player_batting_stats for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo bowling read" on player_bowling_stats;
drop policy if exists "demo bowling write" on player_bowling_stats;
drop policy if exists "public bowling read" on player_bowling_stats;
drop policy if exists "admin bowling write" on player_bowling_stats;
create policy "public bowling read" on player_bowling_stats for select using (true);
create policy "admin bowling write" on player_bowling_stats for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo settings read" on tournament_settings;
drop policy if exists "demo settings write" on tournament_settings;
drop policy if exists "public settings read" on tournament_settings;
drop policy if exists "admin settings write" on tournament_settings;
create policy "public settings read" on tournament_settings for select using (true);
create policy "admin settings write" on tournament_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo report logs read" on report_logs;
drop policy if exists "demo report logs write" on report_logs;
drop policy if exists "public report logs read" on report_logs;
drop policy if exists "admin report logs write" on report_logs;
create policy "public report logs read" on report_logs for select using (true);
create policy "admin report logs write" on report_logs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo activity logs read" on activity_logs;
drop policy if exists "demo activity logs write" on activity_logs;
drop policy if exists "public activity logs read" on activity_logs;
drop policy if exists "admin activity logs write" on activity_logs;
create policy "public activity logs read" on activity_logs for select using (true);
create policy "admin activity logs write" on activity_logs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "demo users read" on demo_users;
create policy "demo users read" on demo_users for select using (true);
