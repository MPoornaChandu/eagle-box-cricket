"use client";

import {
  getDataSourceStatus as getConfiguredDataSourceStatus,
  getStorageMode as readStorageMode,
  isSupabaseConfigured
} from "../supabase/client";
import type {
  ActivityItem,
  AlertItem,
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
  SmartSummary,
  Team,
  TeamInput,
  TournamentSettings,
  TournamentSettingsInput,
  UserRole,
  WorkflowStatus
} from "../types";
import { formatNrr, getActiveFixtures, getActiveTeams, getLeaderName, getTeamName, getTodayKey, isResultStatus } from "../utils";
import { hasResult, isCompletedFixture, recalculatePointsTable } from "../points";
import * as local from "./localStore";
import * as supabase from "./supabaseStore";

type AsyncOrSync<T> = T | Promise<T>;
type CacheKey =
  | "teams"
  | "fixtures"
  | "results"
  | "reports"
  | "activities"
  | "batting"
  | "bowling"
  | "settings"
  | "points";

const dataCache = new Map<CacheKey, Promise<unknown>>();
let supabaseConnectionFailed = false;

function useSupabase(): boolean {
  return isSupabaseConfigured();
}

function logStorageError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Storage] ${scope}`, error);
  }
}

function markSupabaseHealthy(): void {
  supabaseConnectionFailed = false;
}

function markSupabaseFailed(): void {
  supabaseConnectionFailed = true;
}

function clearTournamentCache(): void {
  dataCache.clear();
}

async function cached<T>(key: CacheKey, loader: () => Promise<T>): Promise<T> {
  const existing = dataCache.get(key);
  if (existing) return existing as Promise<T>;

  const promise = loader().catch((error) => {
    dataCache.delete(key);
    throw error;
  });
  dataCache.set(key, promise);
  return promise;
}

function toReadableError(scope: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : "Unknown error";
  return new Error(`${scope} failed in Supabase. Check schema/RLS and try again. ${detail}`);
}

async function readData<T>(scope: string, remote: () => Promise<T>, fallback: () => AsyncOrSync<T>): Promise<T> {
  if (!useSupabase()) return fallback();
  try {
    const data = await remote();
    markSupabaseHealthy();
    return data;
  } catch (error) {
    logStorageError(scope, error);
    markSupabaseFailed();
    return fallback();
  }
}

async function writeData<T>(scope: string, remote: () => Promise<T>, fallback: () => AsyncOrSync<T>): Promise<T> {
  if (!useSupabase()) {
    const data = await fallback();
    clearTournamentCache();
    return data;
  }
  try {
    const data = await remote();
    markSupabaseHealthy();
    clearTournamentCache();
    return data;
  } catch (error) {
    logStorageError(scope, error);
    markSupabaseFailed();
    throw toReadableError(scope, error);
  }
}

export function getStorageMode() {
  return readStorageMode();
}

export function getDataSourceStatus() {
  const configuredStatus = getConfiguredDataSourceStatus();

  if (configuredStatus.mode === "supabase" && supabaseConnectionFailed) {
    return {
      mode: "localStorage" as const,
      label: "Database: Local Demo Mode",
      description: "Supabase connection failed. Running in local demo mode."
    };
  }

  if (configuredStatus.mode === "supabase") {
    return {
      ...configuredStatus,
      label: "Database: Supabase Connected",
      description: "Supabase PostgreSQL sync is connected."
    };
  }

  return {
    ...configuredStatus,
    label: "Database: Local Demo Mode",
    description: "Supabase keys are missing, so this browser is using local demo storage."
  };
}

export async function getTeams(): Promise<Team[]> {
  return cached("teams", () => readData("Load teams", supabase.getTeams, local.getTeams));
}

export async function createTeam(input: TeamInput): Promise<Team> {
  return writeData("Create team", () => supabase.createTeam(input), () => local.createTeam(input));
}

export const addTeam = createTeam;

export async function updateTeam(teamId: string, input: TeamInput): Promise<Team[]> {
  return writeData("Update team", () => supabase.updateTeam(teamId, input), () => local.updateTeam(teamId, input));
}

export async function deleteTeam(teamId: string): Promise<Team[]> {
  return writeData("Delete team", () => supabase.deleteTeam(teamId), () => local.deleteTeam(teamId).teams);
}

export async function getFixtures(): Promise<Fixture[]> {
  return cached("fixtures", () => readData("Load fixtures", supabase.getFixtures, local.getFixtures));
}

export async function createFixture(input: FixtureInput): Promise<Fixture> {
  return writeData("Create fixture", () => supabase.createFixture(input), () => local.createFixture(input));
}

export const addFixture = createFixture;

export async function updateFixture(fixtureId: string, input: FixtureInput): Promise<Fixture[]> {
  return writeData("Update fixture", () => supabase.updateFixture(fixtureId, input), () => local.updateFixture(fixtureId, input));
}

export async function deleteFixture(fixtureId: string): Promise<Fixture[]> {
  return writeData("Delete fixture", () => supabase.deleteFixture(fixtureId), () => local.deleteFixture(fixtureId));
}

export async function getMatchResults(): Promise<Array<MatchResult & { fixtureId: string }>> {
  return cached("results", () => readData("Load results", supabase.getMatchResults, local.getMatchResults));
}

export async function saveMatchResult(fixtureId: string, input: ResultInput): Promise<Fixture[]> {
  return writeData("Save result", () => supabase.saveMatchResult(fixtureId, input), () => local.saveMatchResult(fixtureId, input));
}

export const submitFixtureResult = saveMatchResult;

export async function getReports(): Promise<ReportLog[]> {
  return cached("reports", () => readData("Load reports", supabase.getReports, local.getReports));
}

export async function createReport(input: Omit<ReportLog, "id" | "generatedAt">): Promise<ReportLog> {
  return writeData("Create report", () => supabase.createReport(input), () => local.createReport(input));
}

export const addReportLog = createReport;

export async function getActivityLogs(): Promise<ActivityItem[]> {
  return cached("activities", () => readData("Load activity logs", supabase.getActivityLogs, local.getActivityLogs));
}

export const getActivities = getActivityLogs;

export async function addActivityLog(message: string, type: ActivityItem["type"] = "system"): Promise<ActivityItem> {
  return writeData("Add activity log", () => supabase.addActivityLog(message, type), () => local.addActivityLog(message, type));
}

export const addActivity = addActivityLog;

export async function getPlayerBattingStats(): Promise<PlayerBattingStat[]> {
  return cached("batting", () => readData("Load batting stats", supabase.getPlayerBattingStats, local.getPlayerBattingStats));
}

export async function getPlayerBowlingStats(): Promise<PlayerBowlingStat[]> {
  return cached("bowling", () => readData("Load bowling stats", supabase.getPlayerBowlingStats, local.getPlayerBowlingStats));
}

export async function getTournamentSettings(): Promise<TournamentSettings> {
  return cached("settings", () => readData("Load tournament settings", supabase.getTournamentSettings, local.getTournamentSettings));
}

export async function updateTournamentSettings(input: TournamentSettingsInput): Promise<TournamentSettings> {
  return writeData("Update tournament settings", () => supabase.updateTournamentSettings(input), () => local.updateTournamentSettings(input));
}

export async function getPointsTable(): Promise<PointsRow[]> {
  return cached("points", () => readData("Load points table", supabase.getPointsTable, local.getPointsTable));
}

export async function recalculateAndSavePointsTable(teams?: Team[], fixtures?: Fixture[]): Promise<PointsRow[]> {
  if (useSupabase()) {
    try {
      const points = await supabase.recalculateAndSavePointsTable(teams, fixtures);
      markSupabaseHealthy();
      dataCache.delete("points");
      return points;
    } catch (error) {
      logStorageError("Recalculate points table", error);
      markSupabaseFailed();
    }
  }
  dataCache.delete("points");
  return local.recalculateAndSavePointsTable(teams, fixtures);
}

export function generateAlerts(
  teams?: Team[],
  fixtures?: Fixture[],
  reports?: ReportLog[]
): AlertItem[] {
  return local.generateAlerts(teams, fixtures, reports);
}

export function generateSmartSummary(
  teams?: Team[],
  fixtures?: Fixture[],
  pointsTable?: PointsRow[],
  reports?: ReportLog[]
): SmartSummary {
  return local.generateSmartSummary(teams, fixtures, pointsTable, reports);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [teams, fixtures, pointsTable, reports] = await Promise.all([
    getTeams(),
    getFixtures(),
    getPointsTable(),
    getReports()
  ]);
  const activeTeams = getActiveTeams(teams);
  const activeFixtures = getActiveFixtures(fixtures, teams);
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
    databaseStatus: getDataSourceStatus().label
  };
}

export async function transitionFixtureStatus(fixtureId: string, nextStatus: WorkflowStatus): Promise<Fixture[]> {
  return writeData(
    "Update workflow",
    () => supabase.transitionFixtureStatus(fixtureId, nextStatus),
    () => local.transitionFixtureStatus(fixtureId, nextStatus)
  );
}

export async function seedDemoDataIfEmpty(): Promise<void> {
  if (useSupabase()) {
    try {
      await supabase.seedDemoDataIfEmpty();
      markSupabaseHealthy();
      clearTournamentCache();
      return;
    } catch (error) {
      logStorageError("Seed Supabase demo data", error);
      markSupabaseFailed();
    }
  }
  local.seedDemoDataIfEmpty();
  clearTournamentCache();
}

export const ensureDemoData = seedDemoDataIfEmpty;

export async function resetDemoData() {
  return writeData("Reset demo data", supabase.resetDemoData, local.resetDemoData);
}

export const resetAllData = resetDemoData;

export function describeFixtureResult(fixture: Fixture, teams: Team[]): string {
  return local.describeFixtureResult(fixture, teams);
}

export function getCurrentSession(): DemoSession | null {
  return local.getCurrentSession();
}

export function getCurrentRole(): UserRole | null {
  return local.getCurrentRole();
}

export function isAdmin(): boolean {
  return local.isAdmin();
}

export function isLoggedIn(): boolean {
  return local.isLoggedIn();
}

export function login(email: string, password: string): DemoSession | null {
  return local.login(email, password);
}

export function logout(): void {
  local.logout();
}

export { recalculatePointsTable };
