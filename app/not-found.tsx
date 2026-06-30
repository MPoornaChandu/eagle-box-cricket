import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--app-bg)] px-4 text-center">
      <section className="glass-panel max-w-xl rounded-lg p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">404</p>
        <h1 className="mt-3 text-4xl font-black text-white">Looks like that page got run out!</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The page you were looking for is not on the scoreboard.
        </p>
        <Link href="/home" className="premium-button mt-6 inline-flex px-5 py-3 text-sm">
          Go Home
        </Link>
      </section>
    </main>
  );
}
