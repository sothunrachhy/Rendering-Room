import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("verifyEmail.confirmedTitle") };
}

// Where the email link lands (see app/api/verify-email). ?status=invalid when the
// link was wrong, used or expired.
export default function EmailConfirmedPage({ searchParams }: PageProps<"/[lang]/email-confirmed">) {
  return (
    <Suspense fallback={<Skeleton className="h-48" />}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}

async function Result({
  searchParams,
}: Pick<PageProps<"/[lang]/email-confirmed">, "searchParams">) {
  const { locale, t } = await getI18n();
  const invalid = (await searchParams).status === "invalid";
  const Icon = invalid ? CircleX : CircleCheck;

  return (
    <Card>
      <CardHeader>
        <Icon className={invalid ? "text-destructive size-8" : "text-primary size-8"} aria-hidden />
        <CardTitle className="text-2xl font-bold tracking-tight">
          <h1>{invalid ? t("verifyEmail.invalidTitle") : t("verifyEmail.confirmedTitle")}</h1>
        </CardTitle>
        <CardDescription>
          {invalid ? t("verifyEmail.invalidText") : t("verifyEmail.confirmedText")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={localePath(locale, invalid ? "/settings" : "/rooms")}
          className={buttonVariants({ className: "w-full" })}
        >
          {invalid ? t("verifyEmail.goToSettings") : t("verifyEmail.findRoom")}
        </Link>
      </CardContent>
    </Card>
  );
}
