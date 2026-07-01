"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LeagueShell } from "@/components/league/LeagueShell";
import { LiveScorePanel, ScorecardTables, StatusBadge, TeamBadge } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { ballsToOvers, getMatchTeams, getPlayer, playersForTeam } from "@/lib/leagueStorage";
import { cn } from "@/lib/utils";

const tabs = ["Live", "Scorecard", "Commentary", "Playing XI", "Match Info"] as const;

export default function MatchDetailsPage() {
  const params = useParams<{ id: string }>();
  const { teams, players, matches } = useLeagueData();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Live");
  const match = matches.find((item) => item.id === params.id);

  const matchTeams = useMemo(() => (match ? getMatchTeams(match, teams) : { teamA: undefined, teamB: undefined }), [match, teams]);

  useEffect(() => {
    if (match?.status === "completed") setActiveTab("Scorecard");
  }, [match?.id, match?.status]);

  if (!match) {
    return (
      <LeagueShell>
        <main className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
          <section className="sport-card mx-auto max-w-xl rounded-lg border border-white/10 bg-white/[0.055] p-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Match center</p>
            <h1 className="mt-3 text-3xl font-black text-white">Match not found</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">This match may have been removed or the link is incorrect. Head back to the latest fixtures or results.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/fixtures" className="secondary-button px-4 py-2 text-sm font-black">Back to Fixtures</Link>
              <Link href="/results" className="premium-button px-4 py-2 text-sm">Back to Results</Link>
            </div>
          </section>
        </main>
      </LeagueShell>
    );
  }

  const teamAPlayers = playersForTeam(match.teamAId, players).filter((player) => player.name.trim());
  const teamBPlayers = playersForTeam(match.teamBId, players).filter((player) => player.name.trim());
  const live = match.live;

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <Link href={match.status === "completed" ? "/results" : "/fixtures"} className="secondary-button mb-4 inline-flex px-4 py-2 text-sm font-black">
          {match.status === "completed" ? "Back to Results" : "Back to Fixtures"}
        </Link>
        <div className="broadcast-card sport-card rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={match.status} />
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{match.matchNumber}</span>
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0">
              <TeamBadge team={matchTeams.teamA} size="lg" />
              <h1 className="mt-3 truncate text-2xl font-black text-white">{matchTeams.teamA?.name}</h1>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-amber-100">VS</span>
            <div className="min-w-0 text-right">
              <div className="flex justify-end"><TeamBadge team={matchTeams.teamB} size="lg" /></div>
              <h1 className="mt-3 truncate text-2xl font-black text-white">{matchTeams.teamB?.name}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">{new Date(match.dateTime).toLocaleString()} - {match.venue}</p>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-emerald-300/10 pb-2">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("secondary-button shrink-0 px-4 py-2 text-sm font-black", activeTab === tab && "border-emerald-300/60 bg-emerald-400/16 text-emerald-100 shadow-[inset_0_-2px_0_var(--accent)]")}>
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "Live" ? (
            <div className="grid gap-5">
              <LiveScorePanel match={match} teams={teams} players={players} showMatchLink={false} />
              {match.status === "live" ? (
                <section className="grid gap-3 md:grid-cols-3">
                  <InfoBox label="Partnership" value={live ? `${live.partnershipRuns} (${live.partnershipBalls})` : "Not live"} />
                  <InfoBox label="Last wicket" value={live?.lastWicket ?? "None"} />
                  <InfoBox label="Required rate" value={live?.target ? "Chase active" : "First innings or target pending"} />
                </section>
              ) : null}
            </div>
          ) : null}

          {activeTab === "Scorecard" ? <ScorecardTables match={match} teams={teams} players={players} /> : null}

          {activeTab === "Commentary" ? (
            <section className="broadcast-card rounded-lg p-5">
              <h2 className="text-2xl font-black text-white">Commentary</h2>
              <div className="mt-4 grid gap-3">
                {(match.live?.commentary ?? []).length ? match.live?.commentary.map((ball) => (
                  <div key={ball.id} className={cn("rounded-lg border border-white/10 bg-slate-950/38 p-3", ball.wicket && "border-red-300/35 bg-red-500/10", ball.label === "4" && "border-emerald-300/35 bg-emerald-500/10", ball.label === "6" && "border-amber-300/35 bg-amber-500/10")}>
                    <p className="font-black text-white">{ball.over}.{ball.ball} - {ball.label}</p>
                    <p className="text-sm text-slate-400">{ball.commentary}</p>
                  </div>
                )) : (
                  <p className="text-slate-400">Ball-by-ball updates will appear after live scoring starts.</p>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "Playing XI" ? (
            <section className="grid gap-5 lg:grid-cols-2">
              {[{ team: matchTeams.teamA, squad: teamAPlayers }, { team: matchTeams.teamB, squad: teamBPlayers }].map((group) => (
                <div key={group.team?.id} className="broadcast-card rounded-lg p-5">
                  <h2 className="text-2xl font-black text-white">{group.team?.name}</h2>
                  <div className="mt-4 grid gap-2">
                    {group.squad.length ? group.squad.slice(0, 11).map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between rounded-lg bg-slate-950/38 px-3 py-2">
                        <span className="font-bold text-white">{player.name}</span>
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                          {player.name === group.team?.captain ? "Captain" : index === 3 ? "WK" : player.role}
                        </span>
                      </div>
                    )) : (
                      <div className="rounded-lg border border-emerald-300/16 bg-emerald-400/10 p-4">
                        <p className="font-black text-white">Squad not announced yet</p>
                        <p className="mt-1 text-sm text-slate-300">Playing XI will appear before the match starts.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {activeTab === "Match Info" ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <InfoBox label="Venue" value={match.venue} />
              <InfoBox label="Date" value={new Date(match.dateTime).toLocaleDateString()} />
              <InfoBox label="Time" value={new Date(match.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              <InfoBox label="Toss" value={match.tossWinnerId ? `${getMatchTeams(match, teams).teamA?.id === match.tossWinnerId ? matchTeams.teamA?.name : matchTeams.teamB?.name} chose ${match.tossDecision}` : "TBA"} />
              <InfoBox label="Umpires" value={match.umpires ?? "TBA"} />
              <InfoBox label="Match type" value={match.matchType} />
              <InfoBox label="Status" value={match.status} />
              <InfoBox label="Overs" value={match.live ? ballsToOvers(match.live.balls) : match.result?.teamAScore ?? "TBA"} />
              <InfoBox label="Player of match" value={match.result?.playerOfMatch ? getPlayer(match.result.playerOfMatch, players)?.name ?? "TBA" : "TBA"} />
            </section>
          ) : null}
        </div>
      </section>
    </LeagueShell>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-lg p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}
