"use client";

import { Crown } from "lucide-react";
import { ballsToOversText } from "@/lib/points";
import type { PointsRow, Team } from "@/lib/types";
import { cn, formatNrr, getTeamName } from "@/lib/utils";

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
              <th className="px-4 py-4">Pos</th>
              <th className="px-4 py-4">Team</th>
              <th className="px-4 py-4">P</th>
              <th className="px-4 py-4">W</th>
              <th className="px-4 py-4">L</th>
              <th className="px-4 py-4">T</th>
              <th className="px-4 py-4">NR</th>
              <th className="px-4 py-4">Pts</th>
              {!compact ? (
                <>
                  <th className="px-4 py-4">Runs For</th>
                  <th className="px-4 py-4">Balls Faced</th>
                  <th className="px-4 py-4">Runs Against</th>
                  <th className="px-4 py-4">Balls Bowled</th>
                </>
              ) : null}
              <th className="px-4 py-4">NRR</th>
              {!compact ? <th className="px-4 py-4">Last 5</th> : null}
            </tr>
          </thead>
          <tbody>
            {pointsTable.map((row, index) => {
              const leader = index === 0 && row.played > 0;
              const lastFive = row.lastFive ?? [];

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
                  <td className="px-4 py-4 text-amber-200">{row.tied}</td>
                  <td className="px-4 py-4 text-slate-200">{row.noResult}</td>
                  <td className="px-4 py-4 font-black text-white">{row.points}</td>
                  {!compact ? (
                    <>
                      <td className="px-4 py-4 text-slate-200">{row.runsFor}</td>
                      <td className="px-4 py-4 text-slate-200" title={`${ballsToOversText(row.ballsFaced)} overs`}>{row.ballsFaced}</td>
                      <td className="px-4 py-4 text-slate-200">{row.runsAgainst}</td>
                      <td className="px-4 py-4 text-slate-200" title={`${ballsToOversText(row.ballsBowled)} overs`}>{row.ballsBowled}</td>
                    </>
                  ) : null}
                  <td className="px-4 py-4 font-black text-emerald-100">
                    {formatNrr(row.netRunRate)}
                  </td>
                  {!compact ? (
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {lastFive.length > 0 ? (
                          lastFive.map((form, formIndex) => (
                            <span
                              key={`${row.teamId}-${form}-${formIndex}`}
                              className={cn(
                                "grid h-7 min-w-7 place-items-center rounded-full border px-1 text-[0.68rem] font-black",
                                form === "W" && "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
                                form === "L" && "border-red-300/30 bg-red-400/12 text-red-100",
                                form === "T" && "border-amber-300/30 bg-amber-400/12 text-amber-100",
                                form === "NR" && "border-slate-300/30 bg-slate-400/12 text-slate-100"
                              )}
                            >
                              {form}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-xs text-slate-400">
          Points table is auto-calculated from completed fixtures. Win = 2 pts · Tie = 1 pt each · No Result = 1 pt each · Loss = 0 pts.
        </p>
      </div>
    </div>
  );
}
