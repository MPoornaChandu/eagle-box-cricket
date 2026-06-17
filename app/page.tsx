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
  Trophy,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CricketBallAnimation } from "@/components/CricketBallAnimation";
import { EmptyState } from "@/components/EmptyState";
import { FixtureCard } from "@/components/FixtureCard";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { PointsTableView } from "@/components/PointsTableView";
import { SmartAssistantPanel } from "@/components/SmartAssistantPanel";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/components/ToastProvider";
import { getFixtureResult, isCompletedFixture } from "@/lib/points";
import {
  generateAlerts,
  generateSmartSummary,
  getActivities,
  getDashboardStats,
  getFixtures,
  getPointsTable,
  getReports,
  getTeams,
  resetAllData
} from "@/lib/storage";
import type { ActivityItem, AlertItem, DashboardStats, Fixture, PointsRow, SmartSummary, Team } from "@/lib/types";
import { formatDateTime, formatScore, getFixtureTitle, isResultStatus } from "@/lib/utils";

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [summary, setSummary] = useState<SmartSummary | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalFixtures: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    pendingResults: 0,
    leaderTeamName: "No leader yet",
    reportsGenerated: 0,
    alertsCount: 0
  });
  const [resetOpen, setResetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    const nextTeams = getTeams();
    const nextFixtures = getFixtures();
    const nextPoints = getPointsTable();
    const nextReports = getReports();
    setTeams(nextTeams);
    setFixtures(nextFixtures);
    setPointsTable(nextPoints);
    setActivities(getActivities());
    setAlerts(generateAlerts(nextTeams, nextFixtures, nextReports));
    setSummary(generateSmartSummary(nextTeams, nextFixtures, nextPoints, nextReports));
    setStats(getDashboardStats());
  };

  useEffect(() => {
    loadData();
    setLoading(false);
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

  const handleReset = () => {
    resetAllData();
    setResetOpen(false);
    loadData();
    showToast({
      type: "success",
      title: "Demo data reset",
      description: "Six teams, eight fixtures, results, reports, and alerts are ready."
    });
  };

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <PageHeader
            title="Fixture & Points Table Manager"
            breadcrumb="Dashboard"
            description="Eagle Box Cricket operations dashboard for teams, fixtures, results, points, workflow, reports, and smart insights."
            actions={
              <button type="button" onClick={() => setResetOpen(true)} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                <DatabaseZap className="h-4 w-4" />
                Reset Demo Data
              </button>
            }
          />

          <section className="glass-panel overflow-hidden rounded-lg p-5 md:p-7">
            <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-200">
                  Eagle Box Cricket
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">
                  Tournament control room for a 26-working-day internship deliverable.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                  Manage the full cricket operations loop: teams, fixtures, result entry, automatic standings, workflow transitions, reports, alerts, and rule-based AI recommendations.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
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
                    Workflow
                  </Link>
                </div>
              </motion.div>
              <CricketBallAnimation />
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Teams" value={stats.totalTeams} icon={<Users className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Total Fixtures" value={stats.totalFixtures} icon={<CalendarDays className="h-6 w-6" />} accent="cyan" />
            <StatCard label="Completed Matches" value={stats.completedMatches} icon={<Trophy className="h-6 w-6" />} accent="gold" />
            <StatCard label="Upcoming Matches" value={stats.upcomingMatches} icon={<ListPlus className="h-6 w-6" />} accent="cyan" />
            <StatCard label="Pending Results" value={stats.pendingResults} icon={<Clock3 className="h-6 w-6" />} accent="red" />
            <StatCard label="Points Table Leader" value={stats.leaderTeamName} icon={<Medal className="h-6 w-6" />} accent="gold" />
            <StatCard label="Reports Generated" value={stats.reportsGenerated} icon={<FileText className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Alerts / Reminders" value={stats.alertsCount} icon={<AlertTriangle className="h-6 w-6" />} accent="red" />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {summary ? <SmartAssistantPanel summary={summary} onRefresh={loadData} /> : null}
            <GlassCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Alerts & Reminders</h2>
                <Link href="/workflow" className="text-sm font-bold text-cyan-200 hover:text-cyan-100">
                  Resolve
                </Link>
              </div>
              <AlertsPanel alerts={alerts} compact />
            </GlassCard>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <GlassCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Upcoming Fixtures</h2>
                <Link href="/fixtures" className="text-sm font-bold text-cyan-200 hover:text-cyan-100">
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
                <EmptyState title="No upcoming fixtures" description="Create a fixture or reset demo data to fill the schedule." />
              )}
            </GlassCard>

            <GlassCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Latest Completed Matches</h2>
                <Link href="/results" className="text-sm font-bold text-cyan-200 hover:text-cyan-100">
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
            <GlassCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Mini Points Table</h2>
                <Link href="/points-table" className="text-sm font-bold text-cyan-200 hover:text-cyan-100">
                  Full table
                </Link>
              </div>
              {pointsTable.length > 0 ? (
                <PointsTableView pointsTable={pointsTable.slice(0, 4)} teams={teams} compact />
              ) : (
                <EmptyState title="No standings yet" description="Add teams or reset demo data to initialize the table." />
              )}
            </GlassCard>

            <GlassCard className="p-5" hover={false}>
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

          <ConfirmDialog
            open={resetOpen}
            title="Reset demo data?"
            description="This clears current local teams, fixtures, reports, activity, and standings, then reloads the internship-ready Eagle Box Cricket sample data."
            confirmText="Reset"
            onClose={() => setResetOpen(false)}
            onConfirm={handleReset}
          />
        </>
      )}
    </AppShell>
  );
}
