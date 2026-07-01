"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { CalendarDays, ChevronRight, Clock, Radio, Sparkles, Trophy } from "lucide-react";
import { LeagueShell } from "@/components/league/LeagueShell";
import { LiveScorePanel, MatchCard, PlayerCard, PointsTable, TeamBadge } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import type { Player } from "@/lib/leagueTypes";
import {
  getTeam,
  isAdminSessionActive,
  topPlayers
} from "@/lib/leagueStorage";

export default function HomePage() {
  const router = useRouter();
  const { teams, players, matches, pointsTable, liveMatch } = useLeagueData();
  const [viewerName, setViewerName] = useState("");

  useEffect(() => {
    let active = true;

    async function checkEntry() {
      const hasViewerSession = Boolean(window.localStorage.getItem("viewerSession"));
      const rawSession = window.localStorage.getItem("viewerSession");
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession) as { nameOrEmail?: string };
          setViewerName(session.nameOrEmail?.split("@")[0] ?? "");
        } catch {
          setViewerName("");
        }
      }
      const hasAdminSession = await isAdminSessionActive();
      if (active && !hasViewerSession && !hasAdminSession) router.replace("/");
    }

    void checkEntry();

    return () => {
      active = false;
    };
  }, [router]);

  const recentMatches = useMemo(
    () => matches.filter((match) => match.status === "completed").slice(0, 3),
    [matches]
  );
  const upcomingMatches = useMemo(
    () => matches.filter((match) => match.status === "upcoming").slice(0, 3),
    [matches]
  );
  const nextMatch = upcomingMatches[0];
  const nextMatchLabel = nextMatch
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.ceil((new Date(nextMatch.dateTime).getTime() - Date.now()) / 86400000),
        "day"
      )
    : "";
  const leaders = useMemo(() => topPlayers(players), [players]);
  const leaderCards = [leaders.runs, leaders.wickets, leaders.strikeRate, leaders.economy]
    .filter(Boolean)
    .filter((player, index, arr) => arr.findIndex(p => p?.id === player?.id) === index) as Player[];

  return (
    <LeagueShell>
      <section className="home-hero stadium-hero relative overflow-hidden">
        <HeroBackgroundVideo />
        <div className="home-hero-inner relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 xl:gap-12">
            <motion.div className="order-2 min-w-0 lg:order-1" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <div className="flex flex-wrap gap-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                {viewerName ? `Welcome, ${viewerName}` : "Match night is on"}
              </p>
              <p className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-200">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                {liveMatch ? "Live now" : "Live ready"}
              </p>
              </div>
              <h1 className="hero-title mt-7 max-w-4xl text-5xl font-black leading-[1.02] text-slate-950 dark:text-white md:text-7xl">
                Eagle Box Cricket League
              </h1>
              <p className="hero-subtitle mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
                Live scores, match updates, teams, players and tournament standings.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/live-score" className="premium-button inline-flex items-center justify-center gap-2 px-5 py-3 text-sm">
                  <Radio className="h-4 w-4" />
                  View Live Score
                </Link>
                <Link href="/fixtures" className="secondary-button inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black">
                  <CalendarDays className="h-4 w-4" />
                  View Matches
                </Link>
              </div>
              {nextMatch ? (
                <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-lg border border-white/15 bg-slate-950/38 px-4 py-3 text-sm font-bold text-slate-200 backdrop-blur">
                  <Clock className="h-4 w-4 text-amber-200" />
                  <span className="min-w-0 truncate">Next match {nextMatchLabel}: {nextMatch.matchNumber}</span>
                </div>
              ) : null}
              <div className="mt-5 grid max-w-xl grid-cols-3 gap-2">
                <span className="metric-card metric-card--green rounded-lg px-3 py-2"><span className="block text-xl font-black text-white">{teams.length}</span><span className="text-xs font-bold text-slate-400">Teams</span></span>
                <span className="metric-card metric-card--amber rounded-lg px-3 py-2"><span className="block text-xl font-black text-white">{matches.length}</span><span className="text-xs font-bold text-slate-400">Matches</span></span>
                <span className="metric-card metric-card--blue rounded-lg px-3 py-2"><span className="block text-xl font-black text-white">{players.length}</span><span className="text-xs font-bold text-slate-400">Players</span></span>
              </div>
            </motion.div>
            <div className="relative z-10 order-1 mx-auto w-full max-w-2xl min-w-0 before:absolute before:inset-6 before:-z-10 before:rounded-full before:bg-emerald-400/10 before:blur-3xl lg:order-2 xl:max-w-3xl">
              <LiveScorePanel match={liveMatch} teams={teams} players={players} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Recent results</p>
            <h2 className="mt-2 text-3xl font-black text-white">Latest match outcomes</h2>
          </div>
          <Link href="/results" className="inline-flex items-center gap-1 text-sm font-black text-emerald-200">
            All results <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {recentMatches.length ? recentMatches.map((match) => (
            <MatchCard key={match.id} match={match} teams={teams} />
          )) : (
            <div className="rounded-lg border border-emerald-300/16 bg-emerald-400/10 p-5 text-sm font-bold text-slate-300 lg:col-span-3">
              No results yet. Completed matches will appear here.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Upcoming fixtures</p>
            <h2 className="mt-2 text-3xl font-black text-white">Next games</h2>
          </div>
          <Link href="/fixtures" className="inline-flex items-center gap-1 text-sm font-black text-emerald-200">
            All fixtures <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {upcomingMatches.length ? upcomingMatches.map((match) => (
            <MatchCard key={match.id} match={match} teams={teams} />
          )) : (
            <div className="rounded-lg border border-emerald-300/16 bg-emerald-400/10 p-5 text-sm font-bold text-slate-300 lg:col-span-3">
              No upcoming fixtures scheduled.
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/28">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_0.72fr] lg:px-6">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Standings</p>
                <h2 className="mt-2 text-3xl font-black text-white">Top four race</h2>
              </div>
              <Link href="/points-table" className="secondary-button px-4 py-2 text-sm font-black">
                Full Points Table
              </Link>
            </div>
            <PointsTable rows={pointsTable.slice(0, 4)} teams={teams} compact />
          </div>
          <div className="sport-card rounded-lg border border-white/10 bg-white/[0.055] p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Teams</p>
            <h2 className="mt-2 text-3xl font-black text-white">League squads</h2>
            <div className="mt-5 grid gap-3">
              {teams.slice(0, 4).map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/38 p-3 transition hover:border-emerald-300/35">
                  <span className="flex min-w-0 items-center gap-3">
                    <TeamBadge team={team} />
                    <span className="min-w-0">
                      <span className="block truncate font-black text-white">{team.name}</span>
                      <span className="block text-sm text-slate-400">Captain {team.captain}</span>
                    </span>
                  </span>
                  <span className="text-sm font-black text-emerald-200">{team.wins}W</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">Top players</p>
            <h2 className="mt-2 text-3xl font-black text-white">Tournament leaders</h2>
          </div>
          <Link href="/players" className="inline-flex items-center gap-1 text-sm font-black text-emerald-200">
            Player list <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {leaderCards.map((player, index) => (
            <PlayerCard key={`${player.id}-${index}`} player={player} team={getTeam(player.teamId, teams)} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 lg:px-6">
        <Link href="/teams" className="broadcast-card sport-card flex flex-col gap-3 rounded-lg p-5 transition hover:-translate-y-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-200" />
            <span>
              <span className="block text-2xl font-black text-white">Explore all teams</span>
              <span className="text-sm font-bold text-slate-400">Squads, captains, records and top performers.</span>
            </span>
          </span>
          <span className="secondary-button inline-flex px-4 py-2 text-sm font-black">View Teams</span>
        </Link>
      </section>
    </LeagueShell>
  );
}
