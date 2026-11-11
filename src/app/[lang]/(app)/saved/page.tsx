import { Bookmark, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionButton } from "@/components/forms/action-button";
import { CampusCombobox } from "@/components/forms/campus-combobox";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { RoomCard } from "@/components/rooms/room-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { haversineKm } from "@/lib/ranking";
import { parseSearchFilters, SEARCH_DEFAULTS, searchQuery } from "@/lib/rooms";
import { toggleFavourite } from "@/server/actions/student";
import { getCampuses, getSavedRooms } from "@/server/queries/rooms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("saved.title") };
}

export default async function SavedPage({ searchParams }: PageProps<"/[lang]/saved">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t("saved.title")} description={t("saved.description")} />
      {/* searchParams is request data, so the list streams in behind a boundary */}
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <SavedRooms searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SavedRooms({ searchParams }: Pick<PageProps<"/[lang]/saved">, "searchParams">) {
  const student = await requireRole("STUDENT");
  const { locale, t } = await getI18n();
  const [rooms, campuses, params] = await Promise.all([
    getSavedRooms(student.id),
    getCampuses(),
    searchParams,
  ]);
  // Distances from the campus chosen here (?campus=), else the default one (QA-09)
  const { campus: slug } = parseSearchFilters(params);
  const campus =
    campuses.find((c) => c.slug === slug) ??
    campuses.find((c) => c.slug === SEARCH_DEFAULTS.campus) ??
    campuses[0];

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title={t("saved.emptyTitle")}
        description={t("saved.emptyDescription")}
        action={
          <Link href={localePath(locale, "/rooms")} className={buttonVariants()}>
            <Search aria-hidden />
            {t("saved.browse")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {campus && (
        <form
          method="get"
          className="flex flex-wrap items-end gap-2"
          aria-label={t("saved.distanceFrom")}
        >
          <div className="grid w-full max-w-sm gap-1.5">
            <Label htmlFor="campus">{t("saved.distanceFrom")}</Label>
            <CampusCombobox
              id="campus"
              name="campus"
              campuses={campuses}
              defaultValue={campus.slug}
              className="bg-background/60 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 h-9 rounded-lg border px-2.5 focus-within:ring-3"
            />
          </div>
          <Button type="submit" variant="outline" className="h-9">
            {t("saved.showDistances")}
          </Button>
        </form>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <li key={room.id}>
            <RoomCard
              room={campus ? { ...room, distanceKm: haversineKm(campus, room) } : room}
              campusName={campus?.shortName}
              query={campus ? searchQuery({ campus: campus.slug }) : ""}
              footer={
                <ActionButton
                  variant="ghost"
                  size="sm"
                  action={toggleFavourite.bind(null, room.id, false)}
                >
                  {t("saved.remove")}
                </ActionButton>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
