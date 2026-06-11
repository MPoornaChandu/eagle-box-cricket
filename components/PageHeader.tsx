"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  breadcrumb: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, breadcrumb, description, actions }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300/80">
          {breadcrumb}
        </p>
        <h1 className="mt-2 text-2xl font-black text-white md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-slate-300">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </motion.header>
  );
}
