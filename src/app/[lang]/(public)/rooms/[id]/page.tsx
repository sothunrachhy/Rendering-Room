import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Check,
  Clock,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RoomLocationMap } from "@/components/map/maps";
import { photoUrl } from "@/components/rooms/room-photo";
import { SiteFooter } from "@/components/app-shell/site-footer";
import { CostBreakdown } from "@/components/rooms/cost-breakdown";
import { PhotoGallery } from "@/components/rooms/photo-gallery";
import { ReportDialog } from "@/components/rooms/report-dialog";
import { ReviewForm } from "@/components/rooms/review-form";
import { SaveButton } from "@/components/rooms/save-button";
import { RatingSummary, Stars } from "@/components/rooms/stars";
import { ViewingRequestForm } from "@/components/rooms/viewing-request-form";
import { MarketingBackground } from "@/components/landing/marketing-background";
import { SiteHeader } from "@/components/app-shell/site-header";
import { VerifyEmailBanner } from "@/components/app-shell/verify-email-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { languageAlternates, type Locale, localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import type { Translator } from "@/i18n/translator";
import { type CurrentUser, getOptionalUser } from "@/server/auth";
import { formatPrice } from "@/lib/money";
import { haversineKm } from "@/lib/ranking";
import {
  formatDistance,
  parseSearchFilters,
  SEARCH_DEFAULTS,
  searchQuery,
  textLanguage,
} from "@/lib/rooms";
import {
  formatDate,
  formatDateTime,
  MAX_VIEWING_DAYS_AHEAD,
  nextQuarterHour,
  toPhnomPenhInput,
} from "@/lib/time";
import { idSchema } from "@/lib/validation";
import {
  getCampuses,
  getRoomDetail,
  getStudentRoomState,
  type RoomDetail,
} from "@/server/queries/rooms";

// The tab title and the preview Telegram/Facebook show when a room link is shared:
// title, price, area and the cover photo. Only for rooms everyone may see.
export async function generateMetadata({
  params,
}: PageProps<"/[lang]/rooms/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { locale, t } = await getI18n();
  const room = idSchema.safeParse(id).success ? await getRoomDetail(id) : null;
  if (!room || room.hidden || room.landlord.verification !== "VERIFIED") return {};

  const description = t("meta.roomDescription", {
    price: formatPrice(room.rentCents, locale),
    type: t(`roomTypes.${room.type}`),
    district: room.district,
  });
  const cover = room.photos[0];
  return {
    title: room.title,
    description,
    alternates: languageAlternates(locale, `/rooms/${room.id}`),
    openGraph: {
      title: room.title,
      description,
      ...(cover && { images: [{ url: photoUrl(cover.id), width: 800, height: 600 }] }),
    },
  };
}

export default function RoomPage(props: PageProps<"/[lang]/rooms/[id]">) {
  return (
    <div className="marketing-backdrop flex min-h-svh flex-col">
      <MarketingBackground fixed />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Suspense fallback={<RoomSkeleton />}>
          <Room {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

async function Room({ params, searchParams }: PageProps<"/[lang]/rooms/[id]">) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const [room, user, campuses, { locale, t }] = await Promise.all([
    getRoomDetail(id),
    getOptionalUser(),
    getCampuses(),
    getI18n(),
  ]);
  if (!room) notFound();

  const isOwner = user?.id === room.landlordId;
  const isAdmin = user?.role === "ADMIN";
  const visible = !room.hidden && room.landlord.verification === "VERIFIED";
  // Hidden rooms and rooms of unverified landlords exist only for their owner and admins
  if (!visible && !isOwner && !isAdmin) notFound();

  const filters = parseSearchFilters(await searchParams);
  // An unknown campus code falls back to the default (as on the search page)
  const campus =
    campuses.find((c) => c.slug === filters.campus) ??
    campuses.find((c) => c.slug === SEARCH_DEFAULTS.campus) ??
    campuses[0] ??
    null;
  const distanceKm = campus ? haversineKm(campus, room) : null;
  const studentState =
    user?.role === "STUDENT" ? await getStudentRoomState(user.id, room.id) : null;
  const campusName = campus ? (locale === "km" ? campus.nameKm : campus.name) : "";

  return (
    <div className="grid gap-6">
      <Link
        href={`${localePath(locale, "/rooms")}${searchQuery({ campus: campus?.slug })}`}
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("room.backToResults")}
      </Link>

      {!visible && (
        <p className="bg-muted rounded-lg px-3 py-2 text-sm">
          {room.hidden ? t("room.hidden") : t("room.notVisible")}
        </p>
      )}

      <PhotoGallery photoIds={room.photos.map((p) => p.id)} title={room.title} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-8">
          <section className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{t(`roomTypes.${room.type}`)}</Badge>
              <Badge variant="outline">{t(`genders.${room.gender}`)}</Badge>
              <Badge variant={room.status === "AVAILABLE" ? "default" : "secondary"}>
                {room.status === "AVAILABLE" ? t("room.available") : t("room.rented")}
              </Badge>
            </div>
            <h1
              lang={textLanguage(room.title)}
              className="text-3xl font-bold tracking-tight text-balance"
            >
              {room.title}
            </h1>
            <p className="text-muted-foreground flex items-start gap-1.5">
              <MapPin className="mt-1 size-4 shrink-0" aria-hidden />
              {room.address}, {room.district}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <RatingSummary
                rating={room.avgRating}
                label={
                  room.reviews.length > 0
                    ? t("room.reviewCount", { count: room.reviews.length })
                    : t("room.noReviews")
                }
              />
              {distanceKm !== null && campus && (
                <span className="font-medium">
                  {t("room.away", {
                    distance: formatDistance(distanceKm, locale),
                    campus: campus.shortName,
                  })}
                </span>
              )}
            </div>
          </section>

          <section className="grid gap-2">
            <h2 className="text-lg font-semibold">{t("room.description")}</h2>
            <p lang={textLanguage(room.description)} className="text-pretty whitespace-pre-line">
              {room.description}
            </p>
            {/* The landlord's own words can't be translated for them (QA U-10) */}
            {locale === "km" && textLanguage(room.description) === "en" && (
              <p className="text-muted-foreground text-xs">{t("room.contentLanguage")}</p>
            )}
          </section>

          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">{t("room.details")}</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Detail icon={Users} label={t("room.occupants")} value={String(room.maxOccupants)} />
              {room.sizeSqm && (
                <Detail
                  icon={Ruler}
                  label={t("room.size")}
                  value={t("room.sizeValue", { size: room.sizeSqm })}
                />
              )}
              <Detail icon={MapPin} label={t("room.district")} value={room.district} />
            </dl>
            <h3 className="mt-2 font-medium">{t("room.facilities")}</h3>
            {room.facilities.length > 0 ? (
              <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {room.facilities.map((facility) => (
                  <li key={facility} className="flex items-center gap-2">
                    <Check className="text-primary size-4" aria-hidden />
                    {t(`facilities.${facility as "wifi"}`)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">{t("room.noFacilities")}</p>
            )}
          </section>

          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">{t("room.location")}</h2>
            {campus && distanceKm !== null && (
              <p className="text-sm">
                {t("room.distanceTo")} {campusName}:{" "}
                <strong>{formatDistance(distanceKm, locale)}</strong>
                <span className="text-muted-foreground block text-xs">
                  {t("room.distanceNote")}
                </span>
              </p>
            )}
            <RoomLocationMap
              room={{ lat: room.lat, lng: room.lng }}
              campus={campus ? { lat: campus.lat, lng: campus.lng } : null}
              campusName={campusName}
              className="glass h-80 w-full rounded-2xl border"
            />
          </section>

          <Reviews room={room} user={user} studentState={studentState} t={t} locale={locale} />
        </div>

        {/* self-start: a grid item stretches to the row, which would stop sticky working */}
        <aside className="grid content-start gap-4 self-start lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <p className="text-primary text-3xl font-bold tracking-tight">
                {formatPrice(room.rentCents, locale)}
                <span className="text-muted-foreground ml-1 text-sm font-medium">
                  {t("room.perMonth")}
                </span>
              </p>
              <CardTitle className="text-muted-foreground text-sm font-normal">
                {t("costs.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CostBreakdown room={room} t={t} locale={locale} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <StudentActions
                room={room}
                user={user}
                studentState={studentState}
                isOwner={isOwner}
                t={t}
                locale={locale}
              />
            </CardContent>
          </Card>

          <LandlordCard
            room={room}
            canSeePhone={Boolean(studentState?.hasAcceptedViewing) || isOwner || isAdmin}
            t={t}
            locale={locale}
          />

          {user && !isOwner && (
            <div className="flex justify-center">
              <ReportDialog roomId={room.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

type StudentState = Awaited<ReturnType<typeof getStudentRoomState>> | null;

function StudentActions({
  room,
  user,
  studentState,
  isOwner,
  t,
  locale,
}: {
  room: RoomDetail;
  user: CurrentUser | null;
  studentState: StudentState;
  isOwner: boolean;
  t: Translator;
  locale: Locale;
}) {
  if (isOwner) {
    return (
      <>
        <p className="text-sm">{t("room.ownListing")}</p>
        <Link
          href={localePath(locale, `/listings/${room.id}`)}
          className={buttonVariants({ variant: "outline" })}
        >
          <Pencil aria-hidden />
          {t("room.editListing")}
        </Link>
      </>
    );
  }

  if (!user || !studentState) {
    // Signed out, or a landlord/admin looking around
    if (user) return <p className="text-muted-foreground text-sm">{t("room.loginToAct")}</p>;
    const next = encodeURIComponent(localePath(locale, `/rooms/${room.id}`));
    return (
      <>
        <p className="text-muted-foreground text-sm">{t("room.loginToAct")}</p>
        <Link href={`${localePath(locale, "/login")}?next=${next}`} className={buttonVariants()}>
          {t("room.loginButton")}
        </Link>
      </>
    );
  }

  const latest = studentState.latestRequest;
  const now = new Date();
  const max = new Date(now.getTime() + MAX_VIEWING_DAYS_AHEAD * 24 * 60 * 60 * 1000);

  return (
    <>
      <SaveButton roomId={room.id} saved={studentState.saved} className="w-full" />
      {latest?.status === "PENDING" || latest?.status === "ACCEPTED" ? (
        <div className="bg-muted grid gap-2 rounded-lg p-3 text-sm">
          <p className="flex items-start gap-2">
            {latest.status === "PENDING" ? (
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <CalendarCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            {t(latest.status === "PENDING" ? "viewing.pending" : "viewing.accepted", {
              date: formatDateTime(latest.preferredAt, locale),
            })}
          </p>
          <Link
            href={localePath(locale, "/requests")}
            className="font-medium underline-offset-4 hover:underline"
          >
            {t("viewing.seeRequests")}
          </Link>
        </div>
      ) : room.status === "AVAILABLE" && !user.emailVerified ? (
        <div className="grid gap-2">
          <h2 className="font-semibold">{t("viewing.title")}</h2>
          <VerifyEmailBanner />
        </div>
      ) : room.status === "AVAILABLE" ? (
        <div className="grid gap-2">
          <h2 className="font-semibold">{t("viewing.title")}</h2>
          <p className="text-muted-foreground text-sm">{t("viewing.description")}</p>
          <ViewingRequestForm
            roomId={room.id}
            // On the quarter hour, matching the picker's 15-minute steps
            minDateTime={toPhnomPenhInput(nextQuarterHour(now))}
            maxDateTime={toPhnomPenhInput(max)}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("messages.roomNotAvailable")}</p>
      )}
    </>
  );
}

function LandlordCard({
  room,
  canSeePhone,
  t,
  locale,
}: {
  room: RoomDetail;
  canSeePhone: boolean;
  t: Translator;
  locale: Locale;
}) {
  const { landlord } = room;
  return (
    <Card size="sm">
      <CardContent className="grid gap-2 text-sm">
        <p className="text-muted-foreground text-sm">{t("room.landlord")}</p>
        <p className="font-medium">{landlord.name}</p>
        {landlord.verification === "VERIFIED" && (
          <p className="text-primary flex items-center gap-1.5 font-medium">
            <BadgeCheck className="size-4" aria-hidden />
            {t("room.verified")}
          </p>
        )}
        <p className="text-muted-foreground">
          {t("room.landlordSince", { date: formatDate(landlord.createdAt, locale) })}
        </p>
        {canSeePhone && landlord.phone ? (
          <a href={`tel:${landlord.phone}`} className="flex items-center gap-1.5 font-medium">
            <Phone className="size-4" aria-hidden />
            {landlord.phone}
          </a>
        ) : (
          <p className="text-muted-foreground text-xs">{t("room.phoneHidden")}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Reviews({
  room,
  user,
  studentState,
  t,
  locale,
}: {
  room: RoomDetail;
  user: CurrentUser | null;
  studentState: StudentState;
  t: Translator;
  locale: Locale;
}) {
  const own = user ? room.reviews.find((review) => review.studentId === user.id) : undefined;

  return (
    <section className="grid gap-4" id="reviews">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold">{t("reviews.title")}</h2>
        {room.avgRating !== null && (
          <span className="flex items-center gap-2 text-sm">
            <Stars rating={room.avgRating} />
            {t("reviews.average", { rating: room.avgRating.toFixed(1) })}
          </span>
        )}
      </div>

      {room.reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("reviews.none")}</p>
      ) : (
        <ul className="grid gap-3">
          {room.reviews.map((review) => (
            <li key={review.id} className="glass grid gap-1 rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{review.studentName}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(review.createdAt, locale)}
                </span>
              </div>
              <span className="flex items-center gap-2">
                <Stars rating={review.rating} />
                <span className="sr-only">{t("reviews.stars", { count: review.rating })}</span>
              </span>
              {review.comment && (
                <p lang={textLanguage(review.comment)} className="text-sm whitespace-pre-line">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {studentState &&
        (studentState.hasAcceptedViewing ? (
          <div className="glass grid gap-3 rounded-2xl border p-4">
            <h3 className="font-medium">{own ? t("reviews.edit") : t("reviews.write")}</h3>
            <ReviewForm roomId={room.id} existing={own} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("reviews.rule")}</p>
        ))}
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="glass grid gap-0.5 rounded-xl border p-3">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function RoomSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
