"use client";

import { Flag } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormSelect } from "@/components/forms/form-select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { REPORT_REASONS } from "@/lib/rooms";
import { reportRoom } from "@/server/actions/student";

export function ReportDialog({ roomId }: { roomId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}
      >
        <Flag aria-hidden />
        {t("report.button")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
          <DialogDescription>{t("report.description")}</DialogDescription>
        </DialogHeader>
        {open && <ReportForm roomId={roomId} onSent={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ReportForm({ roomId, onSent }: { roomId: string; onSent: () => void }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await reportRoom(prev, formData);
    if (result?.ok) {
      toast.success(result.message);
      onSent();
    }
    return result;
  }, undefined);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      <input type="hidden" name="roomId" value={roomId} />
      <FormField label={t("report.reason")} name="reason" errors={state?.fieldErrors?.reason}>
        {({ invalid }) => (
          <FormSelect
            key={state?.values?.reason}
            id="reason"
            name="reason"
            defaultValue={state?.values?.reason ?? ""}
            placeholder={t("report.chooseReason")}
            invalid={invalid}
            describedBy="reason-error"
            options={REPORT_REASONS.map((reason) => ({
              value: reason,
              label: t(`report.reasons.${reason}`),
            }))}
          />
        )}
      </FormField>
      <FormField label={t("report.details")} name="details" errors={state?.fieldErrors?.details}>
        {({ invalid }) => (
          <Textarea
            id="details"
            name="details"
            rows={3}
            maxLength={500}
            placeholder={t("report.detailsPlaceholder")}
            defaultValue={state?.values?.details}
            aria-invalid={invalid || undefined}
          />
        )}
      </FormField>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>{t("common.cancel")}</DialogClose>
        <SubmitButton>{t("report.submit")}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
