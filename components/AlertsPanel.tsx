"use client";

import { AlertTriangle, Info, Siren } from "lucide-react";
import type { AlertItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

export function AlertsPanel({ alerts, compact = false }: { alerts: AlertItem[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return <EmptyState title="No alerts" description="Tournament operations are clear right now." />;
  }

  return (
    <div className="grid gap-3">
      {alerts.slice(0, compact ? 4 : alerts.length).map((alert) => {
        const Icon =
          alert.severity === "critical" ? Siren : alert.severity === "warning" ? AlertTriangle : Info;

        return (
          <div
            key={alert.id}
            className={cn(
              "rounded-lg border p-4",
              alert.severity === "critical" && "border-red-300/30 bg-red-400/12",
              alert.severity === "warning" && "border-amber-300/30 bg-amber-400/12",
              alert.severity === "info" && "border-emerald-300/25 bg-emerald-400/10"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div>
                <p className="font-black text-white">{alert.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-300">{alert.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
