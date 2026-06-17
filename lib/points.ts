import type { Fixture, FormResult, MatchResult, PointsRow, Team } from "./types";
import { getTeamName } from "./utils";

const completedStatuses = new Set(["Completed", "Points Updated", "Report Generated"]);

export function parseCricketOversToDecimal(overs: number | string): number {
  const rawValue = String(overs).trim();

  if (!rawValue || !/^\d+(\.\d+)?$/.test(rawValue)) {
    throw new Error("Overs must be a positive cricket overs value.");
  }

  const [wholePart, ballsPart = "0"] = rawValue.split(".");
  const fullOvers = Number(wholePart);
  const balls = Number(ballsPart);

  if (!Number.isInteger(fullOvers) || !Number.isInteger(balls)) {
    throw new Error("Overs must use whole overs and balls.");
  }

  if (balls < 0 || balls > 5) {
    throw new Error("Cricket overs can only have 0 to 5 balls after the decimal.");
  }

  return fullOvers + balls / 6;
}

function safeOvers(overs?: string): number {
  if (!overs) {
    return 0;
  }

  try {
    return parseCricketOversToDecimal(overs);
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
    oversFaced: 0,
    runsAgainst: 0,
    oversBowled: 0,
    netRunRate: 0,
    lastFive: [],
    lastUpdated
  };
}

function calculateNetRunRate(row: PointsRow): number {
  if (row.oversFaced <= 0 || row.oversBowled <= 0) {
    return 0;
  }

  const scoringRate = row.runsFor / row.oversFaced;
  const concededRate = row.runsAgainst / row.oversBowled;
  return Number((scoringRate - concededRate).toFixed(3));
}

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

function pushForm(row: PointsRow, form: FormResult): void {
  row.lastFive = [form, ...row.lastFive].slice(0, 5);
}

function applyOutcome(
  fixture: Fixture,
  result: MatchResult,
  teamARow: PointsRow,
  teamBRow: PointsRow
): void {
  teamARow.played += 1;
  teamBRow.played += 1;

  if (result.resultType !== "No result") {
    const teamAOvers = safeOvers(result.teamAOvers);
    const teamBOvers = safeOvers(result.teamBOvers);

    teamARow.runsFor += result.teamARuns;
    teamARow.runsAgainst += result.teamBRuns;
    teamBRow.runsFor += result.teamBRuns;
    teamBRow.runsAgainst += result.teamARuns;

    teamARow.oversFaced += teamAOvers;
    teamARow.oversBowled += teamBOvers;
    teamBRow.oversFaced += teamBOvers;
    teamBRow.oversBowled += teamAOvers;
  }

  if (result.resultType === "Tie") {
    teamARow.tied += 1;
    teamBRow.tied += 1;
    teamARow.points += 1;
    teamBRow.points += 1;
    pushForm(teamARow, "T");
    pushForm(teamBRow, "T");
    return;
  }

  if (result.resultType === "No result") {
    teamARow.noResult += 1;
    teamBRow.noResult += 1;
    teamARow.points += 1;
    teamBRow.points += 1;
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
    teamARow.points += 1;
    teamBRow.points += 1;
    pushForm(teamARow, "T");
    pushForm(teamBRow, "T");
    return;
  }

  const winnerRow = winnerTeamId === fixture.teamAId ? teamARow : teamBRow;
  const loserRow = winnerTeamId === fixture.teamAId ? teamBRow : teamARow;

  winnerRow.won += 1;
  winnerRow.points += 2;
  loserRow.lost += 1;
  pushForm(winnerRow, "W");
  pushForm(loserRow, "L");
}

export function recalculatePointsTable(teams: Team[], fixtures: Fixture[]): PointsRow[] {
  const lastUpdated = new Date().toISOString();
  const rowsByTeam = new Map<string, PointsRow>(
    teams.map((team) => [team.id, emptyPointsRow(team.id, lastUpdated)])
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

      applyOutcome(fixture, result, teamARow, teamBRow);
    });

  return Array.from(rowsByTeam.values())
    .map((row) => ({
      ...row,
      oversFaced: Number(row.oversFaced.toFixed(3)),
      oversBowled: Number(row.oversBowled.toFixed(3)),
      netRunRate: calculateNetRunRate(row)
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
      if (b.won !== a.won) return b.won - a.won;
      return getTeamName(teams, a.teamId).localeCompare(getTeamName(teams, b.teamId));
    });
}
