// Plain data shared by the proxy, server and client code.

export const LOCALES = ["en", "km"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Remembers the last language the visitor used. Set by the proxy. */
export const LOCALE_COOKIE = "locale";

/** Each language's name in that language, for the switcher. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", km: "ខ្មែរ" };

/** Full locales for Intl date and number formatting. */
export const INTL_LOCALES: Record<Locale, string> = { en: "en-US", km: "km-KH" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Prefixes an app path with the locale: ("km", "/budgets") -> "/km/budgets". */
export function localePath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Metadata `alternates` for a page that exists in both languages: its canonical URL
 * and hreflang links to the other language, so search engines show the right one.
 */
export function languageAlternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
      "x-default": localePath(DEFAULT_LOCALE, path),
    },
  };
}

/** Splits "/km/budgets?x=1" into its locale and the rest ("/budgets"). */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return { locale: null, path: pathname };
  return { locale: first, path: `/${rest.join("/")}` };
}

/** Picks the best supported locale from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { language: tag.toLowerCase().split("-")[0], q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.language && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  return ranked.map((entry) => entry.language).find(isLocale) ?? DEFAULT_LOCALE;
}
