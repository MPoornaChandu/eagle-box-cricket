"use client";

import Link from "next/link";
import { Activity, Clock, Radio } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LeagueShell } from "@/components/league/LeagueShell";
import { LiveScorePanel } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { ballsToOvers } from "@/lib/leagueStorage";

function updatedLabel(dateValue?: string) {
  if (!dateValue) return "Updated just now";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (seconds < 5) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `Updated ${minutes}m ago`;
}

export default function LiveScorePageClient() {
  const { teams, players, matches, liveScoreError, refresh } = useLeagueData();
  const liveMatches = matches.filter((match) => match.status === "live" && match.live);

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-600">
              <Radio className="h-4 w-4" />
              Live score
            </p>
            <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Live Score</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Ball-by-ball scorecards powered by Supabase Realtime with a safe 5-second fallback refresh.
            </p>
          </div>
          <button type="button" onClick={refresh} className="secondary-button px-4 py-2 text-sm font-black">
            Refresh
          </button>
        </div>

        {liveScoreError ? (
          <section className="mt-6 rounded-lg border border-red-300/30 bg-red-500/10 p-4">
            <p className="font-black text-red-200">Oops! We couldn't load this data. Please try again.</p>
            <button type="button" onClick={refresh} className="secondary-button mt-3 px-4 py-2 text-sm font-black">
              Retry
            </button>
          </section>
        ) : null}

        <div className="mt-8 grid gap-6">
          {liveMatches.length ? liveMatches.map((match) => {
            const lastEvent = match.live?.commentary[0];
            return (
              <article key={match.id} className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-200">
                    <Activity className="h-4 w-4" />
                    {match.matchNumber} · {match.live?.runs}/{match.live?.wickets} in {ballsToOvers(match.live?.balls ?? 0)}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <Clock className="h-4 w-4" />
                    {updatedLabel(lastEvent?.createdAt)}
                  </span>
                </div>
                <LiveScorePanel match={match} teams={teams} players={players} />
              </article>
            );
          }) : (
            <EmptyState
              title="No live matches right now. Check back soon."
              description="When the admin starts scoring, live scorecards will appear here automatically."
              action={<Link href="/fixtures" className="secondary-button px-4 py-2 text-sm font-black">View Fixtures</Link>}
            />
          )}
        </div>
      </section>
    </LeagueShell>
  );
}
