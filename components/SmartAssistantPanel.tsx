"use client";

import { Bot, RefreshCw, Sparkles } from "lucide-react";
import type { SmartSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface SmartAssistantPanelProps {
  summary: SmartSummary;
  onRefresh?: () => void;
}

export function SmartAssistantPanel({ summary, onRefresh }: SmartAssistantPanelProps) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-cyan-300/25 bg-cyan-400/12 text-cyan-100">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
              Smart Assistant
            </p>
            <h2 className="mt-1 text-xl font-black text-white">{summary.headline}</h2>
            <p className="mt-1 text-xs text-slate-500">Generated {formatDateTime(summary.generatedAt)}</p>
          </div>
        </div>
        {onRefresh ? (
          <button type="button" onClick={onRefresh} className="secondary-button flex items-center gap-2 px-3 py-2 text-sm font-black">
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        ) : null}
      </div>

      <div className="grid gap-2">
        {summary.insights.map((insight) => (
          <div key={insight} className="flex gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-200">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
            <span>{insight}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-emerald-300/25 bg-emerald-400/12 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
          Recommended action
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
          {summary.recommendedAction}
        </p>
      </div>
    </div>
  );
}
