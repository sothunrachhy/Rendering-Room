import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { emailVerificationTokens, users } from "@/db/schema";
import { type Locale, localePath } from "@/i18n/config";
import type { Translator } from "@/i18n/translator";
import { appUrl } from "@/lib/app-url";
import { db } from "@/db";
import { escapeHtml, sendEmail } from "@/server/mailer";

const TOKEN_LIFETIME_MS = 48 * 60 * 60 * 1000; // 2 days: people don't always check email at once
const MAX_EMAILS_PER_HOUR = 3;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a one-time link token, or returns null when this user already asked for
 * several emails in the last hour (stops using the app to flood an inbox).
 */
async function createToken(userId: string): Promise<string | null> {
  const [recent] = await db
    .select({ count: count() })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.userId, userId),
        gt(emailVerificationTokens.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );
  if (recent.count >= MAX_EMAILS_PER_HOUR) return null;

  const token = randomBytes(32).toString("base64url");
  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
  });
  return token;
}

/** Sends the "confirm your email" message. Returns false if rate limited. */
export async function sendVerificationEmail(
  user: { id: string; name: string; email: string },
  locale: Locale,
  t: Translator,
): Promise<boolean> {
  const token = await createToken(user.id);
  if (!token) return false;

  const link = `${appUrl()}/api/verify-email?token=${token}&lang=${locale}`;
  const lines = [
    t("verifyEmail.mail.greeting", { name: user.name }),
    t("verifyEmail.mail.body"),
    link,
    t("verifyEmail.mail.expires"),
  ];
  await sendEmail({
    to: user.email,
    subject: t("verifyEmail.mail.subject"),
    text: lines.join("\n\n"),
    html: [
      `<p>${escapeHtml(lines[0])}</p>`,
      `<p>${escapeHtml(lines[1])}</p>`,
      `<p><a href="${escapeHtml(link)}">${escapeHtml(t("verifyEmail.mail.button"))}</a></p>`,
      `<p style="color:#666">${escapeHtml(lines[3])}</p>`,
    ].join(""),
  });
  return true;
}

/**
 * Marks the token's user as verified and removes their links. Returns false for an
 * unknown, used or expired token.
 */
export async function consumeVerificationToken(token: string): Promise<boolean> {
  const row = await db.query.emailVerificationTokens.findFirst({
    where: and(
      eq(emailVerificationTokens.tokenHash, hashToken(token)),
      gt(emailVerificationTokens.expiresAt, new Date()),
    ),
    columns: { userId: true },
  });
  if (!row) return false;

  await db.transaction(async (tx) => {
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
    await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, row.userId));
  });
  return true;
}

/** Where the link in the email lands after it's checked. */
export function verifiedPath(locale: Locale, ok: boolean): string {
  return `${localePath(locale, "/email-confirmed")}${ok ? "" : "?status=invalid"}`;
}
