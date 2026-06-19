"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/ToastProvider";
import { getPointsTable, getTeams } from "@/lib/storage";
import type { PointsRow, Team } from "@/lib/types";
import { downloadTextFile, escapeCsv, formatNrr, getActiveTeams, getTeamName } from "@/lib/utils";

type SortKey = "rank" | "team" | "played" | "won" | "lost" | "tied" | "noResult" | "netRunRate" | "points";
type SortDirection = "asc" | "desc";

export default function StandingsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      const [nextTeams, nextPoints] = await Promise.all([getTeams(), getPointsTable()]);
      setTeams(getActiveTeams(nextTeams));
      setPointsTable(nextPoints);
      setLoading(false);
    }
    void loadData();
  }, []);

  const sortedRows = useMemo(() => {
    const rows = pointsTable.map((row, index) => ({ ...row, rank: index + 1, team: getTeamName(teams, row.teamId) }));
    if (sortKey === "rank") return rows;

    return [...rows].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const multiplier = sortDirection === "asc" ? 1 : -1;
      if (typeof aValue === "string" && typeof bValue === "string") return aValue.localeCompare(bValue) * multiplier;
      return (Number(aValue) - Number(bValue)) * multiplier;
    });
  }, [pointsTable, sortDirection, sortKey, teams]);

  const toggleSort = (key: SortKey) => {
    if (key === "rank") {
      setSortKey("rank");
      setSortDirection("asc");
      return;
    }
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "team" ? "asc" : "desc");
  };

  const exportCsv = () => {
    const rows = [
      ["Rank", "Team", "Played", "Won", "Lost", "Tied", "No Result", "NRR", "Points"],
      ...sortedRows.map((row) => [
        row.rank,
        row.team,
        row.played,
        row.won,
        row.lost,
        row.tied,
        row.noResult,
        formatNrr(row.netRunRate),
        row.points
      ])
    ];
    downloadTextFile("eagle-box-standings.csv", rows.map((row) => row.map(escapeCsv).join(",")).join("\n"));
    showToast({ type: "success", title: "CSV exported", description: "Standings CSV is ready." });
  };

  const headers: Array<[SortKey, string]> = [
    ["rank", "Rank"],
    ["team", "Team"],
    ["played", "Played"],
    ["won", "Won"],
    ["lost", "Lost"],
    ["tied", "Tied"],
    ["noResult", "No Result"],
    ["netRunRate", "NRR"],
    ["points", "Points"]
  ];

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading standings" />
      ) : (
        <>
          <PageHeader
            title="Standings"
            breadcrumb="Dashboard / Standings"
            description="Full sortable table for played, wins, losses, ties, no results, NRR, and points."
            actions={
              <button type="button" onClick={exportCsv} className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black">
                <Download className="h-4 w-4" />
                Download CSV
              </button>
            }
          />

          <GlassCard className="p-5" hover={false}>
            {sortedRows.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-white/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-slate-300">
                      <tr>
                        {headers.map(([key, label]) => (
                          <th key={key} className="px-4 py-3">
                            <button type="button" onClick={() => toggleSort(key)} className="flex items-center gap-2 font-black">
                              {label}
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.teamId} className="border-t border-white/10">
                          <td className="px-4 py-4 font-black text-white">{row.rank}</td>
                          <td className="px-4 py-4 font-black text-white">{row.team}</td>
                          <td className="px-4 py-4 text-slate-200">{row.played}</td>
                          <td className="px-4 py-4 text-emerald-200">{row.won}</td>
                          <td className="px-4 py-4 text-red-200">{row.lost}</td>
                          <td className="px-4 py-4 text-amber-200">{row.tied}</td>
                          <td className="px-4 py-4 text-slate-200">{row.noResult}</td>
                          <td className="px-4 py-4 font-black text-emerald-100">{formatNrr(row.netRunRate)}</td>
                          <td className="px-4 py-4 font-black text-white">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState title="No completed matches yet" description="Enter results to generate standings." />
            )}
          </GlassCard>
        </>
      )}
    </AppShell>
  );
}
