import type { Metadata } from "next";
import { LegalPage } from "@/components/app-shell/legal-page";
import { languageAlternates } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t("legal.privacy.title"),
    description: t("legal.privacy.intro"),
    alternates: languageAlternates(locale, "/privacy"),
  };
}

export default function Page() {
  return <LegalPage page="privacy" />;
}
