"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { requestViewing } from "@/server/actions/student";

export function ViewingRequestForm({
  roomId,
  minDateTime,
  maxDateTime,
}: {
  roomId: string;
  /** Earliest and latest allowed times, computed on the server ("YYYY-MM-DDTHH:mm") */
  minDateTime: string;
  maxDateTime: string;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await requestViewing(prev, formData);
    if (result?.ok) toast.success(result.message);
    return result;
  }, undefined);

  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      <input type="hidden" name="roomId" value={roomId} />
      <FormField
        label={t("viewing.preferredAt")}
        name="preferredAt"
        type="datetime-local"
        min={minDateTime}
        max={maxDateTime}
        step={900}
        defaultValue={state?.values?.preferredAt}
        errors={state?.fieldErrors?.preferredAt}
      />
      <FormField label={t("viewing.message")} name="message" errors={state?.fieldErrors?.message}>
        {({ invalid }) => (
          <Textarea
            id="message"
            name="message"
            rows={3}
            maxLength={500}
            placeholder={t("viewing.messagePlaceholder")}
            defaultValue={state?.values?.message}
            aria-invalid={invalid || undefined}
          />
        )}
      </FormField>
      <SubmitButton className="w-full">{t("viewing.send")}</SubmitButton>
    </form>
  );
}
