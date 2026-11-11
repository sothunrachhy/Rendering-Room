import "server-only";
import { and, asc, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { authAttempts } from "@/db/schema";
import { db } from "@/db";
import { minutesUntilRetry } from "@/lib/rate-limit-window";

type Limit = { max: number; windowMs: number };

const MINUTE = 60 * 1000;

export const LIMITS = {
  // Wrong passwords for one account: stops guessing a single student's password
  loginPerEmail: { max: 5, windowMs: 15 * MINUTE },
  // Wrong passwords from one network: stops trying many accounts at once.
  // Generous, because a whole dormitory or campus Wi-Fi can share one address.
  loginPerIp: { max: Number(process.env.LOGIN_LIMIT_PER_IP) || 30, windowMs: 15 * MINUTE },
  // New accounts from one network. SIGNUP_LIMIT_PER_HOUR lets the end-to-end tests,
  // which sign up many accounts from one machine, raise it.
  registerPerIp: { max: Number(process.env.SIGNUP_LIMIT_PER_HOUR) || 10, windowMs: 60 * MINUTE },
} satisfies Record<string, Limit>;

/**
 * The visitor's IP address. On Vercel `x-real-ip` is set by the platform and can't be
 * faked; elsewhere fall back to the first `x-forwarded-for` hop.
 */
export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-real-ip") ?? list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Minutes to wait before trying again, or 0 when the key is under its limit. */
export async function retryAfter(key: string, limit: Limit): Promise<number> {
  const since = new Date(Date.now() - limit.windowMs);
  const [{ attempts }] = await db
    .select({ attempts: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.key, key), gt(authAttempts.createdAt, since)));
  if (attempts < limit.max) return 0;

  // Blocked until the oldest attempt in the window falls out of it
  const [oldest] = await db
    .select({ createdAt: authAttempts.createdAt })
    .from(authAttempts)
    .where(and(eq(authAttempts.key, key), gt(authAttempts.createdAt, since)))
    .orderBy(asc(authAttempts.createdAt))
    .limit(1);
  return minutesUntilRetry(oldest.createdAt, limit.windowMs);
}

export async function recordAttempt(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await db.insert(authAttempts).values(keys.map((key) => ({ key })));
  // Housekeeping: nothing older than a day matters for any limit
  await db
    .delete(authAttempts)
    .where(lt(authAttempts.createdAt, new Date(Date.now() - 24 * 60 * MINUTE)));
}

export async function clearAttempts(key: string): Promise<void> {
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}
