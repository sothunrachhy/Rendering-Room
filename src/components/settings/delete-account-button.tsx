"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import { deleteAccount } from "@/server/actions/settings";

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountButton({ disabled }: { disabled?: boolean }) {
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <AlertDialog onOpenChange={() => setConfirmation("")}>
      <AlertDialogTrigger disabled={disabled} render={<Button variant="destructive" />}>
        {t("settings.deleteAccount")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settings.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("settings.deleteWarning")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="confirm-delete">
            {t("settings.typeToConfirm", { word: CONFIRM_TEXT })}
          </Label>
          <Input
            id="confirm-delete"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={confirmation !== CONFIRM_TEXT || pending}
            onClick={() =>
              startTransition(async () => {
                // Redirects home on success; only returns when something went wrong
                const result = await deleteAccount();
                if (!result.ok) toast.error(result.message);
              })
            }
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {t("settings.deleteForever")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
