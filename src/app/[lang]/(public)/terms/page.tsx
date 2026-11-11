import type { Metadata } from "next";
import { LegalPage } from "@/components/app-shell/legal-page";
import { languageAlternates } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t("legal.terms.title"),
    description: t("legal.terms.intro"),
    alternates: languageAlternates(locale, "/terms"),
  };
}

export default function Page() {
  return <LegalPage page="terms" />;
}
