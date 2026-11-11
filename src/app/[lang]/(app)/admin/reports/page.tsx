import { Flag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionButton } from "@/components/forms/action-button";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { formatDate } from "@/lib/time";
import { closeReport, setRoomHidden } from "@/server/actions/admin";
import { getOpenReports } from "@/server/queries/admin";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.reportsTitle") };
}

export default async function AdminReportsPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t("admin.reportsTitle")} description={t("admin.reportsDescription")} />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Reports />
      </Suspense>
    </>
  );
}

async function Reports() {
  await requireRole("ADMIN");
  const { locale, t } = await getI18n();
  const reports = await getOpenReports();

  if (reports.length === 0) return <EmptyState icon={Flag} title={t("admin.reportsEmpty")} />;

  return (
    <ul className="grid max-w-3xl gap-3">
      {reports.map((report) => (
        <li key={report.id}>
          <Card size="sm">
            <CardContent className="grid gap-2 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={localePath(locale, `/rooms/${report.roomId}`)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {report.roomTitle}
                </Link>
                <div className="flex gap-1">
                  <Badge variant="destructive">{t(`report.reasons.${report.reason}`)}</Badge>
                  {report.roomHidden && <Badge variant="secondary">{t("room.hidden")}</Badge>}
                </div>
              </div>
              {report.details && <p className="bg-muted rounded-lg px-3 py-2">{report.details}</p>}
              <p className="text-muted-foreground text-xs">
                {t("admin.reportedBy", {
                  name: report.reporterName,
                  date: formatDate(report.createdAt, locale),
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {!report.roomHidden && (
                  <ActionButton
                    variant="destructive"
                    size="sm"
                    action={setRoomHidden.bind(null, report.roomId, true)}
                  >
                    {t("admin.hideRoom")}
                  </ActionButton>
                )}
                <ActionButton size="sm" action={closeReport.bind(null, report.id, "RESOLVED")}>
                  {t("admin.resolve")}
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  action={closeReport.bind(null, report.id, "DISMISSED")}
                >
                  {t("admin.dismiss")}
                </ActionButton>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
