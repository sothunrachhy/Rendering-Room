import Link from "next/link";
import { Logo } from "@/components/app-shell/logo";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

/**
 * Links every page needs: what RoomFinder is, how it treats personal data (it keeps
 * phone numbers and ID photos), its rules, and how to reach a person.
 * `compact`: just the links, for the signed-in app and the login pages.
 */
export async function SiteFooter({ compact = false }: { compact?: boolean }) {
  const { locale, t } = await getI18n();
  const contact = process.env.CONTACT_EMAIL;

  const links = (
    <nav aria-label={t("footer.label")} className="flex flex-wrap gap-x-5 gap-y-2">
      <Link href={localePath(locale, "/about")} className="hover:text-foreground">
        {t("footer.about")}
      </Link>
      <Link href={localePath(locale, "/privacy")} className="hover:text-foreground">
        {t("footer.privacy")}
      </Link>
      <Link href={localePath(locale, "/terms")} className="hover:text-foreground">
        {t("footer.terms")}
      </Link>
      {contact && (
        <a href={`mailto:${contact}`} className="hover:text-foreground">
          {t("footer.contact")}
        </a>
      )}
    </nav>
  );

  if (compact) {
    return <footer className="text-muted-foreground px-4 py-6 text-xs md:px-8">{links}</footer>;
  }

  return (
    <footer className={cn("border-foreground/5 bg-background/60 border-t backdrop-blur-md")}>
      <div className="text-muted-foreground mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 text-sm sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="grid gap-2">
          <Logo href={localePath(locale, "/")} className="text-foreground" />
          <p className="max-w-md text-xs">{t("footer.tagline")}</p>
        </div>
        {links}
      </div>
    </footer>
  );
}
