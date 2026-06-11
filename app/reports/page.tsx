"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, Download, Printer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { PointsTableView } from "@/components/PointsTableView";
import { useToast } from "@/components/ToastProvider";
import { getFixtures, getPointsTable, getTeams } from "@/lib/storage";
import type { Fixture, PointsRow, Team } from "@/lib/types";
import {
  formatDate,
  formatScore,
  formatTime,
  getFixtureTitle,
  getLeaderName,
  getTeamName
} from "@/lib/utils";

interface ReportSummary {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  currentLeader: string;
}

function buildSummary(teams: Team[], fixtures: Fixture[], pointsTable: PointsRow[]): ReportSummary {
  return {
    totalTeams: teams.length,
    totalMatches: fixtures.length,
    completedMatches: fixtures.filter((fixture) => fixture.status === "completed").length,
    upcomingMatches: fixtures.filter((fixture) => fixture.status === "upcoming").length,
    currentLeader: getLeaderName(teams, pointsTable)
  };
}

function buildPlainTextSummary(summary: ReportSummary): string {
  return [
    "Fixture & Points Table Manager - Eagle Box Cricket",
    `Total teams: ${summary.totalTeams}`,
    `Total matches: ${summary.totalMatches}`,
    `Completed matches: ${summary.completedMatches}`,
    `Upcoming matches: ${summary.upcomingMatches}`,
    `Current leader: ${summary.currentLeader}`
  ].join("\n");
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export default function ReportsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setTeams(getTeams());
    setFixtures(getFixtures());
    setPointsTable(getPointsTable());
    setLoading(false);
  }, []);

  const summary = useMemo(() => buildSummary(teams, fixtures, pointsTable), [teams, fixtures, pointsTable]);
  const completedFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status === "completed")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [fixtures]
  );
  const upcomingFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status === "upcoming")
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [fixtures]
  );

  const handleDownload = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary,
      teams,
      fixtures,
      pointsTable
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "eagle-box-cricket-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast({ type: "success", title: "Report downloaded", description: "JSON export is ready." });
  };

  const handleCopy = async () => {
    try {
      await copyText(buildPlainTextSummary(summary));
      showToast({ type: "success", title: "Summary copied", description: "Tournament summary copied to clipboard." });
    } catch {
      showToast({ type: "error", title: "Copy failed", description: "Clipboard access was not available." });
    }
  };

  const handlePrint = () => {
    showToast({ type: "info", title: "Print dialog opening", description: "Save as PDF from the print dialog." });
    window.setTimeout(() => window.print(), 150);
  };

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading report" />
      ) : (
        <>
          <div className="no-print">
            <PageHeader
              title="Reports"
              breadcrumb="Dashboard / Reports"
              description="Export tournament data, copy a summary, or print a clean report for submission."
              actions={
                <div className="report-actions flex flex-wrap gap-2">
                  <button type="button" onClick={handleDownload} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                    <Download className="h-4 w-4" />
                    Download JSON Report
                  </button>
                  <button type="button" onClick={handleCopy} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                    <ClipboardCopy className="h-4 w-4" />
                    Copy Summary
                  </button>
                  <button type="button" onClick={handlePrint} className="premium-button flex items-center gap-2 px-4 py-2 text-sm">
                    <Printer className="h-4 w-4" />
                    Print / Save as PDF
                  </button>
                </div>
              }
            />
          </div>

          <GlassCard className="report-content p-5 md:p-7" hover={false}>
            <div className="mb-6 border-b border-white/10 pb-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
                Eagle Box Cricket
              </p>
              <h1 className="mt-2 text-3xl font-black text-white">Tournament Report</h1>
              <p className="mt-2 text-sm text-slate-300">
                Generated from local dashboard data on {new Date().toLocaleString("en-IN")}.
              </p>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Total teams", summary.totalTeams],
                ["Total matches", summary.totalMatches],
                ["Completed", summary.completedMatches],
                ["Upcoming", summary.upcomingMatches],
                ["Leader", summary.currentLeader]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-2 break-words text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-xl font-black text-white">Completed Matches</h2>
              {completedFixtures.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-slate-300">
                        <tr>
                          <th className="px-4 py-3">Match</th>
                          <th className="px-4 py-3">Scores</th>
                          <th className="px-4 py-3">Winner</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Venue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedFixtures.map((fixture) => (
                          <tr key={fixture.id} className="border-t border-white/10">
                            <td className="px-4 py-3 font-black text-white">{getFixtureTitle(fixture, teams)}</td>
                            <td className="px-4 py-3 text-slate-200">
                              {formatScore(fixture.teamAScore, fixture.teamAWickets)} vs{" "}
                              {formatScore(fixture.teamBScore, fixture.teamBWickets)}
                            </td>
                            <td className="px-4 py-3 text-emerald-100">
                              {fixture.winnerTeamId ? getTeamName(teams, fixture.winnerTeamId) : "Tie"}
                            </td>
                            <td className="px-4 py-3 text-slate-200">{formatDate(fixture.date)}</td>
                            <td className="px-4 py-3 text-slate-200">{fixture.venue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState title="No completed matches" description="Submitted results will appear here." />
              )}
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-xl font-black text-white">Upcoming Matches</h2>
              {upcomingFixtures.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {upcomingFixtures.map((fixture) => (
                    <div key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="font-black text-white">{getFixtureTitle(fixture, teams)}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {formatDate(fixture.date)} at {formatTime(fixture.time)}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">{fixture.venue}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No upcoming matches" description="Upcoming fixtures will appear here." />
              )}
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-xl font-black text-white">Full Points Table</h2>
              {pointsTable.length > 0 ? (
                <PointsTableView pointsTable={pointsTable} teams={teams} />
              ) : (
                <EmptyState title="No standings" description="The points table is empty." />
              )}
            </section>
          </GlassCard>
        </>
      )}
    </AppShell>
  );
}
