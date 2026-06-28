"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { CalendarDays, ChevronRight, Radio, Sparkles, Trophy } from "lucide-react";
import { LeagueShell } from "@/components/league/LeagueShell";
import { LiveScorePanel, MatchCard, PlayerCard, PointsTable, TeamBadge } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import type { Player } from "@/lib/leagueTypes";
import {
  getTeam,
  isAdminSessionActive,
  playersForTeam,
  topPlayers
} from "@/lib/leagueStorage";

export default function HomePage() {
  const router = useRouter();
  const { teams, players, matches, pointsTable, liveMatch } = useLeagueData();

  useEffect(() => {
    let active = true;

    async function checkEntry() {
      const hasViewerSession = Boolean(window.localStorage.getItem("viewerSession"));
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
  const leaders = useMemo(() => topPlayers(players), [players]);
  const leaderCards = [leaders.runs, leaders.wickets, leaders.strikeRate, leaders.economy].filter(Boolean) as Player[];

  return (
    <LeagueShell>
      <section className="stadium-hero relative min-h-[calc(100vh-72px)] overflow-hidden">
        <HeroBackgroundVideo />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] xl:gap-14">
            <motion.div className="min-w-0" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Match night is on
              </p>
              <h1 className="hero-title mt-7 max-w-4xl text-5xl font-black leading-[1.02] text-slate-950 dark:text-white md:text-7xl">
                Eagle Box Cricket League
              </h1>
              <p className="hero-subtitle mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
                Live scores, match updates, teams, players and tournament standings.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/live" className="premium-button inline-flex items-center justify-center gap-2 px-5 py-3 text-sm">
                  <Radio className="h-4 w-4" />
                  View Live Score
                </Link>
                <Link href="/matches" className="secondary-button inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black">
                  <CalendarDays className="h-4 w-4" />
                  View Matches
                </Link>
              </div>
            </motion.div>
            <div className="relative z-10 mx-auto w-full max-w-2xl min-w-0 xl:max-w-3xl">
              <LiveScorePanel match={liveMatch} teams={teams} players={players} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Match center</p>
            <h2 className="mt-2 text-3xl font-black text-white">Recent and upcoming fixtures</h2>
          </div>
          <Link href="/matches" className="inline-flex items-center gap-1 text-sm font-black text-emerald-200">
            All matches <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...recentMatches, ...upcomingMatches].slice(0, 6).map((match) => (
            <MatchCard key={match.id} match={match} teams={teams} />
          ))}
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
        <div className="mb-5 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-amber-200" />
          <h2 className="text-3xl font-black text-white">Team cards</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const squad = playersForTeam(team.id, players);
            return (
              <Link key={team.id} href={`/teams/${team.id}`} className="sport-card rounded-lg border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:border-emerald-300/35">
                <div className="flex items-center gap-3">
                  <TeamBadge team={team} size="lg" />
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-white">{team.name}</h3>
                    <p className="text-sm font-bold text-slate-400">{team.shortCode} - {squad.length} players</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <span className="rounded-lg bg-slate-950/38 p-3"><span className="block text-lg font-black text-white">{team.matches}</span><span className="text-xs text-slate-400">Matches</span></span>
                  <span className="rounded-lg bg-slate-950/38 p-3"><span className="block text-lg font-black text-white">{team.wins}</span><span className="text-xs text-slate-400">Wins</span></span>
                  <span className="rounded-lg bg-slate-950/38 p-3"><span className="block text-lg font-black text-white">{team.captain.split(" ")[0]}</span><span className="text-xs text-slate-400">Captain</span></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </LeagueShell>
  );
}
