"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { EbLogoVideo } from "@/components/EbLogoVideo";
import { LoginBackgroundVideo } from "@/components/LoginBackgroundVideo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminLogin, isAdminSessionActive } from "@/lib/leagueStorage";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void isAdminSessionActive().then((active) => {
      if (active) router.replace("/admin/dashboard");
    });
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await adminLogin(email, password);
    setLoading(false);
    if (result.ok) {
      router.replace("/admin/dashboard");
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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--app-bg)] px-4">
      <LoginBackgroundVideo />
      <div className="absolute right-4 top-4">
        <ThemeToggle compact />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_48%,rgba(34,197,94,0.18),transparent_22rem)]" />
      <form onSubmit={submit} className="admin-login-card login-card-reveal glass-panel relative z-10 w-[calc(100%_-_32px)] max-w-[27rem] rounded-2xl border-[rgba(34,197,94,0.24)] p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <EbLogoVideo />
          <span className="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">Admin</span>
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">ADMIN LOGIN</p>
        <h1 className="mt-2 text-3xl font-black text-white">Eagle Box Control Room</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Authorized scorers only. Sign in to manage live matches.</p>
        <label className="field-label mt-5 text-slate-200">
          Admin email
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-emerald-200/60" />
            <input value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} type="email" className="admin-login-input admin-login-input-with-icon bg-[rgba(7,12,10,0.72)] text-white placeholder:text-slate-500" placeholder="Enter admin email" autoComplete="username" autoFocus />
          </span>
        </label>
        <label className="field-label mt-4 text-slate-200">
          Password
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-emerald-200/60" />
            <input value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} type={showPassword ? "text" : "password"} className="admin-login-input admin-login-input-with-icon admin-login-input-with-toggle bg-[rgba(7,12,10,0.72)] text-white placeholder:text-slate-500" placeholder="Enter admin password" autoComplete="current-password" />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-300 transition hover:bg-emerald-300/10 hover:text-emerald-100"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </span>
        </label>
        {error ? <p className="mt-3 text-sm font-bold text-red-200">{error}</p> : null}
        <button type="submit" disabled={loading} className="premium-button mt-5 w-full px-4 py-3 text-sm">
          {loading ? "Signing in..." : "Login"}
        </button>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-emerald-200 underline decoration-emerald-300/50 underline-offset-4 transition hover:text-emerald-100 hover:decoration-emerald-100">
          <ArrowLeft className="h-4 w-4" />
          Back to viewer login
        </Link>
      </form>
    </main>
  );
}
