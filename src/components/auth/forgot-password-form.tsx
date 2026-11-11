"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useI18n } from "@/i18n/client";
import { requestPasswordReset } from "@/server/actions/password-reset";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <p role="status" className="bg-muted flex items-start gap-2 rounded-lg px-3 py-3 text-sm">
        <MailCheck className="text-status-good mt-0.5 size-4 shrink-0" aria-hidden />
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={state?.message} />
      <FormField
        label={t("auth.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
      />
      <SubmitButton size="lg" className="w-full">
        {t("forgot.submit")}
      </SubmitButton>
    </form>
  );
}
