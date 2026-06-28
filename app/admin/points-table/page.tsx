"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/league/AdminShell";
import { PlayoffBracket, PointsTable } from "@/components/league/LeagueCards";
import type { PointsTableRow, Team } from "@/lib/leagueTypes";
import { calculatePlayoffBracket, calculatePointsTable, getMatches, getTeams } from "@/lib/leagueStorage";

export default function AdminPointsTablePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [rows, setRows] = useState<PointsTableRow[]>([]);

  useEffect(() => {
    const nextTeams = getTeams();
    setTeams(nextTeams);
    setRows(calculatePointsTable(nextTeams, getMatches()));
  }, []);

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Table data</p>
      <h1 className="mt-2 text-4xl font-black text-white">Points Table</h1>
      <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <PointsTable rows={rows} teams={teams} />
      </div>
      <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <h2 className="mb-4 text-2xl font-black text-white">Playoff Bracket</h2>
        <PlayoffBracket fixtures={calculatePlayoffBracket(rows, teams)} />
      </div>
    </AdminShell>
  );
}
