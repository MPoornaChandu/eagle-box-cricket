"use client";

import { motion } from "framer-motion";

const sparkles = [
  { x: 18, y: -42, delay: 1.72, color: "bg-amber-200" },
  { x: 48, y: -24, delay: 1.78, color: "bg-cyan-200" },
  { x: 36, y: 16, delay: 1.84, color: "bg-emerald-200" },
  { x: -18, y: -34, delay: 1.8, color: "bg-yellow-200" },
  { x: 70, y: -58, delay: 1.9, color: "bg-white" },
  { x: -34, y: 20, delay: 1.86, color: "bg-cyan-100" },
  { x: 92, y: -8, delay: 1.94, color: "bg-amber-300" },
  { x: 12, y: 40, delay: 1.88, color: "bg-emerald-100" },
  { x: 58, y: 38, delay: 1.98, color: "bg-white" },
  { x: -50, y: -10, delay: 1.92, color: "bg-yellow-100" },
  { x: 104, y: -44, delay: 2.02, color: "bg-cyan-200" },
  { x: -8, y: -66, delay: 1.96, color: "bg-amber-100" }
];

const stadiumLights = [
  "left-[8%] top-6",
  "left-[22%] top-3",
  "right-[22%] top-3",
  "right-[8%] top-6"
];

function Wickets({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`absolute bottom-12 ${side === "left" ? "left-6 sm:left-10" : "right-6 sm:right-10"} h-24 w-14`}
    >
      <div className="absolute left-1 top-0 h-1.5 w-12 rounded-full bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-100 shadow-gold" />
      {[0, 1, 2].map((wicket) => (
        <span
          key={wicket}
          className="absolute bottom-0 h-24 w-1.5 rounded-full bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-700 shadow-[0_0_14px_rgba(245,158,11,0.32)]"
          style={{ left: `${wicket * 18 + 5}px` }}
        />
      ))}
    </div>
  );
}

export function CricketBallAnimation() {
  return (
    <div className="relative h-[280px] min-h-[280px] w-full overflow-hidden rounded-lg border border-cyan-200/15 bg-[#06101f] shadow-glass sm:h-[320px] sm:min-h-[320px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_11rem),radial-gradient(circle_at_82%_8%,rgba(34,197,94,0.2),transparent_11rem),linear-gradient(180deg,rgba(15,23,42,0.18),rgba(2,6,23,0.94))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:38px_38px] opacity-30" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-500/18 via-emerald-400/8 to-transparent" />
      <div className="absolute bottom-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent" />
      <div className="absolute bottom-5 left-10 right-10 h-3 rounded-full bg-emerald-300/20 blur-md" />

      {stadiumLights.map((position) => (
        <motion.div
          key={position}
          animate={{ opacity: [0.38, 0.9, 0.45], scale: [0.9, 1.08, 0.96] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${position} h-12 w-12 rounded-full bg-cyan-100/18 blur-xl`}
        />
      ))}

      <Wickets side="left" />
      <Wickets side="right" />

      <motion.div
        animate={{ rotate: [-18, -18, 38, 18, -18], x: [0, 0, -8, -2, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.34, 0.43, 0.58, 1], ease: "easeInOut" }}
        style={{ translate: "-50% 0" }}
        className="absolute bottom-[70px] left-[57%] z-20 h-32 w-10 origin-bottom"
      >
        <div className="absolute bottom-0 left-1/2 h-24 w-8 -translate-x-1/2 rounded-b-full rounded-t-[1.6rem] border border-amber-100/40 bg-gradient-to-r from-amber-700 via-yellow-200 to-amber-600 shadow-[0_0_24px_rgba(245,158,11,0.25)]" />
        <div className="absolute bottom-20 left-1/2 h-11 w-3 -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-200 to-slate-500" />
        <div className="absolute bottom-[7.6rem] left-1/2 h-3 w-8 -translate-x-1/2 rounded-full bg-cyan-200/70 shadow-glow" />
      </motion.div>

      <motion.div
        animate={{
          left: ["14%", "30%", "55%", "73%", "92%"],
          top: ["62%", "58%", "55%", "31%", "9%"],
          opacity: [0, 1, 1, 1, 0],
          scale: [0.65, 0.86, 1, 0.9, 0.45],
          rotate: [0, 160, 320, 520, 760]
        }}
        transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.28, 0.42, 0.66, 1], ease: "easeInOut" }}
        style={{ translate: "-50% -50%" }}
        className="absolute z-30 h-10 w-10 rounded-full border-2 border-white/80 bg-gradient-to-br from-rose-300 via-red-600 to-red-950 shadow-[0_0_28px_rgba(248,113,113,0.62)] sm:h-12 sm:w-12"
      >
        <span className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-full bg-white/80 sm:h-9" />
        <span className="absolute left-2 top-1/2 h-7 w-px -translate-y-1/2 -rotate-12 rounded-full bg-white/50 sm:h-8" />
        <span className="absolute right-2 top-1/2 h-7 w-px -translate-y-1/2 -rotate-12 rounded-full bg-white/50 sm:h-8" />
      </motion.div>

      <motion.div
        animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.45, 0.45, 1.22, 1, 0.75], y: [6, 6, -8, -14, -24] }}
        transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.38, 0.47, 0.65, 1], ease: "easeOut" }}
        style={{ translate: "-50% 0" }}
        className="absolute left-1/2 top-12 z-40 rounded-full border border-amber-200/45 bg-amber-300/12 px-5 py-2 text-3xl font-black uppercase text-amber-100 shadow-[0_0_38px_rgba(245,158,11,0.38)] sm:text-4xl"
      >
        SIX!
      </motion.div>

      <motion.div
        animate={{ opacity: [0, 0, 0.96, 0.96, 0.15], y: [10, 10, 0, 0, -4] }}
        transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.46, 0.6, 0.86, 1], ease: "easeInOut" }}
        style={{ translate: "-50% 0" }}
        className="absolute bottom-9 left-1/2 z-30 whitespace-nowrap bg-gradient-to-r from-emerald-200 via-cyan-100 to-cyan-300 bg-clip-text text-lg font-black uppercase tracking-[0.12em] text-transparent drop-shadow-[0_0_18px_rgba(34,211,238,0.55)] sm:bottom-7 sm:text-2xl sm:tracking-[0.16em]"
      >
        Eagle Box Cricket
      </motion.div>

      <div className="absolute left-[55%] top-[55%] z-30">
        {sparkles.map((sparkle, index) => (
          <motion.span
            key={index}
            animate={{
              x: [0, sparkle.x],
              y: [0, sparkle.y],
              opacity: [0, 1, 0],
              scale: [0.4, 1.25, 0.2]
            }}
            transition={{
              duration: 0.92,
              repeat: Infinity,
              repeatDelay: 3.68,
              delay: sparkle.delay,
              ease: "easeOut"
            }}
            className={`absolute h-1.5 w-1.5 rounded-full ${sparkle.color} shadow-[0_0_14px_rgba(255,255,255,0.78)]`}
          />
        ))}
      </div>

      <motion.div
        animate={{ opacity: [0, 0, 0.8, 0], scale: [0.5, 0.5, 1.4, 2] }}
        transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.4, 0.48, 0.72], ease: "easeOut" }}
        style={{ translate: "-50% -50%" }}
        className="absolute left-[55%] top-[55%] z-10 h-28 w-28 rounded-full border border-cyan-200/25"
      />
    </div>
  );
}
