"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { rejectLandlord } from "@/server/actions/admin";

export function RejectLandlordDialog({ userId, name }: { userId: string; name: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>{t("admin.reject")}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.rejectTitle", { name })}</DialogTitle>
        </DialogHeader>
        {open && <RejectForm userId={userId} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RejectForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await rejectLandlord(prev, formData);
    if (result?.ok) {
      toast.success(result.message);
      onDone();
    }
    return result;
  }, undefined);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      <input type="hidden" name="userId" value={userId} />
      <FormField
        label={t("admin.rejectReason")}
        name="note"
        maxLength={200}
        placeholder={t("admin.rejectPlaceholder")}
        defaultValue={state?.values?.note}
        errors={state?.fieldErrors?.note}
      />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>{t("common.cancel")}</DialogClose>
        <SubmitButton variant="destructive">{t("admin.reject")}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
