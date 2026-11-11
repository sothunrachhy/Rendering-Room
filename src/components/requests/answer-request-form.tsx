"use client";

import { Check, X } from "lucide-react";
import { useActionState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { answerRequest } from "@/server/actions/requests";

/** Accept or decline with one optional reply. The clicked button sends the decision. */
export function AnswerRequestForm({ requestId }: { requestId: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await answerRequest(prev, formData);
    if (result?.ok) toast.success(result.message);
    return result;
  }, undefined);
  const replyId = `reply-${requestId}`;

  return (
    <form action={formAction} className="grid gap-2" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      <input type="hidden" name="id" value={requestId} />
      <Label htmlFor={replyId}>{t("requests.replyLabel")}</Label>
      <Textarea
        id={replyId}
        name="reply"
        rows={2}
        maxLength={300}
        placeholder={t("requests.replyPlaceholder")}
        defaultValue={state?.values?.reply}
      />
      {state?.fieldErrors?.reply && (
        <p className="text-destructive text-sm">{state.fieldErrors.reply[0]}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="ACCEPTED">
          <Check aria-hidden />
          {t("requests.accept")}
        </SubmitButton>
        <SubmitButton name="decision" value="DECLINED" variant="outline">
          <X aria-hidden />
          {t("requests.decline")}
        </SubmitButton>
      </div>
    </form>
  );
}
