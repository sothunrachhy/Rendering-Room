"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { RoomPhoto } from "@/components/rooms/room-photo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** The current photo large, with arrows and thumbnails to switch between them. */
export function PhotoGallery({ photoIds, title }: { photoIds: string[]; title: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  if (photoIds.length === 0) {
    return (
      <RoomPhoto
        photoId={null}
        alt=""
        placeholderLabel={t("room.noPhotos")}
        className="aspect-[3/1] w-full rounded-2xl shadow-lg shadow-slate-900/10"
      />
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + photoIds.length) % photoIds.length);

  return (
    <div className="grid gap-2">
      <div className="relative">
        <RoomPhoto
          photoId={photoIds[index]}
          alt={t("room.photoAlt", { number: index + 1, title })}
          eager
          className="aspect-video max-h-[34rem] w-full rounded-2xl shadow-lg shadow-slate-900/10"
        />
        {photoIds.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full opacity-90 shadow"
              onClick={() => go(-1)}
              aria-label={t("room.previousPhoto")}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full opacity-90 shadow"
              onClick={() => go(1)}
              aria-label={t("room.nextPhoto")}
            >
              <ChevronRight />
            </Button>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {index + 1} / {photoIds.length}
            </span>
          </>
        )}
      </div>
      {photoIds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photoIds.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={i === index}
              className={cn(
                "shrink-0 overflow-hidden rounded-lg ring-offset-2 transition",
                i === index ? "ring-primary ring-2" : "opacity-70 hover:opacity-100",
              )}
            >
              {/* The photo's description names the button (QA A-01) */}
              <RoomPhoto
                photoId={id}
                alt={t("room.photoAlt", { number: i + 1, title })}
                className="h-16 w-24"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
