"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  DatabaseZap,
  ListPlus,
  Medal,
  Plus,
  RefreshCw,
  Trophy,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { CricketBallAnimation } from "@/components/CricketBallAnimation";
import { EmptyState } from "@/components/EmptyState";
import { FixtureCard } from "@/components/FixtureCard";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { PointsTableView } from "@/components/PointsTableView";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/components/ToastProvider";
import {
  getDashboardStats,
  getFixtures,
  getPointsTable,
  getTeams,
  seedDemoData
} from "@/lib/storage";
import type { DashboardStats, Fixture, PointsRow, Team } from "@/lib/types";
import { formatScore, getFixtureTitle } from "@/lib/utils";

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalFixtures: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    leaderTeamName: "No leader yet"
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    const nextTeams = getTeams();
    const nextFixtures = getFixtures();
    setTeams(nextTeams);
    setFixtures(nextFixtures);
    setPointsTable(getPointsTable());
    setStats(getDashboardStats());
  };

  useEffect(() => {
    loadData();
    setLoading(false);
  }, []);

  const upcomingFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status === "upcoming")
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 3),
    [fixtures]
  );

  const recentResults = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status === "completed")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
        .slice(0, 3),
    [fixtures]
  );

  const handleSeed = () => {
    seedDemoData();
    loadData();
    showToast({
      type: "success",
      title: "Demo data loaded",
      description: "Four teams and three fixtures are ready."
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
            description="Eagle Box Cricket - Manage teams, schedule fixtures, update results, and auto-generate points table."
            actions={
              <button
                type="button"
                data-testid="seed-demo-data"
                onClick={handleSeed}
                className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black"
              >
                <DatabaseZap className="h-4 w-4" />
                Seed Demo Data
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
                  Tournament control room for fast cricket nights.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                  Track teams, fixtures, match results, simplified NRR, standings, and report
                  exports from one local-first dashboard.
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
                  <Link href="/results" className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">
                    <RefreshCw className="h-4 w-4" />
                    Update Result
                  </Link>
                </div>
              </motion.div>
              <CricketBallAnimation />
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Teams" value={stats.totalTeams} icon={<Users className="h-6 w-6" />} accent="emerald" />
            <StatCard label="Total Fixtures" value={stats.totalFixtures} icon={<CalendarDays className="h-6 w-6" />} accent="cyan" />
            <StatCard label="Upcoming Matches" value={stats.upcomingMatches} icon={<ListPlus className="h-6 w-6" />} accent="cyan" />
            <StatCard label="Completed Matches" value={stats.completedMatches} icon={<Trophy className="h-6 w-6" />} accent="gold" />
            <StatCard label="Current Leader" value={stats.leaderTeamName} icon={<Medal className="h-6 w-6" />} accent="gold" />
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
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      teams={teams}
                      onDelete={() => undefined}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming fixtures"
                  description="Seed demo data or create a new fixture to fill the schedule."
                />
              )}
            </GlassCard>

            <GlassCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Recent Results</h2>
                <Link href="/results" className="text-sm font-bold text-cyan-200 hover:text-cyan-100">
                  Update
                </Link>
              </div>
              {recentResults.length > 0 ? (
                <div className="grid gap-3">
                  {recentResults.map((fixture) => (
                    <div key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="font-black text-white">{getFixtureTitle(fixture, teams)}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {formatScore(fixture.teamAScore, fixture.teamAWickets)} vs{" "}
                        {formatScore(fixture.teamBScore, fixture.teamBWickets)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No results yet"
                  description="Submit a match result to trigger celebrations and standings."
                />
              )}
            </GlassCard>
          </section>

          <section className="mt-6">
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
                <EmptyState
                  title="No standings yet"
                  description="Add teams or seed demo data to initialize the table."
                />
              )}
            </GlassCard>
          </section>
        </>
      )}
    </AppShell>
  );
}
