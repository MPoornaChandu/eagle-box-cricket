"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import type { ReactNode } from "react";
import type { SmartSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface SmartAssistantPanelProps {
  summary: SmartSummary | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void | Promise<void>;
}

function BulletList({ items, icon }: { items: string[]; icon: ReactNode }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item}
          className="flex min-h-[3rem] items-start gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-slate-200"
        >
          <span className="mt-0.5 shrink-0">{icon}</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-400/12 text-emerald-100">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-3 w-36 rounded-full bg-white/10" />
          <div className="mt-3 h-5 w-full max-w-lg rounded-full bg-white/10" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 rounded-lg border border-white/10 bg-white/[0.035]" />
        ))}
      </div>
    </div>
  );
}

export function SmartAssistantPanel({
  summary,
  loading = false,
  error,
  onRefresh
}: SmartAssistantPanelProps) {
  if (loading && !summary) {
    return <LoadingState />;
  }

  if (!summary) {
    return (
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-red-300/30 bg-red-400/12 text-red-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">
              Smart Assistant
            </p>
            <h2 className="mt-1 text-xl font-black text-white">Assistant unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {error ?? "The assistant could not generate a Gemini or rule-based summary."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isGemini = summary.mode === "gemini";
  const badgeText = isGemini ? "Gemini AI" : "Rule-based fallback";
  const badgeClass = isGemini
    ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100"
    : "border-amber-300/30 bg-amber-400/12 text-amber-100";

  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-400/12 text-emerald-100">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                Smart Assistant
              </p>
              <span className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] ${badgeClass}`}>
                {badgeText}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-black text-white">Summary</h2>
            <p className="mt-1 text-xs text-slate-500">Generated {formatDateTime(summary.generatedAt)}</p>
          </div>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading}
            className="secondary-button flex items-center gap-2 px-3 py-2 text-sm font-black"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Regenerate
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 flex gap-2 rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="rounded-lg border border-emerald-300/22 bg-emerald-400/10 p-4">
        <p className="text-sm font-semibold leading-6 text-emerald-50">{summary.summary}</p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-white">
            <Sparkles className="h-4 w-4 text-amber-200" />
            Insights
          </h3>
          <BulletList items={summary.insights} icon={<Sparkles className="h-4 w-4 text-amber-200" />} />
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
            Recommended Actions
          </h3>
          <BulletList items={summary.recommendedActions} icon={<CheckCircle2 className="h-4 w-4 text-emerald-200" />} />
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-white">
            <ShieldAlert className="h-4 w-4 text-red-200" />
            Risks / Alerts
          </h3>
          <BulletList items={summary.risks} icon={<ShieldAlert className="h-4 w-4 text-red-200" />} />
        </section>
      </div>
    </div>
  );
}
