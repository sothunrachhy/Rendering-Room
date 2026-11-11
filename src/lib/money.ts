// Money in RoomFinder: US dollars, stored as integer cents (no floating point), shown
// with formatPrice and typed into forms via parseAmountToCents / centsToInput.
import type { Locale } from "@/i18n/config";

// Largest single amount we accept: 10,000,000.00. Keeps sums far from int overflow.
export const MAX_AMOUNT_CENTS = 1_000_000_000;

/**
 * Parses user input like "12", "12.5", "1,234.56" into cents without ever going
 * through floating point. Returns null for anything that isn't a valid amount.
 */
export function parseAmountToCents(input: string): number | null {
  const value = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;

  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Formats cents as a plain decimal string for form inputs, e.g. 1250 -> "12.50". */
export function centsToInput(cents: number): string {
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}

/**
 * Prices in RoomFinder: always US dollars, and whole amounts without ".00"
 * ($120, but $0.25 per kWh). Khmer puts the symbol after the number (120$).
 */
export function formatPrice(cents: number, locale: Locale = "en"): string {
  const whole = cents % 100 === 0;
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
  return locale === "km" ? `${number}$` : `$${number}`;
}
