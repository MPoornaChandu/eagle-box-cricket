"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { EbLogoVideo } from "@/components/EbLogoVideo";
import { LoginBackgroundVideo } from "@/components/LoginBackgroundVideo";
import { ThemeToggle } from "@/components/ThemeToggle";

const VIEWER_SESSION_KEY = "viewerSession";

export default function EntryPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = identity.trim();

    if (!value) {
      setError("Enter your name or email to continue.");
      return;
    }

    setLoading(true);
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
          className="login-card-reveal unified-login-card mx-auto w-[calc(100%_-_32px)] max-w-[25rem] rounded-2xl border border-[rgba(34,197,94,0.25)] bg-[rgba(8,18,16,0.45)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-[22px] sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <EbLogoVideo />
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-emerald-300/30 bg-emerald-500/15 text-emerald-100">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>
            <Link href="/admin/login" className="rounded-full border border-emerald-300/20 px-3 py-1.5 text-xs font-black text-emerald-100 transition hover:border-emerald-300/50 hover:bg-emerald-400/10">
              Admin Login
            </Link>
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
            EAGLE BOX CRICKET
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-white">Enter Eagle Box</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
            Continue as viewer or sign in as admin.
          </p>

          <label className="field-label mt-5 text-slate-200">
            Your name or email
            <input
              value={identity}
              onChange={(event) => {
                setIdentity(event.target.value);
                setError("");
              }}
              type="text"
              placeholder="Your name or email"
              autoComplete="username"
              autoFocus
            />
          </label>

          {error ? <p className="mt-4 text-sm font-bold text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="premium-button mt-6 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm"
          >
            {loading ? "Continuing..." : "Continue as Viewer"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
