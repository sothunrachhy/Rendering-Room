import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./config";
import { dictionaries } from "./dictionaries";
import { createTranslator } from "./translator";

/**
 * For Server Actions and Route Handlers, which can't read the URL's [lang] root
 * param. The proxy keeps the locale cookie in sync with the URL, so this matches
 * the page the request came from.
 */
export async function getRequestI18n() {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  return { locale, t: createTranslator(dictionaries[locale], locale) };
}
