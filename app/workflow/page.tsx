"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, RefreshCw } from "lucide-react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { useToast } from "@/components/ToastProvider";
import { getFixtureResult } from "@/lib/points";
import { generateAlerts, getFixtures, getReports, getTeams, transitionFixtureStatus } from "@/lib/storage";
import type { AlertItem, Fixture, Team, WorkflowStatus } from "@/lib/types";
import { formatDate, formatScore, formatTime, getFixtureTitle, statusBadgeClasses } from "@/lib/utils";

const columns: WorkflowStatus[] = ["Draft", "Scheduled", "Completed", "Points Updated", "Report Generated"];

function columnForFixture(fixture: Fixture): WorkflowStatus {
  return fixture.status === "Live" ? "Scheduled" : fixture.status;
}

export default function WorkflowPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    const nextTeams = getTeams();
    const nextFixtures = getFixtures();
    const nextReports = getReports();
    setTeams(nextTeams);
    setFixtures(nextFixtures);
    setAlerts(generateAlerts(nextTeams, nextFixtures, nextReports));
  };

  useEffect(() => {
    loadData();
    setLoading(false);
  }, []);

  const fixturesByColumn = useMemo(
    () =>
      columns.reduce<Record<WorkflowStatus, Fixture[]>>((acc, column) => {
        acc[column] = fixtures
          .filter((fixture) => columnForFixture(fixture) === column)
          .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
        return acc;
      }, {
        Draft: [],
        Scheduled: [],
        Live: [],
        Completed: [],
        "Points Updated": [],
        "Report Generated": []
      }),
    [fixtures]
  );

  const runTransition = (fixture: Fixture, nextStatus: WorkflowStatus) => {
    try {
      const nextFixtures = transitionFixtureStatus(fixture.id, nextStatus);
      setFixtures(nextFixtures);
      loadData();
      showToast({ type: "success", title: "Workflow updated", description: `${fixture.matchId} moved to ${nextStatus}.` });
    } catch (error) {
      showToast({
        type: "error",
        title: "Workflow blocked",
        description: error instanceof Error ? error.message : "Please check the fixture status."
      });
    }
  };

  const renderActions = (fixture: Fixture) => {
    if (fixture.status === "Draft") {
      return (
        <button type="button" onClick={() => runTransition(fixture, "Scheduled")} className="secondary-button flex items-center gap-2 px-3 py-2 text-xs font-black">
          <ArrowRight className="h-4 w-4" />
          Mark Scheduled
        </button>
      );
    }

    if (fixture.status === "Scheduled" || fixture.status === "Live") {
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => runTransition(fixture, "Completed")} className="secondary-button flex items-center gap-2 px-3 py-2 text-xs font-black">
            <CheckCircle2 className="h-4 w-4" />
            Mark Completed
          </button>
          <Link href="/results" className="premium-button px-3 py-2 text-xs">
            Enter Result
          </Link>
        </div>
      );
    }

    if (fixture.status === "Completed") {
      return (
        <button type="button" onClick={() => runTransition(fixture, "Points Updated")} className="secondary-button flex items-center gap-2 px-3 py-2 text-xs font-black">
          <RefreshCw className="h-4 w-4" />
          Update Points
        </button>
      );
    }

    if (fixture.status === "Points Updated") {
      return (
        <button type="button" onClick={() => runTransition(fixture, "Report Generated")} className="secondary-button flex items-center gap-2 px-3 py-2 text-xs font-black">
          <FileCheck2 className="h-4 w-4" />
          Generate Report
        </button>
      );
    }

    return <span className="text-xs font-bold text-emerald-200">Workflow complete</span>;
  };

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading workflow" />
      ) : (
        <>
          <PageHeader
            title="Workflow"
            breadcrumb="Dashboard / Workflow"
            description="Track fixture status transitions from draft through report generation with validation."
          />

          <section className="mb-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <GlassCard className="p-5" hover={false}>
              <h2 className="mb-4 text-xl font-black text-white">Workflow Rules</h2>
              <div className="grid gap-3 text-sm text-slate-300">
                <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3">Cannot mark completed until a match result exists.</p>
                <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3">Cannot generate a report before points are updated.</p>
                <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3">Points table is recalculated from completed scorecards, not manual increments.</p>
              </div>
            </GlassCard>
            <GlassCard className="p-5" hover={false}>
              <h2 className="mb-4 text-xl font-black text-white">Alerts</h2>
              <AlertsPanel alerts={alerts} compact />
            </GlassCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-5">
            {columns.map((column) => (
              <div key={column} className="glass-panel min-h-[22rem] rounded-lg p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-white">{column}</h2>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-black text-slate-200">
                    {fixturesByColumn[column].length}
                  </span>
                </div>
                {fixturesByColumn[column].length > 0 ? (
                  <div className="grid gap-3">
                    {fixturesByColumn[column].map((fixture) => {
                      const result = getFixtureResult(fixture);
                      return (
                        <article key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className={statusBadgeClasses(fixture.status)}>{fixture.status}</span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-black text-slate-200">{fixture.matchId}</span>
                          </div>
                          <h3 className="font-black leading-5 text-white">{getFixtureTitle(fixture, teams)}</h3>
                          <p className="mt-2 text-xs text-slate-400">{formatDate(fixture.date)} at {formatTime(fixture.time)}</p>
                          <p className="mt-1 text-xs text-slate-400">{fixture.venue}</p>
                          {result ? (
                            <p className="mt-3 text-xs font-semibold text-cyan-100">
                              {formatScore(result.teamARuns, result.teamAWickets)} vs {formatScore(result.teamBRuns, result.teamBWickets)} - {result.resultType}
                            </p>
                          ) : null}
                          <div className="mt-4">
                            <WorkflowProgress status={fixture.status} />
                          </div>
                          <div className="mt-4">{renderActions(fixture)}</div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No fixtures" description={`Nothing is currently in ${column}.`} />
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </AppShell>
  );
}
