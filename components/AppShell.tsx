"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "./AuthGuard";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onMobileOpen={() => setMobileOpen(true)}
        />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="print-shell px-4 pb-8 pt-20 lg:ml-80 lg:px-8 lg:pt-8"
        >
          <div className="mx-auto max-w-7xl">{children}</div>
          <footer className="app-footer mt-10 border-t border-white/10 pt-5 text-center text-xs font-semibold text-slate-500">
            Internship Demo Project - Eagle Box Cricket
          </footer>
        </motion.main>
      </div>
    </AuthGuard>
  );
}
