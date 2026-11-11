import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { passwordResetTokens } from "@/db/schema";
import { db } from "@/db";

const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 3;

/** Only this hash is stored. The token itself exists only in the email. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a one-time reset token for the user and returns it, or null when the
 * user has asked for too many links in the last hour (stops email flooding).
 */
export async function createResetToken(userId: string): Promise<string | null> {
  const [recent] = await db
    .select({ count: count() })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        gt(passwordResetTokens.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );
  if (recent.count >= MAX_REQUESTS_PER_HOUR) return null;

  const token = randomBytes(32).toString("base64url"); // 256 bits: can't be guessed
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
  });
  return token;
}

/** The user a token belongs to, if it exists and hasn't expired. */
export async function findResetTokenUser(token: string): Promise<string | null> {
  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, hashResetToken(token)),
      gt(passwordResetTokens.expiresAt, new Date()),
    ),
    columns: { userId: true },
  });
  return row?.userId ?? null;
}
