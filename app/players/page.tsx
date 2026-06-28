"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LeagueShell } from "@/components/league/LeagueShell";
import { PlayerCard } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import type { PlayerRole } from "@/lib/leagueTypes";
import { getTeam } from "@/lib/leagueStorage";

const roles: Array<"All" | PlayerRole> = ["All", "Batter", "Bowler", "All-rounder", "Wicketkeeper"];

export default function PlayersPage() {
  const { teams, players } = useLeagueData();
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState<"All" | PlayerRole>("All");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return players.filter((player) => {
      const team = getTeam(player.teamId, teams);
      const matchesSearch = !value || [player.name, player.role, team?.name ?? "", team?.shortCode ?? ""].some((item) => item.toLowerCase().includes(value));
      const matchesTeam = teamFilter === "All" || player.teamId === teamFilter;
      const matchesRole = roleFilter === "All" || player.role === roleFilter;
      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [players, query, roleFilter, teamFilter, teams]);

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="players-hero rounded-lg border p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Squads</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white md:text-6xl">Players</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Browse squads by role and team with cleaner player profiles and tournament stats.</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
              {filtered.length} players
            </span>
          </div>
          <div className="mt-6 grid gap-3 rounded-lg border border-emerald-100 bg-white/80 p-4 shadow-sm lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search player, team or role" className="pl-10" />
            </label>
            <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="min-w-44 px-3 py-2">
              <option value="All">All teams</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "All" | PlayerRole)} className="min-w-44 px-3 py-2">
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((player) => <PlayerCard key={player.id} player={player} team={getTeam(player.teamId, teams)} />)}
        </div>
      </section>
    </LeagueShell>
  );
}
