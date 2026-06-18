"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: "emerald" | "gold" | "red";
}

const accentClasses = {
  emerald: "border-emerald-300/25 bg-emerald-400/12 text-emerald-200",
  gold: "border-amber-300/30 bg-amber-400/12 text-amber-200",
  red: "border-red-300/25 bg-red-400/12 text-red-200"
};

export function StatCard({ label, value, icon, accent = "emerald" }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    const duration = 700;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.round(value * progress));
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-panel rounded-lg p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 break-words text-2xl font-black text-white md:text-3xl">
            {displayValue}
          </p>
        </div>
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-lg border", accentClasses[accent])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
