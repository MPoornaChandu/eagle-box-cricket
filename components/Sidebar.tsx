"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Home,
  ListOrdered,
  LogOut,
  Menu,
  Network,
  Settings,
  Shield,
  Share2,
  Trophy,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDataSourceStatus } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useToast } from "./ToastProvider";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/results", label: "Results", icon: Trophy },
  { href: "/standings", label: "Standings", icon: ListOrdered },
  { href: "/workflow", label: "Workflow", icon: Network },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/scoreboard", label: "Scoreboard", icon: Share2 },
  { href: "/smart-assistant", label: "Automated Insights", icon: Bot },
  { href: "/test-cases", label: "Quality Checklist", icon: ClipboardCheck },
  { href: "/documentation", label: "Documentation", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true }
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onMobileOpen: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const dataSource = getDataSourceStatus();
  const { session, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    showToast({ type: "info", title: "Logged out", description: "Demo session cleared." });
    router.replace("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        aria-label="Go to dashboard"
        className="mx-3 mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-3 transition duration-200 hover:scale-[1.01] hover:border-emerald-300/25 hover:bg-emerald-300/[0.07] hover:shadow-emerald"
      >
        <div className="grid h-12 w-12 place-items-center rounded-lg border border-emerald-300/30 bg-emerald-400/14 text-lg font-black text-emerald-100 shadow-emerald">
          EB
        </div>
        <div>
          <p className="text-sm font-black text-white">Eagle Box</p>
          <p className="text-xs font-semibold text-amber-200/80">Cricket Ops</p>
        </div>
      </Link>

      <nav className="grid min-h-0 flex-1 gap-1 overflow-y-auto px-3 pb-3">
        {navItems.filter((item) => !item.adminOnly || session?.role === "Admin").map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white",
                active &&
                  "border border-emerald-300/30 bg-emerald-300/12 text-emerald-50 shadow-glow"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
              Appearance
            </p>
            <p className="mt-1 text-xs text-slate-400">Persists after refresh</p>
          </div>
          <ThemeToggle compact />
        </div>
        <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
            <Shield className="h-4 w-4" />
            Demo {session?.role ?? "User"}
          </div>
          <p className="mt-1 text-xs text-slate-400">{session?.email ?? "No active email"}</p>
          <p className="mt-1 text-xs text-slate-400">{dataSource.label}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300/24 bg-red-500/12 px-3 py-3 text-sm font-black text-red-100 hover:bg-red-500/18"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose, onMobileOpen }: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={onMobileOpen}
        className="no-print fixed left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-lg border border-white/[0.12] bg-slate-950/[0.72] text-white shadow-glass backdrop-blur lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="sidebar-shell glass-panel fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-72 rounded-lg lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md lg:hidden"
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="glass-panel flex h-full w-[min(86vw,320px)] flex-col rounded-r-lg"
            >
              <div className="flex justify-end px-3 pt-3">
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={onMobileClose}
                  className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SidebarContent onNavigate={onMobileClose} />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
