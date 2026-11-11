import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingForm } from "@/components/listings/listing-form";
import { PageHeader } from "@/components/app-shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { getCampuses } from "@/server/queries/rooms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("listingForm.newTitle") };
}

export default async function NewListingPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={t("listingForm.newTitle")} description={t("listingForm.newDescription")} />
      <Suspense fallback={<Skeleton className="h-[40rem]" />}>
        <NewListing />
      </Suspense>
      <p className="text-muted-foreground mt-4 text-sm">{t("listingForm.photosAfterSave")}</p>
    </div>
  );
}

async function NewListing() {
  await requireRole("LANDLORD");
  const campuses = await getCampuses();
  // Start the map at the pilot campus, where most rooms will be
  const center = campuses.find((c) => c.slug === "rupp") ??
    campuses[0] ?? { lat: 11.5689, lng: 104.8906 };
  return <ListingForm mapCenter={{ lat: center.lat, lng: center.lng }} />;
}
