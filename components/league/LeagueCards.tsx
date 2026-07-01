"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, MapPin, Trophy } from "lucide-react";
import type { Match, Player, PlayoffFixture, PointsTableRow, Team } from "@/lib/leagueTypes";
import { ballsToOvers, calculateEconomy, calculateRequiredRunRate, calculateStrikeRate, getPlayer, getTeam, scoreText } from "@/lib/leagueStorage";
import { cn } from "@/lib/utils";

function isImage(value?: string) {
  return Boolean(value && (/^https?:\/\//.test(value) || value.startsWith("data:image")));
}

function roleClass(role: Player["role"]) {
  if (role === "Batter") return "player-card--batter";
  if (role === "Bowler") return "player-card--bowler";
  if (role === "All-rounder") return "player-card--allrounder";
  return "player-card--keeper";
}

export function TeamBadge({ team, size = "md" }: { team?: Team; size?: "sm" | "md" | "lg" }) {
  const dimension = size === "lg" ? "h-20 w-20 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-lg border border-white/45 font-black text-white shadow-sm", dimension)}
      style={{ background: team?.primaryColor ?? "#0f9f6e" }}
    >
      {isImage(team?.logo) ? <img src={team?.logo} alt="" className="h-full w-full object-cover" /> : team?.logo || "EB"}
    </span>
  );
}

export function PlayerAvatar({ player, size = "md" }: { player?: Player; size?: "sm" | "md" | "lg" }) {
  const dimension = size === "lg" ? "h-20 w-20 text-xl" : size === "sm" ? "h-10 w-10 text-xs" : "h-14 w-14 text-sm";
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white font-black text-emerald-800 shadow-sm", dimension)}>
      {isImage(player?.image) ? <img src={player?.image} alt="" className="h-full w-full object-cover" /> : player?.image || player?.name.slice(0, 2).toUpperCase() || "P"}
    </span>
  );
}

function ballBadgeClass(label: string) {
  const normalized = label.toUpperCase();
  if (normalized === "W") return "bg-red-600 text-white shadow-[0_0_18px_rgba(220,38,38,0.28)]";
  if (normalized === "4") return "bg-emerald-400 text-slate-950 shadow-[0_0_18px_rgba(34,197,94,0.24)]";
  if (normalized === "6") return "bg-indigo-400 text-slate-950 shadow-[0_0_18px_rgba(129,140,248,0.24)]";
  if (normalized === "WD" || normalized === "NB") return "bg-amber-300 text-slate-950 shadow-[0_0_18px_rgba(250,204,21,0.2)]";
  if (normalized === "0") return "bg-slate-700 text-slate-100";
  return "bg-emerald-100 text-emerald-900";
}

function normalizeBallLabel(label: string) {
  if (label.toLowerCase() === "wd") return "WD";
  if (label.toLowerCase() === "nb") return "NB";
  return label;
}

export function StatusBadge({ status }: { status: Match["status"] }) {
  if (status === "live") {
    return (
      <span className="live-badge live-pulse inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-700 shadow-sm shadow-red-500/10 transition hover:scale-[1.03] hover:shadow-red-500/25">
        <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" />
        live
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em]",
        status === "upcoming" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "completed" && "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      {status}
    </span>
  );
}

export function resultMargin(match: Match) {
  if (!match.result?.winnerTeamId || match.result.resultType === "tie" || match.result.resultType === "no-result") return "";
  if (match.result.winnerTeamId === match.teamBId) {
    return `Won by ${Math.max(10 - match.result.teamBWickets, 0)} wickets`;
  }
  return `Won by ${Math.max(match.result.teamARuns - match.result.teamBRuns, 0)} runs`;
}

export function resultOutcome(match: Match, teams: Team[]) {
  if (!match.result) return "Result pending";
  if (match.result.resultType === "tie") return "Match tied";
  if (match.result.resultType === "no-result") return "No result";
  const winner = getTeam(match.result.winnerTeamId ?? "", teams);
  const margin = resultMargin(match);
  return winner ? `${winner.name} won${margin ? ` - ${margin.replace("Won by ", "by ")}` : ""}` : "Completed";
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("broadcast-card sport-card rounded-lg p-5 shadow-[0_18px_55px_rgba(0,0,0,0.16)] backdrop-blur-[18px]", className)}>{children}</section>;
}

export function MatchCard({ match, teams, hrefPrefix = "/matches", actions }: { match: Match; teams: Team[]; hrefPrefix?: string; actions?: ReactNode }) {
  const teamA = getTeam(match.teamAId, teams);
  const teamB = getTeam(match.teamBId, teams);
  const winnerTeamId = match.status === "completed" ? match.result?.winnerTeamId : undefined;
  const margin = resultMargin(match);
  const resultText =
    match.result?.resultType === "no-result"
      ? "No result"
      : match.result
        ? `${match.result.teamAScore} vs ${match.result.teamBScore}`
        : match.live
          ? scoreText(match.live.runs, match.live.wickets, match.live.balls)
          : undefined;

  return (
    <motion.article whileHover={{ y: -3 }} className="broadcast-card sport-card rounded-lg p-4 transition hover:border-emerald-300/45 hover:shadow-[0_18px_52px_rgba(0,200,120,0.12)]">
      {actions ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StatusBadge status={match.status} />
            <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{match.matchNumber}</p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap justify-end gap-2">{actions}</div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={match.status} />
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{match.matchNumber}</span>
        </div>
      )}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0">
          <TeamBadge team={teamA} />
          <p className={cn("mt-2 truncate font-black text-white", winnerTeamId === teamA?.id && "text-emerald-200")}>{teamA?.name}</p>
          <p className="text-xs font-bold text-slate-400">{teamA?.shortCode}</p>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">VS</span>
        <div className="min-w-0 text-right">
          <div className="flex justify-end"><TeamBadge team={teamB} /></div>
          <p className={cn("mt-2 truncate font-black text-white", winnerTeamId === teamB?.id && "text-emerald-200")}>{teamB?.name}</p>
          <p className="text-xs font-bold text-slate-400">{teamB?.shortCode}</p>
        </div>
      </div>
      {resultText ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">{resultText}</p> : null}
      {winnerTeamId ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
            <Trophy className="h-3.5 w-3.5" />
            Won
          </span>
          {margin ? <span className="text-sm font-bold text-slate-300">{margin}</span> : null}
        </div>
      ) : null}
      <div className="mt-4 grid gap-2 text-sm text-slate-300">
        <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-600" />{new Date(match.dateTime).toLocaleString()}</span>
        <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" />{match.venue}</span>
      </div>
      <Link href={`${hrefPrefix}/${match.id}`} className="secondary-button mt-4 inline-flex px-4 py-2 text-sm font-black">
        View Match Center
      </Link>
    </motion.article>
  );
}

export function PlayerCard({ player, team, hrefPrefix = "/players" }: { player: Player; team?: Team; hrefPrefix?: string }) {
  const style = { "--team-color": team?.primaryColor ?? "#0f9f6e" } as CSSProperties;
  const keyStats: Array<[string, string | number]> =
    player.role === "Bowler"
      ? [
          ["Wkts", player.wickets || "-"],
          ["Eco", player.economy ? player.economy.toFixed(2) : "-"]
        ]
      : player.role === "All-rounder"
        ? [
            ["Runs", player.runs || "-"],
            ["Wkts", player.wickets || "-"]
          ]
        : [
            ["Runs", player.runs || "-"],
            ["SR", player.strikeRate ? player.strikeRate.toFixed(1) : "-"]
          ];

  return (
    <motion.article whileHover={{ y: -3 }} style={style} className={cn("player-card sport-card rounded-lg border p-4", roleClass(player.role))}>
      <div className="flex items-start gap-3">
        <PlayerAvatar player={player} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-white">{player.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="player-role-chip">{player.role}</span>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{team?.shortCode ?? "Team"}</span>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-slate-400">{team?.name ?? "Unassigned"}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {keyStats.map(([label, value]) => <StatPill key={label} label={label} value={value} />)}
      </div>
      <Link href={`${hrefPrefix}/${player.id}`} className="secondary-button mt-4 inline-flex w-full items-center justify-center gap-1 px-4 py-2.5 text-sm font-black">
        View Profile
        <ChevronRight className="h-4 w-4" />
      </Link>
    </motion.article>
  );
}

export function StatPill({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "green" | "amber" | "red" | "blue" }) {
  return (
    <span
      className={cn(
        "metric-card rounded-lg px-3 py-2",
        tone === "green" && "metric-card--green",
        tone === "amber" && "metric-card--amber",
        tone === "red" && "metric-card--red",
        tone === "blue" && "metric-card--blue"
      )}
    >
      <span className="block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <span className="block text-base font-black text-white">{value}</span>
    </span>
  );
}

function qualifierLabel(index: number, row: PointsTableRow) {
  if (index <= 1) return "Qualifier 1";
  if (index <= 3) return "Eliminator";
  return row.qualification;
}

export function PointsTable({ rows, teams, compact = false }: { rows: PointsTableRow[]; teams: Team[]; compact?: boolean }) {
  return (
    <div className="points-table-shell broadcast-card min-w-0 w-full max-w-full overflow-hidden rounded-lg shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-[18px]">
      <div className="points-table-scroll max-w-full overflow-x-auto pb-2">
        <table className={cn("w-full text-left text-sm", compact ? "min-w-[44rem]" : "min-w-[56rem]")}>
          <thead className="bg-emerald-400/10 text-xs uppercase tracking-[0.15em] text-emerald-200">
            <tr>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">MP</th>
              <th className="px-4 py-3">W</th>
              <th className="px-4 py-3">L</th>
              <th className="px-4 py-3">NR</th>
              <th className="px-4 py-3">Pts</th>
              <th className="min-w-[5.5rem] px-4 py-3">NRR</th>
              <th className="px-4 py-3">Status</th>
              {!compact ? <th className="px-4 py-3">For</th> : null}
              {!compact ? <th className="px-4 py-3">Against</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const team = getTeam(row.teamId, teams);
              const qualified = index < 4;
              return (
                <tr
                  key={row.teamId}
                  className={cn(
                    "glass-row-reveal border-t border-emerald-300/10 transition hover:bg-emerald-400/10",
                    qualified && "border-l-4 border-l-emerald-400 bg-emerald-400/5",
                    index === 4 && "border-t-2 border-dashed border-amber-300/45"
                  )}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <td className="px-4 py-3 font-black text-emerald-200">#{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TeamBadge team={team} size="sm" />
                      <span className="font-black text-white">{team?.name ?? "Team"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-200">{row.played}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{row.won}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{row.lost}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{row.noResult}</td>
                  <td className="px-4 py-3 font-black text-emerald-200">{row.points}</td>
                  <td className={cn("min-w-[5.5rem] px-4 py-3 font-black", row.nrr < 0 ? "text-orange-300" : "text-emerald-200")}>{row.nrr.toFixed(3)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full border px-3 py-1 text-xs font-black", qualified ? "border-emerald-300/30 bg-emerald-400/18 text-emerald-100" : row.qualification === "Eliminated" ? "border-slate-400/20 bg-slate-400/10 text-slate-300" : "border-amber-300/25 bg-amber-300/12 text-amber-100")}>
                      {qualifierLabel(index, row)}
                    </span>
                  </td>
                  {!compact ? <td className="px-4 py-3 text-slate-300">{row.runsFor}/{ballsToOvers(row.oversFaced)}</td> : null}
                  {!compact ? <td className="px-4 py-3 text-slate-300">{row.runsAgainst}/{ballsToOvers(row.oversBowled)}</td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CompletedMatchSummary({ match, teams, players }: { match: Match; teams: Team[]; players: Player[] }) {
  const teamA = getTeam(match.teamAId, teams);
  const teamB = getTeam(match.teamBId, teams);
  const winner = match.result?.winnerTeamId ? getTeam(match.result.winnerTeamId, teams) : undefined;
  const playerOfMatch = match.result?.playerOfMatch ? getPlayer(match.result.playerOfMatch, players) : undefined;
  const battingLines = match.innings.flatMap((innings) =>
    innings.batting.map((line) => ({ ...line, teamId: innings.teamId }))
  );
  const bowlingLines = match.innings.flatMap((innings) =>
    innings.bowling.map((line) => ({ ...line, teamId: innings.teamId }))
  );
  const topScorer = battingLines.reduce<(typeof battingLines)[number] | undefined>(
    (best, line) => (!best || line.runs > best.runs ? line : best),
    undefined
  );
  const topWicketTaker = bowlingLines.reduce<(typeof bowlingLines)[number] | undefined>(
    (best, line) => (!best || line.wickets > best.wickets || (line.wickets === best.wickets && line.runs < best.runs) ? line : best),
    undefined
  );

  return (
    <Card className="completed-summary-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status="completed" />
        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{match.matchNumber}</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="rounded-lg border border-emerald-300/14 bg-[rgba(255,255,255,0.055)] p-4">
          <div className="flex items-center gap-3">
            <TeamBadge team={teamA} />
            <div>
              <p className="font-black text-white">{teamA?.name ?? "Team A"}</p>
              <p className="text-sm font-bold text-slate-400">{match.result?.teamAScore ?? "Score unavailable"}</p>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Final</p>
          <p className="mt-2 text-lg font-black text-white">{resultOutcome(match, teams)}</p>
          {winner ? <p className="mt-1 text-sm font-bold text-emerald-200">Winner: {winner.name}</p> : null}
        </div>
        <div className="rounded-lg border border-emerald-300/14 bg-[rgba(255,255,255,0.055)] p-4 lg:text-right">
          <div className="flex items-center gap-3 lg:justify-end">
            <div className="lg:text-right">
              <p className="font-black text-white">{teamB?.name ?? "Team B"}</p>
              <p className="text-sm font-bold text-slate-400">{match.result?.teamBScore ?? "Score unavailable"}</p>
            </div>
            <TeamBadge team={teamB} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatPill label="Status" value="Completed" tone="green" />
        <StatPill label="Won by" value={resultMargin(match).replace("Won by ", "") || "N/A"} tone="amber" />
        <StatPill label="Player of match" value={playerOfMatch?.name ?? "TBA"} tone="blue" />
        <StatPill
          label="Top scorer"
          value={topScorer ? `${getPlayer(topScorer.playerId, players)?.name ?? "Player"} ${topScorer.runs}` : "TBA"}
          tone="green"
        />
      </div>
      <div className="mt-3">
        <StatPill
          label="Top wicket taker"
          value={topWicketTaker ? `${getPlayer(topWicketTaker.playerId, players)?.name ?? "Player"} ${topWicketTaker.wickets}/${topWicketTaker.runs}` : "TBA"}
          tone="red"
        />
      </div>
    </Card>
  );
}

export function PlayoffBracket({ fixtures }: { fixtures: PlayoffFixture[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {fixtures.map((fixture, index) => (
        <article
          key={fixture.id}
          className="glass-row-reveal rounded-lg border border-[rgba(34,197,94,0.22)] bg-[rgba(8,18,16,0.48)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.22)] backdrop-blur-[16px]"
          style={{ animationDelay: `${index * 65}ms` }}
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">{fixture.title}</p>
          <div className="mt-4 grid gap-2">
            <BracketTeam team={fixture.teamA} fallback={fixture.title === "Qualifier 2" ? "Loser Q1" : fixture.title === "Final" ? "Winner Q1" : "TBA"} />
            <span className="text-center text-xs font-black uppercase tracking-[0.14em] text-slate-400">vs</span>
            <BracketTeam team={fixture.teamB} fallback={fixture.title === "Qualifier 2" ? "Winner Eliminator" : fixture.title === "Final" ? "Winner Q2" : "TBA"} />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-300">{fixture.detail}</p>
        </article>
      ))}
    </div>
  );
}

function BracketTeam({ team, fallback }: { team?: Team; fallback: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-300/12 bg-[rgba(255,255,255,0.055)] px-3 py-2">
      {team ? <TeamBadge team={team} size="sm" /> : null}
      <span className="font-black text-white">{team?.name ?? fallback}</span>
    </div>
  );
}

export function LiveScorePanel({ match, teams, players, showMatchLink = true }: { match?: Match; teams: Team[]; players: Player[]; showMatchLink?: boolean }) {
  if (match?.status === "completed") {
    return <CompletedMatchSummary match={match} teams={teams} players={players} />;
  }

  if (!match?.live) {
    return (
      <Card>
        <StatusBadge status={match?.status ?? "upcoming"} />
        <h2 className="mt-3 text-2xl font-black text-white">No live match right now</h2>
        <p className="mt-2 text-sm text-slate-400">Live ball-by-ball updates will appear here when scoring starts.</p>
      </Card>
    );
  }

  const live = match.live;
  const currentInnings = match.innings.find((innings) => innings.teamId === live.battingTeamId);
  const battingTeam = getTeam(live.battingTeamId, teams);
  const bowlingTeam = getTeam(live.bowlingTeamId, teams);
  const striker = getPlayer(live.strikerId, players);
  const nonStriker = getPlayer(live.nonStrikerId, players);
  const bowler = getPlayer(live.bowlerId, players);
  const strikerLine = currentInnings?.batting.find((line) => line.playerId === live.strikerId);
  const nonStrikerLine = currentInnings?.batting.find((line) => line.playerId === live.nonStrikerId);
  const bowlerLine = currentInnings?.bowling.find((line) => line.playerId === live.bowlerId);
  const crr = calculateEconomy(live.runs, live.balls).toFixed(2);
  const remainingRuns = live.target && live.inningsNumber >= 2 ? Math.max(live.target - live.runs, 0) : undefined;
  const remainingBalls = live.target && live.inningsNumber >= 2 ? Math.max(120 - live.balls, 0) : undefined;
  const rrrValue = calculateRequiredRunRate(live);
  const rrr = rrrValue === undefined ? undefined : rrrValue === Infinity ? "Inf" : rrrValue.toFixed(2);
  const recentLegalBalls = live.commentary
    .filter((event) => event.type !== "wide" && event.type !== "no-ball")
    .slice(0, 6)
    .reverse()
    .map((event) => normalizeBallLabel(event.label));
  const displayBalls = recentLegalBalls.length ? recentLegalBalls : live.lastSix.map(normalizeBallLabel);
  const noBallText = live.balls > 0 ? "Recent ball history unavailable" : "Waiting for first ball";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="scoreboard-card mx-auto w-full max-w-3xl min-w-0 overflow-hidden rounded-3xl border border-[rgba(34,197,94,0.22)] bg-[rgba(8,18,16,0.48)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-[20px] sm:p-5 lg:p-6 xl:max-w-4xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status="live" />
        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{match.matchNumber}</span>
      </div>
      <div className="mt-5 space-y-4">
        <div className="score-center flex flex-col items-center justify-center rounded-2xl border border-emerald-300/18 bg-[rgba(255,255,255,0.06)] px-4 py-4 text-center shadow-[0_0_36px_rgba(34,197,94,0.14)]">
            <p className="score-number score-flash score-pop whitespace-nowrap text-5xl font-black sm:text-7xl lg:text-8xl">
            {live.runs}/{live.wickets}
          </p>
          <p className="whitespace-nowrap text-base font-black text-slate-300">
            {ballsToOvers(live.balls)} ov
          </p>
          {live.target ? (
            <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
              Target {live.target}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="score-section-batting score-team-card min-w-0 rounded-2xl border border-emerald-300/18 bg-[rgba(34,197,94,0.11)] p-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex-shrink-0">
                <TeamBadge team={battingTeam} size="lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
                  Batting
                </p>
                <h2
                  className="score-team-name text-xl font-black leading-tight text-slate-950 dark:text-white"
                  style={{ wordBreak: "normal", overflowWrap: "normal", hyphens: "none" }}
                >
                  {battingTeam?.name}
                </h2>
              </div>
            </div>
          </div>

          <div className="score-section-bowling score-team-card min-w-0 rounded-2xl border border-sky-300/16 bg-[rgba(56,189,248,0.09)] p-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-800 dark:text-blue-300">
                  Bowling
                </p>
                <h2
                  className="score-team-name text-xl font-black leading-tight text-slate-950 dark:text-white"
                  style={{ wordBreak: "normal", overflowWrap: "normal", hyphens: "none" }}
                >
                  {bowlingTeam?.name}
                </h2>
              </div>
              <div className="flex-shrink-0">
                <TeamBadge team={bowlingTeam} size="lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill label="CRR" value={crr} tone="green" />
        <StatPill label="RRR" value={rrr ?? "-"} tone="amber" />
        <StatPill label="Partnership" value={`${live.partnershipRuns} (${live.partnershipBalls})`} tone="blue" />
        <StatPill label="Last wicket" value={live.lastWicket ?? "-"} tone="red" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 overflow-x-auto rounded-lg border border-emerald-300/16 bg-[rgba(255,255,255,0.055)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[rgba(34,197,94,0.12)] text-xs uppercase tracking-[0.14em] text-emerald-100">
              <tr><th className="px-3 py-2">Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
            </thead>
            <tbody>
              {[{ player: striker, line: strikerLine, key: "striker" }, { player: nonStriker, line: nonStrikerLine, key: "non-striker" }].map(({ player, line, key }) => (
                <tr key={player?.id ?? key} className="border-t border-emerald-300/10 text-slate-200">
                  <td className="px-3 py-2 font-black text-white">{player?.name ?? "TBA"}</td>
                  <td>{line?.runs ?? 0}</td>
                  <td>{line?.balls ?? 0}</td>
                  <td>{line?.fours ?? 0}</td>
                  <td>{line?.sixes ?? 0}</td>
                  <td>{calculateStrikeRate(line?.runs ?? 0, line?.balls ?? 0).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="min-w-0 overflow-x-auto rounded-lg border border-emerald-300/16 bg-[rgba(255,255,255,0.055)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[rgba(34,197,94,0.12)] text-xs uppercase tracking-[0.14em] text-emerald-100">
              <tr><th className="px-3 py-2">Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr>
            </thead>
            <tbody>
              <tr className="border-t border-emerald-300/10 text-slate-200">
                <td className="px-3 py-2 font-black text-white">{bowler?.name ?? "TBA"}</td>
                <td>{ballsToOvers(bowlerLine?.balls ?? 0)}</td>
                <td>{bowlerLine?.maidens ?? 0}</td>
                <td>{bowlerLine?.runs ?? 0}</td>
                <td>{bowlerLine?.wickets ?? 0}</td>
                <td>{calculateEconomy(bowlerLine?.runs ?? 0, bowlerLine?.balls ?? 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-300/16 bg-[rgba(255,255,255,0.055)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-black uppercase tracking-[0.16em] text-slate-300">Last 6</span>
          {displayBalls.length ? displayBalls.map((ball, index) => (
            <span
              key={`${ball}-${index}`}
              className={cn("last-ball-chip grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs font-black", ballBadgeClass(ball))}
              style={{ animationDelay: `${index * 35}ms` }}
            >
              {ball}
            </span>
          )) : <span className="text-sm font-bold text-slate-400">{noBallText}</span>}
          <span className={cn("w-full rounded-lg px-3 py-2 text-sm font-black sm:ml-auto sm:w-auto", rrr && remainingRuns !== undefined && remainingBalls !== undefined ? "border border-amber-300/25 bg-amber-400/10 text-amber-200" : "text-slate-300")}>
            {rrr && remainingRuns !== undefined && remainingBalls !== undefined ? `Need ${remainingRuns} from ${remainingBalls} balls` : `Fall: ${currentInnings?.fallOfWickets.join(", ") || "-"}`}
          </span>
        </div>
        {live.commentary.length ? (
          <div className="broadcast-commentary mt-3 rounded-lg border border-emerald-300/16 border-l-4 border-l-emerald-400 bg-emerald-400/10 px-3 py-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Latest commentary</p>
            <div className="mt-2 grid gap-2">
              {live.commentary.slice(0, 3).map((event) => (
                <p key={event.id} className={cn("text-sm font-semibold text-slate-300", event.wicket && "text-red-200", event.label === "4" && "text-emerald-200", event.label === "6" && "text-amber-200")}>
                  <span className="font-black">{event.over}.{event.ball}</span> - {event.label} - {event.commentary}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</span>
      </div>
      {showMatchLink ? (
        <Link href={`/matches/${match.id}`} className="secondary-button mt-4 inline-flex px-4 py-3 text-sm font-black">
          View Match Center
        </Link>
      ) : null}
    </motion.section>
  );
}

export function ScorecardTables({ match, teams, players }: { match: Match; teams: Team[]; players: Player[] }) {
  return (
    <div className="grid gap-5">
      {match.innings.map((innings) => {
        const team = getTeam(innings.teamId, teams);
        return (
          <section key={innings.teamId} className="broadcast-card rounded-lg p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-black text-white">{team?.name} {scoreText(innings.runs, innings.wickets, innings.balls)}</h3>
              <span className="text-sm font-bold text-slate-400">Extras {innings.extras}</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-emerald-400/10 text-xs uppercase tracking-[0.14em] text-emerald-200">
                    <tr><th className="px-3 py-2">Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
                  </thead>
                  <tbody>
                    {innings.batting.length ? innings.batting.map((line) => (
                      <tr key={line.playerId} className={cn("border-t border-emerald-300/10", !line.out && "bg-emerald-400/5")}>
                        <td className="px-3 py-2 font-bold text-white">
                          {getPlayer(line.playerId, players)?.name ?? "Player"} {line.out ? <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-xs text-red-300">out</span> : <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs text-emerald-300">not out</span>}
                        </td>
                        <td>{line.runs}</td><td>{line.balls}</td><td>{line.fours}</td><td>{line.sixes}</td><td>{calculateStrikeRate(line.runs, line.balls).toFixed(1)}</td>
                      </tr>
                    )) : <tr><td className="px-3 py-3 text-slate-400" colSpan={6}>Scorecard will populate from live scoring.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-emerald-400/10 text-xs uppercase tracking-[0.14em] text-emerald-200">
                    <tr><th className="px-3 py-2">Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr>
                  </thead>
                  <tbody>
                    {innings.bowling.length ? innings.bowling.map((line) => (
                      <tr key={line.playerId} className="border-t border-emerald-300/10">
                        <td className="px-3 py-2 font-bold text-white">{getPlayer(line.playerId, players)?.name ?? "Player"}</td>
                        <td>{ballsToOvers(line.balls)}</td><td>{line.maidens}</td><td>{line.runs}</td><td>{line.wickets}</td><td>{calculateEconomy(line.runs, line.balls).toFixed(2)}</td>
                      </tr>
                    )) : <tr><td className="px-3 py-3 text-slate-400" colSpan={6}>Bowling figures will appear after scoring starts.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="font-black text-slate-400">Fall of wickets</span>
              {innings.fallOfWickets.length ? innings.fallOfWickets.map((fall, index) => (
                <span key={`${fall}-${index}`} className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 font-bold text-red-200">{fall}</span>
              )) : <span className="text-slate-400">-</span>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
