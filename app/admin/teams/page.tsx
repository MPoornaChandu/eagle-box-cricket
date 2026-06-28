"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import { TeamBadge } from "@/components/league/LeagueCards";
import type { Team } from "@/lib/leagueTypes";
import { addTeam, deleteTeam, getTeams, initials, updateTeam } from "@/lib/leagueStorage";

const emptyForm = { name: "", shortCode: "", captain: "", logo: "", primaryColor: "#16a34a" };

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const load = () => setTeams(getTeams());
  useEffect(load, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.shortCode || !form.captain) return;
    if (editingId) {
      updateTeam(editingId, { ...form, logo: form.logo || initials(form.name) });
    } else {
      addTeam({ ...form, logo: form.logo || initials(form.name) });
    }
    setForm(emptyForm);
    setEditingId("");
    load();
  };

  const edit = (team: Team) => {
    setEditingId(team.id);
    setForm({ name: team.name, shortCode: team.shortCode, captain: team.captain, logo: team.logo, primaryColor: team.primaryColor });
  };

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Teams</p>
      <h1 className="mt-2 text-4xl font-black text-white">Manage Teams</h1>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={submit} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-2xl font-black text-white">{editingId ? "Edit Team" : "Add Team"}</h2>
          <div className="mt-4 grid gap-4">
            <Field label="Team name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <Field label="Short code" value={form.shortCode} onChange={(value) => setForm({ ...form, shortCode: value.toUpperCase().slice(0, 4) })} />
            <Field label="Captain" value={form.captain} onChange={(value) => setForm({ ...form, captain: value })} />
            <Field label="Logo URL or avatar text" value={form.logo} onChange={(value) => setForm({ ...form, logo: value })} />
            <label className="field-label">Primary color<input type="color" value={form.primaryColor} onChange={(event) => setForm({ ...form, primaryColor: event.target.value })} /></label>
          </div>
          <button type="submit" className="premium-button mt-5 inline-flex items-center gap-2 px-4 py-3 text-sm">
            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Save Team" : "Add Team"}
          </button>
        </form>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.15em] text-slate-400">
              <tr><th className="px-4 py-3">Team</th><th className="px-4 py-3">Captain</th><th className="px-4 py-3">Record</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-t border-white/10">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><TeamBadge team={team} size="sm" /><span className="font-black text-white">{team.name}</span></div></td>
                  <td className="px-4 py-3 text-slate-300">{team.captain}</td>
                  <td className="px-4 py-3 text-slate-300">{team.matches}M / {team.wins}W</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => edit(team)} className="secondary-button px-3 py-2 text-xs font-black">Edit</button><button type="button" onClick={() => { deleteTeam(team.id); load(); }} className="danger-button px-3 py-2 text-xs font-black"><Trash2 className="h-4 w-4" /></button></div></td>
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
