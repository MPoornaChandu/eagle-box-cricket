"use client";

import { useMemo } from "react";
import { LeagueShell } from "@/components/league/LeagueShell";
import { MatchCard } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";

export default function FixturesPage() {
  const { teams, matches } = useLeagueData();
  const fixtures = useMemo(
    () => matches.filter((match) => match.status !== "completed").sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [matches]
  );

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Fixtures</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Upcoming Fixtures</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Public match schedule with live and upcoming fixtures only. Admin controls stay inside /admin.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {fixtures.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
        </div>
      </section>
    </LeagueShell>
  );
}
