"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import type { Player, PlayerRole, Team } from "@/lib/leagueTypes";
import { addPlayer, deletePlayer, getPlayers, getTeam, getTeams, initials, updatePlayer } from "@/lib/leagueStorage";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/liveScore";

const roles: PlayerRole[] = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];
const emptyForm = {
  name: "",
  teamId: "",
  role: "Batter" as PlayerRole,
  battingStyle: "Right hand",
  bowlingStyle: "Right arm pace",
  jerseyNumber: 1,
  image: "",
  dateOfBirth: "",
  nationality: "Indian",
  bio: ""
};

export default function AdminPlayersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    const nextTeams = getTeams();
    setTeams(nextTeams);
    setPlayers(getPlayers());
    setForm((current) => current.teamId ? current : { ...current, teamId: nextTeams[0]?.id ?? "" });
  };
  useEffect(load, []);

  const syncPlayerToSupabase = async (player: Player) => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error: supabaseError } = await supabase.from("players").upsert(
      {
        app_id: player.id,
        team_id: null,
        name: player.name,
        role: player.role,
        batting_style: player.battingStyle,
        bowling_style: player.bowlingStyle,
        jersey_number: player.jerseyNumber,
        photo_url: player.image,
        bio: player.bio ?? null,
        payload: player,
        updated_at: new Date().toISOString()
      },
      { onConflict: "app_id" }
    );
    if (supabaseError) {
      console.error("Supabase player sync error:", formatSupabaseError(supabaseError), supabaseError);
      throw new Error(formatSupabaseError(supabaseError));
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.name || !form.teamId) return;
    try {
      const payload = { ...form, jerseyNumber: Number(form.jerseyNumber), image: form.image || initials(form.name) };
      const player = editingId
        ? updatePlayer(editingId, payload).find((item) => item.id === editingId)
        : addPlayer(payload);
      if (player) await syncPlayerToSupabase(player);
      setForm({ ...emptyForm, teamId: teams[0]?.id ?? "" });
      setEditingId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Player could not be saved.");
      load();
    }
  };

  const edit = (player: Player) => {
    setEditingId(player.id);
    setForm({
      name: player.name,
      teamId: player.teamId,
      role: player.role,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      jerseyNumber: player.jerseyNumber,
      image: player.image,
      dateOfBirth: player.dateOfBirth ?? "",
      nationality: player.nationality ?? "Indian",
      bio: player.bio ?? ""
    });
  };

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Players</p>
      <h1 className="mt-2 text-4xl font-black text-white">Manage Players</h1>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={submit} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-2xl font-black text-white">{editingId ? "Edit Player" : "Add Player"}</h2>
          <div className="mt-4 grid gap-4">
            <Field label="Player name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <label className="field-label">Team<select value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value })}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label className="field-label">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as PlayerRole })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
            <Field label="Batting style" value={form.battingStyle} onChange={(value) => setForm({ ...form, battingStyle: value })} />
            <Field label="Bowling style" value={form.bowlingStyle} onChange={(value) => setForm({ ...form, bowlingStyle: value })} />
            <label className="field-label">Jersey number<input type="number" value={form.jerseyNumber} onChange={(event) => setForm({ ...form, jerseyNumber: Number(event.target.value) })} /></label>
            <Field label="Image URL or avatar text" value={form.image} onChange={(value) => setForm({ ...form, image: value })} />
            <label className="field-label">Date of birth<input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></label>
            <Field label="Nationality" value={form.nationality} onChange={(value) => setForm({ ...form, nationality: value })} />
            <label className="field-label">Bio<textarea rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
          </div>
          {error ? <p className="mt-3 text-sm font-bold text-red-200">{error}</p> : null}
          <button type="submit" className="premium-button mt-5 inline-flex items-center gap-2 px-4 py-3 text-sm">{editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingId ? "Save Player" : "Add Player"}</button>
        </form>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.15em] text-slate-400"><tr><th className="px-4 py-3">Player</th><th className="px-4 py-3">Team</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-black text-white">{player.name}</td>
                  <td className="px-4 py-3 text-slate-300">{getTeam(player.teamId, teams)?.shortCode}</td>
                  <td className="px-4 py-3 text-slate-300">{player.role}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => edit(player)} className="secondary-button px-3 py-2 text-xs font-black">Edit</button><button type="button" onClick={() => { deletePlayer(player.id); load(); }} className="danger-button px-3 py-2 text-xs font-black"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field-label">{label}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
