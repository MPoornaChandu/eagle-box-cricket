"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Save, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { TeamCard } from "@/components/TeamCard";
import { useToast } from "@/components/ToastProvider";
import { addTeam, deleteTeam, getFixtures, getTeams, updateTeam } from "@/lib/storage";
import type { Fixture, Team, TeamInput } from "@/lib/types";
import { getFixtureTitle, normalizeShortName } from "@/lib/utils";

const colorPresets = ["#22c55e", "#22d3ee", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];

const emptyTeamForm: TeamInput = {
  name: "",
  shortName: "",
  captain: "",
  contact: "",
  city: "",
  logoColor: colorPresets[0]
};

interface DeleteState {
  team: Team;
  affectedFixtures: Fixture[];
}

function validateTeam(form: TeamInput): string {
  if (!form.name.trim()) return "Team name is required.";
  if (!form.shortName.trim()) return "Short name is required.";
  if (!form.captain.trim()) return "Captain name is required.";
  if (!form.contact.trim()) return "Contact number is required.";
  if (!form.city.trim()) return "City is required.";
  return "";
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [form, setForm] = useState<TeamInput>(emptyTeamForm);
  const [search, setSearch] = useState("");
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState<TeamInput>(emptyTeamForm);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    setTeams(getTeams());
    setFixtures(getFixtures());
  };

  useEffect(() => {
    loadData();
    setLoading(false);
  }, []);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) =>
      [team.name, team.shortName, team.captain, team.city].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [search, teams]);

  const handleFormChange = (field: keyof TeamInput, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "shortName" ? normalizeShortName(value) : value
    }));
    setFormError("");
  };

  const handleEditChange = (field: keyof TeamInput, value: string) => {
    setEditForm((current) => ({
      ...current,
      [field]: field === "shortName" ? normalizeShortName(value) : value
    }));
    setEditError("");
  };

  const handleAddTeam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateTeam(form);
    if (validationError) {
      setFormError(validationError);
      showToast({ type: "error", title: "Team not added", description: validationError });
      return;
    }

    addTeam({
      ...form,
      name: form.name.trim(),
      shortName: normalizeShortName(form.shortName),
      captain: form.captain.trim(),
      contact: form.contact.trim(),
      city: form.city.trim()
    });
    setForm(emptyTeamForm);
    loadData();
    showToast({ type: "success", title: "Team added", description: "Points table refreshed." });
  };

  const openEdit = (team: Team) => {
    setEditTeam(team);
    setEditForm({
      name: team.name,
      shortName: team.shortName,
      captain: team.captain,
      contact: team.contact,
      city: team.city,
      logoColor: team.logoColor
    });
    setEditError("");
  };

  const handleEditTeam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTeam) return;

    const validationError = validateTeam(editForm);
    if (validationError) {
      setEditError(validationError);
      showToast({ type: "error", title: "Team not updated", description: validationError });
      return;
    }

    updateTeam(editTeam.id, {
      ...editForm,
      name: editForm.name.trim(),
      shortName: normalizeShortName(editForm.shortName),
      captain: editForm.captain.trim(),
      contact: editForm.contact.trim(),
      city: editForm.city.trim()
    });
    setEditTeam(null);
    loadData();
    showToast({ type: "success", title: "Team updated", description: "Team details saved." });
  };

  const requestDelete = (team: Team) => {
    const affectedFixtures = fixtures.filter(
      (fixture) => fixture.teamAId === team.id || fixture.teamBId === team.id
    );
    setDeleteState({ team, affectedFixtures });
  };

  const confirmDelete = () => {
    if (!deleteState) return;
    const fixtureCount = deleteState.affectedFixtures.length;
    deleteTeam(deleteState.team.id);
    setDeleteState(null);
    loadData();
    showToast({
      type: "success",
      title: "Team deleted",
      description:
        fixtureCount > 0
          ? `${fixtureCount} related fixture${fixtureCount > 1 ? "s were" : " was"} removed.`
          : "No fixtures were affected."
    });
  };

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading teams" />
      ) : (
        <>
          <PageHeader
            title="Teams"
            breadcrumb="Dashboard / Teams"
            description="Manage tournament teams, captains, cities, and branded logo colors."
          />

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
            <form onSubmit={handleAddTeam} className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Add Team</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label sm:col-span-2">
                  Team name
                  <input value={form.name} onChange={(event) => handleFormChange("name", event.target.value)} />
                </label>
                <label className="field-label">
                  Short name
                  <input value={form.shortName} onChange={(event) => handleFormChange("shortName", event.target.value)} />
                </label>
                <label className="field-label">
                  Captain
                  <input value={form.captain} onChange={(event) => handleFormChange("captain", event.target.value)} />
                </label>
                <label className="field-label">
                  Contact
                  <input value={form.contact} onChange={(event) => handleFormChange("contact", event.target.value)} />
                </label>
                <label className="field-label">
                  City
                  <input value={form.city} onChange={(event) => handleFormChange("city", event.target.value)} />
                </label>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-black text-slate-200">Logo color</p>
                <div className="flex flex-wrap items-center gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Choose ${color}`}
                      onClick={() => handleFormChange("logoColor", color)}
                      className="h-9 w-9 rounded-lg border border-white/20"
                      style={{
                        background: color,
                        boxShadow: form.logoColor === color ? "0 0 0 3px rgba(34,211,238,0.35)" : undefined
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.logoColor}
                    onChange={(event) => handleFormChange("logoColor", event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg p-1"
                  />
                </div>
              </div>

              {formError ? <p className="mt-4 text-sm font-semibold text-red-200">{formError}</p> : null}

              <button type="submit" className="premium-button mt-5 flex items-center gap-2 px-4 py-3">
                <Plus className="h-4 w-4" />
                Add Team
              </button>
            </form>

            <div>
              <div className="glass-panel mb-5 rounded-lg p-4">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search teams, captains, short names, or cities"
                    className="pl-10"
                  />
                </label>
              </div>

              {filteredTeams.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredTeams.map((team) => (
                    <TeamCard key={team.id} team={team} onEdit={openEdit} onDelete={requestDelete} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={teams.length ? "No teams match your search" : "No teams yet"}
                  description={teams.length ? "Try another search term." : "Add a team or seed demo data from the dashboard."}
                />
              )}
            </div>
          </section>

          <AnimatePresence>
            {editTeam ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/78 p-4 backdrop-blur-md"
              >
                <motion.form
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  onSubmit={handleEditTeam}
                  className="glass-panel w-full max-w-2xl rounded-lg p-5"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-black text-white">Edit Team</h2>
                    <button
                      type="button"
                      aria-label="Close edit modal"
                      onClick={() => setEditTeam(null)}
                      className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field-label sm:col-span-2">
                      Team name
                      <input value={editForm.name} onChange={(event) => handleEditChange("name", event.target.value)} />
                    </label>
                    <label className="field-label">
                      Short name
                      <input value={editForm.shortName} onChange={(event) => handleEditChange("shortName", event.target.value)} />
                    </label>
                    <label className="field-label">
                      Captain
                      <input value={editForm.captain} onChange={(event) => handleEditChange("captain", event.target.value)} />
                    </label>
                    <label className="field-label">
                      Contact
                      <input value={editForm.contact} onChange={(event) => handleEditChange("contact", event.target.value)} />
                    </label>
                    <label className="field-label">
                      City
                      <input value={editForm.city} onChange={(event) => handleEditChange("city", event.target.value)} />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Choose ${color}`}
                        onClick={() => handleEditChange("logoColor", color)}
                        className="h-9 w-9 rounded-lg border border-white/20"
                        style={{
                          background: color,
                          boxShadow: editForm.logoColor === color ? "0 0 0 3px rgba(34,211,238,0.35)" : undefined
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={editForm.logoColor}
                      onChange={(event) => handleEditChange("logoColor", event.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg p-1"
                    />
                  </div>
                  {editError ? <p className="mt-4 text-sm font-semibold text-red-200">{editError}</p> : null}
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditTeam(null)} className="secondary-button px-4 py-2">
                      Cancel
                    </button>
                    <button type="submit" className="premium-button flex items-center gap-2 px-4 py-2">
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </motion.form>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <ConfirmDialog
            open={Boolean(deleteState)}
            title={deleteState?.affectedFixtures.length ? "Delete team and fixtures?" : "Delete team?"}
            description={
              deleteState?.affectedFixtures.length
                ? "This team is used in fixtures. Confirming will delete the team, delete every affected fixture, and recalculate the points table."
                : "This team is not used in any fixture. Confirm deletion to remove it from the tournament."
            }
            confirmText="Delete"
            tone="danger"
            details={deleteState?.affectedFixtures.map((fixture) => getFixtureTitle(fixture, teams))}
            onClose={() => setDeleteState(null)}
            onConfirm={confirmDelete}
          />
        </>
      )}
    </AppShell>
  );
}
