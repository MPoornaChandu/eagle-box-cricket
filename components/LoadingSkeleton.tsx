"use client";

import { motion } from "framer-motion";

export function LoadingSkeleton({ label = "Loading dashboard" }: { label?: string }) {
  return (
    <div className="grid min-h-[52vh] place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-lg rounded-lg p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-lg bg-emerald-300/20" />
          <div className="space-y-2">
            <div className="h-3 w-44 animate-pulse rounded-full bg-white/18" />
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
        <div className="grid gap-3">
          <div className="h-3 animate-pulse rounded-full bg-white/12" />
          <div className="h-3 w-10/12 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-8/12 animate-pulse rounded-full bg-white/10" />
        </div>
        <p className="mt-5 text-sm font-semibold text-slate-300">{label}</p>
      </motion.div>
    </div>
  );
}
