"use client";

import Link from "next/link";
import { LeagueShell } from "@/components/league/LeagueShell";
import { TeamBadge } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { playersForTeam } from "@/lib/leagueStorage";

export default function TeamsPage() {
  const { teams, players, pointsTable } = useLeagueData();

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Franchises</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Teams</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const squad = playersForTeam(team.id, players);
            const row = pointsTable.find((item) => item.teamId === team.id);
            return (
              <Link key={team.id} href={`/teams/${team.id}`} className="broadcast-card sport-card rounded-lg border-l-4 p-5 transition hover:-translate-y-1 hover:border-emerald-300/35" style={{ borderLeftColor: team.primaryColor }}>
                <div className="flex items-center gap-3">
                  <TeamBadge team={team} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black text-white">{team.name}</h2>
                    <p className="text-sm font-bold text-slate-400">{team.shortCode}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-300">Captain {team.captain}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <span className="metric-card rounded-lg p-3"><span className="block text-lg font-black text-white">{team.wins}</span><span className="text-xs text-slate-400">W</span></span>
                  <span className="metric-card rounded-lg p-3"><span className="block text-lg font-black text-white">{row?.lost ?? Math.max(team.matches - team.wins, 0)}</span><span className="text-xs text-slate-400">L</span></span>
                  <span className="metric-card rounded-lg p-3"><span className="block text-lg font-black text-white">{row?.nrr.toFixed(3) ?? "0.000"}</span><span className="text-xs text-slate-400">NRR</span></span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-400">{squad.length} squad players</span>
                  <span className="secondary-button inline-flex px-4 py-2 text-sm font-black">View Squad</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </LeagueShell>
  );
}
