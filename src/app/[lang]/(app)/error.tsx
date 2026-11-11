"use client"; // Error boundaries must be Client Components

import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { EmptyState } from "@/components/app-shell/empty-state";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error); // a real app would report this to an error tracker
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title={t("errors.title")}
      description={t("errors.description")}
      action={
        <Button onClick={() => retry()}>
          <RotateCw aria-hidden />
          {t("common.tryAgain")}
        </Button>
      }
    />
  );
}
