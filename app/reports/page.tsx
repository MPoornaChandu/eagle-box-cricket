"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, Download, FileDown, Printer } from "lucide-react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { PointsTableView } from "@/components/PointsTableView";
import { useToast } from "@/components/ToastProvider";
import { ballsToOversText, getFixtureResult, isCompletedFixture } from "@/lib/points";
import {
  addReportLog,
  generateAlerts,
  getFixtures,
  getPointsTable,
  getReports,
  getTeams
} from "@/lib/storage";
import type { AlertItem, Fixture, PointsRow, ReportLog, Team } from "@/lib/types";
import {
  downloadTextFile,
  escapeCsv,
  formatDate,
  formatDateTime,
  formatNrr,
  formatScore,
  formatTime,
  getFixtureTitle,
  getLeaderName,
  getTeamName,
  isResultStatus
} from "@/lib/utils";

interface ReportSummary {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  currentLeader: string;
  bestNrrTeam: string;
}

function buildSummary(teams: Team[], fixtures: Fixture[], pointsTable: PointsRow[]): ReportSummary {
  const bestNrr = [...pointsTable].sort((a, b) => b.netRunRate - a.netRunRate)[0];
  return {
    totalTeams: teams.length,
    totalMatches: fixtures.length,
    completedMatches: fixtures.filter(isCompletedFixture).length,
    pendingMatches: fixtures.filter((fixture) => !isResultStatus(fixture.status)).length,
    currentLeader: getLeaderName(teams, pointsTable),
    bestNrrTeam: bestNrr && bestNrr.played > 0 ? getTeamName(teams, bestNrr.teamId) : "No NRR leader yet"
  };
}

function buildPlainTextSummary(summary: ReportSummary): string {
  return [
    "Fixture & Points Table Manager - Eagle Box Cricket",
    `Total teams: ${summary.totalTeams}`,
    `Total matches: ${summary.totalMatches}`,
    `Completed matches: ${summary.completedMatches}`,
    `Pending matches: ${summary.pendingMatches}`,
    `Current leader: ${summary.currentLeader}`,
    `Best NRR team: ${summary.bestNrrTeam}`
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

function pointsCsv(pointsTable: PointsRow[], teams: Team[]): string {
  const rows = [
    ["Position", "Team", "Played", "Won", "Lost", "Tied", "No Result", "Points", "Runs For", "Balls Faced", "Overs Faced", "Runs Against", "Balls Bowled", "Overs Bowled", "NRR", "Last 5"],
    ...pointsTable.map((row, index) => [
      index + 1,
      getTeamName(teams, row.teamId),
      row.played,
      row.won,
      row.lost,
      row.tied,
      row.noResult,
      row.points,
      row.runsFor,
      row.ballsFaced,
      ballsToOversText(row.ballsFaced),
      row.runsAgainst,
      row.ballsBowled,
      ballsToOversText(row.ballsBowled),
      formatNrr(row.netRunRate),
      row.lastFive.join(" ")
    ])
  ];
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function fixturesCsv(fixtures: Fixture[], teams: Team[]): string {
  const rows = [
    ["Match ID", "Team A", "Team B", "Date", "Time", "Venue", "Type", "Status", "Winner", "Result"],
    ...fixtures.map((fixture) => {
      const result = getFixtureResult(fixture);
      return [
        fixture.matchId,
        getTeamName(teams, fixture.teamAId),
        getTeamName(teams, fixture.teamBId),
        fixture.date,
        fixture.time,
        fixture.venue,
        fixture.matchType,
        fixture.status,
        result?.winnerTeamId ? getTeamName(teams, result.winnerTeamId) : "",
        result ? `${formatScore(result.teamARuns, result.teamAWickets)} vs ${formatScore(result.teamBRuns, result.teamBWickets)} ${result.resultType}` : "Pending"
      ];
    })
  ];
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function resultsCsv(fixtures: Fixture[], teams: Team[]): string {
  const rows = [
    ["Match ID", "Team A", "Team A Score", "Team A Overs", "Team B", "Team B Score", "Team B Overs", "Result Type", "Winner", "Player of Match", "Notes"],
    ...fixtures.filter(isCompletedFixture).map((fixture) => {
      const result = getFixtureResult(fixture);
      return [
        fixture.matchId,
        getTeamName(teams, fixture.teamAId),
        result ? formatScore(result.teamARuns, result.teamAWickets) : "",
        result?.teamAOvers ?? "",
        getTeamName(teams, fixture.teamBId),
        result ? formatScore(result.teamBRuns, result.teamBWickets) : "",
        result?.teamBOvers ?? "",
        result?.resultType ?? "",
        result?.winnerTeamId ? getTeamName(teams, result.winnerTeamId) : result?.resultType ?? "",
        result?.playerOfMatch ?? "",
        result?.notes ?? ""
      ];
    })
  ];
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export default function ReportsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [reportGeneratedAt, setReportGeneratedAt] = useState("Preparing report timestamp");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    const nextTeams = getTeams();
    const nextFixtures = getFixtures();
    const nextPoints = getPointsTable();
    const nextReports = getReports();
    setTeams(nextTeams);
    setFixtures(nextFixtures);
    setPointsTable(nextPoints);
    setReports(nextReports);
    setAlerts(generateAlerts(nextTeams, nextFixtures, nextReports));
  };

  useEffect(() => {
    loadData();
    setReportGeneratedAt(new Date().toLocaleString("en-IN"));
    setLoading(false);
  }, []);

  const summary = useMemo(() => buildSummary(teams, fixtures, pointsTable), [teams, fixtures, pointsTable]);
  const completedFixtures = useMemo(
    () => fixtures.filter(isCompletedFixture).sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [fixtures]
  );
  const upcomingFixtures = useMemo(
    () => fixtures.filter((fixture) => !isResultStatus(fixture.status)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [fixtures]
  );

  const logReport = (type: ReportLog["type"], title: string, reportSummary: string) => {
    addReportLog({ type, title, summary: reportSummary });
    loadData();
  };

  const handlePointsCsv = () => {
    downloadTextFile("eagle-box-points-table.csv", pointsCsv(pointsTable, teams));
    logReport("Points Table Report", "Exported points table CSV", "CSV export generated for full points table.");
    showToast({ type: "success", title: "CSV exported", description: "Points table CSV is ready." });
  };

  const handleFixturesCsv = () => {
    downloadTextFile("eagle-box-fixtures.csv", fixturesCsv(fixtures, teams));
    logReport("Fixtures Report", "Exported fixtures CSV", "CSV export generated for fixtures and results.");
    showToast({ type: "success", title: "CSV exported", description: "Fixtures CSV is ready." });
  };

  const handleResultsCsv = () => {
    downloadTextFile("eagle-box-results.csv", resultsCsv(fixtures, teams));
    logReport("Results Report", "Exported results CSV", "CSV export generated for completed match scorecards.");
    showToast({ type: "success", title: "CSV exported", description: "Results CSV is ready." });
  };

  const handleCopy = async () => {
    try {
      await copyText(buildPlainTextSummary(summary));
      logReport("Tournament Summary", "Copied tournament summary", "Tournament summary copied for submission notes.");
      showToast({ type: "success", title: "Summary copied", description: "Tournament summary copied to clipboard." });
    } catch {
      showToast({ type: "error", title: "Copy failed", description: "Clipboard access was not available." });
    }
  };

  const handlePrint = () => {
    logReport("Tournament Summary", "Printed tournament report", "Print-friendly tournament report generated.");
    showToast({ type: "info", title: "Print dialog opening", description: "Save as PDF from the print dialog." });
    window.setTimeout(() => window.print(), 150);
  };

  const handleMockPdf = () => {
    logReport("Mock PDF Report", "Generated mock PDF report", "Mock PDF action logged. Use Print / Save as PDF for a browser PDF export.");
    showToast({ type: "success", title: "Mock PDF generated", description: "Report history updated. Print remains available for a real PDF." });
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
              description="Generate tournament, teams, fixtures, results, points table, and pending-action reports."
              actions={
                <div className="report-actions flex flex-wrap gap-2">
                  <button type="button" onClick={handlePointsCsv} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                    <Download className="h-4 w-4" />
                    Export Points CSV
                  </button>
                  <button type="button" onClick={handleFixturesCsv} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                    <Download className="h-4 w-4" />
                    Export Fixtures CSV
                  </button>
                  <button type="button" onClick={handleResultsCsv} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                    <Download className="h-4 w-4" />
                    Export Results CSV
                  </button>
                  <button type="button" onClick={handleCopy} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                    <ClipboardCopy className="h-4 w-4" />
                    Copy Summary
                  </button>
                  <button type="button" onClick={handleMockPdf} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                    <FileDown className="h-4 w-4" />
                    Generate Mock PDF
                  </button>
                  <button type="button" onClick={handlePrint} className="premium-button flex items-center gap-2 px-4 py-2 text-sm">
                    <Printer className="h-4 w-4" />
                    Print Report
                  </button>
                </div>
              }
            />
          </div>

          <section className="no-print mb-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <GlassCard className="p-5" hover={false}>
              <h2 className="mb-4 text-xl font-black text-white">Pending Actions Report</h2>
              <AlertsPanel alerts={alerts} />
            </GlassCard>
            <GlassCard className="p-5" hover={false}>
              <h2 className="mb-4 text-xl font-black text-white">Generated Reports History</h2>
              {reports.length > 0 ? (
                <div className="grid gap-3">
                  {reports.slice(0, 8).map((report) => (
                    <div key={report.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="font-black text-white">{report.title}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">{report.type}</p>
                      <p className="mt-2 text-sm text-slate-300">{report.summary}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatDateTime(report.generatedAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No report history" description="Export, print, or generate a mock PDF to add history." />
              )}
            </GlassCard>
          </section>

          <GlassCard className="report-content p-5 md:p-7" hover={false}>
            <div className="mb-6 border-b border-white/10 pb-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
                Eagle Box Cricket
              </p>
              <h1 className="mt-2 text-3xl font-black text-white">Tournament Report</h1>
              <p className="mt-2 text-sm text-slate-300">
                Generated from dashboard data on {reportGeneratedAt}.
              </p>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {[
                ["Total teams", summary.totalTeams],
                ["Total matches", summary.totalMatches],
                ["Completed", summary.completedMatches],
                ["Pending", summary.pendingMatches],
                ["Leader", summary.currentLeader],
                ["Best NRR", summary.bestNrrTeam]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-2 break-words text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-xl font-black text-white">Teams Report</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {teams.map((team) => (
                  <div key={team.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-black text-white">{team.name} ({team.shortName})</p>
                    <p className="mt-2 text-sm text-slate-300">Captain: {team.captain}</p>
                    <p className="text-sm text-slate-300">Coach: {team.coach}</p>
                    <p className="text-sm text-slate-300">Venue: {team.homeVenue}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-xl font-black text-white">Results Report</h2>
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
                        {completedFixtures.map((fixture) => {
                          const result = getFixtureResult(fixture);
                          return (
                            <tr key={fixture.id} className="border-t border-white/10">
                              <td className="px-4 py-3 font-black text-white">{fixture.matchId}: {getFixtureTitle(fixture, teams)}</td>
                              <td className="px-4 py-3 text-slate-200">
                                {result ? `${formatScore(result.teamARuns, result.teamAWickets)} vs ${formatScore(result.teamBRuns, result.teamBWickets)}` : "-"}
                              </td>
                              <td className="px-4 py-3 text-emerald-100">{result?.winnerTeamId ? getTeamName(teams, result.winnerTeamId) : result?.resultType ?? "Tie"}</td>
                              <td className="px-4 py-3 text-slate-200">{formatDate(fixture.date)}</td>
                              <td className="px-4 py-3 text-slate-200">{fixture.venue}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState title="No completed matches" description="Submitted results will appear here." />
              )}
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-xl font-black text-white">Fixtures Report</h2>
              {upcomingFixtures.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {upcomingFixtures.map((fixture) => (
                    <div key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="font-black text-white">{fixture.matchId}: {getFixtureTitle(fixture, teams)}</p>
                      <p className="mt-2 text-sm text-slate-300">{formatDate(fixture.date)} at {formatTime(fixture.time)}</p>
                      <p className="mt-1 text-sm text-slate-300">{fixture.venue} - {fixture.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No pending matches" description="Pending fixtures will appear here." />
              )}
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-xl font-black text-white">Points Table Report</h2>
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
