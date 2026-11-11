import { Search } from "lucide-react";
import Link from "next/link";
import { MarketingBackground } from "@/components/landing/marketing-background";
import { SiteFooter } from "@/components/app-shell/site-footer";
import { SiteHeader } from "@/components/app-shell/site-header";
import { buttonVariants } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

// The whole site's header and footer, so a wrong link isn't a dead end (QA U-09):
// search, language and account are one click away.
export default async function NotFound() {
  const { locale, t } = await getI18n();

  return (
    <div className="marketing-backdrop flex min-h-svh flex-col">
      <MarketingBackground />
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm font-medium">404</p>
          <h1 className="text-3xl font-bold tracking-tight">{t("notFound.title")}</h1>
          <p className="text-muted-foreground">{t("notFound.description")}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={localePath(locale, "/rooms")} className={buttonVariants()}>
            <Search aria-hidden />
            {t("nav.search")}
          </Link>
          <Link href={localePath(locale, "/")} className={buttonVariants({ variant: "outline" })}>
            {t("notFound.goHome")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
