"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import type { Role } from "@/db/schema";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { updateProfile } from "@/server/actions/settings";

export function ProfileForm({
  name,
  phone,
  role,
}: {
  name: string;
  phone: string | null;
  role: Role;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await updateProfile(prev, formData);
    if (result?.ok) toast.success(result.message);
    return result;
  }, undefined);

  return (
    <form action={formAction} className="grid max-w-md gap-4" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      <FormField
        label={t("settings.name")}
        name="name"
        autoComplete="name"
        defaultValue={state?.values?.name ?? name}
        errors={state?.fieldErrors?.name}
      />
      <FormField
        label={t("settings.phone")}
        name="phone"
        type="tel"
        autoComplete="tel"
        hint={role === "LANDLORD" ? t("auth.phoneHint") : t("auth.phoneHintStudent")}
        defaultValue={state?.values?.phone ?? phone ?? ""}
        errors={state?.fieldErrors?.phone}
      />
      <div>
        <SubmitButton>{t("settings.saveProfile")}</SubmitButton>
      </div>
    </form>
  );
}
