"use client";

import { Crown } from "lucide-react";
import type { PointsRow, Team } from "@/lib/types";
import { cn, getTeamName } from "@/lib/utils";

interface PointsTableViewProps {
  pointsTable: PointsRow[];
  teams: Team[];
  compact?: boolean;
}

export function PointsTableView({ pointsTable, teams, compact = false }: PointsTableViewProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-slate-300">
            <tr>
              <th className="px-4 py-4">Rank</th>
              <th className="px-4 py-4">Team</th>
              <th className="px-4 py-4">Played</th>
              <th className="px-4 py-4">Won</th>
              <th className="px-4 py-4">Lost</th>
              <th className="px-4 py-4">Tied</th>
              <th className="px-4 py-4">Points</th>
              {!compact ? (
                <>
                  <th className="px-4 py-4">Runs For</th>
                  <th className="px-4 py-4">Runs Against</th>
                  <th className="px-4 py-4">Overs For</th>
                  <th className="px-4 py-4">Overs Against</th>
                </>
              ) : null}
              <th className="px-4 py-4">NRR</th>
            </tr>
          </thead>
          <tbody>
            {pointsTable.map((row, index) => {
              const leader = index === 0 && row.played > 0;

              return (
                <tr
                  key={row.teamId}
                  className={cn(
                    "border-t border-white/10 transition hover:bg-white/[0.045]",
                    leader && "bg-amber-400/[0.07] shadow-gold"
                  )}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 font-black text-white">
                      {leader ? <Crown className="h-5 w-5 text-amber-300" /> : null}
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-black text-white">{getTeamName(teams, row.teamId)}</div>
                    {leader ? (
                      <span className="mt-1 inline-flex rounded-full border border-amber-300/35 bg-amber-400/12 px-2 py-1 text-xs font-black text-amber-100">
                        Table Leader
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-slate-200">{row.played}</td>
                  <td className="px-4 py-4 text-emerald-200">{row.won}</td>
                  <td className="px-4 py-4 text-red-200">{row.lost}</td>
                  <td className="px-4 py-4 text-cyan-200">{row.tied}</td>
                  <td className="px-4 py-4 font-black text-white">{row.points}</td>
                  {!compact ? (
                    <>
                      <td className="px-4 py-4 text-slate-200">{row.runsFor}</td>
                      <td className="px-4 py-4 text-slate-200">{row.runsAgainst}</td>
                      <td className="px-4 py-4 text-slate-200">{row.oversFor.toFixed(2)}</td>
                      <td className="px-4 py-4 text-slate-200">{row.oversAgainst.toFixed(2)}</td>
                    </>
                  ) : null}
                  <td className="px-4 py-4 font-black text-cyan-100">
                    {row.netRunRate.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
