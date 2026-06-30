"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import { StatPill } from "@/components/league/LeagueCards";
import type { Match, Player, Team } from "@/lib/leagueTypes";
import { calculatePointsTable, getMatches, getPlayer, getPlayers, getTeam, getTeams, topPlayers } from "@/lib/leagueStorage";

export default function AdminReportsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  useEffect(() => { setTeams(getTeams()); setPlayers(getPlayers()); setMatches(getMatches()); }, []);

  const points = calculatePointsTable(teams, matches);
  const completed = matches.filter((match) => match.status === "completed");
  const live = matches.find((match) => match.status === "live");
  const top = topPlayers(players);
  const topBatsmen = [...players].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topBowlers = [...players].sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  const pending = matches.filter((match) => match.status === "upcoming");
  const exportReport = () => {
    const rows = [
      ["Match ID", "Teams", "Winner", "Scores", "Player of the Match"],
      ...completed.map((match) => [
        match.matchNumber,
        `${getTeam(match.teamAId, teams)?.shortCode ?? "TBA"} vs ${getTeam(match.teamBId, teams)?.shortCode ?? "TBA"}`,
        match.result?.winnerTeamId ? getTeam(match.result.winnerTeamId, teams)?.name ?? "TBA" : match.result?.resultType ?? "TBA",
        `${match.result?.teamAScore ?? "-"} / ${match.result?.teamBScore ?? "-"}`,
        match.result?.playerOfMatch ? getTeam(match.result.playerOfMatch, teams)?.name ?? getPlayer(match.result.playerOfMatch, players)?.name ?? "TBA" : "TBA"
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "eagle-box-cricket-report.csv";
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
          Export CSV
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
        <h2 className="text-2xl font-black text-white">Match-by-match summary</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[54rem] text-left text-sm">
            <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.15em] text-slate-400">
              <tr><th className="px-4 py-3">Match ID</th><th className="px-4 py-3">Teams</th><th className="px-4 py-3">Winner</th><th className="px-4 py-3">Scores</th><th className="px-4 py-3">Player of the Match</th></tr>
            </thead>
            <tbody>
              {completed.map((match) => (
                <tr key={match.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-black text-white">{match.matchNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{getTeam(match.teamAId, teams)?.name} vs {getTeam(match.teamBId, teams)?.name}</td>
                  <td className="px-4 py-3 text-slate-300">{match.result?.winnerTeamId ? getTeam(match.result.winnerTeamId, teams)?.name : match.result?.resultType ?? "TBA"}</td>
                  <td className="px-4 py-3 text-slate-300">{match.result?.teamAScore} / {match.result?.teamBScore}</td>
                  <td className="px-4 py-3 text-slate-300">{match.result?.playerOfMatch ? getPlayer(match.result.playerOfMatch, players)?.name ?? "TBA" : "TBA"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Leaderboard title="Top 5 batsmen" rows={topBatsmen.map((player) => ({ name: player.name, value: `${player.runs} runs` }))} />
        <Leaderboard title="Top 5 bowlers" rows={topBowlers.map((player) => ({ name: player.name, value: `${player.wickets} wickets` }))} />
      </section>
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="text-2xl font-black text-white">Leader snapshot</h2>
        <p className="mt-2 text-slate-300">{points[0] ? `${getTeam(points[0].teamId, teams)?.name} lead with ${points[0].points} points and NRR ${points[0].nrr.toFixed(3)}.` : "No standings yet."}</p>
      </section>
    </AdminShell>
  );
}

function Leaderboard({ title, rows }: { title: string; rows: Array<{ name: string; value: string }> }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <div className="mt-4 grid gap-2">
        {rows.map((row, index) => (
          <div key={`${row.name}-${index}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/38 px-3 py-2">
            <span className="font-black text-white">#{index + 1} {row.name}</span>
            <span className="text-sm font-bold text-emerald-200">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
