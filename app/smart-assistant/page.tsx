"use client";

import { useEffect, useState } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { SmartAssistantPanel } from "@/components/SmartAssistantPanel";
import {
  generateAlerts,
  generateSmartSummary,
  getFixtures,
  getPointsTable,
  getReports,
  getTeams
} from "@/lib/storage";
import type { AlertItem, SmartSummary } from "@/lib/types";

export default function SmartAssistantPage() {
  const [summary, setSummary] = useState<SmartSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const teams = getTeams();
    const fixtures = getFixtures();
    const pointsTable = getPointsTable();
    const reports = getReports();
    setSummary(generateSmartSummary(teams, fixtures, pointsTable, reports));
    setAlerts(generateAlerts(teams, fixtures, reports));
  };

  useEffect(() => {
    loadData();
    setLoading(false);
  }, []);

  return (
    <AppShell>
      {loading || !summary ? (
        <LoadingSkeleton label="Loading smart assistant" />
      ) : (
        <>
          <PageHeader
            title="Smart Assistant"
            breadcrumb="Dashboard / Smart Assistant"
            description="Rule-based AI-style tournament insights with safe local fallback and no required API key."
          />

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SmartAssistantPanel summary={summary} onRefresh={loadData} />
            <GlassCard className="p-5" hover={false}>
              <h2 className="mb-4 text-xl font-black text-white">Action Queue</h2>
              <AlertsPanel alerts={alerts} />
            </GlassCard>
          </section>
        </>
      )}
    </AppShell>
  );
}
