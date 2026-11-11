import type { Locale } from "../config";
import en, { type Dictionary } from "./en";
import km from "./km";

export const dictionaries: Record<Locale, Dictionary> = { en, km };
