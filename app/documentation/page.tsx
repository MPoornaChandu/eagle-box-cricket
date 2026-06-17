"use client";

import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";

const featureList = [
  "Admin login with localStorage session",
  "Teams CRUD with validation and active/inactive status",
  "Fixtures CRUD with match ID, type, workflow status, toss winner, and notes",
  "Match result entry with normal win, tie, no result, and walkover support",
  "Automatic points table recalculation with NRR and last-five form",
  "Workflow kanban board with guarded status transitions",
  "Reports with CSV export, print support, mock PDF log, and history",
  "Rule-based alerts and Smart Assistant recommendations",
  "Visible test cases for internship evaluation"
];

const futureScope = [
  "Connect local data services to Supabase or Firebase repositories",
  "Add role-based users for admin, scorer, and viewer",
  "Generate real PDF files on the server",
  "Add live score updates and ball-by-ball innings tracking",
  "Enhance Smart Assistant through a secure server-side AI route"
];

function Flow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item, index) => (
        <div key={item} className="flex items-center gap-3">
          <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50">
            {item}
          </div>
          {index < items.length - 1 ? <ArrowRight className="h-5 w-5 text-slate-500" /> : null}
        </div>
      ))}
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <AppShell>
      <PageHeader
        title="Documentation"
        breadcrumb="Dashboard / Documentation"
        description="Internship presentation notes for the Eagle Box Cricket Fixture & Points Table Manager."
      />

      <div className="grid gap-6">
        <GlassCard className="p-5" hover={false}>
          <h2 className="text-xl font-black text-white">Project Overview</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            Eagle Box Cricket is a premium dark admin prototype for managing cricket tournament operations: team setup, fixture scheduling, match result entry, points table automation, workflow tracking, alerts, reports, and presentation-ready documentation.
          </p>
        </GlassCard>

        <section className="grid gap-6 xl:grid-cols-2">
          <GlassCard className="p-5" hover={false}>
            <h2 className="text-xl font-black text-white">Problem Statement</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Tournament administrators need a simple system to maintain teams, fixtures, results, standings, and reports without manually recalculating points or losing workflow visibility.
            </p>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <h2 className="text-xl font-black text-white">Proposed Solution</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              A local-first Next.js dashboard with reusable services, typed data models, automatic points calculation, workflow validation, report exports, and rule-based assistant insights.
            </p>
          </GlassCard>
        </section>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-xl font-black text-white">Technology Stack</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Next.js", "React", "TypeScript", "Tailwind CSS", "localStorage", "Framer Motion", "Lucide Icons", "CSV/Print Export"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-white">
                {item}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-xl font-black text-white">Features Implemented</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {featureList.map((feature) => (
              <div key={feature} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                {feature}
              </div>
            ))}
          </div>
        </GlassCard>

        <section className="grid gap-6 xl:grid-cols-2">
          <GlassCard className="p-5" hover={false}>
            <h2 className="text-xl font-black text-white">Database / Data Model</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p><span className="font-black text-white">Team:</span> name, short code, captain, coach, venue, contact, logo, created date, status.</p>
              <p><span className="font-black text-white">Fixture:</span> match ID, teams, date/time, venue, type, workflow status, toss winner, score fields, notes.</p>
              <p><span className="font-black text-white">MatchResult:</span> runs, wickets, overs, winner, result type, player of match, notes.</p>
              <p><span className="font-black text-white">PointsRow:</span> played, won, lost, tied, no result, points, runs, overs, NRR, form.</p>
              <p><span className="font-black text-white">ReportLog:</span> type, title, generated timestamp, fixture link, summary.</p>
            </div>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <h2 className="text-xl font-black text-white">API / Data Layer</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Shared helper functions in the data layer provide `getTeams`, `saveTeams`, `getFixtures`, `saveFixtures`, `getReports`, `saveReports`, `calculatePointsTable`, `generateAlerts`, and `generateSmartSummary`. The implementation uses localStorage now and is structured for a future Supabase/Firebase repository swap.
            </p>
          </GlassCard>
        </section>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-xl font-black text-white">Architecture Diagram</h2>
          <div className="mt-4">
            <Flow items={["Frontend Dashboard", "Data Service", "LocalStorage / Supabase-ready DB", "Points Engine", "Reports / AI Summary"]} />
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-xl font-black text-white">ER Diagram</h2>
          <div className="mt-4">
            <Flow items={["Team", "Fixture", "MatchResult", "PointsTable", "ReportLog"]} />
          </div>
        </GlassCard>

        <section className="grid gap-6 xl:grid-cols-2">
          <GlassCard className="p-5" hover={false}>
            <h2 className="text-xl font-black text-white">Workflow Explanation</h2>
            <div className="mt-4">
              <Flow items={["Draft", "Scheduled", "Completed", "Points Updated", "Report Generated"]} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              The workflow board enforces prerequisites: result entry is required before completion, and points update is required before report generation.
            </p>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <h2 className="text-xl font-black text-white">Future Scope</h2>
            <div className="mt-4 grid gap-3">
              {futureScope.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-xl font-black text-white">GitHub / Demo Submission Checklist</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {["Run npm run build successfully", "Use demo login admin@eaglebox.com / admin123", "Reset demo data before evaluation", "Show dashboard summary and Smart Assistant", "Add a team and prevent duplicate", "Create a fixture and prevent same-team fixture", "Enter result and show recalculated points table", "Use workflow transitions and report exports"].map((item) => (
              <div key={item} className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-50">
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
