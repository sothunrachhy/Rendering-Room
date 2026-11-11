import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("forgot.metaTitle") };
}

export default async function ForgotPasswordPage() {
  const { locale, t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          <h1>{t("forgot.title")}</h1>
        </CardTitle>
        <CardDescription>{t("forgot.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ForgotPasswordForm />
        <Link
          href={localePath(locale, "/login")}
          className="text-muted-foreground text-center text-sm underline-offset-4 hover:underline"
        >
          {t("forgot.backToLogin")}
        </Link>
      </CardContent>
    </Card>
  );
}
