import { MailWarning } from "lucide-react";
import { ActionButton } from "@/components/forms/action-button";
import { getI18n } from "@/i18n/server";
import { getOptionalUser } from "@/server/auth";
import { resendVerificationEmail } from "@/server/actions/auth";

/** Shown until the user opens the link in their welcome email. */
export async function VerifyEmailBanner({ className }: { className?: string }) {
  const user = await getOptionalUser();
  if (!user || user.emailVerified) return null;
  const { t } = await getI18n();

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 ${className ?? ""}`}
    >
      <p className="flex items-start gap-2">
        <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t("verifyEmail.banner", { email: user.email })}
      </p>
      <ActionButton size="sm" variant="outline" action={resendVerificationEmail}>
        {t("verifyEmail.resend")}
      </ActionButton>
    </div>
  );
}
