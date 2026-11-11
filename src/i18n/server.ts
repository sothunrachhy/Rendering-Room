import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale } from "./config";
import { dictionaries } from "./dictionaries";
import { createTranslator } from "./translator";

/**
 * For Server Components: the locale from the URL (/en/..., /km/...) plus a
 * translator. Reads the [lang] root param, so no props need to be passed down.
 */
export async function getI18n() {
  const locale = await lang();
  if (!isLocale(locale)) notFound();

  const dictionary = dictionaries[locale];
  return { locale, dictionary, t: createTranslator(dictionary, locale) };
}
