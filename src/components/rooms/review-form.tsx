"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";
import { saveReview } from "@/server/actions/student";

export function ReviewForm({
  roomId,
  existing,
}: {
  roomId: string;
  existing?: { rating: number; comment: string | null };
}) {
  const { t } = useI18n();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await saveReview(prev, formData);
    if (result?.ok) toast.success(result.message);
    return result;
  }, undefined);

  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      <input type="hidden" name="roomId" value={roomId} />
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t("reviews.rating")}</legend>
        {/* Real radio buttons, styled as stars: keyboard and screen readers work as usual */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
              />
              <span className="peer-focus-visible:ring-ring/50 block rounded-md p-0.5 peer-focus-visible:ring-3">
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    value <= rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/50",
                  )}
                  aria-hidden
                />
              </span>
              <span className="sr-only">{t("reviews.stars", { count: value })}</span>
            </label>
          ))}
        </div>
        {state?.fieldErrors?.rating && (
          <p className="text-destructive text-sm">{state.fieldErrors.rating[0]}</p>
        )}
      </fieldset>
      <FormField label={t("reviews.comment")} name="comment" errors={state?.fieldErrors?.comment}>
        {({ invalid }) => (
          <Textarea
            id="comment"
            name="comment"
            rows={3}
            maxLength={1000}
            placeholder={t("reviews.commentPlaceholder")}
            defaultValue={state?.values?.comment ?? existing?.comment ?? ""}
            aria-invalid={invalid || undefined}
          />
        )}
      </FormField>
      <div>
        <SubmitButton>{t("reviews.submit")}</SubmitButton>
      </div>
    </form>
  );
}
