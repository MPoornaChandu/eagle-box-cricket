"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarPlus, Radio, Settings, ShieldCheck, Target, Trophy, UserRound, Zap } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import { LiveScorePanel, PointsTable } from "@/components/league/LeagueCards";
import type { Match, Player, PointsTableRow, Team } from "@/lib/leagueTypes";
import { calculatePointsTable, getLiveMatch, getMatches, getPlayers, getTeam, getTeams, topPlayers } from "@/lib/leagueStorage";

export default function AdminDashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [points, setPoints] = useState<PointsTableRow[]>([]);
  const [liveMatch, setLiveMatch] = useState<Match | undefined>();

  useEffect(() => {
    const nextTeams = getTeams();
    const nextMatches = getMatches();
    setTeams(nextTeams);
    setPlayers(getPlayers());
    setMatches(nextMatches);
    setPoints(calculatePointsTable(nextTeams, nextMatches));
    setLiveMatch(getLiveMatch());
  }, []);

  const stats = useMemo(() => {
    const completed = matches.filter((match) => match.status === "completed");
    const pending = matches
      .filter((match) => match.status === "upcoming")
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    const topTeam = points[0] ? teams.find((team) => team.id === points[0].teamId)?.name ?? "TBA" : "TBA";
    const totalRuns = completed.reduce((sum, match) => sum + (match.result?.teamARuns ?? 0) + (match.result?.teamBRuns ?? 0), 0);
    const totalWickets = completed.reduce((sum, match) => sum + (match.result?.teamAWickets ?? 0) + (match.result?.teamBWickets ?? 0), 0);
    const leaders = topPlayers(players);
    const nextMatch = pending[0];
    const countdown = nextMatch ? Math.max(0, new Date(nextMatch.dateTime).getTime() - Date.now()) : 0;
    const days = Math.floor(countdown / 86_400_000);
    const hours = Math.floor((countdown % 86_400_000) / 3_600_000);
    const minutes = Math.floor((countdown % 3_600_000) / 60_000);
    return {
      completed: completed.length,
      pending: pending.length,
      topTeam,
      totalRuns,
      totalWickets,
      topRunScorer: leaders.runs,
      topWicketTaker: leaders.wickets,
      nextMatch,
      countdownText: nextMatch ? (days === 0 && hours === 0 ? "Today" : `Starts in ${days ? `${days}d ` : ""}${hours}h ${minutes}m`) : "No upcoming match"
    };
  }, [matches, players, points, teams]);

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Control room</p>
      <h1 className="mt-2 text-4xl font-black text-white">Admin Dashboard</h1>
      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStat icon={<CalendarPlus className="h-5 w-5" />} label="Matches played" value={stats.completed} tone="green" />
        <AdminStat icon={<Zap className="h-5 w-5" />} label="Total runs" value={stats.totalRuns} tone="amber" />
        <AdminStat icon={<Target className="h-5 w-5" />} label="Total wickets" value={stats.totalWickets} tone="red" />
        <AdminStat icon={<Radio className="h-5 w-5" />} label="Live match" value={liveMatch ? liveMatch.matchNumber : "None"} tone="blue" live={Boolean(liveMatch)} />
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="broadcast-card rounded-lg p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Top run-scorer</p>
          <h2 className="mt-2 text-2xl font-black text-white">{stats.topRunScorer?.name ?? "TBA"}</h2>
          <p className="mt-1 text-sm font-bold text-slate-400">{stats.topRunScorer?.runs ?? 0} runs</p>
        </div>
        <div className="broadcast-card rounded-lg p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">Top wicket-taker</p>
          <h2 className="mt-2 text-2xl font-black text-white">{stats.topWicketTaker?.name ?? "TBA"}</h2>
          <p className="mt-1 text-sm font-bold text-slate-400">{stats.topWicketTaker?.wickets ?? 0} wickets</p>
        </div>
        <div className="broadcast-card rounded-lg p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Upcoming match countdown</p>
          <h2 className="mt-2 text-2xl font-black text-white">{stats.countdownText}</h2>
          <p className="mt-1 text-sm font-bold text-slate-400">
            {stats.nextMatch ? `${stats.nextMatch.matchNumber}: ${getTeam(stats.nextMatch.teamAId, teams)?.shortCode} vs ${getTeam(stats.nextMatch.teamBId, teams)?.shortCode}` : "Schedule a fixture to start the clock."}
          </p>
        </div>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <LiveScorePanel match={liveMatch} teams={teams} players={players} />
        <div className="broadcast-card rounded-lg p-5">
          <h2 className="text-2xl font-black text-white">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Action href="/admin/live-score" icon={<Radio className="h-4 w-4" />} label="Live Score Control" />
            <Action href="/admin/fixtures" icon={<CalendarPlus className="h-4 w-4" />} label="Manage Fixtures" />
            <Action href="/admin/players" icon={<UserRound className="h-4 w-4" />} label="Manage Players" />
            <Action href="/admin/reports" icon={<BarChart3 className="h-4 w-4" />} label="Reports" />
            <Action href="/admin/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
            <Action href="/admin/results" icon={<Trophy className="h-4 w-4" />} label="Enter Result" />
          </div>
        </div>
      </section>
      <section className="broadcast-card mt-6 rounded-lg p-5">
        <h2 className="mb-4 text-2xl font-black text-white">Points Table Data</h2>
        <PointsTable rows={points.slice(0, 4)} teams={teams} compact />
      </section>
    </AdminShell>
  );
}

function Action({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">{icon}{label}</Link>;
}

function AdminStat({ icon, label, value, tone, live = false }: { icon: React.ReactNode; label: string; value: string | number; tone: "green" | "amber" | "red" | "blue"; live?: boolean }) {
  return (
    <div className={`metric-card metric-card--${tone} rounded-lg p-5 ${live ? "live-pulse" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400/10 text-emerald-200">{icon}</span>
        {live ? <ShieldCheck className="h-4 w-4 text-emerald-200" /> : null}
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
