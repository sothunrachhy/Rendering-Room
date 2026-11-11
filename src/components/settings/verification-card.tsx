"use client";

import { BadgeCheck, Clock, Loader2, ShieldAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Verification } from "@/db/schema";
import { useI18n } from "@/i18n/client";
import { shrinkImage } from "@/lib/image-resize";

export function VerificationCard({ status, note }: { status: Verification; note: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("document", await shrinkImage(file), "id.jpg");
    try {
      const response = await fetch("/api/id-documents", { method: "POST", body });
      const result = (await response.json()) as { message?: string; error?: string };
      if (response.ok) toast.success(result.message);
      else toast.error(result.error ?? t("messages.uploadFailed"));
    } catch {
      toast.error(t("messages.uploadFailed"));
    }
    setUploading(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  const statusLine = {
    UNVERIFIED: { icon: ShieldAlert, text: null, className: "text-amber-700 dark:text-amber-300" },
    PENDING: { icon: Clock, text: t("verification.pendingText"), className: "" },
    VERIFIED: { icon: BadgeCheck, text: t("verification.verifiedText"), className: "text-primary" },
    REJECTED: {
      icon: ShieldAlert,
      text: note ? t("verification.rejectedText", { note }) : t("verification.rejectedNoNote"),
      className: "text-destructive",
    },
  }[status];
  const StatusIcon = statusLine.icon;

  return (
    <div className="grid gap-3">
      <p className={`flex items-start gap-2 text-sm font-medium ${statusLine.className}`}>
        <StatusIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {t(`verification.status.${status}`)}
          {statusLine.text && (
            <span className="text-muted-foreground block font-normal">{statusLine.text}</span>
          )}
        </span>
      </p>

      {status !== "VERIFIED" && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            id="id-document"
            onChange={(event) => upload(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant={status === "PENDING" ? "outline" : "default"}
            className="w-fit"
            disabled={uploading}
            onClick={() => input.current?.click()}
          >
            {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
            {status === "UNVERIFIED" ? t("verification.upload") : t("verification.uploadAgain")}
          </Button>
          <p className="text-muted-foreground text-xs">{t("verification.privacy")}</p>
        </>
      )}
    </div>
  );
}
