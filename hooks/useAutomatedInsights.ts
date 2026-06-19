"use client";

import { useCallback, useEffect, useState } from "react";
import { buildRuleBasedInsights } from "@/lib/insights/ruleBasedInsights";
import {
  generateAlerts,
  getFixtures,
  getMatchResults,
  getPointsTable,
  getReports,
  getTeams,
  getTournamentSettings
} from "@/lib/storage";
import type {
  AutomatedInsightsPayload,
  AutomatedInsightsResponse,
  Fixture,
  MatchResult,
  PointsRow,
  ReportLog,
  Team
} from "@/lib/types";
import { getActiveFixtures, getActiveTeams, getTodayKey } from "@/lib/utils";

const CACHE_KEY = "ebc_automated_insights_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedInsights {
  expiresAt: number;
  fingerprint: string;
  insights: AutomatedInsightsResponse;
}

interface UseAutomatedInsightsOptions {
  generateOnMount?: boolean;
  useRemoteOnMount?: boolean;
}

function isAutomatedInsights(value: unknown): value is AutomatedInsightsResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AutomatedInsightsResponse;
  return (
    (candidate.mode === "gemini" || candidate.mode === "local" || candidate.mode === "fallback") &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.insights) &&
    Array.isArray(candidate.recommendedActions) &&
    Array.isArray(candidate.risks) &&
    typeof candidate.generatedAt === "string"
  );
}

function readCache(fingerprint: string): AutomatedInsightsResponse | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedInsights;
    if (parsed.fingerprint !== fingerprint || parsed.expiresAt < Date.now()) return null;
    return isAutomatedInsights(parsed.insights) ? parsed.insights : null;
  } catch {
    return null;
  }
}

function writeCache(fingerprint: string, insights: AutomatedInsightsResponse): void {
  if (typeof window === "undefined") return;
  const cached: CachedInsights = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    fingerprint,
    insights
  };
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
}

function buildFingerprint(
  teams: Team[],
  fixtures: Fixture[],
  standings: PointsRow[],
  reports: ReportLog[],
  results: Array<MatchResult & { fixtureId?: string }>
): string {
  return JSON.stringify({
    teams: teams.map((team) => [team.id, team.status, team.name]),
    fixtures: fixtures.map((fixture) => [
      fixture.id,
      fixture.status,
      fixture.date,
      fixture.time,
      fixture.completedAt,
      fixture.pointsUpdatedAt,
      fixture.reportGeneratedAt,
      fixture.result?.submittedAt
    ]),
    standings: standings.map((row) => [row.teamId, row.played, row.points, row.netRunRate, row.lastUpdated]),
    reports: reports.map((report) => [report.id, report.generatedAt]),
    results: results.map((result) => [result.fixtureId, result.submittedAt, result.resultType])
  });
}

type AssistantPayload = AutomatedInsightsPayload & {
  todayKey: string;
};

async function loadPayload(): Promise<{ payload: AssistantPayload; fingerprint: string }> {
  const [teams, fixtures, standings, reports, results, settings] = await Promise.all([
    getTeams(),
    getFixtures(),
    getPointsTable(),
    getReports(),
    getMatchResults(),
    getTournamentSettings()
  ]);
  const activeTeams = getActiveTeams(teams);
  const activeFixtures = getActiveFixtures(fixtures, teams);
  const activeTeamIds = new Set(activeTeams.map((team) => team.id));
  const activeFixtureIds = new Set(activeFixtures.map((fixture) => fixture.id));
  const activeStandings = standings.filter((row) => activeTeamIds.has(row.teamId));
  const activeResults = results.filter((result) => result.fixtureId && activeFixtureIds.has(result.fixtureId));
  const alerts = generateAlerts(activeTeams, activeFixtures, reports);
  const payload: AssistantPayload = {
    teams: activeTeams,
    fixtures: activeFixtures,
    results: activeResults,
    standings: activeStandings,
    reports,
    alerts,
    settings,
    todayKey: getTodayKey()
  };

  return {
    payload,
    fingerprint: buildFingerprint(activeTeams, activeFixtures, activeStandings, reports, activeResults)
  };
}

export function useAutomatedInsights(options: UseAutomatedInsightsOptions = {}) {
  const { generateOnMount = true, useRemoteOnMount = true } = options;
  const [insights, setInsights] = useState<AutomatedInsightsResponse | null>(null);
  const [loading, setLoading] = useState(generateOnMount);
  const [generating, setGenerating] = useState(false);
  const [lastPayload, setLastPayload] = useState<AssistantPayload | null>(null);

  const generate = useCallback(
    async ({ forceRemote = false }: { forceRemote?: boolean } = {}) => {
      setLoading(true);
      const { payload, fingerprint } = await loadPayload();
      setLastPayload(payload);

      const localInsights = buildRuleBasedInsights(payload);
      const cached = readCache(fingerprint);

      if (cached && !forceRemote) {
        setInsights(cached);
        setLoading(false);
        return cached;
      }

      setInsights((current) => current ?? localInsights);

      if (!useRemoteOnMount && !forceRemote) {
        setLoading(false);
        writeCache(fingerprint, localInsights);
        return localInsights;
      }

      setGenerating(true);
      try {
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = response.ok ? await response.json() : null;
        const nextInsights = isAutomatedInsights(data) ? data : localInsights;
        setInsights(nextInsights);
        writeCache(fingerprint, nextInsights);
        return nextInsights;
      } catch {
        setInsights(localInsights);
        writeCache(fingerprint, localInsights);
        return localInsights;
      } finally {
        setGenerating(false);
        setLoading(false);
      }
    },
    [useRemoteOnMount]
  );

  useEffect(() => {
    if (!generateOnMount) return;
    void generate();
  }, [generate, generateOnMount]);

  return {
    insights,
    loading,
    generating,
    payload: lastPayload,
    regenerate: () => generate({ forceRemote: true }),
    refresh: () => generate()
  };
}
