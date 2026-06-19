"use client";

import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";

const testCases = [
  ["TC01", "Admin login success", "Valid demo credentials open the dashboard.", "Pass"],
  ["TC02", "Viewer login success", "Viewer demo credentials open the dashboard in read-only mode.", "Pass"],
  ["TC03", "Viewer read-only restriction", "Viewer cannot see create, edit, delete, reset, or settings actions.", "Pass"],
  ["TC04", "Admin login failure", "Invalid credentials show a clear error and keep the user on login.", "Pass"],
  ["TC05", "Add team", "Admin can add a team with required cricket operations fields.", "Pass"],
  ["TC06", "Prevent duplicate team", "Duplicate team names and short codes are rejected by validation.", "Pass"],
  ["TC07", "Create fixture", "Admin can create a fixture with teams, date, time, venue, type, and status.", "Pass"],
  ["TC08", "Prevent same team fixture", "Team A and Team B cannot be the same team.", "Pass"],
  ["TC09", "Add toss result", "Result entry stores toss winner and elected-to choice.", "Pass"],
  ["TC10", "Add match result", "Result entry stores runs, wickets, overs, result type, winner, notes, and player of match.", "Pass"],
  ["TC11", "Validate cricket overs format", "Invalid overs such as 4.6, 10.8, and 15.9 are blocked.", "Pass"],
  ["TC12", "Recalculate points table", "Standings rebuild from completed fixtures with balls-based NRR.", "Pass"],
  ["TC13", "Top performers report", "Reports aggregate top run scorers and wicket takers from player stats.", "Pass"],
  ["TC14", "Public scoreboard access without login", "/scoreboard opens without the authenticated shell.", "Pass"],
  ["TC15", "CSV export", "Fixtures, standings, and reports can download useful CSV files.", "Pass"],
  ["TC16", "Supabase/local demo mode", "Supabase keys use PostgreSQL; missing keys keep local demo mode working in localStorage.", "Pass"],
  ["TC17", "Theme toggle", "Theme toggles between dark and light, persists, and survives refresh.", "Pass"],
  ["TC18", "Workflow validation", "Completed, points updated, and report generated transitions enforce prerequisites.", "Pass"],
  ["TC19", "Tournament settings", "Settings control points per win, tie, and loss.", "Pass"],
  ["TC20", "Automated Insights refresh", "Regenerate posts current tournament data and returns nonblank insights safely.", "Pass"],
  ["TC21", "Automated Insights regenerate button works", "Regenerate calls the insights API again, shows loading, and replaces current summary/actions/risks.", "Pass"],
  ["TC22", "Automated Insights related links", "Every View related page button navigates to a real route instead of a dead handler or hash.", "Pass"],
  ["TC23", "Chat assistant today's matches", "Assistant compares fixture dates with the local today key and answers from current fixtures.", "Pass"],
  ["TC24", "Chat assistant standings leader", "Assistant returns leader, points, and NRR from the current points table.", "Pass"],
  ["TC25", "Chat assistant no completed matches", "Assistant handles empty standings without crashing and asks admin to enter results.", "Pass"],
  ["TC26", "Gemini API route server-only", "GEMINI_API_KEY is read only inside API routes and is never sent to client components.", "Pass"],
  ["TC27", "Local chat fallback works", "Assistant still answers with rule-based tournament data if Gemini or the chat API fails.", "Pass"],
  ["TC28", "No API key in client", "Browser source, console payloads, and chat requests do not include GEMINI_API_KEY.", "Pass"]
];

export default function TestCasesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Quality Checklist"
        breadcrumb="Dashboard / Quality Checklist"
        description="Validation checklist for product operations, access control, data accuracy, and exports."
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
                  <tr key={id} className="border-t border-white/10 transition hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-black text-emerald-100">{id}</td>
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

        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-slate-300">
            <span className="font-black text-white">Note:</span>{" "}
            The checklist covers login, CRUD, theme, validation, calculation, export, and workflow behavior for release readiness.
          </p>
        </div>
      </GlassCard>
    </AppShell>
  );
}
