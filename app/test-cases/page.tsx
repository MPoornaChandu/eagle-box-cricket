"use client";

import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";

const testCases = [
  ["TC01", "Admin login success", "Valid demo credentials open the dashboard.", "Pass"],
  ["TC02", "Admin login failure", "Invalid credentials show a clear error and keep the user on login.", "Pass"],
  ["TC03", "Add team", "Admin can add a team with required cricket operations fields.", "Pass"],
  ["TC04", "Prevent duplicate team", "Duplicate team names are rejected by validation.", "Pass"],
  ["TC05", "Create fixture", "Admin can create a fixture with teams, date, time, venue, type, and status.", "Pass"],
  ["TC06", "Prevent same team fixture", "Team A and Team B cannot be the same team.", "Pass"],
  ["TC07", "Add match result", "Result entry stores runs, wickets, overs, result type, winner, notes, and player of match.", "Pass"],
  ["TC08", "Validate cricket overs format", "Invalid overs such as 4.6, 10.8, and 15.9 are blocked.", "Pass"],
  ["TC09", "Recalculate points table", "Standings rebuild from completed fixtures with balls-based NRR.", "Pass"],
  ["TC10", "Generate report", "Reports can be exported, printed, and logged with timestamps.", "Pass"],
  ["TC11", "Dark/light mode toggle", "Theme toggles between dark and light, persists, and survives refresh.", "Pass"],
  ["TC12", "Supabase keys missing fallback to localStorage", "Empty Supabase env vars keep the app working in local demo storage mode.", "Pass"],
  ["TC13", "Supabase database mode loads when keys exist", "Dashboard shows Supabase mode when URL and publishable/anon key are configured.", "Pass"],
  ["TC14", "Gemini fallback summary", "Smart Assistant API route returns rule-based summary without GEMINI_API_KEY or when Gemini fails.", "Pass"],
  ["TC15", "Gemini key exists AI summary route works", "Server route can call Gemini with GEMINI_API_KEY without exposing it to the frontend.", "Pass"],
  ["TC16", ".env.local not committed to GitHub", ".env.local is ignored by .gitignore while .env.example remains tracked.", "Pass"],
  ["TC17", "Smart Assistant refresh", "Regenerate posts current tournament data and refreshes Gemini or rule-based cards safely.", "Pass"],
  ["TC18", "Workflow validation", "Completed, points updated, and report generated transitions enforce prerequisites.", "Pass"]
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
            The checklist covers login, CRUD, theme, validation, calculation, export, and workflow features required by the internship PDF.
          </p>
        </div>
      </GlassCard>
    </AppShell>
  );
}
