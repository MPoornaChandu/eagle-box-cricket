"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List, Plus, Search, Save, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { TeamCard } from "@/components/TeamCard";
import { useToast } from "@/components/ToastProvider";
import { addTeam, deleteTeam, getFixtures, getTeams, updateTeam } from "@/lib/storage";
import type { Fixture, Team, TeamInput, TeamStatus } from "@/lib/types";
import { formatDate, getFixtureTitle, normalizeShortName } from "@/lib/utils";

const colorPresets = ["#22c55e", "#f59e0b", "#ef4444", "#14b8a6", "#84cc16", "#78716c"];

const emptyTeamForm: TeamInput = {
  name: "",
  shortName: "",
  captain: "",
  coach: "",
  homeVenue: "",
  contact: "",
  logoColor: colorPresets[0],
  status: "Active"
};

interface DeleteState {
  team: Team;
  affectedFixtures: Fixture[];
}

function validateTeam(form: TeamInput): string {
  if (!form.name.trim()) return "Team name is required.";
  if (!form.shortName.trim()) return "Short code is required.";
  if (!form.captain.trim()) return "Captain name is required.";
  if (!form.coach.trim()) return "Coach/manager name is required.";
  if (!form.homeVenue.trim()) return "Home venue is required.";
  return "";
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [form, setForm] = useState<TeamInput>(emptyTeamForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TeamStatus>("All");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
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
    return teams.filter((team) => {
      const matchesSearch =
        !query ||
        [team.name, team.shortName, team.captain, team.coach, team.homeVenue, team.contact ?? ""].some((value) =>
          value.toLowerCase().includes(query)
        );
      const matchesStatus = statusFilter === "All" || team.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, teams]);

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

  const cleanInput = (input: TeamInput): TeamInput => ({
    ...input,
    name: input.name.trim(),
    shortName: normalizeShortName(input.shortName),
    captain: input.captain.trim(),
    coach: input.coach.trim(),
    homeVenue: input.homeVenue.trim(),
    contact: input.contact?.trim() || undefined
  });

  const handleAddTeam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateTeam(form);
    if (validationError) {
      setFormError(validationError);
      showToast({ type: "error", title: "Team not added", description: validationError });
      return;
    }

    try {
      addTeam(cleanInput(form));
      setForm(emptyTeamForm);
      loadData();
      showToast({ type: "success", title: "Team added", description: "Points table refreshed." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Team could not be added.";
      setFormError(message);
      showToast({ type: "error", title: "Team not added", description: message });
    }
  };

  const openEdit = (team: Team) => {
    setEditTeam(team);
    setEditForm({
      name: team.name,
      shortName: team.shortName,
      captain: team.captain,
      coach: team.coach,
      homeVenue: team.homeVenue,
      contact: team.contact ?? "",
      logoColor: team.logoColor,
      status: team.status
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

    try {
      updateTeam(editTeam.id, cleanInput(editForm));
      setEditTeam(null);
      loadData();
      showToast({ type: "success", title: "Team updated", description: "Team details saved." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Team could not be updated.";
      setEditError(message);
      showToast({ type: "error", title: "Team not updated", description: message });
    }
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

  const renderTeamFields = (teamForm: TeamInput, onChange: (field: keyof TeamInput, value: string) => void) => (
    <>
      <label className="field-label sm:col-span-2">
        Team name
        <input value={teamForm.name} onChange={(event) => onChange("name", event.target.value)} />
      </label>
      <label className="field-label">
        Short code
        <input value={teamForm.shortName} onChange={(event) => onChange("shortName", event.target.value)} />
      </label>
      <label className="field-label">
        Status
        <select value={teamForm.status} onChange={(event) => onChange("status", event.target.value as TeamStatus)}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </label>
      <label className="field-label">
        Captain
        <input value={teamForm.captain} onChange={(event) => onChange("captain", event.target.value)} />
      </label>
      <label className="field-label">
        Coach / manager
        <input value={teamForm.coach} onChange={(event) => onChange("coach", event.target.value)} />
      </label>
      <label className="field-label">
        Home venue
        <input value={teamForm.homeVenue} onChange={(event) => onChange("homeVenue", event.target.value)} />
      </label>
      <label className="field-label">
        Contact / email
        <input value={teamForm.contact ?? ""} onChange={(event) => onChange("contact", event.target.value)} />
      </label>
    </>
  );

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading teams" />
      ) : (
        <>
          <PageHeader
            title="Teams"
            breadcrumb="Dashboard / Teams"
            description="Create, edit, search, and manage tournament teams with backend-ready local data."
          />

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
            <form onSubmit={handleAddTeam} className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Add Team</h2>
              <div className="grid gap-4 sm:grid-cols-2">{renderTeamFields(form, handleFormChange)}</div>

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
                  <input type="color" value={form.logoColor} onChange={(event) => handleFormChange("logoColor", event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg p-1" />
                </div>
              </div>

              {formError ? <p className="mt-4 text-sm font-semibold text-red-200">{formError}</p> : null}

              <button type="submit" className="premium-button mt-5 flex items-center gap-2 px-4 py-3">
                <Plus className="h-4 w-4" />
                Add Team
              </button>
            </form>

            <div>
              <div className="glass-panel mb-5 grid gap-3 rounded-lg p-4 lg:grid-cols-[1fr_auto_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams, captains, venues, or contacts" className="pl-10" />
                </label>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | TeamStatus)} className="min-w-36 px-3 py-2">
                  <option value="All">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="flex gap-2">
                  <button type="button" title="Card view" onClick={() => setViewMode("cards")} className={viewMode === "cards" ? "premium-button px-3 py-2" : "secondary-button px-3 py-2"}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button type="button" title="Table view" onClick={() => setViewMode("table")} className={viewMode === "table" ? "premium-button px-3 py-2" : "secondary-button px-3 py-2"}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {filteredTeams.length > 0 && viewMode === "cards" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredTeams.map((team) => (
                    <TeamCard key={team.id} team={team} onEdit={openEdit} onDelete={requestDelete} />
                  ))}
                </div>
              ) : null}

              {filteredTeams.length > 0 && viewMode === "table" ? (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-slate-300">
                        <tr>
                          <th className="px-4 py-3">Team</th>
                          <th className="px-4 py-3">Captain</th>
                          <th className="px-4 py-3">Coach</th>
                          <th className="px-4 py-3">Venue</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeams.map((team) => (
                          <tr key={team.id} className="border-t border-white/10">
                            <td className="px-4 py-3 font-black text-white">{team.name} ({team.shortName})</td>
                            <td className="px-4 py-3 text-slate-200">{team.captain}</td>
                            <td className="px-4 py-3 text-slate-200">{team.coach}</td>
                            <td className="px-4 py-3 text-slate-200">{team.homeVenue}</td>
                            <td className="px-4 py-3 text-slate-200">{team.status}</td>
                            <td className="px-4 py-3 text-slate-200">{formatDate(team.createdAt.slice(0, 10))}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => openEdit(team)} className="secondary-button px-3 py-2 text-xs font-black">Edit</button>
                                <button type="button" onClick={() => requestDelete(team)} className="danger-button px-3 py-2 text-xs font-black">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {filteredTeams.length === 0 ? (
                <EmptyState title={teams.length ? "No teams match your filters" : "No teams yet"} description={teams.length ? "Try another search term or status." : "Add a team or reset demo data from the points table."} />
              ) : null}
            </div>
          </section>

          <AnimatePresence>
            {editTeam ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/78 p-4 backdrop-blur-md">
                <motion.form initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} onSubmit={handleEditTeam} className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-black text-white">Edit Team</h2>
                    <button type="button" aria-label="Close edit modal" onClick={() => setEditTeam(null)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">{renderTeamFields(editForm, handleEditChange)}</div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {colorPresets.map((color) => (
                      <button key={color} type="button" aria-label={`Choose ${color}`} onClick={() => handleEditChange("logoColor", color)} className="h-9 w-9 rounded-lg border border-white/20" style={{ background: color, boxShadow: editForm.logoColor === color ? "0 0 0 3px rgba(34,211,238,0.35)" : undefined }} />
                    ))}
                    <input type="color" value={editForm.logoColor} onChange={(event) => handleEditChange("logoColor", event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg p-1" />
                  </div>
                  {editError ? <p className="mt-4 text-sm font-semibold text-red-200">{editError}</p> : null}
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditTeam(null)} className="secondary-button px-4 py-2">Cancel</button>
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
            description={deleteState?.affectedFixtures.length ? "This team is used in fixtures. Confirming will delete the team, delete every affected fixture, and recalculate the points table." : "This team is not used in any fixture. Confirm deletion to remove it from the tournament."}
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
