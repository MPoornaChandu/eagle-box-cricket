"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminLogin, isAdminSessionActive } from "@/lib/leagueStorage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import LampAnimation from "./LampAnimation";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabaseConfigured = isSupabaseConfigured();
  const [email, setEmail] = useState("admin@eaglebox.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void isAdminSessionActive().then((active) => {
      if (active) router.replace("/admin");
    });
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await adminLogin(email, password);
    setLoading(false);
    if (result.ok) {
      router.replace("/admin");
      return;
    }
    const normalizedError = (result.error ?? "").toLowerCase();
    setError(
      normalizedError.includes("authorized") || normalizedError.includes("allowed")
        ? "You are signed in but not authorized as admin."
        : "Invalid admin credentials."
    );
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--app-bg)] px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle compact />
      </div>
      <div className="flex items-center justify-center gap-10 flex-wrap">
        <LampAnimation />
        <form onSubmit={submit} className="glass-panel w-full max-w-md rounded-lg p-6">
        <div className="grid h-14 w-14 place-items-center rounded-lg border border-emerald-300/30 bg-emerald-300/12 text-emerald-100">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Admin login</p>
        <h1 className="mt-2 text-3xl font-black text-white">Eagle Box Control Room</h1>
        <label className="field-label mt-5">
          Admin email
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} type="email" className="pl-10" autoComplete="username" autoFocus />
          </span>
        </label>
        <label className="field-label mt-4">
          Password
          <input value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} type="password" placeholder="Enter admin password" autoComplete="current-password" />
        </label>
        {error ? <p className="mt-3 text-sm font-bold text-red-200">{error}</p> : null}
        <button type="submit" disabled={loading} className="premium-button mt-5 w-full px-4 py-3 text-sm">
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="mt-4 text-xs font-bold leading-5 text-slate-400">
          {supabaseConfigured
            ? "Use a Supabase Auth user that also exists in the admins table."
            : "Local fallback: admin@eaglebox.com / admin123"}
        </p>
      </form>
      </div>
    </main>
  );
}
