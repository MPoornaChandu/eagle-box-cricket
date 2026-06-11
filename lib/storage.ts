"use client";

import { recalculatePointsTable } from "./points";
import { getDemoFixtures, getDemoTeams } from "./seed";
import type {
  DashboardStats,
  Fixture,
  FixtureInput,
  PointsRow,
  ResultInput,
  Team,
  TeamInput
} from "./types";
import { getLeaderName } from "./utils";

const TEAMS_KEY = "ebc_teams";
const FIXTURES_KEY = "ebc_fixtures";
const POINTS_KEY = "ebc_points_table";
const LOGIN_KEY = "isLoggedIn";

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

export function getTeams(): Team[] {
  return readJson<Team[]>(TEAMS_KEY, []);
}

export function saveTeams(teams: Team[]): void {
  writeJson(TEAMS_KEY, teams);
}

export function addTeam(teamInput: TeamInput): Team {
  const teams = getTeams();
  const team: Team = {
    ...teamInput,
    id: createId("team"),
    createdAt: new Date().toISOString()
  };
  const nextTeams = [...teams, team];
  saveTeams(nextTeams);
  recalculateAndSavePointsTable(nextTeams, getFixtures());
  return team;
}

export function updateTeam(teamId: string, updatedData: TeamInput): Team[] {
  const nextTeams = getTeams().map((team) =>
    team.id === teamId ? { ...team, ...updatedData } : team
  );
  saveTeams(nextTeams);
  recalculateAndSavePointsTable(nextTeams, getFixtures());
  return nextTeams;
}

export function deleteTeam(teamId: string): { teams: Team[]; fixtures: Fixture[] } {
  const nextTeams = getTeams().filter((team) => team.id !== teamId);
  const nextFixtures = getFixtures().filter(
    (fixture) => fixture.teamAId !== teamId && fixture.teamBId !== teamId
  );

  saveTeams(nextTeams);
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(nextTeams, nextFixtures);

  return { teams: nextTeams, fixtures: nextFixtures };
}

export function getFixtures(): Fixture[] {
  return readJson<Fixture[]>(FIXTURES_KEY, []);
}

export function saveFixtures(fixtures: Fixture[]): void {
  writeJson(FIXTURES_KEY, fixtures);
}

export function addFixture(fixtureInput: FixtureInput): Fixture {
  const fixtures = getFixtures();
  const fixture: Fixture = {
    ...fixtureInput,
    id: createId("fixture"),
    status: "upcoming",
    createdAt: new Date().toISOString()
  };
  const nextFixtures = [...fixtures, fixture];
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  return fixture;
}

export function updateFixture(fixtureId: string, updatedData: FixtureInput): Fixture[] {
  const nextFixtures = getFixtures().map((fixture) =>
    fixture.id === fixtureId && fixture.status === "upcoming"
      ? { ...fixture, ...updatedData }
      : fixture
  );

  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  return nextFixtures;
}

export function deleteFixture(fixtureId: string): Fixture[] {
  const nextFixtures = getFixtures().filter((fixture) => fixture.id !== fixtureId);
  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  return nextFixtures;
}

export function submitFixtureResult(fixtureId: string, resultData: ResultInput): Fixture[] {
  const fixtures = getFixtures();
  const targetFixture = fixtures.find((fixture) => fixture.id === fixtureId);

  if (!targetFixture) {
    throw new Error("Fixture was not found.");
  }

  if (targetFixture.status === "completed") {
    throw new Error("This fixture already has a submitted result.");
  }

  const winnerTeamId =
    resultData.teamAScore > resultData.teamBScore
      ? targetFixture.teamAId
      : resultData.teamBScore > resultData.teamAScore
        ? targetFixture.teamBId
        : undefined;

  const nextFixtures = fixtures.map((fixture) =>
    fixture.id === fixtureId
      ? {
          ...fixture,
          ...resultData,
          status: "completed" as const,
          winnerTeamId,
          completedAt: new Date().toISOString()
        }
      : fixture
  );

  saveFixtures(nextFixtures);
  recalculateAndSavePointsTable(getTeams(), nextFixtures);
  return nextFixtures;
}

export function getPointsTable(): PointsRow[] {
  return readJson<PointsRow[]>(POINTS_KEY, []);
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

export function getDashboardStats(): DashboardStats {
  const teams = getTeams();
  const fixtures = getFixtures();
  const pointsTable = getPointsTable();

  return {
    totalTeams: teams.length,
    totalFixtures: fixtures.length,
    upcomingMatches: fixtures.filter((fixture) => fixture.status === "upcoming").length,
    completedMatches: fixtures.filter((fixture) => fixture.status === "completed").length,
    leaderTeamName: getLeaderName(teams, pointsTable)
  };
}

export function seedDemoData(): { teams: Team[]; fixtures: Fixture[]; pointsTable: PointsRow[] } {
  const teams = getDemoTeams();
  const fixtures = getDemoFixtures();
  const pointsTable = recalculatePointsTable(teams, fixtures);

  saveTeams(teams);
  saveFixtures(fixtures);
  savePointsTable(pointsTable);

  return { teams, fixtures, pointsTable };
}

export function resetAllData(): { teams: Team[]; fixtures: Fixture[]; pointsTable: PointsRow[] } {
  if (canUseStorage()) {
    window.localStorage.removeItem(TEAMS_KEY);
    window.localStorage.removeItem(FIXTURES_KEY);
    window.localStorage.removeItem(POINTS_KEY);
  }

  return seedDemoData();
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
