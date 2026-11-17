import {
  Bath,
  BedDouble,
  CalendarDays,
  Camera,
  ChevronRight,
  CircleCheck,
  Footprints,
  MapPin,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import angkorGold from "@/assets/decorations/angkor-gold.png";
import cloud from "@/assets/decorations/cloud.png";
import khmerCorner from "@/assets/decorations/khmer-corner.png";
import { HeartButton } from "@/components/rooms/heart-button";
import { RoomPhoto } from "@/components/rooms/room-photo";
import type { Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/translator";
import { withLinks } from "@/i18n/with-links";
import { formatPrice } from "@/lib/money";
import { textLanguage } from "@/lib/rooms";
import type { RankedRoom } from "@/server/queries/rooms";

/**
 * A home page "Top rooms" card in the Khmer style: navy and gold, an Angkor Wat
 * silhouette on the photo's corner and a gold corner ornament under the details.
 * The whole card opens the room; the button goes straight to its viewing request.
 */
export function TopRoomCard({
  room,
  campusName,
  href,
  heart,
  t,
  locale,
}: {
  room: RankedRoom;
  campusName: string;
  /** The room page, with the search's query string */
  href: string;
  /** The save button, or null for landlords and admins (they can't save rooms) */
  heart: { saved: boolean | null; loginHref: string } | null;
  t: Translator;
  locale: Locale;
}) {
  // About 80 m a minute on foot, the same estimate as the room page
  const minutes = Math.max(1, Math.round((room.distanceKm * 1000) / 80));
  const amenities: { icon: typeof Wifi; label: string }[] = [
    { icon: BedDouble, label: t(`roomTypes.${room.type}`) },
    {
      icon: Bath,
      label: room.facilities.includes("privateBathroom")
        ? t("landing.topRooms.privateBath")
        : t("landing.topRooms.sharedBath"),
    },
  ];
  if (room.facilities.includes("wifi")) {
    amenities.push({ icon: Wifi, label: t("landing.topRooms.wifi") });
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[22px] border border-[#edf0f5] bg-white shadow-[0_10px_30px_rgb(16_45_104/0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(16_45_104/0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/30">
      <div className="relative aspect-[4/3] overflow-hidden">
        <RoomPhoto
          photoId={room.coverPhotoId}
          alt={t("room.photoAlt", { number: 1, title: room.title })}
          placeholderLabel={t("room.noPhotos")}
          className="size-full transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        />

        {/* A navy ribbon across the photo's bottom-right: its gold edge is an S-curve that
            swells up in the middle, then sweeps to the top right. Its foot hides under the
            details panel's rounded top */}
        <svg
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute right-0 bottom-0 h-[36%] w-[62%]"
          aria-hidden
        >
          <path d="M0 100 C 30 97 52 44 100 38 C 148 32 180 20 200 2 V 100 Z" fill="#0f2d68" />
          <path
            d="M0 100 C 30 97 52 44 100 38 C 148 32 180 20 200 2"
            fill="none"
            stroke="#d6ad60"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Swirly clouds behind the temple (drawn before it, so the gold covers them) */}
        <Cloud className="right-[27%] bottom-2.5 w-12" />
        <Cloud className="right-0 bottom-[17%] w-11 -scale-x-100" />
        <Image
          src={angkorGold}
          alt=""
          sizes="112px"
          className="pointer-events-none absolute right-[7%] bottom-4 h-auto w-[20%] max-w-20"
        />
        {/* The details panel's wavy white top: rounded at the left, a gentle rise, then
            dipping under the navy toward the right */}
        <svg
          viewBox="0 0 400 32"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 -bottom-px h-8 w-full"
          aria-hidden
        >
          <path
            d="M0 32 V 19 Q 0 9 11 8 C 70 2 125 1 175 6 C 235 12 290 22 345 23 L 386 23 Q 400 23 400 32 Z"
            className="fill-white dark:fill-slate-900"
          />
        </svg>

        <span className="absolute top-3 left-3 flex max-w-[calc(100%-4.5rem)] items-center gap-2 rounded-2xl bg-[#0f2d68] px-3.5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-blue-950/30">
          <Footprints className="size-4 shrink-0" aria-hidden />
          {/* Wraps onto a second line on narrow cards, so the campus stays visible */}
          <span className="line-clamp-2 leading-tight">
            {withLinks(t("landing.topRooms.walk", { minutes }), {
              campus: <span className="text-[#f0cd84]">{campusName}</span>,
            })}
          </span>
        </span>

        {heart && (
          <HeartButton
            roomId={room.id}
            saved={heart.saved}
            loginHref={heart.loginHref}
            className="absolute! top-3 right-3 size-11 text-rose-500 shadow-lg hover:text-rose-600"
            iconClassName="size-6"
          />
        )}

        {room.photoCount > 0 && (
          <span className="absolute bottom-8 left-3 flex items-center gap-1.5 rounded-full bg-slate-950/55 px-3.5 py-1.5 text-base font-semibold text-white backdrop-blur-sm">
            <Camera className="size-5" aria-hidden />
            <span aria-hidden>{room.photoCount}</span>
            <span className="sr-only">
              {t("landing.topRooms.photos", { count: room.photoCount })}
            </span>
          </span>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-2.5 bg-linear-to-b from-white from-55% to-[#fbf4e4] p-4 pt-2 dark:from-slate-900 dark:to-[#1b2132]">
        {/* Khmer ornaments, faint, behind the text */}
        <Image
          src={khmerCorner}
          alt=""
          sizes="96px"
          className="pointer-events-none absolute bottom-0 left-0 h-auto w-28 opacity-40 dark:opacity-25"
        />
        <Image
          src={angkorGold}
          alt=""
          sizes="160px"
          className="pointer-events-none absolute bottom-0 left-1/2 h-auto w-44 -translate-x-1/2 opacity-15 dark:opacity-10"
        />

        <div className="relative grid gap-1">
          <h3
            lang={textLanguage(room.title)}
            className="truncate text-xl font-bold text-[#0f2d68] dark:text-white"
          >
            {/* The whole card opens the room */}
            <Link href={href} className="after:absolute after:inset-0">
              {room.title}
            </Link>
          </h3>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <MapPin className="size-[18px] shrink-0 text-[#0f2d68] dark:text-sky-300" aria-hidden />
            <span className="truncate">
              {t("landing.topRooms.inCity", { district: room.district })}
            </span>
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <p className="font-extrabold whitespace-nowrap text-[#0f2d68] dark:text-sky-300">
            <span className="text-[28px] leading-none tracking-tight">
              {formatPrice(room.rentCents, locale)}
            </span>
            <span className="text-muted-foreground ml-1 text-sm font-medium">
              {t("room.perMonth")}
            </span>
          </p>
          <span aria-hidden className="h-6 w-px bg-slate-200 dark:bg-white/15" />
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[13px] font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-300">
            <CircleCheck
              className="size-[18px] fill-green-600 text-white dark:fill-green-500 dark:text-slate-900"
              aria-hidden
            />
            {t("room.available")}
          </span>
        </div>

        <ul
          className="relative grid divide-x divide-[#d5deee] rounded-2xl bg-[#eef3fb] py-3 dark:divide-white/10 dark:bg-white/5"
          style={{ gridTemplateColumns: `repeat(${amenities.length}, minmax(0, 1fr))` }}
        >
          {amenities.map(({ icon: Icon, label }) => (
            <Amenity key={label} icon={<Icon className="size-6" aria-hidden />} label={label} />
          ))}
        </ul>

        {/* Above the card-wide link, so it opens the viewing request directly */}
        <Link
          href={`${href}#viewing`}
          className="relative z-10 mt-auto flex h-12 items-center gap-2.5 rounded-full bg-linear-to-br from-[#1646a0] to-[#0f2d68] pr-1.5 pl-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 dark:from-sky-500 dark:to-blue-700"
        >
          <CalendarDays className="size-5 shrink-0" aria-hidden />
          <span className="flex-1 truncate">{t("viewing.title")}</span>
          {/* Narrowest cards (1024-1279px): no room for the arrow beside the Khmer text */}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 lg:max-xl:hidden">
            <ChevronRight className="size-5" aria-hidden />
          </span>
        </Link>
      </div>
    </article>
  );
}

function Amenity({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-1.5 px-1 text-center text-sm leading-tight font-medium text-[#1e3a8a] dark:text-slate-200">
      <span className="text-[#0f2d68] dark:text-sky-300">{icon}</span>
      {label}
    </li>
  );
}

/** A swirly cloud (light blue, its swirl lines see-through to the navy behind). */
function Cloud({ className }: { className: string }) {
  return (
    <Image
      src={cloud}
      alt=""
      sizes="48px"
      className={`pointer-events-none absolute h-auto ${className}`}
    />
  );
}
