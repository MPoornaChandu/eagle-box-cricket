"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { LoginBackgroundVideo } from "@/components/LoginBackgroundVideo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminLogin } from "@/lib/leagueStorage";

const VIEWER_SESSION_KEY = "viewerSession";
const ADMIN_EMAIL = "admin@eaglebox.com";

function getAdminErrorMessage(error?: string) {
  const normalized = (error ?? "").toLowerCase();

  if (normalized.includes("authorized") || normalized.includes("allowed")) {
    return "You are signed in but not authorized as admin.";
  }

  return "Invalid admin credentials.";
}

export default function EntryPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = identity.trim();
    const adminPassword = password.trim();

    if (!value) {
      setError("Enter your name or email to continue.");
      return;
    }

    const isAdminAttempt = Boolean(adminPassword) || value.toLowerCase() === ADMIN_EMAIL;

    if (isAdminAttempt) {
      setLoading(true);
      setError("");

      try {
        const result = await adminLogin(value, password);

        if (result.ok) {
          router.push("/admin");
          return;
        }

        setError(getAdminErrorMessage(result.error));
      } catch {
        setError("Invalid admin credentials.");
      } finally {
        setLoading(false);
      }

      return;
    }

    window.localStorage.setItem(
      VIEWER_SESSION_KEY,
      JSON.stringify({ nameOrEmail: value, createdAt: new Date().toISOString() })
    );
    router.push("/home");
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      <LoginBackgroundVideo />
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle compact />
      </div>

      <div className="relative z-10 flex min-h-screen items-center px-4 py-10">
        <form
          onSubmit={submit}
          className="unified-login-card mx-auto w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 sm:p-7"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
            EAGLE BOX CRICKET
          </p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-[var(--text-strong)]">Enter the League</h1>
          <p className="mt-3 text-base font-bold leading-7 text-[var(--text)]">
            Sign in as admin or continue as viewer.
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--text-muted)]">
            Admins use registered Supabase credentials. Viewers can continue with name or email.
          </p>

          <label className="field-label mt-6">
            Email or name
            <input
              value={identity}
              onChange={(event) => {
                setIdentity(event.target.value);
                setError("");
              }}
              type="text"
              placeholder="admin@eaglebox.com or your name"
              autoComplete="username"
              autoFocus
            />
          </label>
          <label className="field-label mt-4">
            Password optional
            <input
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              type="password"
              placeholder="Only admins need a password"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="mt-4 text-sm font-bold text-red-600 dark:text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="premium-button mt-6 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm"
          >
            {loading ? "Signing in..." : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
