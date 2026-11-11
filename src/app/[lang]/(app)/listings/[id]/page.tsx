import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingForm } from "@/components/listings/listing-form";
import { PhotoManager } from "@/components/listings/photo-manager";
import { PageHeader } from "@/components/app-shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { idSchema } from "@/lib/validation";
import { getRoomForEdit } from "@/server/queries/rooms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("listingForm.editTitle") };
}

export default function EditListingPage({
  params,
  searchParams,
}: PageProps<"/[lang]/listings/[id]">) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Suspense fallback={<Skeleton className="h-[40rem]" />}>
        <EditListing params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EditListing({ params, searchParams }: PageProps<"/[lang]/listings/[id]">) {
  const landlord = await requireRole("LANDLORD");
  const { locale, t } = await getI18n();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const room = await getRoomForEdit(id, landlord.id);
  if (!room) notFound();
  const justCreated = (await searchParams).created === "1";

  return (
    <>
      <PageHeader
        title={t("listingForm.editTitle")}
        description={room.title}
        actions={
          <Link
            href={localePath(locale, `/rooms/${room.id}`)}
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink aria-hidden />
            {t("listingForm.viewListing")}
          </Link>
        }
      />
      <div className="grid gap-6">
        {/* Photos first right after posting: that's the next thing to do */}
        <Card className={justCreated ? "ring-primary ring-2" : undefined} id="photos">
          <CardHeader>
            <CardTitle>{t("listingForm.sections.photos")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoManager roomId={room.id} photoIds={room.photos.map((photo) => photo.id)} />
          </CardContent>
        </Card>
        <ListingForm room={room} mapCenter={{ lat: room.lat, lng: room.lng }} />
      </div>
    </>
  );
}
