"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import { StatPill } from "@/components/league/LeagueCards";
import type { Match, Player, Team } from "@/lib/leagueTypes";
import { calculatePointsTable, getLeagueReport, getMatches, getPlayers, getTeam, getTeams, topPlayers } from "@/lib/leagueStorage";

export default function AdminReportsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  useEffect(() => { setTeams(getTeams()); setPlayers(getPlayers()); setMatches(getMatches()); }, []);

  const points = calculatePointsTable(teams, matches);
  const completed = matches.filter((match) => match.status === "completed");
  const live = matches.find((match) => match.status === "live");
  const top = topPlayers(players);
  const pending = matches.filter((match) => match.status === "upcoming");
  const exportReport = () => {
    const blob = new Blob([JSON.stringify(getLeagueReport(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "eagle-box-cricket-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Reports</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="mt-2 text-4xl font-black text-white">Tournament Reports</h1>
        <button type="button" onClick={exportReport} className="secondary-button inline-flex items-center gap-2 px-4 py-3 text-sm font-black">
          <Download className="h-4 w-4" />
          Export JSON
        </button>
      </div>
      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatPill label="Teams" value={teams.length} />
        <StatPill label="Players" value={players.length} />
        <StatPill label="Fixtures" value={matches.length} />
        <StatPill label="Completed" value={completed.length} />
        <StatPill label="Live match" value={live?.matchNumber ?? "None"} />
        <StatPill label="Pending" value={pending.length} />
        <StatPill label="Top team" value={points[0] ? getTeam(points[0].teamId, teams)?.shortCode ?? "TBA" : "TBA"} />
        <StatPill label="Top runs" value={top.runs?.name ?? "TBA"} />
        <StatPill label="Top wickets" value={top.wickets?.name ?? "TBA"} />
        <StatPill label="Tournament MVP" value={[...players].sort((a, b) => b.runs + b.wickets * 18 - (a.runs + a.wickets * 18))[0]?.name ?? "TBA"} />
      </section>
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="text-2xl font-black text-white">Completed matches</h2>
        <div className="mt-4 grid gap-3">
          {completed.map((match) => (
            <div key={match.id} className="rounded-lg border border-white/10 bg-slate-950/38 p-4">
              <p className="font-black text-white">{match.matchNumber}: {getTeam(match.teamAId, teams)?.name} vs {getTeam(match.teamBId, teams)?.name}</p>
              <p className="mt-1 text-sm text-slate-400">{match.result?.teamAScore} vs {match.result?.teamBScore}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="text-2xl font-black text-white">Leader snapshot</h2>
        <p className="mt-2 text-slate-300">{points[0] ? `${getTeam(points[0].teamId, teams)?.name} lead with ${points[0].points} points and NRR ${points[0].nrr.toFixed(3)}.` : "No standings yet."}</p>
      </section>
    </AdminShell>
  );
}
