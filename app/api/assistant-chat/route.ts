import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { answerLocalQuestion } from "@/lib/insights/localAssistant";
import type {
  AlertItem,
  AssistantChatAction,
  AssistantChatMessage,
  AssistantChatResponse,
  AutomatedInsightsPayload,
  Fixture,
  MatchResult,
  PointsRow,
  ReportLog,
  Team,
  TournamentSettings
} from "@/lib/types";

export const runtime = "nodejs";

type AssistantData = AutomatedInsightsPayload & {
  todayKey?: string;
};

interface ChatRequestBody {
  message?: string;
  history?: AssistantChatMessage[];
  data?: Partial<AssistantData> & {
    pointsTable?: PointsRow[];
  };
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeData(value: ChatRequestBody["data"]): AssistantData {
  return {
    teams: asArray<Team>(value?.teams),
    fixtures: asArray<Fixture>(value?.fixtures),
    results: asArray<MatchResult & { fixtureId?: string }>(value?.results),
    standings: asArray<PointsRow>(value?.standings ?? value?.pointsTable),
    reports: asArray<ReportLog>(value?.reports),
    alerts: asArray<AlertItem>(value?.alerts),
    settings: value?.settings as Partial<TournamentSettings> | undefined,
    todayKey: typeof value?.todayKey === "string" ? value.todayKey : undefined
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

function normalizeAction(value: unknown): AssistantChatAction | null {
  if (!value || typeof value !== "object") return null;
  const action = value as Record<string, unknown>;
  const label = cleanText(action.label);
  const href = cleanText(action.href);
  if (!label || !href.startsWith("/")) return null;
  return { label, href };
}

function normalizeGeminiChat(value: unknown, fallback: AssistantChatResponse): AssistantChatResponse {
  if (!value || typeof value !== "object") return fallback;
  const objectValue = value as Record<string, unknown>;
  const answer = cleanText(objectValue.answer) || fallback.answer;
  const relatedPage = cleanText(objectValue.relatedPage);
  const suggestedActions = asArray<unknown>(objectValue.suggestedActions)
    .map(normalizeAction)
    .filter((item): item is AssistantChatAction => Boolean(item));

  return {
    mode: "gemini",
    answer,
    relatedPage: relatedPage.startsWith("/") ? relatedPage : fallback.relatedPage,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions.slice(0, 3) : fallback.suggestedActions
  };
}

async function answerWithGemini(
  message: string,
  history: AssistantChatMessage[],
  data: AssistantData,
  fallback: AssistantChatResponse
): Promise<AssistantChatResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction:
      "You are Eagle Box Cricket's tournament assistant. Answer the user's question using only the provided tournament data. If data is missing, say what is missing and suggest the next admin action. Keep answers concise and practical. Do not hallucinate."
  });

  const prompt = [
    "Return JSON only with this exact shape:",
    '{"answer":"clear assistant answer","relatedPage":"/fixtures","suggestedActions":[{"label":"Open Fixtures","href":"/fixtures"}]}.',
    "Use only these relatedPage/href routes when useful: /results, /fixtures, /standings, /reports, /workflow, /scoreboard, /teams, /settings, /smart-assistant.",
    "Do not invent teams, fixtures, results, scores, reports, or standings.",
    "If asked about today, compare fixture date keys to data.todayKey when provided.",
    `User message: ${message}`,
    `Recent chat history: ${JSON.stringify(history.slice(-8))}`,
    `Tournament data: ${JSON.stringify(data)}`
  ].join("\n");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 650,
      responseMimeType: "application/json"
    }
  });

  const parsed = extractJson(result.response.text());
  return normalizeGeminiChat(parsed, fallback);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
  const message = cleanText(body.message);
  const history = asArray<AssistantChatMessage>(body.history).filter(
    (item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string"
  );
  const data = normalizeData(body.data);
  const fallback = answerLocalQuestion(message, data);

  if (!message) {
    return NextResponse.json({
      ...fallback,
      answer: "Ask me about today's matches, standings leaders, pending results, reports, or next actions."
    } satisfies AssistantChatResponse);
  }

  try {
    const gemini = await answerWithGemini(message, history, data, fallback);
    if (gemini) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[Assistant Chat] Answer generated with Gemini.");
      }
      return NextResponse.json(gemini);
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[Assistant Chat] Answer generated locally.");
    }
    return NextResponse.json(fallback);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Assistant Chat] Gemini answer failed; using local assistant.", error instanceof Error ? error.message : error);
    }
    return NextResponse.json(fallback);
  }
}
