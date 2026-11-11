"use client";

import { Bookmark } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { toggleFavourite } from "@/server/actions/student";

/** Save / unsave a room. Flips instantly and rolls back if the server says no. */
export function SaveButton({
  roomId,
  saved,
  className,
}: {
  roomId: string;
  saved: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [, startTransition] = useTransition();

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
    <Button variant="outline" onClick={toggle} aria-pressed={optimisticSaved} className={className}>
      <Bookmark className={cn(optimisticSaved && "fill-current")} aria-hidden />
      {optimisticSaved ? t("room.saved") : t("room.save")}
    </Button>
  );
}
