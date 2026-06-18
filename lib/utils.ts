import type { Fixture, PointsRow, Team, WorkflowStatus } from "./types";

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

export function formatDateTime(isoDate: string): string {
  if (!isoDate) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(isoDate));
}

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTeamById(teams: Team[], teamId: string): Team | undefined {
  return teams.find((team) => team.id === teamId);
}

export function getTeamName(teams: Team[], teamId?: string): string {
  if (!teamId) return "Tie / No result";
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

export function isResultStatus(status: WorkflowStatus): boolean {
  return status === "Completed" || status === "Points Updated" || status === "Report Generated";
}

export function isUpcomingStatus(status: WorkflowStatus): boolean {
  return status === "Draft" || status === "Scheduled" || status === "Live";
}

export function statusBadgeClasses(status: WorkflowStatus): string {
  const base = "rounded-full border px-2 py-1 text-xs font-black";
  if (status === "Draft") return `${base} border-stone-300/25 bg-stone-400/10 text-slate-200`;
  if (status === "Scheduled") return `${base} border-emerald-300/25 bg-emerald-400/12 text-emerald-100`;
  if (status === "Live") return `${base} border-red-300/30 bg-red-400/14 text-red-100`;
  if (status === "Completed") return `${base} border-emerald-300/25 bg-emerald-400/12 text-emerald-100`;
  if (status === "Points Updated") return `${base} border-amber-300/30 bg-amber-400/12 text-amber-100`;
  return `${base} border-yellow-300/30 bg-yellow-400/12 text-yellow-100`;
}

export function workflowStepIndex(status: WorkflowStatus): number {
  const steps: WorkflowStatus[] = [
    "Draft",
    "Scheduled",
    "Completed",
    "Points Updated",
    "Report Generated"
  ];
  if (status === "Live") return 1;
  return Math.max(0, steps.indexOf(status));
}

export function escapeCsv(value: string | number | undefined): string {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function formatNrr(value: number): string {
  if (value === 0) return "0.000";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

export function downloadTextFile(filename: string, contents: string, type = "text/csv"): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
