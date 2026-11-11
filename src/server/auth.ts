import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { type Role, users, type Verification } from "@/db/schema";
import { db } from "@/db";
import { sessionPredatesPasswordChange } from "@/server/jwt";
import { getSession } from "@/server/session";

// Data Access Layer: the one place that turns a session cookie into a user.
// The proxy only does an optimistic redirect; this is the real check.

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  verification: Verification;
  /** Has opened the link in the welcome email */
  emailVerified: boolean;
};

type SessionCheck =
  | { user: CurrentUser }
  // "stale": a valid cookie, but the account is gone or its password changed since
  | { user: null; reason: "signed-out" | "stale" };

/** Checks the cookie against the database. Runs once per request. */
const checkSession = cache(async (): Promise<SessionCheck> => {
  const session = await getSession();
  if (!session) return { user: null, reason: "signed-out" };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      verification: true,
      emailVerifiedAt: true,
      passwordChangedAt: true,
    },
  });
  if (!user || sessionPredatesPasswordChange(session.issuedAt, user.passwordChangedAt)) {
    return { user: null, reason: "stale" };
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      verification: user.verification,
      emailVerified: user.emailVerifiedAt !== null,
    },
  };
});

function redirectAway(reason: "signed-out" | "stale"): never {
  // Rendering can't delete cookies, so stale sessions go through the logout handler
  redirect(reason === "stale" ? "/api/logout" : "/login");
}

/** For Server Components behind login. Redirects to /login when signed out. */
export async function getCurrentUser(): Promise<CurrentUser> {
  const check = await checkSession();
  if (!check.user) redirectAway(check.reason);
  return check.user;
}

/** For public pages that show more to signed-in users. Never redirects. */
export async function getOptionalUser(): Promise<CurrentUser | null> {
  return (await checkSession()).user;
}

/**
 * For pages and Server Actions that only one kind of user may use. Other roles get a
 * 404, so the page doesn't even reveal that it exists.
 */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!roles.includes(user.role)) notFound();
  return user;
}

/** For Server Actions, which must re-check auth on every call. */
export async function requireUser(): Promise<CurrentUser> {
  return getCurrentUser();
}

/** For Route Handlers, which answer 401 instead of redirecting. */
export async function getUserOrNull(): Promise<CurrentUser | null> {
  return (await checkSession()).user;
}
