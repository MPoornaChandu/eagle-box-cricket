"use client";

import { CheckCircle2 } from "lucide-react";
import type { WorkflowStatus } from "@/lib/types";
import { cn, workflowStepIndex } from "@/lib/utils";

const workflowSteps: WorkflowStatus[] = [
  "Draft",
  "Scheduled",
  "Completed",
  "Points Updated",
  "Report Generated"
];

export function WorkflowProgress({ status }: { status: WorkflowStatus }) {
  const currentIndex = workflowStepIndex(status);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {workflowSteps.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] font-black",
                done
                  ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-100"
                  : "border-white/10 bg-white/[0.035] text-slate-400"
              )}
            >
              {done ? <CheckCircle2 className="h-3 w-3" /> : null}
              {step}
            </div>
          );
        })}
      </div>
      {status === "Live" ? (
        <p className="text-xs font-bold text-red-100">Live matches sit in the Scheduled stage until a result is entered.</p>
      ) : null}
    </div>
  );
}
