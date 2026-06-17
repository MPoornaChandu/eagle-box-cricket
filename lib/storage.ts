"use client";

import {
  getFixtureResult,
  hasResult,
  isCompletedFixture,
  recalculatePointsTable
} from "./points";
import { getDemoActivities, getDemoFixtures, getDemoReports, getDemoTeams } from "./seed";
import type {
  ActivityItem,
  AlertItem,
  DashboardStats,
  Fixture,
  FixtureInput,
  MatchType,
  PointsRow,
  ReportLog,
  ResultInput,
  ResultType,
  SmartSummary,
  Team,
  TeamInput,
  TeamStatus,
  WorkflowStatus
} from "./types";
import {
  formatDate,
  formatDateTime,
  formatScore,
  formatTime,
  getFixtureTitle,
  getLeaderName,
  getTeamName,
  getTodayKey,
  isResultStatus
} from "./utils";

const TEAMS_KEY = "ebc_teams";
const FIXTURES_KEY = "ebc_fixtures";
const POINTS_KEY = "ebc_points_table";
const REPORTS_KEY = "ebc_report_logs";
const ACTIVITIES_KEY = "ebc_activity_logs";
const LOGIN_KEY = "isLoggedIn";

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
const teamStatuses: TeamStatus[] = ["Active", "Inactive"];

type LegacyRecord = Record<string, any>;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
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
  const shortName = asString(rawTeam.shortName, name.slice(0, 3).toUpperCase()).toUpperCase();

  return {
    id: asString(rawTeam.id, createId("team")),
    name,
    shortName,
    captain: asString(rawTeam.captain, "Captain TBA"),
    coach: asString(rawTeam.coach, asString(rawTeam.manager, "Manager TBA")),
    homeVenue: asString(rawTeam.homeVenue, asString(rawTeam.city, "Eagle Box Arena")),
    contact: asString(rawTeam.contact, asString(rawTeam.email, "")),
    logoColor: asString(rawTeam.logoColor, "#22c55e"),
    createdAt: asString(rawTeam.createdAt, new Date().toISOString()),
    status: normalizeTeamStatus(rawTeam.status)
  };
}

function normalizeFixture(rawFixture: LegacyRecord, index: number): Fixture {
  const status = normalizeWorkflowStatus(rawFixture.status);
  const resultType = rawFixture.resultType ? normalizeResultType(rawFixture.resultType) : undefined;
  const createdAt = asString(rawFixture.createdAt, new Date().toISOString());
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
        submittedAt: asString(
          rawFixture.result.submittedAt,
          asString(rawFixture.completedAt, createdAt)
        )
      }
    : undefined;

  return {
    id: asString(rawFixture.id, createId("fixture")),
    matchId: asString(rawFixture.matchId, `EBC-${String(index + 1).padStart(3, "0")}`),
    teamAId: asString(rawFixture.teamAId),
    teamBId: asString(rawFixture.teamBId),
    date: asString(rawFixture.date),
    time: asString(rawFixture.time),
    venue: asString(rawFixture.venue, "Eagle Box Arena"),
    matchType: normalizeMatchType(rawFixture.matchType),
    status,
    tossWinnerTeamId: asString(rawFixture.tossWinnerTeamId) || undefined,
    winnerTeamId:
      asString(rawFixture.winnerTeamId, asString(result?.winnerTeamId)) || undefined,
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

function nextMatchId(fixtures: Fixture[]): string {
  const highest = fixtures.reduce((max, fixture) => {
    const numeric = Number(fixture.matchId.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);

  return `EBC-${String(highest + 1).padStart(3, "0")}`;
}

function saveActivity(activity: ActivityItem): void {
  const activities = getActivities();
  writeJson(ACTIVITIES_KEY, [activity, ...activities].slice(0, 40));
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
  const teams = readJson<LegacyRecord[]>(TEAMS_KEY, []);
  return teams.map(normalizeTeam);
}

export function saveTeams(teams: Team[]): void {
  writeJson(TEAMS_KEY, teams);
}

export function addTeam(teamInput: TeamInput): Team {
  const teams = getTeams();
  const duplicate = teams.some(
    (team) => team.name.trim().toLowerCase() === teamInput.name.trim().toLowerCase()
  );

  if (duplicate) {
    throw new Error("A team with this name already exists.");
  }

  const team: Team = {
    ...teamInput,
    id: createId("team"),
    shortName: teamInput.shortName.toUpperCase(),
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
  const duplicate = teams.some(
    (team) =>
      team.id !== teamId &&
      team.name.trim().toLowerCase() === updatedData.name.trim().toLowerCase()
  );

  if (duplicate) {
    throw new Error("Another team with this name already exists.");
  }

  const nextTeams = teams.map((team) =>
    team.id === teamId ? { ...team, ...updatedData, shortName: updatedData.shortName.toUpperCase() } : team
  );
  saveTeams(nextTeams);
  recalculateAndSavePointsTable(nextTeams, getFixtures());
  addActivity(`${updatedData.name} details were updated.`, "team");
  return nextTeams;
}

export function deleteTeam(teamId: string): { teams: Team[]; fixtures: Fixture[] } {
  const teams = getTeams();
  const targetTeam = teams.find((team) => team.id === teamId);
  const nextTeams = teams.filter((team) => team.id !== teamId);
  const nextFixtures = getFixtures().filter(
    (fixture) => fixture.teamAId !== teamId && fixture.teamBId !== teamId
  );

  saveTeams(nextTeams);
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(nextTeams, nextFixtures);
  addActivity(`${targetTeam?.name ?? "A team"} was deleted.`, "team");

  return { teams: nextTeams, fixtures: nextFixtures };
}

export function getFixtures(): Fixture[] {
  const fixtures = readJson<LegacyRecord[]>(FIXTURES_KEY, []);
  return fixtures.map(normalizeFixture);
}

export function saveFixtures(fixtures: Fixture[]): void {
  writeJson(FIXTURES_KEY, fixtures);
}

export function addFixture(fixtureInput: FixtureInput): Fixture {
  const fixtures = getFixtures();
  const fixture: Fixture = {
    ...fixtureInput,
    id: createId("fixture"),
    matchId: nextMatchId(fixtures),
    venue: fixtureInput.venue.trim(),
    notes: fixtureInput.notes?.trim() || undefined,
    tossWinnerTeamId: fixtureInput.tossWinnerTeamId || undefined,
    createdAt: new Date().toISOString()
  };
  const nextFixtures = [...fixtures, fixture];
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  addActivity(`${fixture.matchId} fixture was created.`, "fixture");
  return fixture;
}

export function updateFixture(fixtureId: string, updatedData: FixtureInput): Fixture[] {
  const nextFixtures = getFixtures().map((fixture) =>
    fixture.id === fixtureId
      ? {
          ...fixture,
          ...updatedData,
          venue: updatedData.venue.trim(),
          notes: updatedData.notes?.trim() || undefined,
          tossWinnerTeamId: updatedData.tossWinnerTeamId || undefined
        }
      : fixture
  );

  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  addActivity(`${updatedData.venue} fixture details were updated.`, "fixture");
  return nextFixtures;
}

export function deleteFixture(fixtureId: string): Fixture[] {
  const fixtures = getFixtures();
  const target = fixtures.find((fixture) => fixture.id === fixtureId);
  const nextFixtures = fixtures.filter((fixture) => fixture.id !== fixtureId);
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  addActivity(`${target?.matchId ?? "A fixture"} was deleted.`, "fixture");
  return nextFixtures;
}

function resolveWinner(fixture: Fixture, resultData: ResultInput): string | undefined {
  if (resultData.resultType === "Tie" || resultData.resultType === "No result") {
    return undefined;
  }

  if (resultData.winnerTeamId) {
    return resultData.winnerTeamId;
  }

  if (resultData.teamAScore > resultData.teamBScore) return fixture.teamAId;
  if (resultData.teamBScore > resultData.teamAScore) return fixture.teamBId;
  return undefined;
}

export function submitFixtureResult(fixtureId: string, resultData: ResultInput): Fixture[] {
  const fixtures = getFixtures();
  const teams = getTeams();
  const targetFixture = fixtures.find((fixture) => fixture.id === fixtureId);

  if (!targetFixture) {
    throw new Error("Fixture was not found.");
  }

  const submittedAt = new Date().toISOString();
  const winnerTeamId = resolveWinner(targetFixture, resultData);
  const result = {
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
    fixtureId: fixtureId,
    summary: `${title} - ${formatScore(resultData.teamAScore, resultData.teamAWickets)} vs ${formatScore(resultData.teamBScore, resultData.teamBWickets)}. ${outcome}.`
  });

  return nextFixtures;
}

export function getPointsTable(): PointsRow[] {
  const teams = getTeams();
  const fixtures = getFixtures();
  const stored = readJson<PointsRow[]>(POINTS_KEY, []);
  if (stored.length !== teams.length) {
    return recalculateAndSavePointsTable(teams, fixtures);
  }
  return stored;
}

export function savePointsTable(pointsTable: PointsRow[]): void {
  writeJson(POINTS_KEY, pointsTable);
}

export function recalculateAndSavePointsTable(
  teams: Team[] = getTeams(),
  fixtures: Fixture[] = getFixtures()
): PointsRow[] {
  const pointsTable = recalculatePointsTable(teams, fixtures);
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
  saveReports([report, ...getReports()].slice(0, 50));
  addActivity(`${report.title} generated.`, "report");
  return report;
}

export function getDashboardStats(): DashboardStats {
  const teams = getTeams();
  const fixtures = getFixtures();
  const pointsTable = getPointsTable();
  const reports = getReports();
  const alerts = generateAlerts(teams, fixtures, reports);

  return {
    totalTeams: teams.length,
    totalFixtures: fixtures.length,
    completedMatches: fixtures.filter(isCompletedFixture).length,
    upcomingMatches: fixtures.filter((fixture) => !isResultStatus(fixture.status)).length,
    pendingResults: fixtures.filter(
      (fixture) =>
        (fixture.status === "Scheduled" || fixture.status === "Live") &&
        !hasResult(fixture) &&
        fixture.date <= getTodayKey()
    ).length,
    leaderTeamName: getLeaderName(teams, pointsTable),
    reportsGenerated: reports.length,
    alertsCount: alerts.length
  };
}

export function seedDemoData(): {
  teams: Team[];
  fixtures: Fixture[];
  pointsTable: PointsRow[];
  reports: ReportLog[];
  activities: ActivityItem[];
} {
  const teams = getDemoTeams();
  const fixtures = getDemoFixtures();
  const pointsTable = recalculatePointsTable(teams, fixtures);
  const reports = getDemoReports();
  const activities = getDemoActivities();

  saveTeams(teams);
  saveFixtures(fixtures);
  savePointsTable(pointsTable);
  saveReports(reports);
  saveActivities(activities);

  return { teams, fixtures, pointsTable, reports, activities };
}

export function resetAllData(): {
  teams: Team[];
  fixtures: Fixture[];
  pointsTable: PointsRow[];
  reports: ReportLog[];
  activities: ActivityItem[];
} {
  if (canUseStorage()) {
    window.localStorage.removeItem(TEAMS_KEY);
    window.localStorage.removeItem(FIXTURES_KEY);
    window.localStorage.removeItem(POINTS_KEY);
    window.localStorage.removeItem(REPORTS_KEY);
    window.localStorage.removeItem(ACTIVITIES_KEY);
  }

  return seedDemoData();
}

export function generateAlerts(
  teams: Team[] = getTeams(),
  fixtures: Fixture[] = getFixtures(),
  reports: ReportLog[] = getReports()
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const today = getTodayKey();

  if (teams.length === 0) {
    alerts.push({
      id: "alert-no-teams",
      severity: "critical",
      title: "No teams added",
      description: "Add teams before creating tournament fixtures."
    });
  }

  if (fixtures.length === 0) {
    alerts.push({
      id: "alert-no-fixtures",
      severity: "warning",
      title: "No fixtures created",
      description: "Create league fixtures to start the tournament workflow."
    });
  }

  fixtures.forEach((fixture) => {
    if (fixture.date === today && !hasResult(fixture)) {
      alerts.push({
        id: `alert-today-${fixture.id}`,
        severity: "warning",
        title: "Result due today",
        description: `${getFixtureTitle(fixture, teams)} is scheduled today at ${formatTime(fixture.time)}.`,
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
  fixtures.forEach((fixture) => {
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

  if (isCompletedFixtureCount(fixtures) > 0 && reports.length === 0) {
    alerts.push({
      id: "alert-no-reports",
      severity: "info",
      title: "No reports generated",
      description: "Generate report history after entering match results."
    });
  }

  return alerts;
}

function isCompletedFixtureCount(fixtures: Fixture[]): number {
  return fixtures.filter(isCompletedFixture).length;
}

export function generateSmartSummary(
  teams: Team[] = getTeams(),
  fixtures: Fixture[] = getFixtures(),
  pointsTable: PointsRow[] = getPointsTable(),
  reports: ReportLog[] = getReports()
): SmartSummary {
  const alerts = generateAlerts(teams, fixtures, reports);
  const leader = pointsTable[0];
  const bestNrr = [...pointsTable].sort((a, b) => b.netRunRate - a.netRunRate)[0];
  const upcomingCount = fixtures.filter((fixture) => !isResultStatus(fixture.status)).length;
  const pendingResults = fixtures.filter(
    (fixture) =>
      (fixture.status === "Scheduled" || fixture.status === "Live") &&
      !hasResult(fixture) &&
      fixture.date <= getTodayKey()
  ).length;
  const completedNeedsReport = fixtures.filter(
    (fixture) => isCompletedFixture(fixture) && fixture.status !== "Report Generated"
  ).length;

  const insights = [
    `${upcomingCount} upcoming fixtures are active in the workflow.`,
    pendingResults > 0
      ? `${pendingResults} result${pendingResults > 1 ? "s are" : " is"} pending for scheduled/live matches.`
      : "No due match results are currently pending.",
    leader && leader.played > 0
      ? `${getTeamName(teams, leader.teamId)} is leading with ${leader.points} points.`
      : "No table leader yet because completed results are limited.",
    bestNrr && bestNrr.played > 0
      ? `${getTeamName(teams, bestNrr.teamId)} has the best NRR at ${bestNrr.netRunRate.toFixed(3)}.`
      : "NRR will become meaningful after scorecards include overs.",
    completedNeedsReport > 0
      ? `${completedNeedsReport} completed match${completedNeedsReport > 1 ? "es need" : " needs"} report generation.`
      : "All completed matches have reached report-ready status."
  ];

  const recommendedAction =
    pendingResults > 0
      ? "Update pending match results before generating final reports."
      : alerts.length > 0
        ? "Clear workflow alerts, then export the points and fixtures reports."
        : "Generate the tournament summary report for presentation.";

  return {
    headline: `${upcomingCount} fixtures upcoming, ${pendingResults} pending result${pendingResults === 1 ? "" : "s"}, ${getLeaderName(teams, pointsTable)} leading.`,
    insights,
    recommendedAction,
    generatedAt: new Date().toISOString()
  };
}

export function transitionFixtureStatus(fixtureId: string, nextStatus: WorkflowStatus): Fixture[] {
  const fixtures = getFixtures();
  const teams = getTeams();
  const target = fixtures.find((fixture) => fixture.id === fixtureId);

  if (!target) {
    throw new Error("Fixture was not found.");
  }

  if (nextStatus === "Completed" && !hasResult(target)) {
    throw new Error("Cannot mark completed without entering a match result.");
  }

  if (nextStatus === "Points Updated" && !hasResult(target)) {
    throw new Error("Enter a result before updating points.");
  }

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
      fixtureId: fixtureId,
      summary: `${getFixtureTitle(target, teams)} report generated on ${formatDateTime(now)}.`
    });
  }

  return nextFixtures;
}

export function isLoggedIn(): boolean {
  if (!canUseStorage()) {
    return false;
  }

  return window.localStorage.getItem(LOGIN_KEY) === "true";
}

export function login(email: string, password: string): boolean {
  const isValid = email.trim().toLowerCase() === "admin@eaglebox.com" && password === "admin123";

  if (isValid && canUseStorage()) {
    window.localStorage.setItem(LOGIN_KEY, "true");
  }

  return isValid;
}

export function logout(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(LOGIN_KEY);
}

// TODO: Replace these localStorage adapters with Supabase/Firebase repositories when backend credentials are provided.
export function describeFixtureResult(fixture: Fixture, teams: Team[]): string {
  const result = getFixtureResult(fixture);
  if (!result) return "Result pending";
  if (result.resultType === "No result") return "No result";
  const score = `${formatScore(result.teamARuns, result.teamAWickets)} vs ${formatScore(result.teamBRuns, result.teamBWickets)}`;
  const winner = result.winnerTeamId ? getTeamName(teams, result.winnerTeamId) : "Tie";
  return `${score} - ${winner}`;
}
