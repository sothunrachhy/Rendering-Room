/** Whole minutes (at least 1) until an attempt made at `oldest` leaves a `windowMs` window. */
export function minutesUntilRetry(oldest: Date, windowMs: number, now: Date = new Date()): number {
  const remaining = oldest.getTime() + windowMs - now.getTime();
  return Math.max(1, Math.ceil(remaining / 60_000));
}
