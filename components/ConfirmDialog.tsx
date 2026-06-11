"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  tone?: "danger" | "default";
  details?: string[];
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  tone = "default",
  details,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/78 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="glass-panel w-full max-w-lg rounded-lg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-amber-300/35 bg-amber-400/12 text-amber-200">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {details && details.length > 0 ? (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                  Affected fixtures
                </p>
                <ul className="mt-2 grid gap-1 text-sm text-slate-200">
                  {details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="secondary-button px-4 py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={tone === "danger" ? "danger-button px-4 py-2" : "premium-button px-4 py-2"}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
