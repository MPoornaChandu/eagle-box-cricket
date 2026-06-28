"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, Home, LogOut, Menu, Radio, Trophy, UserRound, Users, X } from "lucide-react";
import { EbLogoVideo } from "@/components/EbLogoVideo";
import { FloatingViewerVideo } from "@/components/FloatingViewerVideo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const publicNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/live", label: "Live Score", icon: Radio },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/points-table", label: "Points Table", icon: BarChart3 },
  { href: "/players", label: "Players", icon: UserRound },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/results", label: "Results", icon: Trophy },
  { href: "/standings", label: "Standings", icon: BarChart3 }
];

export function LeagueShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const exitViewer = () => {
    window.localStorage.removeItem("viewerSession");
    setOpen(false);
    router.push("/");
  };

  const nav = (
    <nav className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
      {publicNav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-slate-950",
              active && "border-emerald-200 bg-emerald-50 text-emerald-800"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="league-public min-h-screen">
      <header className="league-nav sticky top-0 z-50 border-b border-emerald-100 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Link href="/home" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <EbLogoVideo />
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Eagle Box</span>
              <span className="block text-xs font-bold text-slate-500">Cricket League</span>
            </span>
          </Link>
          <div className="hidden lg:block">{nav}</div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={exitViewer}
              className="secondary-button hidden items-center gap-2 px-3 py-2 text-xs font-black lg:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Exit
            </button>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((current) => !current)}
              className="secondary-button grid h-10 w-10 place-items-center lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="league-nav-mobile border-t border-emerald-100 bg-white px-4 py-3 lg:hidden">
            {nav}
            <button type="button" onClick={exitViewer} className="secondary-button mt-2 inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-black">
              <LogOut className="h-4 w-4" />
              Exit
            </button>
          </div>
        ) : null}
      </header>
      <main>{children}</main>
      <FloatingViewerVideo />
      <footer className="border-t border-emerald-100 bg-white/70 px-4 py-8 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Eagle Box Cricket League
      </footer>
    </div>
  );
}
