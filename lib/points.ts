import type { Fixture, PointsRow, Team } from "./types";

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
    points: 0,
    runsFor: 0,
    runsAgainst: 0,
    oversFor: 0,
    oversAgainst: 0,
    netRunRate: 0,
    lastUpdated
  };
}

function calculateNetRunRate(row: PointsRow): number {
  const scoringRate = row.oversFor > 0 ? row.runsFor / row.oversFor : 0;
  const concededRate = row.oversAgainst > 0 ? row.runsAgainst / row.oversAgainst : 0;
  return Number((scoringRate - concededRate).toFixed(3));
}

export function recalculatePointsTable(teams: Team[], fixtures: Fixture[]): PointsRow[] {
  const lastUpdated = new Date().toISOString();
  const rowsByTeam = new Map<string, PointsRow>(
    teams.map((team) => [team.id, emptyPointsRow(team.id, lastUpdated)])
  );

  fixtures
    .filter((fixture) => fixture.status === "completed")
    .forEach((fixture) => {
      const teamARow = rowsByTeam.get(fixture.teamAId);
      const teamBRow = rowsByTeam.get(fixture.teamBId);

      if (!teamARow || !teamBRow) {
        return;
      }

      const teamAScore = fixture.teamAScore ?? 0;
      const teamBScore = fixture.teamBScore ?? 0;
      const teamAOvers = safeOvers(fixture.teamAOvers);
      const teamBOvers = safeOvers(fixture.teamBOvers);

      teamARow.played += 1;
      teamBRow.played += 1;

      teamARow.runsFor += teamAScore;
      teamARow.runsAgainst += teamBScore;
      teamBRow.runsFor += teamBScore;
      teamBRow.runsAgainst += teamAScore;

      teamARow.oversFor += teamAOvers;
      teamARow.oversAgainst += teamBOvers;
      teamBRow.oversFor += teamBOvers;
      teamBRow.oversAgainst += teamAOvers;

      if (teamAScore > teamBScore) {
        teamARow.won += 1;
        teamARow.points += 2;
        teamBRow.lost += 1;
      } else if (teamBScore > teamAScore) {
        teamBRow.won += 1;
        teamBRow.points += 2;
        teamARow.lost += 1;
      } else {
        teamARow.tied += 1;
        teamBRow.tied += 1;
        teamARow.points += 1;
        teamBRow.points += 1;
      }
    });

  return Array.from(rowsByTeam.values())
    .map((row) => ({
      ...row,
      oversFor: Number(row.oversFor.toFixed(3)),
      oversAgainst: Number(row.oversAgainst.toFixed(3)),
      netRunRate: calculateNetRunRate(row)
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return b.netRunRate - a.netRunRate;
    });
}
