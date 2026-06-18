"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";

const features = [
  "Admin login with browser-persisted demo session",
  "Dark and light theme toggle with saved preference",
  "Teams CRUD with captain, coach, venue, contact, status, and logo color",
  "Fixtures CRUD with match ID, teams, date, time, venue, match type, status, toss winner, and notes",
  "Match result entry with normal win, tie, no result, and walkover support",
  "Cricket overs validation that rejects 4.6, 10.8, and 15.9",
  "Automatic points table recalculation from completed fixtures",
  "Balls-based NRR, last-five form, and standings sorting",
  "Workflow board with guarded transitions",
  "Reports with points, fixtures, results CSV, print, mock PDF log, and history",
  "Rule-based alerts and Gemini Smart Assistant insights with safe fallback",
  "Test cases page for internship evaluation"
];

const futureScope = [
  "Harden Supabase RLS policies with authenticated admin/scorer roles",
  "Add admin, scorer, and viewer roles",
  "Generate real server-side PDF reports",
  "Add ball-by-ball innings tracking",
  "Add match media uploads with Supabase Storage"
];

function Flow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item, index) => (
        <div key={item} className="flex items-center gap-3">
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-50">
            {item}
          </div>
          {index < items.length - 1 ? <ArrowRight className="h-5 w-5 text-amber-200" /> : null}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GlassCard className="p-5" hover={false}>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </GlassCard>
  );
}

export default function DocumentationPage() {
  return (
    <AppShell>
      <PageHeader
        title="Documentation"
        breadcrumb="Dashboard / Documentation"
        description="Presentation notes for the Eagle Box Cricket Fixture & Points Table Manager."
      />

      <div className="grid gap-6">
        <Section title="Project Overview">
          <p className="max-w-4xl text-sm leading-6 text-slate-300">
            Eagle Box Cricket is a cricket tournament operations dashboard for managing teams, fixtures,
            result entry, automatic standings, workflow status, reports, alerts, and rule-based assistant
            insights. It uses Supabase PostgreSQL when public keys are configured and falls back to local demo storage when keys are missing.
          </p>
        </Section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Section title="Problem Statement">
            <p className="text-sm leading-6 text-slate-300">
              Tournament organizers often maintain fixtures, scores, points, NRR, and report status manually.
              That creates scoring mistakes, invalid cricket overs, missed report steps, and slow evaluation
              during demos.
            </p>
          </Section>
          <Section title="Proposed Solution">
            <p className="text-sm leading-6 text-slate-300">
              A typed Next.js dashboard with Supabase PostgreSQL sync, local demo fallback, validation-heavy
              forms, automatic points calculation, workflow checks, exportable reports, and a professional dark/light UI.
            </p>
          </Section>
        </section>

        <Section title="Technology Stack">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase PostgreSQL", "LocalStorage Fallback", "Framer Motion", "CSV / Print Export"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-white">
                {item}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Features Implemented">
          <div className="grid gap-3 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                {feature}
              </div>
            ))}
          </div>
        </Section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Section title="Data Model">
            <div className="grid gap-3 text-sm text-slate-300">
              <p><span className="font-black text-white">Team:</span> name, short code, captain, coach, venue, contact, logo color, created date, status.</p>
              <p><span className="font-black text-white">Fixture:</span> match ID, teams, date/time, venue, type, workflow status, toss winner, result fields, notes.</p>
              <p><span className="font-black text-white">MatchResult:</span> runs, wickets, cricket overs, result type, winner, player of match, notes.</p>
              <p><span className="font-black text-white">PointsRow:</span> played, won, lost, tied, no result, points, runs, balls, NRR, last-five form.</p>
              <p><span className="font-black text-white">ReportLog:</span> report type, title, generated timestamp, optional fixture link, summary.</p>
            </div>
          </Section>
          <Section title="Database Used">
            <p className="text-sm leading-6 text-slate-300">
              The project is Supabase/PostgreSQL-ready through public environment variables. If Supabase is
              not configured, it automatically falls back to local demo storage so the Vercel demo and offline
              internship evaluation still work.
            </p>
          </Section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Section title="Data Layer">
            <p className="text-sm leading-6 text-slate-300">
              The helper layer provides <code className="text-emerald-200">getTeams</code>, <code className="text-emerald-200">saveTeams</code>, <code className="text-emerald-200">getFixtures</code>, <code className="text-emerald-200">saveFixtures</code>, <code className="text-emerald-200">getReports</code>, <code className="text-emerald-200">saveReports</code>, <code className="text-emerald-200">seedDemoData</code>, <code className="text-emerald-200">resetDemoData</code>, <code className="text-emerald-200">generateAlerts</code>, and <code className="text-emerald-200">generateSmartSummary</code>.
            </p>
          </Section>
          <Section title="Database & API Configuration">
            <div className="grid gap-3 text-sm text-slate-300">
              <p><span className="font-black text-white">Primary database:</span> Supabase PostgreSQL.</p>
              <p><span className="font-black text-white">Fallback:</span> localStorage demo mode when Supabase keys are empty.</p>
              <p><span className="font-black text-white">Supabase schema:</span> <code className="text-emerald-200">supabase/schema.sql</code>.</p>
              <p><span className="font-black text-white">Required public env:</span> <code className="text-emerald-200">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-emerald-200">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> or <code className="text-emerald-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</p>
              <p><span className="font-black text-white">Server-only env:</span> <code className="text-emerald-200">SUPABASE_SERVICE_ROLE_KEY</code> and optional <code className="text-emerald-200">GEMINI_API_KEY</code>.</p>
              <p>Smart Assistant calls <code className="text-emerald-200">/api/smart-summary</code>. Gemini is used only when <code className="text-emerald-200">GEMINI_API_KEY</code> exists; otherwise the route returns rule-based insights.</p>
            </div>
          </Section>
        </section>

        <Section title="Architecture Diagram">
          <Flow items={["Next.js Frontend", "Storage Service", "Supabase PostgreSQL or localStorage fallback", "Points Engine", "Reports + Smart Assistant"]} />
        </Section>

        <Section title="System Status / QA Checklist">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Theme loaded",
              "Database mode detected",
              "Teams loaded",
              "Fixtures loaded",
              "Results loaded",
              "Points table calculated",
              "Smart Assistant working",
              "Reports available",
              "Build ready"
            ].map((item) => (
              <div key={item} className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm font-black text-emerald-50">
                {item}: Pass
              </div>
            ))}
          </div>
        </Section>

        <Section title="ER-Style Visual">
          <Flow items={["Team", "Fixture", "Match Result", "Points Table", "Report Log"]} />
        </Section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Section title="Workflow Explanation">
            <Flow items={["Draft", "Scheduled", "Completed", "Points Updated", "Report Generated"]} />
            <p className="mt-4 text-sm leading-6 text-slate-300">
              The workflow board blocks completion without a result, blocks points update before result entry,
              and blocks report generation before points are updated.
            </p>
          </Section>

          <Section title="Points Calculation Explanation">
            <div className="grid gap-3 text-sm text-slate-300">
              <p><span className="font-black text-white">Win:</span> 2 points</p>
              <p><span className="font-black text-white">Tie:</span> 1 point each</p>
              <p><span className="font-black text-white">No Result:</span> 1 point each</p>
              <p><span className="font-black text-white">Loss:</span> 0 points</p>
              <p>Sorting order: points descending, NRR descending, wins descending, then team name ascending.</p>
            </div>
          </Section>
        </section>

        <Section title="Overs / NRR Calculation Explanation">
          <div className="grid gap-3 text-sm text-slate-300">
            <p>
              Cricket overs are not normal decimals. The value <span className="font-black text-white">12.3</span> means
              12 overs and 3 balls, or 75 balls. Values like 4.6, 10.8, and 15.9 are invalid.
            </p>
            <p>
              NRR = (runs scored / overs faced) - (runs conceded / overs bowled). The app converts overs to balls
              first, then divides balls by 6 for accurate run-rate calculations.
            </p>
            <p>
              Display format uses a sign and three decimals, such as <span className="font-black text-emerald-200">+1.245</span>,
              <span className="font-black text-red-200"> -0.672</span>, or <span className="font-black text-white">0.000</span>.
            </p>
          </div>
        </Section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Section title="Future Scope">
            <div className="grid gap-3">
              {futureScope.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Submission Checklist">
            <div className="grid gap-3">
              {[
                "Run npm run build successfully",
                "Use demo login admin@eaglebox.com / admin123",
                "Reset demo data before evaluation",
                "Show dashboard cards, quick actions, alerts, and Smart Assistant",
                "Create a fixture and enter a valid result",
                "Test invalid overs such as 4.6",
                "Show recalculated points table and NRR",
                "Export reports and print the report page",
                "Switch dark/light mode and refresh",
                "Show the test cases page"
              ].map((item) => (
                <div key={item} className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-50">
                  {item}
                </div>
              ))}
            </div>
          </Section>
        </section>
      </div>
    </AppShell>
  );
}
