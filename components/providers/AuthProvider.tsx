"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ensureDemoData, getCurrentSession, login as storageLogin, logout as storageLogout } from "@/lib/storage";
import type { DemoSession, UserRole } from "@/lib/types";

interface AuthContextValue {
  session: DemoSession | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<DemoSession | null>;
  signOut: () => void;
  refreshSession: () => DemoSession | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshSession = useCallback(() => {
    const nextSession = getCurrentSession();
    setSession(nextSession);
    return nextSession;
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      const nextSession = getCurrentSession();
      if (!active) return;
      setSession(nextSession);

      if (nextSession) {
        await ensureDemoData();
      }

      if (active) setAuthLoading(false);
    }

    void bootstrapAuth().catch(() => {
      if (active) setAuthLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const nextSession = storageLogin(email, password);
      if (!nextSession) return null;
      setSession(nextSession);
      await ensureDemoData();
      refreshSession();
      return nextSession;
    },
    [refreshSession]
  );

  const signOut = useCallback(() => {
    storageLogout();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      role: session?.role ?? null,
      isAuthenticated: Boolean(session),
      isAdmin: session?.role === "Admin",
      authLoading,
      signIn,
      signOut,
      refreshSession
    }),
    [authLoading, refreshSession, session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
