import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { buildRuleBasedInsights } from "@/lib/insights/ruleBasedInsights";
import type {
  AlertItem,
  AutomatedInsightsPayload,
  AutomatedInsightsResponse,
  Fixture,
  InsightActionCard,
  InsightActionType,
  InsightCard,
  InsightPriority,
  InsightRiskCard,
  InsightSeverity,
  MatchResult,
  PointsRow,
  ReportLog,
  Team,
  TournamentSettings
} from "@/lib/types";

export const runtime = "nodejs";

type IncomingPayload = Partial<AutomatedInsightsPayload> & {
  pointsTable?: PointsRow[];
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizePayload(value: IncomingPayload): AutomatedInsightsPayload {
  return {
    teams: asArray<Team>(value.teams),
    fixtures: asArray<Fixture>(value.fixtures),
    results: asArray<MatchResult & { fixtureId?: string }>(value.results),
    standings: asArray<PointsRow>(value.standings ?? value.pointsTable),
    reports: asArray<ReportLog>(value.reports),
    alerts: asArray<AlertItem>(value.alerts),
    settings: value.settings as Partial<TournamentSettings> | undefined
  };
}

function extractJson(text: string): unknown | null {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fencedJson ?? text).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
}

function normalizePriority(value: unknown, fallback: InsightPriority = "medium"): InsightPriority {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized;
  return fallback;
}

function normalizeSeverity(value: unknown, fallback: InsightSeverity = "medium"): InsightSeverity {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized;
  return fallback;
}

function normalizeActionType(value: unknown, fallback: InsightActionType = "workflow_review"): InsightActionType {
  const normalized = cleanText(value).toLowerCase();
  const allowed: InsightActionType[] = [
    "team_setup",
    "fixture_creation",
    "fixture_review",
    "result_entry",
    "report_generation",
    "standings_review",
    "workflow_review",
    "scoreboard_share",
    "settings_review"
  ];
  return allowed.includes(normalized as InsightActionType) ? (normalized as InsightActionType) : fallback;
}

function hrefForAction(actionType: InsightActionType, text: string): string {
  if (actionType === "team_setup") return "/teams";
  if (actionType === "fixture_creation" || actionType === "fixture_review") return "/fixtures";
  if (actionType === "result_entry") return "/results";
  if (actionType === "report_generation") return "/reports";
  if (actionType === "standings_review") return "/standings";
  if (actionType === "scoreboard_share") return "/scoreboard";
  if (actionType === "settings_review") return "/settings";
  if (/result|scorecard|pending/i.test(text)) return "/results";
  if (/fixture|schedule|upcoming|match/i.test(text)) return "/fixtures";
  if (/report/i.test(text)) return "/reports";
  if (/standing|nrr|leader/i.test(text)) return "/standings";
  if (/scoreboard|share/i.test(text)) return "/scoreboard";
  if (/setting/i.test(text)) return "/settings";
  if (/team/i.test(text)) return "/teams";
  return "/workflow";
}

function normalizeRelatedPage(value: unknown, fallback: string): string {
  const href = cleanText(value);
  if (!href || href === "#") return fallback;
  if (!href.startsWith("/")) return fallback;
  return href;
}

function normalizeInsightList(value: unknown, fallback: InsightCard[]): InsightCard[] {
  const items = asArray<Record<string, unknown>>(value)
    .map<InsightCard | null>((item, index) => {
      const title = cleanText(item.title) || fallback[index]?.title;
      const description = cleanText(item.description) || cleanText(item.summary) || fallback[index]?.description;
      if (!title || !description) return null;
      const combined = `${title} ${description}`;
      const relatedPage = normalizeRelatedPage(
        item.relatedPage ?? item.relatedHref,
        fallback[index]?.relatedPage ?? fallback[index]?.relatedHref ?? hrefForAction("workflow_review", combined)
      );
      return {
        title,
        description,
        priority: normalizePriority(item.priority, fallback[index]?.priority ?? "medium"),
        relatedHref: relatedPage,
        relatedPage
      } satisfies InsightCard;
    })
    .filter((item): item is InsightCard => Boolean(item));

  return (items.length > 0 ? items : fallback).slice(0, 5);
}

function normalizeActionList(value: unknown, fallback: InsightActionCard[]): InsightActionCard[] {
  const items = asArray<Record<string, unknown>>(value)
    .map<InsightActionCard | null>((item, index) => {
      const title = cleanText(item.title) || fallback[index]?.title;
      const description = cleanText(item.description) || fallback[index]?.description;
      if (!title || !description) return null;
      const actionType = normalizeActionType(item.actionType, fallback[index]?.actionType ?? "workflow_review");
      const relatedPage = normalizeRelatedPage(
        item.relatedPage ?? item.relatedHref,
        fallback[index]?.relatedPage ?? fallback[index]?.relatedHref ?? hrefForAction(actionType, `${title} ${description}`)
      );
      return {
        title,
        description,
        actionType,
        priority: normalizePriority(item.priority, fallback[index]?.priority ?? "medium"),
        relatedHref: relatedPage,
        relatedPage
      } satisfies InsightActionCard;
    })
    .filter((item): item is InsightActionCard => Boolean(item));

  return (items.length > 0 ? items : fallback).slice(0, 5);
}

function normalizeRiskList(value: unknown, fallback: InsightRiskCard[]): InsightRiskCard[] {
  const items = asArray<Record<string, unknown>>(value)
    .map<InsightRiskCard | null>((item, index) => {
      const title = cleanText(item.title) || fallback[index]?.title;
      const description = cleanText(item.description) || fallback[index]?.description;
      if (!title || !description) return null;
      const combined = `${title} ${description}`;
      const relatedPage = normalizeRelatedPage(
        item.relatedPage ?? item.relatedHref,
        fallback[index]?.relatedPage ?? fallback[index]?.relatedHref ?? hrefForAction("workflow_review", combined)
      );
      return {
        title,
        description,
        severity: normalizeSeverity(item.severity, fallback[index]?.severity ?? "medium"),
        relatedHref: relatedPage,
        relatedPage
      } satisfies InsightRiskCard;
    })
    .filter((item): item is InsightRiskCard => Boolean(item));

  return (items.length > 0 ? items : fallback).slice(0, 5);
}

function normalizeGeminiResponse(value: unknown, fallback: AutomatedInsightsResponse): AutomatedInsightsResponse | null {
  if (!value || typeof value !== "object") return null;
  const objectValue = value as Record<string, unknown>;
  const summary = cleanText(objectValue.summary) || fallback.summary;

  return {
    mode: "gemini",
    summary,
    insights: normalizeInsightList(objectValue.insights, fallback.insights),
    recommendedActions: normalizeActionList(objectValue.recommendedActions, fallback.recommendedActions),
    risks: normalizeRiskList(objectValue.risks, fallback.risks),
    generatedAt: new Date().toISOString()
  };
}

function withRelatedPages(response: AutomatedInsightsResponse, mode: AutomatedInsightsResponse["mode"] = response.mode): AutomatedInsightsResponse {
  return {
    ...response,
    mode,
    insights: response.insights.map((item) => {
      const relatedPage = normalizeRelatedPage(item.relatedPage ?? item.relatedHref, hrefForAction("workflow_review", `${item.title} ${item.description}`));
      return { ...item, relatedHref: relatedPage, relatedPage };
    }),
    recommendedActions: response.recommendedActions.map((item) => {
      const relatedPage = normalizeRelatedPage(item.relatedPage ?? item.relatedHref, hrefForAction(item.actionType, `${item.title} ${item.description}`));
      return { ...item, relatedHref: relatedPage, relatedPage };
    }),
    risks: response.risks.map((item) => {
      const relatedPage = normalizeRelatedPage(item.relatedPage ?? item.relatedHref, hrefForAction("workflow_review", `${item.title} ${item.description}`));
      return { ...item, relatedHref: relatedPage, relatedPage };
    })
  };
}

async function generateGeminiInsights(payload: AutomatedInsightsPayload, fallback: AutomatedInsightsResponse): Promise<AutomatedInsightsResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction:
      "You are an AI cricket tournament operations assistant. Analyze only the tournament data provided. Do not invent teams, fixtures, results, scores, or reports. Give practical admin actions. Return JSON only. Keep responses short and useful."
  });

  const prompt = [
    "Analyze this Eagle Box Cricket tournament workspace.",
    "Return JSON only with this exact shape:",
    '{"summary":"short useful tournament summary","insights":[{"title":"Leader update","description":"...","priority":"medium","relatedPage":"/standings"}],"recommendedActions":[{"title":"Enter pending results","description":"...","actionType":"result_entry","priority":"high","relatedPage":"/results"}],"risks":[{"title":"Pending reports","description":"...","severity":"low","relatedPage":"/reports"}]}.',
    "Use priority/severity values only: high, medium, low.",
    "Use actionType values only: team_setup, fixture_creation, fixture_review, result_entry, report_generation, standings_review, workflow_review, scoreboard_share, settings_review.",
    "Use short card-friendly text. No markdown. No fake teams, scores, reports, or fixtures.",
    "Consider leader, best NRR, upcoming fixtures, pending results, completed matches without reports, team form, workflow bottlenecks, data quality issues, and next admin actions.",
    JSON.stringify(payload)
  ].join("\n");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 900,
      responseMimeType: "application/json"
    }
  });

  const text = result.response.text();
  const parsed = extractJson(text);
  return normalizeGeminiResponse(parsed, fallback);
}

export async function POST(request: Request) {
  const rawPayload = (await request.json().catch(() => ({}))) as IncomingPayload;
  const payload = normalizePayload(rawPayload);
  const fallback = withRelatedPages(buildRuleBasedInsights(payload), "local");

  try {
    const gemini = await generateGeminiInsights(payload, fallback);
    if (gemini) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[Insights] Insights generated with Gemini.");
      }
      return NextResponse.json(withRelatedPages(gemini, "gemini"));
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[Insights] Insights generated locally.");
    }
    return NextResponse.json(fallback);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Insights] Gemini generation failed; using local insights.", error instanceof Error ? error.message : error);
    }
    return NextResponse.json(fallback);
  }
}
