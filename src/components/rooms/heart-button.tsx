"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { toggleFavourite } from "@/server/actions/student";

const circle =
  "relative z-10 flex size-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md transition hover:scale-105 hover:text-rose-500 motion-reduce:hover:scale-100";

/**
 * The heart on a room photo. Students save / unsave the room (same as the room page's
 * Save button); visitors are sent to log in first, then back to the room.
 */
export function HeartButton({
  roomId,
  saved,
  loginHref,
  className,
}: {
  roomId: string;
  /** null: not logged in as a student */
  saved: boolean | null;
  loginHref: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved ?? false);
  const [, startTransition] = useTransition();

  if (saved === null) {
    return (
      <Link href={loginHref} className={cn(circle, className)}>
        <Heart className="size-[18px]" aria-hidden />
        <span className="sr-only">{t("room.save")}</span>
      </Link>
    );
  }

  function toggle() {
    const next = !optimisticSaved;
    startTransition(async () => {
      setOptimisticSaved(next);
      const result = await toggleFavourite(roomId, next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimisticSaved}
      className={cn(circle, optimisticSaved && "text-rose-500", className)}
    >
      <Heart className={cn("size-[18px]", optimisticSaved && "fill-current")} aria-hidden />
      <span className="sr-only">{t("room.save")}</span>
    </button>
  );
}
