import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.loginTitle") };
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  const { locale, t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          <h1>{t("auth.welcomeBack")}</h1>
        </CardTitle>
        <CardDescription>{t("auth.loginDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* searchParams is request data, so the form streams in behind a boundary */}
        <Suspense fallback={<FormSkeleton />}>
          <LoginFormWithRedirect searchParams={searchParams} />
        </Suspense>
        <p className="text-muted-foreground text-center text-sm">
          {t("auth.noAccount")}{" "}
          <Link
            href={localePath(locale, "/register")}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {t("auth.signUpLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

async function LoginFormWithRedirect({
  searchParams,
}: Pick<PageProps<"/[lang]/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}

function FormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
      <Skeleton className="h-9" />
    </div>
  );
}
