import { House } from "lucide-react";
import { cn } from "@/lib/utils";

/** URL of a stored room photo (served by app/api/photos/[id]). */
export function photoUrl(id: string): string {
  return `/api/photos/${id}`;
}

/**
 * A room photo, or a calm placeholder when the landlord hasn't added any. Photos come
 * from our own database at their final size, so a plain <img> is enough.
 */
export function RoomPhoto({
  photoId,
  alt,
  className,
  placeholderLabel,
  eager = false,
}: {
  photoId: string | null;
  alt: string;
  className?: string;
  placeholderLabel?: string;
  eager?: boolean;
}) {
  if (!photoId) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex flex-col items-center justify-center gap-1 bg-linear-to-br from-sky-100 to-amber-50 dark:from-slate-800 dark:to-slate-900",
          className,
        )}
      >
        <House className="size-8 opacity-50" aria-hidden />
        {placeholderLabel && <span className="text-xs">{placeholderLabel}</span>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- served from our own DB, already sized
    <img
      src={photoUrl(photoId)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("bg-muted object-cover", className)}
    />
  );
}
