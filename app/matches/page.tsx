"use client";

import { useMemo, useState } from "react";
import { LeagueShell } from "@/components/league/LeagueShell";
import { MatchCard } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import type { MatchStatus } from "@/lib/leagueTypes";
import { cn } from "@/lib/utils";

const filters: Array<"all" | MatchStatus> = ["all", "live", "upcoming", "completed"];

export default function MatchesPage() {
  const { teams, matches } = useLeagueData();
  const [filter, setFilter] = useState<"all" | MatchStatus>("all");

  const filtered = useMemo(
    () =>
      matches
        .filter((match) => filter === "all" || match.status === filter)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [filter, matches]
  );

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Fixtures</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Matches</h1>
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn("secondary-button shrink-0 px-4 py-2 text-sm font-black capitalize", filter === item && "border-emerald-300/45 bg-emerald-300/14")}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {filtered.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
        </div>
      </section>
    </LeagueShell>
  );
}
