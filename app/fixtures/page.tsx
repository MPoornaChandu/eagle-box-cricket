"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Download, Filter, Save, Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { FixtureCard } from "@/components/FixtureCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/ToastProvider";
import { hasResult } from "@/lib/points";
import { addFixture, deleteFixture, getCurrentRole, getFixtures, getTeams, updateFixture } from "@/lib/storage";
import type { Fixture, FixtureInput, MatchType, Team, WorkflowStatus } from "@/lib/types";
import { downloadTextFile, escapeCsv, getActiveFixtures, getActiveTeams, getFixtureTitle, getTeamName, isResultStatus } from "@/lib/utils";

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
  if (form.teamAId === form.teamBId) return "Team A and Team B must be different.";
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
  const [teamFilter, setTeamFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [role, setRole] = useState<"Admin" | "Viewer" | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    const [nextTeams, nextFixtures] = await Promise.all([getTeams(), getFixtures()]);
    const activeTeams = getActiveTeams(nextTeams);
    setTeams(activeTeams);
    setFixtures(getActiveFixtures(nextFixtures, nextTeams));
    setRole(getCurrentRole());
    setForm((current) =>
      current.teamAId || activeTeams.length < 2
        ? current
        : { ...current, teamAId: activeTeams[0]?.id ?? "", teamBId: activeTeams[1]?.id ?? "" }
    );
  };

  useEffect(() => {
    void loadData().finally(() => setLoading(false));
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
        const matchesTeam = teamFilter === "All" || fixture.teamAId === teamFilter || fixture.teamBId === teamFilter;
        const matchesDate = !dateFilter || fixture.date === dateFilter;
        return matchesSearch && matchesStatus && matchesTeam && matchesDate;
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [dateFilter, fixtures, search, statusFilter, teamFilter, teams]);

  const createValidationError = useMemo(() => validateFixture(form, teams, fixtures), [fixtures, form, teams]);
  const editValidationError = useMemo(
    () => (editFixture ? validateFixture(editForm, teams, fixtures, editFixture) : ""),
    [editFixture, editForm, fixtures, teams]
  );
  const isAdminUser = role === "Admin";

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
  tossWinnerTeamId: input.tossWinnerTeamId || undefined,
  electedTo: input.electedTo || undefined
});

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateFixture(form, teams, fixtures);
    if (validationError) {
      setFormError(validationError);
      showToast({ type: "error", title: "Fixture not created", description: validationError });
      return;
    }

    try {
      await addFixture(cleanFixtureInput(form));
      setForm({
        ...emptyFixtureForm,
        teamAId: teams[0]?.id ?? "",
        teamBId: teams[1]?.id ?? ""
      });
      await loadData();
      showToast({ type: "success", title: "Fixture created", description: "Schedule and workflow updated." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fixture could not be created.";
      setFormError(message);
      showToast({ type: "error", title: "Fixture not created", description: message });
    }
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

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFixture) return;

    const validationError = validateFixture(editForm, teams, fixtures, editFixture);
    if (validationError) {
      setEditError(validationError);
      showToast({ type: "error", title: "Fixture not updated", description: validationError });
      return;
    }

    try {
      await updateFixture(editFixture.id, cleanFixtureInput(editForm));
      setEditFixture(null);
      await loadData();
      showToast({ type: "success", title: "Fixture updated", description: "Match details saved." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fixture could not be updated.";
      setEditError(message);
      showToast({ type: "error", title: "Fixture not updated", description: message });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFixture(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
      showToast({
        type: "success",
        title: "Fixture deleted",
        description: hasResult(deleteTarget) ? "Result removed and points recalculated." : "Fixture removed."
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Fixture not deleted",
        description: error instanceof Error ? error.message : "Please try again."
      });
    }
  };

  const renderFixtureFields = (
    fixtureForm: FixtureInput,
    onChange: (field: keyof FixtureInput, value: string) => void,
    statuses: WorkflowStatus[]
  ) => (
    <>
      <label className="field-label">
        Team A <span className="text-red-200">*</span>
        <select value={fixtureForm.teamAId} onChange={(event) => onChange("teamAId", event.target.value)} disabled={teams.length < 2}>
          <option value="">Select team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id} disabled={team.id === fixtureForm.teamBId}>{team.name}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Team B <span className="text-red-200">*</span>
        <select value={fixtureForm.teamBId} onChange={(event) => onChange("teamBId", event.target.value)} disabled={teams.length < 2}>
          <option value="">Select team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id} disabled={team.id === fixtureForm.teamAId}>{team.name}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Date <span className="text-red-200">*</span>
        <input type="date" value={fixtureForm.date} onChange={(event) => onChange("date", event.target.value)} />
      </label>
      <label className="field-label">
        Time <span className="text-red-200">*</span>
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
        Elected to
        <select value={fixtureForm.electedTo ?? ""} onChange={(event) => onChange("electedTo", event.target.value)}>
          <option value="">Optional</option>
          <option value="Bat">Bat</option>
          <option value="Field">Field</option>
        </select>
      </label>
      <label className="field-label">
        Venue <span className="text-red-200">*</span>
        <input value={fixtureForm.venue} onChange={(event) => onChange("venue", event.target.value)} placeholder="Eagle Box Arena" />
      </label>
      <label className="field-label sm:col-span-2">
        Notes
        <textarea rows={3} value={fixtureForm.notes ?? ""} onChange={(event) => onChange("notes", event.target.value)} placeholder="Optional workflow or match context" />
      </label>
    </>
  );

  const exportFixturesCsv = () => {
    const rows = [
      ["Match ID", "Team A", "Team B", "Date", "Time", "Venue", "Type", "Status", "Toss Winner", "Elected To", "Notes"],
      ...filteredFixtures.map((fixture) => [
        fixture.matchId,
        getTeamName(teams, fixture.teamAId),
        getTeamName(teams, fixture.teamBId),
        fixture.date,
        fixture.time,
        fixture.venue,
        fixture.matchType,
        fixture.status,
        fixture.tossWinnerTeamId ? getTeamName(teams, fixture.tossWinnerTeamId) : "",
        fixture.electedTo ?? "",
        fixture.notes ?? ""
      ])
    ];
    downloadTextFile("eagle-box-fixtures.csv", rows.map((row) => row.map(escapeCsv).join(",")).join("\n"));
    showToast({ type: "success", title: "CSV exported", description: "Fixtures CSV is ready." });
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
            description="Create, edit, filter, and validate tournament fixtures across the full workflow."
            actions={
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={exportFixturesCsv} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
                {isAdminUser ? (
                  <Link href="/results" className="secondary-button px-4 py-2 text-sm font-black">
                    Result Entry
                  </Link>
                ) : null}
              </div>
            }
          />

          <section className={isAdminUser ? "grid gap-6 xl:grid-cols-[0.9fr_1.45fr]" : "grid gap-6"}>
            {isAdminUser ? (
            <form onSubmit={handleCreate} className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Create Fixture</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderFixtureFields(form, handleChange, createStatuses)}
              </div>
              {formError || createValidationError ? <p className="mt-4 text-sm font-semibold text-red-200">{formError || createValidationError}</p> : null}
              <button type="submit" disabled={teams.length < 2 || Boolean(createValidationError)} className="premium-button mt-5 flex items-center gap-2 px-4 py-3">
                <CalendarPlus className="h-4 w-4" />
                Create Fixture
              </button>
            </form>
            ) : null}

            <div>
              <div className="glass-panel mb-5 grid gap-3 rounded-lg p-4 lg:grid-cols-[1fr_auto_auto_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search match, team, venue, status, or notes" className="pl-10" />
                </label>
                <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="min-w-44 px-3 py-2">
                  <option value="All">All teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
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
                    <FixtureCard key={fixture.id} fixture={fixture} teams={teams} onEdit={isAdminUser ? openEdit : undefined} onDelete={isAdminUser ? setDeleteTarget : undefined} />
                  ))}
                </div>
              ) : (
                <EmptyState title={fixtures.length ? "No fixtures match your filters" : "No fixtures scheduled. Create your first fixture."} description={fixtures.length ? "Clear filters or search another team." : isAdminUser ? "Create a fixture after adding at least two teams." : "Ask an Admin to create fixtures."} />
              )}
            </div>
          </section>

          <AnimatePresence>
            {editFixture && isAdminUser ? (
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
                  {editError || editValidationError ? <p className="mt-4 text-sm font-semibold text-red-200">{editError || editValidationError}</p> : null}
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Link href="/results" className="secondary-button px-4 py-2">Edit result</Link>
                    <button type="button" onClick={() => setEditFixture(null)} className="secondary-button px-4 py-2">Cancel</button>
                    <button type="submit" disabled={Boolean(editValidationError)} className="premium-button flex items-center gap-2 px-4 py-2">
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
