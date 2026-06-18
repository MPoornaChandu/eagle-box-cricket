import type { ResolvedThemeMode, ThemeMode } from "./types";

export const THEME_STORAGE_KEY = "ebc_theme";

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light" || value === "system";
}

export function getSystemTheme(): ResolvedThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveTheme(theme: ThemeMode): ResolvedThemeMode {
  return theme === "system" ? getSystemTheme() : theme;
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(storedTheme) ? storedTheme : "system";
}

export function saveStoredTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyResolvedTheme(resolvedTheme: ResolvedThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.classList.toggle("light", resolvedTheme === "light");
  document.documentElement.style.colorScheme = resolvedTheme;
}
