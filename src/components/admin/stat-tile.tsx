import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  footnote,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  footnote?: ReactNode;
  icon: ReactNode;
  /** Good/bad state of the value: green when positive, red when negative */
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-1">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          {label}
          {icon}
        </div>
        <p
          className={cn(
            "truncate text-xl font-semibold tracking-tight sm:text-2xl",
            tone === "positive" && "text-success",
            tone === "negative" && "text-destructive",
          )}
        >
          {value}
        </p>
        {footnote && <p className="text-muted-foreground text-xs">{footnote}</p>}
      </CardContent>
    </Card>
  );
}
