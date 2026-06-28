"use client";

import Link from "next/link";
import { LeagueShell } from "@/components/league/LeagueShell";
import { StatusBadge, TeamBadge } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { getPlayer, getTeam } from "@/lib/leagueStorage";

export default function PublicResultsPage() {
  const { teams, players, matches } = useLeagueData();
  const completed = matches
    .filter((match) => match.status === "completed")
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Results</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Match Results</h1>
        <div className="mt-8 grid gap-4">
          {completed.map((match) => {
            const teamA = getTeam(match.teamAId, teams);
            const teamB = getTeam(match.teamBId, teams);
            const winner = match.result?.winnerTeamId ? getTeam(match.result.winnerTeamId, teams)?.name : match.result?.resultType === "no-result" ? "No result" : "Tie";
            return (
              <Link key={match.id} href={`/matches/${match.id}`} className="sport-card rounded-lg border border-white/70 bg-white/85 p-5 transition hover:-translate-y-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge status={match.status} />
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{new Date(match.dateTime).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className="flex items-center gap-3"><TeamBadge team={teamA} /><div><p className="font-black text-white">{teamA?.name}</p><p className="text-sm text-slate-400">{match.result?.teamAScore ?? "-"}</p></div></div>
                  <span className="text-center text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Result</span>
                  <div className="flex items-center gap-3 md:justify-end"><div className="md:text-right"><p className="font-black text-white">{teamB?.name}</p><p className="text-sm text-slate-400">{match.result?.teamBScore ?? "-"}</p></div><TeamBadge team={teamB} /></div>
                </div>
                <p className="mt-4 text-sm font-black text-emerald-800">Outcome: {winner}</p>
                {match.result?.playerOfMatch ? <p className="mt-1 text-sm text-slate-400">Player of the Match: {getPlayer(match.result.playerOfMatch, players)?.name ?? "TBA"}</p> : null}
              </Link>
            );
          })}
        </div>
      </section>
    </LeagueShell>
  );
}
