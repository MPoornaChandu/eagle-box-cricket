import { getFixtureResult, hasResult, isCompletedFixture } from "@/lib/points";
import type {
  AssistantChatAction,
  AssistantChatResponse,
  AutomatedInsightsPayload,
  Fixture,
  PointsRow,
  ReportLog,
  Team
} from "@/lib/types";
import { formatDate, formatNrr, formatTime, getFixtureTitle, getTeamName, isResultStatus } from "@/lib/utils";

type AssistantData = AutomatedInsightsPayload & {
  todayKey?: string;
};

function plural(count: number, singular: string, pluralValue = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralValue}`;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function getLocalDateKey(dateValue?: string | Date): string {
  if (!dateValue) return "";

  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const rawValue = dateValue.trim();
  const isoLike = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoLike) return isoLike[1];

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return rawValue;
  return getLocalDateKey(parsed);
}

function getTodayKey(data?: AssistantData): string {
  return data?.todayKey || getLocalDateKey(new Date());
}

function sortedFixtures(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function formatFixtureLine(fixture: Fixture, teams: Team[], index: number): string {
  const time = fixture.time ? formatTime(fixture.time) : "time TBC";
  const venue = fixture.venue || "venue TBC";
  return `${index + 1}. ${getFixtureTitle(fixture, teams)} - ${time} at ${venue}`;
}

function action(label: string, href: string): AssistantChatAction {
  return { label, href };
}

function response(answer: string, relatedPage: string | undefined, suggestedActions: AssistantChatAction[]): AssistantChatResponse {
  return {
    mode: "local",
    answer,
    relatedPage,
    suggestedActions
  };
}

export function getTodayFixtures(data: AssistantData): Fixture[] {
  const todayKey = getTodayKey(data);
  return sortedFixtures(data.fixtures).filter((fixture) => getLocalDateKey(fixture.date) === todayKey);
}

export function getUpcomingFixtures(data: AssistantData): Fixture[] {
  const todayKey = getTodayKey(data);
  return sortedFixtures(data.fixtures).filter(
    (fixture) => !isResultStatus(fixture.status) && getLocalDateKey(fixture.date) >= todayKey
  );
}

export function getPendingResults(data: AssistantData): Fixture[] {
  return sortedFixtures(data.fixtures).filter(
    (fixture) =>
      fixture.status !== "Draft" &&
      (fixture.status === "Scheduled" || fixture.status === "Live" || fixture.status === "Completed") &&
      !hasResult(fixture)
  );
}

export function getLeader(data: AssistantData): PointsRow | undefined {
  return data.standings.find((row) => row.played > 0);
}

export function getBestNRR(data: AssistantData): PointsRow | undefined {
  return [...data.standings]
    .filter((row) => row.played > 0)
    .sort((a, b) => b.netRunRate - a.netRunRate)[0];
}

export function getReportSuggestions(data: AssistantData): Fixture[] {
  const reportedFixtureIds = new Set(data.reports.map((report) => report.fixtureId).filter(Boolean));
  return sortedFixtures(data.fixtures).filter(
    (fixture) => isCompletedFixture(fixture) && fixture.status !== "Report Generated" && !reportedFixtureIds.has(fixture.id)
  );
}

export function getNextActions(data: AssistantData): AssistantChatAction[] {
  const pendingResults = getPendingResults(data);
  const reportReady = getReportSuggestions(data);

  if (data.teams.length === 0) return [action("Add Teams", "/teams")];
  if (data.teams.length < 2) return [action("Add Another Team", "/teams")];
  if (data.fixtures.length === 0) return [action("Create Fixtures", "/fixtures")];
  if (pendingResults.length > 0) return [action("Open Results", "/results")];
  if (reportReady.length > 0) return [action("Open Reports", "/reports")];
  return [action("Review Workflow", "/workflow"), action("View Standings", "/standings")];
}

function emptyDataAnswer(data: AssistantData): AssistantChatResponse | null {
  if (data.teams.length === 0 && data.fixtures.length === 0) {
    return response(
      "No teams or fixtures are available yet. Add teams and create fixtures to start generating insights.",
      "/teams",
      [action("Add Teams", "/teams"), action("Create Fixtures", "/fixtures")]
    );
  }

  return null;
}

function answerTodayFixtures(data: AssistantData): AssistantChatResponse {
  const todayFixtures = getTodayFixtures(data);
  if (todayFixtures.length > 0) {
    return response(
      `Today's fixtures:\n\n${todayFixtures.map((fixture, index) => formatFixtureLine(fixture, data.teams, index)).join("\n")}`,
      "/fixtures",
      [action("Open Fixtures", "/fixtures")]
    );
  }

  const nextFixture = getUpcomingFixtures(data)[0];
  if (!nextFixture) {
    return response("No fixtures are scheduled for today, and there are no upcoming fixtures yet.", "/fixtures", [
      action("Create Fixture", "/fixtures")
    ]);
  }

  return response(
    `No fixtures are scheduled for today. The next upcoming match is ${getFixtureTitle(nextFixture, data.teams)} on ${formatDate(nextFixture.date)}${nextFixture.time ? ` at ${formatTime(nextFixture.time)}` : ""}.`,
    "/fixtures",
    [action("Open Fixtures", "/fixtures")]
  );
}

function answerUpcomingFixtures(data: AssistantData): AssistantChatResponse {
  const upcoming = getUpcomingFixtures(data).slice(0, 5);
  if (upcoming.length === 0) {
    return response("There are no upcoming fixtures yet. Create fixtures to build the schedule.", "/fixtures", [
      action("Create Fixture", "/fixtures")
    ]);
  }

  return response(
    `Upcoming fixtures:\n\n${upcoming.map((fixture, index) => `${formatFixtureLine(fixture, data.teams, index)} on ${formatDate(fixture.date)}`).join("\n")}`,
    "/fixtures",
    [action("Open Fixtures", "/fixtures")]
  );
}

function answerLeader(data: AssistantData): AssistantChatResponse {
  const leader = getLeader(data);
  if (!leader) {
    return response("No points table leader is available yet because no completed matches have been recorded.", "/results", [
      action("Enter Results", "/results")
    ]);
  }

  return response(
    `${getTeamName(data.teams, leader.teamId)} are leading with ${leader.points} points from ${plural(leader.played, "match", "matches")} and an NRR of ${formatNrr(leader.netRunRate)}.`,
    "/standings",
    [action("Open Standings", "/standings")]
  );
}

function answerBestNRR(data: AssistantData): AssistantChatResponse {
  const bestNrr = getBestNRR(data);
  if (!bestNrr) {
    return response("Best NRR is not available yet because no completed matches have been recorded.", "/results", [
      action("Enter Results", "/results")
    ]);
  }

  return response(
    `${getTeamName(data.teams, bestNrr.teamId)} have the best NRR at ${formatNrr(bestNrr.netRunRate)}.`,
    "/standings",
    [action("Open Standings", "/standings")]
  );
}

function answerPendingResults(data: AssistantData): AssistantChatResponse {
  const pending = getPendingResults(data).slice(0, 6);
  if (pending.length === 0) {
    return response("No match results are pending right now. Standings can stay current from the results already entered.", "/results", [
      action("Open Results", "/results")
    ]);
  }

  return response(
    `Pending results:\n\n${pending.map((fixture, index) => `${index + 1}. ${getFixtureTitle(fixture, data.teams)} - ${formatDate(fixture.date)}`).join("\n")}`,
    "/results",
    [action("Open Results", "/results")]
  );
}

function answerReports(data: AssistantData): AssistantChatResponse {
  const reportReady = getReportSuggestions(data);
  if (reportReady.length > 0) {
    return response(
      `Generate reports for ${plural(reportReady.length, "completed match", "completed matches")}:\n\n${reportReady
        .slice(0, 5)
        .map((fixture, index) => `${index + 1}. ${getFixtureTitle(fixture, data.teams)} - ${formatDate(fixture.date)}`)
        .join("\n")}`,
      "/reports",
      [action("Open Reports", "/reports")]
    );
  }

  const completed = data.fixtures.filter((fixture) => getFixtureResult(fixture)).length;
  const reports = data.reports as ReportLog[];
  if (completed === 0) {
    return response("No match reports are ready yet. Enter completed results first, then generate results and standings reports.", "/results", [
      action("Enter Results", "/results")
    ]);
  }

  return response(
    reports.length > 0
      ? "Reports are up to date for the current completed match workflow. You can generate a tournament summary if you need an export."
      : "Completed match data exists. Generate a tournament summary or points table report for admin review.",
    "/reports",
    [action("Open Reports", "/reports")]
  );
}

function answerNextAction(data: AssistantData): AssistantChatResponse {
  const pendingResults = getPendingResults(data);
  const reportReady = getReportSuggestions(data);

  if (data.teams.length < 2) {
    return response("Add at least two active teams first. Fixtures, results, and standings depend on team setup.", "/teams", [
      action("Open Teams", "/teams")
    ]);
  }

  if (data.fixtures.length === 0) {
    return response("Create fixtures next so the tournament schedule can start.", "/fixtures", [
      action("Create Fixtures", "/fixtures")
    ]);
  }

  if (pendingResults.length > 0) {
    return response(`Enter ${plural(pendingResults.length, "pending result")} next so standings and NRR stay current.`, "/results", [
      action("Open Results", "/results")
    ]);
  }

  if (reportReady.length > 0) {
    return response(`Generate reports for ${plural(reportReady.length, "completed match", "completed matches")} next.`, "/reports", [
      action("Open Reports", "/reports")
    ]);
  }

  return response("Operations look clear. Review upcoming fixtures and share the scoreboard if teams need the latest public view.", "/scoreboard", [
    action("Share Scoreboard", "/scoreboard"),
    action("Review Workflow", "/workflow")
  ]);
}

export function answerLocalQuestion(message: string, data: AssistantData): AssistantChatResponse {
  const safeData: AssistantData = {
    teams: data.teams ?? [],
    fixtures: data.fixtures ?? [],
    results: data.results ?? [],
    standings: data.standings ?? [],
    reports: data.reports ?? [],
    alerts: data.alerts ?? [],
    settings: data.settings,
    todayKey: data.todayKey
  };

  const emptyAnswer = emptyDataAnswer(safeData);
  if (emptyAnswer) return emptyAnswer;

  const normalized = normalizeText(message);

  if (/\btoday\b/.test(normalized) && /match|fixture|game|schedule/.test(normalized)) {
    return answerTodayFixtures(safeData);
  }

  if (/upcoming|next fixture|show fixtures|schedule/.test(normalized)) {
    return answerUpcomingFixtures(safeData);
  }

  if (/pending|without result|results? pending|scorecard/.test(normalized)) {
    return answerPendingResults(safeData);
  }

  if (/best nrr|net run rate|nrr/.test(normalized)) {
    return answerBestNRR(safeData);
  }

  if (/leader|leading|top|first/.test(normalized)) {
    return answerLeader(safeData);
  }

  if (/report|generate/.test(normalized)) {
    return answerReports(safeData);
  }

  if (/next|do next|what should|action|priority|recommend/.test(normalized)) {
    return answerNextAction(safeData);
  }

  const actions = getNextActions(safeData);
  return response(
    "I can answer from the current tournament data. Try asking about today's fixtures, the standings leader, pending results, reports, best NRR, or what to do next.",
    actions[0]?.href,
    actions
  );
}
