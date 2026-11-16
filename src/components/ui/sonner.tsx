"use client";

import { CheckIcon, InfoIcon, Loader2Icon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/app-shell/theme-toggle";
import { useI18n } from "@/i18n/client";

/**
 * The site's notifications ("Room saved", errors…): a white card with a solid coloured
 * icon badge, navy text and the close button inside on the right. Sonner's own look is
 * switched off (unstyled), so these classes are the whole design, light and dark.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const [theme] = useTheme();
  const { t } = useI18n();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      containerAriaLabel={t("common.notifications")}
      icons={{
        success: <CheckIcon strokeWidth={3} />,
        info: <InfoIcon strokeWidth={2.5} />,
        warning: <TriangleAlertIcon strokeWidth={2.5} />,
        error: <XIcon strokeWidth={3} />,
        loading: <Loader2Icon className="animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: t("common.closeNotification"),
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-3 pr-12 pl-3 text-sm shadow-[0_14px_36px_-10px_rgb(16_45_104/0.3)] dark:border-white/10 dark:bg-slate-900 dark:shadow-black/50",
          icon: "flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 [&_svg]:size-[18px]",
          content: "grid min-w-0 flex-1 gap-0.5",
          title: "leading-snug font-semibold text-[#0f2d68] dark:text-white",
          description: "text-muted-foreground text-xs leading-snug",
          // !: Sonner's dark theme paints the close button; these must win
          closeButton:
            "absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0! bg-transparent! text-slate-400! transition-colors hover:bg-slate-100! hover:text-slate-700! dark:hover:bg-white/10! dark:hover:text-white! [&_svg]:size-4",
          actionButton:
            "bg-primary rounded-full px-3 py-1.5 text-xs font-semibold text-white dark:bg-sky-400 dark:text-slate-950",
          // The icon's round badge takes the type's colour (written out in full so
          // Tailwind sees every class)
          success: "[&_[data-icon]]:bg-green-500 [&_[data-icon]]:text-white",
          error: "[&_[data-icon]]:bg-red-500 [&_[data-icon]]:text-white",
          info: "[&_[data-icon]]:bg-primary [&_[data-icon]]:text-white dark:[&_[data-icon]]:bg-sky-400 dark:[&_[data-icon]]:text-slate-950",
          warning: "[&_[data-icon]]:bg-amber-500 [&_[data-icon]]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
