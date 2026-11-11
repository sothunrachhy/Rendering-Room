import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five stars filled to the rating (rounded to the nearest half). Decorative: pair it with text. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={cn("inline-flex items-center", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((value) => {
        const fill = rounded >= value ? "full" : rounded >= value - 0.5 ? "half" : "empty";
        return (
          <span key={value} className="relative inline-block size-4">
            <Star className="text-muted-foreground/40 absolute inset-0 size-4" />
            {fill !== "empty" && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: fill === "half" ? "50%" : "100%" }}
              >
                <Star className="size-4 fill-amber-400 text-amber-500" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** "★ 4.5 (3 reviews)"-style compact rating used on cards. */
export function RatingSummary({
  rating,
  label,
  className,
}: {
  rating: number | null;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star
        className={cn(
          "size-4",
          rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/50",
        )}
        aria-hidden
      />
      {rating !== null && <span className="font-medium">{rating.toFixed(1)}</span>}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
