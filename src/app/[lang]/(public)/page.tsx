import { ArrowRight, Bath, BedDouble, Footprints, GraduationCap, Wifi } from "lucide-react";
import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, Suspense } from "react";
import angkorWat from "@/assets/angkor-wat.jpg";
import heroImage from "@/assets/hero-students.jpg";
import { FloatingContact } from "@/components/landing/floating-contact";
import { HeroSearch } from "@/components/landing/hero-search";
import { UniversityStrip } from "@/components/landing/university-strip";
import { HeartButton } from "@/components/rooms/heart-button";
import { RoomPhoto } from "@/components/rooms/room-photo";
import { SiteFooter } from "@/components/app-shell/site-footer";
import { SiteHeader } from "@/components/app-shell/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { languageAlternates, localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { withLinks } from "@/i18n/with-links";
import { getOptionalUser } from "@/server/auth";
import { formatPrice } from "@/lib/money";
import { parseSearchFilters, SEARCH_DEFAULTS, searchQuery, textLanguage } from "@/lib/rooms";
import { cn } from "@/lib/utils";
import { getCampuses, getSavedRoomIds, searchRooms } from "@/server/queries/rooms";

// The handwritten note on the hero photo: English in both languages (not translated)
const handwriting = Caveat({ subsets: ["latin"], weight: "700", display: "swap" });
const HANDWRITTEN_NOTE = "Your room, near your uni";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { alternates: languageAlternates(locale, "/") };
}

// Soft edges for photos (CSS masks: opaque = visible)
const fadeLeftAndBottom: CSSProperties = {
  maskImage:
    "linear-gradient(to right, transparent, black 14%), linear-gradient(to top, transparent, black 22%)",
  maskComposite: "intersect",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 14%), linear-gradient(to top, transparent, black 22%)",
  WebkitMaskComposite: "source-in",
};
const fadeTopAndBottom: CSSProperties = {
  maskImage: "linear-gradient(to bottom, transparent, black 18%, black 70%, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, transparent, black 18%, black 70%, transparent)",
};
const fadeUp: CSSProperties = {
  maskImage: "linear-gradient(to top, black 45%, transparent)",
  WebkitMaskImage: "linear-gradient(to top, black 45%, transparent)",
};

export default async function Home() {
  const { locale, t } = await getI18n();
  const highlight = t("landing.titleHighlight");
  const underlined = t("landing.titleUnderlined");
  const lead = highlight.endsWith(underlined) ? highlight.slice(0, -underlined.length) : "";

  return (
    <div className="dark:to-background relative flex min-h-svh flex-col overflow-x-clip bg-linear-to-b from-sky-100 via-sky-50 to-white dark:from-slate-950 dark:via-slate-900">
      <PageWaves />
      <SiteHeader />

      {/* Hero: words and search on the left; students in Phnom Penh on the right */}
      <section className="relative -mt-20 pt-20">
        {/* Desktop: one picture on the right ~3/4 of the hero, so the students sit beside
            the words rather than under them. Its left side is a soft blue fade already;
            the mask also softens the container's left and bottom edges */}
        <div
          className="absolute inset-y-0 right-0 hidden w-[68%] overflow-hidden lg:block xl:w-[78%]"
          style={fadeLeftAndBottom}
        >
          <Image
            src={heroImage}
            alt={t("landing.photoAlt")}
            fill
            priority
            placeholder="blur"
            sizes="78vw"
            className="object-cover object-[70%_70%]"
          />
        </div>
        {/* The handwritten slogan stays in English on every page, like a brand tagline */}
        <p
          lang="en"
          className={cn(
            handwriting.className,
            "absolute top-[15%] left-[54%] hidden -rotate-6 text-4xl leading-none text-[#0b2a5b] drop-shadow-[0_1px_8px_rgb(255_255_255/0.9)] lg:block xl:text-5xl",
          )}
        >
          {HANDWRITTEN_NOTE}
          <HandUnderline className="text-primary mt-1 h-3 w-full" />
        </p>

        <div className="relative mx-auto w-full max-w-7xl px-4 pt-8 pb-24 lg:pt-14 lg:pb-32">
          {/* Narrower beside the picture on small laptops, so long Khmer lines stay clear of it (QA 3 #3) */}
          <div className="flex flex-col gap-5 lg:max-w-[46%] xl:max-w-[50%]">
            <h1 className="font-bold tracking-tight text-balance">
              <span className="block text-3xl leading-[1.3] text-[#0b2a5b] sm:text-5xl dark:text-white">
                {t("landing.titleStart")}
              </span>
              <span className="text-primary block text-4xl leading-[1.3] sm:text-6xl lg:text-5xl xl:text-6xl dark:text-sky-300">
                {lead}
                <span className="relative inline-block whitespace-nowrap">
                  {underlined}
                  <BrushUnderline className="absolute -bottom-1 left-[2%] h-4 w-[96%] text-amber-400" />
                </span>
              </span>
            </h1>
            <p className="max-w-xl text-lg text-pretty text-slate-600 sm:text-xl dark:text-slate-300">
              {t("landing.subtitle")}
            </p>
            <div
              id="hero-search"
              className="relative rounded-3xl bg-white p-2.5 shadow-xl shadow-blue-950/10 dark:bg-slate-900 dark:shadow-black/40"
            >
              <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
                <HeroSearchLoader />
              </Suspense>
            </div>
            {/* Phones and tablets: the picture as its own block under the search, so the
                search stays in the first screen (QA 3), cropped to the students and monument */}
            <div
              aria-hidden
              className="relative -mx-4 aspect-[4/3] sm:mx-0 sm:aspect-[16/9] sm:overflow-hidden sm:rounded-3xl lg:hidden"
              style={fadeTopAndBottom}
            >
              <Image
                src={heroImage}
                alt=""
                fill
                sizes="(min-width: 640px) 90vw, 100vw"
                className="object-cover object-[82%_60%]"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 pb-16">
        <Suspense fallback={<Skeleton className="relative z-10 -mt-14 h-24 rounded-full" />}>
          <Universities />
        </Suspense>

        <Suspense fallback={<Skeleton className="mt-14 h-80 rounded-3xl" />}>
          <TopRooms />
        </Suspense>
      </main>

      {/* How to reach a person: the contact section of About */}
      <FloatingContact
        href={`${localePath(locale, "/about")}#contact`}
        label={t("landing.contact")}
        watchId="hero-search"
      />

      <SiteFooter />
    </div>
  );
}

async function HeroSearchLoader() {
  const campuses = await getCampuses();
  return <HeroSearch campuses={campuses} />;
}

// Shown first on the home page; the other campuses follow in A–Z order
const FEATURED_CAMPUSES = ["rupp", "itc", "num", "rule"];

/** The campuses we know, as quick links to a search near each one. */
async function Universities() {
  const campuses = await getCampuses();
  if (campuses.length === 0) return null;

  const rank = (slug: string) => {
    const index = FEATURED_CAMPUSES.indexOf(slug);
    return index === -1 ? FEATURED_CAMPUSES.length : index;
  };
  // getCampuses is already A–Z, and sort() keeps that order within each rank
  const ordered = [...campuses].sort((a, b) => rank(a.slug) - rank(b.slug));
  return <UniversityStrip campuses={ordered} />;
}

// The home search's default budget, so the cards and "View more" match it (QA 3 #11)
const TOP_ROOMS_BUDGET = 300;

/** The three best matches near the default campus, from the same search as /rooms. */
async function TopRooms() {
  const [{ locale, t }, campuses, user] = await Promise.all([
    getI18n(),
    getCampuses(),
    getOptionalUser(),
  ]);
  const campus = campuses.find((c) => c.slug === SEARCH_DEFAULTS.campus);
  if (!campus) return null;

  // Same search as "View more", so the cards are its first results
  const filters = parseSearchFilters({ campus: campus.slug, budget: String(TOP_ROOMS_BUDGET) });
  const rooms = (await searchRooms(filters, campus)).slice(0, 3);
  const query = searchQuery({ campus: campus.slug, budget: TOP_ROOMS_BUDGET });
  const moreHref = localePath(locale, `/rooms${query}`);
  const savedIds =
    user?.role === "STUDENT"
      ? await getSavedRoomIds(
          user.id,
          rooms.map((room) => room.id),
        )
      : null;

  return (
    <section
      aria-labelledby="top-rooms-title"
      className="mt-16 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[minmax(0,0.9fr)_repeat(3,minmax(0,1fr))_minmax(0,0.85fr)]"
    >
      <div className="flex flex-col items-start gap-3 sm:col-span-2 md:col-span-3 lg:col-span-1 lg:py-2">
        <h2
          id="top-rooms-title"
          className="text-3xl leading-[1.25] font-bold text-[#0b2a5b] lg:text-3xl dark:text-white"
        >
          {withLinks(t("landing.topRooms.title"), {
            br: <br />,
            campus: (
              <span className="text-primary relative inline-block dark:text-sky-300">
                {campus.shortName}
                <Swoosh className="absolute -bottom-2.5 left-0 h-3 w-full text-blue-500" />
              </span>
            ),
          })}
        </h2>
        <p className="text-muted-foreground mt-1">{t("landing.topRooms.text")}</p>
        <Link
          href={moreHref}
          // cn(): the bright blue must replace the button's default colour, not compete with it
          className={cn(
            buttonVariants(),
            "bg-primary hover:bg-primary/90 mt-1 h-11 px-5 font-semibold text-white shadow-md shadow-blue-700/25 dark:bg-sky-400 dark:text-slate-950",
          )}
        >
          {t("landing.topRooms.viewMore")}
          <ArrowRight aria-hidden />
        </Link>
        <Link
          href={`${localePath(locale, "/register")}?role=LANDLORD`}
          className="text-primary mt-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          {t("landing.forLandlords")} {t("landing.forLandlordsCta")}
        </Link>
      </div>

      {rooms.map((room) => {
        const minutes = Math.max(1, Math.round((room.distanceKm * 1000) / 80));
        const privateBath = room.facilities.includes("privateBathroom");
        const roomHref = localePath(locale, `/rooms/${room.id}${query}`);
        return (
          <article
            key={room.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 shadow-blue-950/5 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-xl motion-reduce:hover:translate-y-0 dark:bg-slate-900 dark:ring-white/10"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <RoomPhoto
                photoId={room.coverPhotoId}
                alt={t("room.photoAlt", { number: 1, title: room.title })}
                placeholderLabel={t("room.noPhotos")}
                className="size-full transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="bg-primary absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                <Footprints className="size-3.5" aria-hidden />
                {t("landing.topRooms.walk", { minutes, campus: campus.shortName })}
              </span>
              {/* Landlords and admins can't save rooms: no heart for them */}
              {(user === null || savedIds) && (
                <HeartButton
                  roomId={room.id}
                  saved={savedIds ? savedIds.has(room.id) : null}
                  loginHref={`${localePath(locale, "/login")}?next=${encodeURIComponent(roomHref)}`}
                  className="absolute! top-2.5 right-2.5"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3.5">
              <h3 lang={textLanguage(room.title)} className="truncate font-semibold">
                {/* The whole card opens the room */}
                <Link href={roomHref} className="after:absolute after:inset-0">
                  {room.title}
                </Link>
              </h3>
              {/* The page language's price format, as on every other page (QA-07) */}
              <p className="text-primary text-2xl font-bold dark:text-sky-300">
                {formatPrice(room.rentCents, locale)}
                <span className="text-muted-foreground ml-1 text-sm font-medium">
                  {t("room.perMonth")}
                </span>
              </p>
              {/* Wraps instead of clipping (QA 3 #8); sits at the card's bottom so cards line up */}
              <ul className="text-muted-foreground mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs">
                <li className="flex items-center gap-1 whitespace-nowrap">
                  <BedDouble className="text-primary size-4 dark:text-sky-300" aria-hidden />
                  {t(`roomTypes.${room.type}`)}
                </li>
                <li className="flex items-center gap-1 whitespace-nowrap">
                  <Bath className="text-primary size-4 dark:text-sky-300" aria-hidden />
                  {privateBath
                    ? t("landing.topRooms.privateBath")
                    : t("landing.topRooms.sharedBath")}
                </li>
                {room.facilities.includes("wifi") && (
                  <li className="flex items-center gap-1 whitespace-nowrap">
                    <Wifi className="text-primary size-4 dark:text-sky-300" aria-hidden />
                    {t("landing.topRooms.wifi")}
                  </li>
                )}
              </ul>
            </div>
          </article>
        );
      })}

      <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-linear-to-b from-blue-600 to-blue-800 px-5 pt-7 pb-20 text-center text-white shadow-lg shadow-blue-950/20 md:col-span-3 lg:col-span-1">
        <span className="flex size-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
          <GraduationCap className="size-7" aria-hidden />
        </span>
        <p className="text-lg leading-snug font-bold">{t("landing.cta.title")}</p>
        <Link
          href={moreHref}
          className="text-primary relative flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold whitespace-nowrap shadow-md transition hover:bg-sky-50"
        >
          {t("landing.cta.button")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        {/* A real photo of Angkor Wat at sunrise, fading up into the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
          style={fadeUp}
        >
          <Image
            src={angkorWat}
            alt=""
            fill
            sizes="260px"
            className="object-cover object-[50%_42%] opacity-90"
          />
        </div>
      </div>
    </section>
  );
}

/** Soft white waves across the page background. Decorative. */
function PageWaves() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[520px] h-72 w-full text-white/70 dark:text-white/[0.03]"
      >
        <path
          d="M0 120 C 240 40 480 40 720 110 S 1200 200 1440 90 L1440 320 L0 320 Z"
          fill="currentColor"
        />
      </svg>
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[470px] h-72 w-full text-sky-200/40 dark:text-sky-400/[0.04]"
      >
        <path
          d="M0 80 C 300 160 560 10 860 70 S 1260 160 1440 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[1040px] h-72 w-full text-sky-100/80 dark:text-white/[0.02]"
      >
        <path
          d="M0 160 C 360 60 720 240 1080 140 S 1440 120 1440 120 L1440 320 L0 320 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/** A short hand-drawn yellow stroke under the last word of the heading. */
function BrushUnderline({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 16" preserveAspectRatio="none" className={className}>
      <path
        d="M4 11 C 50 5, 110 4, 150 6 S 190 9, 196 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A quick pen line under the handwritten note. */
function HandUnderline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 14"
      preserveAspectRatio="none"
      className={cn("block", className)}
    >
      <path
        d="M3 9 C 60 3, 140 2, 217 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The blue swoosh under the campus name. */
function Swoosh({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 14" preserveAspectRatio="none" className={className}>
      <path
        d="M3 10 C 30 3, 80 1, 117 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
