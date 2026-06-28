"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import type { Match, Player, ResultType, Team } from "@/lib/leagueTypes";
import { completeMatch, getMatches, getPlayers, getTeam, getTeams, oversToBalls } from "@/lib/leagueStorage";

export default function AdminResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState("");
  const [resultType, setResultType] = useState<ResultType>("team-a");
  const [form, setForm] = useState({ aRuns: 0, aWickets: 0, aOvers: "20.0", bRuns: 0, bWickets: 0, bOvers: "20.0", playerOfMatch: "", notes: "" });
  const [error, setError] = useState("");

  const load = () => {
    const nextTeams = getTeams();
    const nextMatches = getMatches();
    setTeams(nextTeams);
    setPlayers(getPlayers());
    setMatches(nextMatches);
    const first = nextMatches[0];
    setMatchId((current) => current || first?.id || "");
  };
  useEffect(load, []);

  const selected = matches.find((match) => match.id === matchId);
  const eligiblePlayers = selected ? players.filter((player) => player.teamId === selected.teamAId || player.teamId === selected.teamBId) : [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      if (!matchId) throw new Error("Select a match.");
      if ([form.aRuns, form.aWickets, form.bRuns, form.bWickets].some((value) => Number(value) < 0)) throw new Error("Scores cannot be negative.");
      completeMatch(
        matchId,
        resultType,
        [Number(form.aRuns), Number(form.aWickets), oversToBalls(form.aOvers)],
        [Number(form.bRuns), Number(form.bWickets), oversToBalls(form.bOvers)],
        form.playerOfMatch || undefined,
        form.notes
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Result could not be saved.");
    }
  };

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Results</p>
      <h1 className="mt-2 text-4xl font-black text-white">Enter Result</h1>
      <form onSubmit={submit} className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-label">Match<select value={matchId} onChange={(event) => setMatchId(event.target.value)}>{matches.map((match) => <option key={match.id} value={match.id}>{match.matchNumber} - {getTeam(match.teamAId, teams)?.shortCode} vs {getTeam(match.teamBId, teams)?.shortCode}</option>)}</select></label>
          <label className="field-label">Result type<select value={resultType} onChange={(event) => setResultType(event.target.value as ResultType)}>
            <option value="team-a">{selected ? `${getTeam(selected.teamAId, teams)?.name} won` : "Team A won"}</option>
            <option value="team-b">{selected ? `${getTeam(selected.teamBId, teams)?.name} won` : "Team B won"}</option>
            <option value="no-result">No result</option>
            <option value="tie">Tie</option>
          </select></label>
          <label className="field-label">Team A runs<input type="number" value={form.aRuns} onChange={(event) => setForm({ ...form, aRuns: Number(event.target.value) })} /></label>
          <label className="field-label">Team A wickets<input type="number" value={form.aWickets} onChange={(event) => setForm({ ...form, aWickets: Number(event.target.value) })} /></label>
          <label className="field-label">Team A overs<input value={form.aOvers} onChange={(event) => setForm({ ...form, aOvers: event.target.value })} /></label>
          <label className="field-label">Team B runs<input type="number" value={form.bRuns} onChange={(event) => setForm({ ...form, bRuns: Number(event.target.value) })} /></label>
          <label className="field-label">Team B wickets<input type="number" value={form.bWickets} onChange={(event) => setForm({ ...form, bWickets: Number(event.target.value) })} /></label>
          <label className="field-label">Team B overs<input value={form.bOvers} onChange={(event) => setForm({ ...form, bOvers: event.target.value })} /></label>
          <label className="field-label">Player of match<select value={form.playerOfMatch} onChange={(event) => setForm({ ...form, playerOfMatch: event.target.value })}><option value="">Optional</option>{eligiblePlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
          <label className="field-label md:col-span-2">Notes<textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        </div>
        {error ? <p className="mt-4 text-sm font-bold text-red-200">{error}</p> : null}
        <button type="submit" className="premium-button mt-5 inline-flex items-center gap-2 px-4 py-3 text-sm"><Trophy className="h-4 w-4" />Complete Match</button>
      </form>
    </AdminShell>
  );
}
