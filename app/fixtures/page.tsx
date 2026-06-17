"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Filter, Save, Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { FixtureCard } from "@/components/FixtureCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/ToastProvider";
import { hasResult } from "@/lib/points";
import { addFixture, deleteFixture, getFixtures, getTeams, updateFixture } from "@/lib/storage";
import type { Fixture, FixtureInput, MatchType, Team, WorkflowStatus } from "@/lib/types";
import { getFixtureTitle, getTeamName, isResultStatus } from "@/lib/utils";

const matchTypes: MatchType[] = ["League", "Semi Final", "Final", "Friendly"];
const createStatuses: WorkflowStatus[] = ["Draft", "Scheduled", "Live"];
const allStatuses: WorkflowStatus[] = [
  "Draft",
  "Scheduled",
  "Live",
  "Completed",
  "Points Updated",
  "Report Generated"
];

const emptyFixtureForm: FixtureInput = {
  teamAId: "",
  teamBId: "",
  date: "",
  time: "",
  venue: "",
  matchType: "League",
  status: "Scheduled",
  tossWinnerTeamId: "",
  notes: ""
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
  editingFixture?: Fixture
): string {
  if (teams.length < 2) return "At least two teams are required to create a fixture.";
  if (!form.teamAId) return "Team A is required.";
  if (!form.teamBId) return "Team B is required.";
  if (form.teamAId === form.teamBId) return "Team A and Team B cannot be the same.";
  if (!form.date) return "Date is required.";
  if (!form.time) return "Time is required.";
  if (!form.venue.trim()) return "Venue is required.";
  if (form.tossWinnerTeamId && ![form.teamAId, form.teamBId].includes(form.tossWinnerTeamId)) {
    return "Toss winner must be one of the fixture teams.";
  }
  if (isResultStatus(form.status) && editingFixture && !hasResult(editingFixture)) {
    return "Enter a match result before moving this fixture to a completed workflow status.";
  }

  const duplicate = fixtures.some(
    (fixture) => fixture.id !== editingFixture?.id && sameMatchup(form, fixture)
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | WorkflowStatus>("All");
  const [dateFilter, setDateFilter] = useState("");
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    const nextTeams = getTeams();
    const nextFixtures = getFixtures();
    setTeams(nextTeams);
    setFixtures(nextFixtures);
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

  const filteredFixtures = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...fixtures]
      .filter((fixture) => {
        const title = getFixtureTitle(fixture, teams).toLowerCase();
        const matchesSearch =
          !query ||
          [fixture.matchId, title, fixture.venue, fixture.matchType, fixture.notes ?? ""].some((value) =>
            value.toLowerCase().includes(query)
          );
        const matchesStatus = statusFilter === "All" || fixture.status === statusFilter;
        const matchesDate = !dateFilter || fixture.date === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [dateFilter, fixtures, search, statusFilter, teams]);

  const handleChange = (field: keyof FixtureInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  const handleEditChange = (field: keyof FixtureInput, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditError("");
  };

  const cleanFixtureInput = (input: FixtureInput): FixtureInput => ({
    ...input,
    venue: input.venue.trim(),
    notes: input.notes?.trim() || undefined,
    tossWinnerTeamId: input.tossWinnerTeamId || undefined
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateFixture(form, teams, fixtures);
    if (validationError) {
      setFormError(validationError);
      showToast({ type: "error", title: "Fixture not created", description: validationError });
      return;
    }

    addFixture(cleanFixtureInput(form));
    setForm({
      ...emptyFixtureForm,
      teamAId: teams[0]?.id ?? "",
      teamBId: teams[1]?.id ?? ""
    });
    loadData();
    showToast({ type: "success", title: "Fixture created", description: "Schedule and workflow updated." });
  };

  const openEdit = (fixture: Fixture) => {
    setEditFixture(fixture);
    setEditForm({
      teamAId: fixture.teamAId,
      teamBId: fixture.teamBId,
      date: fixture.date,
      time: fixture.time,
      venue: fixture.venue,
      matchType: fixture.matchType,
      status: fixture.status,
      tossWinnerTeamId: fixture.tossWinnerTeamId ?? "",
      notes: fixture.notes ?? ""
    });
    setEditError("");
  };

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFixture) return;

    const validationError = validateFixture(editForm, teams, fixtures, editFixture);
    if (validationError) {
      setEditError(validationError);
      showToast({ type: "error", title: "Fixture not updated", description: validationError });
      return;
    }

    updateFixture(editFixture.id, cleanFixtureInput(editForm));
    setEditFixture(null);
    loadData();
    showToast({ type: "success", title: "Fixture updated", description: "Match details saved." });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteFixture(deleteTarget.id);
    setDeleteTarget(null);
    loadData();
    showToast({
      type: "success",
      title: "Fixture deleted",
      description: hasResult(deleteTarget) ? "Result removed and points recalculated." : "Fixture removed."
    });
  };

  const renderFixtureFields = (
    fixtureForm: FixtureInput,
    onChange: (field: keyof FixtureInput, value: string) => void,
    statuses: WorkflowStatus[]
  ) => (
    <>
      <label className="field-label">
        Team A
        <select value={fixtureForm.teamAId} onChange={(event) => onChange("teamAId", event.target.value)} disabled={teams.length < 2}>
          <option value="">Select team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Team B
        <select value={fixtureForm.teamBId} onChange={(event) => onChange("teamBId", event.target.value)} disabled={teams.length < 2}>
          <option value="">Select team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Date
        <input type="date" value={fixtureForm.date} onChange={(event) => onChange("date", event.target.value)} />
      </label>
      <label className="field-label">
        Time
        <input type="time" value={fixtureForm.time} onChange={(event) => onChange("time", event.target.value)} />
      </label>
      <label className="field-label">
        Match type
        <select value={fixtureForm.matchType} onChange={(event) => onChange("matchType", event.target.value as MatchType)}>
          {matchTypes.map((matchType) => (
            <option key={matchType} value={matchType}>{matchType}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Status
        <select value={fixtureForm.status} onChange={(event) => onChange("status", event.target.value as WorkflowStatus)}>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Toss winner
        <select value={fixtureForm.tossWinnerTeamId ?? ""} onChange={(event) => onChange("tossWinnerTeamId", event.target.value)}>
          <option value="">Optional</option>
          {fixtureForm.teamAId ? <option value={fixtureForm.teamAId}>{getTeamName(teams, fixtureForm.teamAId)}</option> : null}
          {fixtureForm.teamBId ? <option value={fixtureForm.teamBId}>{getTeamName(teams, fixtureForm.teamBId)}</option> : null}
        </select>
      </label>
      <label className="field-label">
        Venue
        <input value={fixtureForm.venue} onChange={(event) => onChange("venue", event.target.value)} placeholder="Eagle Box Arena" />
      </label>
      <label className="field-label sm:col-span-2">
        Notes
        <textarea rows={3} value={fixtureForm.notes ?? ""} onChange={(event) => onChange("notes", event.target.value)} placeholder="Optional workflow or match context" />
      </label>
    </>
  );

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading fixtures" />
      ) : (
        <>
          <PageHeader
            title="Fixtures"
            breadcrumb="Dashboard / Fixtures"
            description="Create, edit, filter, and validate tournament fixtures across the full workflow."
            actions={
              <Link href="/results" className="secondary-button px-4 py-2 text-sm font-black">
                Result Entry
              </Link>
            }
          />

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.45fr]">
            <form onSubmit={handleCreate} className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Create Fixture</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderFixtureFields(form, handleChange, createStatuses)}
              </div>
              {formError ? <p className="mt-4 text-sm font-semibold text-red-200">{formError}</p> : null}
              <button type="submit" disabled={teams.length < 2} className="premium-button mt-5 flex items-center gap-2 px-4 py-3">
                <CalendarPlus className="h-4 w-4" />
                Create Fixture
              </button>
            </form>

            <div>
              <div className="glass-panel mb-5 grid gap-3 rounded-lg p-4 lg:grid-cols-[1fr_auto_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search match, team, venue, status, or notes" className="pl-10" />
                </label>
                <label className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | WorkflowStatus)} className="min-w-44 px-3 py-2">
                    <option value="All">All statuses</option>
                    {allStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="px-3 py-2" />
              </div>

              {filteredFixtures.length > 0 ? (
                <div className="grid gap-4">
                  {filteredFixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} teams={teams} onEdit={openEdit} onDelete={setDeleteTarget} />
                  ))}
                </div>
              ) : (
                <EmptyState title={fixtures.length ? "No fixtures match your filters" : "No fixtures yet"} description={fixtures.length ? "Clear filters or search another team." : "Create a fixture after adding at least two teams."} />
              )}
            </div>
          </section>

          <AnimatePresence>
            {editFixture ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/78 p-4 backdrop-blur-md">
                <motion.form initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} onSubmit={handleEdit} className="glass-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-black text-white">Edit Fixture</h2>
                    <button type="button" aria-label="Close edit modal" onClick={() => setEditFixture(null)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    {editFixture.matchId} - {getFixtureTitle(editFixture, teams)}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">{renderFixtureFields(editForm, handleEditChange, allStatuses)}</div>
                  {editError ? <p className="mt-4 text-sm font-semibold text-red-200">{editError}</p> : null}
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Link href="/results" className="secondary-button px-4 py-2">Edit result</Link>
                    <button type="button" onClick={() => setEditFixture(null)} className="secondary-button px-4 py-2">Cancel</button>
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
            title={deleteTarget && hasResult(deleteTarget) ? "Delete completed match?" : "Delete fixture?"}
            description={deleteTarget && hasResult(deleteTarget) ? "Deleting a completed match will remove its result and fully recalculate the points table." : "This will remove the fixture from the schedule."}
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
