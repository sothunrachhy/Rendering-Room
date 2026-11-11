import { z } from "zod";
import type { TranslationKey, Translator } from "@/i18n/translator";

/** What every form Server Action returns to `useActionState`. */
export type FormState =
  | {
      ok?: boolean;
      /** Form-level message, e.g. "Invalid email or password" */
      message?: string;
      fieldErrors?: Record<string, string[] | undefined>;
      /** Submitted values, so inputs keep what the user typed after an error */
      values?: Record<string, string>;
    }
  | undefined;

/** Zod issues carry translation keys; this turns them into the user's language. */
export function fieldErrors(
  error: z.ZodError,
  t: Translator,
): Record<string, string[] | undefined> {
  const errors = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      messages?.map((key) => t(key as TranslationKey)),
    ]),
  );
}

/** Reads the given fields from FormData as strings (missing fields become ""). */
export function formValues<K extends string>(formData: FormData, keys: readonly K[]) {
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")])) as Record<
    K,
    string
  >;
}
