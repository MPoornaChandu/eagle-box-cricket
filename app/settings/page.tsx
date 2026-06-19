"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DatabaseZap, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/ToastProvider";
import { getDataSourceStatus, getTournamentSettings, resetDemoData, updateTournamentSettings } from "@/lib/storage";
import type { TournamentSettingsInput } from "@/lib/types";

const emptyForm: TournamentSettingsInput = {
  tournamentName: "Eagle Box Cricket",
  format: "Round Robin",
  maxTeams: 8,
  pointsPerWin: 2,
  pointsPerTie: 1,
  pointsPerLoss: 0
};

function validate(form: TournamentSettingsInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.tournamentName.trim()) errors.tournamentName = "Tournament name is required.";
  if (form.maxTeams < 2) errors.maxTeams = "Maximum teams must be at least 2.";
  if (form.pointsPerWin < 0) errors.pointsPerWin = "Points per win cannot be negative.";
  if (form.pointsPerTie < 0) errors.pointsPerTie = "Points per tie cannot be negative.";
  if (form.pointsPerLoss < 0) errors.pointsPerLoss = "Points per loss cannot be negative.";
  return errors;
}

export default function SettingsPage() {
  const [form, setForm] = useState<TournamentSettingsInput>(emptyForm);
  const [resetOpen, setResetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const dataSource = getDataSourceStatus();

  useEffect(() => {
    async function loadData() {
      const settings = await getTournamentSettings();
      setForm({
        tournamentName: settings.tournamentName,
        format: settings.format,
        maxTeams: settings.maxTeams,
        pointsPerWin: settings.pointsPerWin,
        pointsPerTie: settings.pointsPerTie,
        pointsPerLoss: settings.pointsPerLoss
      });
      setLoading(false);
    }
    void loadData();
  }, []);

  const errors = useMemo(() => validate(form), [form]);

  const handleChange = (field: keyof TournamentSettingsInput, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "tournamentName" || field === "format" ? value : Number(value)
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(errors).length > 0) return;
    try {
      await updateTournamentSettings(form);
      showToast({ type: "success", title: "Settings saved", description: "Points table will use the updated points values." });
    } catch (error) {
      showToast({
        type: "error",
        title: "Settings not saved",
        description: error instanceof Error ? error.message : "Please try again."
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetDemoData();
      const settings = await getTournamentSettings();
      setForm({
        tournamentName: settings.tournamentName,
        format: settings.format,
        maxTeams: settings.maxTeams,
        pointsPerWin: settings.pointsPerWin,
        pointsPerTie: settings.pointsPerTie,
        pointsPerLoss: settings.pointsPerLoss
      });
      setResetOpen(false);
      showToast({ type: "success", title: "Sample data reset", description: "Teams, fixtures, results, settings, and reports were reloaded." });
    } catch (error) {
      showToast({
        type: "error",
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Please try again."
      });
    }
  };

  return (
    <AppShell adminOnly>
      {loading ? (
        <LoadingSkeleton label="Loading settings" />
      ) : (
        <>
          <PageHeader
            title="Settings"
            breadcrumb="Dashboard / Settings"
            description="Admin-only tournament settings, sync status, and sample data controls."
          />

          <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
            <form onSubmit={handleSubmit} className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Tournament Settings</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label sm:col-span-2">
                  Tournament name <span className="text-red-200">*</span>
                  <input value={form.tournamentName} onChange={(event) => handleChange("tournamentName", event.target.value)} placeholder="Eagle Box Cricket" />
                  {errors.tournamentName ? <span className="text-xs text-red-200">{errors.tournamentName}</span> : null}
                </label>
                <label className="field-label">
                  Format <span className="text-red-200">*</span>
                  <select value={form.format} onChange={(event) => handleChange("format", event.target.value)}>
                    <option value="Round Robin">Round Robin</option>
                    <option value="Knockout">Knockout</option>
                    <option value="Group Stage + Knockout">Group Stage + Knockout</option>
                  </select>
                </label>
                <label className="field-label">
                  Maximum teams <span className="text-red-200">*</span>
                  <input type="number" min="2" value={form.maxTeams} onChange={(event) => handleChange("maxTeams", event.target.value)} placeholder="8" />
                  {errors.maxTeams ? <span className="text-xs text-red-200">{errors.maxTeams}</span> : null}
                </label>
                <label className="field-label">
                  Points per win <span className="text-red-200">*</span>
                  <input type="number" min="0" value={form.pointsPerWin} onChange={(event) => handleChange("pointsPerWin", event.target.value)} placeholder="2" />
                  {errors.pointsPerWin ? <span className="text-xs text-red-200">{errors.pointsPerWin}</span> : null}
                </label>
                <label className="field-label">
                  Points per tie <span className="text-red-200">*</span>
                  <input type="number" min="0" value={form.pointsPerTie} onChange={(event) => handleChange("pointsPerTie", event.target.value)} placeholder="1" />
                  {errors.pointsPerTie ? <span className="text-xs text-red-200">{errors.pointsPerTie}</span> : null}
                </label>
                <label className="field-label">
                  Points per loss <span className="text-red-200">*</span>
                  <input type="number" min="0" value={form.pointsPerLoss} onChange={(event) => handleChange("pointsPerLoss", event.target.value)} placeholder="0" />
                  {errors.pointsPerLoss ? <span className="text-xs text-red-200">{errors.pointsPerLoss}</span> : null}
                </label>
              </div>
              <button type="submit" disabled={Object.keys(errors).length > 0} className="premium-button mt-5 flex items-center gap-2 px-4 py-3">
                <Save className="h-4 w-4" />
                Save Settings
              </button>
            </form>

            <div className="grid gap-6">
              <div className="glass-panel rounded-lg p-5">
                <h2 className="text-xl font-black text-white">Sync Status</h2>
                <p className="mt-3 text-sm font-black text-emerald-100">{dataSource.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{dataSource.description}</p>
              </div>

              <div className="glass-panel rounded-lg p-5">
                <h2 className="text-xl font-black text-white">Reset Sample Data</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Reload the six-team sample tournament dataset in the current storage mode.
                </p>
                <button type="button" onClick={() => setResetOpen(true)} className="danger-button mt-5 flex items-center gap-2 px-4 py-3 text-sm font-black">
                  <DatabaseZap className="h-4 w-4" />
                  Reset Sample Data
                </button>
              </div>
            </div>
          </section>

          <ConfirmDialog
            open={resetOpen}
            title="Are you sure? This will delete all data."
            description="This will delete all teams, fixtures, results, player stats, reports, activity, and settings in the current storage mode, then reload sample data."
            confirmText="Reset"
            tone="danger"
            onClose={() => setResetOpen(false)}
            onConfirm={handleReset}
          />
        </>
      )}
    </AppShell>
  );
}
