"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

type ThemeState = {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

const STORAGE_KEY = "armay-theme";
const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

/** Reads the theme the pre-hydration inline script already applied to <html>. */
function currentTheme(): Theme {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR + first client render default to "dark" (matches server markup); synced in effect.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(currentTheme());
  }, []);

  function apply(t: Theme) {
    setThemeState(t);
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore storage errors (private mode) */
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => apply(theme === "dark" ? "light" : "dark"), setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}
