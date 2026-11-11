import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionButton } from "@/components/forms/action-button";
import { PageHeader } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { formatPrice } from "@/lib/money";
import { setRoomHidden } from "@/server/actions/admin";
import { getAllListings } from "@/server/queries/admin";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.listingsTitle") };
}

export default async function AdminListingsPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t("admin.listingsTitle")} description={t("admin.listingsDescription")} />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Listings />
      </Suspense>
    </>
  );
}

async function Listings() {
  await requireRole("ADMIN");
  const { locale, t } = await getI18n();
  const listings = await getAllListings();

  return (
    <div className="glass overflow-x-auto rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("listingForm.title")}</TableHead>
            <TableHead>{t("room.landlord")}</TableHead>
            <TableHead className="text-right">{t("costs.rent")}</TableHead>
            <TableHead />
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing.id}>
              <TableCell className="max-w-72">
                <Link
                  href={localePath(locale, `/rooms/${listing.id}`)}
                  className="block truncate font-medium underline-offset-4 hover:underline"
                >
                  {listing.title}
                </Link>
                <span className="text-muted-foreground text-xs">{listing.district}</span>
              </TableCell>
              <TableCell>
                {listing.landlordName}
                <span className="text-muted-foreground block text-xs">
                  {t(`verification.status.${listing.landlordVerification}`)}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(listing.rentCents, locale)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={listing.status === "AVAILABLE" ? "outline" : "secondary"}>
                    {listing.status === "AVAILABLE" ? t("room.available") : t("room.rented")}
                  </Badge>
                  {listing.hidden && <Badge variant="destructive">{t("room.hidden")}</Badge>}
                  {listing.openReports > 0 && (
                    <Badge variant="destructive">
                      {t("admin.reportCount", { count: listing.openReports })}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <ActionButton
                  variant={listing.hidden ? "outline" : "ghost"}
                  size="sm"
                  action={setRoomHidden.bind(null, listing.id, !listing.hidden)}
                >
                  {listing.hidden ? t("admin.unhide") : t("admin.hide")}
                </ActionButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
