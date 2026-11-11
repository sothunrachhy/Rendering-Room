import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormMessage } from "@/components/forms/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("reset.metaTitle") };
}

// Reached from the link in the reset email: /reset-password?token=...
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/[lang]/reset-password">) {
  const { t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          <h1>{t("reset.title")}</h1>
        </CardTitle>
        <CardDescription>{t("reset.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* searchParams is request data, so the form streams in behind a boundary */}
        <Suspense fallback={<Skeleton className="h-48" />}>
          <ResetForm searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function ResetForm({
  searchParams,
}: Pick<PageProps<"/[lang]/reset-password">, "searchParams">) {
  const { locale, t } = await getI18n();
  const { token } = await searchParams;

  if (typeof token !== "string" || !token) {
    return (
      <div className="grid gap-4">
        <FormMessage message={t("reset.invalid")} />
        <Link
          href={localePath(locale, "/forgot-password")}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          {t("reset.requestNew")}
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}
