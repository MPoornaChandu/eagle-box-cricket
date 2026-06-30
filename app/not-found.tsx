import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-center">
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-500">Eagle Box Cricket League</p>
        <h1 className="text-8xl font-black text-white">404</h1>
        <p className="text-2xl font-black text-slate-300">Page not found</p>
        <p className="mt-2 max-w-md text-slate-400">
          This page doesn&apos;t exist or may have been moved. Head back to the home page.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-400"
        >
          Go to Home
        </Link>
        <Link
          href="/live"
          className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
        >
          Live Score
        </Link>
      </div>
    </div>
  );
}
