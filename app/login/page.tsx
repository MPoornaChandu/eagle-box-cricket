"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole, LogIn, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { ensureDemoData, isLoggedIn, login } from "@/lib/storage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/");
      return;
    }

    setChecking(false);
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!login(email, password)) {
      setError("Invalid demo credentials.");
      showToast({
        type: "error",
        title: "Login failed",
        description: "Use the Eagle Box Cricket demo admin credentials."
      });
      return;
    }

    showToast({
      type: "success",
      title: "Login successful",
      description: "Welcome to Eagle Box Cricket operations."
    });
    ensureDemoData();
    router.replace("/");
  };

  if (checking) {
    return null;
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_32rem),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_28rem)]" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <section className="glass-panel flex min-h-[520px] flex-col justify-between rounded-lg p-8">
          <div>
            <div className="grid h-16 w-16 place-items-center rounded-lg border border-emerald-300/30 bg-emerald-400/14 text-2xl font-black text-emerald-100 shadow-emerald">
              EB
            </div>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-emerald-200">
              Eagle Box Cricket
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-white md:text-6xl">
              Fixture & Points Table Manager
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Premium database-ready console for tournament teams, fixtures, results, reports, and
              live standings.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {["Teams", "Fixtures", "NRR"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <p className="text-2xl font-black text-white">{item}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Admin Ready
                </p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="glass-panel rounded-lg p-6 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-400/12 text-emerald-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Admin Login</h2>
              <p className="text-sm text-slate-400">Demo admin access</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="field-label">
              Email
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@eaglebox.com"
                  className="!pl-14 pr-4"
                />
              </div>
            </label>
            <label className="field-label">
              Password
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="admin123"
                  className="!pl-14 pr-4"
                />
              </div>
            </label>
          </div>

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg border border-red-300/25 bg-red-500/12 p-3 text-sm font-semibold text-red-100"
            >
              {error}
            </motion.p>
          ) : null}

          <button
            type="submit"
            className="premium-button mt-6 flex w-full items-center justify-center gap-2 px-5 py-3"
          >
            <LogIn className="h-5 w-5" />
            Login
          </button>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            <p className="font-black text-white">Demo credentials</p>
            <p className="mt-2">Email: admin@eaglebox.com</p>
            <p>Password: admin123</p>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
