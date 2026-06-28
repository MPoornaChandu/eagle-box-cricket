"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import { MatchCard } from "@/components/league/LeagueCards";
import type { Match, MatchStatus, Team } from "@/lib/leagueTypes";
import { addMatch, deleteMatch, getMatches, getTeams, updateMatch } from "@/lib/leagueStorage";

const emptyForm = { teamAId: "", teamBId: "", dateTime: "", venue: "", matchType: "League", status: "upcoming" as MatchStatus };

export default function AdminFixturesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () => {
    const nextTeams = getTeams();
    setTeams(nextTeams);
    setMatches(getMatches());
    setForm((current) => current.teamAId ? current : { ...current, teamAId: nextTeams[0]?.id ?? "", teamBId: nextTeams[1]?.id ?? "" });
  };
  useEffect(load, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      addMatch(form);
      setForm({ ...emptyForm, teamAId: teams[0]?.id ?? "", teamBId: teams[1]?.id ?? "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fixture could not be created.");
    }
  };

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Schedule</p>
      <h1 className="mt-2 text-4xl font-black text-white">Fixtures</h1>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={submit} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-2xl font-black text-white">Create Fixture</h2>
          <div className="mt-4 grid gap-4">
            <label className="field-label">Team A<select value={form.teamAId} onChange={(event) => setForm({ ...form, teamAId: event.target.value })}>{teams.map((team) => <option key={team.id} value={team.id} disabled={team.id === form.teamBId}>{team.name}</option>)}</select></label>
            <label className="field-label">Team B<select value={form.teamBId} onChange={(event) => setForm({ ...form, teamBId: event.target.value })}>{teams.map((team) => <option key={team.id} value={team.id} disabled={team.id === form.teamAId}>{team.name}</option>)}</select></label>
            <label className="field-label">Date/time<input type="datetime-local" value={form.dateTime} onChange={(event) => setForm({ ...form, dateTime: event.target.value })} /></label>
            <label className="field-label">Venue<input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} /></label>
            <label className="field-label">Match type<input value={form.matchType} onChange={(event) => setForm({ ...form, matchType: event.target.value })} /></label>
            <label className="field-label">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MatchStatus })}><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></select></label>
          </div>
          {error ? <p className="mt-3 text-sm font-bold text-red-200">{error}</p> : null}
          <button type="submit" className="premium-button mt-5 inline-flex items-center gap-2 px-4 py-3 text-sm"><CalendarPlus className="h-4 w-4" />Create Fixture</button>
        </form>
        <div className="grid gap-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              teams={teams}
              hrefPrefix="/matches"
              actions={(
                <>
                  {match.status !== "completed" ? (
                    <button type="button" onClick={() => { updateMatch(match.id, { status: "upcoming" }); load(); }} className="secondary-button flex-shrink-0 px-3 py-2 text-xs font-black">
                      Reset
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Delete ${match.matchNumber}`}
                    onClick={() => { deleteMatch(match.id); load(); }}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
