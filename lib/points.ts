import type { Fixture, FormResult, MatchResult, PointsRow, Team, TournamentSettings } from "./types";
import { getActiveTeams, getTeamName } from "./utils";

const completedStatuses = new Set(["Completed", "Points Updated", "Report Generated"]);

// Cricket overs helpers.

/**
 * Parse a cricket overs string like "18.4" into a decimal number.
 * 18.4 means 18 overs and 4 balls = 18 + 4/6 = 18.667
 * The decimal part must be 0-5 (6 balls = 1 over).
 */
export function isValidCricketOvers(overs: string | number | undefined | null): boolean {
  if (overs === undefined || overs === null) return false;
  const rawValue = String(overs).trim();
  if (!rawValue) return false;
  return /^\d+(\.[0-5])?$/.test(rawValue);
}

export function parseCricketOversToDecimal(overs: number | string): number {
  return parseOversToBalls(overs) / 6;
}

/**
 * Convert a cricket overs string like "18.4" to total balls.
 * 18.4 -> 18 * 6 + 4 = 112 balls
 */
export function parseOversToBalls(overs: string | number | undefined | null): number {
  if (overs === undefined || overs === null || String(overs).trim() === "") {
    return 0;
  }

  if (!isValidCricketOvers(overs)) {
    throw new Error("Cricket overs must use 0 to 5 balls after the decimal (for example 12.3 is valid, 12.6 is not).");
  }

  const [wholePart, ballsPart = "0"] = String(overs).trim().split(".");
  return Number(wholePart) * 6 + Number(ballsPart);
}

/**
 * Convert total balls to cricket overs text.
 * 112 balls -> "18.4"
 * 120 balls -> "20.0"
 * 0 balls -> "0.0"
 */
export function ballsToOversText(balls: number): string {
  if (balls <= 0) return "0.0";
  const fullOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${fullOvers}.${remainingBalls}`;
}

/**
 * Calculate run rate from runs and balls.
 * run rate = runs / (balls / 6)
 */
export function calculateRunRate(runs: number, balls: number): number {
  if (balls <= 0) return 0;
  return runs / (balls / 6);
}

/**
 * Calculate Net Run Rate from a PointsRow using balls for accuracy.
 * NRR = (runsFor / oversFaced) - (runsAgainst / oversBowled)
 *     = (runsFor / (ballsFaced/6)) - (runsAgainst / (ballsBowled/6))
 */
export function calculateNRR(row: PointsRow): number {
  if (row.ballsFaced <= 0 || row.ballsBowled <= 0) {
    return 0;
  }

  const scoringRate = row.runsFor / (row.ballsFaced / 6);
  const concededRate = row.runsAgainst / (row.ballsBowled / 6);
  return Number((scoringRate - concededRate).toFixed(3));
}

// Internal helpers.

function safeOversToBalls(overs?: string): number {
  try {
    return parseOversToBalls(overs);
  } catch {
    return 0;
  }
}

function emptyPointsRow(teamId: string, lastUpdated: string): PointsRow {
  return {
    teamId,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    points: 0,
    runsFor: 0,
    ballsFaced: 0,
    runsAgainst: 0,
    ballsBowled: 0,
    netRunRate: 0,
    lastFive: [],
    lastUpdated
  };
}

// Fixture result extraction.

export function getFixtureResult(fixture: Fixture): MatchResult | undefined {
  if (fixture.result) {
    return fixture.result;
  }

  if (
    fixture.teamAScore === undefined ||
    fixture.teamBScore === undefined ||
    fixture.teamAWickets === undefined ||
    fixture.teamBWickets === undefined ||
    !fixture.teamAOvers ||
    !fixture.teamBOvers
  ) {
    if (fixture.resultType === "No result") {
      return {
        teamARuns: 0,
        teamAWickets: 0,
        teamAOvers: "0",
        teamBRuns: 0,
        teamBWickets: 0,
        teamBOvers: "0",
        resultType: "No result",
        winnerTeamId: undefined,
        playerOfMatch: fixture.playerOfMatch,
        notes: fixture.notes,
        submittedAt: fixture.completedAt ?? fixture.createdAt
      };
    }

    return undefined;
  }

  return {
    teamARuns: fixture.teamAScore,
    teamAWickets: fixture.teamAWickets,
    teamAOvers: fixture.teamAOvers,
    teamBRuns: fixture.teamBScore,
    teamBWickets: fixture.teamBWickets,
    teamBOvers: fixture.teamBOvers,
    resultType:
      fixture.resultType ??
      (fixture.teamAScore === fixture.teamBScore ? "Tie" : "Normal win"),
    winnerTeamId: fixture.winnerTeamId,
    playerOfMatch: fixture.playerOfMatch,
    notes: fixture.notes,
    submittedAt: fixture.completedAt ?? fixture.createdAt
  };
}

export function hasResult(fixture: Fixture): boolean {
  return Boolean(getFixtureResult(fixture));
}

export function isCompletedFixture(fixture: Fixture): boolean {
  return completedStatuses.has(fixture.status) && hasResult(fixture);
}

// Points application.

function pushForm(row: PointsRow, form: FormResult): void {
  row.lastFive = [form, ...row.lastFive].slice(0, 5);
}

function applyOutcome(
  fixture: Fixture,
  result: MatchResult,
  teamARow: PointsRow,
  teamBRow: PointsRow,
  settings: Pick<TournamentSettings, "pointsPerWin" | "pointsPerTie" | "pointsPerLoss">
): void {
  teamARow.played += 1;
  teamBRow.played += 1;

  if (result.resultType !== "No result") {
    const teamABalls = safeOversToBalls(result.teamAOvers);
    const teamBBalls = safeOversToBalls(result.teamBOvers);

    teamARow.runsFor += result.teamARuns;
    teamARow.runsAgainst += result.teamBRuns;
    teamBRow.runsFor += result.teamBRuns;
    teamBRow.runsAgainst += result.teamARuns;

    teamARow.ballsFaced += teamABalls;
    teamARow.ballsBowled += teamBBalls;
    teamBRow.ballsFaced += teamBBalls;
    teamBRow.ballsBowled += teamABalls;
  }

  if (result.resultType === "Tie") {
    teamARow.tied += 1;
    teamBRow.tied += 1;
    teamARow.points += settings.pointsPerTie;
    teamBRow.points += settings.pointsPerTie;
    pushForm(teamARow, "T");
    pushForm(teamBRow, "T");
    return;
  }

  if (result.resultType === "No result") {
    teamARow.noResult += 1;
    teamBRow.noResult += 1;
    teamARow.points += settings.pointsPerTie;
    teamBRow.points += settings.pointsPerTie;
    pushForm(teamARow, "NR");
    pushForm(teamBRow, "NR");
    return;
  }

  const winnerTeamId =
    result.winnerTeamId ??
    (result.teamARuns > result.teamBRuns
      ? fixture.teamAId
      : result.teamBRuns > result.teamARuns
        ? fixture.teamBId
        : undefined);

  if (!winnerTeamId) {
    teamARow.tied += 1;
    teamBRow.tied += 1;
    teamARow.points += settings.pointsPerTie;
    teamBRow.points += settings.pointsPerTie;
    pushForm(teamARow, "T");
    pushForm(teamBRow, "T");
    return;
  }

  const winnerRow = winnerTeamId === fixture.teamAId ? teamARow : teamBRow;
  const loserRow = winnerTeamId === fixture.teamAId ? teamBRow : teamARow;

  winnerRow.won += 1;
  winnerRow.points += settings.pointsPerWin;
  loserRow.lost += 1;
  loserRow.points += settings.pointsPerLoss;
  pushForm(winnerRow, "W");
  pushForm(loserRow, "L");
}

// Full recalculation.

export function recalculatePointsTable(
  teams: Team[],
  fixtures: Fixture[],
  settings: Pick<TournamentSettings, "pointsPerWin" | "pointsPerTie" | "pointsPerLoss"> = {
    pointsPerWin: 2,
    pointsPerTie: 1,
    pointsPerLoss: 0
  }
): PointsRow[] {
  const lastUpdated = new Date().toISOString();
  const activeTeams = getActiveTeams(teams);
  const rowsByTeam = new Map<string, PointsRow>(
    activeTeams.map((team) => [team.id, emptyPointsRow(team.id, lastUpdated)])
  );

  fixtures
    .filter(isCompletedFixture)
    .sort((a, b) =>
      `${a.completedAt ?? a.date}${a.time}`.localeCompare(`${b.completedAt ?? b.date}${b.time}`)
    )
    .forEach((fixture) => {
      const teamARow = rowsByTeam.get(fixture.teamAId);
      const teamBRow = rowsByTeam.get(fixture.teamBId);
      const result = getFixtureResult(fixture);

      if (!teamARow || !teamBRow || !result) {
        return;
      }

      applyOutcome(fixture, result, teamARow, teamBRow, settings);
    });

  return Array.from(rowsByTeam.values())
    .map((row) => ({
      ...row,
      netRunRate: calculateNRR(row)
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
      if (b.won !== a.won) return b.won - a.won;
      return getTeamName(activeTeams, a.teamId).localeCompare(getTeamName(activeTeams, b.teamId));
    });
}
