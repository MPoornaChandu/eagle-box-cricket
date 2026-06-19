"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSkeleton } from "./LoadingSkeleton";

export function AuthGuard({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const router = useRouter();
  const { authLoading, isAuthenticated, role } = useAuth();
  const accessDenied = !authLoading && isAuthenticated && adminOnly && role !== "Admin";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return <LoadingSkeleton label="Checking secure session" />;
  }

  if (accessDenied) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="glass-panel max-w-lg rounded-lg p-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-200">Access denied</p>
          <h1 className="mt-3 text-3xl font-black text-white">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Viewer accounts can browse tournament data, but Settings and write actions are reserved for Admin.
          </p>
          <Link href="/" className="premium-button mt-5 inline-flex px-4 py-3 text-sm">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
