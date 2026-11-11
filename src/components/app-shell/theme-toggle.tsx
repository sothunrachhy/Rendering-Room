"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { applyTheme, readTheme, type Theme, THEME_STORAGE_KEY } from "@/lib/theme";

// A tiny external store over localStorage, so every component reading the theme
// (this toggle, the toast container) stays in sync without a context provider.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  function setTheme(next: Theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode): the theme still applies for this page view
    }
    applyTheme(next);
    listeners.forEach((listener) => listener());
  }

  return [theme, setTheme];
}

/** One button: a sun in light mode, a moon in dark mode; each click switches. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useTheme();
  const { t } = useI18n();

  // React's dev-mode remount resets <html> attributes; re-apply before paint.
  useLayoutEffect(() => applyTheme(), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-pressed={theme === "dark"}
      title={t("theme.darkMode")}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {/* The icon follows the <html> class, so it's right before React hydrates */}
      <Sun className="dark:hidden" aria-hidden />
      <Moon className="hidden dark:block" aria-hidden />
      <span className="sr-only">{t("theme.darkMode")}</span>
    </Button>
  );
}
