"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CelebrationOverlayProps {
  message: string;
  open: boolean;
  onClose: () => void;
}

const particles = Array.from({ length: 24 }, (_, index) => index);

export function CelebrationOverlay({ message, open, onClose }: CelebrationOverlayProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] grid place-items-center overflow-hidden bg-slate-950/[0.82] px-4 backdrop-blur-lg"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.82, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0], textShadow: ["0 0 20px #22c55e", "0 0 36px #f5c451", "0 0 20px #22c55e"] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-4xl font-black uppercase text-white md:text-7xl"
            >
              {message}
            </motion.div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.28em] text-emerald-200">
              Eagle Box Cricket
            </p>
          </motion.div>

          <motion.div
            initial={{ x: "-20vw", y: "35vh", rotate: 0 }}
            animate={{ x: "120vw", y: "-42vh", rotate: 1440 }}
            transition={{ duration: 2.15, ease: "easeInOut" }}
            className="absolute h-20 w-20 rounded-full border-2 border-red-100 bg-gradient-to-br from-red-500 via-red-700 to-red-950 shadow-[0_0_70px_rgba(248,113,113,0.55)]"
          >
            <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full bg-white/75" />
            <span className="absolute left-[43%] top-1 h-[88%] w-px rounded-full bg-white/[0.85]" />
            <span className="absolute left-[57%] top-1 h-[88%] w-px rounded-full bg-white/[0.85]" />
          </motion.div>

          {particles.map((particle) => {
            const angle = (particle / particles.length) * Math.PI * 2;
            const distance = 140 + (particle % 6) * 24;

            return (
              <motion.span
                key={particle}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: [0.4, 1, 0.3]
                }}
                transition={{ duration: 1.75, repeat: Infinity, delay: particle * 0.025 }}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-amber-200 shadow-glow"
              />
            );
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
