"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CircleOff } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel grid place-items-center rounded-lg px-6 py-12 text-center"
    >
      <div className="grid h-14 w-14 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
        <CircleOff className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-black text-white">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}
