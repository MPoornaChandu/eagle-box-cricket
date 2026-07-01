"use client";

import { useMemo } from "react";
import Link from "next/link";
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
    return (
      <LeagueShell>
        <main className="mx-auto max-w-7xl px-4 py-14">
          <section className="sport-card mx-auto max-w-xl rounded-lg border border-white/10 bg-white/[0.055] p-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Player profile</p>
            <h1 className="mt-3 text-3xl font-black text-white">Player not found</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">We could not find that player profile. Browse the full squad list or return home.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/players" className="secondary-button px-4 py-2 text-sm font-black">Back to Players</Link>
              <Link href="/home" className="premium-button px-4 py-2 text-sm">Go Home</Link>
            </div>
          </section>
        </main>
      </LeagueShell>
    );
  }

  const formattedDob = player.dateOfBirth
    ? new Date(player.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "-";
  const featuredStats: Array<[string, string | number, "green" | "amber" | "red" | "blue"]> =
    player.role === "Bowler"
      ? [
          ["Wickets", stats.wickets || "N/A", "red"],
          ["Economy", stats.economy ? stats.economy.toFixed(2) : "N/A", "green"],
          ["Best Bowling", stats.bestBowling || "N/A", "amber"],
          ["Strike Rate", stats.bowlingStrikeRate ? stats.bowlingStrikeRate.toFixed(2) : "N/A", "blue"]
        ]
      : player.role === "All-rounder"
        ? [
            ["Runs", stats.runs || "N/A", "green"],
            ["Wickets", stats.wickets || "N/A", "red"],
            ["Strike Rate", stats.strikeRate ? stats.strikeRate.toFixed(2) : "N/A", "amber"],
            ["Economy", stats.economy ? stats.economy.toFixed(2) : "N/A", "blue"]
          ]
        : [
            ["Runs", stats.runs || "N/A", "green"],
            ["Average", stats.battingAverage ? stats.battingAverage.toFixed(2) : "N/A", "amber"],
            ["Strike Rate", stats.strikeRate ? stats.strikeRate.toFixed(2) : "N/A", "blue"],
            ["Highest", stats.highestScore || "N/A", "red"]
          ];

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <Link href="/players" className="secondary-button mb-4 inline-flex px-4 py-2 text-sm font-black">
          Back to Players
        </Link>
        <div className="sport-card rounded-lg border border-white/10 p-6" style={{ background: `linear-gradient(135deg, ${team?.primaryColor ?? "#059669"}3d, var(--panel-strong))` }}>
          <div className="flex flex-wrap items-center gap-4">
            <PlayerAvatar player={player} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">#{player.jerseyNumber} - {player.role}</p>
              <h1 className="mt-1 text-4xl font-black text-white md:text-6xl">{player.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-slate-300">
                <TeamBadge team={team} size="sm" />
                <span>{team?.name}</span>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-200">{player.role}</span>
              </div>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">{player.bio}</p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredStats.map(([label, value, tone]) => <StatPill key={label} label={label} value={value} tone={tone} />)}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatPill label="Age" value={getAge(player.dateOfBirth) || "N/A"} />
          <StatPill label="DOB" value={formattedDob === "-" ? "N/A" : formattedDob} />
          <StatPill label="Nationality" value={player.nationality ?? "N/A"} />
          <StatPill label="POTM" value={`${stats.playerOfMatchAwards} awards`} />
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

        <section className="broadcast-card mt-8 rounded-lg p-5 shadow-sm">
          <h2 className="text-2xl font-black text-white">Recent performance</h2>
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

        <section className="broadcast-card mt-8 overflow-hidden rounded-lg shadow-sm">
          <div className="border-b border-emerald-300/10 p-5">
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
    <section className="broadcast-card rounded-lg p-5 shadow-sm">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {items.map(([label, value]) => (
          <span key={label} className="metric-card rounded-lg px-3 py-2">
            <span className="block text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <span className="text-base font-black text-white">{value || "N/A"}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
