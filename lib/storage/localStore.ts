"use client";

import {
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
import type {
  ActivityItem,
  AlertItem,
  DashboardStats,
  DemoSession,
  Fixture,
  FixtureInput,
  MatchResult,
  MatchType,
  PlayerBattingInput,
  PlayerBattingStat,
  PlayerBowlingInput,
  PlayerBowlingStat,
  PointsRow,
  ReportLog,
  ResultInput,
  ResultType,
  SmartSummary,
  Team,
  TeamInput,
  TeamStatus,
  TournamentSettings,
  TournamentSettingsInput,
  UserRole,
  WorkflowStatus
} from "../types";
import {
  formatDate,
  formatDateTime,
  formatNrr,
  formatScore,
  getActiveFixtures,
  getActiveTeams,
  formatTime,
  getFixtureTitle,
  getLeaderName,
  getTeamName,
  getTodayKey,
  isActiveTeam,
  isResultStatus
} from "../utils";

const TEAMS_KEY = "ebc_teams";
const FIXTURES_KEY = "ebc_fixtures";
const POINTS_KEY = "ebc_points_table";
const REPORTS_KEY = "ebc_report_logs";
const ACTIVITIES_KEY = "ebc_activity_logs";
const BATTING_KEY = "ebc_player_batting_stats";
const BOWLING_KEY = "ebc_player_bowling_stats";
const SETTINGS_KEY = "ebc_tournament_settings";
const LOGIN_KEY = "isLoggedIn";
const SESSION_KEY = "ebc_demo_session";
const DEMO_SEEDED_KEY = "ebc_demo_seeded";

const workflowStatuses: WorkflowStatus[] = [
  "Draft",
  "Scheduled",
  "Live",
  "Completed",
  "Points Updated",
  "Report Generated"
];

const matchTypes: MatchType[] = ["League", "Semi Final", "Final", "Friendly"];
const resultTypes: ResultType[] = ["Normal win", "Tie", "No result", "Walkover"];
const teamStatuses: TeamStatus[] = ["Active", "Inactive", "Archived"];

type LegacyRecord = Record<string, any>;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return fallback;

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeKeys(keys: string[]): void {
  if (!canUseStorage()) return;
  keys.forEach((key) => window.localStorage.removeItem(key));
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function asString(value: unknown, fallback = ""): string {
  return isString(value) ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeWorkflowStatus(value: unknown): WorkflowStatus {
  if (value === "upcoming") return "Scheduled";
  if (value === "completed") return "Completed";
  return workflowStatuses.includes(value as WorkflowStatus) ? (value as WorkflowStatus) : "Draft";
}

function normalizeMatchType(value: unknown): MatchType {
  return matchTypes.includes(value as MatchType) ? (value as MatchType) : "League";
}

function normalizeResultType(value: unknown): ResultType {
  return resultTypes.includes(value as ResultType) ? (value as ResultType) : "Normal win";
}

function normalizeTeamStatus(value: unknown): TeamStatus {
  return teamStatuses.includes(value as TeamStatus) ? (value as TeamStatus) : "Active";
}

function normalizeTeam(rawTeam: LegacyRecord): Team {
  const name = asString(rawTeam.name, "Unnamed Team");
  const shortName = asString(rawTeam.shortName, asString(rawTeam.short_code, name.slice(0, 3).toUpperCase())).toUpperCase();

  return {
    id: asString(rawTeam.id, createId("team")),
    name,
    shortName,
    captain: asString(rawTeam.captain, "Captain TBA"),
    coach: asString(rawTeam.coach, asString(rawTeam.manager, "Manager TBA")),
    homeVenue: asString(rawTeam.homeVenue, asString(rawTeam.home_venue, "Eagle Box Arena")),
    contact: asString(rawTeam.contact, asString(rawTeam.email, "")),
    logoColor: asString(rawTeam.logoColor, "#22c55e"),
    createdAt: asString(rawTeam.createdAt, asString(rawTeam.created_at, new Date().toISOString())),
    status: normalizeTeamStatus(rawTeam.status)
  };
}

function normalizeFixture(rawFixture: LegacyRecord, index: number): Fixture {
  const status = normalizeWorkflowStatus(rawFixture.status);
  const resultType = rawFixture.resultType ? normalizeResultType(rawFixture.resultType) : undefined;
  const createdAt = asString(rawFixture.createdAt, asString(rawFixture.created_at, new Date().toISOString()));
  const result = rawFixture.result
    ? {
        teamARuns: asNumber(rawFixture.result.teamARuns, asNumber(rawFixture.teamAScore)),
        teamAWickets: asNumber(rawFixture.result.teamAWickets, asNumber(rawFixture.teamAWickets)),
        teamAOvers: asString(rawFixture.result.teamAOvers, asString(rawFixture.teamAOvers, "0")),
        teamBRuns: asNumber(rawFixture.result.teamBRuns, asNumber(rawFixture.teamBScore)),
        teamBWickets: asNumber(rawFixture.result.teamBWickets, asNumber(rawFixture.teamBWickets)),
        teamBOvers: asString(rawFixture.result.teamBOvers, asString(rawFixture.teamBOvers, "0")),
        resultType: normalizeResultType(rawFixture.result.resultType),
        winnerTeamId: asString(rawFixture.result.winnerTeamId, asString(rawFixture.winnerTeamId)) || undefined,
        playerOfMatch: asString(rawFixture.result.playerOfMatch, asString(rawFixture.playerOfMatch)) || undefined,
        notes: asString(rawFixture.result.notes, asString(rawFixture.notes)) || undefined,
        submittedAt: asString(rawFixture.result.submittedAt, asString(rawFixture.completedAt, createdAt))
      }
    : undefined;

  return {
    id: asString(rawFixture.id, createId("fixture")),
    matchId: asString(rawFixture.matchId, asString(rawFixture.match_id, `EBC-${String(index + 1).padStart(3, "0")}`)),
    teamAId: asString(rawFixture.teamAId, asString(rawFixture.team_a_id)),
    teamBId: asString(rawFixture.teamBId, asString(rawFixture.team_b_id)),
    date: asString(rawFixture.date),
    time: asString(rawFixture.time),
    venue: asString(rawFixture.venue, "Eagle Box Arena"),
    matchType: normalizeMatchType(rawFixture.matchType ?? rawFixture.match_type),
    status,
    tossWinnerTeamId: asString(rawFixture.tossWinnerTeamId, asString(rawFixture.toss_winner_id)) || undefined,
    electedTo: rawFixture.electedTo === "Bat" || rawFixture.electedTo === "Field" ? rawFixture.electedTo : undefined,
    winnerTeamId: asString(rawFixture.winnerTeamId, asString(result?.winnerTeamId)) || undefined,
    teamAScore: rawFixture.teamAScore ?? result?.teamARuns,
    teamBScore: rawFixture.teamBScore ?? result?.teamBRuns,
    teamAWickets: rawFixture.teamAWickets ?? result?.teamAWickets,
    teamBWickets: rawFixture.teamBWickets ?? result?.teamBWickets,
    teamAOvers: rawFixture.teamAOvers ?? result?.teamAOvers,
    teamBOvers: rawFixture.teamBOvers ?? result?.teamBOvers,
    resultType: resultType ?? result?.resultType,
    playerOfMatch: asString(rawFixture.playerOfMatch, asString(result?.playerOfMatch)) || undefined,
    fours: asNumber(rawFixture.fours),
    sixes: asNumber(rawFixture.sixes),
    notes: asString(rawFixture.notes, asString(result?.notes)) || undefined,
    result,
    createdAt,
    completedAt: asString(rawFixture.completedAt) || result?.submittedAt,
    pointsUpdatedAt: asString(rawFixture.pointsUpdatedAt) || undefined,
    reportGeneratedAt: asString(rawFixture.reportGeneratedAt) || undefined
  };
}

function normalizeBatting(raw: LegacyRecord): PlayerBattingStat {
  return {
    id: asString(raw.id, createId("bat")),
    fixtureId: asString(raw.fixtureId, asString(raw.fixture_id)),
    teamId: asString(raw.teamId, asString(raw.team_id)),
    playerName: asString(raw.playerName, asString(raw.player_name, "Unknown Player")),
    runs: asNumber(raw.runs),
    balls: asNumber(raw.balls),
    createdAt: asString(raw.createdAt, asString(raw.created_at, new Date().toISOString()))
  };
}

function normalizeBowling(raw: LegacyRecord): PlayerBowlingStat {
  return {
    id: asString(raw.id, createId("bowl")),
    fixtureId: asString(raw.fixtureId, asString(raw.fixture_id)),
    teamId: asString(raw.teamId, asString(raw.team_id)),
    playerName: asString(raw.playerName, asString(raw.player_name, "Unknown Player")),
    oversBalls: asNumber(raw.oversBalls, asNumber(raw.overs_balls)),
    wickets: asNumber(raw.wickets),
    runsGiven: asNumber(raw.runsGiven, asNumber(raw.runs_given)),
    createdAt: asString(raw.createdAt, asString(raw.created_at, new Date().toISOString()))
  };
}

function normalizeSettings(raw: Partial<TournamentSettings> | null | undefined): TournamentSettings {
  const defaults = getDemoTournamentSettings();
  return {
    id: asString(raw?.id, defaults.id),
    tournamentName: asString(raw?.tournamentName, defaults.tournamentName),
    format:
      raw?.format === "Knockout" || raw?.format === "Group Stage + Knockout" || raw?.format === "Round Robin"
        ? raw.format
        : defaults.format,
    maxTeams: asNumber(raw?.maxTeams, defaults.maxTeams),
    pointsPerWin: asNumber(raw?.pointsPerWin, defaults.pointsPerWin),
    pointsPerTie: asNumber(raw?.pointsPerTie, defaults.pointsPerTie),
    pointsPerLoss: asNumber(raw?.pointsPerLoss, defaults.pointsPerLoss),
    createdAt: asString(raw?.createdAt, defaults.createdAt),
    updatedAt: asString(raw?.updatedAt, defaults.updatedAt)
  };
}

function nextMatchId(fixtures: Fixture[]): string {
  const highest = fixtures.reduce((max, fixture) => {
    const numeric = Number(fixture.matchId.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);

  return `EBC-${String(highest + 1).padStart(3, "0")}`;
}

function validateTeamInput(input: TeamInput, teams: Team[], currentTeamId?: string): void {
  if (!input.name.trim()) throw new Error("Team name is required.");
  if (!input.shortName.trim()) throw new Error("Short code is required.");
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

function validatePlayerStats(input: ResultInput, fixture: Fixture): void {
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

function saveActivity(activity: ActivityItem): void {
  const activities = getActivities();
  writeJson(ACTIVITIES_KEY, [activity, ...activities].slice(0, 60));
}

export function addActivity(message: string, type: ActivityItem["type"] = "system"): ActivityItem {
  const activity: ActivityItem = {
    id: createId("activity"),
    message,
    timestamp: new Date().toISOString(),
    type
  };
  saveActivity(activity);
  return activity;
}

export function getActivities(): ActivityItem[] {
  return readJson<ActivityItem[]>(ACTIVITIES_KEY, []);
}

export function saveActivities(activities: ActivityItem[]): void {
  writeJson(ACTIVITIES_KEY, activities);
}

export function getTeams(): Team[] {
  return readJson<LegacyRecord[]>(TEAMS_KEY, []).map(normalizeTeam);
}

export function saveTeams(teams: Team[]): void {
  writeJson(TEAMS_KEY, teams);
}

export function addTeam(teamInput: TeamInput): Team {
  const teams = getTeams();
  validateTeamInput(teamInput, teams);

  const team: Team = {
    ...teamInput,
    id: createId("team"),
    name: teamInput.name.trim(),
    shortName: teamInput.shortName.trim().toUpperCase(),
    captain: teamInput.captain.trim(),
    coach: teamInput.coach.trim(),
    homeVenue: teamInput.homeVenue.trim(),
    contact: teamInput.contact?.trim() || undefined,
    createdAt: new Date().toISOString()
  };

  const nextTeams = [...teams, team];
  saveTeams(nextTeams);
  recalculateAndSavePointsTable(nextTeams, getFixtures());
  addActivity(`${team.name} was added to the tournament.`, "team");
  return team;
}

export function updateTeam(teamId: string, updatedData: TeamInput): Team[] {
  const teams = getTeams();
  validateTeamInput(updatedData, teams, teamId);

  const nextTeams = teams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          ...updatedData,
          name: updatedData.name.trim(),
          shortName: updatedData.shortName.trim().toUpperCase(),
          captain: updatedData.captain.trim(),
          coach: updatedData.coach.trim(),
          homeVenue: updatedData.homeVenue.trim(),
          contact: updatedData.contact?.trim() || undefined
        }
      : team
  );
  saveTeams(nextTeams);
  recalculateAndSavePointsTable(nextTeams, getFixtures());
  addActivity(`${updatedData.name} details were updated.`, "team");
  return nextTeams;
}

export function deleteTeam(teamId: string): { teams: Team[]; fixtures: Fixture[] } {
  const teams = getTeams();
  const targetTeam = teams.find((team) => team.id === teamId);
  const fixtures = getFixtures();
  const linkedFixtures = fixtures.filter((fixture) => fixture.teamAId === teamId || fixture.teamBId === teamId);
  const shouldArchive = linkedFixtures.length > 0;
  const nextTeams = shouldArchive
    ? teams.map((team) => (team.id === teamId ? { ...team, status: "Archived" as const } : team))
    : teams.filter((team) => team.id !== teamId);
  const nextFixtures = fixtures;
  const nextBatting = shouldArchive ? getPlayerBattingStats() : getPlayerBattingStats().filter((stat) => stat.teamId !== teamId);
  const nextBowling = shouldArchive ? getPlayerBowlingStats() : getPlayerBowlingStats().filter((stat) => stat.teamId !== teamId);

  saveTeams(nextTeams);
  saveFixtures(nextFixtures);
  savePlayerBattingStats(nextBatting);
  savePlayerBowlingStats(nextBowling);
  recalculateAndSavePointsTable(nextTeams, nextFixtures);
  addActivity(`${targetTeam?.name ?? "A team"} was ${shouldArchive ? "archived" : "deleted"}.`, "team");

  return { teams: nextTeams, fixtures: nextFixtures };
}

export function getFixtures(): Fixture[] {
  return readJson<LegacyRecord[]>(FIXTURES_KEY, []).map(normalizeFixture);
}

export function saveFixtures(fixtures: Fixture[]): void {
  writeJson(FIXTURES_KEY, fixtures);
}

export function addFixture(fixtureInput: FixtureInput): Fixture {
  const teams = getTeams();
  validateFixtureInput(fixtureInput, teams);
  const fixtures = getFixtures();
  const fixture: Fixture = {
    ...fixtureInput,
    id: createId("fixture"),
    matchId: nextMatchId(fixtures),
    venue: fixtureInput.venue.trim(),
    notes: fixtureInput.notes?.trim() || undefined,
    tossWinnerTeamId: fixtureInput.tossWinnerTeamId || undefined,
    electedTo: fixtureInput.electedTo || undefined,
    createdAt: new Date().toISOString()
  };
  const nextFixtures = [...fixtures, fixture];
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(teams, nextFixtures);
  addActivity(`${fixture.matchId} fixture was created.`, "fixture");
  return fixture;
}

export function updateFixture(fixtureId: string, updatedData: FixtureInput): Fixture[] {
  const teams = getTeams();
  validateFixtureInput(updatedData, teams);
  const nextFixtures = getFixtures().map((fixture) =>
    fixture.id === fixtureId
      ? {
          ...fixture,
          ...updatedData,
          venue: updatedData.venue.trim(),
          notes: updatedData.notes?.trim() || undefined,
          tossWinnerTeamId: updatedData.tossWinnerTeamId || undefined,
          electedTo: updatedData.electedTo || undefined
        }
      : fixture
  );

  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(teams, nextFixtures);
  addActivity(`${updatedData.venue} fixture details were updated.`, "fixture");
  return nextFixtures;
}

export function deleteFixture(fixtureId: string): Fixture[] {
  const fixtures = getFixtures();
  const target = fixtures.find((fixture) => fixture.id === fixtureId);
  const nextFixtures = fixtures.filter((fixture) => fixture.id !== fixtureId);
  const nextBatting = getPlayerBattingStats().filter((stat) => stat.fixtureId !== fixtureId);
  const nextBowling = getPlayerBowlingStats().filter((stat) => stat.fixtureId !== fixtureId);

  saveFixtures(nextFixtures);
  savePlayerBattingStats(nextBatting);
  savePlayerBowlingStats(nextBowling);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  addActivity(`${target?.matchId ?? "A fixture"} was deleted.`, "fixture");
  return nextFixtures;
}

function resolveWinner(fixture: Fixture, resultData: ResultInput): string | undefined {
  if (resultData.resultType === "Tie" || resultData.resultType === "No result") return undefined;
  if (resultData.winnerTeamId) return resultData.winnerTeamId;
  if (resultData.teamAScore > resultData.teamBScore) return fixture.teamAId;
  if (resultData.teamBScore > resultData.teamAScore) return fixture.teamBId;
  return undefined;
}

function replaceFixturePlayerStats(fixtureId: string, input: ResultInput): void {
  const now = new Date().toISOString();
  const nextBatting = [
    ...getPlayerBattingStats().filter((stat) => stat.fixtureId !== fixtureId),
    ...(input.battingStats ?? []).map<PlayerBattingStat>((stat) => ({
      ...stat,
      id: createId("bat"),
      fixtureId,
      playerName: stat.playerName.trim(),
      createdAt: now
    }))
  ];
  const nextBowling = [
    ...getPlayerBowlingStats().filter((stat) => stat.fixtureId !== fixtureId),
    ...(input.bowlingStats ?? []).map<PlayerBowlingStat>((stat) => ({
      ...stat,
      id: createId("bowl"),
      fixtureId,
      playerName: stat.playerName.trim(),
      createdAt: now
    }))
  ];

  savePlayerBattingStats(nextBatting);
  savePlayerBowlingStats(nextBowling);
}

export function submitFixtureResult(fixtureId: string, resultData: ResultInput): Fixture[] {
  const fixtures = getFixtures();
  const teams = getTeams();
  const targetFixture = fixtures.find((fixture) => fixture.id === fixtureId);

  if (!targetFixture) throw new Error("Fixture was not found.");
  if (resultData.tossWinnerTeamId && ![targetFixture.teamAId, targetFixture.teamBId].includes(resultData.tossWinnerTeamId)) {
    throw new Error("Toss winner must be one of the fixture teams.");
  }
  parseOversToBalls(resultData.teamAOvers || "0");
  parseOversToBalls(resultData.teamBOvers || "0");
  validatePlayerStats(resultData, targetFixture);

  const submittedAt = new Date().toISOString();
  const winnerTeamId = resolveWinner(targetFixture, resultData);
  const result: MatchResult = {
    teamARuns: resultData.teamAScore,
    teamAWickets: resultData.teamAWickets,
    teamAOvers: resultData.teamAOvers,
    teamBRuns: resultData.teamBScore,
    teamBWickets: resultData.teamBWickets,
    teamBOvers: resultData.teamBOvers,
    resultType: resultData.resultType,
    winnerTeamId,
    playerOfMatch: resultData.playerOfMatch?.trim() || undefined,
    notes: resultData.notes?.trim() || undefined,
    submittedAt
  };

  const nextFixtures = fixtures.map((fixture) =>
    fixture.id === fixtureId
      ? {
          ...fixture,
          tossWinnerTeamId: resultData.tossWinnerTeamId || fixture.tossWinnerTeamId,
          electedTo: resultData.electedTo || fixture.electedTo,
          teamAScore: resultData.teamAScore,
          teamBScore: resultData.teamBScore,
          teamAWickets: resultData.teamAWickets,
          teamBWickets: resultData.teamBWickets,
          teamAOvers: resultData.teamAOvers,
          teamBOvers: resultData.teamBOvers,
          resultType: resultData.resultType,
          winnerTeamId,
          playerOfMatch: resultData.playerOfMatch?.trim() || undefined,
          fours: resultData.fours,
          sixes: resultData.sixes,
          notes: resultData.notes?.trim() || undefined,
          result,
          status: "Completed" as const,
          completedAt: submittedAt,
          pointsUpdatedAt: undefined,
          reportGeneratedAt: undefined
        }
      : fixture
  );

  replaceFixturePlayerStats(fixtureId, resultData);
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(teams, nextFixtures);

  const title = getFixtureTitle(targetFixture, teams);
  const outcome =
    resultData.resultType === "No result"
      ? "No result recorded"
      : winnerTeamId
        ? `${getTeamName(teams, winnerTeamId)} won`
        : "Match tied";
  addActivity(`${title} result saved. ${outcome}.`, "result");
  addReportLog({
    title: `Result saved: ${targetFixture.matchId}`,
    type: "Results Report",
    fixtureId,
    summary: `${title} - ${formatScore(resultData.teamAScore, resultData.teamAWickets)} vs ${formatScore(resultData.teamBScore, resultData.teamBWickets)}. ${outcome}.`
  });

  return nextFixtures;
}

export function getPointsTable(): PointsRow[] {
  return recalculateAndSavePointsTable(getTeams(), getFixtures());
}

export function savePointsTable(pointsTable: PointsRow[]): void {
  writeJson(POINTS_KEY, pointsTable);
}

export function recalculateAndSavePointsTable(
  teams: Team[] = getTeams(),
  fixtures: Fixture[] = getFixtures()
): PointsRow[] {
  const settings = getTournamentSettings();
  const pointsTable = recalculatePointsTable(teams, fixtures, settings);
  savePointsTable(pointsTable);
  return pointsTable;
}

export function getReports(): ReportLog[] {
  return readJson<ReportLog[]>(REPORTS_KEY, []);
}

export function saveReports(reports: ReportLog[]): void {
  writeJson(REPORTS_KEY, reports);
}

export function addReportLog(input: Omit<ReportLog, "id" | "generatedAt">): ReportLog {
  const report: ReportLog = {
    ...input,
    id: createId("report"),
    generatedAt: new Date().toISOString()
  };
  saveReports([report, ...getReports()].slice(0, 60));
  addActivity(`${report.title} generated.`, "report");
  return report;
}

export function getPlayerBattingStats(): PlayerBattingStat[] {
  return readJson<LegacyRecord[]>(BATTING_KEY, []).map(normalizeBatting);
}

export function savePlayerBattingStats(stats: PlayerBattingStat[]): void {
  writeJson(BATTING_KEY, stats);
}

export function getPlayerBowlingStats(): PlayerBowlingStat[] {
  return readJson<LegacyRecord[]>(BOWLING_KEY, []).map(normalizeBowling);
}

export function savePlayerBowlingStats(stats: PlayerBowlingStat[]): void {
  writeJson(BOWLING_KEY, stats);
}

export function getTournamentSettings(): TournamentSettings {
  return normalizeSettings(readJson<TournamentSettings | null>(SETTINGS_KEY, null));
}

export function updateTournamentSettings(input: TournamentSettingsInput): TournamentSettings {
  const current = getTournamentSettings();
  const now = new Date().toISOString();
  const settings: TournamentSettings = {
    ...current,
    ...input,
    tournamentName: input.tournamentName.trim() || "Eagle Box Cricket",
    maxTeams: Math.max(2, Number(input.maxTeams) || current.maxTeams),
    pointsPerWin: Math.max(0, Number(input.pointsPerWin) || 0),
    pointsPerTie: Math.max(0, Number(input.pointsPerTie) || 0),
    pointsPerLoss: Math.max(0, Number(input.pointsPerLoss) || 0),
    updatedAt: now
  };
  writeJson(SETTINGS_KEY, settings);
  recalculateAndSavePointsTable();
  addActivity("Tournament settings were updated.", "settings");
  return settings;
}

export function getDashboardStats(): DashboardStats {
  const teams = getTeams();
  const fixtures = getFixtures();
  const activeTeams = getActiveTeams(teams);
  const activeFixtures = getActiveFixtures(fixtures, teams);
  const pointsTable = getPointsTable();
  const reports = getReports();
  const alerts = generateAlerts(activeTeams, activeFixtures, reports);
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
    alertsCount: alerts.length,
    databaseStatus: "Database: Local Demo Mode"
  };
}

export function seedDemoData(): {
  teams: Team[];
  fixtures: Fixture[];
  pointsTable: PointsRow[];
  reports: ReportLog[];
  activities: ActivityItem[];
  battingStats: PlayerBattingStat[];
  bowlingStats: PlayerBowlingStat[];
  settings: TournamentSettings;
} {
  const teams = getDemoTeams();
  const fixtures = getDemoFixtures();
  const reports = getDemoReports();
  const activities = getDemoActivities();
  const battingStats = getDemoPlayerBattingStats();
  const bowlingStats = getDemoPlayerBowlingStats();
  const settings = getDemoTournamentSettings();
  const pointsTable = recalculatePointsTable(teams, fixtures, settings);

  saveTeams(teams);
  saveFixtures(fixtures);
  savePointsTable(pointsTable);
  saveReports(reports);
  saveActivities(activities);
  savePlayerBattingStats(battingStats);
  savePlayerBowlingStats(bowlingStats);
  writeJson(SETTINGS_KEY, settings);
  if (canUseStorage()) window.localStorage.setItem(DEMO_SEEDED_KEY, "true");

  return { teams, fixtures, pointsTable, reports, activities, battingStats, bowlingStats, settings };
}

export function ensureDemoData(): ReturnType<typeof seedDemoData> {
  if (!canUseStorage()) {
    const settings = getDemoTournamentSettings();
    return {
      teams: [],
      fixtures: [],
      pointsTable: [],
      reports: [],
      activities: [],
      battingStats: [],
      bowlingStats: [],
      settings
    };
  }

  const hasTournamentData = [TEAMS_KEY, FIXTURES_KEY, REPORTS_KEY, ACTIVITIES_KEY, SETTINGS_KEY].some((key) =>
    Boolean(window.localStorage.getItem(key))
  );

  if (!hasTournamentData) return seedDemoData();

  const teams = getTeams();
  const fixtures = getFixtures();
  return {
    teams,
    fixtures,
    pointsTable: getPointsTable(),
    reports: getReports(),
    activities: getActivities(),
    battingStats: getPlayerBattingStats(),
    bowlingStats: getPlayerBowlingStats(),
    settings: getTournamentSettings()
  };
}

export function resetAllData(): ReturnType<typeof seedDemoData> {
  removeKeys([
    TEAMS_KEY,
    FIXTURES_KEY,
    POINTS_KEY,
    REPORTS_KEY,
    ACTIVITIES_KEY,
    BATTING_KEY,
    BOWLING_KEY,
    SETTINGS_KEY,
    DEMO_SEEDED_KEY
  ]);
  return seedDemoData();
}

export const resetDemoData = resetAllData;

export function generateAlerts(
  teams: Team[] = getTeams(),
  fixtures: Fixture[] = getFixtures(),
  reports: ReportLog[] = getReports()
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const activeTeams = getActiveTeams(teams);
  const activeFixtures = getActiveFixtures(fixtures, teams);
  const today = getTodayKey();

  if (activeTeams.length === 0) {
    alerts.push({
      id: "alert-no-teams",
      severity: "critical",
      title: "No teams added",
      description: "Add teams before creating tournament fixtures."
    });
  }

  if (activeFixtures.length === 0) {
    alerts.push({
      id: "alert-no-fixtures",
      severity: "warning",
      title: "No fixtures created",
      description: "Create league fixtures to start the tournament workflow."
    });
  }

  activeFixtures.forEach((fixture) => {
    if (fixture.date === today && !hasResult(fixture)) {
      alerts.push({
        id: `alert-today-${fixture.id}`,
        severity: "warning",
        title: "Result due today",
        description: `${getFixtureTitle(fixture, activeTeams)} is scheduled today at ${formatTime(fixture.time)}.`,
        fixtureId: fixture.id
      });
    }

    if (fixture.status === "Completed") {
      alerts.push({
        id: `alert-points-${fixture.id}`,
        severity: "warning",
        title: "Points not updated",
        description: `${fixture.matchId} is completed but still needs the points update workflow step.`,
        fixtureId: fixture.id
      });
    }

    if (isCompletedFixture(fixture) && fixture.status !== "Report Generated") {
      alerts.push({
        id: `alert-report-${fixture.id}`,
        severity: "info",
        title: "Report pending",
        description: `${fixture.matchId} needs its final match report generated.`,
        fixtureId: fixture.id
      });
    }
  });

  const venueSlots = new Map<string, Fixture[]>();
  activeFixtures.forEach((fixture) => {
    if (!fixture.date || !fixture.time || !fixture.venue) return;
    const key = `${fixture.date}-${fixture.time}-${fixture.venue.toLowerCase()}`;
    venueSlots.set(key, [...(venueSlots.get(key) ?? []), fixture]);
  });
  venueSlots.forEach((slotFixtures) => {
    if (slotFixtures.length > 1) {
      alerts.push({
        id: `alert-duplicate-${slotFixtures.map((fixture) => fixture.id).join("-")}`,
        severity: "warning",
        title: "Venue/time conflict",
        description: `${slotFixtures.length} fixtures share ${slotFixtures[0].venue} on ${formatDate(slotFixtures[0].date)} at ${formatTime(slotFixtures[0].time)}.`
      });
    }
  });

  if (activeFixtures.filter(isCompletedFixture).length > 0 && reports.length === 0) {
    alerts.push({
      id: "alert-no-reports",
      severity: "info",
      title: "No reports generated",
      description: "Generate report history after entering match results."
    });
  }

  return alerts;
}

export function generateSmartSummary(
  teams: Team[] = getTeams(),
  fixtures: Fixture[] = getFixtures(),
  pointsTable: PointsRow[] = getPointsTable(),
  reports: ReportLog[] = getReports()
): SmartSummary {
  const activeTeams = getActiveTeams(teams);
  const activeFixtures = getActiveFixtures(fixtures, teams);
  const activeTeamIds = new Set(activeTeams.map((team) => team.id));
  const activePointsTable = pointsTable.filter((row) => activeTeamIds.has(row.teamId));
  const alerts = generateAlerts(activeTeams, activeFixtures, reports);
  const leader = activePointsTable.find((row) => row.played > 0);
  const bestNrr = [...activePointsTable].filter((row) => row.played > 0).sort((a, b) => b.netRunRate - a.netRunRate)[0];
  const upcomingFixtures = activeFixtures
    .filter((fixture) => !isResultStatus(fixture.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const completedCount = activeFixtures.filter(isCompletedFixture).length;
  const pendingResults = activeFixtures.filter(
    (fixture) =>
      (fixture.status === "Scheduled" || fixture.status === "Live") &&
      !hasResult(fixture) &&
      fixture.date <= getTodayKey()
  ).length;
  const completedNeedsReport = activeFixtures.filter(
    (fixture) => isCompletedFixture(fixture) && fixture.status !== "Report Generated"
  ).length;
  const leaderName = leader ? getTeamName(activeTeams, leader.teamId) : "No completed matches yet";
  const bestNrrName = bestNrr ? getTeamName(activeTeams, bestNrr.teamId) : "No NRR yet";
  const nextFixture = upcomingFixtures[0];
  const topFormRow = activePointsTable.find((row) => row.lastFive.slice(0, 3).filter((form) => form === "W").length >= 2);

  const insights = [
    leader
      ? `${leaderName} has won ${leader.won} match${leader.won === 1 ? "" : "es"} and leads with ${leader.points} points.`
      : `${activeTeams.length} active team${activeTeams.length === 1 ? "" : "s"} are configured; enter results to establish a table leader.`,
    nextFixture
      ? `Next fixture: ${getFixtureTitle(nextFixture, activeTeams)} on ${formatDate(nextFixture.date)}.`
      : "No upcoming fixtures are currently scheduled.",
    bestNrr
      ? `${bestNrrName} has the best NRR at ${formatNrr(bestNrr.netRunRate)}.`
      : "No NRR yet - enter completed scorecards with valid overs to activate rankings.",
    topFormRow
      ? `${getTeamName(activeTeams, topFormRow.teamId)} is in strong form based on recent wins.`
      : `${completedCount} completed match${completedCount === 1 ? "" : "es"} are available for form tracking.`,
    completedNeedsReport > 0
      ? `${completedNeedsReport} completed match${completedNeedsReport === 1 ? " needs" : "es need"} report generation.`
      : `${upcomingFixtures.length} fixture${upcomingFixtures.length === 1 ? " is" : "s are"} upcoming.`
  ];

  return {
    mode: "rule-based",
    summary:
      leader
        ? `${leaderName} lead with ${leader.points} points. ${upcomingFixtures.length} fixtures are upcoming, ${completedCount} matches are completed, and ${completedNeedsReport} completed matches still need reports.`
        : `${activeTeams.length} active teams and ${activeFixtures.length} fixtures are ready. Add fixtures and results to unlock deeper insights.`,
    insights,
    recommendedActions: [
      pendingResults > 0 ? "Update pending match results." : "Review the next scheduled fixture before match day.",
      completedNeedsReport > 0 ? "Generate reports for completed fixtures." : "Export the points table CSV for evaluation backup.",
      alerts.length > 0 ? "Review workflow alerts before the next match window." : "Share the public scoreboard link."
    ],
    risks: [
      alerts.length > 0 ? `${alerts.length} alert${alerts.length === 1 ? " needs" : "s need"} attention.` : "No critical workflow alerts are active.",
      pendingResults > 0 ? "Pending results can delay points table updates." : "Points table is current for submitted results.",
      completedNeedsReport > 0 ? "Completed matches without reports can leave the workflow unfinished." : "Report workflow is clear for completed matches."
    ],
    generatedAt: new Date().toISOString()
  };
}

export function transitionFixtureStatus(fixtureId: string, nextStatus: WorkflowStatus): Fixture[] {
  const fixtures = getFixtures();
  const teams = getTeams();
  const target = fixtures.find((fixture) => fixture.id === fixtureId);

  if (!target) throw new Error("Fixture was not found.");
  if (nextStatus === "Completed" && !hasResult(target)) throw new Error("Cannot mark completed without entering a match result.");
  if (nextStatus === "Points Updated" && !hasResult(target)) throw new Error("Enter a result before updating points.");
  if (nextStatus === "Report Generated" && target.status !== "Points Updated") {
    throw new Error("Generate a report only after points are updated.");
  }

  const now = new Date().toISOString();
  const nextFixtures = fixtures.map((fixture) => {
    if (fixture.id !== fixtureId) return fixture;
    return {
      ...fixture,
      status: nextStatus,
      completedAt:
        nextStatus === "Completed" || nextStatus === "Points Updated" || nextStatus === "Report Generated"
          ? fixture.completedAt ?? now
          : fixture.completedAt,
      pointsUpdatedAt:
        nextStatus === "Points Updated" || nextStatus === "Report Generated"
          ? fixture.pointsUpdatedAt ?? now
          : fixture.pointsUpdatedAt,
      reportGeneratedAt: nextStatus === "Report Generated" ? now : fixture.reportGeneratedAt
    };
  });

  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(teams, nextFixtures);
  addActivity(`${target.matchId} moved to ${nextStatus}.`, "workflow");

  if (nextStatus === "Report Generated") {
    addReportLog({
      title: `Match report generated: ${target.matchId}`,
      type: "Fixtures Report",
      fixtureId,
      summary: `${getFixtureTitle(target, teams)} report generated on ${formatDateTime(now)}.`
    });
  }

  return nextFixtures;
}

export function getCurrentSession(): DemoSession | null {
  const session = readJson<DemoSession | null>(SESSION_KEY, null);
  if (session?.role === "Admin" || session?.role === "Viewer") return session;

  if (canUseStorage() && window.localStorage.getItem(LOGIN_KEY) === "true") {
    return {
      email: "admin@eaglebox.com",
      role: "Admin",
      loggedInAt: new Date().toISOString()
    };
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
  const normalizedEmail = email.trim().toLowerCase();
  const role: UserRole | null =
    normalizedEmail === "admin@eaglebox.com" && password === "admin123"
      ? "Admin"
      : normalizedEmail === "viewer@eaglebox.com" && password === "viewer123"
        ? "Viewer"
        : null;

  if (!role || !canUseStorage()) return null;

  const session: DemoSession = {
    email: normalizedEmail,
    role,
    loggedInAt: new Date().toISOString()
  };
  writeJson(SESSION_KEY, session);
  window.localStorage.setItem(LOGIN_KEY, "true");
  return session;
}

export function logout(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(LOGIN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function describeFixtureResult(fixture: Fixture, teams: Team[]): string {
  const result = getFixtureResult(fixture);
  if (!result) return "Result pending";
  if (result.resultType === "No result") return "No result";
  const score = `${formatScore(result.teamARuns, result.teamAWickets)} vs ${formatScore(result.teamBRuns, result.teamBWickets)}`;
  const winner = result.winnerTeamId ? getTeamName(teams, result.winnerTeamId) : "Tie";
  return `${score} - ${winner}`;
}

export function getMatchResults(): Array<MatchResult & { fixtureId: string }> {
  return getFixtures()
    .map((fixture) => {
      const result = getFixtureResult(fixture);
      return result ? { ...result, fixtureId: fixture.id } : null;
    })
    .filter((result): result is MatchResult & { fixtureId: string } => Boolean(result));
}

export const createTeam = addTeam;
export const createFixture = addFixture;
export const saveMatchResult = submitFixtureResult;
export const createReport = addReportLog;
export const getActivityLogs = getActivities;
export const addActivityLog = addActivity;
export const seedDemoDataIfEmpty = ensureDemoData;
