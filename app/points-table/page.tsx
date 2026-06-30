"use client";

import { LeagueShell } from "@/components/league/LeagueShell";
import { PlayoffBracket, PointsTable } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { calculatePlayoffBracket } from "@/lib/leagueStorage";

export default function PointsTablePage() {
  const { teams, pointsTable } = useLeagueData();
  const bracket = calculatePlayoffBracket(pointsTable, teams);

  return (
    <LeagueShell>
      <section className="mx-auto w-full max-w-[80rem] px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Standings</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">EBC Points Table</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Sorted by points, net run rate, and wins. Top four teams qualify.</p>
        <div className="mt-8">
          <PointsTable rows={pointsTable} teams={teams} />
        </div>
        <div className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Playoffs</p>
            <h2 className="mt-2 text-3xl font-black text-white">Dynamic playoff bracket</h2>
          </div>
          <PlayoffBracket fixtures={bracket} />
        </div>
      </section>
    </LeagueShell>
  );
}
