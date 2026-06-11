"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ duration: 0.22 }}
      className={cn("glass-panel rounded-lg", className)}
    >
      {children}
    </motion.div>
  );
}
