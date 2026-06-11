import type { Fixture, PointsRow, Team } from "./types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: string): string {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function formatTime(time: string): string {
  if (!time) return "";
  const [hourValue, minuteValue] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hourValue, minuteValue, 0, 0);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function getTeamById(teams: Team[], teamId: string): Team | undefined {
  return teams.find((team) => team.id === teamId);
}

export function getTeamName(teams: Team[], teamId?: string): string {
  if (!teamId) return "Tie";
  return getTeamById(teams, teamId)?.name ?? "Deleted Team";
}

export function getInitials(name: string, fallback = "EB"): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || fallback;
}

export function formatScore(score?: number, wickets?: number): string {
  if (score === undefined || wickets === undefined) {
    return "-";
  }

  return `${score}/${wickets}`;
}

export function getFixtureTitle(fixture: Fixture, teams: Team[]): string {
  return `${getTeamName(teams, fixture.teamAId)} vs ${getTeamName(teams, fixture.teamBId)}`;
}

export function getLeaderName(teams: Team[], pointsTable: PointsRow[]): string {
  const leader = pointsTable[0];
  if (!leader || leader.played === 0) {
    return "No leader yet";
  }

  return getTeamName(teams, leader.teamId);
}

export function normalizeShortName(shortName: string): string {
  return shortName.trim().toUpperCase().slice(0, 5);
}
