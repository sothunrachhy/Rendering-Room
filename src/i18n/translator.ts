import { INTL_LOCALES, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

/** Count-dependent text, e.g. { one: "1 budget", other: "{count} budgets" } */
export type PluralForms = { one: string; other: string };

/** Every dotted path to a string (or plural forms) in the dictionary, e.g. "nav.dashboard". */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | PluralForms
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Paths<Dictionary>;

export type TranslationValues = Record<string, string | number>;

export type Translator = (key: TranslationKey, values?: TranslationValues) => string;

export function createTranslator(dictionary: Dictionary, locale: Locale): Translator {
  const plurals = new Intl.PluralRules(INTL_LOCALES[locale]);

  return (key, values) => {
    let entry: unknown = dictionary;
    for (const part of key.split(".")) {
      entry = (entry as Record<string, unknown> | undefined)?.[part];
    }

    if (entry && typeof entry === "object" && "other" in entry) {
      const forms = entry as PluralForms;
      entry = plurals.select(Number(values?.count ?? 0)) === "one" ? forms.one : forms.other;
    }

    // A missing key shows the key itself, which is easy to spot while developing
    if (typeof entry !== "string") return key;
    if (!values) return entry;
    return entry.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
}
