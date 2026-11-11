import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { TelegramCard } from "@/components/settings/telegram-card";
import { VerificationCard } from "@/components/settings/verification-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { users } from "@/db/schema";
import { getI18n } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/db";
import { telegramConfigured } from "@/server/telegram";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("settings.title") };
}

export default async function SettingsPage() {
  const { t } = await getI18n();

  // Centered column, so wide screens don't leave a big empty area on the right
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const user = await getCurrentUser();
  const { t } = await getI18n();
  const extra = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { telegramChatId: true, verificationNote: true },
  });

  return (
    <div className="grid gap-6">
      {user.role === "LANDLORD" && (
        <Card id="verification" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>{t("verification.title")}</CardTitle>
            <CardDescription>{t("verification.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <VerificationCard status={user.verification} note={extra?.verificationNote ?? null} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
          <CardDescription>{t("settings.signedInAs", { email: user.email })}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} phone={user.phone} role={user.role} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("telegram.title")}</CardTitle>
          <CardDescription>{t("telegram.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <TelegramCard
            connected={Boolean(extra?.telegramChatId)}
            configured={telegramConfigured()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.password")}</CardTitle>
          <CardDescription>{t("settings.passwordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {user.role !== "ADMIN" && (
        <Card className="ring-destructive/30">
          <CardHeader>
            <CardTitle>{t("settings.deleteAccount")}</CardTitle>
            <CardDescription>{t("settings.deleteAccountDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
