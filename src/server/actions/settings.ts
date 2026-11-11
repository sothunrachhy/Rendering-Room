"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { passwordResetTokens, users } from "@/db/schema";
import { localePath } from "@/i18n/config";
import { getRequestI18n } from "@/i18n/request";
import { requireUser } from "@/server/auth";
import { db } from "@/db";
import { fieldErrors, type FormState, formValues } from "@/lib/form-state";
import { createSession, deleteSession } from "@/server/session";
import { telegramLink } from "@/server/telegram";
import { changePasswordSchema, profileSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/actions/types";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getRequestI18n();
  const values = formValues(formData, ["name", "phone"]);

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  await db.update(users).set(parsed.data).where(eq(users.id, user.id));

  refresh();
  return { ok: true, message: t("messages.profileSaved"), values };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { id: userId } = await requireUser();
  const { t } = await getRequestI18n();
  const input = formValues(formData, ["currentPassword", "newPassword", "confirmPassword"]);

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t) };

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { passwordHash: true },
  });
  if (!user) redirect("/api/logout");

  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { fieldErrors: { currentPassword: [t("messages.wrongPassword")] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.transaction(async (tx) => {
    // passwordChangedAt logs out every other device that was signed in
    await tx
      .update(users)
      .set({ passwordHash, passwordChangedAt: new Date() })
      .where(eq(users.id, userId));
    // Any reset link that was emailed earlier must stop working too
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  });
  // ...but keep this device signed in with a fresh session
  await createSession(userId);

  return { ok: true, message: t("messages.passwordChanged") };
}

/**
 * Starts linking Telegram: stores a one-time token and returns the bot link that
 * carries it. The webhook finishes the link when the user presses Start.
 */
export async function startTelegramLink(): Promise<{ url: string | null }> {
  const user = await requireUser();
  const { locale } = await getRequestI18n();
  const token = randomBytes(16).toString("hex");
  // Alerts use the language the user connected in
  await db.update(users).set({ telegramLinkToken: token, locale }).where(eq(users.id, user.id));
  return { url: telegramLink(token) };
}

export async function disconnectTelegram(): Promise<ActionResult> {
  const user = await requireUser();
  const { t } = await getRequestI18n();
  await db
    .update(users)
    .set({ telegramChatId: null, telegramLinkToken: null })
    .where(eq(users.id, user.id));
  refresh();
  return { ok: true, message: t("messages.telegramOff") };
}

export async function deleteAccount(): Promise<ActionResult> {
  const user = await requireUser();
  const { locale, t } = await getRequestI18n();
  // Admins are created by the seed script; deleting the last one would lock everyone out
  if (user.role === "ADMIN") return { ok: false, message: t("messages.notAllowed") };

  // Cascades to rooms, photos, favourites, requests, reviews and reports
  await db.delete(users).where(eq(users.id, user.id));
  await deleteSession();
  redirect(localePath(locale, "/"));
}
