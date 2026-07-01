"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarPlus,
  Home,
  ListOrdered,
  LogOut,
  Menu,
  Radio,
  Settings,
  Shield,
  Trophy,
  UserRound,
  Users,
  X
} from "lucide-react";
import { EbLogoVideo } from "@/components/EbLogoVideo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminLogout, getCurrentAdminSession, isAdminSessionActive } from "@/lib/leagueStorage";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/live-score", label: "Live Score Control", icon: Radio },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/players", label: "Players", icon: UserRound },
  { href: "/admin/fixtures", label: "Fixtures", icon: CalendarPlus },
  { href: "/admin/results", label: "Results", icon: Trophy },
  { href: "/admin/points-table", label: "Points Table", icon: ListOrdered },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const ok = await isAdminSessionActive();
      if (!active) return;
      if (!ok) {
        router.replace("/admin/login");
        return;
      }
      setAdminEmail(getCurrentAdminSession()?.email ?? "");
      setChecking(false);
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  const logout = async () => {
    await adminLogout();
    router.replace("/admin/login");
  };

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--app-bg)] px-4 text-white">
        <div className="glass-panel rounded-lg p-5 text-sm font-black uppercase tracking-[0.18em] text-emerald-200">
          Checking admin session
        </div>
      </main>
    );
  }

  return (
    <div className="league-admin min-h-screen">
      <aside className="admin-sidebar fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 bg-[var(--panel-strong)] p-4 lg:block">
        <Link href="/admin/dashboard" className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
          <EbLogoVideo />
          <span>
            <span className="block text-sm font-black text-white">Admin Control</span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-200">
              <Shield className="h-3.5 w-3.5" />
              Protected access
            </span>
            {adminEmail ? <span className="mt-1 block truncate text-xs font-bold text-slate-300">{adminEmail}</span> : null}
          </span>
        </Link>
        <nav className="grid gap-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href === "/admin/dashboard" && pathname === "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white",
                  active && "border border-emerald-300/30 bg-emerald-300/12 text-emerald-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={logout} className="danger-button mt-5 flex w-full items-center justify-center gap-2 px-3 py-3 text-sm font-black">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </aside>

      <header className="admin-mobile-header sticky top-0 z-30 border-b border-white/10 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin/dashboard" className="min-w-0 font-black text-white">
            <span className="block">Admin</span>
            {adminEmail ? <span className="block truncate text-xs font-bold text-slate-400">{adminEmail}</span> : null}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
              onClick={() => setMobileOpen((current) => !current)}
              className="secondary-button grid h-10 w-10 place-items-center"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button type="button" onClick={logout} className="danger-button px-3 py-2 text-xs font-black">
              Logout
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <nav className="mt-3 grid gap-2">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="secondary-button px-3 py-2 text-xs font-black">
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="px-4 py-6 lg:ml-72 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
