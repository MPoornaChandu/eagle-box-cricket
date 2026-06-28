"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { LeagueShell } from "@/components/league/LeagueShell";
import { PlayerAvatar, StatPill, TeamBadge } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { ballsToOvers, calculatePlayerCareerStats, calculatePlayerPerformances, getAge, getPlayer, getTeam } from "@/lib/leagueStorage";

export default function PlayerDetailsPage() {
  const params = useParams<{ id: string }>();
  const { teams, players, matches } = useLeagueData();

  const player = getPlayer(params.id, players);
  const team = player ? getTeam(player.teamId, teams) : undefined;
  const stats = useMemo(() => (player ? calculatePlayerCareerStats(player.id, matches, player, teams) : undefined), [matches, player, teams]);
  const performances = useMemo(() => (player ? calculatePlayerPerformances(player.id, matches, players, teams) : []), [matches, player, players, teams]);

  if (!player || !stats) {
    return <LeagueShell><main className="mx-auto max-w-7xl px-4 py-14"><h1 className="text-3xl font-black text-white">Player not found</h1></main></LeagueShell>;
  }

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="sport-card rounded-lg border border-white/70 bg-white/85 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <PlayerAvatar player={player} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">#{player.jerseyNumber} - {player.role}</p>
              <h1 className="mt-1 text-4xl font-black text-white md:text-6xl">{player.name}</h1>
              <div className="mt-3 flex items-center gap-2 text-slate-300"><TeamBadge team={team} size="sm" />{team?.name}</div>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">{player.bio}</p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatPill label="Age" value={getAge(player.dateOfBirth) || "-"} />
          <StatPill label="DOB" value={player.dateOfBirth ?? "-"} />
          <StatPill label="Nationality" value={player.nationality ?? "-"} />
          <StatPill label="Team" value={team?.shortCode ?? "TBA"} />
          <StatPill label="Batting" value={player.battingStyle} />
          <StatPill label="Bowling" value={player.bowlingStyle} />
          <StatPill label="POTM" value={stats.playerOfMatchAwards} />
          <StatPill label="Recent" value={player.recentScores[0] ?? "-"} />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-3">
          <StatsBlock title="Career Batting" items={[
            ["Matches", stats.battingMatches],
            ["Innings", stats.battingInnings],
            ["Runs", stats.runs],
            ["Highest", stats.highestScore],
            ["Average", stats.battingAverage.toFixed(2)],
            ["Strike Rate", stats.strikeRate.toFixed(2)],
            ["50s", stats.fifties],
            ["100s", stats.hundreds],
            ["Ducks", stats.ducks],
            ["4s", stats.fours],
            ["6s", stats.sixes]
          ]} />
          <StatsBlock title="Career Bowling" items={[
            ["Matches", stats.bowlingMatches],
            ["Innings", stats.bowlingInnings],
            ["Wickets", stats.wickets],
            ["Best", stats.bestBowling],
            ["Average", stats.bowlingAverage.toFixed(2)],
            ["Economy", stats.economy.toFixed(2)],
            ["Strike Rate", stats.bowlingStrikeRate.toFixed(2)],
            ["5W", stats.fiveWicketHauls]
          ]} />
          <StatsBlock title="Fielding" items={[
            ["Catches", stats.catches],
            ["Run-outs", stats.runOuts],
            ["Stumpings", stats.stumpings],
            ["Awards", stats.playerOfMatchAwards]
          ]} />
        </section>

        <section className="mt-8 rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-white">Recent form</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-6">
            {player.recentScores.map((score, index) => (
              <span key={`${score}-${index}`} className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-800">{score}</span>
            ))}
          </div>
          <div className="mt-5 flex h-28 items-end gap-2 border-t border-emerald-100 pt-4">
            {performances.slice(-8).map((performance) => (
              <div key={performance.id} className="flex flex-1 flex-col items-center gap-2">
                <span className="w-full rounded-t bg-emerald-500" style={{ height: `${Math.max(8, Math.min(100, performance.runs))}%` }} />
                <span className="text-[0.65rem] font-bold text-slate-400">{performance.runs}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-100 p-5">
            <h2 className="text-2xl font-black text-white">Match-by-match performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-emerald-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr><th className="px-4 py-3">Date</th><th>Opponent</th><th>Runs</th><th>Balls</th><th>Wickets</th><th>Bowling</th><th>Note</th></tr>
              </thead>
              <tbody>
                {performances.length ? performances.map((performance) => (
                  <tr key={performance.id} className="border-t border-emerald-100">
                    <td className="px-4 py-3">{new Date(performance.date).toLocaleDateString()}</td>
                    <td>{performance.opponent}</td>
                    <td>{performance.runs}</td>
                    <td>{performance.balls}</td>
                    <td>{performance.wickets}</td>
                    <td>{performance.bowlingRuns}/{ballsToOvers(performance.bowlingBalls)}</td>
                    <td>{performance.note}</td>
                  </tr>
                )) : <tr><td className="px-4 py-4 text-slate-400" colSpan={7}>No detailed scorecard history yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </LeagueShell>
  );
}

function StatsBlock({ title, items }: { title: string; items: Array<[string, string | number]> }) {
  return (
    <section className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {items.map(([label, value]) => (
          <span key={label} className="rounded-lg bg-slate-50 px-3 py-2">
            <span className="block text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <span className="text-base font-black text-white">{value}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
