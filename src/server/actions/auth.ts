"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { type Role, users } from "@/db/schema";
import { type Locale, localePath } from "@/i18n/config";
import { getRequestI18n } from "@/i18n/request";
import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { fieldErrors, type FormState, formValues } from "@/lib/form-state";
import { HOME_PATHS } from "@/lib/roles";
import { createSession, deleteSession } from "@/server/session";
import { loginSchema, registerSchema } from "@/lib/validation";
import { sendVerificationEmail } from "@/server/email-verification";
import { clearAttempts, clientIp, LIMITS, recordAttempt, retryAfter } from "@/server/rate-limit";
import type { ActionResult } from "@/server/actions/types";
import { requireUser } from "@/server/auth";

/** "Send the link again" for users who haven't confirmed their email yet. */
export async function resendVerificationEmail(): Promise<ActionResult> {
  const user = await requireUser();
  const { locale, t } = await getRequestI18n();
  if (user.emailVerified) return { ok: true, message: t("verifyEmail.confirmedTitle") };

  const sent = await sendVerificationEmail(user, locale, t);
  return sent
    ? { ok: true, message: t("messages.verificationSent", { email: user.email }) }
    : { ok: false, message: t("messages.verificationTooMany") };
}

const BCRYPT_ROUNDS = 12;

/** Where each kind of user lands after logging in. */
function homePathFor(role: Role, locale: Locale): string {
  return localePath(locale, HOME_PATHS[role]);
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = await getRequestI18n();
  const input = formValues(formData, ["name", "email", "phone", "password", "role"]);
  // never echo the password back
  const values = { name: input.name, email: input.email, phone: input.phone, role: input.role };

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  // Stops one network from creating accounts in bulk
  const ipKey = `signup-ip:${await clientIp()}`;
  if ((await retryAfter(ipKey, LIMITS.registerPerIp)) > 0) {
    return { message: t("messages.tooManySignups"), values };
  }

  const { password, ...profile } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let userId: string;
  try {
    const [user] = await db
      .insert(users)
      .values({ ...profile, passwordHash, locale })
      .returning({ id: users.id });
    userId = user.id;
  } catch (error) {
    // The unique index on email is the source of truth, so there's no check-then-insert race.
    if (isUniqueViolation(error)) {
      return { fieldErrors: { email: [t("messages.emailTaken")] }, values };
    }
    throw error;
  }
  await recordAttempt(ipKey);

  // "Confirm your email" link, sent after the response so sign-up stays fast
  const welcome = { id: userId, name: profile.name, email: profile.email };
  after(async () => {
    try {
      await sendVerificationEmail(welcome, locale, t);
    } catch (error) {
      console.error("Verification email failed", error);
    }
  });

  await createSession(userId);
  // New landlords start on their rooms page, which explains verification
  redirect(homePathFor(profile.role, locale));
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = await getRequestI18n();
  const input = formValues(formData, ["email", "password", "next"]);
  const values = { email: input.email };

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  // Brute-force protection: a few wrong passwords lock that email for a while, and
  // many wrong passwords from one network lock that network. Checked before the
  // password, so a locked account gives nothing away even with the right one.
  const emailKey = `login-email:${parsed.data.email}`;
  const ipKey = `login-ip:${await clientIp()}`;
  const wait = Math.max(
    await retryAfter(emailKey, LIMITS.loginPerEmail),
    await retryAfter(ipKey, LIMITS.loginPerIp),
  );
  if (wait > 0) return { message: t("messages.tooManyAttempts", { count: wait }), values };

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
    columns: { id: true, passwordHash: true, role: true },
  });

  // One message for both cases, so the form can't be used to find out which emails exist.
  const valid = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!valid) {
    await recordAttempt(emailKey, ipKey);
    return { message: t("messages.invalidCredentials"), values };
  }

  await clearAttempts(emailKey);
  await createSession(user.id);
  redirect(safeRedirectPath(input.next, homePathFor(user.role, locale)));
}

export async function logout(): Promise<void> {
  const { locale } = await getRequestI18n();
  await deleteSession();
  redirect(localePath(locale, "/"));
}

/** Only allow same-site paths, so `?next=https://evil.com` can't be used for phishing. */
function safeRedirectPath(next: string, fallback: string): string {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : fallback;
}
