"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { passwordResetTokens, users } from "@/db/schema";
import { localePath } from "@/i18n/config";
import { getRequestI18n } from "@/i18n/request";
import { appUrl } from "@/lib/app-url";
import { db } from "@/db";
import { fieldErrors, type FormState, formValues } from "@/lib/form-state";
import { escapeHtml, sendEmail } from "@/server/mailer";
import { createSession } from "@/server/session";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";
import { createResetToken, findResetTokenUser } from "@/server/password-reset";

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { locale, t } = await getRequestI18n();
  const values = formValues(formData, ["email"]);

  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };
  const { email } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, name: true, email: true },
  });

  if (user) {
    const token = await createResetToken(user.id);
    if (token) {
      const link = `${appUrl()}${localePath(locale, "/reset-password")}?token=${token}`;
      const lines = [
        t("resetEmail.greeting", { name: user.name }),
        t("resetEmail.body"),
        link,
        t("resetEmail.expires"),
        t("resetEmail.ignore"),
      ];
      // Send after responding: the reply then takes the same time whether or not
      // the account exists, so response timing can't reveal registered emails.
      after(async () => {
        try {
          await sendEmail({
            to: user.email,
            subject: t("resetEmail.subject"),
            text: lines.join("\n\n"),
            html: [
              `<p>${escapeHtml(lines[0])}</p>`,
              `<p>${escapeHtml(lines[1])}</p>`,
              `<p><a href="${escapeHtml(link)}">${escapeHtml(t("resetEmail.button"))}</a></p>`,
              `<p>${escapeHtml(lines[3])}</p>`,
              `<p style="color:#666">${escapeHtml(lines[4])}</p>`,
            ].join(""),
          });
        } catch (error) {
          console.error("Password reset email failed", error);
        }
      });
    }
  }

  // The same answer whether or not the email has an account
  return { ok: true, message: t("forgot.sent", { email }), values };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = await getRequestI18n();
  const input = formValues(formData, ["token", "newPassword", "confirmPassword"]);

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t) };

  const userId = parsed.data.token ? await findResetTokenUser(parsed.data.token) : null;
  if (!userId) return { message: t("reset.invalid") };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.transaction(async (tx) => {
    // passwordChangedAt ends every existing session for this account
    await tx
      .update(users)
      .set({ passwordHash, passwordChangedAt: new Date() })
      .where(eq(users.id, userId));
    // The link works once: remove it and any other outstanding links
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  });

  await createSession(userId);
  redirect(localePath(locale, "/"));
}
