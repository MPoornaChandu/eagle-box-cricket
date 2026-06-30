"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ToastMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

type ToastInput = Omit<ToastMessage, "id">;

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const nextToast = { ...toast, id: createToastId() };
      setToasts((current) => [nextToast, ...current].slice(0, 4));
      window.setTimeout(() => removeToast(nextToast.id), 2000);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] grid w-[min(92vw,380px)] gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon =
              toast.type === "success" ? CheckCircle2 : toast.type === "error" ? AlertCircle : Info;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 32, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 32, scale: 0.96 }}
                className={cn(
                    "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-glass backdrop-blur-xl",
                  toast.type === "success" &&
                    "border-emerald-400/35 bg-emerald-950/[0.72] text-emerald-50",
                  toast.type === "error" && "border-red-400/35 bg-red-950/[0.72] text-red-50",
                  toast.type === "warning" && "border-amber-300/40 bg-amber-950/[0.78] text-amber-50",
                  toast.type === "info" && "border-emerald-400/35 bg-emerald-950/[0.72] text-emerald-50"
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-xs leading-5 opacity-[0.82]">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss toast"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-md p-1 text-white/[0.72] hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
