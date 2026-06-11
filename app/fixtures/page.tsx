"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Save, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { FixtureCard } from "@/components/FixtureCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/ToastProvider";
import {
  addFixture,
  deleteFixture,
  getFixtures,
  getTeams,
  updateFixture
} from "@/lib/storage";
import type { Fixture, FixtureInput, Team } from "@/lib/types";
import { getFixtureTitle } from "@/lib/utils";

const emptyFixtureForm: FixtureInput = {
  teamAId: "",
  teamBId: "",
  date: "",
  time: "",
  venue: ""
};

function sameMatchup(a: FixtureInput, b: Fixture): boolean {
  const direct = a.teamAId === b.teamAId && a.teamBId === b.teamBId;
  const reverse = a.teamAId === b.teamBId && a.teamBId === b.teamAId;
  return a.date === b.date && (direct || reverse);
}

function validateFixture(
  form: FixtureInput,
  teams: Team[],
  fixtures: Fixture[],
  editingFixtureId?: string
): string {
  if (teams.length < 2) return "At least two teams are required to create a fixture.";
  if (!form.teamAId) return "Team A is required.";
  if (!form.teamBId) return "Team B is required.";
  if (form.teamAId === form.teamBId) return "Team A and Team B cannot be the same.";
  if (!form.date) return "Date is required.";
  if (!form.time) return "Time is required.";
  if (!form.venue.trim()) return "Venue is required.";

  const duplicate = fixtures.some(
    (fixture) => fixture.id !== editingFixtureId && sameMatchup(form, fixture)
  );
  if (duplicate) return "This same-team fixture already exists on the selected date.";

  return "";
}

export default function FixturesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [form, setForm] = useState<FixtureInput>(emptyFixtureForm);
  const [editFixture, setEditFixture] = useState<Fixture | null>(null);
  const [editForm, setEditForm] = useState<FixtureInput>(emptyFixtureForm);
  const [deleteTarget, setDeleteTarget] = useState<Fixture | null>(null);
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    const nextTeams = getTeams();
    setTeams(nextTeams);
    setFixtures(getFixtures());
    setForm((current) =>
      current.teamAId || nextTeams.length < 2
        ? current
        : { ...current, teamAId: nextTeams[0]?.id ?? "", teamBId: nextTeams[1]?.id ?? "" }
    );
  };

  useEffect(() => {
    loadData();
    setLoading(false);
  }, []);

  const sortedFixtures = useMemo(
    () => [...fixtures].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [fixtures]
  );

  const handleChange = (field: keyof FixtureInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  const handleEditChange = (field: keyof FixtureInput, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditError("");
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateFixture(form, teams, fixtures);
    if (validationError) {
      setFormError(validationError);
      showToast({ type: "error", title: "Fixture not created", description: validationError });
      return;
    }

    addFixture({ ...form, venue: form.venue.trim() });
    setForm({
      ...emptyFixtureForm,
      teamAId: teams[0]?.id ?? "",
      teamBId: teams[1]?.id ?? ""
    });
    loadData();
    showToast({ type: "success", title: "Fixture created", description: "Schedule updated." });
  };

  const openEdit = (fixture: Fixture) => {
    if (fixture.status === "completed") return;
    setEditFixture(fixture);
    setEditForm({
      teamAId: fixture.teamAId,
      teamBId: fixture.teamBId,
      date: fixture.date,
      time: fixture.time,
      venue: fixture.venue
    });
    setEditError("");
  };

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFixture) return;

    const validationError = validateFixture(editForm, teams, fixtures, editFixture.id);
    if (validationError) {
      setEditError(validationError);
      showToast({ type: "error", title: "Fixture not updated", description: validationError });
      return;
    }

    updateFixture(editFixture.id, { ...editForm, venue: editForm.venue.trim() });
    setEditFixture(null);
    loadData();
    showToast({ type: "success", title: "Fixture updated", description: "Upcoming match details saved." });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteFixture(deleteTarget.id);
    setDeleteTarget(null);
    loadData();
    showToast({
      type: "success",
      title: "Fixture deleted",
      description:
        deleteTarget.status === "completed"
          ? "Completed match removed and points recalculated."
          : "Upcoming fixture removed."
    });
  };

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading fixtures" />
      ) : (
        <>
          <PageHeader
            title="Fixtures"
            breadcrumb="Dashboard / Fixtures"
            description="Create, edit, and manage upcoming match schedules."
          />

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.45fr]">
            <form onSubmit={handleCreate} className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Create Fixture</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Team A
                  <select
                    value={form.teamAId}
                    onChange={(event) => handleChange("teamAId", event.target.value)}
                    disabled={teams.length < 2}
                  >
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Team B
                  <select
                    value={form.teamBId}
                    onChange={(event) => handleChange("teamBId", event.target.value)}
                    disabled={teams.length < 2}
                  >
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Date
                  <input type="date" value={form.date} onChange={(event) => handleChange("date", event.target.value)} />
                </label>
                <label className="field-label">
                  Time
                  <input type="time" value={form.time} onChange={(event) => handleChange("time", event.target.value)} />
                </label>
                <label className="field-label sm:col-span-2">
                  Venue
                  <input value={form.venue} onChange={(event) => handleChange("venue", event.target.value)} placeholder="Eagle Box Arena" />
                </label>
              </div>
              {formError ? <p className="mt-4 text-sm font-semibold text-red-200">{formError}</p> : null}
              <button
                type="submit"
                disabled={teams.length < 2}
                className="premium-button mt-5 flex items-center gap-2 px-4 py-3"
              >
                <CalendarPlus className="h-4 w-4" />
                Create Fixture
              </button>
            </form>

            <div>
              {sortedFixtures.length > 0 ? (
                <div className="grid gap-4">
                  {sortedFixtures.map((fixture) => (
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      teams={teams}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No fixtures yet"
                  description="Create a fixture after adding at least two teams."
                />
              )}
            </div>
          </section>

          <AnimatePresence>
            {editFixture ? (
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
                  onSubmit={handleEdit}
                  className="glass-panel w-full max-w-2xl rounded-lg p-5"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-black text-white">Edit Fixture</h2>
                    <button
                      type="button"
                      aria-label="Close edit modal"
                      onClick={() => setEditFixture(null)}
                      className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field-label">
                      Team A
                      <select value={editForm.teamAId} onChange={(event) => handleEditChange("teamAId", event.target.value)}>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      Team B
                      <select value={editForm.teamBId} onChange={(event) => handleEditChange("teamBId", event.target.value)}>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      Date
                      <input type="date" value={editForm.date} onChange={(event) => handleEditChange("date", event.target.value)} />
                    </label>
                    <label className="field-label">
                      Time
                      <input type="time" value={editForm.time} onChange={(event) => handleEditChange("time", event.target.value)} />
                    </label>
                    <label className="field-label sm:col-span-2">
                      Venue
                      <input value={editForm.venue} onChange={(event) => handleEditChange("venue", event.target.value)} />
                    </label>
                  </div>
                  {editError ? <p className="mt-4 text-sm font-semibold text-red-200">{editError}</p> : null}
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditFixture(null)} className="secondary-button px-4 py-2">
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
            open={Boolean(deleteTarget)}
            title={deleteTarget?.status === "completed" ? "Delete completed match?" : "Delete fixture?"}
            description={
              deleteTarget?.status === "completed"
                ? "Deleting a completed match will remove its result and fully recalculate the points table."
                : "This will remove the upcoming fixture from the schedule."
            }
            confirmText="Delete"
            tone="danger"
            details={deleteTarget ? [getFixtureTitle(deleteTarget, teams)] : undefined}
            onClose={() => setDeleteTarget(null)}
            onConfirm={confirmDelete}
          />
        </>
      )}
    </AppShell>
  );
}
