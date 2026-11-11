import { Mail, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionButton } from "@/components/forms/action-button";
import { RejectLandlordDialog } from "@/components/admin/reject-landlord-dialog";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { formatDate } from "@/lib/time";
import { approveLandlord } from "@/server/actions/admin";
import { getPendingLandlords } from "@/server/queries/admin";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.landlordsTitle") };
}

export default async function AdminLandlordsPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t("admin.landlordsTitle")} description={t("admin.landlordsDescription")} />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PendingLandlords />
      </Suspense>
    </>
  );
}

async function PendingLandlords() {
  await requireRole("ADMIN");
  const { locale, t } = await getI18n();
  const landlords = await getPendingLandlords();

  if (landlords.length === 0) {
    return <EmptyState icon={ShieldCheck} title={t("admin.pendingEmpty")} />;
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {landlords.map((landlord) => {
        const idUrl = `/api/admin/id-documents/${landlord.id}`;
        return (
          <li key={landlord.id}>
            <Card>
              <CardContent className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                <a href={idUrl} target="_blank" rel="noreferrer" title={t("admin.viewId")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- private, admin-only image */}
                  <img
                    src={idUrl}
                    alt={t("admin.viewId")}
                    className="bg-muted aspect-[3/2] w-full rounded-lg border object-cover"
                  />
                </a>
                <div className="grid content-start gap-2 text-sm">
                  <p className="text-base font-semibold">{landlord.name}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="size-4" aria-hidden />
                    {landlord.email}
                  </p>
                  {landlord.phone && (
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="size-4" aria-hidden />
                      {landlord.phone}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {t("admin.registered", { date: formatDate(landlord.createdAt, locale) })} ·{" "}
                    {t("admin.roomCount", { count: landlord.roomCount })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ActionButton action={approveLandlord.bind(null, landlord.id)}>
                      {t("admin.approve")}
                    </ActionButton>
                    <RejectLandlordDialog userId={landlord.id} name={landlord.name} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
