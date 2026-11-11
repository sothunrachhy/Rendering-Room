import {
  CalendarClock,
  CircleCheck,
  Flag,
  GraduationCap,
  House,
  KeyRound,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatTile } from "@/components/admin/stat-tile";
import { PageHeader } from "@/components/app-shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { getAdminStats } from "@/server/queries/admin";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.title") };
}

export default async function AdminPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t("admin.title")} description={t("admin.description")} />
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        }
      >
        <Stats />
      </Suspense>
    </>
  );
}

async function Stats() {
  await requireRole("ADMIN");
  const { locale, t } = await getI18n();
  const stats = await getAdminStats();
  const icon = (Icon: typeof Users) => <Icon className="size-4" aria-hidden />;
  const review = (path: string) => (
    <Link
      href={localePath(locale, path)}
      className={buttonVariants({ variant: "link", size: "xs", className: "px-0" })}
    >
      {t("admin.review")}
    </Link>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label={t("admin.stats.pendingLandlords")}
        value={String(stats.pendingLandlords)}
        icon={icon(ShieldCheck)}
        tone={stats.pendingLandlords > 0 ? "negative" : "neutral"}
        footnote={stats.pendingLandlords > 0 ? review("/admin/landlords") : undefined}
      />
      <StatTile
        label={t("admin.stats.openReports")}
        value={String(stats.openReports)}
        icon={icon(Flag)}
        tone={stats.openReports > 0 ? "negative" : "neutral"}
        footnote={stats.openReports > 0 ? review("/admin/reports") : undefined}
      />
      <StatTile
        label={t("admin.stats.availableRooms")}
        value={String(stats.availableRooms)}
        icon={icon(House)}
      />
      <StatTile
        label={t("admin.stats.rentedRooms")}
        value={String(stats.rentedRooms)}
        icon={icon(KeyRound)}
      />
      <StatTile
        label={t("admin.stats.students")}
        value={String(stats.students)}
        icon={icon(GraduationCap)}
      />
      <StatTile
        label={t("admin.stats.landlords")}
        value={String(stats.landlords)}
        icon={icon(Users)}
      />
      <StatTile
        label={t("admin.stats.requestsThisWeek")}
        value={String(stats.requestsThisWeek)}
        icon={icon(CalendarClock)}
      />
      <StatTile
        label={t("admin.stats.acceptanceRate")}
        value={stats.acceptanceRate === null ? "–" : `${Math.round(stats.acceptanceRate * 100)}%`}
        icon={icon(CircleCheck)}
      />
    </div>
  );
}
