"use client";

import { CircleCheck, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { ActionButton } from "@/components/forms/action-button";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { disconnectTelegram, startTelegramLink } from "@/server/actions/settings";

export function TelegramCard({
  connected,
  configured,
}: {
  connected: boolean;
  configured: boolean;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [opened, setOpened] = useState(false);

  if (!configured)
    return <p className="text-muted-foreground text-sm">{t("telegram.notConfigured")}</p>;

  if (connected) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-primary flex items-center gap-1.5 text-sm font-medium">
          <CircleCheck className="size-4" aria-hidden />
          {t("telegram.connected")}
        </p>
        <ActionButton variant="outline" size="sm" action={disconnectTelegram}>
          {t("telegram.disconnect")}
        </ActionButton>
      </div>
    );
  }

  function connect() {
    // Open the tab right away (still inside the click), then point it at the bot link:
    // browsers block popups opened after an await
    const tab = window.open("about:blank", "_blank");
    startTransition(async () => {
      const { url } = await startTelegramLink();
      if (url && tab) tab.location.href = url;
      else if (url) window.location.href = url;
      else tab?.close();
      setOpened(true);
    });
  }

  return (
    <div className="grid gap-2">
      <Button onClick={connect} disabled={pending} className="w-fit">
        <Send aria-hidden />
        {t("telegram.connect")}
      </Button>
      {opened && <p className="text-muted-foreground text-sm">{t("telegram.openBot")}</p>}
    </div>
  );
}
