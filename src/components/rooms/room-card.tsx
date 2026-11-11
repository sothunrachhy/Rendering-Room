"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { RoomPhoto } from "@/components/rooms/room-photo";
import { RatingSummary } from "@/components/rooms/stars";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/client";
import { formatPrice } from "@/lib/money";
import { estimateMonthlyCost, formatDistance, textLanguage } from "@/lib/rooms";
import { cn } from "@/lib/utils";
import type { RoomCard as RoomCardData } from "@/server/queries/rooms";

type RoomCardProps = {
  room: RoomCardData & { distanceKm?: number; score?: number };
  /** Short campus name, shown with the distance */
  campusName?: string;
  /** Query string carried to the room page, so it can show the same campus */
  query?: string;
  active?: boolean;
  onHover?: (id: string | null) => void;
  /** Extra controls under the card (e.g. remove from saved) */
  footer?: React.ReactNode;
};

export function RoomCard({ room, campusName, query = "", active, onHover, footer }: RoomCardProps) {
  const { locale, t, path } = useI18n();
  const total = estimateMonthlyCost(room).total;

  return (
    <article
      className={cn(
        "glass group relative flex flex-col overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5 hover:shadow-xl motion-reduce:hover:translate-y-0",
        active && "ring-primary ring-2",
      )}
      onMouseEnter={() => onHover?.(room.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <RoomPhoto
          photoId={room.coverPhotoId}
          alt={t("room.photoAlt", { number: 1, title: room.title })}
          placeholderLabel={t("room.noPhotos")}
          className="size-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {room.score !== undefined && (
          <Badge className="absolute top-2 left-2 shadow-sm">
            {t("room.match", { percent: Math.round(room.score * 100) })}
          </Badge>
        )}
        {room.status === "RENTED" && (
          <Badge variant="secondary" className="absolute top-2 right-2 shadow-sm">
            {t("room.rented")}
          </Badge>
        )}
      </div>

      <div className="grid flex-1 gap-1.5 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-primary text-2xl font-bold tracking-tight">
            {formatPrice(room.rentCents, locale)}
            <span className="text-muted-foreground ml-1 text-sm font-medium">
              {t("room.perMonth")}
            </span>
          </p>
          <RatingSummary
            rating={room.avgRating}
            label={room.reviewCount > 0 ? `(${room.reviewCount})` : t("room.noReviews")}
            className="shrink-0 text-xs"
          />
        </div>
        {/* The real monthly cost, so a cheap rent with expensive bills doesn't mislead */}
        {total > room.rentCents ? (
          <p className="text-muted-foreground -mt-1 text-xs">
            {t("room.withBills", { amount: formatPrice(total, locale) })}
          </p>
        ) : (
          room.electricityCentsPerKwh === null &&
          room.waterCentsPerM3 === null && (
            <p className="text-muted-foreground -mt-1 text-xs">{t("room.billsIncluded")}</p>
          )
        )}
        <h3 className="line-clamp-2 font-medium">
          {/* The whole card is clickable through this link's ::after */}
          <Link
            href={`${path(`/rooms/${room.id}`)}${query}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            <span lang={textLanguage(room.title)}>{room.title}</span>
          </Link>
        </h3>
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {room.distanceKm !== undefined && campusName
              ? t("room.away", {
                  distance: formatDistance(room.distanceKm, locale),
                  campus: campusName,
                })
              : room.district}
          </span>
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          <Badge variant="outline">{t(`roomTypes.${room.type}`)}</Badge>
          {room.gender !== "ANY" && <Badge variant="outline">{t(`genders.${room.gender}`)}</Badge>}
        </div>
      </div>
      {footer && <div className="relative z-10 border-t p-2">{footer}</div>}
    </article>
  );
}
