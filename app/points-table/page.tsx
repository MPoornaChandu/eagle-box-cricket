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
            description="Standings sorted by points, wins, and simplified cricket Net Run Rate."
            actions={
              <>
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="secondary-button flex items-center gap-2 px-4 py-2 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recalculate Table
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
