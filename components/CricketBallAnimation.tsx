"use client";

import { motion } from "framer-motion";

const LOOP_DURATION = 6.5;
const RESET_AT = 0.955;

const drawAnimation = {
  pathLength: [0, 0, 1, 1, 0],
  opacity: [0, 0, 1, 1, 0]
};

const drawTransition = (start: number, finish: number) => ({
  duration: LOOP_DURATION,
  repeat: Infinity,
  times: [0, start, finish, RESET_AT, 1],
  ease: "easeInOut" as const
});

const stadiumLights = [
  { left: "13%", top: "12%", size: "5rem", color: "rgba(34, 211, 238, 0.2)", delay: 0 },
  { left: "29%", top: "7%", size: "3.5rem", color: "rgba(255, 255, 255, 0.14)", delay: 0.16 },
  { left: "72%", top: "7%", size: "3.65rem", color: "rgba(187, 247, 208, 0.16)", delay: 0.28 },
  { left: "88%", top: "13%", size: "5rem", color: "rgba(34, 197, 94, 0.18)", delay: 0.08 }
];

const sparkleParticles = [
  { x: -54, y: -30, r: 2.2, color: "#fde68a" },
  { x: -28, y: -62, r: 1.8, color: "#cffafe" },
  { x: 2, y: -78, r: 2.3, color: "#fef3c7" },
  { x: 31, y: -56, r: 2, color: "#bbf7d0" },
  { x: 57, y: -27, r: 1.7, color: "#e0f2fe" },
  { x: 73, y: 7, r: 2.3, color: "#fbbf24" },
  { x: 40, y: 38, r: 1.9, color: "#a7f3d0" },
  { x: 8, y: 52, r: 2.1, color: "#ffffff" },
  { x: -34, y: 32, r: 1.8, color: "#67e8f9" },
  { x: -70, y: 0, r: 2, color: "#fef08a" },
  { x: 88, y: -48, r: 1.7, color: "#ffffff" },
  { x: -84, y: -44, r: 1.9, color: "#22d3ee" }
];

const impactPoint = { x: 358, y: 214 };
const batPivot = { x: 376, y: 211 };

export function CricketBallAnimation() {
  return (
    <div className="relative h-[280px] min-h-[280px] w-full overflow-hidden rounded-3xl border border-cyan-100/15 bg-slate-950/80 shadow-glass backdrop-blur-xl md:h-[340px] md:min-h-[340px]">
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.74, 1, 0.84, 0.74] }}
        transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.24),transparent_12rem),radial-gradient(circle_at_84%_9%,rgba(34,197,94,0.22),transparent_12rem),linear-gradient(160deg,#07111f_0%,#020617_52%,#01030a_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px] opacity-25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-emerald-500/22 via-emerald-400/8 to-transparent"
      />

      {stadiumLights.map((light) => (
        <motion.span
          key={`${light.left}-${light.top}`}
          aria-hidden="true"
          animate={{ opacity: [0.28, 0.82, 0.42], scale: [0.86, 1.15, 0.94] }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            delay: light.delay,
            ease: "easeInOut"
          }}
          className="absolute -translate-x-1/2 rounded-full blur-2xl"
          style={{
            left: light.left,
            top: light.top,
            width: light.size,
            height: light.size,
            background: light.color
          }}
        />
      ))}

      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 720 360"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="batterGlow" x1="370" x2="456" y1="135" y2="230">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.2" />
            <stop offset="54%" stopColor="#e0f2fe" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="padGlow" x1="380" x2="466" y1="224" y2="292">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <motion.path
          d="M42 292 C146 282 260 286 358 292 C476 300 574 297 678 288"
          fill="none"
          stroke="rgba(52, 211, 153, 0.72)"
          strokeLinecap="round"
          strokeWidth="2"
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.92, 0.72, 0] }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            times: [0, 0.1, 0.94, 1],
            ease: "easeInOut"
          }}
        />
        <path
          d="M70 236 C170 223 270 219 358 214 C426 211 491 216 552 229"
          fill="none"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeDasharray="8 12"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M328 287 L562 287"
          fill="none"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeDasharray="8 12"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M60 304 C210 289 424 315 664 298"
          fill="none"
          stroke="rgba(16, 185, 129, 0.2)"
          strokeLinecap="round"
          strokeWidth="18"
        />

        <g strokeLinecap="round" strokeLinejoin="round">
          {[462, 478, 494].map((x, index) => (
            <motion.line
              key={x}
              x1={x}
              x2={x}
              y1="182"
              y2="284"
              stroke={index === 1 ? "#fde68a" : "#f59e0b"}
              strokeWidth="4.8"
              animate={drawAnimation}
              transition={drawTransition(0.05 + index * 0.018, 0.17 + index * 0.018)}
            />
          ))}
          <motion.path
            d="M455 179 C468 176 486 176 502 179"
            fill="none"
            stroke="#fef3c7"
            strokeWidth="4.2"
            animate={drawAnimation}
            transition={drawTransition(0.12, 0.21)}
          />
          <motion.path
            d="M458 189 C472 187 487 187 500 189"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            animate={drawAnimation}
            transition={drawTransition(0.145, 0.235)}
          />
        </g>

        <g strokeLinecap="round" strokeLinejoin="round">
          <motion.circle
            cx="416"
            cy="113"
            r="22"
            fill="rgba(2, 6, 23, 0.38)"
            stroke="#e0f2fe"
            strokeWidth="4.2"
            animate={drawAnimation}
            transition={drawTransition(0.14, 0.24)}
          />
          <motion.path
            d="M394 112 C401 90 435 89 450 110 M405 124 L449 124 M409 113 L452 113 M426 103 L426 130"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="2.5"
            animate={drawAnimation}
            transition={drawTransition(0.18, 0.295)}
          />
          <motion.path
            d="M401 139 C415 133 439 137 452 151 C449 177 438 207 422 228 C402 223 383 209 374 187 C376 166 385 149 401 139 Z"
            fill="url(#batterGlow)"
            stroke="#f8fafc"
            strokeWidth="5"
            animate={drawAnimation}
            transition={drawTransition(0.22, 0.37)}
          />
          <motion.path
            d="M389 151 C407 142 434 144 455 158"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="5.8"
            animate={drawAnimation}
            transition={drawTransition(0.255, 0.39)}
          />
          <motion.path
            d="M386 164 C372 180 366 196 360 214"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="7"
            animate={drawAnimation}
            transition={drawTransition(0.3, 0.425)}
          />
          <motion.path
            d="M443 162 C428 181 407 198 367 214"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="6.8"
            animate={drawAnimation}
            transition={drawTransition(0.325, 0.455)}
          />
          <motion.path
            d="M354 209 C361 204 371 207 374 215 C367 220 358 219 354 209 Z"
            fill="rgba(254, 243, 199, 0.22)"
            stroke="#fef3c7"
            strokeWidth="3"
            animate={drawAnimation}
            transition={drawTransition(0.36, 0.475)}
          />
          <motion.path
            d="M417 225 C402 242 391 263 382 286"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="7.5"
            animate={drawAnimation}
            transition={drawTransition(0.37, 0.5)}
          />
          <motion.path
            d="M427 226 C449 244 461 263 473 287"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="7.5"
            animate={drawAnimation}
            transition={drawTransition(0.395, 0.525)}
          />
          <motion.path
            d="M383 238 C392 251 391 273 382 288 L398 288 C407 268 411 250 407 235 Z"
            fill="url(#padGlow)"
            stroke="#67e8f9"
            strokeWidth="3"
            animate={drawAnimation}
            transition={drawTransition(0.425, 0.55)}
          />
          <motion.path
            d="M441 238 C455 251 467 270 474 288 L491 288 C484 263 473 244 456 230 Z"
            fill="url(#padGlow)"
            stroke="#bae6fd"
            strokeWidth="3"
            animate={drawAnimation}
            transition={drawTransition(0.44, 0.57)}
          />
          <motion.path
            d="M372 287 L404 287 M463 287 L496 287"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="4.5"
            animate={drawAnimation}
            transition={drawTransition(0.46, 0.59)}
          />
        </g>

        <motion.g
          animate={{ rotate: [168, 168, 168, 88, 12, -8, 24, 168] }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            times: [0, 0.43, 0.505, 0.548, 0.585, 0.625, 0.73, 1],
            ease: "easeInOut"
          }}
          style={{ transformOrigin: `${batPivot.x}px ${batPivot.y}px`, transformBox: "view-box" }}
        >
          <motion.line
            x1={batPivot.x}
            x2="407"
            y1={batPivot.y}
            y2="176"
            stroke="#fef3c7"
            strokeLinecap="round"
            strokeWidth="6.2"
            animate={drawAnimation}
            transition={drawTransition(0.455, 0.61)}
          />
          <motion.path
            d="M397 145 L416 128 C421 124 429 126 433 131 C437 137 436 144 431 149 L411 170 Z"
            fill="rgba(245, 158, 11, 0.25)"
            stroke="#f59e0b"
            strokeLinejoin="round"
            strokeWidth="4.2"
            animate={drawAnimation}
            transition={drawTransition(0.485, 0.63)}
          />
          <motion.path
            d="M404 150 L425 132"
            fill="none"
            stroke="#fde68a"
            strokeLinecap="round"
            strokeWidth="2"
            animate={drawAnimation}
            transition={drawTransition(0.51, 0.65)}
          />
        </motion.g>

        <motion.path
          d="M64 236 C166 225 270 221 358 214"
          fill="none"
          stroke="rgba(248, 113, 113, 0.3)"
          strokeLinecap="round"
          strokeWidth="3"
          animate={{ pathLength: [0, 0, 0.9, 1, 0], opacity: [0, 0, 0.45, 0.12, 0] }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            times: [0, 0.46, 0.55, 0.585, 0.66],
            ease: "easeInOut"
          }}
        />
        <motion.path
          d="M358 214 C382 151 423 78 488 31"
          fill="none"
          stroke="rgba(251, 191, 36, 0.52)"
          strokeLinecap="round"
          strokeWidth="3.6"
          animate={{ pathLength: [0, 0, 0, 1, 1, 0], opacity: [0, 0, 0, 0.88, 0.38, 0] }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            times: [0, 0.565, 0.592, 0.75, 0.865, 1],
            ease: "easeOut"
          }}
        />

        <motion.g
          animate={{
            x: [64, 64, 160, 265, impactPoint.x, impactPoint.x, 398, 448, 488],
            y: [236, 236, 228, 221, impactPoint.y, impactPoint.y, 139, 68, 31],
            scale: [0.66, 0.66, 0.82, 0.96, 1.08, 1.08, 0.82, 0.58, 0.42],
            rotate: [0, 0, 140, 300, 420, 420, 620, 830, 1040],
            opacity: [0, 0, 1, 1, 1, 1, 1, 0.8, 0]
          }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            times: [0, 0.445, 0.475, 0.535, 0.58, 0.605, 0.69, 0.81, 1],
            ease: "easeInOut"
          }}
          style={{ filter: "drop-shadow(0 0 16px rgba(248, 113, 113, 0.78))" }}
        >
          <circle r="12" fill="#b91c1c" stroke="#fecaca" strokeWidth="2.4" />
          <path
            d="M-3 -9 C-8 -3 -8 4 -3 10 M4 -10 C9 -3 9 4 4 10"
            fill="none"
            stroke="#fee2e2"
            strokeLinecap="round"
            strokeWidth="1.9"
          />
        </motion.g>

        <motion.g
          animate={{ opacity: [0, 0, 0, 1, 0], scale: [0.4, 0.4, 0.4, 1.34, 2.1] }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            times: [0, 0.56, 0.586, 0.625, 0.76],
            ease: "easeOut"
          }}
          style={{ transformOrigin: `${impactPoint.x}px ${impactPoint.y}px`, transformBox: "view-box" }}
        >
          <circle cx={impactPoint.x} cy={impactPoint.y} r="22" fill="rgba(251, 191, 36, 0.18)" />
          <circle
            cx={impactPoint.x}
            cy={impactPoint.y}
            r="9"
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#f59e0b"
            strokeWidth="3"
          />
          {[
            [0, -36],
            [22, -28],
            [34, -5],
            [24, 22],
            [0, 34],
            [-25, 23],
            [-36, -1],
            [-24, -27]
          ].map(([x, y]) => (
            <line
              key={`${x}-${y}`}
              x1={impactPoint.x}
              x2={impactPoint.x + x}
              y1={impactPoint.y}
              y2={impactPoint.y + y}
              stroke="#fde68a"
              strokeLinecap="round"
              strokeWidth="3"
            />
          ))}
        </motion.g>

        {sparkleParticles.map((particle) => (
          <motion.circle
            key={`${particle.x}-${particle.y}`}
            cx={impactPoint.x}
            cy={impactPoint.y}
            r={particle.r}
            fill={particle.color}
            animate={{
              x: [0, 0, particle.x, particle.x * 1.08],
              y: [0, 0, particle.y, particle.y * 1.08],
              opacity: [0, 0, 1, 0],
              scale: [0.3, 0.3, 1.15, 0.2]
            }}
            transition={{
              duration: LOOP_DURATION,
              repeat: Infinity,
              times: [0, 0.586, 0.68, 0.81],
              ease: "easeOut"
            }}
            style={{ filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.85))" }}
          />
        ))}
      </svg>

      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0, 0, 0, 0.96, 0.96, 0], scale: [0.48, 0.48, 0.48, 1.16, 1, 0.84], y: [8, 8, 8, -8, -13, -24] }}
        transition={{
          duration: LOOP_DURATION,
          repeat: Infinity,
          times: [0, 0.58, 0.615, 0.66, 0.8, 0.95],
          ease: "easeOut"
        }}
        className="absolute inset-x-0 top-10 z-30 px-4 text-center text-5xl font-black uppercase text-transparent drop-shadow-[0_0_24px_rgba(245,158,11,0.75)] sm:top-11 sm:text-6xl"
      >
        <span className="whitespace-nowrap bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 bg-clip-text">
          SIX!
        </span>
      </motion.div>

      <motion.div
        animate={{ opacity: [0, 0, 0, 0.98, 0.98, 0], y: [12, 12, 12, 0, 0, -8] }}
        transition={{
          duration: LOOP_DURATION,
          repeat: Infinity,
          times: [0, 0.7, 0.73, 0.79, 0.93, 1],
          ease: "easeInOut"
        }}
        className="absolute inset-x-0 bottom-6 z-30 px-5 text-center"
      >
        <p className="bg-gradient-to-r from-emerald-200 via-cyan-100 to-cyan-300 bg-clip-text text-sm font-black uppercase leading-snug tracking-[0.12em] text-transparent drop-shadow-[0_0_18px_rgba(34,211,238,0.7)] sm:text-base sm:tracking-[0.16em]">
          Eagle Box Cricket
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100/70 sm:text-xs sm:tracking-[0.14em]">
          Fixture & Points Table Manager
        </p>
      </motion.div>
    </div>
  );
}
