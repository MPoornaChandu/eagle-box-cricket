"use client";

import { useEffect, useState } from "react";
import { DatabaseZap, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/league/AdminShell";
import { getMatches, getPlayers, getTeams, resetTournamentData, seedDemoData } from "@/lib/leagueStorage";

const SETTINGS_KEY = "ebc_tournament_settings";
const defaultSettings = {
  tournamentName: "Eagle Box Cricket League",
  seasonLabel: "2026 Season",
  maxOvers: 20
};

export default function AdminSettingsPage() {
  const [summary, setSummary] = useState({ teams: 0, players: 0, matches: 0 });
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState("");
  const load = () => setSummary({ teams: getTeams().length, players: getPlayers().length, matches: getMatches().length });
  useEffect(() => {
    load();
    try {
      const stored = window.localStorage.getItem(SETTINGS_KEY);
      if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) });
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const saveSettings = () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved("Settings saved.");
    window.setTimeout(() => setSaved(""), 2000);
  };

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Settings</p>
      <h1 className="mt-2 text-4xl font-black text-white">Tournament Settings</h1>
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="text-2xl font-black text-white">Tournament profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="field-label">Tournament name<input value={settings.tournamentName} onChange={(event) => setSettings({ ...settings, tournamentName: event.target.value })} /></label>
          <label className="field-label">Current season label<input value={settings.seasonLabel} onChange={(event) => setSettings({ ...settings, seasonLabel: event.target.value })} /></label>
          <label className="field-label">Max overs per match<input type="number" min={1} value={settings.maxOvers} onChange={(event) => setSettings({ ...settings, maxOvers: Number(event.target.value) })} /></label>
        </div>
        <button type="button" onClick={saveSettings} className="premium-button mt-5 px-4 py-3 text-sm">Save Settings</button>
        {saved ? <p className="mt-3 text-sm font-bold text-emerald-200">{saved}</p> : null}
      </section>
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="text-2xl font-black text-white">Demo data</h2>
        <p className="mt-2 text-sm text-slate-400">{summary.teams} teams, {summary.players} players, {summary.matches} matches are available. In Supabase mode, seeding publishes the same dataset to the shared database.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => { seedDemoData(); load(); }} className="secondary-button inline-flex items-center gap-2 px-4 py-3 text-sm font-black"><DatabaseZap className="h-4 w-4" />Seed Demo Data</button>
          <button type="button" onClick={() => { resetTournamentData(); load(); }} className="danger-button inline-flex items-center gap-2 px-4 py-3 text-sm font-black"><RotateCcw className="h-4 w-4" />Reset Data</button>
        </div>
      </section>
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="text-2xl font-black text-white">Admin protection</h2>
        <p className="mt-2 text-sm text-slate-400">Admin access uses Supabase Auth and the admins table. Local demo credentials are available only when Supabase is not configured.</p>
      </section>
    </AdminShell>
  );
}
