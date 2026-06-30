"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, Home, LogOut, Menu, Radio, Trophy, UserRound, Users, X } from "lucide-react";
import { EbLogoVideo } from "@/components/EbLogoVideo";
import { FloatingViewerVideo } from "@/components/FloatingViewerVideo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getLiveMatch } from "@/lib/leagueStorage";
import { cn } from "@/lib/utils";

const publicNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/live-score", label: "Live Score", icon: Radio },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/points-table", label: "Points Table", icon: BarChart3 },
  { href: "/players", label: "Players", icon: UserRound },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/results", label: "Results", icon: Trophy }
];

export function LeagueShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasLiveMatch, setHasLiveMatch] = useState(false);

  useEffect(() => {
    const refreshLiveState = () => setHasLiveMatch(Boolean(getLiveMatch()));
    refreshLiveState();
    window.addEventListener("ebc-league-updated", refreshLiveState);
    window.addEventListener("storage", refreshLiveState);
    return () => {
      window.removeEventListener("ebc-league-updated", refreshLiveState);
      window.removeEventListener("storage", refreshLiveState);
    };
  }, []);

  const exitViewer = () => {
    window.localStorage.removeItem("viewerSession");
    setOpen(false);
    router.push("/");
  };

  const nav = (
    <nav className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1.5">
      {publicNav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-300/25 hover:bg-emerald-400/10 hover:text-white",
              active && "border-emerald-300/30 bg-emerald-400/12 text-emerald-100 shadow-[0_0_22px_rgba(34,197,94,0.12)]"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {item.href === "/live-score" && hasLiveMatch ? <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" /> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="league-public min-h-screen">
      <header className="league-nav sticky top-0 z-50 border-b border-emerald-100 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <Link href="/home" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <EbLogoVideo />
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Eagle Box</span>
              <span className="block text-xs font-bold text-slate-500">Cricket League</span>
            </span>
          </Link>
          <div className="hidden lg:block">{nav}</div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={exitViewer}
              className="secondary-button hidden h-10 items-center gap-2 px-3 py-2 text-xs font-black lg:inline-flex"
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-black text-emerald-700">EBC League</span>
          <span>© 2026 Eagle Box Cricket League</span>
          <nav className="flex flex-wrap justify-center gap-4">
            <Link href="/home">Home</Link>
            <Link href="/fixtures">Fixtures</Link>
            <Link href="/points-table">Standings</Link>
            <Link href="/players">Players</Link>
          </nav>
        </div>
        <p className="mt-3 text-[0.7rem] normal-case tracking-normal text-slate-400">
          Live scores powered by Supabase Realtime
        </p>
      </footer>
    </div>
  );
}
