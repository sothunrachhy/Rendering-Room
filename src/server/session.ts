import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { users } from "@/db/schema";
import { db } from "@/db";
import {
  readSession,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  type SessionClaims,
  signSession,
} from "@/server/jwt";

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  // The role rides along in the cookie so the proxy can 404 other roles' pages early
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });
  const token = await signSession(userId, expiresAt, user?.role);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable from JavaScript, so XSS can't steal it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed session from the cookie. Use the DAL (src/server/auth.ts) for real checks. */
export async function getSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSession(token);
}
