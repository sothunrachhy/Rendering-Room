"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-field";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { changePassword } from "@/server/actions/settings";

export function PasswordForm({ disabled }: { disabled?: boolean }) {
  const { t } = useI18n();
  // Bumped after a successful change: remounts the fields, which empties them
  const [cleared, setCleared] = useState(0);
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await changePassword(prev, formData);
    if (result?.ok) {
      toast.success(result.message);
      setCleared((n) => n + 1);
    }
    return result;
  }, undefined);

  const errors = state?.fieldErrors;

  return (
    <form action={formAction} className="grid max-w-md gap-4" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      <fieldset key={cleared} disabled={disabled} className="grid gap-4 disabled:opacity-60">
        {/* Keep what was typed after an error, with a show/hide toggle (QA-05) */}
        <PasswordField
          label={t("settings.currentPassword")}
          name="currentPassword"
          autoComplete="current-password"
          errors={errors?.currentPassword}
        />
        <PasswordField
          label={t("settings.newPassword")}
          name="newPassword"
          autoComplete="new-password"
          errors={errors?.newPassword}
        />
        <PasswordField
          label={t("settings.confirmPassword")}
          name="confirmPassword"
          autoComplete="new-password"
          errors={errors?.confirmPassword}
        />
        <div>
          <SubmitButton>{t("settings.changePassword")}</SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}
