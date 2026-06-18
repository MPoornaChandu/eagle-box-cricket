"use client";

import { useEffect, useState } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import { SmartAssistantPanel } from "@/components/SmartAssistantPanel";
import {
  generateAlerts,
  generateSmartSummary,
  getFixtures,
  getMatchResults,
  getPointsTable,
  getReports,
  getTeams
} from "@/lib/storage";
import type { AlertItem, SmartSummary } from "@/lib/types";

function isSmartSummary(value: unknown): value is SmartSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as SmartSummary;
  return (
    (summary.mode === "gemini" || summary.mode === "rule-based") &&
    typeof summary.summary === "string" &&
    Array.isArray(summary.insights) &&
    Array.isArray(summary.recommendedActions) &&
    Array.isArray(summary.risks) &&
    typeof summary.generatedAt === "string"
  );
}

export default function SmartAssistantPage() {
  const [summary, setSummary] = useState<SmartSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    let localFallbackReady = false;
    try {
      const teams = getTeams();
      const fixtures = getFixtures();
      const pointsTable = getPointsTable();
      const reports = getReports();
      const results = getMatchResults();
      const nextAlerts = generateAlerts(teams, fixtures, reports);
      const localSummary = generateSmartSummary(teams, fixtures, pointsTable, reports);
      setSummary(localSummary);
      setAlerts(nextAlerts);
      localFallbackReady = true;

      const response = await fetch("/api/smart-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams,
          fixtures,
          results,
          pointsTable,
          alerts: nextAlerts,
          reports,
          localSummary
        })
      });
      if (!response.ok) throw new Error("Smart summary route failed.");
      const data = await response.json();
      if (isSmartSummary(data)) {
        setSummary(data);
      }
    } catch {
      if (!localFallbackReady) {
        setError("The assistant could not load tournament data or generate a fallback summary.");
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Smart Assistant"
        breadcrumb="Dashboard / Smart Assistant"
        description="Gemini-powered cricket operations insights with a rule-based fallback that keeps demos stable."
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SmartAssistantPanel
          summary={summary}
          loading={loading}
          error={error}
          onRefresh={() => void loadData()}
        />
        <GlassCard className="p-5" hover={false}>
          <h2 className="mb-4 text-xl font-black text-white">Action Queue</h2>
          <AlertsPanel alerts={alerts} />
        </GlassCard>
      </section>
    </AppShell>
  );
}
