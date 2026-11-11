import { CalendarClock, EyeOff, House, ImageIcon, Pencil, Plus, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionButton } from "@/components/forms/action-button";
import { ConfirmDeleteButton } from "@/components/forms/confirm-delete-button";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { RoomPhoto } from "@/components/rooms/room-photo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { formatPrice } from "@/lib/money";
import { deleteRoom, setRoomStatus } from "@/server/actions/rooms";
import { getLandlordRooms } from "@/server/queries/rooms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("listings.title") };
}

export default async function ListingsPage() {
  const { locale, t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t("listings.title")}
        description={t("listings.description")}
        actions={
          <Link href={localePath(locale, "/listings/new")} className={buttonVariants()}>
            <Plus aria-hidden />
            {t("listings.add")}
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Listings />
      </Suspense>
    </>
  );
}

async function Listings() {
  const landlord = await requireRole("LANDLORD");
  const { locale, t } = await getI18n();
  const rooms = await getLandlordRooms(landlord.id);

  return (
    <div className="grid gap-4">
      {landlord.verification !== "VERIFIED" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t(`listings.notVisible.${landlord.verification}`)}
          </p>
          {landlord.verification !== "PENDING" && (
            <Link
              href={`${localePath(locale, "/settings")}#verification`}
              className={buttonVariants({ size: "sm" })}
            >
              {t("listings.verifyNow")}
            </Link>
          )}
        </div>
      )}

      {rooms.length === 0 ? (
        <EmptyState
          icon={House}
          title={t("listings.emptyTitle")}
          description={t("listings.emptyDescription")}
          action={
            <Link href={localePath(locale, "/listings/new")} className={buttonVariants()}>
              <Plus aria-hidden />
              {t("listings.add")}
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Card size="sm" className="flex-row items-stretch gap-0 p-0 py-0">
                <Link href={localePath(locale, `/rooms/${room.id}`)} className="shrink-0">
                  <RoomPhoto
                    photoId={room.coverPhotoId}
                    alt={t("room.photoAlt", { number: 1, title: room.title })}
                    className="h-full min-h-28 w-28 sm:w-40"
                  />
                </Link>
                <div className="grid flex-1 gap-2 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="grid gap-0.5">
                      <Link
                        href={localePath(locale, `/rooms/${room.id}`)}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {room.title}
                      </Link>
                      <span className="text-muted-foreground text-sm">
                        {formatPrice(room.rentCents, locale)}
                        {t("room.perMonth")} · {room.district}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={room.status === "AVAILABLE" ? "default" : "secondary"}>
                        {room.status === "AVAILABLE" ? t("room.available") : t("room.rented")}
                      </Badge>
                      {room.hidden && (
                        <Badge variant="destructive">
                          <EyeOff aria-hidden />
                          {t("listings.hiddenByAdmin")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="size-3.5" aria-hidden />
                      {t("listings.photos", { count: room.photoCount })}
                    </span>
                    {room.pendingRequests > 0 && (
                      <Link
                        href={localePath(locale, "/requests")}
                        className="text-primary flex items-center gap-1 font-medium"
                      >
                        <CalendarClock className="size-3.5" aria-hidden />
                        {t("listings.pendingRequests", { count: room.pendingRequests })}
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={localePath(locale, `/listings/${room.id}`)}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Pencil aria-hidden />
                      {t("common.edit")}
                    </Link>
                    <ActionButton
                      variant="outline"
                      size="sm"
                      action={setRoomStatus.bind(
                        null,
                        room.id,
                        room.status === "AVAILABLE" ? "RENTED" : "AVAILABLE",
                      )}
                    >
                      {room.status === "AVAILABLE"
                        ? t("listings.markRented")
                        : t("listings.markAvailable")}
                    </ActionButton>
                    <ConfirmDeleteButton
                      label={t("listings.deleteLabel", { title: room.title })}
                      title={t("listings.deleteTitle", { title: room.title })}
                      description={t("listings.deleteDescription")}
                      onConfirm={deleteRoom.bind(null, room.id)}
                    />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
