import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.registerTitle") };
}

export default async function RegisterPage({ searchParams }: PageProps<"/[lang]/register">) {
  const { locale, t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          <h1>{t("auth.createAccount")}</h1>
        </CardTitle>
        <CardDescription>{t("auth.registerDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* ?role=LANDLORD (from "Post a room") is request data: stream it in */}
        <Suspense fallback={<Skeleton className="h-96" />}>
          <RegisterFormWithRole searchParams={searchParams} />
        </Suspense>
        <p className="text-muted-foreground text-center text-sm">
          {t("auth.haveAccount")}{" "}
          <Link
            href={localePath(locale, "/login")}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {t("auth.logInLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

async function RegisterFormWithRole({
  searchParams,
}: Pick<PageProps<"/[lang]/register">, "searchParams">) {
  const { role } = await searchParams;
  return <RegisterForm defaultRole={role === "LANDLORD" ? "LANDLORD" : "STUDENT"} />;
}
