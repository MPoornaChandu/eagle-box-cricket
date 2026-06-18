"use client";

import { useEffect, useState } from "react";
import { DatabaseZap, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  recalculateAndSavePointsTable,
  resetAllData
} from "@/lib/storage";
import type { Fixture, PointsRow, Team } from "@/lib/types";

export default function PointsTablePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsRow[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = () => {
    setTeams(getTeams());
    setFixtures(getFixtures());
    setPointsTable(getPointsTable());
  };

  useEffect(() => {
    loadData();
    setLoading(false);
  }, []);

  const handleRecalculate = () => {
    const nextTable = recalculateAndSavePointsTable(teams, fixtures);
    setPointsTable(nextTable);
    showToast({
      type: "success",
      title: "Table recalculated",
      description: "Standings rebuilt from teams and completed fixtures."
    });
  };

  const handleReset = () => {
    resetAllData();
    setResetOpen(false);
    loadData();
    showToast({
      type: "success",
      title: "Demo data reset",
      description: "Seed teams, fixtures, and points table are reloaded."
    });
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
                  onClick={() => setResetOpen(true)}
                  className="premium-button flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <DatabaseZap className="h-4 w-4" />
                  Reset Demo Data
                </button>
              </>
            }
          />

          <GlassCard className="p-5" hover={false}>
            {pointsTable.length > 0 ? (
              <PointsTableView pointsTable={pointsTable} teams={teams} />
            ) : (
              <EmptyState
                title="No points data"
                description="Add teams or seed demo data to initialize standings."
              />
            )}
          </GlassCard>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-300">
              <span className="font-black text-white">How points are calculated:</span>{" "}
              Win = 2 points · Tie = 1 point each · No Result = 1 point each · Loss = 0 points.
              NRR = (runs scored / overs faced) - (runs conceded / overs bowled). Overs are tracked as balls internally for precision.
              Table sorts by: Points ↓, NRR ↓, Wins ↓, Team name ↑.
            </p>
          </div>

          <ConfirmDialog
            open={resetOpen}
            title="Reset demo data?"
            description="This will clear all current local teams, fixtures, results, and standings, then reload the Eagle Box Cricket demo data."
            confirmText="Reset"
            onClose={() => setResetOpen(false)}
            onConfirm={handleReset}
          />
        </>
      )}
    </AppShell>
  );
}
