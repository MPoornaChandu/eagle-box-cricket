"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { LeagueShell } from "@/components/league/LeagueShell";
import { resultMargin, resultOutcome, StatusBadge, TeamBadge } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { getPlayer, getTeam } from "@/lib/leagueStorage";

export default function PublicResultsPage() {
  const { teams, players, matches } = useLeagueData();
  const [teamFilter, setTeamFilter] = useState("All");
  const completed = useMemo(
    () => matches
      .filter((match) => match.status === "completed")
      .filter((match) => teamFilter === "All" || match.teamAId === teamFilter || match.teamBId === teamFilter)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    [matches, teamFilter]
  );

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Results</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Match Results</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setTeamFilter("All")} className={`secondary-button px-4 py-2 text-sm font-black ${teamFilter === "All" ? "border-emerald-300/45 bg-emerald-300/14" : ""}`}>
            All Results
          </button>
          {teams.map((team) => (
            <button key={team.id} type="button" onClick={() => setTeamFilter(team.id)} className={`secondary-button px-4 py-2 text-sm font-black ${teamFilter === team.id ? "border-emerald-300/45 bg-emerald-300/14" : ""}`}>
              {team.shortCode}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4">
          {completed.length ? completed.map((match) => {
            const teamA = getTeam(match.teamAId, teams);
            const teamB = getTeam(match.teamBId, teams);
            const winnerTeamId = match.result?.winnerTeamId;
            return (
              <Link key={match.id} href={`/matches/${match.id}`} className="broadcast-card sport-card rounded-lg p-5 transition hover:-translate-y-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge status={match.status} />
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{new Date(match.dateTime).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className={`flex items-center gap-3 rounded-lg p-3 ${winnerTeamId === teamA?.id ? "bg-emerald-400/10" : ""}`}><TeamBadge team={teamA} /><div><p className="font-black text-white">{teamA?.name}</p><p className="text-sm text-slate-400">{match.result?.teamAScore ?? "-"}</p></div></div>
                  <span className="rounded-lg border border-emerald-300/16 bg-emerald-400/10 px-4 py-3 text-center text-sm font-black text-emerald-200">{resultOutcome(match, teams)}</span>
                  <div className={`flex items-center gap-3 rounded-lg p-3 md:justify-end ${winnerTeamId === teamB?.id ? "bg-emerald-400/10" : ""}`}><div className="md:text-right"><p className="font-black text-white">{teamB?.name}</p><p className="text-sm text-slate-400">{match.result?.teamBScore ?? "-"}</p></div><TeamBadge team={teamB} /></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-emerald-800">{resultMargin(match) || resultOutcome(match, teams)}</p>
                  <span className="secondary-button px-4 py-2 text-sm font-black">View Match Center</span>
                </div>
                {match.result?.playerOfMatch ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-400"><Trophy className="h-4 w-4 text-amber-200" />Player of the Match: <span className="font-black text-white">{getPlayer(match.result.playerOfMatch, players)?.name ?? "TBA"}</span></p> : null}
              </Link>
            );
          }) : (
            <div className="sport-card rounded-lg border border-white/10 bg-white/[0.055] p-5 text-sm font-bold text-slate-300">
              No completed results match this filter.
            </div>
          )}
        </div>
      </section>
    </LeagueShell>
  );
}
