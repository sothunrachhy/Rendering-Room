import "server-only";
// RoomFinder no longer asks people to confirm their email, but links already sent still
// work: they mark the address as confirmed.
import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { emailVerificationTokens, users } from "@/db/schema";
import { type Locale, localePath } from "@/i18n/config";
import { db } from "@/db";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
