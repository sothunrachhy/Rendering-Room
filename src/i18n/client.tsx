"use client";

import { createContext, type ReactNode, use, useMemo } from "react";
import { type Locale, localePath } from "./config";
import type { Dictionary } from "./dictionaries/en";
import { createTranslator } from "./translator";

type I18nContextValue = { locale: Locale; dictionary: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

/** Provided once in the root layout, so every Client Component can translate. */
export function I18nProvider({
  locale,
  dictionary,
  children,
}: I18nContextValue & { children: ReactNode }) {
  return <I18nContext value={{ locale, dictionary }}>{children}</I18nContext>;
}

export function useI18n() {
  const context = use(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");

  const { locale, dictionary } = context;
  const t = useMemo(() => createTranslator(dictionary, locale), [dictionary, locale]);
  return { locale, t, path: (path: string) => localePath(locale, path) };
}
