"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Radio, Trophy, UserPlus, Users } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import { LiveScorePanel, PointsTable, StatPill } from "@/components/league/LeagueCards";
import type { Match, Player, PointsTableRow, Team } from "@/lib/leagueTypes";
import { calculatePointsTable, getLiveMatch, getMatches, getPlayers, getTeams } from "@/lib/leagueStorage";

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
    const pending = matches.filter((match) => match.status === "upcoming");
    const topTeam = points[0] ? teams.find((team) => team.id === points[0].teamId)?.name ?? "TBA" : "TBA";
    return { completed: completed.length, pending: pending.length, topTeam };
  }, [matches, points, teams]);

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Control room</p>
      <h1 className="mt-2 text-4xl font-black text-white">Admin Dashboard</h1>
      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatPill label="Total teams" value={teams.length} />
        <StatPill label="Total players" value={players.length} />
        <StatPill label="Total matches" value={matches.length} />
        <StatPill label="Live match" value={liveMatch ? liveMatch.matchNumber : "None"} />
        <StatPill label="Completed" value={stats.completed} />
        <StatPill label="Pending fixtures" value={stats.pending} />
        <StatPill label="Top team" value={stats.topTeam} />
        <StatPill label="Points rule" value="Win = 2" />
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <LiveScorePanel match={liveMatch} teams={teams} players={players} />
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-2xl font-black text-white">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Action href="/admin/teams" icon={<Users className="h-4 w-4" />} label="Add Team" />
            <Action href="/admin/players" icon={<UserPlus className="h-4 w-4" />} label="Add Player" />
            <Action href="/admin/fixtures" icon={<CalendarPlus className="h-4 w-4" />} label="Create Fixture" />
            <Action href="/admin/live-score" icon={<Radio className="h-4 w-4" />} label="Start Live Match" />
            <Action href="/admin/live-score" icon={<Radio className="h-4 w-4" />} label="Update Score" />
            <Action href="/admin/results" icon={<Trophy className="h-4 w-4" />} label="Enter Result" />
          </div>
        </div>
      </section>
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="mb-4 text-2xl font-black text-white">Points Table Data</h2>
        <PointsTable rows={points.slice(0, 4)} teams={teams} compact />
      </section>
    </AdminShell>
  );
}

function Action({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-black">{icon}{label}</Link>;
}
