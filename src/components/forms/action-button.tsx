"use client";

import { Loader2 } from "lucide-react";
import { type ComponentProps, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/actions/types";

/**
 * A button that runs a Server Action and shows its result as a toast. Pass the action
 * with its arguments already bound on the server, e.g. `setRoomHidden.bind(null, id, true)`.
 */
export function ActionButton({
  action,
  children,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "action"> & {
  action: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      {...props}
      disabled={pending || disabled}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}
