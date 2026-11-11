"use client";

import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { RoomPhoto } from "@/components/rooms/room-photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { shrinkImage } from "@/lib/image-resize";
import { MAX_PHOTOS_PER_ROOM } from "@/lib/rooms";
import { deletePhoto, makeCoverPhoto } from "@/server/actions/rooms";
import type { ActionResult } from "@/server/actions/types";

export function PhotoManager({ roomId, photoIds }: { roomId: string; photoIds: string[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const remaining = MAX_PHOTOS_PER_ROOM - photoIds.length;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.error(t("messages.tooManyPhotos", { max: MAX_PHOTOS_PER_ROOM }));
    }

    setProgress({ done: 0, total: selected.length });
    let uploaded = 0;
    // One at a time: each request stays small, and a failure doesn't lose the rest
    for (const file of selected) {
      const body = new FormData();
      body.append("photo", await shrinkImage(file), "photo.jpg");
      try {
        const response = await fetch(`/api/listings/${roomId}/photos`, { method: "POST", body });
        if (response.ok) uploaded++;
        else
          toast.error(
            ((await response.json()) as { error?: string }).error ?? t("messages.uploadFailed"),
          );
      } catch {
        toast.error(t("messages.uploadFailed"));
      }
      setProgress({ done: uploaded, total: selected.length });
    }

    setProgress(null);
    if (input.current) input.current.value = "";
    if (uploaded > 0) toast.success(t("messages.photoUploaded"));
    router.refresh();
  }

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-sm">
        {t("listingForm.photosHint", { max: MAX_PHOTOS_PER_ROOM })}
      </p>

      {photoIds.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photoIds.map((id, index) => (
            <li key={id} className="group relative overflow-hidden rounded-lg border">
              <RoomPhoto photoId={id} alt="" className="aspect-[4/3] w-full" />
              {index === 0 && (
                <Badge className="absolute top-2 left-2 shadow">{t("listingForm.cover")}</Badge>
              )}
              <div className="absolute right-2 bottom-2 flex gap-1">
                {index > 0 && (
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    disabled={pending}
                    title={t("listingForm.makeCover")}
                    aria-label={t("listingForm.makeCover")}
                    onClick={() => run(() => makeCoverPhoto(id))}
                  >
                    <Star />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="icon-sm"
                  disabled={pending}
                  title={t("listingForm.deletePhoto", { number: index + 1 })}
                  aria-label={t("listingForm.deletePhoto", { number: index + 1 })}
                  onClick={() => run(() => deletePhoto(id))}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        id="photo-upload"
        onChange={(event) => upload(event.target.files)}
        disabled={remaining <= 0 || progress !== null}
      />
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={remaining <= 0 || progress !== null}
        onClick={() => input.current?.click()}
      >
        {progress ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
        {progress
          ? t("listingForm.uploading", { done: progress.done, total: progress.total })
          : t("listingForm.addPhotos")}
      </Button>
    </div>
  );
}
