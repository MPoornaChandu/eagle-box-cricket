"use client";

import { ballsToOversText, getFixtureResult, parseOversToBalls } from "../points";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";
import type {
  ActivityItem,
  Fixture,
  FixtureInput,
  MatchResult,
  ReportLog,
  ResultInput,
  ResultType,
  Team,
  TeamInput,
  WorkflowStatus
} from "../types";

interface SyncedRow {
  id: string;
  app_id: string;
}

function rowMap(rows: SyncedRow[] | null): Map<string, string> {
  return new Map((rows ?? []).map((row) => [row.app_id, row.id]));
}

function logSyncError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Supabase sync] ${scope}`, error);
  }
}

export async function resetSupabaseDemoData(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  for (const table of ["match_results", "fixtures", "teams", "report_logs", "activity_logs"]) {
    const { error } = await supabase.from(table).delete().neq("app_id", "__never__");
    if (error) {
      logSyncError(`reset ${table}`, error);
      return;
    }
  }
}

export async function syncTournamentToSupabase(input: {
  teams: Team[];
  fixtures: Fixture[];
  reports: ReportLog[];
  activities: ActivityItem[];
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const teamRows = input.teams.map((team) => ({
    app_id: team.id,
    name: team.name,
    short_code: team.shortName,
    captain: team.captain,
    coach: team.coach,
    home_venue: team.homeVenue,
    contact: team.contact ?? null,
    status: team.status,
    created_at: team.createdAt
  }));

  const { data: syncedTeams, error: teamsError } = await supabase
    .from("teams")
    .upsert(teamRows, { onConflict: "app_id" })
    .select("id, app_id");

  if (teamsError) {
    logSyncError("teams", teamsError);
    return;
  }

  const teamIds = rowMap(syncedTeams);
  const fixtureRows = input.fixtures
    .filter((fixture) => teamIds.has(fixture.teamAId) && teamIds.has(fixture.teamBId))
    .map((fixture) => ({
      app_id: fixture.id,
      match_id: fixture.matchId,
      team_a_id: teamIds.get(fixture.teamAId),
      team_b_id: teamIds.get(fixture.teamBId),
      date: fixture.date || null,
      time: fixture.time || null,
      venue: fixture.venue,
      match_type: fixture.matchType,
      status: fixture.status,
      toss_winner_id: fixture.tossWinnerTeamId ? teamIds.get(fixture.tossWinnerTeamId) ?? null : null,
      notes: fixture.notes ?? null,
      created_at: fixture.createdAt
    }));

  const { data: syncedFixtures, error: fixturesError } = await supabase
    .from("fixtures")
    .upsert(fixtureRows, { onConflict: "app_id" })
    .select("id, app_id");

  if (fixturesError) {
    logSyncError("fixtures", fixturesError);
    return;
  }

  const fixtureIds = rowMap(syncedFixtures);
  const resultRows = input.fixtures
    .map((fixture) => {
      const result = getFixtureResult(fixture);
      const fixtureId = fixtureIds.get(fixture.id);
      if (!result || !fixtureId) return null;

      return {
        app_id: fixture.id,
        fixture_id: fixtureId,
        team_a_runs: result.teamARuns,
        team_a_wickets: result.teamAWickets,
        team_a_balls: parseOversToBalls(result.teamAOvers),
        team_b_runs: result.teamBRuns,
        team_b_wickets: result.teamBWickets,
        team_b_balls: parseOversToBalls(result.teamBOvers),
        result_type: result.resultType,
        winner_team_id: result.winnerTeamId ? teamIds.get(result.winnerTeamId) ?? null : null,
        player_of_match: result.playerOfMatch ?? null,
        notes: result.notes ?? null,
        created_at: result.submittedAt
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (resultRows.length > 0) {
    const { error: resultsError } = await supabase
      .from("match_results")
      .upsert(resultRows, { onConflict: "app_id" });

    if (resultsError) {
      logSyncError("match_results", resultsError);
    }
  }

  const reportRows = input.reports.map((report) => ({
    app_id: report.id,
    title: report.title,
    type: report.type,
    summary: report.summary,
    generated_at: report.generatedAt
  }));

  if (reportRows.length > 0) {
    const { error: reportsError } = await supabase
      .from("report_logs")
      .upsert(reportRows, { onConflict: "app_id" });

    if (reportsError) {
      logSyncError("report_logs", reportsError);
    }
  }

  const activityRows = input.activities.map((activity) => ({
    app_id: activity.id,
    message: activity.message,
    type: activity.type,
    created_at: activity.timestamp
  }));

  if (activityRows.length > 0) {
    const { error: activitiesError } = await supabase
      .from("activity_logs")
      .upsert(activityRows, { onConflict: "app_id" });

    if (activitiesError) {
      logSyncError("activity_logs", activitiesError);
    }
  }
}

type TeamRow = {
  id: string;
  name: string;
  short_code: string;
  captain: string | null;
  coach: string | null;
  home_venue: string | null;
  contact: string | null;
  status: string | null;
  created_at: string | null;
};

type FixtureRow = {
  id: string;
  match_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  match_type: string | null;
  status: string | null;
  toss_winner_id: string | null;
  notes: string | null;
  created_at: string | null;
};

type ResultRow = {
  id: string;
  fixture_id: string | null;
  team_a_runs: number | null;
  team_a_wickets: number | null;
  team_a_balls: number | null;
  team_b_runs: number | null;
  team_b_wickets: number | null;
  team_b_balls: number | null;
  result_type: string | null;
  winner_team_id: string | null;
  player_of_match: string | null;
  notes: string | null;
  created_at: string | null;
};

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_code,
    captain: row.captain ?? "",
    coach: row.coach ?? "",
    homeVenue: row.home_venue ?? "",
    contact: row.contact ?? undefined,
    logoColor: "#22c55e",
    createdAt: row.created_at ?? new Date().toISOString(),
    status: row.status === "Inactive" ? "Inactive" : "Active"
  };
}

function mapResult(row: ResultRow): MatchResult {
  return {
    teamARuns: row.team_a_runs ?? 0,
    teamAWickets: row.team_a_wickets ?? 0,
    teamAOvers: ballsToOversText(row.team_a_balls ?? 0),
    teamBRuns: row.team_b_runs ?? 0,
    teamBWickets: row.team_b_wickets ?? 0,
    teamBOvers: ballsToOversText(row.team_b_balls ?? 0),
    resultType: (row.result_type ?? "Normal win") as ResultType,
    winnerTeamId: row.winner_team_id ?? undefined,
    playerOfMatch: row.player_of_match ?? undefined,
    notes: row.notes ?? undefined,
    submittedAt: row.created_at ?? new Date().toISOString()
  };
}

function mapFixture(row: FixtureRow, result?: MatchResult): Fixture {
  return {
    id: row.id,
    matchId: row.match_id ?? row.id,
    teamAId: row.team_a_id ?? "",
    teamBId: row.team_b_id ?? "",
    date: row.date ?? "",
    time: row.time ?? "",
    venue: row.venue ?? "",
    matchType: (row.match_type ?? "League") as Fixture["matchType"],
    status: (row.status ?? "Draft") as WorkflowStatus,
    tossWinnerTeamId: row.toss_winner_id ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    result,
    winnerTeamId: result?.winnerTeamId,
    teamAScore: result?.teamARuns,
    teamBScore: result?.teamBRuns,
    teamAWickets: result?.teamAWickets,
    teamBWickets: result?.teamBWickets,
    teamAOvers: result?.teamAOvers,
    teamBOvers: result?.teamBOvers,
    resultType: result?.resultType,
    playerOfMatch: result?.playerOfMatch,
    completedAt: result?.submittedAt
  };
}

export async function getTeams(): Promise<Team[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("teams").select("*").order("created_at");
  if (error) throw error;
  return (data as TeamRow[]).map(mapTeam);
}

export async function createTeam(input: TeamInput): Promise<Team> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: input.name,
      short_code: input.shortName,
      captain: input.captain,
      coach: input.coach,
      home_venue: input.homeVenue,
      contact: input.contact ?? null,
      status: input.status
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapTeam(data as TeamRow);
}

export async function updateTeam(teamId: string, input: TeamInput): Promise<Team[]> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("teams")
    .update({
      name: input.name,
      short_code: input.shortName,
      captain: input.captain,
      coach: input.coach,
      home_venue: input.homeVenue,
      contact: input.contact ?? null,
      status: input.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", teamId);
  if (error) throw error;
  return getTeams();
}

export async function deleteTeam(teamId: string): Promise<Team[]> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) throw error;
  return getTeams();
}

async function getResultsByFixture(): Promise<Map<string, MatchResult>> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("match_results").select("*");
  if (error) throw error;
  return new Map((data as ResultRow[]).map((row) => [row.fixture_id ?? "", mapResult(row)]));
}

export async function getFixtures(): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const [{ data, error }, resultsByFixture] = await Promise.all([
    supabase.from("fixtures").select("*").order("date", { ascending: true }),
    getResultsByFixture()
  ]);
  if (error) throw error;
  return (data as FixtureRow[]).map((fixture) => mapFixture(fixture, resultsByFixture.get(fixture.id)));
}

export async function createFixture(input: FixtureInput): Promise<Fixture> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("fixtures")
    .insert({
      team_a_id: input.teamAId,
      team_b_id: input.teamBId,
      date: input.date || null,
      time: input.time,
      venue: input.venue,
      match_type: input.matchType,
      status: input.status,
      toss_winner_id: input.tossWinnerTeamId || null,
      notes: input.notes ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapFixture(data as FixtureRow);
}

export async function updateFixture(fixtureId: string, input: FixtureInput): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("fixtures")
    .update({
      team_a_id: input.teamAId,
      team_b_id: input.teamBId,
      date: input.date || null,
      time: input.time,
      venue: input.venue,
      match_type: input.matchType,
      status: input.status,
      toss_winner_id: input.tossWinnerTeamId || null,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", fixtureId);
  if (error) throw error;
  return getFixtures();
}

export async function deleteFixture(fixtureId: string): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("fixtures").delete().eq("id", fixtureId);
  if (error) throw error;
  return getFixtures();
}

export async function getMatchResults(): Promise<Array<MatchResult & { fixtureId: string }>> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("match_results").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ResultRow[]).map((row) => ({ ...mapResult(row), fixtureId: row.fixture_id ?? "" }));
}

export async function saveMatchResult(fixtureId: string, input: ResultInput): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const winnerTeamId =
    input.resultType === "Tie" || input.resultType === "No result"
      ? null
      : input.winnerTeamId || null;
  const { error: resultError } = await supabase.from("match_results").upsert(
    {
      fixture_id: fixtureId,
      team_a_runs: input.teamAScore,
      team_a_wickets: input.teamAWickets,
      team_a_balls: parseOversToBalls(input.teamAOvers),
      team_b_runs: input.teamBScore,
      team_b_wickets: input.teamBWickets,
      team_b_balls: parseOversToBalls(input.teamBOvers),
      result_type: input.resultType,
      winner_team_id: winnerTeamId,
      player_of_match: input.playerOfMatch ?? null,
      notes: input.notes ?? null
    },
    { onConflict: "fixture_id" }
  );
  if (resultError) throw resultError;

  const { error: fixtureError } = await supabase
    .from("fixtures")
    .update({ status: "Completed", updated_at: new Date().toISOString() })
    .eq("id", fixtureId);
  if (fixtureError) throw fixtureError;
  return getFixtures();
}

export async function getReports(): Promise<ReportLog[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("report_logs").select("*").order("generated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title ?? "",
    type: row.type,
    summary: row.summary ?? "",
    generatedAt: row.generated_at ?? new Date().toISOString()
  }));
}

export async function createReport(input: Omit<ReportLog, "id" | "generatedAt">): Promise<ReportLog> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("report_logs")
    .insert({ title: input.title, type: input.type, summary: input.summary })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    title: data.title ?? "",
    type: data.type,
    summary: data.summary ?? "",
    generatedAt: data.generated_at ?? new Date().toISOString()
  };
}

export async function getActivityLogs(): Promise<ActivityItem[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    message: row.message ?? "",
    type: row.type ?? "system",
    timestamp: row.created_at ?? new Date().toISOString()
  }));
}

export async function addActivityLog(message: string, type: ActivityItem["type"] = "system"): Promise<ActivityItem> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({ message, type })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    message: data.message ?? "",
    type: data.type ?? "system",
    timestamp: data.created_at ?? new Date().toISOString()
  };
}
