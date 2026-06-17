"use client";

import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";

const testCases = [
  ["TC-01", "Admin login success", "Valid demo credentials open the dashboard.", "Pass"],
  ["TC-02", "Admin login fail", "Invalid credentials show a clear error and keep user on login.", "Pass"],
  ["TC-03", "Add team", "Admin can add team with name, short code, captain, coach, venue, and status.", "Pass"],
  ["TC-04", "Prevent duplicate team", "Duplicate team names are rejected by validation/service layer.", "Pass"],
  ["TC-05", "Create fixture", "Admin can create fixture with teams, date, time, venue, type, and status.", "Pass"],
  ["TC-06", "Prevent same team fixture", "Fixture creation blocks Team A and Team B being the same.", "Pass"],
  ["TC-07", "Add match result", "Result entry stores scorecard, winner/result type, notes, and player of match.", "Pass"],
  ["TC-08", "Points table recalculation", "Standings are rebuilt from teams plus completed/resulted fixtures.", "Pass"],
  ["TC-09", "NRR calculation", "NRR uses runs scored/overs faced minus runs conceded/overs bowled.", "Pass"],
  ["TC-10", "Workflow status validation", "Completed/report transitions are blocked until prerequisites are met.", "Pass"],
  ["TC-11", "CSV export", "Reports page exports points table and fixtures CSV files.", "Pass"]
];

export default function TestCasesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Test Cases"
        breadcrumb="Dashboard / Test Cases"
        description="Visible validation checklist for internship evaluation and project demonstration."
      />

      <GlassCard className="p-5" hover={false}>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-slate-300">
                <tr>
                  <th className="px-4 py-3">Test ID</th>
                  <th className="px-4 py-3">Scenario</th>
                  <th className="px-4 py-3">Expected Result</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {testCases.map(([id, scenario, expected, status]) => (
                  <tr key={id} className="border-t border-white/10">
                    <td className="px-4 py-4 font-black text-cyan-100">{id}</td>
                    <td className="px-4 py-4 font-black text-white">{scenario}</td>
                    <td className="px-4 py-4 text-slate-300">{expected}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/12 px-3 py-1 text-xs font-black text-emerald-100">
                        <CheckCircle2 className="h-4 w-4" />
                        {status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </AppShell>
  );
}
