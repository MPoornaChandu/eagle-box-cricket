"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { PointsTableView } from "@/components/PointsTableView";
import { useToast } from "@/components/ToastProvider";
import {
  getFixtures,
  getPointsTable,
  getTeams,
  recalculateAndSavePointsTable
} from "@/lib/storage";
import type { Fixture, PointsRow, Team } from "@/lib/types";
import { downloadTextFile, escapeCsv, formatNrr, getActiveFixtures, getActiveTeams, getTeamName } from "@/lib/utils";

export default function PointsTablePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    const [nextTeams, nextFixtures, nextPoints] = await Promise.all([getTeams(), getFixtures(), getPointsTable()]);
    setTeams(getActiveTeams(nextTeams));
    setFixtures(getActiveFixtures(nextFixtures, nextTeams));
    setPointsTable(nextPoints);
  };

  useEffect(() => {
    void loadData().finally(() => setLoading(false));
  }, []);

  const handleRecalculate = async () => {
    const nextTable = await recalculateAndSavePointsTable(teams, fixtures);
    setPointsTable(nextTable);
    showToast({
      type: "success",
      title: "Table recalculated",
      description: "Standings rebuilt from teams and completed fixtures."
    });
  };

  const handleExport = () => {
    const rows = [
      ["Rank", "Team", "Played", "Won", "Lost", "Tied", "No Result", "NRR", "Points"],
      ...pointsTable.map((row, index) => [
        index + 1,
        getTeamName(teams, row.teamId),
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

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading points table" />
      ) : (
        <>
          <PageHeader
            title="Points Table"
            breadcrumb="Dashboard / Points Table"
            description="Standings sorted by points, NRR, wins, and team name, recalculated from completed fixtures."
            actions={
              <>
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recalculate Points
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
              </>
            }
          />

          <GlassCard className="p-5" hover={false}>
            {pointsTable.length > 0 ? (
              <PointsTableView pointsTable={pointsTable} teams={teams} />
            ) : (
              <EmptyState
                title="No completed matches yet"
                description="Enter results to generate standings."
              />
            )}
          </GlassCard>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-300">
              <span className="font-black text-white">How points are calculated:</span>{" "}
              Points come from Tournament Settings. NRR = (runs scored / overs faced) - (runs conceded / overs bowled).
              Overs are tracked as balls internally for precision. Table sorts by: Points desc, NRR desc, Wins desc, Team name asc.
            </p>
          </div>
        </>
      )}
    </AppShell>
  );
}
