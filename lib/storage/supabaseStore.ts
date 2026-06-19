"use client";

import {
  ballsToOversText,
  getFixtureResult,
  hasResult,
  isCompletedFixture,
  parseOversToBalls,
  recalculatePointsTable
} from "../points";
import {
  getDemoActivities,
  getDemoFixtures,
  getDemoPlayerBattingStats,
  getDemoPlayerBowlingStats,
  getDemoReports,
  getDemoTeams,
  getDemoTournamentSettings
} from "../seed";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";
import type {
  ActivityItem,
  DashboardStats,
  DemoSession,
  Fixture,
  FixtureInput,
  MatchResult,
  PlayerBattingStat,
  PlayerBowlingStat,
  PointsRow,
  ReportLog,
  ResultInput,
  ResultType,
  Team,
  TeamInput,
  TournamentSettings,
  TournamentSettingsInput,
  UserRole,
  WorkflowStatus
} from "../types";
import {
  formatNrr,
  formatScore,
  getActiveFixtures,
  getActiveTeams,
  getFixtureTitle,
  getLeaderName,
  getTeamName,
  getTodayKey,
  isActiveTeam,
  isResultStatus
} from "../utils";

type TeamRow = {
  id: string;
  app_id: string | null;
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
  app_id: string | null;
  match_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  match_type: string | null;
  status: string | null;
  toss_winner_id: string | null;
  elected_to: string | null;
  notes: string | null;
  created_at: string | null;
  completed_at?: string | null;
  points_updated_at?: string | null;
  report_generated_at?: string | null;
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

type BattingRow = {
  id: string;
  fixture_id: string;
  team_id: string;
  player_name: string;
  runs: number | null;
  balls: number | null;
  created_at: string | null;
};

type BowlingRow = {
  id: string;
  fixture_id: string;
  team_id: string;
  player_name: string;
  overs_balls: number | null;
  wickets: number | null;
  runs_given: number | null;
  created_at: string | null;
};

type SettingsRow = {
  id: string;
  tournament_name: string | null;
  format: string | null;
  max_teams: number | null;
  points_per_win: number | null;
  points_per_tie: number | null;
  points_per_loss: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type ReportRow = {
  id: string;
  title: string | null;
  type: ReportLog["type"] | null;
  summary: string | null;
  generated_at: string | null;
};

type ActivityRow = {
  id: string;
  message: string | null;
  type: ActivityItem["type"] | null;
  created_at: string | null;
};

const SESSION_KEY = "ebc_demo_session";
const LOGIN_KEY = "isLoggedIn";

function logSyncError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Supabase] ${scope}`, error);
  }
}

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

function normalizeReportType(type: unknown): ReportLog["type"] {
  const allowed: ReportLog["type"][] = [
    "Tournament Summary",
    "Teams Report",
    "Fixtures Report",
    "Results Report",
    "Points Table Report",
    "Pending Actions Report",
    "Player Stats Report"
  ];
  return allowed.includes(type as ReportLog["type"]) ? (type as ReportLog["type"]) : "Tournament Summary";
}

function normalizeActivityType(type: unknown): ActivityItem["type"] {
  const allowed: ActivityItem["type"][] = ["team", "fixture", "result", "report", "workflow", "settings", "system"];
  return allowed.includes(type as ActivityItem["type"]) ? (type as ActivityItem["type"]) : "system";
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
    status: row.status === "Inactive" || row.status === "Archived" ? row.status : "Active"
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
    electedTo: row.elected_to === "Bat" || row.elected_to === "Field" ? row.elected_to : undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    completedAt: row.completed_at ?? result?.submittedAt,
    pointsUpdatedAt: row.points_updated_at ?? undefined,
    reportGeneratedAt: row.report_generated_at ?? undefined,
    result,
    winnerTeamId: result?.winnerTeamId,
    teamAScore: result?.teamARuns,
    teamBScore: result?.teamBRuns,
    teamAWickets: result?.teamAWickets,
    teamBWickets: result?.teamBWickets,
    teamAOvers: result?.teamAOvers,
    teamBOvers: result?.teamBOvers,
    resultType: result?.resultType,
    playerOfMatch: result?.playerOfMatch
  };
}

function mapBatting(row: BattingRow): PlayerBattingStat {
  return {
    id: row.id,
    fixtureId: row.fixture_id,
    teamId: row.team_id,
    playerName: row.player_name,
    runs: row.runs ?? 0,
    balls: row.balls ?? 0,
    createdAt: row.created_at ?? new Date().toISOString()
  };
}

function mapBowling(row: BowlingRow): PlayerBowlingStat {
  return {
    id: row.id,
    fixtureId: row.fixture_id,
    teamId: row.team_id,
    playerName: row.player_name,
    oversBalls: row.overs_balls ?? 0,
    wickets: row.wickets ?? 0,
    runsGiven: row.runs_given ?? 0,
    createdAt: row.created_at ?? new Date().toISOString()
  };
}

function mapSettings(row?: SettingsRow | null): TournamentSettings {
  const defaults = getDemoTournamentSettings();
  if (!row) return defaults;
  return {
    id: row.id,
    tournamentName: row.tournament_name ?? defaults.tournamentName,
    format:
      row.format === "Knockout" || row.format === "Group Stage + Knockout" || row.format === "Round Robin"
        ? row.format
        : defaults.format,
    maxTeams: row.max_teams ?? defaults.maxTeams,
    pointsPerWin: row.points_per_win ?? defaults.pointsPerWin,
    pointsPerTie: row.points_per_tie ?? defaults.pointsPerTie,
    pointsPerLoss: row.points_per_loss ?? defaults.pointsPerLoss,
    createdAt: row.created_at ?? defaults.createdAt,
    updatedAt: row.updated_at ?? defaults.updatedAt
  };
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nextMatchId(fixtures: Fixture[]): string {
  const highest = fixtures.reduce((max, fixture) => {
    const numeric = Number(fixture.matchId.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);
  return `EBC-${String(highest + 1).padStart(3, "0")}`;
}

async function validateTeamInput(input: TeamInput, currentTeamId?: string): Promise<void> {
  if (!input.name.trim()) throw new Error("Team name is required.");
  if (!input.shortName.trim()) throw new Error("Short code is required.");
  const teams = await getTeams();
  const normalizedName = input.name.trim().toLowerCase();
  const normalizedShortCode = input.shortName.trim().toLowerCase();

  if (teams.some((team) => team.id !== currentTeamId && team.name.trim().toLowerCase() === normalizedName)) {
    throw new Error("Team name already exists.");
  }

  if (teams.some((team) => team.id !== currentTeamId && team.shortName.trim().toLowerCase() === normalizedShortCode)) {
    throw new Error("Short code already exists.");
  }
}

function validateFixtureInput(input: FixtureInput, teams: Team[]): void {
  if (!input.teamAId) throw new Error("Team A is required.");
  if (!input.teamBId) throw new Error("Team B is required.");
  if (input.teamAId === input.teamBId) throw new Error("Team A and Team B must be different.");
  if (!input.date) throw new Error("Date is required.");
  if (!input.time) throw new Error("Time is required.");
  if (!input.venue.trim()) throw new Error("Venue is required.");
  const teamA = teams.find((team) => team.id === input.teamAId);
  const teamB = teams.find((team) => team.id === input.teamBId);
  if (!isActiveTeam(teamA) || !isActiveTeam(teamB)) {
    throw new Error("Fixtures can only be created with active teams.");
  }
  if (input.tossWinnerTeamId && ![input.teamAId, input.teamBId].includes(input.tossWinnerTeamId)) {
    throw new Error("Toss winner must be one of the fixture teams.");
  }
}

function validateResultInput(input: ResultInput, fixture: Fixture): void {
  parseOversToBalls(input.teamAOvers || "0");
  parseOversToBalls(input.teamBOvers || "0");

  if (input.teamAWickets < 0 || input.teamAWickets > 10 || input.teamBWickets < 0 || input.teamBWickets > 10) {
    throw new Error("Wickets must be between 0 and 10.");
  }

  if (input.tossWinnerTeamId && ![fixture.teamAId, fixture.teamBId].includes(input.tossWinnerTeamId)) {
    throw new Error("Toss winner must be one of the fixture teams.");
  }

  input.battingStats?.forEach((stat) => {
    if (!stat.playerName.trim()) throw new Error("Batter name is required.");
    if (![fixture.teamAId, fixture.teamBId].includes(stat.teamId)) throw new Error("Batter team must be one of the fixture teams.");
    if (stat.runs < 0 || stat.balls < 0) throw new Error("Batter runs and balls must be 0 or greater.");
  });

  input.bowlingStats?.forEach((stat) => {
    if (!stat.playerName.trim()) throw new Error("Bowler name is required.");
    if (![fixture.teamAId, fixture.teamBId].includes(stat.teamId)) throw new Error("Bowler team must be one of the fixture teams.");
    if (stat.oversBalls < 0 || stat.wickets < 0 || stat.runsGiven < 0) throw new Error("Bowling stats must be 0 or greater.");
    if (stat.wickets > 10) throw new Error("Bowler wickets must be between 0 and 10.");
  });
}

async function getResultsByFixture(): Promise<Map<string, MatchResult>> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("match_results").select("*");
  if (error) throw error;
  return new Map((data as ResultRow[]).map((row) => [row.fixture_id ?? "", mapResult(row)]));
}

export async function getTeams(): Promise<Team[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("teams").select("*").order("created_at");
  if (error) throw error;
  return (data as TeamRow[]).map(mapTeam);
}

export async function createTeam(input: TeamInput): Promise<Team> {
  await validateTeamInput(input);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: input.name.trim(),
      short_code: input.shortName.trim().toUpperCase(),
      captain: input.captain.trim(),
      coach: input.coach.trim(),
      home_venue: input.homeVenue.trim(),
      contact: input.contact?.trim() || null,
      status: input.status
    })
    .select("*")
    .single();
  if (error) throw error;
  await addActivityLog(`${input.name.trim()} was added to the tournament.`, "team");
  return mapTeam(data as TeamRow);
}

export async function updateTeam(teamId: string, input: TeamInput): Promise<Team[]> {
  await validateTeamInput(input, teamId);
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("teams")
    .update({
      name: input.name.trim(),
      short_code: input.shortName.trim().toUpperCase(),
      captain: input.captain.trim(),
      coach: input.coach.trim(),
      home_venue: input.homeVenue.trim(),
      contact: input.contact?.trim() || null,
      status: input.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", teamId);
  if (error) throw error;
  await addActivityLog(`${input.name.trim()} details were updated.`, "team");
  return getTeams();
}

export async function deleteTeam(teamId: string): Promise<Team[]> {
  const supabase = requireSupabase();
  const teams = await getTeams().catch(() => []);
  const target = teams.find((team) => team.id === teamId);
  const fixtures = await getFixtures().catch(() => []);
  const linkedFixtures = fixtures.filter((fixture) => fixture.teamAId === teamId || fixture.teamBId === teamId);
  const shouldArchive = linkedFixtures.length > 0;
  const { error } = shouldArchive
    ? await supabase.from("teams").update({ status: "Archived", updated_at: new Date().toISOString() }).eq("id", teamId)
    : await supabase.from("teams").delete().eq("id", teamId);
  if (error) throw error;
  await addActivityLog(`${target?.name ?? "A team"} was ${shouldArchive ? "archived" : "deleted"}.`, "team");
  return getTeams();
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
  const [teams, fixtures] = await Promise.all([getTeams(), getFixtures().catch(() => [])]);
  validateFixtureInput(input, teams);
  const { data, error } = await supabase
    .from("fixtures")
    .insert({
      match_id: nextMatchId(fixtures),
      team_a_id: input.teamAId,
      team_b_id: input.teamBId,
      date: input.date || null,
      time: input.time,
      venue: input.venue.trim(),
      match_type: input.matchType,
      status: input.status,
      toss_winner_id: input.tossWinnerTeamId || null,
      elected_to: input.electedTo || null,
      notes: input.notes?.trim() || null
    })
    .select("*")
    .single();
  if (error) throw error;
  const fixture = mapFixture(data as FixtureRow);
  await addActivityLog(`${fixture.matchId} fixture was created.`, "fixture");
  return fixture;
}

export async function updateFixture(fixtureId: string, input: FixtureInput): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const teams = await getTeams();
  validateFixtureInput(input, teams);
  const { error } = await supabase
    .from("fixtures")
    .update({
      team_a_id: input.teamAId,
      team_b_id: input.teamBId,
      date: input.date || null,
      time: input.time,
      venue: input.venue.trim(),
      match_type: input.matchType,
      status: input.status,
      toss_winner_id: input.tossWinnerTeamId || null,
      elected_to: input.electedTo || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", fixtureId);
  if (error) throw error;
  await addActivityLog(`${input.venue.trim()} fixture details were updated.`, "fixture");
  return getFixtures();
}

export async function deleteFixture(fixtureId: string): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const fixtures = await getFixtures().catch(() => []);
  const target = fixtures.find((fixture) => fixture.id === fixtureId);
  const { error } = await supabase.from("fixtures").delete().eq("id", fixtureId);
  if (error) throw error;
  await addActivityLog(`${target?.matchId ?? "A fixture"} was deleted.`, "fixture");
  return getFixtures();
}

export async function getMatchResults(): Promise<Array<MatchResult & { fixtureId: string }>> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("match_results").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ResultRow[]).map((row) => ({ ...mapResult(row), fixtureId: row.fixture_id ?? "" }));
}

function resolveWinner(fixture: Fixture, input: ResultInput): string | null {
  if (input.resultType === "Tie" || input.resultType === "No result") return null;
  if (input.winnerTeamId) return input.winnerTeamId;
  if (input.teamAScore > input.teamBScore) return fixture.teamAId;
  if (input.teamBScore > input.teamAScore) return fixture.teamBId;
  return null;
}

export async function saveMatchResult(fixtureId: string, input: ResultInput): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const fixtures = await getFixtures();
  const fixture = fixtures.find((item) => item.id === fixtureId);
  if (!fixture) throw new Error("Fixture was not found.");

  validateResultInput(input, fixture);
  const winnerTeamId = resolveWinner(fixture, input);
  const now = new Date().toISOString();
  const { error: resultError } = await supabase.from("match_results").upsert(
    {
      fixture_id: fixtureId,
      team_a_runs: input.teamAScore,
      team_a_wickets: input.teamAWickets,
      team_a_balls: parseOversToBalls(input.teamAOvers || "0"),
      team_b_runs: input.teamBScore,
      team_b_wickets: input.teamBWickets,
      team_b_balls: parseOversToBalls(input.teamBOvers || "0"),
      result_type: input.resultType,
      winner_team_id: winnerTeamId,
      player_of_match: input.playerOfMatch?.trim() || null,
      notes: input.notes?.trim() || null,
      created_at: now
    },
    { onConflict: "fixture_id" }
  );
  if (resultError) throw resultError;

  const { error: fixtureError } = await supabase
    .from("fixtures")
    .update({
      status: "Completed",
      toss_winner_id: input.tossWinnerTeamId || fixture.tossWinnerTeamId || null,
      elected_to: input.electedTo || fixture.electedTo || null,
      completed_at: now,
      points_updated_at: null,
      report_generated_at: null,
      updated_at: now
    })
    .eq("id", fixtureId);
  if (fixtureError) throw fixtureError;

  await supabase.from("player_batting_stats").delete().eq("fixture_id", fixtureId);
  if (input.battingStats?.length) {
    const { error } = await supabase.from("player_batting_stats").insert(
      input.battingStats.map((stat) => ({
        fixture_id: fixtureId,
        team_id: stat.teamId,
        player_name: stat.playerName.trim(),
        runs: stat.runs,
        balls: stat.balls
      }))
    );
    if (error) throw error;
  }

  await supabase.from("player_bowling_stats").delete().eq("fixture_id", fixtureId);
  if (input.bowlingStats?.length) {
    const { error } = await supabase.from("player_bowling_stats").insert(
      input.bowlingStats.map((stat) => ({
        fixture_id: fixtureId,
        team_id: stat.teamId,
        player_name: stat.playerName.trim(),
        overs_balls: stat.oversBalls,
        wickets: stat.wickets,
        runs_given: stat.runsGiven
      }))
    );
    if (error) throw error;
  }

  const teams = await getTeams();
  const title = getFixtureTitle(fixture, teams);
  const outcome =
    input.resultType === "No result"
      ? "No result recorded"
      : winnerTeamId
        ? `${getTeamName(teams, winnerTeamId)} won`
        : "Match tied";
  await addActivityLog(`${title} result saved. ${outcome}.`, "result");
  await createReport({
    title: `Result saved: ${fixture.matchId}`,
    type: "Results Report",
    fixtureId,
    summary: `${title} - ${formatScore(input.teamAScore, input.teamAWickets)} vs ${formatScore(input.teamBScore, input.teamBWickets)}. ${outcome}.`
  });

  return getFixtures();
}

export async function getPlayerBattingStats(): Promise<PlayerBattingStat[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("player_batting_stats").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as BattingRow[]).map(mapBatting);
}

export async function getPlayerBowlingStats(): Promise<PlayerBowlingStat[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("player_bowling_stats").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as BowlingRow[]).map(mapBowling);
}

export async function getTournamentSettings(): Promise<TournamentSettings> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("tournament_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapSettings(data as SettingsRow);

  const defaults = getDemoTournamentSettings();
  const { data: inserted, error: insertError } = await supabase
    .from("tournament_settings")
    .insert({
      tournament_name: defaults.tournamentName,
      format: defaults.format,
      max_teams: defaults.maxTeams,
      points_per_win: defaults.pointsPerWin,
      points_per_tie: defaults.pointsPerTie,
      points_per_loss: defaults.pointsPerLoss
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return mapSettings(inserted as SettingsRow);
}

export async function updateTournamentSettings(input: TournamentSettingsInput): Promise<TournamentSettings> {
  const supabase = requireSupabase();
  const current = await getTournamentSettings();
  const { data, error } = await supabase
    .from("tournament_settings")
    .update({
      tournament_name: input.tournamentName.trim() || "Eagle Box Cricket",
      format: input.format,
      max_teams: Math.max(2, Number(input.maxTeams) || current.maxTeams),
      points_per_win: Math.max(0, Number(input.pointsPerWin) || 0),
      points_per_tie: Math.max(0, Number(input.pointsPerTie) || 0),
      points_per_loss: Math.max(0, Number(input.pointsPerLoss) || 0),
      updated_at: new Date().toISOString()
    })
    .eq("id", current.id)
    .select("*")
    .single();
  if (error) throw error;
  await addActivityLog("Tournament settings were updated.", "settings");
  return mapSettings(data as SettingsRow);
}

export async function getPointsTable(): Promise<PointsRow[]> {
  const [teams, fixtures, settings] = await Promise.all([getTeams(), getFixtures(), getTournamentSettings()]);
  return recalculatePointsTable(teams, fixtures, settings);
}

export async function recalculateAndSavePointsTable(teams?: Team[], fixtures?: Fixture[]): Promise<PointsRow[]> {
  const [resolvedTeams, resolvedFixtures, settings] = await Promise.all([
    teams ? Promise.resolve(teams) : getTeams(),
    fixtures ? Promise.resolve(fixtures) : getFixtures(),
    getTournamentSettings()
  ]);
  return recalculatePointsTable(resolvedTeams, resolvedFixtures, settings);
}

export async function getReports(): Promise<ReportLog[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("report_logs").select("*").order("generated_at", { ascending: false });
  if (error) throw error;
  return (data as ReportRow[]).map((row) => ({
    id: row.id,
    title: row.title ?? "",
    type: normalizeReportType(row.type),
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
    type: normalizeReportType(data.type),
    summary: data.summary ?? "",
    generatedAt: data.generated_at ?? new Date().toISOString()
  };
}

export async function getActivityLogs(): Promise<ActivityItem[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ActivityRow[]).map((row) => ({
    id: row.id,
    message: row.message ?? "",
    type: normalizeActivityType(row.type),
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
    type: normalizeActivityType(data.type),
    timestamp: data.created_at ?? new Date().toISOString()
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [teams, fixtures, pointsTable, reports] = await Promise.all([getTeams(), getFixtures(), getPointsTable(), getReports()]);
  const activeTeams = getActiveTeams(teams);
  const activeFixtures = getActiveFixtures(fixtures, teams);
  const bestNrrRow = [...pointsTable].filter((r) => r.played > 0).sort((a, b) => b.netRunRate - a.netRunRate)[0];
  return {
    totalTeams: activeTeams.length,
    totalFixtures: activeFixtures.length,
    completedMatches: activeFixtures.filter(isCompletedFixture).length,
    upcomingMatches: activeFixtures.filter((fixture) => !isResultStatus(fixture.status)).length,
    pendingResults: activeFixtures.filter(
      (fixture) =>
        (fixture.status === "Scheduled" || fixture.status === "Live") &&
        !hasResult(fixture) &&
        fixture.date <= getTodayKey()
    ).length,
    leaderTeamName: getLeaderName(activeTeams, pointsTable),
    bestNrr: bestNrrRow ? `${getTeamName(activeTeams, bestNrrRow.teamId)} (${formatNrr(bestNrrRow.netRunRate)})` : "No NRR yet",
    reportsGenerated: reports.length,
    alertsCount: 0,
    databaseStatus: "Database: Supabase Connected"
  };
}

export async function transitionFixtureStatus(fixtureId: string, nextStatus: WorkflowStatus): Promise<Fixture[]> {
  const supabase = requireSupabase();
  const fixtures = await getFixtures();
  const teams = await getTeams();
  const target = fixtures.find((fixture) => fixture.id === fixtureId);
  if (!target) throw new Error("Fixture was not found.");
  if (nextStatus === "Completed" && !hasResult(target)) throw new Error("Cannot mark completed without entering a match result.");
  if (nextStatus === "Points Updated" && !hasResult(target)) throw new Error("Enter a result before updating points.");
  if (nextStatus === "Report Generated" && target.status !== "Points Updated") {
    throw new Error("Generate a report only after points are updated.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("fixtures")
    .update({
      status: nextStatus,
      completed_at:
        nextStatus === "Completed" || nextStatus === "Points Updated" || nextStatus === "Report Generated"
          ? target.completedAt ?? now
          : target.completedAt ?? null,
      points_updated_at:
        nextStatus === "Points Updated" || nextStatus === "Report Generated"
          ? target.pointsUpdatedAt ?? now
          : target.pointsUpdatedAt ?? null,
      report_generated_at: nextStatus === "Report Generated" ? now : target.reportGeneratedAt ?? null,
      updated_at: now
    })
    .eq("id", fixtureId);
  if (error) throw error;

  await addActivityLog(`${target.matchId} moved to ${nextStatus}.`, "workflow");
  if (nextStatus === "Report Generated") {
    await createReport({
      title: `Match report generated: ${target.matchId}`,
      type: "Fixtures Report",
      fixtureId,
      summary: `${getFixtureTitle(target, teams)} report generated.`
    });
  }
  return getFixtures();
}

async function deleteAllRows(table: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

async function seedSupabaseDemoData(): Promise<void> {
  const supabase = requireSupabase();
  const teams = getDemoTeams();
  const fixtures = getDemoFixtures();
  const batting = getDemoPlayerBattingStats();
  const bowling = getDemoPlayerBowlingStats();
  const reports = getDemoReports();
  const activities = getDemoActivities();
  const settings = getDemoTournamentSettings();

  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .upsert(
      teams.map((team) => ({
        app_id: team.id,
        name: team.name,
        short_code: team.shortName,
        captain: team.captain,
        coach: team.coach,
        home_venue: team.homeVenue,
        contact: team.contact ?? null,
        status: team.status,
        created_at: team.createdAt
      })),
      { onConflict: "app_id" }
    )
    .select("id, app_id");
  if (teamError) throw teamError;
  const teamIdMap = new Map((teamRows ?? []).map((row: { id: string; app_id: string }) => [row.app_id, row.id]));

  const { data: fixtureRows, error: fixtureError } = await supabase
    .from("fixtures")
    .upsert(
      fixtures.map((fixture) => ({
        app_id: fixture.id,
        match_id: fixture.matchId,
        team_a_id: teamIdMap.get(fixture.teamAId),
        team_b_id: teamIdMap.get(fixture.teamBId),
        date: fixture.date || null,
        time: fixture.time || null,
        venue: fixture.venue,
        match_type: fixture.matchType,
        status: fixture.status,
        toss_winner_id: fixture.tossWinnerTeamId ? teamIdMap.get(fixture.tossWinnerTeamId) ?? null : null,
        elected_to: fixture.electedTo ?? null,
        notes: fixture.notes ?? null,
        created_at: fixture.createdAt,
        completed_at: fixture.completedAt ?? null,
        points_updated_at: fixture.pointsUpdatedAt ?? null,
        report_generated_at: fixture.reportGeneratedAt ?? null
      })),
      { onConflict: "app_id" }
    )
    .select("id, app_id");
  if (fixtureError) throw fixtureError;
  const fixtureIdMap = new Map((fixtureRows ?? []).map((row: { id: string; app_id: string }) => [row.app_id, row.id]));

  const resultRows = fixtures
    .map((fixture) => {
      const result = getFixtureResult(fixture);
      const fixtureId = fixtureIdMap.get(fixture.id);
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
        winner_team_id: result.winnerTeamId ? teamIdMap.get(result.winnerTeamId) ?? null : null,
        player_of_match: result.playerOfMatch ?? null,
        notes: result.notes ?? null,
        created_at: result.submittedAt
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (resultRows.length > 0) {
    const { error } = await supabase.from("match_results").upsert(resultRows, { onConflict: "app_id" });
    if (error) throw error;
  }

  if (batting.length > 0) {
    const { error } = await supabase.from("player_batting_stats").insert(
      batting.map((stat) => ({
        fixture_id: fixtureIdMap.get(stat.fixtureId),
        team_id: teamIdMap.get(stat.teamId),
        player_name: stat.playerName,
        runs: stat.runs,
        balls: stat.balls,
        created_at: stat.createdAt
      }))
    );
    if (error) throw error;
  }

  if (bowling.length > 0) {
    const { error } = await supabase.from("player_bowling_stats").insert(
      bowling.map((stat) => ({
        fixture_id: fixtureIdMap.get(stat.fixtureId),
        team_id: teamIdMap.get(stat.teamId),
        player_name: stat.playerName,
        overs_balls: stat.oversBalls,
        wickets: stat.wickets,
        runs_given: stat.runsGiven,
        created_at: stat.createdAt
      }))
    );
    if (error) throw error;
  }

  if (reports.length > 0) {
    const { error } = await supabase.from("report_logs").upsert(
      reports.map((report) => ({
        app_id: report.id,
        title: report.title,
        type: report.type,
        summary: report.summary,
        generated_at: report.generatedAt
      })),
      { onConflict: "app_id" }
    );
    if (error) throw error;
  }

  if (activities.length > 0) {
    const { error } = await supabase.from("activity_logs").upsert(
      activities.map((activity) => ({
        app_id: activity.id,
        message: activity.message,
        type: activity.type,
        created_at: activity.timestamp
      })),
      { onConflict: "app_id" }
    );
    if (error) throw error;
  }

  const { error: settingsError } = await supabase.from("tournament_settings").insert({
    tournament_name: settings.tournamentName,
    format: settings.format,
    max_teams: settings.maxTeams,
    points_per_win: settings.pointsPerWin,
    points_per_tie: settings.pointsPerTie,
    points_per_loss: settings.pointsPerLoss,
    created_at: settings.createdAt,
    updated_at: settings.updatedAt
  });
  if (settingsError) throw settingsError;
}

export async function resetSupabaseDemoData(): Promise<void> {
  for (const table of [
    "player_batting_stats",
    "player_bowling_stats",
    "match_results",
    "fixtures",
    "teams",
    "report_logs",
    "activity_logs",
    "tournament_settings"
  ]) {
    await deleteAllRows(table);
  }
}

export async function resetDemoData(): Promise<{
  teams: Team[];
  fixtures: Fixture[];
  pointsTable: PointsRow[];
  reports: ReportLog[];
  activities: ActivityItem[];
  battingStats: PlayerBattingStat[];
  bowlingStats: PlayerBowlingStat[];
  settings: TournamentSettings;
}> {
  await resetSupabaseDemoData();
  await seedSupabaseDemoData();
  const [teams, fixtures, pointsTable, reports, activities, battingStats, bowlingStats, settings] = await Promise.all([
    getTeams(),
    getFixtures(),
    getPointsTable(),
    getReports(),
    getActivityLogs(),
    getPlayerBattingStats(),
    getPlayerBowlingStats(),
    getTournamentSettings()
  ]);
  return { teams, fixtures, pointsTable, reports, activities, battingStats, bowlingStats, settings };
}

export async function seedDemoDataIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const teams = await getTeams();
    if (teams.length === 0) {
      await seedSupabaseDemoData();
    } else {
      await getTournamentSettings();
    }
  } catch (error) {
    logSyncError("seed demo data", error);
    throw error;
  }
}

export function getCurrentSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw) as DemoSession;
      if (session.role === "Admin" || session.role === "Viewer") return session;
    } catch {
      return null;
    }
  }
  if (window.localStorage.getItem(LOGIN_KEY) === "true") {
    return { email: "admin@eaglebox.com", role: "Admin", loggedInAt: new Date().toISOString() };
  }
  return null;
}

export function getCurrentRole(): UserRole | null {
  return getCurrentSession()?.role ?? null;
}

export function isAdmin(): boolean {
  return getCurrentRole() === "Admin";
}

export function isLoggedIn(): boolean {
  return Boolean(getCurrentSession());
}

export function login(email: string, password: string): DemoSession | null {
  if (typeof window === "undefined") return null;
  const normalizedEmail = email.trim().toLowerCase();
  const role: UserRole | null =
    normalizedEmail === "admin@eaglebox.com" && password === "admin123"
      ? "Admin"
      : normalizedEmail === "viewer@eaglebox.com" && password === "viewer123"
        ? "Viewer"
        : null;
  if (!role) return null;

  const session: DemoSession = { email: normalizedEmail, role, loggedInAt: new Date().toISOString() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(LOGIN_KEY, "true");
  return session;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(LOGIN_KEY);
}

export const addTeam = createTeam;
export const addFixture = createFixture;
export const submitFixtureResult = saveMatchResult;
export const addReportLog = createReport;
export const getActivities = getActivityLogs;
export const addActivity = addActivityLog;
