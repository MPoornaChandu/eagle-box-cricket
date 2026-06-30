"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LeagueShell } from "@/components/league/LeagueShell";
import { MatchCard, PlayerCard, TeamBadge } from "@/components/league/LeagueCards";
import type { Match, Player, Team } from "@/lib/leagueTypes";
import { calculatePointsTable, getMatches, getPlayers, getTeam, getTeams, playersForTeam } from "@/lib/leagueStorage";

export default function TeamDetailsPage() {
  const params = useParams<{ id: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    setTeams(getTeams());
    setPlayers(getPlayers());
    setMatches(getMatches());
  }, []);

  const team = getTeam(params.id, teams);
  const squad = playersForTeam(params.id, players);
  const teamMatches = useMemo(() => matches.filter((match) => match.teamAId === params.id || match.teamBId === params.id), [matches, params.id]);
  const tableRow = useMemo(() => calculatePointsTable(teams, matches).find((row) => row.teamId === params.id), [matches, params.id, teams]);
  const recent = teamMatches.filter((match) => match.status === "completed").slice(0, 3);
  const upcoming = teamMatches.filter((match) => match.status !== "completed").slice(0, 3);
  const topPerformers = [...squad].sort((a, b) => b.runs + b.wickets * 18 - (a.runs + a.wickets * 18)).slice(0, 3);

  if (!team) {
    return <LeagueShell><main className="mx-auto max-w-7xl px-4 py-14"><h1 className="text-3xl font-black text-white">Team not found</h1></main></LeagueShell>;
  }

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="sport-card rounded-lg border border-white/10 p-6" style={{ background: `linear-gradient(135deg, ${team.primaryColor}55, rgba(2,6,23,0.82))` }}>
          <div className="flex flex-wrap items-center gap-4">
            <TeamBadge team={team} size="lg" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">{team.shortCode}</p>
              <h1 className="mt-1 text-4xl font-black text-white md:text-6xl">{team.name}</h1>
              <p className="mt-2 text-slate-200">Captain {team.captain}</p>
            </div>
          </div>
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Info label="Matches" value={team.matches} />
          <Info label="Wins" value={team.wins} />
          <Info label="Losses" value={tableRow?.lost ?? Math.max(team.matches - team.wins, 0)} />
          <Info label="NRR" value={tableRow?.nrr.toFixed(3) ?? "0.000"} />
          <Info label="Squad" value={squad.length} />
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-black text-white">Squad list</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {squad.map((player) => <PlayerCard key={player.id} player={player} team={team} />)}
          </div>
        </section>
        <section className="mt-8 grid gap-8 xl:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-black text-white">Recent matches</h2>
            <div className="grid gap-4">{recent.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}</div>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-black text-white">Upcoming matches</h2>
            <div className="grid gap-4">{upcoming.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}</div>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-black text-white">Top performers</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {topPerformers.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <p className="font-black text-white">{player.name}</p>
                <p className="mt-1 text-sm text-slate-400">{player.runs} runs - {player.wickets} wickets</p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </LeagueShell>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p></div>;
}
