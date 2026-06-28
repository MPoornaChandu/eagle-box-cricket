"use client";

import { useState } from "react";
import Link from "next/link";
import { LeagueShell } from "@/components/league/LeagueShell";
import { LiveScorePanel, MatchCard, ScorecardTables } from "@/components/league/LeagueCards";
import { useLeagueData } from "@/components/league/useLeagueData";
import { getMatchTeams, playersForTeam } from "@/lib/leagueStorage";
import { cn } from "@/lib/utils";

const tabs = ["Live", "Scorecard", "Commentary", "Playing XI", "Match Info"] as const;

export default function LivePage() {
  const { teams, players, matches, liveMatch } = useLeagueData();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Live");
  const upcoming = matches.filter((match) => match.status === "upcoming").slice(0, 3);
  const matchTeams = liveMatch ? getMatchTeams(liveMatch, teams) : { teamA: undefined, teamB: undefined };

  return (
    <LeagueShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">Live score</p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Live Scorecard</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Updates live from admin scoring through Supabase Realtime, with local fallback refresh for demo mode.</p>

        <div className="mt-6 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("secondary-button shrink-0 px-4 py-2 text-sm font-black", activeTab === tab && "border-emerald-300 bg-emerald-50 text-emerald-800")}>
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "Live" ? <LiveScorePanel match={liveMatch} teams={teams} players={players} /> : null}
          {activeTab === "Scorecard" && liveMatch ? <ScorecardTables match={liveMatch} teams={teams} players={players} /> : null}
          {activeTab === "Commentary" ? (
            <section className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-black text-white">Recent commentary</h2>
              <div className="mt-4 grid gap-3">
                {(liveMatch?.live?.commentary ?? []).length ? liveMatch?.live?.commentary.slice(0, 20).map((ball) => (
                  <div key={ball.id} className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-emerald-800">{ball.label}</span>
                    <div>
                      <p className="font-bold text-white">{ball.over}.{ball.ball}</p>
                      <p className="text-sm text-slate-400">{ball.commentary}</p>
                    </div>
                  </div>
                )) : <p className="text-slate-400">No live commentary yet.</p>}
              </div>
            </section>
          ) : null}
          {activeTab === "Playing XI" && liveMatch ? (
            <section className="grid gap-5 lg:grid-cols-2">
              {[{ team: matchTeams.teamA, squad: playersForTeam(liveMatch.teamAId, players) }, { team: matchTeams.teamB, squad: playersForTeam(liveMatch.teamBId, players) }].map((group) => (
                <div key={group.team?.id} className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black text-white">{group.team?.name}</h2>
                  <div className="mt-4 grid gap-2">
                    {group.squad.slice(0, 11).map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-bold text-white">{player.name}</span>
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                          {player.name === group.team?.captain ? "Captain" : index === 3 ? "WK" : player.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
          {activeTab === "Match Info" && liveMatch ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <InfoBox label="Venue" value={liveMatch.venue} />
              <InfoBox label="Date" value={new Date(liveMatch.dateTime).toLocaleDateString()} />
              <InfoBox label="Time" value={new Date(liveMatch.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              <InfoBox label="Toss" value={liveMatch.tossWinnerId ? `${liveMatch.tossWinnerId === liveMatch.teamAId ? matchTeams.teamA?.name : matchTeams.teamB?.name} chose ${liveMatch.tossDecision}` : "TBA"} />
              <InfoBox label="Umpires" value={liveMatch.umpires ?? "TBA"} />
              <InfoBox label="Match type" value={liveMatch.matchType} />
            </section>
          ) : null}
        </div>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">Next fixtures</h2>
            <Link href="/fixtures" className="secondary-button px-4 py-2 text-sm font-black">View Fixtures</Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {upcoming.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
          </div>
        </section>
      </section>
    </LeagueShell>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}
