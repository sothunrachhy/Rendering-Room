"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-field";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useI18n } from "@/i18n/client";
import { resetPassword } from "@/server/actions/password-reset";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t, path } = useI18n();
  const [state, formAction] = useActionState(resetPassword, undefined);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={state?.message} />
      {/* An expired or used link can't be fixed by retrying, so offer a new one */}
      {state?.message && (
        <Link
          href={path("/forgot-password")}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          {t("reset.requestNew")}
        </Link>
      )}
      <input type="hidden" name="token" value={token} />
      {/* Keep what was typed after an error, with a show/hide toggle (QA-05) */}
      <PasswordField
        label={t("reset.newPassword")}
        name="newPassword"
        autoComplete="new-password"
        hint={t("reset.hint")}
        errors={state?.fieldErrors?.newPassword}
      />
      <PasswordField
        label={t("reset.confirmPassword")}
        name="confirmPassword"
        autoComplete="new-password"
        errors={state?.fieldErrors?.confirmPassword}
      />
      <SubmitButton size="lg" className="w-full">
        {t("reset.submit")}
      </SubmitButton>
    </form>
  );
}
