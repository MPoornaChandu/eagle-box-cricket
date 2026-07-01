"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LeagueShell } from "@/components/league/LeagueShell";
import { MatchCard } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { getTeam } from "@/lib/leagueStorage";

export default function FixturesPage() {
  const { teams, matches } = useLeagueData();
  const [statusFilter, setStatusFilter] = useState<"All" | "Live" | "Upcoming" | "Completed">("All");
  const [query, setQuery] = useState("");
  const fixtures = useMemo(
    () => matches
      .filter((match) => statusFilter === "All" || match.status === statusFilter.toLowerCase())
      .filter((match) => {
        const value = query.trim().toLowerCase();
        if (!value) return true;
        const teamA = getTeam(match.teamAId, teams);
        const teamB = getTeam(match.teamBId, teams);
        return [teamA?.name, teamA?.shortCode, teamB?.name, teamB?.shortCode, match.matchNumber, match.venue]
          .filter(Boolean)
          .some((item) => item!.toLowerCase().includes(value));
      })
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [matches, query, statusFilter, teams]
  );

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Fixtures</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Fixtures</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Match schedule with live, upcoming and completed fixtures.</p>
        <div className="premium-search-panel mt-6 grid gap-3 rounded-lg p-4 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by team, match, or venue" className="pl-10" />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["All", "Live", "Upcoming", "Completed"] as const).map((option) => (
              <button key={option} type="button" onClick={() => setStatusFilter(option)} className={`secondary-button px-4 py-2 text-sm font-black ${statusFilter === option ? "border-emerald-300/60 bg-emerald-400/14 text-emerald-100" : ""}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {fixtures.length ? fixtures.map((match) => <MatchCard key={match.id} match={match} teams={teams} />) : (
            <div className="sport-card rounded-lg border border-white/10 bg-white/[0.055] p-5 text-sm font-bold text-slate-300 lg:col-span-3">
              No fixtures match those filters.
            </div>
          )}
        </div>
      </section>
    </LeagueShell>
  );
}
