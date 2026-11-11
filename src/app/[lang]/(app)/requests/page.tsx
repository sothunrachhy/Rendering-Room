import { CalendarClock, MessageSquare, Phone, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmActionButton } from "@/components/forms/confirm-action-button";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { AnswerRequestForm } from "@/components/requests/answer-request-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RequestStatus } from "@/db/schema";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { requireRole } from "@/server/auth";
import { formatDateTime } from "@/lib/time";
import { cancelRequest } from "@/server/actions/student";
import { getLandlordRequests, getStudentRequests } from "@/server/queries/requests";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("requests.title") };
}

export default function RequestsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Suspense fallback={<RequestsSkeleton />}>
        <Requests />
      </Suspense>
    </div>
  );
}

async function Requests() {
  const user = await requireRole("STUDENT", "LANDLORD");
  const { t } = await getI18n();
  const isStudent = user.role === "STUDENT";

  return (
    <>
      <PageHeader
        title={t("requests.title")}
        description={
          isStudent ? t("requests.studentDescription") : t("requests.landlordDescription")
        }
      />
      {isStudent ? <StudentRequests userId={user.id} /> : <LandlordRequests userId={user.id} />}
    </>
  );
}

const STATUS_VARIANT: Record<RequestStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  ACCEPTED: "default",
  DECLINED: "destructive",
  CANCELLED: "secondary",
};

async function StudentRequests({ userId }: { userId: string }) {
  const { locale, t } = await getI18n();
  const requests = await getStudentRequests(userId);

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={t("requests.emptyTitle")}
        description={t("requests.emptyStudent")}
        action={
          <Link href={localePath(locale, "/rooms")} className={buttonVariants()}>
            <Search aria-hidden />
            {t("requests.findRoom")}
          </Link>
        }
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {requests.map((request) => (
        <li key={request.id}>
          <Card size="sm">
            <CardContent className="grid gap-2 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={localePath(locale, `/rooms/${request.roomId}`)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {request.roomTitle}
                </Link>
                <Badge variant={STATUS_VARIANT[request.status]}>
                  {t(`requests.status.${request.status}`)}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="size-4" aria-hidden />
                {formatDateTime(request.preferredAt, locale)} · {request.landlordName}
              </p>
              {request.landlordReply && (
                <p className="bg-muted rounded-lg px-3 py-2">
                  <span className="text-muted-foreground block text-xs">
                    {t("requests.landlordReply")}
                  </span>
                  {request.landlordReply}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {request.landlordPhone && (
                  <a
                    href={`tel:${request.landlordPhone}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    <Phone aria-hidden />
                    {t("requests.call", { phone: request.landlordPhone })}
                  </a>
                )}
                {(request.status === "PENDING" || request.status === "ACCEPTED") && (
                  <ConfirmActionButton
                    variant="ghost"
                    size="sm"
                    action={cancelRequest.bind(null, request.id)}
                    title={t("requests.cancelTitle")}
                    description={t("requests.cancelDescription")}
                    confirmLabel={t("requests.cancel")}
                    cancelLabel={t("requests.keep")}
                  >
                    {t("requests.cancel")}
                  </ConfirmActionButton>
                )}
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

async function LandlordRequests({ userId }: { userId: string }) {
  const { locale, t } = await getI18n();
  const requests = await getLandlordRequests(userId);

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={t("requests.emptyTitle")}
        description={t("requests.emptyLandlord")}
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {requests.map((request) => (
        <li key={request.id}>
          <Card size="sm">
            <CardContent className="grid gap-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="grid gap-0.5">
                  <span className="font-medium">{request.studentName}</span>
                  <Link
                    href={localePath(locale, `/rooms/${request.roomId}`)}
                    className="text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {request.roomTitle}
                  </Link>
                </div>
                <Badge variant={STATUS_VARIANT[request.status]}>
                  {t(`requests.status.${request.status}`)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-4" aria-hidden />
                  {formatDateTime(request.preferredAt, locale)}
                </span>
                {request.studentPhone && (
                  <a href={`tel:${request.studentPhone}`} className="flex items-center gap-1.5">
                    <Phone className="size-4" aria-hidden />
                    {request.studentPhone}
                  </a>
                )}
              </div>
              {request.message && (
                <p className="bg-muted flex gap-2 rounded-lg px-3 py-2">
                  <MessageSquare className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {request.message}
                </p>
              )}
              {request.status === "PENDING" ? (
                <AnswerRequestForm requestId={request.id} />
              ) : (
                request.landlordReply && (
                  <p className="text-muted-foreground">
                    {t("requests.reply")}: {request.landlordReply}
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function RequestsSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-12 w-72" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}
