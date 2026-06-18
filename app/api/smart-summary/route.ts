import { NextResponse } from "next/server";
import type {
  AlertItem,
  Fixture,
  MatchResult,
  PointsRow,
  ReportLog,
  SmartSummary,
  Team
} from "@/lib/types";

type SmartSummaryPayload = {
  teams?: Team[];
  fixtures?: Fixture[];
  results?: Array<MatchResult & { fixtureId?: string }>;
  pointsTable?: PointsRow[];
  alerts?: AlertItem[];
  reports?: ReportLog[];
  localSummary?: Partial<SmartSummary>;
};

const GEMINI_MODEL = "gemini-1.5-flash";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function stripBullet(value: string): string {
  return value
    .replace(/^[-*\u2022\s]+/, "")
    .replace(/^\d+[\).]\s*/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function normalizeList(value: unknown, fallback: string[], maxItems: number): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n|;/)
      : [];

  const items = rawItems
    .map((item) => stripBullet(cleanText(item)))
    .filter(Boolean)
    .slice(0, maxItems);

  return items.length > 0 ? items : fallback.slice(0, maxItems);
}

function formatNrr(value: number | undefined): string {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  if (safeValue === 0) return "0.000";
  return `${safeValue > 0 ? "+" : ""}${safeValue.toFixed(3)}`;
}

function getTeamName(teams: Team[], teamId?: string): string {
  if (!teamId) return "Tie / No result";
  return teams.find((team) => team.id === teamId)?.name ?? "Deleted Team";
}

function hasResult(fixture: Fixture, resultFixtureIds: Set<string>): boolean {
  if (resultFixtureIds.has(fixture.id) || fixture.result) return true;
  return (
    fixture.teamAScore !== undefined &&
    fixture.teamBScore !== undefined &&
    fixture.teamAWickets !== undefined &&
    fixture.teamBWickets !== undefined &&
    Boolean(fixture.teamAOvers) &&
    Boolean(fixture.teamBOvers)
  );
}

function isCompletedStatus(status: Fixture["status"]): boolean {
  return status === "Completed" || status === "Points Updated" || status === "Report Generated";
}

function fallbackSummary(payload: SmartSummaryPayload): SmartSummary {
  const localSummary = payload.localSummary;
  if (
    localSummary?.mode &&
    cleanText(localSummary.summary) &&
    Array.isArray(localSummary.insights) &&
    Array.isArray(localSummary.recommendedActions) &&
    Array.isArray(localSummary.risks)
  ) {
    return {
      mode: "rule-based",
      summary: cleanText(localSummary.summary),
      insights: normalizeList(localSummary.insights, [], 5),
      recommendedActions: normalizeList(localSummary.recommendedActions, [], 3),
      risks: normalizeList(localSummary.risks, [], 3),
      generatedAt: cleanText(localSummary.generatedAt) || new Date().toISOString()
    };
  }

  const teams = asArray<Team>(payload.teams);
  const fixtures = asArray<Fixture>(payload.fixtures);
  const results = asArray<MatchResult & { fixtureId?: string }>(payload.results);
  const pointsTable = asArray<PointsRow>(payload.pointsTable);
  const alerts = asArray<AlertItem>(payload.alerts);
  const reports = asArray<ReportLog>(payload.reports);
  const resultFixtureIds = new Set(results.map((result) => result.fixtureId).filter(Boolean) as string[]);
  const leader = pointsTable.find((row) => row.played > 0);
  const bestNrr = [...pointsTable]
    .filter((row) => row.played > 0)
    .sort((a, b) => b.netRunRate - a.netRunRate)[0];
  const completedFixtures = fixtures.filter((fixture) => isCompletedStatus(fixture.status) && hasResult(fixture, resultFixtureIds));
  const upcomingFixtures = fixtures.filter((fixture) => !isCompletedStatus(fixture.status));
  const pendingResults = fixtures.filter(
    (fixture) =>
      !hasResult(fixture, resultFixtureIds) &&
      (fixture.status === "Scheduled" || fixture.status === "Live" || fixture.status === "Completed")
  ).length;
  const pendingReports = completedFixtures.filter((fixture) => fixture.status !== "Report Generated").length;
  const leaderName = leader ? getTeamName(teams, leader.teamId) : "No leader yet";
  const bestNrrName = bestNrr ? getTeamName(teams, bestNrr.teamId) : "No NRR leader yet";

  return {
    mode: "rule-based",
    summary: leader
      ? `${leaderName} lead the tournament with ${leader.points} points. ${upcomingFixtures.length} fixture${upcomingFixtures.length === 1 ? " is" : "s are"} upcoming and ${pendingReports} completed fixture${pendingReports === 1 ? " needs" : "s need"} report generation.`
      : `${teams.length} team${teams.length === 1 ? "" : "s"} and ${fixtures.length} fixture${fixtures.length === 1 ? "" : "s"} are configured. Complete match results to unlock standings, NRR, and report insights.`,
    insights: [
      leader
        ? `${leaderName} currently lead the points table.`
        : "No points table leader is available until a result is entered.",
      bestNrr
        ? `${bestNrrName} have the best NRR at ${formatNrr(bestNrr.netRunRate)}.`
        : "NRR is 0.000 until valid scorecards include overs.",
      `${upcomingFixtures.length} fixture${upcomingFixtures.length === 1 ? " is" : "s are"} upcoming.`,
      pendingResults > 0
        ? `${pendingResults} fixture${pendingResults === 1 ? " needs" : "s need"} result entry.`
        : "No pending result entry is blocking the table.",
      reports.length > 0
        ? `${reports.length} report${reports.length === 1 ? " is" : "s are"} already generated.`
        : "Reports are ready after results and points are updated."
    ],
    recommendedActions: [
      pendingResults > 0 ? "Update pending match results." : "Review the next scheduled fixture.",
      pendingReports > 0 ? "Generate reports for completed fixtures." : "Generate the tournament summary report.",
      alerts.length > 0 ? "Review workflow cards with active alerts." : "Export the latest points table CSV."
    ],
    risks: [
      alerts.length > 0 ? `${alerts.length} alert${alerts.length === 1 ? " needs" : "s need"} attention.` : "No active alerts are blocking the workflow.",
      pendingResults > 0 ? "Pending results can make standings outdated." : "Standings are current for entered results.",
      pendingReports > 0 ? "Completed matches without reports may look unfinished in demo review." : "Report workflow is clear for completed matches."
    ],
    generatedAt: new Date().toISOString()
  };
}

function normalizeSummary(value: unknown, fallback: SmartSummary, mode: SmartSummary["mode"]): SmartSummary {
  const objectValue = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const summary =
    cleanText(objectValue.summary) ||
    cleanText(objectValue.headline) ||
    fallback.summary;

  return {
    mode,
    summary,
    insights: normalizeList(objectValue.insights, fallback.insights, 5),
    recommendedActions: normalizeList(
      objectValue.recommendedActions ?? objectValue.recommendedAction,
      fallback.recommendedActions,
      3
    ),
    risks: normalizeList(objectValue.risks ?? objectValue.alerts, fallback.risks, 3),
    generatedAt: new Date().toISOString()
  };
}

function parseGeminiText(text: string, fallback: SmartSummary): SmartSummary {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fencedJson ?? text;
  const objectMatch = candidate.match(/\{[\s\S]*\}/);

  if (objectMatch) {
    try {
      return normalizeSummary(JSON.parse(objectMatch[0]), fallback, "gemini");
    } catch {
      // Fall through to line parsing.
    }
  }

  try {
    return normalizeSummary(JSON.parse(candidate), fallback, "gemini");
  } catch {
    const lines = text
      .split(/\r?\n/)
      .map(stripBullet)
      .filter(Boolean);

    return normalizeSummary(
      {
        summary: lines[0],
        insights: lines.slice(1, 6),
        recommendedActions: lines.filter((line) => /action|recommend|update|generate/i.test(line)).slice(0, 3),
        risks: lines.filter((line) => /risk|alert|pending|delay/i.test(line)).slice(0, 3)
      },
      fallback,
      "gemini"
    );
  }
}

function logMode(mode: SmartSummary["mode"]): void {
  if (process.env.NODE_ENV !== "production") {
    console.info(`Smart summary mode: ${mode === "gemini" ? "Gemini" : "Rule-based fallback"}`);
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as SmartSummaryPayload;
  const fallback = fallbackSummary(payload);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logMode("rule-based");
    return NextResponse.json(fallback);
  }

  try {
    const prompt = [
      "You are a concise cricket tournament operations assistant.",
      "Return JSON only. Do not wrap it in markdown.",
      'Use this exact shape: {"summary":"short summary","insights":["..."],"recommendedActions":["..."],"risks":["..."]}.',
      "Keep summary under 35 words. Use 3 to 5 insights, 2 to 3 recommendedActions, and 2 to 3 risks.",
      "Use the supplied tournament data only.",
      JSON.stringify({
        teams: asArray<Team>(payload.teams),
        fixtures: asArray<Fixture>(payload.fixtures),
        results: asArray<MatchResult & { fixtureId?: string }>(payload.results),
        pointsTable: asArray<PointsRow>(payload.pointsTable),
        alerts: asArray<AlertItem>(payload.alerts),
        reports: asArray<ReportLog>(payload.reports)
      })
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      logMode("rule-based");
      return NextResponse.json(fallback);
    }

    const result = await response.json();
    const text =
      result?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("\n") ?? "";
    const geminiSummary = parseGeminiText(text, fallback);

    logMode("gemini");
    return NextResponse.json(geminiSummary);
  } catch {
    logMode("rule-based");
    return NextResponse.json(fallback);
  }
}
