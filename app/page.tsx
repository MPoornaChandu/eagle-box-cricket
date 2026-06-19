"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  FileText,
  ListPlus,
  Medal,
  Plus,
  RefreshCw,
  Share2,
  TrendingUp,
  Trophy,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppShell } from "@/components/AppShell";
import { EagleBoxVideoHero } from "@/components/animations/EagleBoxVideoHero";
import { EmptyState } from "@/components/EmptyState";
import { FixtureCard } from "@/components/FixtureCard";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { PointsTableView } from "@/components/PointsTableView";
import { SmartAssistantPanel } from "@/components/SmartAssistantPanel";
import { StatCard } from "@/components/StatCard";
import { TeamPerformanceChart } from "@/components/TeamPerformanceChart";
import { useToast } from "@/components/ToastProvider";
import { useAutomatedInsights } from "@/hooks/useAutomatedInsights";
import { getFixtureResult, isCompletedFixture } from "@/lib/points";
import {
  generateAlerts,
  getActivities,
  getCurrentRole,
  getDashboardStats,
  getFixtures,
  getPointsTable,
  getReports,
  getTeams
} from "@/lib/storage";
import type { ActivityItem, AlertItem, DashboardStats, Fixture, PointsRow, Team } from "@/lib/types";
import { formatDateTime, formatScore, getActiveFixtures, getActiveTeams, getFixtureTitle, isResultStatus } from "@/lib/utils";

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [role, setRole] = useState<"Admin" | "Viewer" | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalFixtures: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    pendingResults: 0,
    leaderTeamName: "No completed matches yet",
    bestNrr: "No NRR yet",
    reportsGenerated: 0,
    alertsCount: 0,
    databaseStatus: "Local demo"
  });
  const [loading, setLoading] = useState(true);
  const {
    insights: automatedInsights,
    loading: insightsLoading,
    generating: insightsGenerating,
    regenerate: regenerateInsights
  } = useAutomatedInsights({ generateOnMount: true, useRemoteOnMount: true });
  const { showToast } = useToast();

  const loadData = async () => {
    const [nextTeams, nextFixtures, nextPoints, nextReports, nextActivities, nextStats] = await Promise.all([
      getTeams(),
      getFixtures(),
      getPointsTable(),
      getReports(),
      getActivities(),
      getDashboardStats()
    ]);
    const activeTeams = getActiveTeams(nextTeams);
    const activeFixtures = getActiveFixtures(nextFixtures, nextTeams);
    const nextAlerts = generateAlerts(activeTeams, activeFixtures, nextReports);
    setTeams(activeTeams);
    setFixtures(activeFixtures);
    setPointsTable(nextPoints);
    setActivities(nextActivities);
    setAlerts(nextAlerts);
    setStats(nextStats);
    setRole(getCurrentRole());
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const upcomingFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => !isResultStatus(fixture.status))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 4),
    [fixtures]
  );

  const recentResults = useMemo(
    () =>
      fixtures
        .filter(isCompletedFixture)
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
        .slice(0, 4),
    [fixtures]
  );

  const handleShareScoreboard = async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const scoreboardUrl = `${baseUrl}/scoreboard`;
    try {
      await navigator.clipboard.writeText(scoreboardUrl);
      showToast({ type: "success", title: "Scoreboard link copied." });
    } catch {
      showToast({ type: "error", title: "Copy failed", description: scoreboardUrl });
    }
  };

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <PageHeader
            title="Cricket Tournament Operations Platform"
            breadcrumb="Dashboard"
            description="Centralized cricket operations platform for fixtures, results, standings, reports, and team performance."
            actions={
              <button type="button" onClick={handleShareScoreboard} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                <Share2 className="h-4 w-4" />
                Share Scoreboard
              </button>
            }
          />

          <section className="glass-panel overflow-hidden rounded-lg p-5 md:p-7">
            <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-200">
                  EAGLE BOX CRICKET
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">
                  Cricket Tournament Operations Platform
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                  Manage teams, schedule fixtures, record results, automate standings, track workflows, and publish live scoreboards from one control room.
                </p>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Quick Actions
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {role === "Admin" ? (
                    <>
                      <Link href="/teams" className="premium-button flex items-center gap-2 px-4 py-3 text-sm">
                        <Plus className="h-4 w-4" />
                        Add Team
                      </Link>
                      <Link href="/fixtures" className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">
                        <CalendarDays className="h-4 w-4" />
                        Create Fixture
                      </Link>
                      <Link href="/workflow" className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">
                        <RefreshCw className="h-4 w-4" />
                        View Workflow
                      </Link>
                      <Link href="/results" className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">
                        <Trophy className="h-4 w-4" />
                        Enter Result
                      </Link>
                    </>
                  ) : null}
                  <Link href="/reports" className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">
                    <BarChart3 className="h-4 w-4" />
                    Generate Report
                  </Link>
                  <Link href="/standings" className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">
                    <Medal className="h-4 w-4" />
                    View Standings
                  </Link>
                  <button type="button" onClick={handleShareScoreboard} className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">
                    <Share2 className="h-4 w-4" />
                    Share Scoreboard
                  </button>
                </div>
              </motion.div>
              <EagleBoxVideoHero />
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Teams" value={stats.totalTeams} icon={<Users className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Total Fixtures" value={stats.totalFixtures} icon={<CalendarDays className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Completed Matches" value={stats.completedMatches} icon={<Trophy className="h-6 w-6" />} accent="gold" />
            <StatCard label="Upcoming Matches" value={stats.upcomingMatches} icon={<ListPlus className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Pending Results" value={stats.pendingResults} icon={<Clock3 className="h-6 w-6" />} accent="red" />
            <StatCard label="Points Table Leader" value={stats.leaderTeamName} icon={<Medal className="h-6 w-6" />} accent="gold" />
            <StatCard label="Best NRR" value={stats.bestNrr} icon={<TrendingUp className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Reports Generated" value={stats.reportsGenerated} icon={<FileText className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Alerts / Reminders" value={stats.alertsCount} icon={<AlertTriangle className="h-6 w-6" />} accent="red" />
            <StatCard label="Database Status" value={stats.databaseStatus} icon={<DatabaseZap className="h-6 w-6" />} accent="gold" />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SmartAssistantPanel
              insights={automatedInsights}
              loading={insightsLoading}
              generating={insightsGenerating}
              onRefresh={regenerateInsights}
              variant="preview"
            />
            <GlassCard className="min-w-0 p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Alerts & Reminders</h2>
                <Link href="/workflow" className="text-sm font-bold text-emerald-200 hover:text-emerald-100">
                  Resolve
                </Link>
              </div>
              <AlertsPanel alerts={alerts} compact />
            </GlassCard>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <GlassCard className="min-w-0 p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Upcoming Fixtures</h2>
                <Link href="/fixtures" className="text-sm font-bold text-emerald-200 hover:text-emerald-100">
                  View all
                </Link>
              </div>
              {upcomingFixtures.length > 0 ? (
                <div className="grid gap-3">
                  {upcomingFixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} teams={teams} compact />
                  ))}
                </div>
              ) : (
                <EmptyState title="No fixtures scheduled yet" description="Create your first fixture." />
              )}
            </GlassCard>

            <GlassCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Latest Completed Matches</h2>
                <Link href="/results" className="text-sm font-bold text-emerald-200 hover:text-emerald-100">
                  Result center
                </Link>
              </div>
              {recentResults.length > 0 ? (
                <div className="grid gap-3">
                  {recentResults.map((fixture) => {
                    const result = getFixtureResult(fixture);
                    return (
                      <div key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-black text-white">{fixture.matchId}: {getFixtureTitle(fixture, teams)}</p>
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
                        </div>
                        {result ? (
                          <p className="mt-2 text-sm text-slate-300">
                            {formatScore(result.teamARuns, result.teamAWickets)} vs {formatScore(result.teamBRuns, result.teamBWickets)} - {result.resultType}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No results yet" description="Submit a match result to trigger standings and workflow alerts." />
              )}
            </GlassCard>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
            <GlassCard className="min-w-0 p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Mini Points Table</h2>
                <Link href="/points-table" className="text-sm font-bold text-emerald-200 hover:text-emerald-100">
                  Full table
                </Link>
              </div>
              {pointsTable.length > 0 ? (
                <PointsTableView pointsTable={pointsTable.slice(0, 4)} teams={teams} compact />
              ) : (
                <EmptyState title="No completed matches yet" description="Enter results to generate standings." />
              )}
            </GlassCard>

            <GlassCard className="min-w-0 p-5" hover={false}>
              <h2 className="mb-4 text-xl font-black text-white">Recent Activity</h2>
              {activities.length > 0 ? (
                <div className="grid gap-3">
                  {activities.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold text-white">{activity.message}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No activity yet" description="Add teams, fixtures, results, or reports to build the timeline." />
              )}
            </GlassCard>
          </section>

          <section className="mt-6">
            <GlassCard className="p-5" hover={false}>
              <h2 className="mb-4 text-xl font-black text-white">Team Performance</h2>
              {pointsTable.length > 0 ? (
                <TeamPerformanceChart pointsTable={pointsTable} teams={teams} />
              ) : (
                <EmptyState title="No chart data" description="Standings will populate the chart after teams are loaded." />
              )}
            </GlassCard>
          </section>

        </>
      )}
    </AppShell>
  );
}
