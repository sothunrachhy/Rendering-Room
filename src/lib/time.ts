import type { Locale } from "@/i18n/config";

// Every time in RoomFinder is Phnom Penh time (UTC+7, no daylight saving), whatever
// the timezone of the server or browser.

export const PHNOM_PENH_OFFSET = "+07:00";
const OFFSET_MS = 7 * 60 * 60 * 1000;
export const MAX_VIEWING_DAYS_AHEAD = 60;

// Browsers ship without Khmer date data (Intl silently falls back to English), so
// Khmer month names come from this table to match on server and browser.
const KHMER_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];
const ENGLISH_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * Reads a `<input type="datetime-local">` value ("2026-11-20T14:30") as Phnom Penh
 * time. Returns null for anything malformed or impossible (e.g. 30 February).
 */
export function parsePhnomPenhDateTime(value: string): Date | null {
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) return null;
  const date = new Date(`${value}:00${PHNOM_PENH_OFFSET}`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects dates that Date would silently roll over
  return toPhnomPenhInput(date) === value ? date : null;
}

/** The opposite of parsePhnomPenhDateTime: a Date as "YYYY-MM-DDTHH:mm" Phnom Penh time. */
export function toPhnomPenhInput(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

/**
 * The next full quarter hour after `date` (10:01 -> 10:15, 10:15 -> 10:30). Used as
 * the earliest viewing time, so the 15-minute picker offers 10:00, 10:15… not 10:01, 10:16…
 */
export function nextQuarterHour(date: Date): Date {
  const quarter = 15 * 60 * 1000;
  return new Date(Math.floor(date.getTime() / quarter) * quarter + quarter);
}

/** Parts of a date in Phnom Penh time. */
function parts(date: Date) {
  const local = new Date(date.getTime() + OFFSET_MS);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    hours: local.getUTCHours(),
    minutes: local.getUTCMinutes(),
  };
}

/** "20 Nov 2026" or "20 វិច្ឆិកា 2026" */
export function formatDate(date: Date, locale: Locale = "en"): string {
  const { year, month, day } = parts(date);
  const months = locale === "km" ? KHMER_MONTHS : ENGLISH_MONTHS;
  return `${day} ${months[month]} ${year}`;
}

/** "20 Nov 2026, 14:30": a 24-hour clock reads the same in both languages */
export function formatDateTime(date: Date, locale: Locale = "en"): string {
  const { hours, minutes } = parts(date);
  const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return `${formatDate(date, locale)}, ${time}`;
}
