"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemeMode } from "@/lib/types";
import { useTheme } from "./providers/ThemeProvider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mounted, resolvedTheme, theme, setTheme, toggleTheme } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Theme loading"
        disabled
        className="theme-toggle inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-black opacity-70"
      >
        <Monitor className="h-4 w-4" />
        {compact ? null : <span>Theme</span>}
      </button>
    );
  }

  const Icon = resolvedTheme === "light" ? Sun : Moon;
  const label = resolvedTheme === "light" ? "Light" : "Dark";

  const handleCycleTheme = () => {
    const order: ThemeMode[] = ["dark", "light", "system"];
    const nextTheme = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      aria-label={`Current theme: ${label}. Toggle theme mode.`}
      title={theme === "system" ? `System (${label})` : `Current theme: ${label}`}
      onClick={compact ? toggleTheme : handleCycleTheme}
      className="theme-toggle inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-black"
    >
      <Icon className="h-4 w-4" />
      {compact ? null : <span>{theme === "system" ? `System: ${label}` : label}</span>}
    </button>
  );
}
