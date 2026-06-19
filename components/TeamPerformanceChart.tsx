"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PointsRow, Team } from "@/lib/types";
import { getTeamName } from "@/lib/utils";

interface TeamPerformanceChartProps {
  pointsTable: PointsRow[];
  teams: Team[];
}

export function TeamPerformanceChart({ pointsTable, teams }: TeamPerformanceChartProps) {
  const data = pointsTable.map((row) => ({
    team: getTeamName(teams, row.teamId),
    Wins: row.won,
    Losses: row.lost,
    Points: row.points
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
          <XAxis dataKey="team" tick={{ fill: "currentColor", fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
          <YAxis allowDecimals={false} tick={{ fill: "currentColor", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            contentStyle={{
              background: "rgba(15, 23, 42, 0.94)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 8,
              color: "#f8fafc"
            }}
          />
          <Legend />
          <Bar dataKey="Wins" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Losses" fill="#ef4444" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Points" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
