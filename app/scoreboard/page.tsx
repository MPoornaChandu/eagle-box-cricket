"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, ExternalLink, Trophy } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PointsTableView } from "@/components/PointsTableView";
import {
  getFixtures,
  getPointsTable,
  getTeams,
  getTournamentSettings,
  seedDemoDataIfEmpty
} from "@/lib/storage";
import { getFixtureResult, isCompletedFixture } from "@/lib/points";
import type { Fixture, PointsRow, Team, TournamentSettings } from "@/lib/types";
import { formatDate, formatDateTime, formatScore, formatTime, getActiveFixtures, getActiveTeams, getFixtureTitle, isResultStatus } from "@/lib/utils";

export default function ScoreboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      await seedDemoDataIfEmpty();
      const [nextTeams, nextFixtures, nextPoints, nextSettings] = await Promise.all([
        getTeams(),
        getFixtures(),
        getPointsTable(),
        getTournamentSettings()
      ]);
      setTeams(getActiveTeams(nextTeams));
      setFixtures(getActiveFixtures(nextFixtures, nextTeams));
      setPointsTable(nextPoints);
      setSettings(nextSettings);
      setUpdatedAt(new Date().toISOString());
      setLoading(false);
    }
    void loadData();
  }, []);

  const upcomingFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => !isResultStatus(fixture.status))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 6),
    [fixtures]
  );

  const recentResults = useMemo(
    () =>
      fixtures
        .filter(isCompletedFixture)
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
        .slice(0, 6),
    [fixtures]
  );

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">Public Scoreboard</p>
            <h1 className="mt-2 text-4xl font-black text-white">{settings?.tournamentName ?? "Eagle Box Cricket"}</h1>
            <p className="mt-2 text-sm text-slate-300">
              Last updated {updatedAt ? formatDateTime(updatedAt) : "loading"}
            </p>
          </div>
          <Link href="/login" className="secondary-button inline-flex items-center gap-2 px-4 py-3 text-sm font-black">
            Admin Login
            <ExternalLink className="h-4 w-4" />
          </Link>
        </header>

        {loading ? (
          <LoadingSkeleton label="Loading public scoreboard" />
        ) : (
          <div className="grid gap-6">
            <section className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">
                <Trophy className="h-5 w-5 text-amber-200" />
                Live Points Table
              </h2>
              {pointsTable.length > 0 ? (
                <PointsTableView pointsTable={pointsTable} teams={teams} compact />
              ) : (
                <EmptyState title="No standings" description="Standings appear after teams are available." />
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel rounded-lg p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">
                  <CalendarDays className="h-5 w-5 text-emerald-200" />
                  Upcoming Fixtures
                </h2>
                {upcomingFixtures.length > 0 ? (
                  <div className="grid gap-3">
                    {upcomingFixtures.map((fixture) => (
                      <article key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                        <p className="font-black text-white">{fixture.matchId}: {getFixtureTitle(fixture, teams)}</p>
                        <p className="mt-2 text-sm text-slate-300">{formatDate(fixture.date)} at {formatTime(fixture.time)}</p>
                        <p className="mt-1 text-sm text-slate-300">{fixture.venue} - {fixture.status}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No upcoming fixtures" description="Upcoming matches will appear here." />
                )}
              </div>

              <div className="glass-panel rounded-lg p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">
                  <Clock3 className="h-5 w-5 text-amber-200" />
                  Recent Results
                </h2>
                {recentResults.length > 0 ? (
                  <div className="grid gap-3">
                    {recentResults.map((fixture) => {
                      const result = getFixtureResult(fixture);
                      return (
                        <article key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                          <p className="font-black text-white">{fixture.matchId}: {getFixtureTitle(fixture, teams)}</p>
                          {result ? (
                            <p className="mt-2 text-sm text-emerald-100">
                              {formatScore(result.teamARuns, result.teamAWickets)} vs {formatScore(result.teamBRuns, result.teamBWickets)} - {result.resultType}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No recent results" description="Completed results will appear here." />
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
