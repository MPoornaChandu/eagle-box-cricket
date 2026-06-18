"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { ResolvedThemeMode, ThemeMode } from "@/lib/types";
import {
  applyResolvedTheme,
  getStoredTheme,
  getSystemTheme,
  resolveTheme,
  saveStoredTheme
} from "@/lib/theme";

interface ThemeContextValue {
  mounted: boolean;
  theme: ThemeMode;
  resolvedTheme: ResolvedThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedThemeMode>("dark");

  const applyTheme = useCallback((nextTheme: ThemeMode) => {
    const nextResolvedTheme = resolveTheme(nextTheme);
    setResolvedTheme(nextResolvedTheme);
    applyResolvedTheme(nextResolvedTheme);
  }, []);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    setThemeState(storedTheme);
    applyTheme(storedTheme);
    setMounted(true);
  }, [applyTheme]);

  useEffect(() => {
    if (!mounted || theme !== "system" || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => applyTheme("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyTheme, mounted, theme]);

  const setTheme = useCallback(
    (nextTheme: ThemeMode) => {
      setThemeState(nextTheme);
      saveStoredTheme(nextTheme);
      applyTheme(nextTheme);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({
      mounted,
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme
    }),
    [mounted, resolvedTheme, setTheme, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
