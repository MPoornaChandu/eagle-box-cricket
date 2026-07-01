"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Clock, Radio, RefreshCw, Share2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LeagueShell } from "@/components/league/LeagueShell";
import { LiveScorePanel } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { ballsToOvers } from "@/lib/leagueStorage";

function updatedLabel(dateValue?: string, live = false) {
  if (live) return "LIVE NOW";
  if (!dateValue) return "Last updated earlier";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (seconds < 5) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "Updated 1 min ago";
  if (minutes <= 15) return `Updated ${minutes} mins ago`;
  return "Last updated earlier";
}

export default function LiveScorePageClient() {
  const { teams, players, matches, liveScoreError, refresh } = useLeagueData();
  const [refreshing, setRefreshing] = useState(false);
  const liveMatches = matches.filter((match) => match.status === "live" && match.live);
  const primaryLiveMatch = liveMatches[0];
  const refreshNow = () => {
    setRefreshing(true);
    refresh();
    window.setTimeout(() => setRefreshing(false), 650);
  };
  const shareScore = async () => {
    if (!primaryLiveMatch?.live) return;
    const text = `${primaryLiveMatch.matchNumber}: ${primaryLiveMatch.live.runs}/${primaryLiveMatch.live.wickets} (${ballsToOvers(primaryLiveMatch.live.balls)} ov) - Eagle Box Cricket`;
    if (navigator.share) {
      await navigator.share({ title: "Eagle Box Live Score", text, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(`${text} ${window.location.href}`);
  };

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
              Live ball-by-ball updates from the match.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refreshNow} className="secondary-button inline-flex items-center gap-2 px-4 py-2 text-sm font-black">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {primaryLiveMatch ? (
              <button type="button" onClick={shareScore} className="secondary-button inline-flex items-center gap-2 px-4 py-2 text-sm font-black">
                <Share2 className="h-4 w-4" />
                Share Score
              </button>
            ) : null}
          </div>
        </div>

        {liveScoreError ? (
          <section className="mt-6 rounded-lg border border-red-300/30 bg-red-500/10 p-4">
            <p className="font-black text-red-200">Oops! We couldn't load this data. Please try again.</p>
            <button type="button" onClick={refreshNow} className="secondary-button mt-3 px-4 py-2 text-sm font-black">
              Retry
            </button>
          </section>
        ) : null}

        <div className="mt-8 grid gap-6">
          {liveMatches.length ? liveMatches.map((match) => {
            const lastEvent = match.live?.commentary[0];
            return (
              <article key={match.id} className="grid gap-4">
                <div className="broadcast-card flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-200">
                    <Activity className="h-4 w-4" />
                    {match.matchNumber} - {match.live?.runs}/{match.live?.wickets} ({ballsToOvers(match.live?.balls ?? 0)} ov)
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <Clock className="h-4 w-4" />
                    {updatedLabel(lastEvent?.createdAt, match.status === "live")}
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
